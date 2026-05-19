import { motion } from 'motion/react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { availableIngredients, type Ingredient, type PizzaSize } from '../data/productsDetailed';
import { useCart } from '../context/CartContext';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ArrowLeft, Check, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

const pizzaSizes: PizzaSize[] = [
  { id: 'small', name: 'Personal', diameter: '25cm', slices: 4, price: 15.00 },
  { id: 'medium', name: 'Mediana', diameter: '30cm', slices: 6, price: 20.00 },
  { id: 'large', name: 'Familiar', diameter: '35cm', slices: 8, price: 25.00 },
];

export default function CustomPizza() {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [selectedSize, setSelectedSize] = useState<string>('medium');
  const [selectedBase, setSelectedBase] = useState<string>('base-classic');
  const [selectedSauce, setSelectedSauce] = useState<string>('sauce-tomato');
  const [selectedCheese, setSelectedCheese] = useState<string>('cheese-mozzarella');
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);

  const bases = availableIngredients.filter((i) => i.category === 'base');
  const sauces = availableIngredients.filter((i) => i.category === 'sauce');
  const cheeses = availableIngredients.filter((i) => i.category === 'cheese');
  const meats = availableIngredients.filter((i) => i.category === 'meat');
  const vegetables = availableIngredients.filter((i) => i.category === 'vegetable');
  const extras = availableIngredients.filter((i) => i.category === 'extra');

  const currentSize = pizzaSizes.find((s) => s.id === selectedSize)!;
  const baseIngredient = availableIngredients.find((i) => i.id === selectedBase)!;
  const sauceIngredient = availableIngredients.find((i) => i.id === selectedSauce)!;
  const cheeseIngredient = availableIngredients.find((i) => i.id === selectedCheese)!;
  const toppingIngredients = selectedToppings.map((id) =>
    availableIngredients.find((i) => i.id === id)!
  );

  const totalPrice =
    currentSize.price +
    baseIngredient.price +
    sauceIngredient.price +
    cheeseIngredient.price +
    toppingIngredients.reduce((sum, ing) => sum + ing.price, 0);

  const toggleTopping = (id: string) => {
    if (selectedToppings.includes(id)) {
      setSelectedToppings(selectedToppings.filter((t) => t !== id));
    } else {
      setSelectedToppings([...selectedToppings, id]);
    }
  };

  const handleAddToCart = () => {
    const allIngredients = [
      baseIngredient.name,
      sauceIngredient.name,
      cheeseIngredient.name,
      ...toppingIngredients.map((i) => i.name),
    ];

    const cartProduct = {
      id: `custom-${Date.now()}`,
      name: `Pizza Personalizada (${currentSize.name})`,
      description: `Ingredientes: ${allIngredients.join(', ')}`,
      price: totalPrice,
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&h=400&fit=crop',
      category: 'pizza' as const,
      size: selectedSize as any,
    };

    addToCart(cartProduct);
    toast.success('Pizza personalizada agregada al carrito', {
      icon: <Check className="w-4 h-4" />,
    });
    navigate('/carrito');
  };

  const IngredientButton = ({
    ingredient,
    selected,
    onClick,
  }: {
    ingredient: Ingredient;
    selected: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`relative p-3 md:p-4 rounded-xl border-2 transition-all text-left ${
        selected
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50'
      }`}
    >
      {selected && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
          <Check className="w-4 h-4 text-primary-foreground" />
        </div>
      )}
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">{ingredient.name}</span>
        {ingredient.price > 0 && (
          <span className="text-xs text-primary font-bold">
            +S/ {ingredient.price.toFixed(2)}
          </span>
        )}
      </div>
    </button>
  );

  const ToppingButton = ({
    ingredient,
    selected,
  }: {
    ingredient: Ingredient;
    selected: boolean;
  }) => (
    <button
      onClick={() => toggleTopping(ingredient.id)}
      className={`relative p-3 rounded-lg border-2 transition-all ${
        selected
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-sm">{ingredient.name}</span>
        <div className="flex items-center gap-2">
          {ingredient.price > 0 && (
            <span className="text-xs text-primary font-bold">
              +S/ {ingredient.price.toFixed(2)}
            </span>
          )}
          {selected ? (
            <X className="w-4 h-4 text-destructive" />
          ) : (
            <Plus className="w-4 h-4 text-primary" />
          )}
        </div>
      </div>
    </button>
  );

  return (
    <div className="py-8 md:py-16">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 md:mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="gap-2 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>
          <h1 className="font-display text-3xl md:text-5xl font-bold mb-3 md:mb-4">
            Crea tu Pizza Personalizada
          </h1>
          <p className="text-base md:text-lg text-muted-foreground">
            Elige cada ingrediente y crea la pizza perfecta para ti
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Builder Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Size Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-xl p-4 md:p-6 shadow-md border border-border"
            >
              <h2 className="font-display text-xl md:text-2xl font-bold mb-3 md:mb-4">
                1. Elige el tamaño
              </h2>
              <div className="grid grid-cols-3 gap-2 md:gap-4">
                {pizzaSizes.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => setSelectedSize(size.id)}
                    className={`relative p-3 md:p-4 rounded-xl border-2 transition-all ${
                      selectedSize === size.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {selectedSize === size.id && (
                      <div className="absolute -top-2 -right-2 w-5 h-5 md:w-6 md:h-6 bg-primary rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                    <div className="text-center">
                      <p className="font-bold mb-1">{size.name}</p>
                      <p className="text-xs text-muted-foreground mb-1">
                        {size.diameter}
                      </p>
                      <p className="text-xs text-muted-foreground mb-2">
                        {size.slices} porciones
                      </p>
                      <p className="font-bold text-primary">
                        S/ {size.price.toFixed(2)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Base Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card rounded-xl p-6 shadow-md border border-border"
            >
              <h2 className="font-display text-2xl font-bold mb-4">
                2. Elige la masa
              </h2>
              <div className="grid md:grid-cols-2 gap-3">
                {bases.map((base) => (
                  <IngredientButton
                    key={base.id}
                    ingredient={base}
                    selected={selectedBase === base.id}
                    onClick={() => setSelectedBase(base.id)}
                  />
                ))}
              </div>
            </motion.div>

            {/* Sauce Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card rounded-xl p-6 shadow-md border border-border"
            >
              <h2 className="font-display text-2xl font-bold mb-4">
                3. Elige la salsa
              </h2>
              <div className="grid md:grid-cols-2 gap-3">
                {sauces.map((sauce) => (
                  <IngredientButton
                    key={sauce.id}
                    ingredient={sauce}
                    selected={selectedSauce === sauce.id}
                    onClick={() => setSelectedSauce(sauce.id)}
                  />
                ))}
              </div>
            </motion.div>

            {/* Cheese Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-card rounded-xl p-6 shadow-md border border-border"
            >
              <h2 className="font-display text-2xl font-bold mb-4">
                4. Elige el queso
              </h2>
              <div className="grid md:grid-cols-2 gap-3">
                {cheeses.map((cheese) => (
                  <IngredientButton
                    key={cheese.id}
                    ingredient={cheese}
                    selected={selectedCheese === cheese.id}
                    onClick={() => setSelectedCheese(cheese.id)}
                  />
                ))}
              </div>
            </motion.div>

            {/* Toppings Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-card rounded-xl p-6 shadow-md border border-border"
            >
              <h2 className="font-display text-2xl font-bold mb-4">
                5. Agrega toppings (opcional)
              </h2>
              <Tabs defaultValue="meats">
                <TabsList className="mb-4">
                  <TabsTrigger value="meats">Carnes</TabsTrigger>
                  <TabsTrigger value="vegetables">Vegetales</TabsTrigger>
                  <TabsTrigger value="extras">Extras</TabsTrigger>
                </TabsList>

                <TabsContent value="meats" className="space-y-3">
                  {meats.map((meat) => (
                    <ToppingButton
                      key={meat.id}
                      ingredient={meat}
                      selected={selectedToppings.includes(meat.id)}
                    />
                  ))}
                </TabsContent>

                <TabsContent value="vegetables" className="space-y-3">
                  {vegetables.map((veg) => (
                    <ToppingButton
                      key={veg.id}
                      ingredient={veg}
                      selected={selectedToppings.includes(veg.id)}
                    />
                  ))}
                </TabsContent>

                <TabsContent value="extras" className="space-y-3">
                  {extras.map((extra) => (
                    <ToppingButton
                      key={extra.id}
                      ingredient={extra}
                      selected={selectedToppings.includes(extra.id)}
                    />
                  ))}
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>

          {/* Summary Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="bg-card rounded-xl p-6 shadow-lg border border-border sticky top-24">
              <h2 className="font-display text-2xl font-bold mb-6">
                Tu Pizza
              </h2>

              <div className="space-y-4 mb-6">
                <div className="pb-3 border-b border-border">
                  <p className="text-sm text-muted-foreground mb-1">Tamaño</p>
                  <div className="flex justify-between items-center">
                    <p className="font-medium">{currentSize.name}</p>
                    <p className="text-primary font-bold">
                      S/ {currentSize.price.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="pb-3 border-b border-border">
                  <p className="text-sm text-muted-foreground mb-2">Base</p>
                  <div className="flex justify-between items-center">
                    <p className="font-medium text-sm">{baseIngredient.name}</p>
                    {baseIngredient.price > 0 && (
                      <p className="text-primary font-bold text-sm">
                        +S/ {baseIngredient.price.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pb-3 border-b border-border">
                  <p className="text-sm text-muted-foreground mb-2">Salsa</p>
                  <div className="flex justify-between items-center">
                    <p className="font-medium text-sm">{sauceIngredient.name}</p>
                    {sauceIngredient.price > 0 && (
                      <p className="text-primary font-bold text-sm">
                        +S/ {sauceIngredient.price.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pb-3 border-b border-border">
                  <p className="text-sm text-muted-foreground mb-2">Queso</p>
                  <div className="flex justify-between items-center">
                    <p className="font-medium text-sm">{cheeseIngredient.name}</p>
                    {cheeseIngredient.price > 0 && (
                      <p className="text-primary font-bold text-sm">
                        +S/ {cheeseIngredient.price.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>

                {toppingIngredients.length > 0 && (
                  <div className="pb-3 border-b border-border">
                    <p className="text-sm text-muted-foreground mb-2">
                      Toppings ({toppingIngredients.length})
                    </p>
                    <div className="space-y-2">
                      {toppingIngredients.map((topping) => (
                        <div
                          key={topping.id}
                          className="flex justify-between items-center"
                        >
                          <p className="font-medium text-sm">{topping.name}</p>
                          <p className="text-primary font-bold text-sm">
                            +S/ {topping.price.toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-primary/5 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="font-bold">Total:</span>
                  <span className="font-display text-3xl font-bold text-primary">
                    S/ {totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              <Button onClick={handleAddToCart} size="lg" className="w-full">
                Agregar al Carrito
              </Button>

              <div className="mt-6 space-y-2 text-xs text-muted-foreground">
                <p>✓ Preparada al momento</p>
                <p>✓ Ingredientes frescos</p>
                <p>✓ Tiempo de preparación: 15-20 min</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
