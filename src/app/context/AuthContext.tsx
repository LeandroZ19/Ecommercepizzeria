/**
 * AuthContext — Autenticación y datos de usuario con Supabase + KV Store.
 *
 * Flujo completo:
 * - Registro → POST /auth/register (server con service role, email confirmado)
 * - Login    → supabase.auth.signInWithPassword (directo)
 * - Logout   → supabase.auth.signOut (directo)
 * - Perfil   → GET/PUT /profile (server → KV store)
 * - Pedidos  → GET /orders (server → KV store)
 *
 * La sesión persiste automáticamente via los tokens de Supabase.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../../../utils/supabase/client';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';
import type { Session } from '@supabase/supabase-js';

// ─── URL base del servidor ────────────────────────────────────────────────────

const API = `https://${projectId}.supabase.co/functions/v1/make-server-8a4cb832`;

/** Helper para llamadas autenticadas al servidor */
async function apiCall(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token ?? publicAnonKey}`,
    ...(options.headers as Record<string, string> ?? {}),
  };
  return fetch(`${API}${path}`, { ...options, headers });
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
}

export interface Order {
  id: string;
  date: string;
  total: number;
  status: 'pending' | 'preparing' | 'sent' | 'delivered' | 'cancelled';
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    product_name?: string;
    product_image?: string;
  }>;
  district?: string;
  delivery_type?: string;
  delivery_fee?: number;
}

interface AuthContextType {
  user: User | null;
  orders: Order[];
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshOrders: () => Promise<void>;
}

// ─── Contexto ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken]     = useState<string | undefined>();

  // ── Sesión inicial + suscripción a cambios de auth ───────────────────────

  useEffect(() => {
    const loadSession = async (session: Session | null) => {
      if (!session) {
        setUser(null);
        setOrders([]);
        setToken(undefined);
        setLoading(false);
        return;
      }

      const accessToken = session.access_token;
      setToken(accessToken);

      // Cargar perfil del servidor
      try {
        const res = await apiCall('/profile', {}, accessToken);
        if (res.ok) {
          const { profile } = await res.json();
          setUser({
            id:      session.user.id,
            name:    profile?.name    || session.user.user_metadata?.name || 'Usuario',
            email:   session.user.email ?? '',
            phone:   profile?.phone   || '',
            address: profile?.address || '',
          });
        } else {
          // Fallback si el servidor no responde
          setUser({
            id:    session.user.id,
            name:  session.user.user_metadata?.name || 'Usuario',
            email: session.user.email ?? '',
            phone: '',
          });
        }
      } catch {
        setUser({
          id:    session.user.id,
          name:  session.user.user_metadata?.name || 'Usuario',
          email: session.user.email ?? '',
          phone: '',
        });
      }

      setLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => loadSession(session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => loadSession(session),
    );
    return () => subscription.unsubscribe();
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────

  const login = async (email: string, password: string): Promise<boolean> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('Login error:', error.message);
      return false;
    }
    return true;
  };

  // ── Registro (pasa por el servidor para confirmar email automáticamente) ──

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const res = await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        console.error('Register error:', error);
        return false;
      }

      // Iniciar sesión automáticamente tras el registro
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      return !loginError;
    } catch (err) {
      console.error('Register exception:', err);
      return false;
    }
  };

  // ── Logout ────────────────────────────────────────────────────────────────

  const logout = async (): Promise<void> => {
    await supabase.auth.signOut();
    setUser(null);
    setOrders([]);
    setToken(undefined);
  };

  // ── Actualizar perfil ─────────────────────────────────────────────────────

  const updateProfile = async (data: Partial<User>): Promise<void> => {
    if (!user || !token) return;

    try {
      const merged = {
        name:    data.name    ?? user.name,
        phone:   data.phone   ?? user.phone,
        address: data.address ?? user.address ?? '',
      };

      const res = await apiCall('/profile', {
        method: 'PUT',
        body: JSON.stringify(merged),
      }, token);

      if (res.ok) {
        setUser(prev => prev ? { ...prev, ...data } : prev);
      }
    } catch (err) {
      console.error('UpdateProfile error:', err);
    }
  };

  // ── Cargar pedidos ────────────────────────────────────────────────────────

  const refreshOrders = async (): Promise<void> => {
    if (!token) return;

    try {
      const res = await apiCall('/orders', {}, token);
      if (!res.ok) return;

      const { orders: raw } = await res.json();
      const mapped: Order[] = (raw ?? []).map((o: any) => ({
        id:          o.id,
        date:        o.date,
        total:       o.total,
        status:      o.status,
        district:    o.district,
        delivery_type: o.delivery_type,
        delivery_fee:  o.delivery_fee,
        items: (o.items ?? []).map((item: any) => ({
          name:          item.product_name,
          quantity:      item.quantity,
          price:         item.price,
          product_image: item.product_image,
        })),
      }));

      setOrders(mapped);
    } catch (err) {
      console.error('RefreshOrders error:', err);
    }
  };

  // Cargar pedidos cuando el usuario se autentica
  useEffect(() => {
    if (user && token) refreshOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, token]);

  return (
    <AuthContext.Provider
      value={{ user, orders, loading, login, register, logout, updateProfile, refreshOrders }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
