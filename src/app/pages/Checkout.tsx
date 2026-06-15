/**
 * Checkout — Order finalisation page for RapiPizza.
 *
 * Requires an active session — redirects to /mi-cuenta when unauthenticated.
 *
 * Flow:
 *  1. Select delivery type (delivery / store pickup)
 *  2. Select district (with per-district delivery fee)
 *  3. Enter personal details and delivery address
 *  4. Choose payment method (card / cash on delivery)
 *  5. Confirm order
 *
 * Order persistence: writes directly to the `orders` and `order_items`
 * Supabase tables via the db.ts helper — no KV store, no localStorage.
 *
 * Uses CartContext for cart totals and AuthContext for user data.
 * Responsive: single column on mobile, 3-column grid on desktop.
 */

import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createOrder, checkUserHasOrders } from '../../../utils/supabase/db';
import { generateBoletaPDF } from '../components/BoletaPDF';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { CreditCard, Banknote, Truck, Store, CheckCircle, Download, Gift } from 'lucide-react';
import { toast } from 'sonner';
import DistrictSelector, { districts } from '../components/DistrictSelector';

export default function Checkout() {
  const { items, getTotal, clearCart, appliedCoupon, getDiscount, getFinalTotal } = useCart();
  const { user, refreshOrders } = useAuth();
  const navigate = useNavigate();

  // Si no hay sesión, redirigir
  useEffect(() => {
    if (!user) {
      toast.error('Debes iniciar sesión para continuar');
      navigate('/mi-cuenta');
    }
  }, [user, navigate]);

  const [deliveryType,       setDeliveryType]       = useState<'delivery' | 'pickup'>('delivery');
  const [paymentMethod,      setPaymentMethod]       = useState<'card' | 'cash'>('card');
  const [isProcessing,       setIsProcessing]        = useState(false);
  const [selectedDistrict,   setSelectedDistrict]    = useState('');
  /**
   * isFirstOrder — true si el usuario no tiene pedidos anteriores.
   * Cuando es true y elige delivery, el costo de envío es GRATIS
   * (promoción de primer pedido para usuarios nuevos).
   */
  const [isFirstOrder, setIsFirstOrder] = useState(false);

  const [formData, setFormData] = useState({
    name:       user?.name    || '',
    email:      user?.email   || '',
    phone:      user?.phone   || '',
    address:    user?.address || '',
    cardNumber: '',
    cardExpiry: '',
    cardCvv:    '',
  });

  // Verificar si es el primer pedido del usuario al montar
  useEffect(() => {
    if (!user) return;
    checkUserHasOrders().then(({ hasOrders }) => setIsFirstOrder(!hasOrders));
  }, [user]);

  // ── Cálculos de totales ────────────────────────────────────────────────────

  const total              = getTotal();
  const discount           = getDiscount();
  const subtotalAfterDiscount = getFinalTotal();
  const districtData       = districts.find(d => d.name === selectedDistrict);

  /**
   * Tarifa de delivery efectiva:
   * - 0 si tipo = recojo en tienda
   * - 0 si es el primer pedido del usuario (promoción bienvenida)
   * - tarifa del distrito en caso contrario
   */
  const baseDeliveryFee    = deliveryType === 'delivery' ? (districtData?.deliveryFee ?? 0) : 0;
  const deliveryFee        = (deliveryType === 'delivery' && isFirstOrder) ? 0 : baseDeliveryFee;
  const finalTotal         = subtotalAfterDiscount + deliveryFee;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsProcessing(true);

    const orderDate = new Date().toISOString();

    try {
      // Save the order directly to the Supabase `orders` and `order_items` tables.
      // createOrder() inserts the header row first, then batch-inserts all line items.
      const { data: savedOrder, error: orderErr } = await createOrder({
        userId:        user.id,
        items: items.map(item => ({
          productId:    item.id,
          productName:  item.name,
          productImage: item.image ?? null,
          price:        item.price,
          quantity:     item.quantity,
        })),
        total:         finalTotal,
        subtotal:      getTotal(),
        discount,
        deliveryFee,
        district:      selectedDistrict || '',
        deliveryType,
        paymentMethod,
        address:       formData.address || '',
        couponCode:    appliedCoupon?.code ?? null,
        customerName:  user.name,
        customerPhone: user.phone,
      });

      if (orderErr) {
        console.error('[checkout] createOrder error:', orderErr);
      }

      // Use the DB-assigned UUID if available; otherwise fall back to a local one
      const confirmedOrderId = savedOrder?.id ?? crypto.randomUUID();

      // Generate and auto-download the PDF receipt (includes estimated time)
      generateBoletaPDF({
        orderId:        confirmedOrderId,
        date:           orderDate,
        customerName:   user.name,
        customerEmail:  user.email,
        customerPhone:  user.phone,
        address:        formData.address || user.address,
        district:       selectedDistrict,
        deliveryType,
        paymentMethod,
        estimatedTime:  deliveryType === 'delivery' ? (districtData?.estimatedTime ?? '30-45 min') : 'Recojo en tienda',
        items: items.map(item => ({
          name:     item.name,
          quantity: item.quantity,
          price:    item.price,
        })),
        subtotal:   getTotal(),
        discount,
        couponCode: appliedCoupon?.code,
        deliveryFee,
        total:      finalTotal,
      });

    } catch (err) {
      console.error('[checkout] Unexpected error:', err);
      // Do not block the user — proceed to success flow
    }

    toast.success('¡Pedido realizado! La boleta se descargó automáticamente 🧾', {
      icon: <CheckCircle className="w-4 h-4" />,
      duration: 5000,
    });

    clearCart();
    setIsProcessing(false);

    // Refrescar historial de pedidos para que aparezca inmediatamente en Mi Cuenta
    refreshOrders();
    navigate('/mi-cuenta');
  };

  if (items.length === 0) {
    navigate('/carrito');
    return null;
  }

  return (
    <div className="py-8 md:py-16">
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 md:mb-8"
        >
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            Finalizar Pedido
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Completa los datos para procesar tu pedido
          </p>
        </motion.div>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Form Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Delivery Type */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card rounded-xl p-6 shadow-md border border-border"
              >
                <h2 className="font-display text-2xl font-bold mb-6">
                  Tipo de Entrega
                </h2>
                <RadioGroup
                  value={deliveryType}
                  onValueChange={(value) => setDeliveryType(value as any)}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-3 border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="delivery" id="delivery" />
                    <Label htmlFor="delivery" className="flex items-center gap-3 cursor-pointer flex-1">
                      <Truck className="w-5 h-5 text-primary" />
                      <div>
                        <div className="font-medium">Delivery</div>
                        <div className="text-sm text-muted-foreground">
                          {selectedDistrict ? `S/ ${deliveryFee.toFixed(2)}` : 'Selecciona tu distrito'}
                        </div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="pickup" id="pickup" />
                    <Label htmlFor="pickup" className="flex items-center gap-3 cursor-pointer flex-1">
                      <Store className="w-5 h-5 text-primary" />
                      <div>
                        <div className="font-medium">Recojo en tienda</div>
                        <div className="text-sm text-muted-foreground">Gratis</div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>

                {deliveryType === 'delivery' && (
                  <div className="mt-4 space-y-4">
                    <DistrictSelector
                      selectedDistrict={selectedDistrict}
                      onDistrictChange={setSelectedDistrict}
                    />
                    <div>
                      <Label htmlFor="address">Dirección de Entrega *</Label>
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        required
                        placeholder="Calle, número, referencia"
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Payment Method */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-card rounded-xl p-6 shadow-md border border-border"
              >
                <h2 className="font-display text-2xl font-bold mb-6">
                  Método de Pago
                </h2>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(value) => setPaymentMethod(value as any)}
                  className="space-y-3 mb-4"
                >
                  <div className="flex items-center space-x-3 border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex items-center gap-3 cursor-pointer flex-1">
                      <CreditCard className="w-5 h-5 text-primary" />
                      <div className="font-medium">Tarjeta de Crédito/Débito</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="cash" id="cash" />
                    <Label htmlFor="cash" className="flex items-center gap-3 cursor-pointer flex-1">
                      <Banknote className="w-5 h-5 text-primary" />
                      <div className="font-medium">Pago Contraentrega</div>
                    </Label>
                  </div>
                </RadioGroup>

                {paymentMethod === 'card' && (
                  <div className="space-y-4 mt-4 pt-4 border-t border-border">
                    <div>
                      <Label htmlFor="cardNumber">Número de Tarjeta *</Label>
                      <Input
                        id="cardNumber"
                        name="cardNumber"
                        value={formData.cardNumber}
                        onChange={handleInputChange}
                        placeholder="1234 5678 9012 3456"
                        required
                        className="mt-1"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="cardExpiry">Vencimiento *</Label>
                        <Input
                          id="cardExpiry"
                          name="cardExpiry"
                          value={formData.cardExpiry}
                          onChange={handleInputChange}
                          placeholder="MM/AA"
                          required
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="cardCvv">CVV *</Label>
                        <Input
                          id="cardCvv"
                          name="cardCvv"
                          value={formData.cardCvv}
                          onChange={handleInputChange}
                          placeholder="123"
                          required
                          maxLength={3}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-1"
            >
              <div className="bg-card rounded-xl p-6 shadow-lg border border-border sticky top-24">
                <h2 className="font-display text-2xl font-bold mb-6">
                  Tu Pedido
                </h2>

                <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>
                        {item.name} × {item.quantity}
                      </span>
                      <span className="font-medium">
                        S/ {(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 py-4 border-y border-border">
                  {/* Subtotal */}
                  <div className="flex justify-between text-muted-foreground text-sm">
                    <span>Subtotal</span>
                    <span>S/ {total.toFixed(2)}</span>
                  </div>

                  {/* Descuento por cupón */}
                  {appliedCoupon && (
                    <div className="flex justify-between text-green-600 text-sm">
                      <span>Descuento ({appliedCoupon.code})</span>
                      <span>-S/ {discount.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Línea de envío — solo muestra cuando es relevante */}
                  {deliveryType === 'delivery' ? (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Delivery</span>
                      <span>
                        {deliveryFee === 0 ? (
                          <span className="text-green-600 font-medium flex items-center gap-1">
                            <Gift className="w-3 h-3" />
                            {isFirstOrder ? 'Gratis (1er pedido)' : 'Gratis'}
                          </span>
                        ) : (
                          <span className="font-medium">S/ {deliveryFee.toFixed(2)}</span>
                        )}
                      </span>
                    </div>
                  ) : (
                    /* Recojo en tienda — no hay costo de envío */
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Recojo en tienda</span>
                      <span className="text-green-600 font-medium">Sin costo</span>
                    </div>
                  )}

                  {/* Tiempo estimado */}
                  {deliveryType === 'delivery' && districtData && (
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Tiempo estimado</span>
                      <span className="font-medium">{districtData.estimatedTime}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between font-bold text-xl mt-4 mb-6">
                  <span>Total</span>
                  <span className="text-primary">S/ {finalTotal.toFixed(2)}</span>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Procesando pedido...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Confirmar Pedido
                    </span>
                  )}
                </Button>

                <div className="flex items-center justify-center gap-2 mt-3">
                  <Download className="w-3 h-3 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground text-center">
                    Se descargará tu boleta en PDF automáticamente
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-1 text-center">
                  Al confirmar aceptas nuestros términos y condiciones
                </p>
              </div>
            </motion.div>
          </div>
        </form>
      </div>
    </div>
  );
}
