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
    id: 'pizza-americana',
    name: 'Pizza Americana',
    description: 'Pizza americana con masa artesanal, queso mozzarella y jamón seleccionado',
    image: 'https://images.rappi.pe/products/832b8fba-9420-4567-937a-1b94cc879441-1747724658545.png?d=600x600&e=webp',
    category: 'pizza',
    ingredients: [
      'Masa artesanal tradicional',
      'Salsa de tomate casera',
      'Queso mozzarella',
      'Jamón ahumado',
      'Orégano',
    ],
    sizes: [
      { id: 'small',  name: 'Personal', diameter: '25cm', slices: 4, price: 12.00 },
      { id: 'medium', name: 'Grande',   diameter: '30cm', slices: 6, price: 25.90 },
      { id: 'large',  name: 'Familiar', diameter: '35cm', slices: 8, price: 35.90 },
    ],
    allergens: ['Gluten', 'Lácteos'],
    nutritionalInfo: { calories: 270, protein: 13, carbs: 33, fat: 10 },
  },
  {
    id: 'pizza-pepperoni-detail',
    name: 'Pizza Pepperoni',
    description: 'Pizza con generoso pepperoni sobre masa tradicional y queso mozzarella derretido',
    image: 'https://images.rappi.pe/products/1560b4e5-3468-4b31-804b-9657b4aa3d72-1747724630621.png?d=600x600&e=webp',
    category: 'pizza',
    ingredients: [
      'Masa tradicional artesanal',
      'Salsa de tomate',
      'Queso mozzarella',
      'Pepperoni premium',
      'Orégano',
    ],
    sizes: [
      { id: 'small',  name: 'Personal', diameter: '25cm', slices: 4, price: 12.00 },
      { id: 'medium', name: 'Grande',   diameter: '30cm', slices: 6, price: 25.90 },
      { id: 'large',  name: 'Familiar', diameter: '35cm', slices: 8, price: 35.90 },
    ],
    allergens: ['Gluten', 'Lácteos'],
    nutritionalInfo: { calories: 298, protein: 14, carbs: 32, fat: 13 },
  },
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
  // Bases — masa de pizza
  { id: 'base-classic', name: 'Masa Clásica', category: 'base', price: 0, image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=200&h=200&fit=crop' },
  { id: 'base-thin', name: 'Masa Delgada', category: 'base', price: 0, image: 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=200&h=200&fit=crop' },
  { id: 'base-thick', name: 'Masa Gruesa', category: 'base', price: 2, image: 'https://images.unsplash.com/photo-1593504049359-74330189a345?w=200&h=200&fit=crop' },
  { id: 'base-integral', name: 'Masa Integral', category: 'base', price: 3, image: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=200&h=200&fit=crop' },

  // Salsas — base líquida
  { id: 'sauce-tomato', name: 'Salsa de Tomate', category: 'sauce', price: 0, image: 'https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=200&h=200&fit=crop' },
  { id: 'sauce-bbq', name: 'Salsa BBQ', category: 'sauce', price: 2, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop' },
  { id: 'sauce-cream', name: 'Salsa de Crema', category: 'sauce', price: 2, image: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=200&h=200&fit=crop' },
  { id: 'sauce-pesto', name: 'Salsa Pesto', category: 'sauce', price: 3, image: 'https://images.unsplash.com/photo-1600803907087-f56d462fd26b?w=200&h=200&fit=crop' },

  // Quesos — variedad
  { id: 'cheese-mozzarella', name: 'Mozzarella', category: 'cheese', price: 0, image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=200&h=200&fit=crop' },
  { id: 'cheese-parmesan', name: 'Parmesano', category: 'cheese', price: 3, image: 'https://images.unsplash.com/photo-1582218168559-adadf0f23cf3?w=200&h=200&fit=crop' },
  { id: 'cheese-gorgonzola', name: 'Gorgonzola', category: 'cheese', price: 4, image: 'https://images.unsplash.com/photo-1626957341926-98752fc2ba1e?w=200&h=200&fit=crop' },
  { id: 'cheese-goat', name: 'Queso de Cabra', category: 'cheese', price: 4, image: 'https://images.unsplash.com/photo-1559561853-08451507cbe7?w=200&h=200&fit=crop' },

  // Carnes — proteínas
  { id: 'meat-pepperoni', name: 'Pepperoni', category: 'meat', price: 4, image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=200&h=200&fit=crop' },
  { id: 'meat-ham', name: 'Jamón', category: 'meat', price: 3, image: 'https://images.unsplash.com/photo-1606914501449-5a96b6ce24ca?w=200&h=200&fit=crop' },
  { id: 'meat-bacon', name: 'Tocino', category: 'meat', price: 4, image: 'https://images.unsplash.com/photo-1528607929212-2636ec44253e?w=200&h=200&fit=crop' },
  { id: 'meat-sausage', name: 'Salchicha Italiana', category: 'meat', price: 4, image: 'https://images.unsplash.com/photo-1625944230945-1b7dd3b949ab?w=200&h=200&fit=crop' },
  { id: 'meat-chicken', name: 'Pollo', category: 'meat', price: 4, image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c3?w=200&h=200&fit=crop' },
  { id: 'meat-prosciutto', name: 'Prosciutto', category: 'meat', price: 5, image: 'https://images.unsplash.com/photo-1587486937303-a03f6a8edac1?w=200&h=200&fit=crop' },

  // Vegetales — frescos
  { id: 'veg-mushroom', name: 'Champiñones', category: 'vegetable', price: 2, image: 'https://images.unsplash.com/photo-1552825897-bb25aa3e5e01?w=200&h=200&fit=crop' },
  { id: 'veg-onion', name: 'Cebolla', category: 'vegetable', price: 1, image: 'https://images.unsplash.com/photo-1508747703725-719777637510?w=200&h=200&fit=crop' },
  { id: 'veg-pepper', name: 'Pimientos', category: 'vegetable', price: 2, image: 'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=200&h=200&fit=crop' },
  { id: 'veg-olive', name: 'Aceitunas', category: 'vegetable', price: 2, image: 'https://images.unsplash.com/photo-1609501676813-3f11d5c2b02a?w=200&h=200&fit=crop' },
  { id: 'veg-tomato', name: 'Tomate', category: 'vegetable', price: 2, image: 'https://images.unsplash.com/photo-1546470427-e26264be0b0d?w=200&h=200&fit=crop' },
  { id: 'veg-pineapple', name: 'Piña', category: 'vegetable', price: 2, image: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=200&h=200&fit=crop' },
  { id: 'veg-arugula', name: 'Rúcula', category: 'vegetable', price: 2, image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=200&h=200&fit=crop' },
  { id: 'veg-spinach', name: 'Espinaca', category: 'vegetable', price: 2, image: 'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=200&h=200&fit=crop' },

  // Extras — terminaciones
  { id: 'extra-basil', name: 'Albahaca Fresca', category: 'extra', price: 1, image: 'https://images.unsplash.com/photo-1527792492728-08d07d021a70?w=200&h=200&fit=crop' },
  { id: 'extra-oregano', name: 'Orégano', category: 'extra', price: 0, image: 'https://images.unsplash.com/photo-1583444741671-e9044c8a73c6?w=200&h=200&fit=crop' },
  { id: 'extra-garlic', name: 'Ajo', category: 'extra', price: 1, image: 'https://images.unsplash.com/photo-1508747703725-719777637510?w=200&h=200&fit=crop' },
  { id: 'extra-chili', name: 'Chile', category: 'extra', price: 1, image: 'https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?w=200&h=200&fit=crop' },
];
