import { Product } from '../context/CartContext';

export type ProductCategory = 'pizza-clasica' | 'pizza-especial' | 'combo' | 'drink' | 'side';

export interface ExtendedProduct extends Product {
  subcategory?: ProductCategory;
  popular?: boolean;
}

export const pizzas: ExtendedProduct[] = [
  // Pizzas Clásicas
  {
    id: 'pizza-1',
    name: 'Margherita',
    description: 'Salsa de tomate, mozzarella fresca, albahaca y aceite de oliva',
    price: 25.90,
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&h=400&fit=crop',
    category: 'pizza',
    subcategory: 'pizza-clasica',
    size: 'medium',
    popular: true,
  },
  {
    id: 'pizza-2',
    name: 'Pepperoni',
    description: 'Salsa de tomate, mozzarella y generoso pepperoni',
    price: 28.90,
    image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&h=400&fit=crop',
    category: 'pizza',
    subcategory: 'pizza-clasica',
    size: 'medium',
    popular: true,
  },
  {
    id: 'pizza-3',
    name: 'Quattro Formaggi',
    description: 'Mozzarella, gorgonzola, parmesano y queso de cabra',
    price: 32.90,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=400&fit=crop',
    category: 'pizza',
    subcategory: 'pizza-clasica',
    size: 'medium',
    popular: true,
  },
  {
    id: 'pizza-4',
    name: 'Hawaiana',
    description: 'Salsa de tomate, mozzarella, jamón y piña',
    price: 27.90,
    image: 'https://www.hola.com/horizon/landscape/a17cd68660e0-pizza-hawaiana-t.jpg?im=Resize=(960),type=downsize',
    category: 'pizza',
    subcategory: 'pizza-clasica',
    size: 'medium',
    popular: true,
  },

  // Pizzas Especiales
  {
    id: 'pizza-5',
    name: 'Prosciutto e Rucola',
    description: 'Mozzarella, prosciutto, rúcula fresca y parmesano',
    price: 38.90,
    image: 'https://images.unsplash.com/photo-1595854341625-f33ee10dbf94?w=600&h=400&fit=crop',
    category: 'pizza',
    subcategory: 'pizza-especial',
    size: 'medium',
    popular: true,
  },
  {
    id: 'pizza-6',
    name: 'Diavola',
    description: 'Salsa picante, mozzarella, salami picante y chile',
    price: 34.90,
    image: 'https://www.carolynscooking.com/wp-content/uploads/2024/02/Pizza-Diavola-7.jpg',
    category: 'pizza',
    subcategory: 'pizza-especial',
    size: 'medium',
  },
  {
    id: 'pizza-7',
    name: 'Trufa Negra',
    description: 'Crema de trufa, mozzarella, champiñones y aceite de trufa',
    price: 45.90,
    image: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=600&h=400&fit=crop',
    category: 'pizza',
    subcategory: 'pizza-especial',
    size: 'medium',
  },
  {
    id: 'pizza-8',
    name: 'Vegetariana Suprema',
    description: 'Pimientos, champiñones, aceitunas, cebolla, tomate y albahaca',
    price: 30.90,
    image: 'https://images.unsplash.com/photo-1511689660979-10d2b1aada49?w=600&h=400&fit=crop',
    category: 'pizza',
    subcategory: 'pizza-especial',
    size: 'medium',
  },
];

export const combos: ExtendedProduct[] = [
  {
    id: 'combo-1',
    name: 'Combo Familiar Clásico',
    description: '2 Pizzas medianas clásicas + 2 Bebidas 1.5L + Pan de Ajo',
    price: 75.00,
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&h=400&fit=crop',
    category: 'pizza',
    subcategory: 'combo',
    popular: true,
  },
  {
    id: 'combo-2',
    name: 'Combo Pareja',
    description: '1 Pizza mediana + 2 Bebidas + 1 Complemento',
    price: 45.00,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=400&fit=crop',
    category: 'pizza',
    subcategory: 'combo',
  },
  {
    id: 'combo-3',
    name: 'Combo Party',
    description: '3 Pizzas grandes + 3 Bebidas 1.5L + Alitas BBQ + Pan de Ajo',
    price: 135.00,
    image: 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=600&h=400&fit=crop',
    category: 'pizza',
    subcategory: 'combo',
    popular: true,
  },
  {
    id: 'combo-4',
    name: 'Combo Personal',
    description: '1 Pizza personal + 1 Bebida + Ensalada',
    price: 32.00,
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&h=400&fit=crop',
    category: 'pizza',
    subcategory: 'combo',
  },
];

