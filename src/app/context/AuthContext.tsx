/**
 * AuthContext — Authentication and user state for RapiPizza.
 *
 * Data strategy:
 *  - Auth state       : Supabase Auth (JWT sessions)
 *  - Profile data     : `profiles` Supabase table (upserted on login/register)
 *  - Order history    : `orders` + `order_items` Supabase tables
 *
 * No KV store, no localStorage for user data.
 * Cart stays in localStorage (standard practice — becomes an order at checkout).
 *
 * Registration strategy (priority order):
 *  1. Edge function admin.createUser — email confirmed automatically, best UX
 *  2. supabase.auth.signUp — fallback when edge function is unavailable
 *     (requires "Confirm email" disabled in Supabase Dashboard → Auth → Email)
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../../../utils/supabase/client';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';
import { fetchProfile, upsertProfile, fetchUserOrders } from '../../../utils/supabase/db';
import type { Session } from '@supabase/supabase-js';

// ─── Edge function URL ────────────────────────────────────────────────────────

/** Base URL for the Hono edge function (used only for admin.createUser). */
const API = `https://${projectId}.supabase.co/functions/v1/make-server-8a4cb832`;

/** Timeout in ms before aborting a server call. */
const SERVER_TIMEOUT_MS = 7000;

/**
 * Makes a fetch call to the edge function with a JWT token and timeout.
 * Falls back to the public anon key if no access token is provided.
 *
 * @param path        - Route path on the edge function (e.g. '/auth/register')
 * @param options     - Standard RequestInit options (method, body, etc.)
 * @param accessToken - Bearer token to use; defaults to publicAnonKey
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

/** Simplified user object exposed to the rest of the app. */
export interface User {
  id:      string;
  name:    string;
  email:   string;
  phone:   string;
  address: string;
}

/** A single line item within an order (used in the MiCuenta order history). */
export interface OrderItem {
  name:           string;
  quantity:       number;
  price:          number;
  product_image?: string;
}

