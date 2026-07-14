/**
 * Home — Página principal de RapiPizza.
 *
 * Secciones:
 * 1. Hero — Presentación con CTA al menú y promociones
 * 2. Features — Beneficios clave (entrega rápida, delivery gratis, calidad)
 * 3. Banner Promocional — Destaque de oferta semanal
 * 4. Carrusel de Pizzas Más Pedidas — react-slick, responsivo
 * 5. Carrusel de Combos Familiares — react-slick, responsivo
 * 6. CTA Final — Llamada a acción para hacer pedido
 *
 * Completamente responsivo: el hero pasa de dos columnas (desktop)
 * a una columna (móvil), y los carruseles ajustan slidesToShow.
 */

import { motion } from 'motion/react';
import { Link } from 'react-router';
import { ArrowRight, Clock, Truck, Star } from 'lucide-react';
import { popularPizzas, familyCombos } from '../data/products';
import { useCart } from '../context/CartContext';
import { Button } from '../components/ui/button';
import Slider from 'react-slick';
import SlickArrow from '../components/SlickArrow';

export default function Home() {
  const { addToCart } = useCart();

  /**
   * sliderSettings — Configuración del carrusel de pizzas más pedidas.
   *
   * Cambios para móvil:
   * - breakpoint 640px (sm) → 1 slide (antes 480px, que permitía 2 en algunos dispositivos)
   * - Se usa className="slick-equal-height" en el Slider para igualar alturas vía CSS flex
   */
  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    prevArrow: <SlickArrow direction="prev" />,
    nextArrow: <SlickArrow direction="next" />,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
        },
      },
    ],
  };

  /**
   * comboSliderSettings — Configuración del carrusel de combos familiares.
   * En móvil siempre 1 tarjeta para evitar que se corten.
   */
  const comboSliderSettings = {
    ...sliderSettings,
    slidesToShow: 3,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
        },
      },
    ],
  };

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary/95 to-secondary text-primary-foreground py-14 md:py-32">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="font-display text-4xl sm:text-5xl md:text-7xl font-bold mb-4 md:mb-6 leading-tight">
                Auténtica Pizza Artesanal
              </h1>
              <p className="text-base md:text-xl mb-6 md:mb-8 opacity-95">
                Sabores tradicionales hechos con pasión. Ingredientes frescos,
                recetas auténticas y amor en cada bocado.
              </p>
              <div className="flex flex-wrap gap-3 md:gap-4">
                <Link to="/menu">
                  <Button size="lg" variant="secondary" className="group">
                    Ver Menú
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/promociones">
                  <Button
                    size="lg"
                    variant="outline"
                    className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
                  >
                    Ver Promociones
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative mt-4 md:mt-0"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=600&fit=crop"
                  alt="RapiPizza"
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent" />
              </div>
              {/* Floating Badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.8, type: 'spring' }}
                className="absolute -bottom-4 -left-4 md:-bottom-6 md:-left-6 bg-secondary text-secondary-foreground rounded-full p-4 md:p-6 shadow-xl"
              >
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold font-display">2+</div>
                  <div className="text-[10px] md:text-xs">Años de<br />Experiencia</div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-accent/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-40 h-40 bg-secondary/20 rounded-full blur-3xl" />
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Clock,
                title: 'Entrega Rápida',
                description: 'Tu pizza lista en 30 minutos',
              },
              {
                icon: Truck,
                title: 'Seguimiento en Vivo',
                description: 'Ve tu pedido en el mapa en tiempo real',
              },
              {
                icon: Star,
                title: 'Calidad Premium',
                description: 'Ingredientes frescos y de primera',
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-6 rounded-xl hover:bg-muted/50 transition-colors"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                  <feature.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-display text-xl mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Banner Promocional */}
      <section className="py-12 bg-secondary text-secondary-foreground">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              🎉 ¡Ofertas Especiales de la Semana!
            </h2>
            <p className="text-lg mb-6">
              2x1 en pizzas clásicas todos los martes
            </p>
            <Link to="/promociones">
              <Button variant="outline" className="bg-transparent border-secondary-foreground text-secondary-foreground hover:bg-secondary-foreground hover:text-secondary">
                Ver todas las promociones
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Popular Pizzas Carousel */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-4xl font-bold mb-4">
              Pizzas Más Pedidas
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Las favoritas de nuestros clientes, preparadas con ingredientes frescos
              y recetas tradicionales italianas
            </p>
          </motion.div>

          {/*
           * slick-equal-height: clase CSS personalizada (theme.css) que
           * convierte .slick-track en flex y .slick-slide en height:auto
           * para que todas las tarjetas de una fila tengan la misma altura.
           */}
          <div className="relative px-6 md:px-8">
            <Slider {...sliderSettings} className="slick-equal-height">
              {popularPizzas.map((pizza) => (
                <div key={pizza.id} className="px-2 md:px-3">
                  {/*
                   * Tarjeta auto-contenida: no usa flex-1 en la descripción
                   * para evitar que se estire. La imagen usa padding-bottom
                   * trick para mantener aspect-ratio 4/3 sin importar el
                   * ancho del slide.
                   */}
                  <div className="bg-card rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow group slick-card">
                    {/* Imagen — aspect ratio 4/3 sin flex-1 */}
                    <div className="relative overflow-hidden flex-shrink-0" style={{ paddingBottom: '75%' }}>
                      <img
                        src={pizza.image}
                        alt={pizza.name}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-2.5 py-1 rounded-full text-xs font-bold shadow">
                        S/ {pizza.price.toFixed(2)}
                      </div>
                    </div>
                    {/* Contenido — descripción con line-clamp-2, SIN flex-1 */}
                    <div className="p-4 flex flex-col">
                      <h3 className="font-display text-sm md:text-base font-bold mb-1.5 line-clamp-1">
                        {pizza.name}
                      </h3>
                      {/* 2 líneas de descripción fijas, nunca corta los botones */}
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
                        {pizza.description}
                      </p>
                      {/* Botones siempre visibles al fondo con mt-auto */}
                      <div className="flex gap-1.5 mt-auto">
                        <Link to={`/producto/${pizza.detailId ?? pizza.id}`} className="flex-1">
                          <Button variant="outline" className="w-full h-8 text-xs" size="sm">
                            Detalles
                          </Button>
                        </Link>
                        <Button onClick={() => addToCart(pizza)} className="flex-1 h-8 text-xs" size="sm">
                          Agregar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </Slider>
          </div>
        </div>
      </section>

      {/* Family Combos Carousel */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-4xl font-bold mb-4">
              Combos Familiares
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Los mejores combos para compartir en familia o con amigos
            </p>
          </motion.div>

          <div className="relative px-6 md:px-8">
            <Slider {...comboSliderSettings} className="slick-equal-height">
              {familyCombos.map((combo) => (
                <div key={combo.id} className="px-2 md:px-3">
                  {/* Tarjeta auto-contenida — igual estructura que las pizzas */}
                  <div className="bg-card rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow group slick-card">
                    <div className="relative flex-shrink-0" style={{ paddingBottom: '75%' }}>
                      <img
                        src={combo.image}
                        alt={combo.name}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-2.5 py-1 rounded-full text-xs font-bold shadow">
                        S/ {combo.price.toFixed(2)}
                      </div>
                    </div>
                    <div className="p-4 flex flex-col">
                      <h3 className="font-display text-sm md:text-base font-bold mb-1.5 line-clamp-1">
                        {combo.name}
                      </h3>
                      {/* Descripción fija — 2 líneas, sin flex-1 */}
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
                        {combo.description}
                      </p>
                      {/* Botones siempre al fondo */}
                      <div className="flex gap-1.5 mt-auto">
                        <Link to={`/producto/${combo.id}`} className="flex-1">
                          <Button variant="outline" className="w-full h-8 text-xs" size="sm">
                            Detalles
                          </Button>
                        </Link>
                        <Button onClick={() => addToCart(combo)} className="flex-1 h-8 text-xs" size="sm">
                          Agregar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </Slider>
          </div>

          <div className="text-center mt-12">
            <Link to="/menu">
              <Button size="lg" variant="outline">
                Ver Menú Completo
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
              ¿Listo para ordenar?
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Haz tu pedido ahora y disfruta de la mejor pizza italiana en la
              comodidad de tu hogar
            </p>
            <Link to="/menu">
              <Button size="lg" variant="secondary">
                Hacer Pedido Ahora
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