export const drinks: ExtendedProduct[] = [
  {
    id: 'drink-1',
    name: 'Coca Cola 1.5L',
    description: 'Bebida gaseosa clásica',
    price: 10.00,
    image: 'https://grupochios.com/wp-content/uploads/2022/02/coca-cola.jpg',
    category: 'drink',
    subcategory: 'drink',
    subcategory: 'drink',
  },
  {
    id: 'drink-2',
    name: 'Sprite 1.5L',
    description: 'Bebida gaseosa de lima-limón',
    price: 10.00,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTsXMILQ5XPv2uRNNm6zjmR_8lbWIieKfaG7A&s',
    category: 'drink',
    subcategory: 'drink',
  },
  {
    id: 'drink-3',
    name: 'Fanta 1.5L',
    description: 'Bebida gaseosa sabor naranja',
    price: 10.00,
    image: 'https://thumbs.dreamstime.com/b/gomel-bielorrusia-febrero-de-bebida-de-fanta-en-una-botella-pl%C3%A1stica-en-un-fondo-negro-86222570.jpg',
    category: 'drink',
    subcategory: 'drink',
  },
  {
    id: 'drink-4',
    name: 'Limonada Casera',
    description: 'Refrescante limonada natural 1L',
    price: 12.00,
    image: 'https://images.getrecipekit.com/20250725094715-como-hacer-limonada.webp?aspect_ratio=1:1&quality=90&',
    category: 'drink',
    subcategory: 'drink',
  },
  {
    id: 'drink-5',
    name: 'Cerveza Artesanal',
    description: 'Cerveza artesanal 500ml',
    price: 18.00,
    image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=600&h=400&fit=crop',
    category: 'drink',
    subcategory: 'drink',
  },
];

export const sides: ExtendedProduct[] = [
  {
    id: 'side-1',
    name: 'Alitas BBQ',
    description: '10 alitas de pollo con salsa BBQ',
    price: 22.90,
    image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=600&h=400&fit=crop',
    category: 'side',
    subcategory: 'side',
    subcategory: 'side',
  },
  {
    id: 'side-2',
    name: 'Alitas Picantes',
    description: '10 alitas de pollo con salsa picante',
    price: 22.90,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQqW2xZDjxHy13PlI1NR5j0YV8xWexdgFbZEQ&s',
    category: 'side',
    subcategory: 'side',
  },
  {
    id: 'side-3',
    name: 'Pan de Ajo',
    description: 'Pan artesanal con mantequilla de ajo y hierbas',
    price: 12.90,
    image: 'https://images.unsplash.com/photo-1573140401552-3fab0b24306f?w=600&h=400&fit=crop',
    category: 'side',
    subcategory: 'side',
  },
  {
    id: 'side-4',
    name: 'Palitos de Mozzarella',
    description: '8 palitos de mozzarella empanizados',
    price: 18.90,
    image: 'https://images.unsplash.com/photo-1531749668029-2db88e4276c7?w=600&h=400&fit=crop',
    category: 'side',
    subcategory: 'side',
  },
  {
    id: 'side-5',
    name: 'Ensalada César',
    description: 'Lechuga romana, crutones, parmesano y aderezo césar',
    price: 16.90,
    image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=600&h=400&fit=crop',
    category: 'side',
    subcategory: 'side',
  },
  {
    id: 'side-6',
    name: 'Tiramisu',
    description: 'Postre italiano clásico con café y mascarpone',
    price: 15.90,
    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&h=400&fit=crop',
    category: 'side',
    subcategory: 'side',
  },
];

