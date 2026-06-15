/**
 * RapiPizza — Hono Edge Function Server
 *
 * Endpoints disponibles:
 *   POST  /auth/register        — Registro de usuario (email_confirm: true)
 *   GET   /profile              — Obtener perfil del usuario autenticado
 *   PUT   /profile              — Actualizar perfil del usuario
 *   GET   /orders               — Listar pedidos del usuario autenticado
 *   POST  /orders               — Crear nuevo pedido
 *   GET   /health               — Health check
 *
 * Persistencia: Supabase KV store (tabla kv_store_8a4cb832).
 * Auth: Supabase Auth (tokens JWT validados con service role key).
 *
 * Prefijo de rutas: /make-server-8a4cb832
 */

import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// ── Middleware ────────────────────────────────────────────────────────────────

app.use("*", logger(console.log));

app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// ── Helper: cliente admin (service role) ─────────────────────────────────────

/** Crea un cliente Supabase con la service role key para operaciones admin */
const adminClient = () =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

/**
 * Valida el token JWT del header Authorization y retorna el user_id.
 * Retorna null si el token es inválido o falta.
 */
async function getAuthUser(authHeader: string | undefined) {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  const { data, error } = await adminClient().auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

// ── Health Check ──────────────────────────────────────────────────────────────

app.get("/make-server-8a4cb832/health", (c) =>
  c.json({ status: "ok", service: "RapiPizza API" }),
);

// ── Auth: Registro ────────────────────────────────────────────────────────────

/**
 * POST /auth/register
 * Crea un usuario en Supabase Auth con email ya confirmado
 * (sin necesidad de validar email), y guarda su perfil en el KV store.
 *
 * Body: { name: string, email: string, password: string }
 */
app.post("/make-server-8a4cb832/auth/register", async (c) => {
  try {
    const { name, email, password } = await c.req.json();

    if (!name || !email || !password) {
      return c.json({ error: "name, email y password son requeridos" }, 400);
    }

    // Crear usuario con email_confirm: true para evitar email de verificación
    const { data, error } = await adminClient().auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      email_confirm: true,
    });

    if (error) {
      console.log("Register error:", error.message);
      return c.json({ error: error.message }, 400);
    }

    // Guardar perfil en KV store
    await kv.set(`profile:${data.user.id}`, {
      name,
      phone: "",
      address: "",
      created_at: new Date().toISOString(),
    });

    return c.json({ user: { id: data.user.id, email: data.user.email, name } });
  } catch (err) {
    console.log("Register exception:", err);
    return c.json({ error: "Error interno al registrar usuario" }, 500);
  }
});

// ── Perfil: Obtener ───────────────────────────────────────────────────────────

/**
 * GET /profile
 * Retorna el perfil del usuario autenticado desde el KV store.
 * Si no existe perfil guardado, retorna los datos básicos de auth.
 */
app.get("/make-server-8a4cb832/profile", async (c) => {
  try {
    const user = await getAuthUser(c.req.header("Authorization"));
    if (!user) return c.json({ error: "No autorizado" }, 401);

    const profile = await kv.get(`profile:${user.id}`);

    return c.json({
      profile: profile ?? {
        name: user.user_metadata?.name ?? "",
        phone: "",
        address: "",
      },
    });
  } catch (err) {
    console.log("Profile GET error:", err);
    return c.json({ error: "Error al obtener perfil" }, 500);
  }
});

// ── Perfil: Actualizar ────────────────────────────────────────────────────────

/**
 * PUT /profile
 * Guarda o actualiza el perfil del usuario en el KV store.
 *
 * Body: { name?: string, phone?: string, address?: string }
 */
app.put("/make-server-8a4cb832/profile", async (c) => {
  try {
    const user = await getAuthUser(c.req.header("Authorization"));
    if (!user) return c.json({ error: "No autorizado" }, 401);

    const incoming = await c.req.json();
    const existing = (await kv.get(`profile:${user.id}`)) ?? {};

    const updated = {
      ...existing,
      ...incoming,
      updated_at: new Date().toISOString(),
    };

    await kv.set(`profile:${user.id}`, updated);
    return c.json({ ok: true, profile: updated });
  } catch (err) {
    console.log("Profile PUT error:", err);
    return c.json({ error: "Error al actualizar perfil" }, 500);
  }
});

// ── Pedidos: Obtener ──────────────────────────────────────────────────────────

/**
 * GET /orders
 * Retorna todos los pedidos del usuario autenticado (ordenados por fecha desc).
 */
app.get("/make-server-8a4cb832/orders", async (c) => {
  try {
    const user = await getAuthUser(c.req.header("Authorization"));
    if (!user) return c.json({ error: "No autorizado" }, 401);

    const orders = (await kv.get(`orders:user:${user.id}`)) ?? [];
    return c.json({ orders });
  } catch (err) {
    console.log("Orders GET error:", err);
    return c.json({ error: "Error al obtener pedidos" }, 500);
  }
});

// ── Pedidos: Crear ────────────────────────────────────────────────────────────

/**
 * POST /orders
 * Crea un nuevo pedido y lo agrega al historial del usuario en el KV store.
 *
 * Body: {
 *   items: Array<{ id, name, image, price, quantity }>,
 *   total: number,
 *   deliveryFee: number,
 *   district: string,
 *   deliveryType: 'delivery' | 'pickup',
 *   paymentMethod: 'card' | 'cash',
 *   address: string,
 *   couponCode?: string,
 *   discount: number,
 * }
 */
app.post("/make-server-8a4cb832/orders", async (c) => {
  try {
    const user = await getAuthUser(c.req.header("Authorization"));
    if (!user) return c.json({ error: "No autorizado" }, 401);

    const body = await c.req.json();

    const order = {
      id: crypto.randomUUID(),
      user_id: user.id,
      date: new Date().toISOString(),
      status: "pending",
      total: body.total ?? 0,
      delivery_fee: body.deliveryFee ?? 0,
      district: body.district ?? "",
      delivery_type: body.deliveryType ?? "delivery",
      payment_method: body.paymentMethod ?? "card",
      address: body.address ?? "",
      coupon_code: body.couponCode ?? null,
      discount: body.discount ?? 0,
      items: (body.items ?? []).map((item: any) => ({
        product_id:    item.id,
        product_name:  item.name,
        product_image: item.image,
        price:         item.price,
        quantity:      item.quantity,
      })),
    };

    // Agregar al inicio del array de pedidos del usuario
    const existing = (await kv.get(`orders:user:${user.id}`)) ?? [];
    await kv.set(`orders:user:${user.id}`, [order, ...existing]);

    return c.json({ order });
  } catch (err) {
    console.log("Orders POST error:", err);
    return c.json({ error: "Error al crear pedido" }, 500);
  }
});

// ── Iniciar servidor ──────────────────────────────────────────────────────────

Deno.serve(app.fetch);
