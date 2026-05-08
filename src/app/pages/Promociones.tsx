import { motion } from "motion/react";
import { promotions } from "../data/products";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Copy, Check, Gift, Clock } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

export default function Promociones() {
  const [copiedCode, setCopiedCode] = useState<string | null>(
    null,
  );

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
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
            Promociones Especiales
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Aprovecha nuestras increíbles ofertas y ahorra en
            tus pizzas favoritas
          </p>
        </motion.div>

        {/* Featured Promo Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="relative mb-16 rounded-2xl overflow-hidden shadow-2xl"
        >
          <div className="relative h-96">
            <img
              src="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&h=600&fit=crop"
              alt="Promoción Especial"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/80 to-transparent" />
            <div className="absolute inset-0 flex items-center">
              <div className="container mx-auto px-8">
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="max-w-2xl text-primary-foreground"
                >
                  <Badge className="mb-4 bg-secondary text-secondary-foreground">
                    <Gift className="w-4 h-4 mr-2" />
                    Oferta de la Semana
                  </Badge>
                  <h2 className="font-display text-5xl md:text-6xl font-bold mb-4">
                    2x1 en Pizzas
                  </h2>
                  <p className="text-xl mb-6">
                    Todos los martes en pizzas clásicas. ¡No te
                    lo pierdas!
                  </p>
                  <Link to="/menu">
                    <Button size="lg" variant="secondary">
                      Ordenar Ahora
                    </Button>
                  </Link>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Promotions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {promotions.map((promo, index) => (
            <motion.div
              key={promo.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="bg-card rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow border border-border"
            >
              <div className="relative h-56 overflow-hidden">
                <img
                  src={promo.image}
                  alt={promo.name}
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-4 right-4 bg-secondary text-secondary-foreground px-4 py-2 rounded-full font-bold shadow-lg">
                  -{promo.discount}%
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-display text-2xl font-bold mb-2">
                  {promo.name}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {promo.description}
                </p>

                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Clock className="w-4 h-4" />
                  <span>
                    Válido hasta:{" "}
                    {new Date(
                      promo.validUntil,
                    ).toLocaleDateString("es-PE")}
                  </span>
                </div>

                {promo.code && (
                  <div className="bg-muted rounded-lg p-4 mb-4">
                    <p className="text-xs text-muted-foreground mb-2 font-medium">
                      CÓDIGO DE DESCUENTO:
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <code className="font-mono text-lg font-bold text-primary">
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
                            <Check className="w-4 h-4 mr-2" />
                            Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copiar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                <Link to="/menu">
                  <Button className="w-full">
                    Aplicar Promoción
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Newsletter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 bg-gradient-to-r from-primary to-primary/90 rounded-2xl p-8 md:p-12 text-center text-primary-foreground"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            ¿Quieres recibir más promociones?
          </h2>
          <p className="text-lg mb-6 max-w-2xl mx-auto">
            Suscríbete a nuestro boletín y recibe ofertas
            exclusivas directamente en tu correo
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Tu correo electrónico"
              className="flex-1 px-4 py-3 rounded-lg border border-black bg-white text-black focus:outline-none focus:ring-2 focus:ring-black"
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
          className="mt-12 text-center text-sm text-muted-foreground"
        >
          <p>
            * Las promociones no son acumulables. Consulta
            términos y condiciones en{" "}
            <Link
              to="/soporte"
              className="underline hover:text-primary"
            >
              nuestra página de soporte
            </Link>
            .
          </p>
        </motion.div>
      </div>
    </div>
  );
}