/**
 * Supabase client para el frontend de RapiPizza.
 * Usa las credenciales del proyecto conectado en Figma Make.
 */
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

const supabaseUrl = `https://${projectId}.supabase.co`;

export const supabase = createClient(supabaseUrl, publicAnonKey);

/** Tipos de la base de datos */
export interface DbProfile {
  id: string;
  name: string | null;
  phone: string | null;
  address: string | null;
  updated_at: string;
}

export interface DbOrder {
  id: string;
  user_id: string;
  status: 'pending' | 'preparing' | 'sent' | 'delivered' | 'cancelled';
  total: number;
  delivery_fee: number;
  district: string | null;
  delivery_type: 'delivery' | 'pickup';
  payment_method: 'card' | 'cash';
  address: string | null;
  coupon_code: string | null;
  discount: number;
  created_at: string;
}

export interface DbOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_image: string;
  price: number;
  quantity: number;
}
