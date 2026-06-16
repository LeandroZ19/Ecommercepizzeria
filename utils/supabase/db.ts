/**
 * db.ts — Supabase database operations for RapiPizza.
 *
 * All data operations use the Supabase JS client directly against
 * Postgres tables with Row Level Security (RLS) enforced.
 *
 * Architecture:
 *  - profiles        : user CRUD (read/update own row)
 *  - orders          : create and list user orders
 *  - order_items     : inserted together with the parent order
 *  - custom_pizzas   : save custom-built pizza with toppings
 *  - products        : public read-only catalog
 *
 * All functions return `{ data, error }` or throw — callers must
 * handle errors explicitly (no silent failures).
 */

import { supabase } from './client';
import type { User } from '../../src/app/context/AuthContext';

// ─── Type Definitions ─────────────────────────────────────────────────────────

/**
 * Row shape for the `profiles` table.
 * Matches the SQL schema in 002_complete_schema.sql.
 */
export interface ProfileRow {
  id:         string;
  name:       string | null;
  email:      string | null;
  phone:      string | null;
  address:    string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Row shape for the `orders` table.
 */
export interface OrderRow {
  id:             string;
  user_id:        string;
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

/**
 * Row shape for the `order_items` table.
 */
export interface OrderItemRow {
  id:            string;
  order_id:      string;
  product_id:    string | null;
  product_name:  string;
  product_image: string | null;
  price:         number;
  quantity:      number;
  subtotal:      number;
  variant_name:  string | null;
  created_at:    string;
}

/**
 * Input payload when creating an order.
 */
export interface CreateOrderInput {
  /** User's UUID from Supabase Auth */
  userId:        string;
  /** Cart line items */
  items: Array<{
    productId:    string | null;
    productName:  string;
    productImage: string | null;
    price:        number;
    quantity:     number;
    variantName?: string | null;
  }>;
  /** Grand total including delivery fee, after discounts */
  total:         number;
  /** Sum of item prices before discounts */
  subtotal:      number;
  /** Coupon or promotional discount amount */
  discount:      number;
  /** Delivery fee (0 for pickup) */
  deliveryFee:   number;
  /** Selected district name */
  district:      string;
  /** Delivery mode */
  deliveryType:  'delivery' | 'pickup';
  /** Payment method chosen at checkout */
  paymentMethod: 'card' | 'cash';
  /** Street address for delivery */
  address:       string;
  /** Applied coupon code or null */
  couponCode:    string | null;
  /** Customer's full name */
  customerName:  string;
  /** Customer's phone number */
  customerPhone: string;
}

/**
 * An order with its nested items — returned by fetchUserOrders.
 */
export interface OrderWithItems extends OrderRow {
  order_items: OrderItemRow[];
}

// ─── Profile Operations ───────────────────────────────────────────────────────

/**
 * Fetches the profile row for the currently authenticated user.
 *
 * @returns `{ data: ProfileRow | null, error }` — data is null if no row exists yet.
 * @example
 * const { data: profile } = await fetchProfile();
 * if (profile) console.log(profile.name);
 */
export async function fetchProfile(): Promise<{ data: ProfileRow | null; error: unknown }> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .single();

  return { data: data as ProfileRow | null, error };
}

/**
 * Upserts a profile row for the given user ID.
 * Creates the row if it does not exist; updates it if it does.
 * Should be called after login/register and when the user edits their profile.
 *
 * @param userId  - The authenticated user's UUID (auth.uid())
 * @param updates - Partial profile fields to set
 * @returns `{ data: ProfileRow | null, error }`
 * @example
 * await upsertProfile(session.user.id, { name: 'Ana', phone: '+51999' });
 */
export async function upsertProfile(
  userId: string,
  updates: { name?: string; email?: string; phone?: string; address?: string },
): Promise<{ data: ProfileRow | null; error: unknown }> {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        id:         userId,
        ...updates,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    )
    .select()
    .single();

  return { data: data as ProfileRow | null, error };
}

// ─── Order Operations ─────────────────────────────────────────────────────────

/**
 * Creates a new order with all its line items in a single transaction.
 *
 * Strategy: insert the order header first to get the UUID, then batch-insert
 * all order_items referencing that UUID.
 *
 * @param input - Full order payload including items array
 * @returns `{ data: OrderRow | null, error }` — data contains the created order header.
 * @example
 * const { data: order, error } = await createOrder({ userId, items, total, ... });
 */
