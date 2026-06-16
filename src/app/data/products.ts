/**
 * products.ts — Catálogo completo de productos de RapiPizza.
 *
 * Estructura de secciones (según menú real):
 * - Combo Rapilover      (4 combos)
 * - Promo Ame y Peppe    (2 pizzas)
 * - Promo Rapilover      (4 promos)
 * - Pizza Personal       (1 producto)
 * - Pizza Doble          (1 producto)
 * - Combos 6 Porciones   (6 combos)
 * - Promos 8 Porciones   (7 promos)
 * - Promos Extremas      (2 promos)
 * - Complementos         (3 productos)
 *
 * También exporta: popularPizzas, familyCombos (usados en la Home),
 * promotions (usados en la página de Promociones).
 */

import { Product } from '../context/CartContext';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type ProductCategory =
  | 'combo-rapilover'
  | 'promo-ame-peppe'
  | 'promo-rapilover'
  | 'pizza-personal'
  | 'pizza-doble'
  | 'combo-6'
  | 'promo-8'
  | 'promo-extrema'
  | 'complemento'
  /** Bebidas (gaseosas, jugos, artesanales) */
  | 'drink';

export interface ExtendedProduct extends Product {
  /** Sección del menú a la que pertenece */
  subcategory?: ProductCategory;
  /** Si aparece en el carrusel de populares de la Home */
  popular?: boolean;
  /**
   * ID del producto en productsDetailed.ts para mostrar la página de detalles.
   * Si está presente, el botón "Ver Detalles" apuntará a /producto/:detailId
   */
  detailId?: string;
}

// ─── Imágenes reales de Rappi ─────────────────────────────────────────────────
// URLs oficiales del menú de RapiPizza en Rappi

const R = 'https://images.rappi.pe/products/';
const IMG = {
  // Combo Rapilover
  comboRapilover:          `${R}c0e14f36-76b2-4d70-a8eb-ea0583db26bd.png?d=600x600&e=webp`,
  comboPizzaDoble:         `${R}9107faff-6bb2-4202-885f-540d023a040e-1747002097125.png?d=600x600&e=webp`,
  comboCompartir:          `${R}42cf7930-4656-42f5-b286-7dd8030d1396-1747001856436.png?d=600x600&e=webp`,
  combo4u:                 `${R}bf521e04-7f16-4fb4-b7d3-fb382f6d580e.png?d=600x600&e=webp`,
  // Promo Ame y Peppe
  pizzaAmericana:          `${R}832b8fba-9420-4567-937a-1b94cc879441-1747724658545.png?d=600x600&e=webp`,
  pizzaPepperoni:          `${R}1560b4e5-3468-4b31-804b-9657b4aa3d72-1747724630621.png?d=600x600&e=webp`,
  // Promo Rapilover
  promoFamiliar:           `${R}ab9a63fc-b0ba-4381-8e9b-e0a4da83baf8-1747002789734.png?d=600x600&e=webp`,
  promoTriClasico:         `${R}50133948-3489-4415-ae60-4301ba3911d2.png?d=600x600&e=webp`,
  promoFamiliarX2:         `${R}370006fd-a9e2-4bd9-bced-0ce573a8d081.png?d=600x600&e=webp`,
  promoTridenteSupremo:    `${R}3a83e773-e011-4f2f-8366-d8c2f1f27c80.png?d=600x600&e=webp`,
  // Pizza Personal y Doble
  pizzaPersonal:           `${R}320841f3-8f3a-4e6b-8c74-e6d0ee336e74-1749449497711.png?d=600x600&e=webp`,
  pizzaDoble:              `${R}f49eb908-16a7-4553-af0a-1b0df3981ee7.png?d=600x600&e=webp`,
  // Combos 6 Porciones
  combo6_1:                `${R}984d9bdb-b433-4821-b832-9073292e1e85-1747002692474.png?d=600x600&e=webp`,
  combo6_2:                `${R}1933ab84-ab18-47d8-823d-a6d5fab2cf43-1747006638560.png?d=600x600&e=webp`,
  combo6_3:                `${R}9107faff-6bb2-4202-885f-540d023a040e-1747002097125.png?d=600x600&e=webp`,
  combo6_4:                `${R}42cf7930-4656-42f5-b286-7dd8030d1396-1747001856436.png?d=600x600&e=webp`,
  combo6_5:                `${R}ec21b73d-1183-4a2f-ae4d-0f39700cb60d-1747002490408.png?d=600x600&e=webp`,
  combo6_6:                `${R}d401dbdc-fc1f-4582-a36c-d8cefca6803e-1747002433139.png?d=600x600&e=webp`,
  // Promos 8 Porciones
  promo8_1:                `${R}ab9a63fc-b0ba-4381-8e9b-e0a4da83baf8-1747002789734.png?d=600x600&e=webp`,
  promo8_2:                `${R}a440c439-c1d4-496f-8d12-4605a974dd7b-1747002914032.png?d=600x600&e=webp`,
  promo8_3:                `${R}e9949501-c241-4431-97ba-a5a349204cbc-1747002964338.png?d=600x600&e=webp`,
  promo8_4:                `${R}d9352c4f-5f86-4cf8-b852-bd3563bcca4e-1747003044407.png?d=600x600&e=webp`,
  promo8_5:                `${R}49756c04-9df9-418b-8376-423416b4eb0c-1747003074329.png?d=600x600&e=webp`,
  promo8_6:                `${R}a83dc137-75f9-4ce8-a3fb-8dbf29b90f35-1747003109877.png?d=600x600&e=webp`,
  promo8_7:                `${R}625b75c5-d5e7-40cb-b61e-d23cad5a7a7c-1747003183340.png?d=600x600&e=webp`,
  // Promos Extremas
  extreme1:                `${R}862a7e98-31ad-4e30-9664-9f2b2eb233bc.jpeg?d=600x600&e=webp`,
  extreme2:                `${R}b85a3f6a-395b-469f-93e3-94988b511545.jpeg?d=600x600&e=webp`,
  // Complementos
  panAjoTrad:              `${R}gp_sides_otra_pan_al_ajo_n.png?d=600x600&e=webp`,
  panAjoEsp:               `${R}f72ad1e4-adf7-4ae9-b50e-d1353ffa018b.jpeg?d=600x600&e=webp`,
  crema:                   `${R}792a436e-8dc1-422f-87c5-d5abfc8e7b3c-1749448057134.png?d=600x600&e=webp`,
};

