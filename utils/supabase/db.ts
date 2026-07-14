/**
 * db.ts — Operaciones de base de datos Supabase para RapiPizza.
 *
 * Todas las operaciones usan el cliente Supabase JS directamente contra
 * tablas Postgres con Row Level Security (RLS) habilitado.
 *
 * Tablas:
 *  - profiles        : perfil de usuario (role: customer | admin | delivery)
 *  - orders          : pedidos con order_number secuencial (Cola Virtual)
 *  - order_items     : artículos de cada pedido
 *  - custom_pizzas   : pizzas personalizadas con ingredientes
 *  - products        : catálogo público con stock
 *  - pizza_ingredients / pizza_sizes : builder de pizza personalizada
 *  - districts       : zonas de delivery con tarifas y ETAs
 *  - promotions      : promociones activas
 */

import { supabase } from './client';

// ─── Tipos de perfil ──────────────────────────────────────────────────────────

export interface ProfileRow {
  id:         string;
  name:       string | null;
  email:      string | null;
  phone:      string | null;
  address:    string | null;
  role:       'customer' | 'admin' | 'delivery';
  created_at: string;
  updated_at: string;
}

// ─── Tipos de pedido ──────────────────────────────────────────────────────────

export interface OrderRow {
  id:             string;
  user_id:        string;
  order_number:   number | null;
  status:         'pending' | 'preparing' | 'sent' | 'delivered' | 'cancelled';
  total:          number;
  subtotal:       number;
  discount:       number;
  delivery_fee:   number;
  district:       string | null;
  delivery_type:  'delivery' | 'pickup';
  payment_method: 'card' | 'cash';
  address:        string | null;
  coupon_code:    string | null;
  customer_name:  string | null;
  customer_phone: string | null;
  created_at:     string;
}

export interface OrderItemRow {
  id:            string;
  order_id:      string;
  product_id:    string | null;
  product_name:  string;
  product_image: string | null;
  price:         number;
  quantity:      number;
  // subtotal y variant_name se añaden via migration 011; calcular como price*quantity si no existen
  subtotal?:     number;
  variant_name?: string | null;
  created_at?:   string;
}

export interface OrderWithItems extends OrderRow {
  order_items: OrderItemRow[];
}

export interface CreateOrderInput {
  userId:        string;
  items: Array<{
    productId:    string | null;
    productName:  string;
    productImage: string | null;
    price:        number;
    quantity:     number;
    variantName?: string | null;
  }>;
  total:         number;
  subtotal:      number;
  discount:      number;
  deliveryFee:   number;
  district:      string;
  deliveryType:  'delivery' | 'pickup';
  paymentMethod: 'card' | 'cash';
  address:       string;
  couponCode:    string | null;
  customerName:  string;
  customerPhone: string;
}

// ─── Tipos de producto ────────────────────────────────────────────────────────

export interface ProductRow {
  id:          string;
  name:        string;
  description: string | null;
  price:       number;
  image:       string | null;
  category:    string | null;
  subcategory: string | null;
  popular:     boolean;
  active:      boolean;
  stock:       number;
  detail_id:   string | null;
  created_at:  string;
}

// ─── Tipos de pizza personalizada ─────────────────────────────────────────────

export interface CreateCustomPizzaInput {
  userId:      string;
  orderItemId: string | null;
  sizeId:      string;
  sizeName:    string;
  baseId:      string;
  baseName:    string;
  sauceId:     string;
  sauceName:   string;
  cheeseId:    string;
  cheeseName:  string;
  totalPrice:  number;
  toppings: Array<{
    ingredientId:   string;
    ingredientName: string;
    category:       string;
    quantity:       number;
    pricePerUnit:   number;
  }>;
}

export interface PizzaIngredientRow {
  id:         string;
  name:       string;
  category:   'base' | 'sauce' | 'cheese' | 'meat' | 'vegetable' | 'extra';
  price:      number;
  image:      string | null;
  active:     boolean;
  sort_order: number;
  created_at: string;
}

