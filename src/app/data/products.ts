import { Product } from '../context/CartContext';

export const pizzas: Product[] = [
  // Pizzas Clásicas
  {
    id: 'pizza-1',
    name: 'Margherita',
    description: 'Salsa de tomate, mozzarella fresca, albahaca y aceite de oliva',
    price: 25.90,
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&h=400&fit=crop',
    category: 'pizza',
    size: 'medium',
  },
  {
    id: 'pizza-2',
    name: 'Pepperoni',
    description: 'Salsa de tomate, mozzarella y generoso pepperoni',
    price: 28.90,
    image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&h=400&fit=crop',
    category: 'pizza',
    size: 'medium',
  },
  {
    id: 'pizza-3',
    name: 'Quattro Formaggi',
    description: 'Mozzarella, gorgonzola, parmesano y queso de cabra',
    price: 32.90,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=400&fit=crop',
    category: 'pizza',
    size: 'medium',
  },
  {
    id: 'pizza-4',
    name: 'Hawaiana',
    description: 'Salsa de tomate, mozzarella, jamón y piña',
    price: 27.90,
    image: 'https://www.hola.com/horizon/landscape/a17cd68660e0-pizza-hawaiana-t.jpg?im=Resize=(960),type=downsize',
    category: 'pizza',
    size: 'medium',
  },

  // Pizzas Especiales
  {
    id: 'pizza-5',
    name: 'Prosciutto e Rucola',
    description: 'Mozzarella, prosciutto, rúcula fresca y parmesano',
    price: 38.90,
    image: 'https://images.unsplash.com/photo-1595854341625-f33ee10dbf94?w=600&h=400&fit=crop',
    category: 'pizza',
    size: 'medium',
  },
  {
    id: 'pizza-6',
    name: 'Diavola',
    description: 'Salsa picante, mozzarella, salami picante y chile',
    price: 34.90,
    image: 'https://www.carolynscooking.com/wp-content/uploads/2024/02/Pizza-Diavola-7.jpg',
    category: 'pizza',
    size: 'medium',
  },
  {
    id: 'pizza-7',
    name: 'Trufa Negra',
    description: 'Crema de trufa, mozzarella, champiñones y aceite de trufa',
    price: 45.90,
    image: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=600&h=400&fit=crop',
    category: 'pizza',
    size: 'medium',
  },
  {
    id: 'pizza-8',
    name: 'Vegetariana Suprema',
    description: 'Pimientos, champiñones, aceitunas, cebolla, tomate y albahaca',
    price: 30.90,
    image: 'https://images.unsplash.com/photo-1511689660979-10d2b1aada49?w=600&h=400&fit=crop',
    category: 'pizza',
    size: 'medium',
  },
];

export const drinks: Product[] = [
  {
    id: 'drink-1',
    name: 'Coca Cola 1.5L',
    description: 'Bebida gaseosa clásica',
    price: 10.00,
    image: 'https://grupochios.com/wp-content/uploads/2022/02/coca-cola.jpg',
    category: 'drink',
  },
  {
    id: 'drink-2',
    name: 'Sprite 1.5L',
    description: 'Bebida gaseosa de lima-limón',
    price: 10.00,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTsXMILQ5XPv2uRNNm6zjmR_8lbWIieKfaG7A&s',
    category: 'drink',
  },
  {
    id: 'drink-3',
    name: 'Fanta 1.5L',
    description: 'Bebida gaseosa sabor naranja',
    price: 10.00,
    image: 'https://thumbs.dreamstime.com/b/gomel-bielorrusia-febrero-de-bebida-de-fanta-en-una-botella-pl%C3%A1stica-en-un-fondo-negro-86222570.jpg',
    category: 'drink',
  },
  {
    id: 'drink-4',
    name: 'Limonada Casera',
    description: 'Refrescante limonada natural 1L',
    price: 12.00,
    image: 'https://images.getrecipekit.com/20250725094715-como-hacer-limonada.webp?aspect_ratio=1:1&quality=90&',
    category: 'drink',
  },
  {
    id: 'drink-5',
    name: 'Cerveza Artesanal',
    description: 'Cerveza artesanal 500ml',
    price: 18.00,
    image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=600&h=400&fit=crop',
    category: 'drink',
  },
];

export const sides: Product[] = [
  {
    id: 'side-1',
    name: 'Alitas BBQ',
    description: '10 alitas de pollo con salsa BBQ',
    price: 22.90,
    image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=600&h=400&fit=crop',
    category: 'side',
  },
  {
    id: 'side-2',
    name: 'Alitas Picantes',
    description: '10 alitas de pollo con salsa picante',
    price: 22.90,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQqW2xZDjxHy13PlI1NR5j0YV8xWexdgFbZEQ&s',
    category: 'side',
  },
  {
    id: 'side-3',
    name: 'Pan de Ajo',
    description: 'Pan artesanal con mantequilla de ajo y hierbas',
    price: 12.90,
    image: 'https://images.unsplash.com/photo-1573140401552-3fab0b24306f?w=600&h=400&fit=crop',
    category: 'side',
  },
  {
    id: 'side-4',
    name: 'Palitos de Mozzarella',
    description: '8 palitos de mozzarella empanizados',
    price: 18.90,
    image: 'https://images.unsplash.com/photo-1531749668029-2db88e4276c7?w=600&h=400&fit=crop',
    category: 'side',
  },
  {
    id: 'side-5',
    name: 'Ensalada César',
    description: 'Lechuga romana, crutones, parmesano y aderezo césar',
    price: 16.90,
    image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=600&h=400&fit=crop',
    category: 'side',
  },
  {
    id: 'side-6',
    name: 'Tiramisu',
    description: 'Postre italiano clásico con café y mascarpone',
    price: 15.90,
    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&h=400&fit=crop',
    category: 'side',
  },
];

export const allProducts = [...pizzas, ...drinks, ...sides];

export interface Promotion {
  id: string;
  name: string;
  description: string;
  discount: number;
  image: string;
  validUntil: string;
  code?: string;
}

export const promotions: Promotion[] = [
  {
    id: 'promo-1',
    name: 'Combo Familiar',
    description: '2 Pizzas medianas + 2 bebidas 1.5L + 1 complemento',
    discount: 25,
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=500&fit=crop',
    validUntil: '2026-04-30',
    code: 'FAMILIA25',
  },
  {
    id: 'promo-2',
    name: 'Martes de Pizza',
    description: '2x1 en todas las pizzas clásicas',
    discount: 50,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=500&fit=crop',
    validUntil: '2026-04-30',
  },
  {
    id: 'promo-3',
    name: 'Happy Hour',
    description: '20% de descuento de 5pm a 7pm',
    discount: 20,
    image: 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=800&h=500&fit=crop',
    validUntil: '2026-04-30',
    code: 'HAPPY20',
  },
];
