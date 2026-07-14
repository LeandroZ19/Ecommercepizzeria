/**
 * Checkout — Finalización de pedido.
 * Requiere sesión activa; redirige a /mi-cuenta cuando no está autenticado.
 * Persistencia: escribe directamente en `orders` y `order_items` de Supabase.
 * NO hay delivery gratis — siempre se cobra la tarifa del distrito.
 */

import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createOrder, saveOrderItems, decrementProductStock } from '../../../utils/supabase/db';
import { generateBoletaPDF } from '../components/BoletaPDF';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { CreditCard, Banknote, Truck, Store, CheckCircle, Download, Hash, Package } from 'lucide-react';
import { toast } from 'sonner';
import DistrictSelector, { districts } from '../components/DistrictSelector';

export default function Checkout() {
  const { items, getTotal, clearCart, appliedCoupon, activeDayPromo, getDiscount, getFinalTotal } = useCart();
  const { user, refreshOrders } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      toast.error('Debes iniciar sesión para continuar');
      navigate('/mi-cuenta');
    }
  }, [user, navigate]);

  const [deliveryType,     setDeliveryType]     = useState<'delivery' | 'pickup'>('delivery');
  const [paymentMethod,    setPaymentMethod]     = useState<'card' | 'cash'>('card');
  const [isProcessing,     setIsProcessing]      = useState(false);
  const [selectedDistrict, setSelectedDistrict]  = useState('');
  const [confirmedOrder,   setConfirmedOrder]    = useState<{ id: string; orderNumber: number | null } | null>(null);

  const [formData, setFormData] = useState({
    name:       user?.name    || '',
    email:      user?.email   || '',
    phone:      user?.phone   || '',
    address:    user?.address || '',
    cardNumber: '',
    cardExpiry: '',
    cardCvv:    '',
  });

  const total                 = getTotal();
  const discount              = getDiscount();
  const subtotalAfterDiscount = getFinalTotal();
  const districtData          = districts.find(d => d.name === selectedDistrict);
  const deliveryFee           = deliveryType === 'delivery' ? (districtData?.deliveryFee ?? 0) : 0;
  const finalTotal            = subtotalAfterDiscount + deliveryFee;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsProcessing(true);

    const orderDate = new Date().toISOString();

    try {
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
        subtotal:      total,
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

      if (orderErr || !savedOrder) {
        console.error('[checkout] createOrder error:', orderErr);
        toast.error('Error al guardar el pedido. Intenta nuevamente.');
        setIsProcessing(false);
        return;
      }

      const confirmedOrderId = savedOrder.id;
      const orderNumber      = savedOrder.order_number ?? null;

      // Guardar productos en order_items
      const cartItemsPayload = items.map(item => ({
        productId:    item.id,
        productName:  item.name,
        productImage: item.image ?? null,
        price:        item.price,
        quantity:     item.quantity,
      }));
      const { error: itemsErr } = await saveOrderItems(confirmedOrderId, cartItemsPayload);
      if (itemsErr) {
        console.error('[checkout] saveOrderItems error:', itemsErr);
        toast.warning('Pedido creado, pero no se guardaron los productos. Ejecuta migration 016 en Supabase.');
      }

      // Decrementar stock por nombre (fallback si el trigger DB no está creado aún)
      await Promise.allSettled(
        items.map(item =>
          decrementProductStock(item.name, item.quantity),
        ),
      );

      generateBoletaPDF({
        orderId:        confirmedOrderId,
        orderNumber,
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
        subtotal:   total,
        discount,
        couponCode: appliedCoupon?.code,
        deliveryFee,
        total:      finalTotal,
      });

      clearCart();
      await refreshOrders();
      setConfirmedOrder({ id: confirmedOrderId, orderNumber });

    } catch (err) {
      console.error('[checkout] Unexpected error:', err);
      toast.error('Error al procesar el pedido. Intenta nuevamente.');
    }

    setIsProcessing(false);
  };

  // Pantalla de confirmación con número de cola virtual
  if (confirmedOrder) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card rounded-2xl p-10 shadow-2xl border border-border text-center max-w-md w-full mx-4"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-10 h-10 text-green-600" />
          </motion.div>

          <h1 className="font-display text-3xl font-bold mb-2">¡Pedido Confirmado!</h1>
          <p className="text-muted-foreground mb-8">Tu pedido ha sido recibido y está siendo procesado</p>

          {confirmedOrder.orderNumber && (
            <div className="bg-primary/10 rounded-xl p-6 mb-6">
              <p className="text-sm text-muted-foreground mb-1 flex items-center justify-center gap-1">
                <Hash className="w-4 h-4" />
                Número de Cola Virtual
              </p>
              <p className="font-display text-5xl font-bold text-primary">
                #{confirmedOrder.orderNumber}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Guarda este número para rastrear tu pedido
              </p>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-8">
            <Download className="w-3 h-3" />
            <span>La boleta se descargó automáticamente en PDF</span>
          </div>

          <div className="flex flex-col gap-3">
            <Button asChild className="w-full gap-2">
              <Link to="/mi-cuenta">
                <Package className="w-4 h-4" />
                Ver mis pedidos
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link to="/menu">Seguir comprando</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

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
                <h2 className="font-display text-2xl font-bold mb-6">Tipo de Entrega</h2>
                <RadioGroup
                  value={deliveryType}
                  onValueChange={(value) => setDeliveryType(value as 'delivery' | 'pickup')}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-3 border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="delivery" id="delivery" />
                    <Label htmlFor="delivery" className="flex items-center gap-3 cursor-pointer flex-1">
                      <Truck className="w-5 h-5 text-primary" />
                      <div>
                        <div className="font-medium">Delivery</div>
                        <div className="text-sm text-muted-foreground">
                          {selectedDistrict
                            ? (deliveryFee > 0 ? `S/ ${deliveryFee.toFixed(2)}` : 'Selecciona tu distrito')
                            : 'Selecciona tu distrito'}
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
                        <div className="text-sm text-muted-foreground">Sin costo</div>
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
                <h2 className="font-display text-2xl font-bold mb-6">Método de Pago</h2>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(value) => setPaymentMethod(value as 'card' | 'cash')}
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
                <h2 className="font-display text-2xl font-bold mb-6">Tu Pedido</h2>

                <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.name} × {item.quantity}</span>
                      <span className="font-medium">S/ {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 py-4 border-y border-border">
                  <div className="flex justify-between text-muted-foreground text-sm">
                    <span>Subtotal</span>
                    <span>S/ {total.toFixed(2)}</span>
                  </div>

                  {activeDayPromo && (
                    <div className="flex justify-between text-orange-600 text-sm">
                      <span>🎉 {activeDayPromo.name}</span>
                      <span>-{activeDayPromo.discount}%</span>
                    </div>
                  )}
                  {appliedCoupon && (
                    <div className="flex justify-between text-green-600 text-sm">
                      <span>Cupón ({appliedCoupon.code})</span>
                      <span>-{appliedCoupon.discount}%</span>
                    </div>
                  )}
                  {(activeDayPromo || appliedCoupon) && (
                    <div className="flex justify-between text-green-700 text-sm font-medium">
                      <span>Ahorro total</span>
                      <span>-S/ {discount.toFixed(2)}</span>
                    </div>
                  )}

                  {deliveryType === 'delivery' ? (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Delivery</span>
                      <span className="font-medium">
                        {deliveryFee > 0 ? `S/ ${deliveryFee.toFixed(2)}` : '—'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Recojo en tienda</span>
                      <span className="text-green-600 font-medium">Sin costo</span>
                    </div>
                  )}

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
