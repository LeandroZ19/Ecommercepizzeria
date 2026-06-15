/**
 * Soporte — Centro de ayuda con preguntas frecuentes y políticas.
 *
 * Organiza el contenido en tres pestañas:
 * - Preguntas frecuentes (acordeón)
 * - Términos y condiciones
 * - Política de privacidad
 *
 * Responsivo con tabs de scroll horizontal en móvil.
 */

import { motion } from 'motion/react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { HelpCircle, FileText, Shield } from 'lucide-react';

export default function Soporte() {
  const faqs = [
    {
      question: '¿Cuál es el tiempo de entrega?',
      answer: 'Nuestro tiempo promedio de entrega es de 30-45 minutos.',
    },
    {
      question: '¿Cuál es el monto mínimo para delivery?',
      answer: 'No tenemos monto mínimo, pero el delivery es gratis en pedidos mayores a S/ 50.',
    },
    {
      question: '¿Puedo personalizar mi pizza?',
      answer: 'Sí, ofrecemos la opción de crear tu pizza personalizada eligiendo masa, salsa e ingredientes a tu gusto.',
    },
    {
      question: '¿Aceptan tarjetas de crédito/débito?',
      answer: 'Sí, aceptamos todas las tarjetas de crédito y débito, además de pago en efectivo contraentrega.',
    },
    {
      question: '¿Tienen opciones vegetarianas o veganas?',
      answer: 'Sí, tenemos varias opciones vegetarianas y podemos preparar pizzas veganas bajo pedido con queso vegano.',
    },
    {
      question: '¿Puedo cancelar mi pedido?',
      answer: 'Puedes cancelar tu pedido llamándonos inmediatamente después de realizarlo. Una vez que la pizza está en el horno, no podemos cancelar.',
    },
    {
      question: '¿Hacen envíos a todo Lima?',
      answer: 'Actualmente hacemos delivery en Villa María del Triunfo, Villa el Salvador, Miraflores, San Isidro, Barranco, Surco y distritos cercanos.',
    },
    {
      question: '¿Los ingredientes son frescos?',
      answer: 'Todos nuestros ingredientes son frescos y seleccionados diariamente. La masa se prepara cada mañana.',
    },
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary via-primary/95 to-secondary text-primary-foreground py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="font-display text-5xl md:text-6xl font-bold mb-6">
              Centro de Ayuda
            </h1>
            <p className="text-xl opacity-95">
              Encuentra respuestas a tus preguntas más frecuentes
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 md:py-16 bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
          <Tabs defaultValue="faq" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="faq">
                <HelpCircle className="w-4 h-4 mr-2" />
                Preguntas Frecuentes
              </TabsTrigger>
              <TabsTrigger value="policies">
                <FileText className="w-4 h-4 mr-2" />
                Políticas
              </TabsTrigger>
              <TabsTrigger value="terms">
                <Shield className="w-4 h-4 mr-2" />
                Términos
              </TabsTrigger>
            </TabsList>

            {/* FAQs */}
            <TabsContent value="faq">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2 className="font-display text-3xl font-bold mb-6">
                  Preguntas Frecuentes
                </h2>
                <Accordion type="single" collapsible className="space-y-4">
                  {faqs.map((faq, index) => (
                    <AccordionItem
                      key={index}
                      value={`item-${index}`}
                      className="bg-card rounded-xl px-6 border border-border shadow-sm"
                    >
                      <AccordionTrigger className="hover:no-underline">
                        <span className="text-left font-medium">
                          {faq.question}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </motion.div>
            </TabsContent>

            {/* Policies */}
            <TabsContent value="policies">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-xl p-8 shadow-md border border-border"
              >
                <h2 className="font-display text-3xl font-bold mb-6">
                  Políticas de la Empresa
                </h2>

                <div className="space-y-8 text-muted-foreground">
                  <div>
                    <h3 className="font-display text-xl font-bold text-foreground mb-3">
                      Política de Envíos
                    </h3>
                    <ul className="list-disc list-inside space-y-2">
                      <li>Tiempo de entrega estimado: 30-45 minutos</li>
                      <li>Delivery gratis en pedidos mayores a S/ 50</li>
                      <li>Tarifa de delivery estándar: S/ 10</li>
                      <li>Si tu pedido tarda más de 60 minutos, el delivery es gratis</li>
                      <li>Cobertura: Miraflores, San Isidro, Barranco, Surco y distritos cercanos</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-display text-xl font-bold text-foreground mb-3">
                      Política de Devoluciones
                    </h3>
                    <ul className="list-disc list-inside space-y-2">
                      <li>Si no estás satisfecho con tu pedido, contáctanos de inmediato</li>
                      <li>Reemplazaremos cualquier producto que no cumpla con nuestros estándares de calidad</li>
                      <li>Los reclamos deben hacerse dentro de las 24 horas posteriores a la entrega</li>
                      <li>Se requiere evidencia fotográfica para procesar devoluciones</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-display text-xl font-bold text-foreground mb-3">
                      Política de Pagos
                    </h3>
                    <ul className="list-disc list-inside space-y-2">
                      <li>Aceptamos tarjetas de crédito, débito y pago en efectivo</li>
                      <li>El pago se procesa al momento de realizar el pedido (tarjeta) o al recibir (efectivo)</li>
                      <li>Emitimos comprobantes electrónicos para todos los pedidos</li>
                      <li>Los precios pueden variar sin previo aviso</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-display text-xl font-bold text-foreground mb-3">
                      Política de Privacidad
                    </h3>
                    <ul className="list-disc list-inside space-y-2">
                      <li>Protegemos tus datos personales según la Ley de Protección de Datos</li>
                      <li>No compartimos tu información con terceros sin tu consentimiento</li>
                      <li>Usamos tu información solo para procesar pedidos y mejorar nuestro servicio</li>
                      <li>Puedes solicitar la eliminación de tus datos en cualquier momento</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            </TabsContent>

            {/* Terms */}
            <TabsContent value="terms">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-xl p-8 shadow-md border border-border"
              >
                <h2 className="font-display text-3xl font-bold mb-6">
                  Términos y Condiciones
                </h2>

                <div className="space-y-6 text-muted-foreground">
                  <div>
                    <h3 className="font-display text-lg font-bold text-foreground mb-2">
                      1. Aceptación de Términos
                    </h3>
                    <p>
                      Al realizar un pedido en Pizzeria Bella, aceptas estos términos y condiciones.
                      Si no estás de acuerdo, por favor no realices pedidos.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-display text-lg font-bold text-foreground mb-2">
                      2. Pedidos y Confirmación
                    </h3>
                    <p>
                      Todos los pedidos están sujetos a disponibilidad. Nos reservamos el derecho
                      de rechazar o cancelar cualquier pedido por razones que incluyen, pero no se
                      limitan a: disponibilidad de productos, errores en precios o en el pedido,
                      o problemas con la cuenta del cliente.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-display text-lg font-bold text-foreground mb-2">
                      3. Precios y Pagos
                    </h3>
                    <p>
                      Todos los precios están en Soles peruanos (S/) e incluyen IGV. Los precios
                      pueden cambiar sin previo aviso. El pago debe realizarse en su totalidad al
                      momento de la compra o entrega, según el método seleccionado.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-display text-lg font-bold text-foreground mb-2">
                      4. Entrega
                    </h3>
                    <p>
                      Hacemos nuestro mejor esfuerzo para entregar en el tiempo estimado, pero los
                      tiempos de entrega son aproximados y pueden variar debido a circunstancias
                      fuera de nuestro control. No nos hacemos responsables por retrasos causados
                      por el tráfico, clima u otras condiciones externas.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-display text-lg font-bold text-foreground mb-2">
                      5. Calidad y Seguridad Alimentaria
                    </h3>
                    <p>
                      Cumplimos con todos los estándares de seguridad alimentaria. Sin embargo,
                      algunos productos pueden contener alérgenos. Es responsabilidad del cliente
                      informarnos sobre alergias o restricciones dietéticas al momento de ordenar.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-display text-lg font-bold text-foreground mb-2">
                      6. Responsabilidad
                    </h3>
                    <p>
                      Pizzeria Bella no se hace responsable por daños indirectos o consecuentes
                      que surjan del uso de nuestros productos o servicios. Nuestra responsabilidad
                      máxima se limita al valor del pedido realizado.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-display text-lg font-bold text-foreground mb-2">
                      7. Modificaciones
                    </h3>
                    <p>
                      Nos reservamos el derecho de modificar estos términos y condiciones en
                      cualquier momento. Los cambios entrarán en vigencia inmediatamente después
                      de su publicación en nuestro sitio web.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-display text-lg font-bold text-foreground mb-2">
                      8. Contacto
                    </h3>
                    <p>
                      Para cualquier consulta sobre estos términos y condiciones, contáctanos en
                      info@pizzeriabella.com o al +51 903 582 008
                    </p>
                  </div>

                  <div className="pt-6 border-t border-border">
                    <p className="text-sm">
                      Última actualización: 14 de abril de 2026
                    </p>
                  </div>
                </div>
              </motion.div>
            </TabsContent>
          </Tabs>

          {/* Contact CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 bg-gradient-to-r from-primary to-primary/90 rounded-2xl p-8 text-center text-primary-foreground"
          >
            <h3 className="font-display text-2xl font-bold mb-4">
              ¿No encontraste lo que buscabas?
            </h3>
            <p className="mb-6">
              Nuestro equipo de soporte está listo para ayudarte
            </p>
            <a href="/contacto">
              <button className="bg-secondary text-secondary-foreground px-6 py-3 rounded-lg font-medium hover:bg-secondary/90 transition-colors">
                Contáctanos
              </button>
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
