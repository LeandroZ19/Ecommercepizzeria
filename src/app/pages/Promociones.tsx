/**
 * Promociones — Página de ofertas y cupones de RapiPizza.
 *
 * Carga las promociones desde la tabla `promotions` de Supabase (migración 003).
 * Si la carga falla, usa los datos locales de `products.ts` como respaldo.
 *
 * Pestañas:
 *  - Ofertas del Día   (type: 'daily')  — dependen del día de la semana
 *  - Combos            (type: 'combo')  — bundles especiales
 *  - Temporada         (type: 'seasonal') — promociones de tiempo limitado
 *  - Cupones           (type: 'coupon') — códigos para usar en el checkout
 *
 * Responsivo con grid adaptable y tabs de scroll horizontal en móvil.
 */

import { motion } from "motion/react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Copy, Check, Gift, Clock, Calendar, Tag, Percent,
  AlertCircle, Sparkles, Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router";
import { fetchPromotions, type PromotionRow } from "../../../utils/supabase/db";
import { promotions as localPromotions } from "../data/products";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Convierte un PromotionRow de Supabase al formato utilizado por PromoCard.
 * El formato local de products.ts y el de Supabase son muy similares;
 * esta función los unifica para que PromoCard funcione con ambas fuentes.
 */
function rowToPromo(row: PromotionRow) {
  return {
    id:          row.id,
    name:        row.name,
    description: row.description,
    discount:    row.discount,
    image:       row.image ?? '',
    validUntil:  row.valid_until ?? '2099-12-31',
    code:        row.code,
    type:        row.type,
    details:     row.details,
    terms:       row.terms ?? [],
    dayOfWeek:   row.day_of_week ?? undefined,
  };
}

const DAY_NAMES = ['Domingo','Lunes','Martes','Miercoles','Jueves','Viernes','Sabado'];

// ─── Componente de tarjeta de promoción ──────────────────────────────────────

/**
 * PromoCard — Tarjeta individual de promoción.
 *
 * Muestra imagen, porcentaje de descuento, descripción, código de cupón
 * (con botón copiar), términos y condiciones y CTA al menú.
 *
 * Cuando `showDayStatus` es true, indica si la promo está activa hoy.
 */