/** A full order with its nested items. */
export interface Order {
  id:              string;
  /** ISO date string of when the order was placed */
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

/** Shape of the value provided by AuthContext. */
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

// ─── Context creation ─────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Helper: build User from session ─────────────────────────────────────────

/**
 * Loads the user's profile from the `profiles` Supabase table.
 * Falls back to Supabase Auth `user_metadata` if the table row does not exist yet
 * (e.g. trigger hasn't run, or first login before profile is created).
 *
 * @param session - Active Supabase session containing the JWT and user data
 * @returns       Populated User object
 */
async function buildUserFromSession(session: Session): Promise<User> {
  const meta = session.user.user_metadata ?? {};

  // Values always available from Supabase Auth metadata
  const base: User = {
    id:      session.user.id,
    name:    meta.name    ?? meta.full_name ?? 'Usuario',
    email:   session.user.email            ?? '',
    phone:   meta.phone   ?? meta.phone_number ?? '',
    address: meta.address ?? '',
  };

  // Try to load richer data from the profiles table
  try {
    const { data: profile, error } = await fetchProfile();
    if (!error && profile) {
      return {
        ...base,
        name:    profile.name    || base.name,
        phone:   profile.phone   || base.phone,
        address: profile.address || base.address,
      };
    }
  } catch {
    // Network error or RLS rejection — fall back to metadata values
  }

  return base;
}

// ─── AuthProvider component ───────────────────────────────────────────────────

/**
 * Wraps the application and provides auth state to all child components.
 * Must be placed high in the component tree (e.g. in main.tsx).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Session management ──────────────────────────────────────────────────────

  useEffect(() => {
    /**
     * Handles any session change (login, logout, token refresh).
     * Rebuilds the User object from the profiles table on each session event.
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

    // Load initial session (page refresh / app load)
    supabase.auth.getSession().then(({ data: { session } }) => handleSession(session));

    // Subscribe to future auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => handleSession(session),
    );

    return () => subscription.unsubscribe();
  }, []);

  // Refresh orders whenever the logged-in user changes
  useEffect(() => {
    if (user) refreshOrders();
    else setOrders([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // ── Login ───────────────────────────────────────────────────────────────────

  /**
   * Signs in with email and password via Supabase Auth.
   *
   * @param email    - User's email address
   * @param password - Plain-text password
   * @returns `{ ok: true }` on success, `{ ok: false, error }` with friendly message on failure
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

  // ── Register ────────────────────────────────────────────────────────────────

  /**
   * Registers a new user.
   *
   * Strategy 1: Edge function `admin.createUser` — email confirmed automatically.
   * Strategy 2: `supabase.auth.signUp` — fallback when the edge function is unreachable.
   *
   * On success, upserts the user's profile into the `profiles` table.
   *
   * @param name     - Full display name
   * @param email    - Email address
   * @param password - Plain-text password
   * @param phone    - Phone number
   */
  const register = async (name: string, email: string, password: string, phone: string) => {
    // ── Strategy 1: Edge function (pre-confirms email) ──────────────────────
    try {
      const res = await serverCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, phone }),
      });

      if (res.ok) {
        const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
        if (!loginErr) {
          // Ensure the profile row exists (the trigger handles this too, but belt-and-suspenders)
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
        return { ok: false, error: 'Este email ya tiene una cuenta. Por favor inicia sesion.' };
      }
      // Non-fatal server error — fall through to strategy 2
      console.warn('[auth] Edge function register error:', json.error, '— trying direct signUp');
    } catch (err) {
      // Edge function unreachable (timeout, not deployed, etc.)
      console.warn('[auth] Edge function unavailable:', err instanceof Error ? err.message : err);
    }

    // ── Strategy 2: supabase.auth.signUp ────────────────────────────────────
    // Requires "Confirm email" disabled in Supabase Dashboard → Auth → Email
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, phone, address: '' },
      },
    });

    if (error) {
      if (error.message.includes('already registered') || error.message.includes('already been registered')) {
        return { ok: false, error: 'Este email ya tiene una cuenta. Por favor inicia sesion.' };
      }
      return { ok: false, error: `Error al crear cuenta: ${error.message}` };
    }

    if (!data.user) {
      return { ok: false, error: 'No se pudo crear la cuenta. Intenta de nuevo.' };
    }

    if (data.session) {
      // Session present → email confirmation is disabled → immediate success
      await upsertProfile(data.user.id, { name, email, phone, address: '' });
      console.log('[auth] Registration successful via direct signUp');
      return { ok: true };
    }

    // No session → email confirmation is enabled
    return {
      ok: false,
      error:
        'Cuenta creada. Revisa tu email y confirma tu cuenta para poder iniciar sesion.\n\n' +
        'Tip: Ve a Supabase Dashboard -> Authentication -> Providers -> Email -> desactiva "Confirm email".',
    };
  };

  // ── Logout ──────────────────────────────────────────────────────────────────

  /**
   * Signs out the current user and clears all local state.
   */
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setOrders([]);
  };

  // ── Update profile ──────────────────────────────────────────────────────────

  /**
   * Updates the user's profile in the `profiles` table and Supabase Auth metadata.
   * Applies an optimistic update to local state immediately for a snappy UX.
   *
   * @param data - Partial User fields to update (name, phone, address)
   */
  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;

    // Optimistic update — reflect changes immediately in the UI
    setUser(u => u ? { ...u, ...data } : u);

    const payload = {
      name:    data.name    ?? user.name,
      phone:   data.phone   ?? user.phone,
      address: data.address ?? user.address,
    };

    // Update Supabase Auth user_metadata (always available, no RLS)
    const metaPromise = supabase.auth.updateUser({
      data: { name: payload.name, phone: payload.phone, address: payload.address },
    }).then(({ error }) => {
      if (error) console.error('[auth] updateUser metadata error:', error.message);
    });

    // Update the `profiles` table via the Supabase JS client
    const dbPromise = upsertProfile(user.id, {
      name:    payload.name,
      phone:   payload.phone,
      address: payload.address,
    }).then(({ error }) => {
      if (error) console.error('[auth] profiles upsert error:', error);
    });

    await Promise.allSettled([metaPromise, dbPromise]);
  };

  // ── Refresh orders ──────────────────────────────────────────────────────────

  /**
   * Loads the current user's orders from the `orders` and `order_items` tables.
   * Maps the DB rows into the Order interface expected by the rest of the UI.
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
 * Hook to access authentication state and actions.
 * Must be called within a component wrapped by `AuthProvider`.
 *
 * @throws Error if called outside of AuthProvider
 * @example
 * const { user, login, logout } = useAuth();
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
