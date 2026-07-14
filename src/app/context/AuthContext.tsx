/**
 * AuthContext: Autenticación y estado del usuario para RapiPizza.
 *
 * Estrategia de datos:
 *  - Auth state       : Supabase Auth (JWT sessions)
 *  - Profile data     : Tabla de perfiles de Supabase (actualizada al iniciar sesión o registrarse)
 *  - Order history    : Tablas de Subabase `pedidos` + `artículos_de_pedido`
 *
 * El carrito permanece en el almacenamiento local (práctica habitual; se convierte en un pedido al finalizar la compra).
 *
 * Estrategia de registro (orden de prioridad):
 *  1. Función Edge admin.createUser: correo electrónico confirmado automáticamente, la mejor experiencia de usuario.
 *  2. supabase.auth.signUp: alternativa cuando la función edge no está disponible
 *     (Requiere que la opción "Confirmar correo electrónico" esté desactivada en el Panel de control de Supabase → Autenticación → Correo electrónico)
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../../../utils/supabase/client';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';
import { fetchProfile, upsertProfile, fetchUserOrders } from '../../../utils/supabase/db';
import type { Session } from '@supabase/supabase-js';

// URL de la función Edge 

/** URL base para la función Hono edge (utilizada únicamente para admin.createUser). */
const API = `https://${projectId}.supabase.co/functions/v1/make-server-8a4cb832`;

/** Tiempo de espera en ms antes de abortar una llamada al servidor. */
const SERVER_TIMEOUT_MS = 7000;

/**
 * Realiza una llamada fetch a la función edge con un token JWT y un tiempo de espera.
 * Si no se proporciona ningún token de acceso, se recurre a la clave pública anónima.
 *
 * @param path        - Ruta de acceso en la función de borde (por ejemplo, '/auth/register')
 * @param options     - Opciones estándar de RequestInit (method, body, etc.)
 * @param accessToken - Token de portador a utilizar; por defecto, publicAnonKey
 */
