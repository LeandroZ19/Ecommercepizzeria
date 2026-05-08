import { motion } from 'motion/react';
import { Heart, Award, Users, Pizza } from 'lucide-react';

export default function Nosotros() {
  const values = [
    {
      icon: Heart,
      title: 'Pasión',
      description: 'Amor por crear pizzas artesanales que deleiten en cada bocado',
    },
    {
      icon: Award,
      title: 'Calidad',
      description: 'Uso de ingredientes frescos y seleccionados cuidadosamente',
    },
    {
      icon: Users,
      title: 'Compromiso',
      description: 'Dedicación para superar las expectativas de nuestros clientes',
    },
    {
      icon: Pizza,
      title: 'Rapidez',
      description: 'Pizzas horneadas al instante, sin perder calidad ni sabor',
    },
  ];

  const milestones = [
    { year: '2024', event: 'Inicio de actividades de Rapipizza en octubre' },
    { year: '2025', event: 'Consolidación de nuestra propuesta artesanal y crecimiento de clientes satisfechos' },
    { year: '2026', event: 'Expansión de nuestros servicios y mejora continua en la experiencia del cliente' },
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary/95 to-secondary text-primary-foreground py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="font-display text-5xl md:text-6xl font-bold mb-6">
              Nuestra Historia
            </h1>
            <p className="text-xl opacity-95">Un nuevo sabor artesanal que conquista Lima desde 2024</p>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Story Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative rounded-2xl overflow-hidden shadow-2xl"
            >
              <img
                src="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=600&fit=crop"
                alt="Nuestra Pizzeria"
                className="w-full h-auto"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-display text-4xl font-bold mb-6">Nuestra Pizzería</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Rapipizza nace en octubre de 2024 con un objetivo claro: ofrecer pizzas artesanales de alta calidad, preparadas al momento y con ingredientes cuidadosamente 
                  seleccionados.Desde el inicio, nos hemos enfocado en brindar una experiencia única, combinando recetas tradicionales con un enfoque moderno que resalta el sabor 
                  auténtico de cada ingrediente.
                </p>
                <p>
                  Cada pizza que sale de nuestro horno refleja nuestro compromiso: masa fresca, mozzarella 
                  de calidad, hierbas aromáticas y una preparación dedicada que busca superar las expectativas
                  de cada cliente.
                </p>
                <p>
                  Hoy, seguimos creciendo con la misma pasión del primer día, llevando a cada mesa una experiencia 
                  deliciosa y memorable.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-card rounded-xl p-8 shadow-lg border border-border"
            >
              <h3 className="font-display text-3xl font-bold mb-4 text-primary">
                Nuestra Misión
              </h3>
              <p className="text-muted-foreground">
                Ofrecer a nuestros clientes la experiencia de la auténtica pizza
                italiana, elaborada con ingredientes frescos de la más alta
                calidad, en un ambiente familiar y acogedor. Queremos que cada
                bocado sea un viaje directo al corazón de Italia.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-xl p-8 shadow-lg border border-border"
            >
              <h3 className="font-display text-3xl font-bold mb-4 text-primary">
                Nuestra Visión
              </h3>
              <p className="text-muted-foreground">
                Convertirnos en la pizzería de referencia en Perú, reconocida por
                mantener viva la tradición italiana mientras innovamos para
                satisfacer los gustos de cada generación. Queremos expandir
                nuestra familia a más hogares peruanos.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-4xl font-bold mb-4">
              Nuestros Valores
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Los pilares que guían nuestro trabajo cada día
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-xl p-6 shadow-md border border-border text-center hover:shadow-xl transition-shadow"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                  <value.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-display text-xl font-bold mb-2">
                  {value.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-4xl font-bold mb-4">
              Nuestra Trayectoria
            </h2>
            <p className="text-lg text-muted-foreground">
              Momentos clave en nuestra historia
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            {milestones.map((milestone, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-8 mb-8 last:mb-0"
              >
                <div className="shrink-0 w-32 text-right">
                  <span className="inline-block bg-primary text-primary-foreground px-4 py-2 rounded-full font-bold">
                    {milestone.year}
                  </span>
                </div>
                <div className="relative flex-1 bg-card rounded-xl p-6 shadow-md border border-border">
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-secondary rounded-full border-4 border-background" />
                  <p className="font-medium">{milestone.event}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
              ¿Quieres ser parte de nuestra historia?
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Únete a miles de familias que ya disfrutan de nuestras pizzas
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