function PromoCard({
  promo,
  showDayStatus = false,
  copiedCode,
  onCopy,
}: {
  promo:         ReturnType<typeof rowToPromo>;
  showDayStatus?: boolean;
  copiedCode:    string | null;
  onCopy:        (code: string) => void;
}) {
  const today        = new Date().getDay();
  const isValidToday = promo.dayOfWeek === undefined || promo.dayOfWeek === today;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`bg-card rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow border ${
        showDayStatus && !isValidToday ? 'border-muted opacity-70' : 'border-border'
      }`}
    >
      {/* Imagen */}
      <div className="relative h-44 overflow-hidden">
        <img
          src={promo.image}
          alt={promo.name}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {/* Badge de descuento */}
        <div className="absolute top-3 right-3 bg-primary text-white px-3 py-1.5 rounded-full font-bold shadow text-sm">
          -{promo.discount}%
        </div>
        {/* Indicador de día (solo Ofertas del Día) */}
        {showDayStatus && promo.dayOfWeek !== undefined && (
          <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full font-bold text-xs shadow ${
            isValidToday ? 'bg-green-600 text-white' : 'bg-black/60 text-white'
          }`}>
            {isValidToday ? 'HOY!' : DAY_NAMES[promo.dayOfWeek]}
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="p-5">
        <h3 className="font-display text-lg font-bold mb-1.5">{promo.name}</h3>
        <p className="text-sm text-muted-foreground mb-3">{promo.description}</p>

        {promo.details && (
          <p className="text-sm mb-3 text-foreground">{promo.details}</p>
        )}

        {/* Fecha de vencimiento */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
          <Clock className="w-3.5 h-3.5" />
          <span>Valido hasta: {new Date(promo.validUntil).toLocaleDateString('es-PE')}</span>
        </div>

        {/* Cupón copiable */}
        {promo.code && (
          <div className="bg-muted rounded-lg p-3 mb-4">
            <p className="text-xs text-muted-foreground font-medium mb-1.5">CODIGO DE DESCUENTO:</p>
            <div className="flex items-center justify-between gap-2">
              <code className="font-mono text-base font-bold text-primary">{promo.code}</code>
              <Button size="sm" variant="ghost" onClick={() => onCopy(promo.code!)} className="shrink-0 h-7 text-xs">
                {copiedCode === promo.code ? (
                  <><Check className="w-3 h-3 mr-1" />Copiado</>
                ) : (
                  <><Copy className="w-3 h-3 mr-1" />Copiar</>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Términos */}
        {promo.terms && promo.terms.length > 0 && (
          <div className="mb-4 bg-muted/40 rounded-lg p-3">
            <p className="text-xs font-medium mb-1.5 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Terminos y condiciones:
            </p>
            <ul className="space-y-1">
              {promo.terms.map((term, idx) => (
                <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                  <span>{term}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* CTA */}
        <Link to="/menu">
          <Button className="w-full h-9 text-sm" disabled={showDayStatus && !isValidToday}>
            {showDayStatus && !isValidToday ? 'No disponible hoy' : 'Aplicar Promocion'}
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

/** Página de promociones con carga dinámica desde Supabase */
export default function Promociones() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [promoList,  setPromoList]  = useState<ReturnType<typeof rowToPromo>[]>([]);
  const [loading,    setLoading]    = useState(true);

  const today      = new Date().getDay();

  // Cargar promociones desde Supabase
  useEffect(() => {
    fetchPromotions().then(({ data, error }) => {
      if (!error && data.length > 0) {
        setPromoList(data.map(rowToPromo));
      } else {
        // Fallback a datos locales
        setPromoList(
          localPromotions.map(p => ({
            id:         p.id,
            name:       p.name,
            description: p.description,
            discount:   p.discount,
            image:      p.image,
            validUntil: p.validUntil,
            code:       p.code,
            type:       p.type,
            details:    p.details ?? '',
            terms:      p.terms ?? [],
            dayOfWeek:  p.dayOfWeek,
          })),
        );
      }
      setLoading(false);
    });
  }, []);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Filtrar por tipo
  const dailyPromos    = promoList.filter(p => p.type === 'daily');
  const comboPromos    = promoList.filter(p => p.type === 'combo');
  const seasonalPromos = promoList.filter(p => p.type === 'seasonal');
  const couponPromos   = promoList.filter(p => p.type === 'coupon');

  // Props comunes para las tarjetas
  const cardProps = { copiedCode, onCopy: copyCode };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="py-8 md:py-16">
      <div className="container mx-auto px-4">

        {/* Encabezado */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 md:mb-12"
        >
          <h1 className="font-display text-3xl md:text-5xl font-bold mb-3">
            Promociones Especiales
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Aprovecha nuestras increibles ofertas y ahorra en tus pizzas favoritas
          </p>
        </motion.div>

        {/* Banner hero del martes 2x1 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="relative mb-10 md:mb-14 rounded-2xl overflow-hidden shadow-2xl"
        >
          <div className="relative h-56 md:h-80">
            <img
              src="https://images.rappi.pe/products/832b8fba-9420-4567-937a-1b94cc879441-1747724658545.png?d=600x600&e=webp"
              alt="Martes 2x1"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/75 to-transparent" />
            <div className="absolute inset-0 flex items-center px-6 md:px-12">
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="text-white max-w-md"
              >
                <Badge className="mb-3 bg-secondary text-secondary-foreground text-xs">
                  <Gift className="w-3 h-3 mr-1" />
                  {today === 2 ? 'Disponible HOY!' : 'Oferta Semanal'}
                </Badge>
                <h2 className="font-display text-3xl md:text-5xl font-bold mb-2">2x1 en Pizzas</h2>
                <p className="text-sm md:text-base mb-4 opacity-90">
                  Todos los martes en pizzas clasicas.
                  {today !== 2 && ' Vuelve el proximo martes!'}
                </p>
                <Link to="/menu">
                  <Button size="lg" variant="secondary">
                    {today === 2 ? 'Ordenar Ahora' : 'Ver Menu'}
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" aria-label="Cargando promociones" />
          </div>
        )}

        {/* Tabs de promociones */}
        {!loading && (
          <Tabs defaultValue="daily" className="w-full">
            {/* Navegación de tabs — scroll horizontal en móvil */}
            <TabsList className="flex overflow-x-auto scrollbar-hide gap-1 mb-6 w-full h-auto p-1">
              <TabsTrigger value="daily" className="flex-shrink-0 gap-1.5 text-xs md:text-sm">
                <Calendar className="w-3.5 h-3.5" />
                Ofertas del Dia ({dailyPromos.length})
              </TabsTrigger>
              <TabsTrigger value="combos" className="flex-shrink-0 gap-1.5 text-xs md:text-sm">
                <Gift className="w-3.5 h-3.5" />
                Combos ({comboPromos.length})
              </TabsTrigger>
              <TabsTrigger value="seasonal" className="flex-shrink-0 gap-1.5 text-xs md:text-sm">
                <Sparkles className="w-3.5 h-3.5" />
                Temporada ({seasonalPromos.length})
              </TabsTrigger>
              <TabsTrigger value="coupons" className="flex-shrink-0 gap-1.5 text-xs md:text-sm">
                <Tag className="w-3.5 h-3.5" />
                Cupones ({couponPromos.length})
              </TabsTrigger>
            </TabsList>

            {/* ── Ofertas del Día ── */}
            <TabsContent value="daily">
              <div className="mb-5 bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-900">
                  <strong>Hoy es {DAY_NAMES[today]}.</strong>{' '}
                  Las ofertas del dia solo estan disponibles en dias especificos de la semana.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {dailyPromos.map(p => (
                  <PromoCard key={p.id} promo={p} showDayStatus {...cardProps} />
                ))}
              </div>
            </TabsContent>

            {/* ── Combos ── */}
            <TabsContent value="combos">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {comboPromos.map(p => (
                  <PromoCard key={p.id} promo={p} {...cardProps} />
                ))}
              </div>
            </TabsContent>

            {/* ── Temporada ── */}
            <TabsContent value="seasonal">
              {seasonalPromos.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Proximamente nuevas promociones de temporada</p>
                  <p className="text-sm mt-1">Ejecuta la migracion 003 en Supabase para ver las promociones.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {seasonalPromos.map(p => (
                    <PromoCard key={p.id} promo={p} {...cardProps} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ── Cupones ── */}
            <TabsContent value="coupons">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {couponPromos.map(p => (
                  <PromoCard key={p.id} promo={p} {...cardProps} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* CTA suscripción */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 md:mt-16 bg-gradient-to-r from-primary to-primary/90 rounded-2xl p-6 md:p-10 text-center text-white"
        >
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-3">
            Recibe mas promociones
          </h2>
          <p className="text-sm md:text-base mb-5 max-w-xl mx-auto opacity-90">
            Suscribete a nuestro boletin y recibe ofertas exclusivas directamente en tu correo
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Tu correo electronico"
              className="flex-1 px-4 py-3 rounded-lg border border-transparent bg-white text-black focus:outline-none focus:ring-2 focus:ring-white/50 text-sm"
            />
            <Button variant="secondary" size="lg">Suscribirse</Button>
          </div>
        </motion.div>

        {/* Nota legal */}
        <div className="mt-8 text-center text-xs text-muted-foreground">
          * Las promociones no son acumulables entre si. Consulta{' '}
          <Link to="/soporte" className="underline hover:text-primary">terminos y condiciones</Link>.
        </div>
      </div>
    </div>
  );
}
