export interface PizzaSize {
  id: string;
  name: string;
  diameter: string;
  slices: number;
  price: number;
}

export interface DetailedProduct {
  id: string;
  name: string;
  description: string;
  image: string;
  category: 'pizza' | 'drink' | 'side';
  ingredients?: string[];
  sizes?: PizzaSize[];
  basePrice?: number;
  allergens?: string[];
  nutritionalInfo?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export const detailedPizzas: DetailedProduct[] = [
  {
    id: 'pizza-1',
    name: 'Margherita',
    description: 'La clásica pizza napolitana con ingredientes simples pero deliciosos',
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&h=400&fit=crop',
    category: 'pizza',
    ingredients: [
      'Salsa de tomate San Marzano',
      'Mozzarella fresca',
      'Albahaca fresca',
      'Aceite de oliva extra virgen',
      'Sal marina',
    ],
    sizes: [
      { id: 'small', name: 'Personal', diameter: '25cm', slices: 4, price: 18.90 },
      { id: 'medium', name: 'Mediana', diameter: '30cm', slices: 6, price: 25.90 },
      { id: 'large', name: 'Familiar', diameter: '35cm', slices: 8, price: 32.90 },
    ],
    allergens: ['Gluten', 'Lácteos'],
    nutritionalInfo: {
      calories: 266,
      protein: 11,
      carbs: 33,
      fat: 10,
    },
  },
  {
    id: 'pizza-2',
    name: 'Pepperoni',
    description: 'Pizza americana clásica con generosas rodajas de pepperoni',
    image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&h=400&fit=crop',
    category: 'pizza',
    ingredients: [
      'Salsa de tomate',
      'Mozzarella',
      'Pepperoni premium',
      'Orégano',
    ],
    sizes: [
      { id: 'small', name: 'Personal', diameter: '25cm', slices: 4, price: 21.90 },
      { id: 'medium', name: 'Mediana', diameter: '30cm', slices: 6, price: 28.90 },
      { id: 'large', name: 'Familiar', diameter: '35cm', slices: 8, price: 35.90 },
    ],
    allergens: ['Gluten', 'Lácteos'],
    nutritionalInfo: {
      calories: 298,
      protein: 13,
      carbs: 34,
      fat: 13,
    },
  },
  {
    id: 'pizza-3',
    name: 'Quattro Formaggi',
    description: 'Deliciosa combinación de cuatro quesos selectos',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=400&fit=crop',
    category: 'pizza',
    ingredients: [
      'Mozzarella',
      'Gorgonzola',
      'Parmesano',
      'Queso de cabra',
      'Crema de leche',
    ],
    sizes: [
      { id: 'small', name: 'Personal', diameter: '25cm', slices: 4, price: 24.90 },
      { id: 'medium', name: 'Mediana', diameter: '30cm', slices: 6, price: 32.90 },
      { id: 'large', name: 'Familiar', diameter: '35cm', slices: 8, price: 39.90 },
    ],
    allergens: ['Gluten', 'Lácteos'],
    nutritionalInfo: {
      calories: 320,
      protein: 15,
      carbs: 32,
      fat: 16,
    },
  },
  {
    id: 'pizza-4',
    name: 'Hawaiana',
    description: 'La controversia deliciosa: jamón y piña en perfecta armonía',
    image: 'https://www.hola.com/horizon/landscape/a17cd68660e0-pizza-hawaiana-t.jpg?im=Resize=(960),type=downsize',
    category: 'pizza',
    ingredients: [
      'Salsa de tomate',
      'Mozzarella',
      'Jamón ahumado',
      'Piña en trozos',
      'Orégano',
    ],
    sizes: [
      { id: 'small', name: 'Personal', diameter: '25cm', slices: 4, price: 20.90 },
      { id: 'medium', name: 'Mediana', diameter: '30cm', slices: 6, price: 27.90 },
      { id: 'large', name: 'Familiar', diameter: '35cm', slices: 8, price: 34.90 },
    ],
    allergens: ['Gluten', 'Lácteos'],
    nutritionalInfo: {
      calories: 275,
      protein: 12,
      carbs: 35,
      fat: 10,
    },
  },
  {
    id: 'pizza-5',
    name: 'Prosciutto e Rucola',
    description: 'Elegante combinación italiana de prosciutto y rúcula fresca',
    image: 'https://images.unsplash.com/photo-1595854341625-f33ee10dbf94?w=600&h=400&fit=crop',
    category: 'pizza',
    ingredients: [
      'Mozzarella',
      'Prosciutto di Parma',
      'Rúcula fresca',
      'Parmesano en lascas',
      'Aceite de oliva',
      'Tomates cherry',
    ],
    sizes: [
      { id: 'small', name: 'Personal', diameter: '25cm', slices: 4, price: 28.90 },
      { id: 'medium', name: 'Mediana', diameter: '30cm', slices: 6, price: 38.90 },
      { id: 'large', name: 'Familiar', diameter: '35cm', slices: 8, price: 45.90 },
    ],
    allergens: ['Gluten', 'Lácteos'],
    nutritionalInfo: {
      calories: 290,
      protein: 14,
      carbs: 33,
      fat: 12,
    },
  },
  {
    id: 'pizza-6',
    name: 'Diavola',
    description: 'Pizza picante con salami y chiles para los amantes del picante',
    image: 'https://www.carolynscooking.com/wp-content/uploads/2024/02/Pizza-Diavola-7.jpg',
    category: 'pizza',
    ingredients: [
      'Salsa de tomate picante',
      'Mozzarella',
      'Salami picante',
      'Chile fresco',
      'Aceite de chile',
      'Orégano',
    ],
    sizes: [
      { id: 'small', name: 'Personal', diameter: '25cm', slices: 4, price: 25.90 },
      { id: 'medium', name: 'Mediana', diameter: '30cm', slices: 6, price: 34.90 },
      { id: 'large', name: 'Familiar', diameter: '35cm', slices: 8, price: 41.90 },
    ],
    allergens: ['Gluten', 'Lácteos'],
    nutritionalInfo: {
      calories: 305,
      protein: 13,
      carbs: 34,
      fat: 14,
    },
  },
  {
    id: 'pizza-7',
    name: 'Trufa Negra',
    description: 'Pizza gourmet con el exquisito sabor de la trufa negra',
    image: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=600&h=400&fit=crop',
    category: 'pizza',
    ingredients: [
      'Crema de trufa negra',
      'Mozzarella',
      'Champiñones frescos',
      'Aceite de trufa',
      'Parmesano',
      'Tomillo',
    ],
    sizes: [
      { id: 'small', name: 'Personal', diameter: '25cm', slices: 4, price: 35.90 },
      { id: 'medium', name: 'Mediana', diameter: '30cm', slices: 6, price: 45.90 },
      { id: 'large', name: 'Familiar', diameter: '35cm', slices: 8, price: 55.90 },
    ],
    allergens: ['Gluten', 'Lácteos'],
    nutritionalInfo: {
      calories: 310,
      protein: 12,
      carbs: 32,
      fat: 15,
    },
  },
  {
    id: 'pizza-8',
    name: 'Vegetariana Suprema',
    description: 'Explosión de vegetales frescos y coloridos en cada bocado',
    image: 'https://images.unsplash.com/photo-1511689660979-10d2b1aada49?w=600&h=400&fit=crop',
    category: 'pizza',
    ingredients: [
      'Salsa de tomate',
      'Mozzarella',
      'Pimientos de colores',
      'Champiñones',
      'Aceitunas negras',
      'Cebolla morada',
      'Tomate fresco',
      'Albahaca',
    ],
    sizes: [
      { id: 'small', name: 'Personal', diameter: '25cm', slices: 4, price: 22.90 },
      { id: 'medium', name: 'Mediana', diameter: '30cm', slices: 6, price: 30.90 },
      { id: 'large', name: 'Familiar', diameter: '35cm', slices: 8, price: 37.90 },
    ],
    allergens: ['Gluten', 'Lácteos'],
    nutritionalInfo: {
      calories: 245,
      protein: 10,
      carbs: 35,
      fat: 8,
    },
  },
];

export interface Ingredient {
  id: string;
  name: string;
  category: 'base' | 'sauce' | 'cheese' | 'meat' | 'vegetable' | 'extra';
  price: number;
  image?: string;
}

export const availableIngredients: Ingredient[] = [
  // Bases
  { id: 'base-classic', name: 'Masa Clásica', category: 'base', price: 0 },
  { id: 'base-thin', name: 'Masa Delgada', category: 'base', price: 0 },
  { id: 'base-thick', name: 'Masa Gruesa', category: 'base', price: 2 },
  { id: 'base-integral', name: 'Masa Integral', category: 'base', price: 3 },

  // Salsas
  { id: 'sauce-tomato', name: 'Salsa de Tomate', category: 'sauce', price: 0 },
  { id: 'sauce-bbq', name: 'Salsa BBQ', category: 'sauce', price: 2 },
  { id: 'sauce-cream', name: 'Salsa de Crema', category: 'sauce', price: 2 },
  { id: 'sauce-pesto', name: 'Salsa Pesto', category: 'sauce', price: 3 },

  // Quesos
  { id: 'cheese-mozzarella', name: 'Mozzarella', category: 'cheese', price: 0 },
  { id: 'cheese-parmesan', name: 'Parmesano', category: 'cheese', price: 3 },
  { id: 'cheese-gorgonzola', name: 'Gorgonzola', category: 'cheese', price: 4 },
  { id: 'cheese-goat', name: 'Queso de Cabra', category: 'cheese', price: 4 },

  // Carnes
  { id: 'meat-pepperoni', name: 'Pepperoni', category: 'meat', price: 4 },
  { id: 'meat-ham', name: 'Jamón', category: 'meat', price: 3 },
  { id: 'meat-bacon', name: 'Tocino', category: 'meat', price: 4 },
  { id: 'meat-sausage', name: 'Salchicha Italiana', category: 'meat', price: 4 },
  { id: 'meat-chicken', name: 'Pollo', category: 'meat', price: 4 },
  { id: 'meat-prosciutto', name: 'Prosciutto', category: 'meat', price: 5 },

  // Vegetales
  { id: 'veg-mushroom', name: 'Champiñones', category: 'vegetable', price: 2 },
  { id: 'veg-onion', name: 'Cebolla', category: 'vegetable', price: 1 },
  { id: 'veg-pepper', name: 'Pimientos', category: 'vegetable', price: 2 },
  { id: 'veg-olive', name: 'Aceitunas', category: 'vegetable', price: 2 },
  { id: 'veg-tomato', name: 'Tomate', category: 'vegetable', price: 2 },
  { id: 'veg-pineapple', name: 'Piña', category: 'vegetable', price: 2 },
  { id: 'veg-arugula', name: 'Rúcula', category: 'vegetable', price: 2 },
  { id: 'veg-spinach', name: 'Espinaca', category: 'vegetable', price: 2 },

  // Extras
  { id: 'extra-basil', name: 'Albahaca Fresca', category: 'extra', price: 1 },
  { id: 'extra-oregano', name: 'Orégano', category: 'extra', price: 0 },
  { id: 'extra-garlic', name: 'Ajo', category: 'extra', price: 1 },
  { id: 'extra-chili', name: 'Chile', category: 'extra', price: 1 },
];
