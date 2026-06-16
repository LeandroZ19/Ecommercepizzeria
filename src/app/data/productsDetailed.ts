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

/**
 * availableIngredients — Lista local de ingredientes para personalización de pizza.
 *
 * Estas imágenes son URLs reales provistas por el negocio.
 * `meat-prosciutto` y `veg-arugula` han sido eliminados del catálogo.
 *
 * Esta lista se usa como fallback si la carga desde Supabase falla
 * (ver CustomPizza.tsx → useEffect con fetchPizzaIngredients).
 */
export const availableIngredients: Ingredient[] = [
  // ── Bases — masa de pizza ────────────────────────────────────────────────────
  {
    id: 'base-classic',
    name: 'Masa Clásica',
    category: 'base',
    price: 0,
    image: 'https://images.ecestaticos.com/PfcZ_EUaqmnqy_9k6dNdS2356UA=/189x33:1847x1276/1200x899/filters:fill(white):format(jpg)/f.elconfidencial.com%2Foriginal%2F9e0%2F49f%2F953%2F9e049f95341469b90655f40109d0ebe7.jpg',
  },
  {
    id: 'base-thin',
    name: 'Masa Delgada',
    category: 'base',
    price: 0,
    image: 'https://www.aporpizza.es/wp-content/uploads/2019/05/Masa-fina-o-masa-gruesa-fina-1024x640.jpg',
  },
  {
    id: 'base-thick',
    name: 'Masa Gruesa',
    category: 'base',
    price: 2,
    image: 'https://i.ytimg.com/vi/cYLXQ2yUrVk/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLAKmw8jKynwMNWEQLzOhZWcMg4gIw',
  },
  {
    id: 'base-integral',
    name: 'Masa Integral',
    category: 'base',
    price: 3,
    image: 'https://gourmet.iprospect.cl/wp-content/uploads/2012/06/pizza-masa-integral.jpg',
  },

  // ── Salsas — base líquida ────────────────────────────────────────────────────
  {
    id: 'sauce-tomato',
    name: 'Salsa de Tomate',
    category: 'sauce',
    price: 0,
    image: 'https://recetinas.com/wp-content/uploads/2020/03/salsa-de-tomate.jpg',
  },
  {
    id: 'sauce-bbq',
    name: 'Salsa BBQ',
    category: 'sauce',
    price: 2,
    image: 'https://www.aceitesdeolivadeespana.com/wp-content/uploads/2023/07/AdobeStock_271099773-1.jpeg',
  },
  {
    id: 'sauce-cream',
    name: 'Salsa de Crema',
    category: 'sauce',
    price: 2,
    image: 'https://vod-hogarmania.atresmedia.com/hogarmania/images/images01/2013/06/11/5c0019675a2c110001775443/1239x697.jpg',
  },
  {
    id: 'sauce-pesto',
    name: 'Salsa Pesto',
    category: 'sauce',
    price: 3,
    image: 'https://www.cuerpomente.com/medio/2024/02/08/salsa-pesto-receta_263bea85_240208124611_1280x720.jpg',
  },

  // ── Quesos — variedad ────────────────────────────────────────────────────────
  {
    id: 'cheese-mozzarella',
    name: 'Mozzarella',
    category: 'cheese',
    price: 0,
    image: 'https://www.seriouseats.com/thmb/0LrG8tB4BkzQarr2fqrpykcaDBg=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/__opt__aboutcom__coeus__resources__content_migration__serious_eats__seriouseats.com__recipes__images__2015__10__20151017-pies-vicky-wasik-2-6f491edb6065485a86d6af639a592298.jpg',
  },
  {
    id: 'cheese-parmesan',
    name: 'Parmesano',
    category: 'cheese',
    price: 3,
    image: 'https://www.lacasadelqueso.com.ar/wp-content/uploads/2017/08/parmigiano-reggiano.jpg',
  },
  {
    id: 'cheese-gorgonzola',
    name: 'Gorgonzola',
    category: 'cheese',
    price: 4,
    image: 'https://www.lacasadelqueso.com.ar/wp-content/uploads/2017/08/queso-gorgonzola.jpg',
  },
  {
    id: 'cheese-goat',
    name: 'Queso de Cabra',
    category: 'cheese',
    price: 4,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTdSC0GsKi-eIRu6EkbqRnacTtrkFtP9Fa6MA&s',
  },

  // ── Carnes — proteínas (prosciutto eliminado por solicitud del negocio) ───────
  {
    id: 'meat-pepperoni',
    name: 'Pepperoni',
    category: 'meat',
    price: 4,
    image: 'https://www.ctifoods.com/wp-content/uploads/2025/06/pepperoni-liguria-rustico-copy-1.png',
  },
  {
    id: 'meat-ham',
    name: 'Jamón',
    category: 'meat',
    price: 3,
    image: 'https://www.macafri.com/web/image/product.product/1038/image_1024/%5B78621155706003%5D%20Jamon%20de%20pierna%20rebanado%20200%20g?unique=da5fa90',
  },
  {
    id: 'meat-bacon',
    name: 'Tocino',
    category: 'meat',
    price: 4,
    image: 'https://listonic.com/phimageproxy/listonic/products/bacon_bits.webp',
  },
  {
    id: 'meat-sausage',
    name: 'Salchicha Italiana',
    category: 'meat',
    price: 4,
    image: 'https://st2.depositphotos.com/33365862/87754/p/450/depositphotos_877544782-stock-photo-piece-homemade-sausage-isolated-white.png',
  },
  {
    id: 'meat-chicken',
    name: 'Pollo',
    category: 'meat',
    price: 4,
    image: 'https://png.pngtree.com/png-clipart/20250105/original/pngtree-fine-strips-of-shredded-chicken-perfect-for-culinary-recipe-and-food-png-image_20078081.png',
  },

  // ── Vegetales — frescos (rúcula eliminada por solicitud del negocio) ──────────
  {
    id: 'veg-mushroom',
    name: 'Champiñones',
    category: 'vegetable',
    price: 2,
    image: 'https://png.pngtree.com/png-clipart/20250118/original/pngtree-mushrooms-png-image_19928814.png',
  },
  {
    id: 'veg-onion',
    name: 'Cebolla',
    category: 'vegetable',
    price: 1,
    image: 'https://www.lopezcastro.com/wp-content/uploads/cebolla-aros.png',
  },
  {
    id: 'veg-pepper',
    name: 'Pimientos',
    category: 'vegetable',
    price: 2,
    image: 'https://covemed21.es/wp-content/uploads/2025/11/pimientos-3-1024x1024.png',
  },
  {
    id: 'veg-olive',
    name: 'Aceitunas',
    category: 'vegetable',
    price: 2,
    image: 'https://tekla-cbg.s3.eu-west-3.amazonaws.com/images/large/3586000_CBG_RECURSO_fe9301bfa0.png',
  },
  {
    id: 'veg-tomato',
    name: 'Tomate',
    category: 'vegetable',
    price: 2,
    image: 'https://png.pngtree.com/png-clipart/20240306/original/pngtree-fresh-slice-of-tomato-png-image_14526186.png',
  },
  {
    id: 'veg-pineapple',
    name: 'Piña',
    category: 'vegetable',
    price: 2,
    image: 'https://png.pngtree.com/png-clipart/20240921/original/pngtree-pineapple-ring-slices-png-image_16051259.png',
  },
  {
    id: 'veg-spinach',
    name: 'Espinaca',
    category: 'vegetable',
    price: 2,
    image: 'https://static.vecteezy.com/system/resources/previews/010/984/759/non_2x/fresh-green-spinach-leaf-basil-cut-out-png.png',
  },

  // ── Extras — terminaciones ───────────────────────────────────────────────────
  {
    id: 'extra-basil',
    name: 'Albahaca Fresca',
    category: 'extra',
    price: 1,
    image: 'https://www.comato.cl/wp-content/uploads/2024/11/albahaca_comato__-300x300.png',
  },
  {
    id: 'extra-oregano',
    name: 'Orégano',
    category: 'extra',
    price: 0,
    image: 'https://paprimur.es/wp-content/uploads/2024/03/OREGANO.png',
  },
  {
    id: 'extra-garlic',
    name: 'Ajo',
    category: 'extra',
    price: 1,
    image: 'https://bcfoods.com/wp-content/uploads/2025/07/chopped-garlic_web2025.png',
  },
  {
    id: 'extra-chili',
    name: 'Chile',
    category: 'extra',
    price: 1,
    image: 'https://static.vecteezy.com/system/resources/thumbnails/070/053/272/small/vibrant-green-chili-and-sliced-segments-isolated-on-transparent-png.png',
  },
];