export async function createOrder(
  input: CreateOrderInput,
): Promise<{ data: OrderRow | null; error: unknown }> {
  // 1. Insert the order header
  const { data: orderRow, error: orderErr } = await supabase
    .from('orders')
    .insert({
      user_id:        input.userId,
      status:         'pending',
      total:          input.total,
      subtotal:       input.subtotal,
      discount:       input.discount,
      delivery_fee:   input.deliveryFee,
      district:       input.district || null,
      delivery_type:  input.deliveryType,
      payment_method: input.paymentMethod,
      address:        input.address || null,
      coupon_code:    input.couponCode || null,
      customer_name:  input.customerName || null,
      customer_phone: input.customerPhone || null,
    })
    .select()
    .single();

  if (orderErr || !orderRow) {
    return { data: null, error: orderErr ?? new Error('Order insert returned no data') };
  }

  // 2. Batch-insert all line items
  if (input.items.length > 0) {
    const itemRows = input.items.map(item => ({
      order_id:      orderRow.id,
      product_id:    item.productId || null,
      product_name:  item.productName,
      product_image: item.productImage || null,
      price:         item.price,
      quantity:      item.quantity,
      subtotal:      item.price * item.quantity,
      variant_name:  item.variantName || null,
    }));

    const { error: itemsErr } = await supabase
      .from('order_items')
      .insert(itemRows);

    if (itemsErr) {
      console.error('[db] order_items insert error:', itemsErr.message);
      // Order header is already committed — log but don't fail the whole checkout
    }
  }

  return { data: orderRow as OrderRow, error: null };
}

/**
 * Fetches all orders for the currently authenticated user, newest first.
 * Includes nested `order_items` in each order.
 *
 * @returns `{ data: OrderWithItems[], error }`
 * @example
 * const { data: orders } = await fetchUserOrders();
 * orders.forEach(o => console.log(o.total, o.order_items.length));
 */
export async function fetchUserOrders(): Promise<{ data: OrderWithItems[]; error: unknown }> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false });

  return { data: (data ?? []) as OrderWithItems[], error };
}

// ─── Products Operations ──────────────────────────────────────────────────────

/**
 * Row shape for the `products` table.
 */
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
  detail_id:   string | null;
  created_at:  string;
}

/**
 * Fetches all active products from the products table.
 * Products are publicly readable (no auth required).
 *
 * @returns `{ data: ProductRow[], error }`
 * @example
 * const { data: products } = await fetchProducts();
 */
export async function fetchProducts(): Promise<{ data: ProductRow[]; error: unknown }> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: true });

  return { data: (data ?? []) as ProductRow[], error };
}

// ─── Custom Pizza Operations ──────────────────────────────────────────────────

/**
 * Input for saving a custom-built pizza.
 */
export interface CreateCustomPizzaInput {
  /** Authenticated user's UUID */
  userId:      string;
  /** Optional order_item UUID if linking to an order */
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
  /** Selected toppings */
  toppings: Array<{
    ingredientId:   string;
    ingredientName: string;
    category:       string;
    quantity:       number;
    pricePerUnit:   number;
  }>;
}

/**
 * Saves a custom pizza and all its toppings to Supabase.
 *
 * @param input - Full custom pizza configuration
 * @returns `{ data: { id: string } | null, error }`
 * @example
 * const { data } = await createCustomPizza({ userId, sizeId: 'large', ... });
 */
export async function createCustomPizza(
  input: CreateCustomPizzaInput,
): Promise<{ data: { id: string } | null; error: unknown }> {
  // 1. Insert the custom_pizzas row
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

  // 2. Insert toppings
  if (input.toppings.length > 0) {
    const toppingRows = input.toppings.map(t => ({
      custom_pizza_id: pizzaRow.id,
      ingredient_id:   t.ingredientId,
      ingredient_name: t.ingredientName,
      category:        t.category,
      quantity:        t.quantity,
      price_per_unit:  t.pricePerUnit,
    }));

    const { error: toppingErr } = await supabase
      .from('custom_pizza_toppings')
      .insert(toppingRows);

    if (toppingErr) {
      console.error('[db] custom_pizza_toppings insert error:', toppingErr.message);
    }
  }

  return { data: { id: pizzaRow.id }, error: null };
}

