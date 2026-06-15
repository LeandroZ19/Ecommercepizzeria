/**
 * CustomPizza — Página del creador de pizza personalizada.
 *
 * El usuario construye su pizza paso a paso:
 *  1. Tamaño (Personal / Mediana / Familiar)
 *  2. Masa (selección única con imagen)
 *  3. Salsa (selección única con imagen)
 *  4. Queso (selección única con imagen)
 *  5. Toppings (selección múltiple con control de CANTIDAD 1–3)
 *
 * La vista previa de la derecha se actualiza en tiempo real mostrando
 * imágenes reales de cada ingrediente sobre la pizza SVG.
 *
 * El panel de resumen es colapsable en móvil para aprovechar la pantalla.
 */

import { motion } from 'motion/react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { availableIngredients, type Ingredient, type PizzaSize } from '../data/productsDetailed';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createCustomPizza } from '../../../utils/supabase/db';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ArrowLeft, Check, Plus, Minus, X, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import PizzaPreview, { type ToppingEntry } from '../components/PizzaPreview';

// ─── Datos de tamaños ─────────────────────────────────────────────────────────

/** Opciones de tamaño disponibles con precio base */
const pizzaSizes: PizzaSize[] = [
  { id: 'small',  name: 'Personal', diameter: '25cm', slices: 4, price: 15.00 },
  { id: 'medium', name: 'Mediana',  diameter: '30cm', slices: 6, price: 20.00 },
  { id: 'large',  name: 'Familiar', diameter: '35cm', slices: 8, price: 25.00 },
];

/** Cantidad máxima permitida por topping */
const MAX_QTY = 12;

// ─── Sub-componentes internos ─────────────────────────────────────────────────

/**
 * IngredientCard — Tarjeta de selección única para masa, salsa o queso.
 * Muestra imagen cuadrada del ingrediente, nombre y precio adicional.
 */