async function serverCall(
  path: string,
  options: RequestInit = {},
  accessToken?: string,
): Promise<Response> {
  const token = accessToken ?? publicAnonKey;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SERVER_TIMEOUT_MS);

  try {
    const res = await fetch(`${API}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers as Record<string, string> ?? {}),
      },
    });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ─── Public types ─────────────────────────────────────────────────────────────

/** Objeto de usuario simplificado expuesto al resto de la aplicación. */
export interface User {
  id:      string;
  name:    string;
  email:   string;
  phone:   string;
  address: string;
  role:    'customer' | 'admin' | 'delivery';
}

/** Un único artículo dentro de un pedido (utilizado en el historial de pedidos de MiCuenta). */
export interface OrderItem {
  name:           string;
  quantity:       number;
  price:          number;
  product_image?: string;
}

/** Un pedido completo con sus artículos anidados. */
export interface Order {
  id:              string;
  order_number:    number | null;
  /** Cadena de fecha ISO que indica cuándo se realizó el pedido */
  date:            string;
  total:           number;
  status:          'pending' | 'preparing' | 'sent' | 'delivered' | 'cancelled';
  items:           OrderItem[];
  district?:       string;
  delivery_type?:  string;
  delivery_fee?:   number;
  payment_method?: string;
  address?:        string;
  discount?:       number;
  coupon_code?:    string | null;
}

/** Forma del valor proporcionado por AuthContext. */
interface AuthContextType {
  user:          User | null;
  orders:        Order[];
  loading:       boolean;
  login:         (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register:      (name: string, email: string, password: string, phone: string) => Promise<{ ok: boolean; error?: string }>;
  logout:        () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshOrders: () => Promise<void>;
}

// Creación de contexto 

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Helper: construir usuario desde la sesión─────────────────────────────────────────

/**
 * Carga el perfil del usuario desde la tabla Supabase `profiles`.
 * Si la fila de la tabla aún no existe, recurre a `user_metadata` de Supabase Auth.
 * (p. ej., trigger no se ha ejecutado o se ha iniciado sesión antes de que se cree el perfil).
 *
 * @param session - Sesión activa de Supabase que contiene el JWT y los datos del usuario.
 * @returns       Objeto de usuario poblado
 */
async function buildUserFromSession(session: Session): Promise<User> {
  const meta = session.user.user_metadata ?? {};

  // Valores siempre disponibles desde los metadatos de Supabase Auth
  const base: User = {
    id:      session.user.id,
    name:    meta.name    ?? meta.full_name ?? 'Usuario',
    email:   session.user.email            ?? '',
    phone:   meta.phone   ?? meta.phone_number ?? '',
    address: meta.address ?? '',
    role:    'customer',
  };

  // Intenta cargar datos más completos desde la tabla de perfiles.
  try {
    const { data: profile, error } = await fetchProfile();
    if (!error && profile) {
      return {
        ...base,
        name:    profile.name    || base.name,
        phone:   profile.phone   || base.phone,
        address: profile.address || base.address,
        role:    profile.role    || 'customer',
      };
    }
  } catch {
    // Error de red o rechazo de RLS: recurrir a los valores de metadatos.
  }

  return base;
}

// Componente AuthProvider 

/**
 * Envuelve la aplicación y proporciona el estado de autenticación a todos los componentes secundarios.
 * Debe ubicarse en un lugar alto del árbol de componentes (por ejemplo, en main.tsx).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Gestión de sesiones 

  useEffect(() => {
    /**
     * Gestiona cualquier cambio de sesión  (login, logout, token refresh).
     * Reconstruye el objeto Usuario a partir de la tabla de perfiles en cada evento de sesión.
     */
    const handleSession = async (session: Session | null) => {
      if (!session) {
        setUser(null);
        setOrders([]);
        setLoading(false);
        return;
      }
      const u = await buildUserFromSession(session);
      setUser(u);
      setLoading(false);
    };

    // Cargar sesión inicial (page refresh / app load)
    supabase.auth.getSession().then(({ data: { session } }) => handleSession(session));

    // Suscríbase para recibir notificaciones sobre futuros cambios de estado de autenticación.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => handleSession(session),
    );

    return () => subscription.unsubscribe();
  }, []);

  // Actualizar los pedidos cada vez que el usuario que ha iniciado sesión cambie.
  useEffect(() => {
    if (user) refreshOrders();
    else setOrders([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Login

  /**
   * Inicia sesión con correo electrónico y contraseña a través de Supabase Auth.
   *
   * @param email    - Dirección de correo electrónico del usuario
   * @param password - Contraseña en texto plano
   * @retorna `{ ok: true }` sobre el éxito,`{ ok: false, error }` con un mensaje amistoso sobre el fracaso
   */
  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.includes('Invalid login') || error.message.includes('invalid_credentials')) {
        return { ok: false, error: 'Email o contrasena incorrectos. Verifica tus datos.' };
      }
      if (error.message.includes('Email not confirmed')) {
        return { ok: false, error: 'Debes confirmar tu email. Revisa tu bandeja de entrada.' };
      }
      return { ok: false, error: error.message };
    }
    return { ok: true };
  };

  // Registro
  /**
   * Registra un nuevo usuario.
   *
   * Estrategia 1: Función Edge `admin.createUser`: correo electrónico confirmado automáticamente.
   * Estrategia 2: `supabase.auth.signUp` — alternativa cuando la función de borde no está disponible.
   *
   * En caso de éxito, actualiza o inserta el perfil del usuario en la tabla `profiles`.
   *
   * @param name     - Nombre completo para mostrar
   * @param email    - Dirección de correo electrónico
   * @param password - Contraseña en texto plano
   * @param phone    - Número de teléfono
   */
  const register = async (name: string, email: string, password: string, phone: string) => {
    // Estrategia 1: Función Edge (preconfirma el correo electrónico) 
    try {
      const res = await serverCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, phone }),
      });

      if (res.ok) {
        const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
        if (!loginErr) {
          // Asegúrese de que exista la fila del perfil (el activador también se encarga de esto, pero es mejor prevenir que curar).
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            await upsertProfile(session.user.id, { name, email, phone, address: '' });
          }
          console.log('[auth] Registration successful via edge function');
          return { ok: true };
        }
        return { ok: false, error: 'Cuenta creada pero error al iniciar sesion. Intenta hacer login.' };
      }

      const json = await res.json().catch(() => ({ error: 'Error desconocido' }));
      const errMsg = (json.error ?? '').toLowerCase();
      if (errMsg.includes('already') || errMsg.includes('registered') || errMsg.includes('exist')) {
        // El email ya existe → intentar login directo con las credenciales proporcionadas
        const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
        if (!loginErr) {
          console.log('[auth] Email already registered — logged in successfully');
          return { ok: true };
        }
        return { ok: false, error: 'Este email ya tiene una cuenta. Por favor inicia sesion con tu contrasena.' };
      }
      // Error del servidor no crítico: se pasa a la estrategia 2.
      console.warn('[auth] Edge function register error:', json.error, '— trying direct signUp');
    } catch (err) {
      // Función Edge inaccesible (tiempo de espera agotado, no desplegada, etc.)
      console.warn('[auth] Edge function unavailable:', err instanceof Error ? err.message : err);
    }

    // Estrategia 2: supabase.auth.signUp 
    // Requiere que la opción "Confirmar correo electrónico" esté desactivada en el Panel de control de Supabase → Autenticación → Correo electrónico
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, phone, address: '' },
      },
    });

    if (error) {
      if (error.message.includes('already registered') || error.message.includes('already been registered')) {
        // Email ya existe → intentar login con las credenciales dadas
        const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
        if (!loginErr) {
          console.log('[auth] Email already registered — logged in via signUp fallback');
          return { ok: true };
        }
        return { ok: false, error: 'Este email ya tiene una cuenta. Por favor inicia sesion.' };
      }
      return { ok: false, error: `Error al crear cuenta: ${error.message}` };
    }

    if (!data.user) {
      return { ok: false, error: 'No se pudo crear la cuenta. Intenta de nuevo.' };
    }

    if (data.session) {
      // Sesión presente → la confirmación por correo electrónico está desactivada → éxito inmediato
      await upsertProfile(data.user.id, { name, email, phone, address: '' });
      console.log('[auth] Registration successful via direct signUp');
      return { ok: true };
    }

    // No hay sesión → la confirmación por correo electrónico está habilitada.
    return {
      ok: false,
      error:
        'Cuenta creada. Revisa tu email y confirma tu cuenta para poder iniciar sesion.\n\n' +
        'Tip: Ve a Supabase Dashboard -> Authentication -> Providers -> Email -> desactiva "Confirm email".',
    };
  };

  // Logout

  /**
   * Cierra la sesión del usuario actual y borra todo el estado local.
   */
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setOrders([]);
    // Redirigir al inicio después de cerrar sesión
    window.location.href = '/';
  };

  // Actualizar perfil 

  /**
   * Actualiza el perfil del usuario en la tabla `profiles` y los metadatos de Supabase Auth.
   * Aplica una actualización optimista al estado local de inmediato para una experiencia de usuario ágil.
   *
   * @param data - Campos parciales del usuario para actualizar (nombre, teléfono, dirección)
   */
  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;

    // Actualización optimista: los cambios se reflejan inmediatamente en la interfaz de usuario.
    setUser(u => u ? { ...u, ...data } : u);

    const payload = {
      name:    data.name    ?? user.name,
      phone:   data.phone   ?? user.phone,
      address: data.address ?? user.address,
    };

    // Actualizar los metadatos de usuario de Supabase Auth (siempre disponibles, sin RLS)
    const metaPromise = supabase.auth.updateUser({
      data: { name: payload.name, phone: payload.phone, address: payload.address },
    }).then(({ error }) => {
      if (error) console.error('[auth] updateUser metadata error:', error.message);
    });

    // Actualiza la tabla `profiles` a través del cliente JS de Supabase.
    const dbPromise = upsertProfile(user.id, {
      name:    payload.name,
      phone:   payload.phone,
      address: payload.address,
    }).then(({ error }) => {
      if (error) console.error('[auth] profiles upsert error:', error);
    });

    await Promise.allSettled([metaPromise, dbPromise]);
  };

  // Actualizar pedidos 

  /**
   * Carga los pedidos del usuario actual desde las tablas `orders` y `order_items`.
   * Asigna las filas de la base de datos a la interfaz de pedidos que espera el resto de la interfaz de usuario.
   */
  const refreshOrders = async () => {
    try {
      const { data: rows, error } = await fetchUserOrders();
      if (error) {
        console.error('[auth] fetchUserOrders error:', error);
        return;
      }

      const mapped: Order[] = (rows ?? []).map(o => ({
        id:             o.id,
        order_number:   o.order_number ?? null,
        date:           o.created_at,
        total:          o.total,
        status:         o.status,
        district:       o.district ?? undefined,
        delivery_type:  o.delivery_type,
        delivery_fee:   o.delivery_fee,
        payment_method: o.payment_method,
        address:        o.address ?? undefined,
        discount:       o.discount,
        coupon_code:    o.coupon_code,
        items: (o.order_items ?? []).map(item => ({
          name:          item.product_name,
          quantity:      item.quantity,
          price:         item.price,
          product_image: item.product_image ?? undefined,
        })),
      }));

      setOrders(mapped);
    } catch (err) {
      console.warn('[auth] refreshOrders exception:', err instanceof Error ? err.message : err);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, orders, loading, login, register, logout, updateProfile, refreshOrders }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Enlace para acceder al estado y las acciones de autenticación.
 * Debe llamarse dentro de un componente envuelto por `AuthProvider`.
 *
 * @throws Error si se llama fuera de AuthProvider.
 * @ejemplo
 * const { user, login, logout } = useAuth();
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
