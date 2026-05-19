import { motion } from 'motion/react';
import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { detailedPizzas } from '../data/productsDetailed';
import { useCart } from '../context/CartContext';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, Check, Info, Flame } from 'lucide-react';
import { toast } from 'sonner';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const product = detailedPizzas.find((p) => p.id === id);
  const [selectedSize, setSelectedSize] = useState(product?.sizes?.[1].id || 'medium');

  if (!product) {
    return (
      <div className="py-20 text-center">
        <h1 className="font-display text-3xl font-bold mb-4">Producto no encontrado</h1>
        <Link to="/menu">
          <Button>Volver al Menú</Button>
        </Link>
      </div>
    );
  }

  const currentSize = product.sizes?.find((s) => s.id === selectedSize);
  const price = currentSize?.price || product.basePrice || 0;

  const handleAddToCart = () => {
    const cartProduct = {
      id: `${product.id}-${selectedSize}`,
      name: `${product.name} (${currentSize?.name})`,
      description: product.description,
      price: price,
      image: product.image,
      category: product.category,
      size: selectedSize as any,
    };

    addToCart(cartProduct);
    toast.success(`${product.name} agregado al carrito`, {
      icon: <Check className="w-4 h-4" />,
    });
  };

  return (
    <div className="py-16">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Image Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-square">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Nutritional Info */}
            {product.nutritionalInfo && (
              <div className="bg-card rounded-xl p-4 md:p-6 shadow-md border border-border">
                <h3 className="font-display text-base md:text-lg font-bold mb-4 flex items-center gap-2">
                  <Info className="w-4 md:w-5 h-4 md:h-5 text-primary" />
                  <span className="text-sm md:text-base">Información Nutricional (por porción)</span>
                </h3>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">Calorías</p>
                    <p className="text-base md:text-lg font-bold">{product.nutritionalInfo.calories} kcal</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">Proteínas</p>
                    <p className="text-base md:text-lg font-bold">{product.nutritionalInfo.protein}g</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">Carbohidratos</p>
                    <p className="text-base md:text-lg font-bold">{product.nutritionalInfo.carbs}g</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">Grasas</p>
                    <p className="text-base md:text-lg font-bold">{product.nutritionalInfo.fat}g</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Details Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <div>
              <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
                {product.name}
              </h1>
              <p className="text-lg text-muted-foreground">
                {product.description}
              </p>
            </div>

            {/* Allergens */}
            {product.allergens && product.allergens.length > 0 && (
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium">Alérgenos:</span>
                <div className="flex gap-2 flex-wrap">
                  {product.allergens.map((allergen) => (
                    <Badge key={allergen} variant="outline" className="text-xs">
                      {allergen}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Ingredients */}
            {product.ingredients && (
              <div className="bg-muted/30 rounded-xl p-4 md:p-6">
                <h3 className="font-display text-lg md:text-xl font-bold mb-3 md:mb-4">
                  Ingredientes
                </h3>
                <ul className="space-y-2">
                  {product.ingredients.map((ingredient, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-3 text-sm md:text-base text-muted-foreground"
                    >
                      <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                      {ingredient}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Size Selection */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <h3 className="font-display text-lg md:text-xl font-bold mb-3 md:mb-4">
                  Elige tu tamaño
                </h3>
                <div className="grid grid-cols-3 gap-2 md:gap-3">
                  {product.sizes.map((size) => (
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
                          <Check className="w-3 h-3 md:w-4 md:h-4 text-primary-foreground" />
                        </div>
                      )}
                      <div className="text-center">
                        <p className="font-bold text-xs md:text-sm mb-1">{size.name}</p>
                        <p className="text-[10px] md:text-xs text-muted-foreground mb-1">
                          {size.diameter}
                        </p>
                        <p className="text-[10px] md:text-xs text-muted-foreground mb-1 md:mb-2">
                          {size.slices} porciones
                        </p>
                        <p className="font-bold text-xs md:text-sm text-primary">
                          S/ {size.price.toFixed(2)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Price & Add to Cart */}
            <div className="bg-card rounded-xl p-4 md:p-6 shadow-md border border-border md:sticky md:top-24">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <span className="text-sm md:text-base text-muted-foreground">Precio:</span>
                <span className="font-display text-2xl md:text-3xl font-bold text-primary">
                  S/ {price.toFixed(2)}
                </span>
              </div>
              <Button
                onClick={handleAddToCart}
                size="lg"
                className="w-full h-12"
              >
                Agregar al Carrito
              </Button>
            </div>

            {/* Additional Info */}
            <div className="text-xs md:text-sm text-muted-foreground space-y-2 px-2 md:px-0">
              <p>✓ Preparada al momento con ingredientes frescos</p>
              <p>✓ Horneada en horno de piedra a alta temperatura</p>
              <p>✓ Tiempo de preparación: 15-20 minutos</p>
            </div>
          </motion.div>
        </div>

        {/* Related Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16"
        >
          <h2 className="font-display text-3xl font-bold mb-8">
            También te puede gustar
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {detailedPizzas
              .filter((p) => p.id !== product.id)
              .slice(0, 3)
              .map((relatedProduct) => (
                <Link
                  key={relatedProduct.id}
                  to={`/producto/${relatedProduct.id}`}
                  className="bg-card rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow group border border-border"
                >
                  <div className="relative overflow-hidden aspect-[4/3]">
                    <img
                      src={relatedProduct.image}
                      alt={relatedProduct.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-display text-lg font-bold mb-2">
                      {relatedProduct.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {relatedProduct.description}
                    </p>
                    <p className="font-bold text-primary">
                      Desde S/ {relatedProduct.sizes?.[0].price.toFixed(2)}
                    </p>
                  </div>
                </Link>
              ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