// ─── Combo Rapilover ──────────────────────────────────────────────────────────

export const comboRapilover: ExtendedProduct[] = [
  {
    id: 'rapilover-1',
    name: 'Combo Rapilover',
    description: 'Pizza americana grande con pan al ajo (4 panecillos) y Pepsi 1lt',
    price: 41.90,
    image: IMG.comboRapilover,
    category: 'pizza',
    subcategory: 'combo-rapilover',
    popular: true,
  },
  {
    id: 'rapilover-2',
    name: 'Combo Pizza Doble',
    description: 'Dos pizzas grandes cualquier sabor y Pepsi 1lt',
    price: 56.90,
    image: IMG.comboPizzaDoble,
    category: 'pizza',
    subcategory: 'combo-rapilover',
    popular: true,
  },
  {
    id: 'rapilover-3',
    name: 'Combo Rapilover para Compartir',
    description: 'Combo de 3 pizzas grandes: americana o pepperoni, acompañado de una Pepsi de 1 litro',
    price: 70.90,
    image: IMG.comboCompartir,
    category: 'pizza',
    subcategory: 'combo-rapilover',
    popular: true,
  },
  {
    id: 'rapilover-4',
    name: 'Combo Rapilover 4U Para Ti',
    description: '4 Pizzas grandes cualquier sabor y Pepsi 1lt',
    price: 98.90,
    image: IMG.combo4u,
    category: 'pizza',
    subcategory: 'combo-rapilover',
  },
];

// ─── Promo Ame y Peppe ────────────────────────────────────────────────────────