function IngredientCard({
  ingredient,
  selected,
  onClick,
}: {
  ingredient: Ingredient;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      aria-label={`${ingredient.name}${ingredient.price > 0 ? `, +S/ ${ingredient.price.toFixed(2)}` : ', incluido'}`}
      className={`relative flex flex-col items-center gap-2 p-2.5 rounded-xl border-2 transition-all text-center focus:outline-none focus:ring-2 focus:ring-primary/50 ${
        selected
          ? 'border-primary bg-primary/5 shadow-md'
          : 'border-border hover:border-primary/40 hover:bg-muted/30'
      }`}
    >
      {/* Indicador de selección */}
      {selected && (
        <div className="absolute -top-2 -right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-sm">
          <Check className="w-3 h-3 text-white" aria-hidden="true" />
        </div>
      )}

      {/* Foto del ingrediente */}
      <div className="w-full aspect-square rounded-lg overflow-hidden border border-border bg-muted">
        {ingredient.image ? (
          <img
            src={ingredient.image}
            alt={ingredient.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">🍕</div>
        )}
      </div>

      {/* Nombre */}
      <span className="text-xs font-semibold leading-tight">{ingredient.name}</span>

      {/* Precio */}
      {ingredient.price > 0 ? (
        <span className="text-xs text-primary font-bold">+S/ {ingredient.price.toFixed(2)}</span>
      ) : (
        <span className="text-xs text-muted-foreground">Incluido</span>
      )}
    </button>
  );
}

/**
 * ToppingCard — Tarjeta de topping con control de cantidad.
 *
 * - Sin seleccionar: muestra imagen + botón "Agregar"
 * - Seleccionado: muestra controles [-] [qty] [+] para ajustar cantidad (1–3)
 */
function ToppingCard({
  ingredient,
  quantity,
  onAdd,
  onRemove,
  onSetQty,
}: {
  ingredient: Ingredient;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
  onSetQty: (qty: number) => void;
}) {
  const isSelected = quantity > 0;

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/30 hover:bg-muted/20'
      }`}
    >
      {/* Imagen del ingrediente */}
      <div className="w-12 h-12 rounded-lg overflow-hidden border border-border bg-muted flex-shrink-0">
        {ingredient.image ? (
          <img
            src={ingredient.image}
            alt={ingredient.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-lg">🍕</div>
        )}
      </div>

      {/* Nombre + precio */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{ingredient.name}</p>
        {ingredient.price > 0 && (
          <p className="text-xs text-primary font-bold">
            +S/ {ingredient.price.toFixed(2)} c/u
          </p>
        )}
      </div>

      {/* Control de cantidad o botón agregar */}
      {isSelected ? (
        <div className="flex items-center gap-1 flex-shrink-0" role="group" aria-label={`Cantidad de ${ingredient.name}`}>
          {/* Quitar (–1 o eliminar si qty=1) */}
          <button
            onClick={() => onSetQty(quantity - 1)}
            aria-label={quantity === 1 ? `Quitar ${ingredient.name}` : `Reducir cantidad de ${ingredient.name}`}
            className="w-7 h-7 rounded-full bg-muted hover:bg-destructive/10 hover:text-destructive flex items-center justify-center transition-colors"
          >
            {quantity === 1 ? (
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <Minus className="w-3.5 h-3.5" aria-hidden="true" />
            )}
          </button>

          {/* Cantidad actual */}
          <span
            className="w-7 text-center text-sm font-bold text-primary"
            aria-live="polite"
            aria-label={`Cantidad: ${quantity}`}
          >
            {quantity}
          </span>

          {/* Agregar más (+1, hasta MAX_QTY) */}
          <button
            onClick={() => onSetQty(quantity + 1)}
            disabled={quantity >= MAX_QTY}
            aria-label={`Agregar otra unidad de ${ingredient.name}`}
            aria-disabled={quantity >= MAX_QTY}
            className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center transition-colors hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      ) : (
        /* Botón para agregar el topping por primera vez */
        <button
          onClick={onAdd}
          aria-label={`Agregar ${ingredient.name}`}
          className="flex-shrink-0 w-8 h-8 rounded-full bg-muted hover:bg-primary hover:text-white flex items-center justify-center transition-colors"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

/** Creador de pizza personalizada con vista previa animada */
export default function CustomPizza() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user }      = useAuth();

  // ── Estado del pedido ──────────────────────────────────────────────────────
  const [selectedSize,   setSelectedSize]   = useState<string>('medium');
  const [selectedBase,   setSelectedBase]   = useState<string>('base-classic');
  const [selectedSauce,  setSelectedSauce]  = useState<string>('sauce-tomato');
  const [selectedCheese, setSelectedCheese] = useState<string>('cheese-mozzarella');

  /**
   * toppingQuantities — mapa de id → cantidad seleccionada.
   * Solo contiene toppings con cantidad >= 1.
   */
  const [toppingQuantities, setToppingQuantities] = useState<Record<string, number>>({});

  /** Control de visibilidad del resumen en móvil */
  const [summaryOpen, setSummaryOpen] = useState(false);

  // ── Agrupación de ingredientes ────────────────────────────────────────────
  const bases      = availableIngredients.filter(i => i.category === 'base');
  const sauces     = availableIngredients.filter(i => i.category === 'sauce');
  const cheeses    = availableIngredients.filter(i => i.category === 'cheese');
  const meats      = availableIngredients.filter(i => i.category === 'meat');
  const vegetables = availableIngredients.filter(i => i.category === 'vegetable');
  const extras     = availableIngredients.filter(i => i.category === 'extra');

  // ── Derivados ─────────────────────────────────────────────────────────────
  const currentSize      = pizzaSizes.find(s => s.id === selectedSize)!;
  const baseIngredient   = availableIngredients.find(i => i.id === selectedBase)!;
  const sauceIngredient  = availableIngredients.find(i => i.id === selectedSauce)!;
  const cheeseIngredient = availableIngredients.find(i => i.id === selectedCheese)!;

  /** Lista ordenada de toppings con sus cantidades, para resumen y precio */
  const selectedToppings: ToppingEntry[] = Object.entries(toppingQuantities)
    .filter(([, qty]) => qty > 0)
    .map(([id, quantity]) => ({
      ingredient: availableIngredients.find(i => i.id === id)!,
      quantity,
    }));

  const totalToppingPrice = selectedToppings.reduce(
    (sum, { ingredient, quantity }) => sum + ingredient.price * quantity,
    0
  );

  const totalPrice =
    currentSize.price +
    baseIngredient.price +
    sauceIngredient.price +
    cheeseIngredient.price +
    totalToppingPrice;

  const totalToppingCount = Object.values(toppingQuantities).reduce((a, b) => a + b, 0);

  // ── Handlers de toppings ──────────────────────────────────────────────────

  /** Agrega un topping (parte desde 1) */
  const addTopping = (id: string) => {
    setToppingQuantities(prev => ({ ...prev, [id]: 1 }));
  };

  /** Elimina un topping completamente */
  const removeTopping = (id: string) => {
    setToppingQuantities(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  /** Ajusta la cantidad de un topping; si qty<=0 lo elimina */
  const setToppingQty = (id: string, qty: number) => {
    if (qty <= 0) {
      removeTopping(id);
    } else {
      setToppingQuantities(prev => ({ ...prev, [id]: Math.min(qty, MAX_QTY) }));
    }
  };

  /**
   * Agrega la pizza personalizada al carrito y la guarda en Supabase.
   * La pizza se guarda en la tabla `custom_pizzas` + `custom_pizza_toppings`
   * para mantener el historial completo de configuraciones.
   * Si el usuario no está autenticado, solo se agrega al carrito local.
   */
  const handleAddToCart = async () => {
    const ingredients = [
      baseIngredient.name,
      sauceIngredient.name,
      cheeseIngredient.name,
      ...selectedToppings.map(({ ingredient, quantity }) =>
        quantity > 1 ? `${ingredient.name} x${quantity}` : ingredient.name
      ),
    ];

    // Agregar al carrito (siempre funciona)
    addToCart({
      id:          `custom-${Date.now()}`,
      name:        `Pizza Personalizada (${currentSize.name})`,
      description: `Ingredientes: ${ingredients.join(', ')}`,
      price:       totalPrice,
      image:       'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&h=400&fit=crop',
      category:    'pizza' as const,
      size:        selectedSize as any,
    });

    // Guardar en Supabase si el usuario está autenticado
    if (user) {
      createCustomPizza({
        userId:      user.id,
        orderItemId: null,    // se vincula al order_item cuando se confirma el pedido
        sizeId:      selectedSize,
        sizeName:    currentSize.name,
        baseId:      selectedBase,
        baseName:    baseIngredient.name,
        sauceId:     selectedSauce,
        sauceName:   sauceIngredient.name,
        cheeseId:    selectedCheese,
        cheeseName:  cheeseIngredient.name,
        totalPrice,
        toppings: selectedToppings.map(({ ingredient, quantity }) => ({
          ingredientId:   ingredient.id,
          ingredientName: ingredient.name,
          category:       ingredient.category,
          quantity,
          pricePerUnit:   ingredient.price,
        })),
      }).then(({ error }) => {
        if (error) console.error('[custom-pizza] save error:', error);
      });
    }

    toast.success('Pizza personalizada agregada al carrito', {
      icon: <Check className="w-4 h-4" />,
    });
    navigate('/carrito');
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="py-6 md:py-16">
      <div className="container mx-auto px-4 max-w-7xl">

        {/* Encabezado */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 md:mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="gap-2 mb-4"
            aria-label="Volver a la página anterior"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Volver
          </Button>
          <h1 className="font-display text-2xl sm:text-3xl md:text-5xl font-bold mb-2">
            Crea tu Pizza Personalizada
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Elige cada ingrediente y la vista previa se actualiza en tiempo real
          </p>
        </motion.div>

        {/* Layout principal */}
        <div className="grid lg:grid-cols-3 gap-5 lg:gap-8">

          {/* ── Panel izquierdo: construcción ── */}
          <div className="lg:col-span-2 space-y-4 md:space-y-5">

            {/* PASO 1 — Tamaño */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-card rounded-xl p-4 md:p-6 shadow-sm border border-border"
              aria-labelledby="step-size"
            >
              <h2 id="step-size" className="font-display text-lg md:text-2xl font-bold mb-3">
                1. Elige el tamaño
              </h2>
              <div className="grid grid-cols-3 gap-2 md:gap-4">
                {pizzaSizes.map(size => (
                  <button
                    key={size.id}
                    onClick={() => setSelectedSize(size.id)}
                    aria-pressed={selectedSize === size.id}
                    aria-label={`${size.name}, ${size.diameter}, ${size.slices} porciones, S/ ${size.price.toFixed(2)}`}
                    className={`relative p-3 md:p-4 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                      selectedSize === size.id
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    {selectedSize === size.id && (
                      <div className="absolute -top-2 -right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" aria-hidden="true" />
                      </div>
                    )}
                    <div className="text-center">
                      {/* Icono proporcional al tamaño */}
                      <div className="text-2xl md:text-3xl mb-1" aria-hidden="true">
                        {size.id === 'small' ? '🍕' : size.id === 'medium' ? '🍕🍕' : '🍕🍕🍕'}
                      </div>
                      <p className="font-bold text-xs md:text-sm mb-0.5">{size.name}</p>
                      <p className="text-xs text-muted-foreground">{size.diameter}</p>
                      <p className="text-xs text-muted-foreground mb-1">{size.slices} porciones</p>
                      <p className="font-bold text-primary text-sm">S/ {size.price.toFixed(2)}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.section>

            {/* PASO 2 — Masa */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.10 }}
              className="bg-card rounded-xl p-4 md:p-6 shadow-sm border border-border"
              aria-labelledby="step-base"
            >
              <h2 id="step-base" className="font-display text-lg md:text-2xl font-bold mb-3">
                2. Elige la masa
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
                {bases.map(base => (
                  <IngredientCard
                    key={base.id}
                    ingredient={base}
                    selected={selectedBase === base.id}
                    onClick={() => setSelectedBase(base.id)}
                  />
                ))}
              </div>
            </motion.section>

            {/* PASO 3 — Salsa */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-card rounded-xl p-4 md:p-6 shadow-sm border border-border"
              aria-labelledby="step-sauce"
            >
              <h2 id="step-sauce" className="font-display text-lg md:text-2xl font-bold mb-3">
                3. Elige la salsa
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
                {sauces.map(sauce => (
                  <IngredientCard
                    key={sauce.id}
                    ingredient={sauce}
                    selected={selectedSauce === sauce.id}
                    onClick={() => setSelectedSauce(sauce.id)}
                  />
                ))}
              </div>
            </motion.section>

            {/* PASO 4 — Queso */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.20 }}
              className="bg-card rounded-xl p-4 md:p-6 shadow-sm border border-border"
              aria-labelledby="step-cheese"
            >
              <h2 id="step-cheese" className="font-display text-lg md:text-2xl font-bold mb-3">
                4. Elige el queso
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
                {cheeses.map(cheese => (
                  <IngredientCard
                    key={cheese.id}
                    ingredient={cheese}
                    selected={selectedCheese === cheese.id}
                    onClick={() => setSelectedCheese(cheese.id)}
                  />
                ))}
              </div>
            </motion.section>

            {/* PASO 5 — Toppings con control de cantidad */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-card rounded-xl p-4 md:p-6 shadow-sm border border-border"
              aria-labelledby="step-toppings"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 id="step-toppings" className="font-display text-lg md:text-2xl font-bold">
                  5. Toppings
                  <span className="text-sm text-muted-foreground font-normal ml-2">(opcional)</span>
                </h2>
                {totalToppingCount > 0 && (
                  <Badge variant="secondary" aria-label={`${totalToppingCount} toppings en total`}>
                    {totalToppingCount} en total
                  </Badge>
                )}
              </div>

              {/* Pista de uso */}
              <p className="text-xs text-muted-foreground mb-3">
                Agrega hasta {MAX_QTY} unidades de cada topping. Cada unidad aparece en un lugar diferente de la pizza.
              </p>

              <Tabs defaultValue="meats">
                <TabsList className="mb-3 w-full flex overflow-x-auto scrollbar-hide">
                  <TabsTrigger value="meats"      className="flex-1 text-xs sm:text-sm">Carnes</TabsTrigger>
                  <TabsTrigger value="vegetables" className="flex-1 text-xs sm:text-sm">Vegetales</TabsTrigger>
                  <TabsTrigger value="extras"     className="flex-1 text-xs sm:text-sm">Extras</TabsTrigger>
                </TabsList>

                <TabsContent value="meats" className="space-y-2">
                  {meats.map(meat => (
                    <ToppingCard
                      key={meat.id}
                      ingredient={meat}
                      quantity={toppingQuantities[meat.id] ?? 0}
                      onAdd={() => addTopping(meat.id)}
                      onRemove={() => removeTopping(meat.id)}
                      onSetQty={qty => setToppingQty(meat.id, qty)}
                    />
                  ))}
                </TabsContent>

                <TabsContent value="vegetables" className="space-y-2">
                  {vegetables.map(veg => (
                    <ToppingCard
                      key={veg.id}
                      ingredient={veg}
                      quantity={toppingQuantities[veg.id] ?? 0}
                      onAdd={() => addTopping(veg.id)}
                      onRemove={() => removeTopping(veg.id)}
                      onSetQty={qty => setToppingQty(veg.id, qty)}
                    />
                  ))}
                </TabsContent>

                <TabsContent value="extras" className="space-y-2">
                  {extras.map(extra => (
                    <ToppingCard
                      key={extra.id}
                      ingredient={extra}
                      quantity={toppingQuantities[extra.id] ?? 0}
                      onAdd={() => addTopping(extra.id)}
                      onRemove={() => removeTopping(extra.id)}
                      onSetQty={qty => setToppingQty(extra.id, qty)}
                    />
                  ))}
                </TabsContent>
              </Tabs>
            </motion.section>
          </div>

          {/* ── Panel derecho: vista previa + resumen ── */}
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.10 }}
            className="lg:col-span-1"
            aria-label="Resumen y vista previa de tu pizza"
          >
            <div className="lg:sticky lg:top-24 space-y-4">

              {/* Vista previa animada */}
              <div className="bg-card rounded-xl p-4 md:p-6 shadow-sm border border-border">
                <h2 className="font-display text-base md:text-lg font-bold mb-3 text-center">
                  Vista Previa en Tiempo Real
                </h2>
                <PizzaPreview
                  sauceId={selectedSauce}
                  cheeseId={selectedCheese}
                  toppings={selectedToppings}
                />
                {/* Descripción textual de lo que hay en la pizza */}
                <p className="text-xs text-center text-muted-foreground mt-3">
                  {selectedToppings.length === 0
                    ? 'Selecciona toppings para verlos en la pizza'
                    : `${selectedToppings.map(t => t.ingredient.name).join(', ')}`}
                </p>
              </div>

              {/* Resumen del pedido (colapsable en móvil) */}
              <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">

                {/* Cabecera colapsable — solo visible en móvil */}
                <button
                  className="lg:hidden w-full flex items-center justify-between p-4 font-bold"
                  onClick={() => setSummaryOpen(o => !o)}
                  aria-expanded={summaryOpen}
                  aria-controls="pizza-summary"
                >
                  <span className="font-display text-base">Resumen del Pedido</span>
                  <div className="flex items-center gap-3">
                    <span className="text-primary font-bold text-sm">S/ {totalPrice.toFixed(2)}</span>
                    {summaryOpen
                      ? <ChevronUp  className="w-4 h-4" aria-hidden="true" />
                      : <ChevronDown className="w-4 h-4" aria-hidden="true" />}
                  </div>
                </button>

                {/* Contenido del resumen */}
                <div
                  id="pizza-summary"
                  className={`p-4 md:p-6 space-y-3 ${summaryOpen ? '' : 'hidden lg:block'}`}
                >
                  <h2 className="hidden lg:block font-display text-lg font-bold mb-3">
                    Resumen del Pedido
                  </h2>

                  {/* Línea de tamaño */}
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <div>
                      <p className="text-xs text-muted-foreground">Tamaño</p>
                      <p className="font-medium text-sm">{currentSize.name} — {currentSize.diameter}</p>
                    </div>
                    <p className="text-primary font-bold text-sm">S/ {currentSize.price.toFixed(2)}</p>
                  </div>

                  {/* Masa */}
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <div>
                      <p className="text-xs text-muted-foreground">Masa</p>
                      <p className="font-medium text-sm">{baseIngredient.name}</p>
                    </div>
                    {baseIngredient.price > 0
                      ? <p className="text-primary font-bold text-sm">+S/ {baseIngredient.price.toFixed(2)}</p>
                      : <p className="text-xs text-muted-foreground">Incluido</p>}
                  </div>

                  {/* Salsa */}
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <div>
                      <p className="text-xs text-muted-foreground">Salsa</p>
                      <p className="font-medium text-sm">{sauceIngredient.name}</p>
                    </div>
                    {sauceIngredient.price > 0
                      ? <p className="text-primary font-bold text-sm">+S/ {sauceIngredient.price.toFixed(2)}</p>
                      : <p className="text-xs text-muted-foreground">Incluida</p>}
                  </div>

                  {/* Queso */}
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <div>
                      <p className="text-xs text-muted-foreground">Queso</p>
                      <p className="font-medium text-sm">{cheeseIngredient.name}</p>
                    </div>
                    {cheeseIngredient.price > 0
                      ? <p className="text-primary font-bold text-sm">+S/ {cheeseIngredient.price.toFixed(2)}</p>
                      : <p className="text-xs text-muted-foreground">Incluido</p>}
                  </div>

                  {/* Toppings con cantidades */}
                  {selectedToppings.length > 0 && (
                    <div className="py-2 border-b border-border space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Toppings ({selectedToppings.length} tipos)
                      </p>
                      {selectedToppings.map(({ ingredient, quantity }) => (
                        <div key={ingredient.id} className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            {/* Miniatura del topping */}
                            {ingredient.image && (
                              <div className="w-6 h-6 rounded-full overflow-hidden border border-border flex-shrink-0">
                                <img src={ingredient.image} alt="" className="w-full h-full object-cover" aria-hidden="true" />
                              </div>
                            )}
                            <p className="text-sm font-medium">{ingredient.name}</p>
                            {quantity > 1 && (
                              <Badge variant="outline" className="text-xs px-1.5 py-0">×{quantity}</Badge>
                            )}
                          </div>
                          <p className="text-primary font-bold text-sm">
                            +S/ {(ingredient.price * quantity).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Total */}
                  <div className="bg-primary/5 rounded-lg p-3 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm">Total:</span>
                      <span className="font-display text-2xl font-bold text-primary">
                        S/ {totalPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <Button onClick={handleAddToCart} size="lg" className="w-full mt-2">
                    Agregar al Carrito
                  </Button>

                  <ul className="space-y-1 text-xs text-muted-foreground mt-2" aria-label="Características">
                    <li>✓ Preparada al momento</li>
                    <li>✓ Ingredientes frescos del día</li>
                    <li>✓ Tiempo de preparación: 15–20 min</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
}
