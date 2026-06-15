/**
 * RapiPizza — Hono Edge Function Server
 *
 * This edge function is intentionally minimal — only operations that require
 * the Supabase service role key (admin privileges) live here.
 * Everything else (profiles, orders, products) is handled by the frontend
 * using the Supabase JS client directly with Row Level Security.
 *
 * Endpoints:
 *   GET   /health               — Health check
 *   POST  /auth/register        — Register user with email pre-confirmed (admin.createUser)
 *   POST  /products/seed        — Upsert all 30 products into the `products` table
 *   GET   /products             — Read products from the `products` table
 *
 * Auth: Supabase Auth JWT validated with service role key.
 * Persistence: Supabase Postgres tables (not KV store).
 */

import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

const app = new Hono();

// ── Middleware ────────────────────────────────────────────────────────────────

app.use("*", logger(console.log));
app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
}));

// ── Helper: cliente admin ─────────────────────────────────────────────────────

const adminClient = () =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

/** Valida el Bearer token y retorna el usuario; null si inválido */
async function getAuthUser(authHeader: string | undefined) {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  if (!token || token === "anon") return null;
  const { data, error } = await adminClient().auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

// ── Menú completo (datos del menú real de RapiPizza) ─────────────────────────

const PRODUCTS = [
  // Combo Rapilover
  { id: "rapilover-1", name: "Combo Rapilover", description: "Pizza americana grande con pan al ajo (4 panecillos) y Pepsi 1lt", price: 41.90, image: "https://images.rappi.pe/products/c0e14f36-76b2-4d70-a8eb-ea0583db26bd.png?d=600x600&e=webp", category: "pizza", subcategory: "combo-rapilover", popular: true },
  { id: "rapilover-2", name: "Combo Pizza Doble", description: "Dos pizzas grandes cualquier sabor y Pepsi 1lt", price: 56.90, image: "https://images.rappi.pe/products/9107faff-6bb2-4202-885f-540d023a040e-1747002097125.png?d=600x600&e=webp", category: "pizza", subcategory: "combo-rapilover", popular: true },
  { id: "rapilover-3", name: "Combo Rapilover para Compartir", description: "Combo de 3 pizzas grandes: americana o pepperoni, acompañado de una Pepsi de 1 litro", price: 70.90, image: "https://images.rappi.pe/products/42cf7930-4656-42f5-b286-7dd8030d1396-1747001856436.png?d=600x600&e=webp", category: "pizza", subcategory: "combo-rapilover", popular: true },
  { id: "rapilover-4", name: "Combo Rapilover 4U Para Ti", description: "4 Pizzas grandes cualquier sabor y Pepsi 1lt", price: 98.90, image: "https://images.rappi.pe/products/bf521e04-7f16-4fb4-b7d3-fb382f6d580e.png?d=600x600&e=webp", category: "pizza", subcategory: "combo-rapilover" },
  // Promo Ame y Peppe
  { id: "ame-peppe-1", name: "Pizza Americana", description: "Pizza americana con masa artesanal, queso mozzarella y jamón", price: 25.90, image: "https://images.rappi.pe/products/832b8fba-9420-4567-937a-1b94cc879441-1747724658545.png?d=600x600&e=webp", category: "pizza", subcategory: "promo-ame-peppe", popular: true, detailId: "pizza-americana" },
  { id: "ame-peppe-2", name: "Pizza Pepperoni", description: "Pizza con queso mozzarella y pepperoni sobre masa tradicional", price: 25.90, image: "https://images.rappi.pe/products/1560b4e5-3468-4b31-804b-9657b4aa3d72-1747724630621.png?d=600x600&e=webp", category: "pizza", subcategory: "promo-ame-peppe", popular: true, detailId: "pizza-pepperoni-detail" },
  // Promo Rapilover
  { id: "promo-rap-1", name: "Promo Rapilover Familiar", description: "Pizza americana familiar con pan al ajo (8 panecillos) con Inca Kola o Coca Cola 1.5lt", price: 52.90, image: "https://images.rappi.pe/products/ab9a63fc-b0ba-4381-8e9b-e0a4da83baf8-1747002789734.png?d=600x600&e=webp", category: "pizza", subcategory: "promo-rapilover", popular: true },
  { id: "promo-rap-2", name: "Promo Rapilover Tri Clásico", description: "3 Pizzas familiares clásicas con pepperoni y jamón", price: 79.90, image: "https://images.rappi.pe/products/50133948-3489-4415-ae60-4301ba3911d2.png?d=600x600&e=webp", category: "pizza", subcategory: "promo-rapilover" },
  { id: "promo-rap-3", name: "Promo Rapilover Familiar x2", description: "2 Pizzas familiares con pan al ajo (8 panecillos) con Inca Kola o Coca Cola 1.5lt", price: 84.90, image: "https://images.rappi.pe/products/370006fd-a9e2-4bd9-bced-0ce573a8d081.png?d=600x600&e=webp", category: "pizza", subcategory: "promo-rapilover" },
  { id: "promo-rap-4", name: "Promo Tridente Supremo", description: "3 Pizzas familiares cualquier sabor con Inca Kola o Coca Cola 1.5lt", price: 95.90, image: "https://images.rappi.pe/products/3a83e773-e011-4f2f-8366-d8c2f1f27c80.png?d=600x600&e=webp", category: "pizza", subcategory: "promo-rapilover" },
  // Pizza Personal
  { id: "personal-1", name: "Pizza Personal Cualquier Sabor", description: "Pizza personal: americana, pepperoni, hawaiana, vegetariana, pepperoni especial, carnívora, mixta, alemana y carnívora tropical", price: 12.00, image: "https://images.rappi.pe/products/320841f3-8f3a-4e6b-8c74-e6d0ee336e74-1749449497711.png?d=600x600&e=webp", category: "pizza", subcategory: "pizza-personal", popular: true },
  // Pizza Doble
  { id: "doble-1", name: "Pizzas Clásicas x2", description: "Disfruta de 2 pizzas clásicas grandes o familiares: americana, pepperoni o hawaiana", price: 46.90, image: "https://images.rappi.pe/products/f49eb908-16a7-4553-af0a-1b0df3981ee7.png?d=600x600&e=webp", category: "pizza", subcategory: "pizza-doble" },
  // Combos 6 Porciones
  { id: "combo6-1", name: "Combo 1", description: "Pizza americana grande, pan al ajo (4 panecillos) y Pepsi 1lt", price: 39.90, image: "https://images.rappi.pe/products/984d9bdb-b433-4821-b832-9073292e1e85-1747002692474.png?d=600x600&e=webp", category: "pizza", subcategory: "combo-6", popular: true },
  { id: "combo6-2", name: "Combo 2", description: "Dos pizzas grandes: pepperoni y americana", price: 48.90, image: "https://images.rappi.pe/products/1933ab84-ab18-47d8-823d-a6d5fab2cf43-1747006638560.png?d=600x600&e=webp", category: "pizza", subcategory: "combo-6" },
  { id: "combo6-3", name: "Combo 3", description: "Dos pizzas grandes cualquier sabor y Pepsi 1lt", price: 55.90, image: "https://images.rappi.pe/products/9107faff-6bb2-4202-885f-540d023a040e-1747002097125.png?d=600x600&e=webp", category: "pizza", subcategory: "combo-6" },
  { id: "combo6-4", name: "Combo 4", description: "Tres pizzas grandes: dos de americana y una de pepperoni, con Pepsi de 1 litro", price: 64.90, image: "https://images.rappi.pe/products/42cf7930-4656-42f5-b286-7dd8030d1396-1747001856436.png?d=600x600&e=webp", category: "pizza", subcategory: "combo-6" },
  { id: "combo6-5", name: "Combo 5", description: "Pizza grande cualquier sabor, pan al ajo (4 panecillos) y Pepsi 1lt", price: 43.90, image: "https://images.rappi.pe/products/ec21b73d-1183-4a2f-ae4d-0f39700cb60d-1747002490408.png?d=600x600&e=webp", category: "pizza", subcategory: "combo-6" },
  { id: "combo6-6", name: "Combo 6", description: "Cuatro pizzas grandes de cualquier sabor y una Pepsi de 1 litro", price: 92.90, image: "https://images.rappi.pe/products/d401dbdc-fc1f-4582-a36c-d8cefca6803e-1747002433139.png?d=600x600&e=webp", category: "pizza", subcategory: "combo-6" },
  // Promos 8 Porciones
  { id: "promo8-1", name: "Promo 1", description: "Pizza americana familiar, pan al ajo (8 panecillos) con Inca Cola o Coca Cola 1.5lt", price: 51.90, image: "https://images.rappi.pe/products/ab9a63fc-b0ba-4381-8e9b-e0a4da83baf8-1747002789734.png?d=600x600&e=webp", category: "pizza", subcategory: "promo-8", popular: true },
  { id: "promo8-2", name: "Promo 2", description: "Dos pizzas familiares: una con pepperoni y otra con pepperoni y carne", price: 64.00, image: "https://images.rappi.pe/products/a440c439-c1d4-496f-8d12-4605a974dd7b-1747002914032.png?d=600x600&e=webp", category: "pizza", subcategory: "promo-8" },
  { id: "promo8-3", name: "Promo 3", description: "Tres pizzas familiares clásicas con pepperoni", price: 77.00, image: "https://images.rappi.pe/products/e9949501-c241-4431-97ba-a5a349204cbc-1747002964338.png?d=600x600&e=webp", category: "pizza", subcategory: "promo-8" },
  { id: "promo8-4", name: "Promo 4", description: "Pizza especial familiar, pan al ajo (8 panecillos) con Inca Cola o Coca Cola 1.5lt", price: 55.90, image: "https://images.rappi.pe/products/d9352c4f-5f86-4cf8-b852-bd3563bcca4e-1747003044407.png?d=600x600&e=webp", category: "pizza", subcategory: "promo-8" },
  { id: "promo8-5", name: "Promo 5", description: "Dos pizzas familiares: americana o pepperoni, con Inca Kola o Coca Cola de 1.5 litros", price: 71.90, image: "https://images.rappi.pe/products/49756c04-9df9-418b-8376-423416b4eb0c-1747003074329.png?d=600x600&e=webp", category: "pizza", subcategory: "promo-8" },
  { id: "promo8-6", name: "Promo 6", description: "Dos pizzas familiares especiales, pan al ajo (8 panecillos) y bebida de 1.5lt", price: 84.90, image: "https://images.rappi.pe/products/a83dc137-75f9-4ce8-a3fb-8dbf29b90f35-1747003109877.png?d=600x600&e=webp", category: "pizza", subcategory: "promo-8" },
  { id: "promo8-7", name: "Promo 7", description: "Tres pizzas familiares cualquier sabor con Inca Cola o Coca Cola 1.5lt", price: 96.90, image: "https://images.rappi.pe/products/625b75c5-d5e7-40cb-b61e-d23cad5a7a7c-1747003183340.png?d=600x600&e=webp", category: "pizza", subcategory: "promo-8" },
  // Promos Extremas
  { id: "extreme-1", name: "Promo Extrema 1", description: "Pizza extrema (8 ingredientes y extra queso) de 8 porciones, pan al ajo (8 panecillos), Inca Cola o Coca Cola", price: 59.90, image: "https://images.rappi.pe/products/862a7e98-31ad-4e30-9664-9f2b2eb233bc.jpeg?d=600x600&e=webp", category: "pizza", subcategory: "promo-extrema", popular: true },
  { id: "extreme-2", name: "Promo Extrema 2", description: "Dos pizzas extremas (8 ingredientes y extra queso) de 8 porciones, pan al ajo (8 panecillos), Inca Kola o Coca Cola 1.5lt", price: 88.90, image: "https://images.rappi.pe/products/b85a3f6a-395b-469f-93e3-94988b511545.jpeg?d=600x600&e=webp", category: "pizza", subcategory: "promo-extrema" },
  // Complementos
  { id: "comp-1", name: "Pan al Ajo Tradicional", description: "Pan artesanal con mantequilla al ajo (8 panecillos)", price: 10.90, image: "https://images.rappi.pe/products/gp_sides_otra_pan_al_ajo_n.png?d=600x600&e=webp", category: "side", subcategory: "complemento", popular: true },
  { id: "comp-2", name: "Pan al Ajo Especial", description: "Pan artesanal con mantequilla al ajo, queso cheddar y 100g de queso mozzarella (8 panecillos)", price: 15.90, image: "https://images.rappi.pe/products/f72ad1e4-adf7-4ae9-b50e-d1353ffa018b.jpeg?d=600x600&e=webp", category: "side", subcategory: "complemento" },
  { id: "comp-3", name: "Crema Rapipizza", description: "2 tapecitos extra de crema de rocoto", price: 3.00, image: "https://images.rappi.pe/products/792a436e-8dc1-422f-87c5-d5abfc8e7b3c-1749448057134.png?d=600x600&e=webp", category: "side", subcategory: "complemento" },
];

// ── Health ────────────────────────────────────────────────────────────────────

app.get("/make-server-8a4cb832/health", (c) =>
  c.json({ status: "ok", service: "RapiPizza API", version: "2.0" }),
);

// ── Auth: Register ────────────────────────────────────────────────────────────

/**
 * POST /auth/register
 *
 * Creates a new Supabase Auth user with `email_confirm: true` (pre-confirmed)
 * so the user can log in immediately without checking their email.
 * Also upserts a row in the `profiles` table using the service role client.
 *
 * Body: { name, email, password, phone }
 * Returns: { user: { id, email, name, phone } }
 */
app.post("/make-server-8a4cb832/auth/register", async (c) => {
  try {
    const body = await c.req.json();
    const { name, email, password, phone } = body;

    if (!name || !email || !password) {
      return c.json({ error: "Missing required fields: name, email, password" }, 400);
    }

    // Create user with admin client — email is automatically confirmed
    const { data, error } = await adminClient().auth.admin.createUser({
      email,
      password,
      user_metadata: { name, phone: phone ?? "" },
      email_confirm: true,
    });

    if (error) {
      console.log("Register error:", error.message);
      return c.json({ error: error.message }, 400);
    }

    // Upsert profile row in the `profiles` table via the service role client
    // (The `on_auth_user_created` trigger also does this, but explicit is safer)
    const db = adminClient();
    await db.from("profiles").upsert({
      id:      data.user.id,
      name:    name,
      email:   email,
      phone:   phone ?? "",
      address: "",
    }, { onConflict: "id" });

    return c.json({ user: { id: data.user.id, email: data.user.email, name, phone: phone ?? "" } });
  } catch (err) {
    console.log("Register exception:", String(err));
    return c.json({ error: "Internal error during registration: " + String(err) }, 500);
  }
});

// ── Products: Seed ────────────────────────────────────────────────────────────

/**
 * POST /products/seed
 *
 * Upserts all 30 products into the `products` Supabase table.
 * Idempotent — safe to run multiple times (uses ON CONFLICT DO UPDATE).
 * Requires a valid Bearer token (anon or authenticated).
 *
 * Returns: { ok: true, count: number, seeded_at: string }
 */
app.post("/make-server-8a4cb832/products/seed", async (c) => {
  try {
    const db = adminClient();
    const rows = PRODUCTS.map(p => ({
      id:          p.id,
      name:        p.name,
      description: p.description ?? null,
      price:       p.price,
      image:       p.image ?? null,
      category:    p.category ?? null,
      subcategory: p.subcategory ?? null,
      popular:     p.popular ?? false,
      active:      true,
      detail_id:   (p as any).detailId ?? null,
    }));

    const { error } = await db
      .from("products")
      .upsert(rows, { onConflict: "id" });

    if (error) {
      console.error("Seed error:", error.message);
      return c.json({ error: "Seed failed: " + error.message }, 500);
    }

    return c.json({
      ok:        true,
      count:     rows.length,
      seeded_at: new Date().toISOString(),
      message:   `${rows.length} products upserted into products table`,
    });
  } catch (err) {
    return c.json({ error: "Error during seed: " + String(err) }, 500);
  }
});

// ── Products: List ────────────────────────────────────────────────────────────

/**
 * GET /products
 *
 * Returns all active products from the `products` table.
 * Falls back to the in-memory PRODUCTS constant if the table is empty
 * and automatically triggers a seed.
 *
 * Returns: { products: ProductRow[] }
 */
app.get("/make-server-8a4cb832/products", async (c) => {
  try {
    const db = adminClient();
    const { data, error } = await db
      .from("products")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Products GET error:", error.message);
      return c.json({ products: PRODUCTS, fallback: true });
    }

    if (!data || data.length === 0) {
      // Table is empty — auto-seed and return in-memory list
      console.log("Products table is empty — auto-seeding");
      const rows = PRODUCTS.map(p => ({
        id: p.id, name: p.name, description: p.description ?? null,
        price: p.price, image: p.image ?? null, category: p.category ?? null,
        subcategory: p.subcategory ?? null, popular: p.popular ?? false,
        active: true, detail_id: (p as any).detailId ?? null,
      }));
      await db.from("products").upsert(rows, { onConflict: "id" });
      return c.json({ products: PRODUCTS, seeded: true });
    }

    return c.json({ products: data });
  } catch (err) {
    return c.json({ error: "Error fetching products: " + String(err) }, 500);
  }
});

// ── Iniciar servidor ──────────────────────────────────────────────────────────

Deno.serve(app.fetch);