export const promoAmePeppe: ExtendedProduct[] = [
  {
    id: 'ame-peppe-1',
    name: 'Pizza Americana',
    description: 'Pizza americana con masa artesanal, queso mozzarella y jamón',
    price: 25.90,
    image: IMG.pizzaAmericana,
    category: 'pizza',
    subcategory: 'promo-ame-peppe',
    popular: true,
    detailId: 'pizza-americana',
  },
  {
    id: 'ame-peppe-2',
    name: 'Pizza Pepperoni',
    description: 'Pizza con queso mozzarella y pepperoni sobre masa tradicional',
    price: 25.90,
    image: IMG.pizzaPepperoni,
    category: 'pizza',
    subcategory: 'promo-ame-peppe',
    popular: true,
    detailId: 'pizza-pepperoni-detail',
  },
];

// ─── Promo Rapilover ──────────────────────────────────────────────────────────

export const promoRapilover: ExtendedProduct[] = [
  {
    id: 'promo-rap-1',
    name: 'Promo Rapilover Familiar',
    description: 'Pizza americana familiar con pan al ajo (8 panecillos) con Inca Kola o Coca Cola 1.5lt',
    price: 52.90,
    image: IMG.promoFamiliar,
    category: 'pizza',
    subcategory: 'promo-rapilover',
    popular: true,
  },
  {
    id: 'promo-rap-2',
    name: 'Promo Rapilover Tri Clásico',
    description: '3 Pizzas familiares clásicas con pepperoni y jamón',
    price: 79.90,
    image: IMG.promoTriClasico,
    category: 'pizza',
    subcategory: 'promo-rapilover',
  },
  {
    id: 'promo-rap-3',
    name: 'Promo Rapilover Familiar x2',
    description: '2 Pizzas familiares (cualquier sabor) con pan al ajo (8 panecillos) con Inca Kola o Coca Cola 1.5lt',
    price: 84.90,
    image: IMG.promoFamiliarX2,
    category: 'pizza',
    subcategory: 'promo-rapilover',
  },
  {
    id: 'promo-rap-4',
    name: 'Promo Tridente Supremo',
    description: '3 Pizzas familiares cualquier sabor con Inca Kola o Coca Cola 1.5lt',
    price: 95.90,
    image: IMG.promoTridenteSupremo,
    category: 'pizza',
    subcategory: 'promo-rapilover',
  },
];

// ─── Pizza Personal ───────────────────────────────────────────────────────────

export const pizzaPersonal: ExtendedProduct[] = [
  {
    id: 'personal-1',
    name: 'Pizza Personal Cualquier Sabor',
    description: 'Pizza personal a elegir entre: americana, pepperoni, hawaiana, vegetariana, pepperoni especial, carnívora, mixta, alemana y carnívora tropical',
    price: 12.00,
    image: IMG.pizzaPersonal,
    category: 'pizza',
    subcategory: 'pizza-personal',
    popular: true,
  },
];

// ─── Pizza Doble ──────────────────────────────────────────────────────────────

export const pizzaDoble: ExtendedProduct[] = [
  {
    id: 'doble-1',
    name: 'Pizzas Clásicas x2',
    description: 'Disfruta de 2 pizzas clásicas grandes o familiares: americana, pepperoni o hawaiana',
    price: 46.90,
    image: IMG.pizzaDoble,
    category: 'pizza',
    subcategory: 'pizza-doble',
  },
];

// ─── Combos de 6 Porciones ────────────────────────────────────────────────────