export interface PizzaSizeRow {
  id:         string;
  name:       string;
  diameter:   string;
  slices:     number;
  price:      number;
  sort_order: number;
  active:     boolean;
  created_at: string;
}

// ─── Tipos de distrito y promoción ───────────────────────────────────────────

export interface DistrictRow {
  id:            string;
  name:          string;
  delivery_fee:  number;
  estimated_min: number;
  estimated_max: number;
  active:        boolean;
  sort_order:    number;
  created_at:    string;
}

export interface PromotionRow {
  id:          string;
  name:        string;
  description: string;
  discount:    number;
  image:       string | null;
  valid_until: string | null;
  code:        string | null;
  type:        'daily' | 'combo' | 'seasonal' | 'coupon';
  details:     string | null;
  terms:       string[] | null;
  day_of_week: number | null;
  active:      boolean;
  sort_order:  number;
  created_at:  string;
}

// ─── Operaciones de perfil ────────────────────────────────────────────────────

export async function fetchProfile(): Promise<{ data: ProfileRow | null; error: unknown }> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .single();
  return { data: data as ProfileRow | null, error };
}

export async function upsertProfile(
  userId: string,
  updates: { name?: string; email?: string; phone?: string; address?: string },
): Promise<{ data: ProfileRow | null; error: unknown }> {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...updates, updated_at: new Date().toISOString() }, { onConflict: 'id' })
    .select()
    .single();
  return { data: data as ProfileRow | null, error };
}

// ─── Operaciones de pedidos ───────────────────────────────────────────────────

export async function createOrder(
  input: CreateOrderInput,
): Promise<{ data: OrderRow | null; error: unknown }> {
  // Intento 1: RPC atómica que crea orden + items juntos (migration 015)
  const itemsPayload = input.items.map(item => ({
    product_id:    item.productId ?? item.productName,
    product_name:  item.productName,
    product_image: item.productImage ?? null,
    price:         item.price,
    quantity:      item.quantity,
    variant_name:  item.variantName ?? null,
  }));

  const { data: rpcData, error: rpcErr } = await supabase.rpc('create_order_with_items', {
    p_user_id:        input.userId,
    p_items:          itemsPayload,
    p_total:          input.total,
    p_subtotal:       input.subtotal,
    p_discount:       input.discount,
    p_delivery_fee:   input.deliveryFee,
    p_district:       input.district       || '',
    p_delivery_type:  input.deliveryType,
    p_payment_method: input.paymentMethod,
    p_address:        input.address        || '',
    p_coupon_code:    input.couponCode     || '',
    p_customer_name:  input.customerName   || '',
    p_customer_phone: input.customerPhone  || '',
  });

  if (!rpcErr && rpcData) {
    return { data: rpcData as OrderRow, error: null };
  }

  // Intento 2: INSERT solo la orden (items se guardan por separado con saveOrderItems)
  const { data: orderRow, error: orderErr } = await supabase
    .from('orders')
    .insert({
      user_id:        input.userId,
      status:         'pending',
      total:          input.total,
      subtotal:       input.subtotal,
      discount:       input.discount,
      delivery_fee:   input.deliveryFee,
      district:       input.district       || null,
      delivery_type:  input.deliveryType,
      payment_method: input.paymentMethod,
      address:        input.address        || null,
      coupon_code:    input.couponCode     || null,
      customer_name:  input.customerName   || null,
      customer_phone: input.customerPhone  || null,
    })
    .select()
    .single();

  if (orderErr || !orderRow) {
    return { data: null, error: orderErr ?? new Error('Order insert returned no data') };
  }

  return { data: orderRow as OrderRow, error: null };
}

/**
 * Guarda los productos en order_items.
 * Se llama desde Checkout justo después de createOrder,
 * igual que createCustomPizza se llama después de addToCart.
 */
