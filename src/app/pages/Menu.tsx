import { motion } from 'motion/react';
import { useState } from 'react';
import { Link } from 'react-router';
import { pizzas, drinks, sides } from '../data/products';
import { useCart } from '../context/CartContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Check, Eye, Search } from 'lucide-react';
import { toast } from 'sonner';

type Category = 'all' | 'pizza' | 'drink' | 'side';

export default function Menu() {
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { addToCart } = useCart();

  const allProducts = [...pizzas, ...drinks, ...sides];

  let filteredProducts = activeCategory === 'all'
    ? allProducts
    : allProducts.filter((p) => p.category === activeCategory);

  // Filtrar por búsqueda
  if (searchQuery.trim()) {
    filteredProducts = filteredProducts.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  const categories = [
    { id: 'all', name: 'Todo', count: allProducts.length },
    { id: 'pizza', name: 'Pizzas', count: pizzas.length },
    { id: 'drink', name: 'Bebidas', count: drinks.length },
    { id: 'side', name: 'Complementos', count: sides.length },
  ];

  const handleAddToCart = (product: any) => {
    addToCart(product);
    toast.success(`${product.name} agregado al carrito`, {
      icon: <Check className="w-4 h-4" />,
    });
  };

  return (
    <div className="py-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="font-display text-5xl font-bold mb-4">
            Nuestro Menú
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Descubre nuestra selección de pizzas artesanales, bebidas refrescantes
            y deliciosos complementos
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-xl mx-auto mb-8"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar pizzas, bebidas o complementos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-base"
            />
          </div>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id as Category)}
              className={`px-6 py-3 rounded-full font-medium transition-all ${
                activeCategory === category.id
                  ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {category.name}
              <span className="ml-2 opacity-70">({category.count})</span>
            </button>
          ))}
        </motion.div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all group border border-border"
            >
              <div className="relative overflow-hidden aspect-[4/3]">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-4 right-4 bg-secondary text-secondary-foreground px-3 py-1.5 rounded-full font-bold shadow-lg">
                  S/ {product.price.toFixed(2)}
                </div>
                {product.category === 'pizza' && (
                  <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold uppercase">
                    {product.size}
                  </div>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-display text-xl font-bold mb-2">
                  {product.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2 min-h-[2.5rem]">
                  {product.description}
                </p>
                <div className="flex gap-2">
                  {product.category === 'pizza' && (
                    <Link to={`/producto/${product.id}`} className="flex-1">
                      <Button variant="outline" className="w-full" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        Detalles
                      </Button>
                    </Link>
                  )}
                  <Button
                    onClick={() => handleAddToCart(product)}
                    className={`group ${product.category === 'pizza' ? 'flex-1' : 'w-full'}`}
                    variant="default"
                    size="sm"
                  >
                    {product.category === 'pizza' ? 'Agregar' : 'Agregar al Carrito'}
                    <motion.span
                      className="ml-2"
                      whileHover={{ scale: 1.2 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                    >
                      +
                    </motion.span>
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-20">
            <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground text-lg mb-2">
              {searchQuery ? 'No encontramos productos que coincidan con tu búsqueda' : 'No hay productos en esta categoría'}
            </p>
            {searchQuery && (
              <Button
                variant="outline"
                onClick={() => setSearchQuery('')}
                className="mt-4"
              >
                Limpiar búsqueda
              </Button>
            )}
          </div>
        )}

        {/* Custom Pizza CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 bg-gradient-to-r from-accent to-accent/80 rounded-2xl p-8 md:p-12 text-center"
        >
          <h2 className="font-display text-3xl font-bold mb-4">
            ¿Quieres crear tu propia pizza?
          </h2>
          <p className="text-lg mb-6 max-w-2xl mx-auto">
            Elige tu masa, salsa y los ingredientes que más te gusten. ¡Las
            posibilidades son infinitas!
          </p>
          <Link to="/pizza-personalizada">
            <Button size="lg" variant="outline" className="bg-white hover:bg-white/90">
              Crear Pizza Personalizada
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