export const combos6: ExtendedProduct[] = [
  {
    id: 'combo6-1',
    name: 'Combo 1',
    description: 'Pizza americana grande, pan al ajo (4 panecillos) y Pepsi 1lt',
    price: 39.90,
    image: IMG.combo6_1,
    category: 'pizza',
    subcategory: 'combo-6',
    popular: true,
  },
  {
    id: 'combo6-2',
    name: 'Combo 2',
    description: 'Dos pizzas grandes: pepperoni y americana',
    price: 48.90,
    image: IMG.combo6_2,
    category: 'pizza',
    subcategory: 'combo-6',
  },
  {
    id: 'combo6-3',
    name: 'Combo 3',
    description: 'Dos pizzas grandes cualquier sabor y Pepsi 1lt',
    price: 55.90,
    image: IMG.combo6_3,
    category: 'pizza',
    subcategory: 'combo-6',
  },
  {
    id: 'combo6-4',
    name: 'Combo 4',
    description: 'Tres pizzas grandes: dos de americana y una de pepperoni, con Pepsi de 1 litro',
    price: 64.90,
    image: IMG.combo6_4,
    category: 'pizza',
    subcategory: 'combo-6',
  },
  {
    id: 'combo6-5',
    name: 'Combo 5',
    description: 'Pizza grande cualquier sabor, pan al ajo (4 panecillos) y Pepsi 1lt',
    price: 43.90,
    image: IMG.combo6_5,
    category: 'pizza',
    subcategory: 'combo-6',
  },
  {
    id: 'combo6-6',
    name: 'Combo 6',
    description: 'Cuatro pizzas grandes de cualquier sabor y una Pepsi de 1 litro',
    price: 92.90,
    image: IMG.combo6_6,
    category: 'pizza',
    subcategory: 'combo-6',
  },
];

// ─── Promociones de 8 Porciones ───────────────────────────────────────────────

export const promos8: ExtendedProduct[] = [
  {
    id: 'promo8-1',
    name: 'Promo 1',
    description: 'Pizza americana familiar, pan al ajo (8 panecillos) con Inca Cola o Coca Cola 1.5lt',
    price: 51.90,
    image: IMG.promo8_1,
    category: 'pizza',
    subcategory: 'promo-8',
    popular: true,
  },
  {
    id: 'promo8-2',
    name: 'Promo 2',
    description: 'Dos pizzas familiares: una con pepperoni y otra con pepperoni y carne',
    price: 64.00,
    image: IMG.promo8_2,
    category: 'pizza',
    subcategory: 'promo-8',
  },
  {
    id: 'promo8-3',
    name: 'Promo 3',
    description: 'Tres pizzas familiares clásicas con pepperoni',
    price: 77.00,
    image: IMG.promo8_3,
    category: 'pizza',
    subcategory: 'promo-8',
  },
  {
    id: 'promo8-4',
    name: 'Promo 4',
    description: 'Pizza especial familiar, pan al ajo (8 panecillos) con Inca Cola o Coca Cola 1.5lt',
    price: 55.90,
    image: IMG.promo8_4,
    category: 'pizza',
    subcategory: 'promo-8',
  },
  {
    id: 'promo8-5',
    name: 'Promo 5',
    description: 'Dos pizzas familiares: americana o pepperoni, con Inca Kola o Coca Cola de 1.5 litros',
    price: 71.90,
    image: IMG.promo8_5,
    category: 'pizza',
    subcategory: 'promo-8',
  },
  {
    id: 'promo8-6',
    name: 'Promo 6',
    description: 'Dos pizzas familiares especiales, pan al ajo (8 panecillos) y bebida de 1.5lt (Inca Kola o Coca Cola)',
    price: 84.90,
    image: IMG.promo8_6,
    category: 'pizza',
    subcategory: 'promo-8',
  },
  {
    id: 'promo8-7',
    name: 'Promo 7',
    description: 'Tres pizzas familiares cualquier sabor con Inca Cola o Coca Cola 1.5lt',
    price: 96.90,
    image: IMG.promo8_7,
    category: 'pizza',
    subcategory: 'promo-8',
  },
];

// ─── Promociones Extremas ─────────────────────────────────────────────────────

export const promosExtremas: ExtendedProduct[] = [
  {
    id: 'extreme-1',
    name: 'Promo Extrema 1',
    description: 'Pizza extrema (8 ingredientes y extra queso) de 8 porciones, pan al ajo (8 panecillos), Inca Cola o Coca Cola',
    price: 59.90,
    image: IMG.extreme1,
    category: 'pizza',
    subcategory: 'promo-extrema',
    popular: true,
  },
  {
    id: 'extreme-2',
    name: 'Promo Extrema 2',
    description: 'Dos pizzas extremas (8 ingredientes y extra queso) de 8 porciones, pan al ajo (8 panecillos), Inca Kola o Coca Cola 1.5lt',
    price: 88.90,
    image: IMG.extreme2,
    category: 'pizza',
    subcategory: 'promo-extrema',
  },
];