export const allProducts = [...pizzas, ...combos, ...drinks, ...sides];
export const popularPizzas = pizzas.filter(p => p.popular);
export const familyCombos = combos;

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
  dayOfWeek?: number; // 0 = Sunday, 1 = Monday, etc.
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
    dayOfWeek: 2, // Tuesday
    details: 'Válido solo los martes. Aplica para pizzas medianas y grandes de la categoría clásicas.',
    terms: [
      'Solo martes',
      'Pizzas clásicas: Margherita, Pepperoni, Hawaiana, Quattro Formaggi',
      'No acumulable con otros descuentos',
      'Válido para delivery y recojo en tienda'
    ],
  },
  {
    id: 'promo-daily-2',
    name: 'Jueves de Combos',
    description: '30% de descuento en todos los combos familiares',
    discount: 30,
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=500&fit=crop',
    validUntil: '2026-12-31',
    type: 'daily',
    dayOfWeek: 4, // Thursday
    details: 'Los jueves disfruta de 30% de descuento en cualquier combo familiar.',
    terms: [
      'Solo jueves',
      'Aplica para todos los combos',
      'Descuento automático',
      'No requiere cupón'
    ],
  },

  // Combos Familiares
  {
    id: 'promo-combo-1',
    name: 'Combo Familiar Clásico',
    description: '2 Pizzas medianas + 2 bebidas 1.5L + 1 complemento',
    discount: 25,
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=500&fit=crop',
    validUntil: '2026-12-31',
    code: 'FAMILIA25',
    type: 'combo',
    details: 'Ahorra S/ 25 con este combo perfecto para compartir en familia.',
    terms: [
      'Incluye 2 pizzas medianas a elección',
      'Incluye 2 bebidas 1.5L',
      'Incluye 1 complemento a elección',
      'Usa el código FAMILIA25'
    ],
  },
  {
    id: 'promo-combo-2',
    name: 'Mega Combo Party',
    description: '3 Pizzas grandes + 3 bebidas + Alitas + Pan de Ajo',
    discount: 35,
    image: 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=800&h=500&fit=crop',
    validUntil: '2026-12-31',
    code: 'PARTY35',
    type: 'combo',
    details: 'Ideal para fiestas y reuniones. Ahorra S/ 35.',
    terms: [
      'Incluye 3 pizzas grandes a elección',
      'Incluye 3 bebidas 1.5L',
      'Incluye Alitas BBQ',
      'Incluye Pan de Ajo',
      'Usa el código PARTY35'
    ],
  },

  // Descuentos por Temporada
  {
    id: 'promo-season-1',
    name: 'Primavera Deliciosa',
    description: '20% en pizzas vegetarianas',
    discount: 20,
    image: 'https://images.unsplash.com/photo-1511689660979-10d2b1aada49?w=800&h=500&fit=crop',
    validUntil: '2026-09-30',
    code: 'PRIMAVERA20',
    type: 'seasonal',
    details: 'Celebra la primavera con 20% en todas nuestras pizzas vegetarianas.',
    terms: [
      'Válido hasta el 30 de septiembre',
      'Solo pizzas vegetarianas',
      'Usa el código PRIMAVERA20',
      'No acumulable'
    ],
  },

  // Cupones
  {
    id: 'promo-coupon-1',
    name: 'Happy Hour',
    description: '20% de descuento de 5pm a 7pm',
    discount: 20,
    image: 'https://images.unsplash.com/photo-1595854341625-f33ee10dbf94?w=800&h=500&fit=crop',
    validUntil: '2026-12-31',
    code: 'HAPPY20',
    type: 'coupon',
    details: 'Disfruta de 20% de descuento en horario feliz.',
    terms: [
      'Válido de 5:00 PM a 7:00 PM',
      'Todos los días',
      'Usa el código HAPPY20',
      'Aplica para todo el menú'
    ],
  },
  {
    id: 'promo-coupon-2',
    name: 'Primera Compra',
    description: '15% de descuento en tu primer pedido',
    discount: 15,
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&h=500&fit=crop',
    validUntil: '2026-12-31',
    code: 'BIENVENIDO15',
    type: 'coupon',
    details: 'Si es tu primera vez con nosotros, obtén 15% de descuento.',
    terms: [
      'Solo para nuevos clientes',
      'Pedido mínimo S/ 40',
      'Usa el código BIENVENIDO15',
      'Válido una sola vez por cliente'
    ],
  },
];