export async function saveOrderItems(
  orderId: string,
  items: CreateOrderInput['items'],
): Promise<{ error: unknown }> {
  if (!items.length) return { error: null };

  // Columnas base que SIEMPRE existen (schema original migration 001)
  const baseRows = items.map(item => ({
    order_id:      orderId,
    product_id:    item.productId ?? item.productName,
    product_name:  item.productName,
    product_image: item.productImage ?? null,
    price:         item.price,
    quantity:      item.quantity,
  }));

  // Payload extendido para RPC que incluye subtotal (añadido por migration 012)
  const fullRows = baseRows.map((row, i) => ({
    ...row,
    subtotal:     items[i].price * items[i].quantity,
    variant_name: items[i].variantName ?? null,
  }));

  // Intento 1: insert_order_items RPC — SECURITY DEFINER, bypasa RLS (migration 012)
  const { error: rpcErr } = await supabase.rpc('insert_order_items', { p_items: fullRows });
  if (!rpcErr) return { error: null };

  console.warn('[saveOrderItems] RPC falló:', (rpcErr as { message?: string })?.message);

  // Intento 2: INSERT directo usando solo columnas originales (sin subtotal/variant_name)
  // Esto funciona incluso si migration 012 no se ejecutó
  for (const row of baseRows) {
    const { error } = await supabase.from('order_items').insert(row);
    if (error) {
      console.error('[saveOrderItems] INSERT falló:', error.message, '| producto:', row.product_name);
      return { error };
    }
  }

  return { error: null };
}

export async function fetchUserOrders(): Promise<{ data: OrderWithItems[]; error: unknown }> {
  // No usar nested select — requiere FK configurada en Supabase.
  // En su lugar: fetch orders, luego items por separado con .in()
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !orders?.length) {
    return { data: (orders ?? []).map(o => ({ ...o, order_items: [] })) as OrderWithItems[], error };
  }

  const orderIds = orders.map(o => o.id);
  const { data: allItems } = await supabase
    .from('order_items')
    .select('*')
    .in('order_id', orderIds);

  const itemsByOrder: Record<string, OrderItemRow[]> = {};
  (allItems ?? []).forEach(item => {
    if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
    itemsByOrder[item.order_id].push(item as OrderItemRow);
  });

  const result = orders.map(o => ({
    ...o,
    order_items: itemsByOrder[o.id] ?? [],
  })) as OrderWithItems[];

  return { data: result, error: null };
}

// ─── Operaciones de administrador ─────────────────────────────────────────────

/** Obtiene TODOS los pedidos sin items anidados (solo admin/delivery por RLS).
 *  Los items se cargan por separado con fetchItemsByOrderId para evitar
 *  problemas con el nested select cuando la FK no está configurada. */
export async function fetchAllOrders(): Promise<{ data: OrderWithItems[]; error: unknown }> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });
  const orders = (data ?? []).map(o => ({ ...o, order_items: [] })) as OrderWithItems[];
  return { data: orders, error };
}

/** Obtiene los items de un pedido específico (admin ve todos por política RLS). */
export async function fetchItemsByOrderId(
  orderId: string,
): Promise<{ data: OrderItemRow[]; error: unknown }> {
  // Intentar con order por created_at primero; si falla (columna no existe), sin order
  const { data, error } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId);
  return { data: (data ?? []) as OrderItemRow[], error };
}

/** Cambia el estado de un pedido (admin/delivery). */
export async function updateOrderStatus(
  orderId: string,
  status: OrderRow['status'],
): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId);
  return { error };
}

/** Obtiene todos los productos con su stock (admin). */
export async function fetchProductsWithStock(): Promise<{ data: ProductRow[]; error: unknown }> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('category', { ascending: true })
    .order('name', { ascending: true });
  return { data: (data ?? []) as ProductRow[], error };
}

/** Actualiza el stock de un producto (admin). */
export async function updateProductStock(
  productId: string,
  stock: number,
): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('products')
    .update({ stock })
    .eq('id', productId);
  return { error };
}

/**
 * Resta `amount` al stock buscando por nombre (case-insensitive).
 * Los IDs del carrito son locales (p.ej. "pizza-americana"), no UUIDs de DB.
 * Se busca por nombre de producto, limpiando el sufijo de tamaño "(Mediana)" etc.
 */
/**
 * Decrementa stock via función SECURITY DEFINER (evita restricción RLS en clientes).
 * Requiere haber ejecutado migration 006_security_functions.sql en Supabase.
 */