// ─── Complementos ─────────────────────────────────────────────────────────────

export const complementos: ExtendedProduct[] = [
  {
    id: 'comp-1',
    name: 'Pan al Ajo Tradicional',
    description: 'Pan artesanal con mantequilla al ajo (8 panecillos)',
    price: 10.90,
    image: IMG.panAjoTrad,
    category: 'side',
    subcategory: 'complemento',
    popular: true,
  },
  {
    id: 'comp-2',
    name: 'Pan al Ajo Especial',
    description: 'Pan artesanal con mantequilla al ajo, queso cheddar y 100g de queso mozzarella (8 panecillos)',
    price: 15.90,
    image: IMG.panAjoEsp,
    category: 'side',
    subcategory: 'complemento',
  },
  {
    id: 'comp-3',
    name: 'Crema Rapipizza',
    description: '2 tapecitos extra de crema de rocoto',
    price: 3.00,
    image: IMG.crema,
    category: 'side',
    subcategory: 'complemento',
  },
];

// ─── Bebidas ──────────────────────────────────────────────────────────────────

/**
 * bebidas — Catálogo de bebidas disponibles (gaseosas y artesanales).
 * Imágenes provistas por el negocio (URLs reales del proveedor).
 */
export const bebidas: ExtendedProduct[] = [
  {
    id: 'drink-pepsi-1-5l',
    name: 'Pepsi 1.5L',
    description: 'Bebida gaseosa Pepsi refrescante',
    price: 5.50,
    image: 'https://algomaracucho.pe/70-thickbox_default/pepsi-15-litros.jpg',
    category: 'drink',
    subcategory: 'drink',
    popular: false,
  },
  {
    id: 'drink-coca-1-5l',
    name: 'Coca Cola 1.5L',
    description: 'La bebida mas popular del mundo',
    price: 7.50,
    image: 'https://fonowaska.com/wp-content/uploads/2023/11/Coca-Cola-1.5Lt-1.jpg',
    category: 'drink',
    subcategory: 'drink',
    popular: false,
  },
  {
    id: 'drink-inca-1-5l',
    name: 'Inca Cola 1.5L',
    description: 'La bebida de sabor nacional',
    price: 6.90,
    image: 'https://tofuu.getjusto.com/orioneat-local/resized2/wTwwxkNAZfqbXeabW-800-x.webp',
    category: 'drink',
    subcategory: 'drink',
    popular: false,
  },
  {
    id: 'drink-chicha-1-5l',
    name: 'Chicha Morada 1.5L',
    description: 'Refrescante chicha morada artesanal',
    price: 16.90,
    image: 'https://tofuu.getjusto.com/orioneat-local/resized2/GSvs9QzhNZPwFduu5-300-x.webp',
    category: 'drink',
    subcategory: 'drink',
    popular: false,
  },
  {
    id: 'drink-limonada-1-5l',
    name: 'Limonada 1.5L',
    description: 'Limonada fresca de la casa',
    price: 16.90,
    image: 'https://tofuu.getjusto.com/orioneat-local/resized2/JnTGXThFck6FZ2Yj9-300-x.webp',
    category: 'drink',
    subcategory: 'drink',
    popular: false,
  },
];

// ─── Exports de conveniencia ──────────────────────────────────────────────────

/** Todos los productos del menú */
export const allProducts: ExtendedProduct[] = [
  ...comboRapilover,
  ...promoAmePeppe,
  ...promoRapilover,
  ...pizzaPersonal,
  ...pizzaDoble,
  ...combos6,
  ...promos8,
  ...promosExtremas,
  ...complementos,
  ...bebidas,
];

/** Pizzas más pedidas para el carrusel de la Home */
export const popularPizzas: ExtendedProduct[] = allProducts.filter(p => p.popular);

/** Combos familiares para el carrusel de la Home */
export const familyCombos: ExtendedProduct[] = [
  ...comboRapilover,
  ...promoRapilover,
].filter(p => p.popular);

// ─── Tipado legacy (para compatibilidad con páginas existentes) ───────────────