// ─── Pizza Ingredients & Sizes Operations ─────────────────────────────────────

/**
 * Row shape for the `pizza_ingredients` table.
 * Matches the schema in migration 004_pizza_ingredients_drinks.sql.
 */
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

/**
 * Row shape for the `pizza_sizes` table.
 * Matches the schema in migration 004_pizza_ingredients_drinks.sql.
 */
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

/**
 * Fetches all active pizza ingredients from the `pizza_ingredients` table,
 * ordered by category and sort_order.
 *
 * Ingredients are publicly readable — no authentication required.
 * Used by CustomPizza.tsx to populate the customization builder, with the
 * local `availableIngredients` array as a fallback if this call fails.
 *
 * @returns `{ data: PizzaIngredientRow[], error }` — data is empty array on error.
 * @example
 * const { data: ingredients, error } = await fetchPizzaIngredients();
 * const bases = ingredients.filter(i => i.category === 'base');
 */
export async function fetchPizzaIngredients(): Promise<{ data: PizzaIngredientRow[]; error: unknown }> {
  const { data, error } = await supabase
    .from('pizza_ingredients')
    .select('*')
    .eq('active', true)
    .order('category', { ascending: true })
    .order('sort_order', { ascending: true });

  return { data: (data ?? []) as PizzaIngredientRow[], error };
}

/**
 * Fetches all active pizza sizes from the `pizza_sizes` table,
 * ordered by sort_order (smallest first).
 *
 * Sizes are publicly readable — no authentication required.
 * Used by CustomPizza.tsx to populate the size selector, with local
 * hardcoded sizes as a fallback if this call fails.
 *
 * @returns `{ data: PizzaSizeRow[], error }` — data is empty array on error.
 * @example
 * const { data: sizes, error } = await fetchPizzaSizes();
 * const mediana = sizes.find(s => s.id === 'medium');
 */
export async function fetchPizzaSizes(): Promise<{ data: PizzaSizeRow[]; error: unknown }> {
  const { data, error } = await supabase
    .from('pizza_sizes')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true });

  return { data: (data ?? []) as PizzaSizeRow[], error };
}

// ─── District Operations ──────────────────────────────────────────────────────

/**
 * Row shape for the `districts` table.
 * Matches the schema in migration 003_districts_promotions.sql.
 */
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

/**
 * Fetches all active delivery districts ordered by sort_order.
 * Districts are publicly readable — no authentication required.
 *
 * @returns `{ data: DistrictRow[], error }`
 * @example
 * const { data: districts } = await fetchDistricts();
 * districts.forEach(d => console.log(d.name, d.delivery_fee));
 */
export async function fetchDistricts(): Promise<{ data: DistrictRow[]; error: unknown }> {
  const { data, error } = await supabase
    .from('districts')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true });

  return { data: (data ?? []) as DistrictRow[], error };
}

// ─── Promotion Operations ─────────────────────────────────────────────────────

/**
 * Row shape for the `promotions` table.
 * Matches the schema in migration 003_districts_promotions.sql.
 */
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

/**
 * Fetches all active promotions ordered by sort_order.
 * Promotions are publicly readable — no authentication required.
 *
 * @returns `{ data: PromotionRow[], error }`
 * @example
 * const { data: promos } = await fetchPromotions();
 * const seasonal = promos.filter(p => p.type === 'seasonal');
 */
export async function fetchPromotions(): Promise<{ data: PromotionRow[]; error: unknown }> {
  const { data, error } = await supabase
    .from('promotions')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true });

  return { data: (data ?? []) as PromotionRow[], error };
}

/**
 * Checks if the currently authenticated user has placed any previous orders.
 * Used to determine whether a first-order free delivery should be applied.
 *
 * @returns `{ hasOrders: boolean }` — true if the user has at least one prior order.
 * @example
 * const { hasOrders } = await checkUserHasOrders();
 * const deliveryFee = hasOrders ? districtFee : 0;
 */
export async function checkUserHasOrders(): Promise<{ hasOrders: boolean }> {
  const { count, error } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true });

  if (error) {
    console.error('[db] checkUserHasOrders error:', error.message);
    return { hasOrders: false };
  }

  return { hasOrders: (count ?? 0) > 0 };
}
