import { motion } from 'motion/react';
import { useCart } from '../context/CartContext';
import { Button } from '../components/ui/button';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { Link } from 'react-router';

export default function Carrito() {
  const { items, removeFromCart, updateQuantity, getTotal, clearCart } = useCart();

  const total = getTotal();
  const deliveryFee = total > 50 ? 0 : 10;
  const finalTotal = total + deliveryFee;

  if (items.length === 0) {
    return (
      <div className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md mx-auto"
          >
            <div className="inline-flex items-center justify-center w-24 h-24 bg-muted rounded-full mb-6">
              <ShoppingBag className="w-12 h-12 text-muted-foreground" />
            </div>
            <h1 className="font-display text-3xl font-bold mb-4">
              Tu carrito está vacío
            </h1>
            <p className="text-muted-foreground mb-8">
              ¡Agrega algunas pizzas deliciosas para comenzar!
            </p>
            <Link to="/menu">
              <Button size="lg">
                Ver Menú
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-4xl font-bold mb-2">
            Carrito de Compras
          </h1>
          <p className="text-muted-foreground">
            Tienes {items.length} {items.length === 1 ? 'producto' : 'productos'} en tu carrito
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-xl p-4 md:p-6 shadow-md border border-border flex flex-col md:flex-row gap-4"
              >
                <div className="w-full md:w-32 h-32 rounded-lg overflow-hidden shrink-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-display text-xl font-bold">
                        {item.name}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {item.description}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-destructive hover:bg-destructive/10 p-2 rounded-lg transition-colors"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-3 bg-muted rounded-lg p-1">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-background rounded transition-colors"
                        aria-label="Disminuir cantidad"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-bold w-8 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-background rounded transition-colors"
                        aria-label="Aumentar cantidad"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-xl text-primary">
                        S/ {(item.price * item.quantity).toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        S/ {item.price.toFixed(2)} c/u
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            <Button
              variant="outline"
              onClick={clearCart}
              className="w-full md:w-auto"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Vaciar Carrito
            </Button>
          </div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="bg-card rounded-xl p-6 shadow-lg border border-border sticky top-24">
              <h2 className="font-display text-2xl font-bold mb-6">
                Resumen del Pedido
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>S/ {total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery</span>
                  <span>
                    {deliveryFee === 0 ? (
                      <span className="text-green-600 font-medium">¡GRATIS!</span>
                    ) : (
                      `S/ ${deliveryFee.toFixed(2)}`
                    )}
                  </span>
                </div>
                {total < 50 && (
                  <p className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
                    💡 Agrega S/ {(50 - total).toFixed(2)} más para delivery gratis
                  </p>
                )}
                <div className="border-t border-border pt-3 flex justify-between font-bold text-xl">
                  <span>Total</span>
                  <span className="text-primary">S/ {finalTotal.toFixed(2)}</span>
                </div>
              </div>

              <Link to="/checkout">
                <Button className="w-full mb-3" size="lg">
                  Proceder al Pago
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>

              <Link to="/menu">
                <Button variant="outline" className="w-full">
                  Seguir Comprando
                </Button>
              </Link>

              {/* Promo Code */}
              <div className="mt-6 pt-6 border-t border-border">
                <label className="block text-sm font-medium mb-2">
                  ¿Tienes un cupón?
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Código de descuento"
                    className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  />
                  <Button variant="secondary" size="sm">
                    Aplicar
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