/** @deprecated usar allProducts directamente */
export const pizzas = [...promoAmePeppe, ...pizzaPersonal, ...pizzaDoble];
/** @deprecated usar allProducts directamente */
export const combos = [...comboRapilover, ...promoRapilover, ...combos6];
/** @deprecated usar allProducts directamente */
export const sides = complementos;
/** @deprecated usar bebidas o allProducts directamente */
export const drinks: ExtendedProduct[] = bebidas;

// ─── Promociones (para la página de Promociones) ──────────────────────────────

export interface Promotion {
  id: string;
  name: string;
  description: string;
  discount: number;
  image: string;
  validUntil: string;
  code?: string;
  type: 'daily' | 'combo' | 'seasonal' | 'coupon';
  details?: string;
  terms?: string[];
  dayOfWeek?: number;
}

export const promotions: Promotion[] = [
  // Ofertas del Día
  {
    id: 'promo-daily-1',
    name: 'Martes de Pizza 2x1',
    description: '2x1 en todas las pizzas clásicas',
    discount: 50,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=500&fit=crop',
    validUntil: '2026-12-31',
    type: 'daily',
    dayOfWeek: 2,
    details: 'Válido solo los martes. Aplica para pizzas medianas y grandes de la categoría clásicas.',
    terms: [
      'Solo martes',
      'Pizzas americana y pepperoni',
      'No acumulable con otros descuentos',
      'Válido para delivery y recojo en tienda',
    ],
  },
  {
    id: 'promo-daily-2',
    name: 'Jueves de Combos',
    description: '30% de descuento en todos los combos Rapilover',
    discount: 30,
    image: IMG.combo,
    validUntil: '2026-12-31',
    type: 'daily',
    dayOfWeek: 4,
    details: 'Los jueves disfruta de 30% de descuento en cualquier combo Rapilover.',
    terms: [
      'Solo jueves',
      'Aplica para todos los combos Rapilover',
      'Descuento automático',
      'No requiere cupón',
    ],
  },
  // Combos Especiales
  {
    id: 'promo-combo-1',
    name: 'Combo Rapilover para Compartir',
    description: '3 pizzas grandes: americana o pepperoni + Pepsi 1lt',
    discount: 20,
    image: IMG.triple,
    validUntil: '2026-12-31',
    code: 'FAMILIA25',
    type: 'combo',
    details: 'El combo perfecto para compartir con familia o amigos.',
    terms: [
      'Incluye 3 pizzas grandes a elección',
      'Incluye Pepsi 1lt',
      'Usa el código FAMILIA25',
    ],
  },
  // Cupones
  {
    id: 'promo-coupon-1',
    name: 'Happy Hour',
    description: '20% de descuento de 5pm a 7pm',
    discount: 20,
    image: IMG.pepperoni,
    validUntil: '2026-12-31',
    code: 'HAPPY20',
    type: 'coupon',
    details: 'Disfruta de 20% de descuento en horario feliz.',
    terms: [
      'Válido de 5:00 PM a 7:00 PM',
      'Todos los días',
      'Usa el código HAPPY20',
      'Aplica para todo el menú',
    ],
  },
  {
    id: 'promo-coupon-2',
    name: 'Primera Compra',
    description: '15% de descuento en tu primer pedido',
    discount: 15,
    image: IMG.americana,
    validUntil: '2026-12-31',
    code: 'PRIMERA',
    type: 'coupon',
    details: 'Si es tu primera vez con nosotros, obtén 15% de descuento.',
    terms: [
      'Solo para nuevos clientes',
      'Usa el código PRIMERA',
      'Válido una sola vez por cliente',
    ],
  },
  {
    id: 'promo-coupon-3',
    name: 'Descuento Especial',
    description: '10% de descuento en cualquier pedido',
    discount: 10,
    image: IMG.pizza,
    validUntil: '2026-12-31',
    code: 'PROMO10',
    type: 'coupon',
    details: '10% de descuento aplicable a cualquier pedido del menú.',
    terms: [
      'Aplica para todo el menú',
      'Usa el código PROMO10',
      'No acumulable con otras ofertas',
    ],
  },
];