export async function decrementProductStock(
  productName: string,
  amount: number,
): Promise<{ error: unknown }> {
  const { error } = await supabase.rpc('decrement_product_stock', {
    p_product_name: productName,
    p_amount:       amount,
  });
  if (error) console.error(`[db] decrement_product_stock RPC error:`, error.message);
  return { error };
}

/**
 * Calcula la posición del pedido en la cola virtual.
 * Posición = cantidad de pedidos activos (pending/preparing) creados ANTES de éste + 1.
 */
/**
 * Calcula posición en la cola vía función SECURITY DEFINER (evita restricción RLS).
 * Requiere haber ejecutado migration 006_security_functions.sql en Supabase.
 */
export async function fetchQueuePosition(
  orderId: string,
): Promise<{ position: number | null; error: unknown }> {
  const { data, error } = await supabase.rpc('get_queue_position', {
    p_order_id: orderId,
  });
  if (error) {
    console.error(`[db] get_queue_position RPC error:`, error.message);
    return { position: null, error };
  }
  return { position: data as number | null, error: null };
}

// ─── Operaciones de productos ─────────────────────────────────────────────────

export async function fetchProducts(): Promise<{ data: ProductRow[]; error: unknown }> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: true });
  return { data: (data ?? []) as ProductRow[], error };
}

// ─── Pizza personalizada ──────────────────────────────────────────────────────

export async function createCustomPizza(
  input: CreateCustomPizzaInput,
): Promise<{ data: { id: string } | null; error: unknown }> {
  const { data: pizzaRow, error: pizzaErr } = await supabase
    .from('custom_pizzas')
    .insert({
      user_id:       input.userId,
      order_item_id: input.orderItemId || null,
      size_id:       input.sizeId,
      size_name:     input.sizeName,
      base_id:       input.baseId,
      base_name:     input.baseName,
      sauce_id:      input.sauceId,
      sauce_name:    input.sauceName,
      cheese_id:     input.cheeseId,
      cheese_name:   input.cheeseName,
      total_price:   input.totalPrice,
    })
    .select('id')
    .single();

  if (pizzaErr || !pizzaRow) {
    return { data: null, error: pizzaErr ?? new Error('custom_pizzas insert failed') };
  }

  if (input.toppings.length > 0) {
    const toppingRows = input.toppings.map(t => ({
      custom_pizza_id: pizzaRow.id,
      ingredient_id:   t.ingredientId,
      ingredient_name: t.ingredientName,
      category:        t.category,
      quantity:        t.quantity,
      price_per_unit:  t.pricePerUnit,
    }));
    const { error: toppingErr } = await supabase.from('custom_pizza_toppings').insert(toppingRows);
    if (toppingErr) console.error('[db] custom_pizza_toppings insert error:', toppingErr.message);
  }

  return { data: { id: pizzaRow.id }, error: null };
}

export async function fetchPizzaIngredients(): Promise<{ data: PizzaIngredientRow[]; error: unknown }> {
  const { data, error } = await supabase
    .from('pizza_ingredients')
    .select('*')
    .eq('active', true)
    .order('category', { ascending: true })
    .order('sort_order', { ascending: true });
  return { data: (data ?? []) as PizzaIngredientRow[], error };
}

export async function fetchPizzaSizes(): Promise<{ data: PizzaSizeRow[]; error: unknown }> {
  const { data, error } = await supabase
    .from('pizza_sizes')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true });
  return { data: (data ?? []) as PizzaSizeRow[], error };
}

// ─── Distritos ────────────────────────────────────────────────────────────────

export async function fetchDistricts(): Promise<{ data: DistrictRow[]; error: unknown }> {
  const { data, error } = await supabase
    .from('districts')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true });
  return { data: (data ?? []) as DistrictRow[], error };
}

// ─── Promociones ──────────────────────────────────────────────────────────────

export async function fetchPromotions(): Promise<{ data: PromotionRow[]; error: unknown }> {
  const { data, error } = await supabase
    .from('promotions')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true });
  return { data: (data ?? []) as PromotionRow[], error };
}
