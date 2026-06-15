/**
 * Promociones — Listado de ofertas vigentes y cupones de descuento.
 *
 * Organiza las promociones en pestañas:
 * - Ofertas del día
 * - Combos especiales
 * - Códigos de cupón
 *
 * Incluye temporizador de cuenta regresiva para ofertas con tiempo limitado.
 * Responsivo con grid adaptable y tabs de scroll horizontal en móvil.
 */

import { motion } from "motion/react";
import { promotions } from "../data/products";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Copy, Check, Gift, Clock, Calendar, Tag, Percent, AlertCircle } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

export default function Promociones() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const today = new Date();
  const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const dailyPromos = promotions.filter(p => p.type === 'daily');
  const comboPromos = promotions.filter(p => p.type === 'combo');
  const seasonalPromos = promotions.filter(p => p.type === 'seasonal');
  const couponPromos = promotions.filter(p => p.type === 'coupon');

  const isDayValid = (dayOfWeek?: number) => {
    if (dayOfWeek === undefined) return true;
    return currentDay === dayOfWeek;
  };

  const getDayName = (dayOfWeek: number) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[dayOfWeek];
  };

  const PromoCard = ({ promo, showDayStatus = false }: any) => {
    const isValidToday = isDayValid(promo.dayOfWeek);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className={`bg-card rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow border ${
          showDayStatus && !isValidToday ? 'border-muted opacity-70' : 'border-border'
        }`}
      >
        <div className="relative h-48 overflow-hidden">
          <img
            src={promo.image}
            alt={promo.name}
            className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute top-4 right-4 bg-secondary text-secondary-foreground px-4 py-2 rounded-full font-bold shadow-lg">
            -{promo.discount}%
          </div>
          {showDayStatus && promo.dayOfWeek !== undefined && (
            <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-full font-bold shadow-lg text-sm ${
              isValidToday
                ? 'bg-green-600 text-white'
                : 'bg-muted text-muted-foreground'
            }`}>
              {isValidToday ? '¡HOY!' : getDayName(promo.dayOfWeek)}
            </div>
          )}
        </div>
        <div className="p-6">
          <h3 className="font-display text-xl font-bold mb-2">
            {promo.name}
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            {promo.description}
          </p>

          {promo.details && (
            <p className="text-sm mb-3 text-foreground">
              {promo.details}
            </p>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
            <Clock className="w-3.5 h-3.5" />
            <span>
              Válido hasta: {new Date(promo.validUntil).toLocaleDateString("es-PE")}
            </span>
          </div>

          {promo.code && (
            <div className="bg-muted rounded-lg p-3 mb-4">
              <p className="text-xs text-muted-foreground mb-2 font-medium">
                CÓDIGO DE DESCUENTO:
              </p>
              <div className="flex items-center justify-between gap-2">
                <code className="font-mono text-base font-bold text-primary">
                  {promo.code}
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyCode(promo.code!)}
                  className="shrink-0"
                >
                  {copiedCode === promo.code ? (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 mr-1" />
                      Copiar
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {promo.terms && promo.terms.length > 0 && (
            <div className="mb-4 bg-muted/50 rounded-lg p-3">
              <p className="text-xs font-medium mb-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Términos y condiciones:
              </p>
              <ul className="space-y-1">
                {promo.terms.map((term: string, idx: number) => (
                  <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{term}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Link to="/menu">
            <Button className="w-full" disabled={showDayStatus && !isValidToday}>
              {showDayStatus && !isValidToday ? 'No disponible hoy' : 'Aplicar Promoción'}
            </Button>
          </Link>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="py-8 md:py-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 md:mb-12"
        >
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Promociones Especiales
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Aprovecha nuestras increíbles ofertas y ahorra en tus pizzas favoritas
          </p>
        </motion.div>

        {/* Featured Promo Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="relative mb-12 md:mb-16 rounded-2xl overflow-hidden shadow-2xl"
        >
          <div className="relative h-64 md:h-96">
            <img
              src="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&h=600&fit=crop"
              alt="Promoción Especial"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/80 to-transparent" />
            <div className="absolute inset-0 flex items-center">
              <div className="container mx-auto px-6 md:px-8">
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="max-w-2xl text-primary-foreground"
                >
                  <Badge className="mb-3 md:mb-4 bg-secondary text-secondary-foreground">
                    <Gift className="w-4 h-4 mr-2" />
                    {currentDay === 2 ? '¡Disponible HOY!' : 'Oferta de la Semana'}
                  </Badge>
                  <h2 className="font-display text-3xl md:text-6xl font-bold mb-3 md:mb-4">
                    2x1 en Pizzas
                  </h2>
                  <p className="text-base md:text-xl mb-4 md:mb-6">
                    Todos los martes en pizzas clásicas. {currentDay !== 2 && '¡Vuelve el próximo martes!'}
                  </p>
                  <Link to="/menu">
                    <Button size="lg" variant="secondary">
                      {currentDay === 2 ? 'Ordenar Ahora' : 'Ver Menú'}
                    </Button>
                  </Link>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs Section */}
        <Tabs defaultValue="daily" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-8">
            <TabsTrigger value="daily" className="gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden md:inline">Ofertas del Día</span>
              <span className="md:hidden">Ofertas</span>
            </TabsTrigger>
            <TabsTrigger value="combos" className="gap-2">
              <Gift className="w-4 h-4" />
              Combos
            </TabsTrigger>
            <TabsTrigger value="seasonal" className="gap-2">
              <Percent className="w-4 h-4" />
              <span className="hidden md:inline">Temporada</span>
              <span className="md:hidden">Temp.</span>
            </TabsTrigger>
            <TabsTrigger value="coupons" className="gap-2">
              <Tag className="w-4 h-4" />
              Cupones
            </TabsTrigger>
          </TabsList>

          {/* Ofertas del Día */}
          <TabsContent value="daily" className="mt-6">
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>Hoy es {getDayName(currentDay)}.</strong> Las ofertas del día solo están disponibles en días específicos de la semana.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dailyPromos.map(promo => (
                <PromoCard key={promo.id} promo={promo} showDayStatus={true} />
              ))}
            </div>
          </TabsContent>

          {/* Combos Familiares */}
          <TabsContent value="combos" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {comboPromos.map(promo => (
                <PromoCard key={promo.id} promo={promo} />
              ))}
            </div>
          </TabsContent>

          {/* Descuentos por Temporada */}
          <TabsContent value="seasonal" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {seasonalPromos.map(promo => (
                <PromoCard key={promo.id} promo={promo} />
              ))}
            </div>
          </TabsContent>

          {/* Cupones */}
          <TabsContent value="coupons" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {couponPromos.map(promo => (
                <PromoCard key={promo.id} promo={promo} />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Newsletter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 md:mt-16 bg-gradient-to-r from-primary to-primary/90 rounded-2xl p-6 md:p-12 text-center text-primary-foreground"
        >
          <h2 className="font-display text-2xl md:text-4xl font-bold mb-3 md:mb-4">
            ¿Quieres recibir más promociones?
          </h2>
          <p className="text-base md:text-lg mb-4 md:mb-6 max-w-2xl mx-auto">
            Suscríbete a nuestro boletín y recibe ofertas exclusivas directamente en tu correo
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Tu correo electrónico"
              className="flex-1 px-4 py-3 rounded-lg border border-black bg-white text-black focus:outline-none focus:ring-2 focus:ring-black text-sm md:text-base"
            />
            <Button variant="secondary" size="lg">
              Suscribirse
            </Button>
          </div>
        </motion.div>

        {/* Terms */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-8 md:mt-12 text-center text-xs md:text-sm text-muted-foreground"
        >
          <p>
            * Las promociones no son acumulables. Consulta términos y condiciones en{" "}
            <Link to="/soporte" className="underline hover:text-primary">
              nuestra página de soporte
            </Link>.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
