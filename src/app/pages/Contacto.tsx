/**
 * Contacto — Formulario de contacto e información de la empresa.
 *
 * Permite al usuario enviar un mensaje directamente al equipo de RapiPizza.
 * Incluye validación básica de campos y un estado de éxito tras el envío.
 * Layout responsivo: columna única en móvil, dos columnas en desktop.
 */

import { motion } from "motion/react";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Facebook,
  Instagram,
  Send,
} from "lucide-react";
import { toast } from "sonner";

export default function Contacto() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(
      "Mensaje enviado correctamente. Te contactaremos pronto.",
    );
    setFormData({
      name: "",
      email: "",
      phone: "",
      message: "",
    });
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const contactInfo = [
    {
      icon: Phone,
      title: "Teléfono",
      content: "+51 903 582 008",
      link: "tel:+51903582008",
    },
    {
      icon: Mail,
      title: "Email",
      content: "info@rapipizza.com",
      link: "mailto:info@rapipizza.com",
    },
    {
      icon: MapPin,
      title: "Ubicación",
      content: "Av. Sucre 112 San Gabriel, Villa María del Triunfo 15811",
      link: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3900.5684422567942!2d-76.9495204!3d-12.141652599999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9105b9fa67dda3fd%3A0x3992178ecca8f2ce!2srappi%20pizza!5e0!3m2!1ses-419!2spe!4v1776186857898!5m2!1ses-419!2spe",
    },
    {
      icon: Clock,
      title: "Horario",
      content: "Lun - Dom: 18:00 PM - 11:30 PM",
      link: null,
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
              Contáctanos
            </h1>
            <p className="text-xl opacity-95">
              ¿Tienes alguna pregunta o sugerencia? Nos
              encantaría escucharte
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-8 md:py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {contactInfo.map((info, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-xl p-6 shadow-md border border-border text-center hover:shadow-xl transition-shadow"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 rounded-full mb-4">
                  <info.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-display text-lg font-bold mb-2">
                  {info.title}
                </h3>
                {info.link ? (
                  <a
                    href={info.link}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {info.content}
                  </a>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {info.content}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Map */}
      <section className="py-8 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Form */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-display text-3xl font-bold mb-6">
                Envíanos un Mensaje
              </h2>
              <form
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="name">
                    Nombre Completo *
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="message">Mensaje *</Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="mt-1"
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                >
                  Enviar Mensaje
                  <Send className="ml-2 w-4 h-4" />
                </Button>
              </form>
            </motion.div>

            {/* Map & Social */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div>
                <h2 className="font-display text-3xl font-bold mb-6">
                  Encuéntranos
                </h2>
                <div className="rounded-xl overflow-hidden shadow-lg border border-border h-80 bg-muted">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3900.5684422567942!2d-76.9495204!3d-12.141652599999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9105b9fa67dda3fd%3A0x3992178ecca8f2ce!2srappi%20pizza!5e0!3m2!1ses-419!2spe!4v1776186857898!5m2!1ses-419!2spe"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Ubicación de Pizzeria Bella"
                  />
                </div>
              </div>

              <div className="bg-card rounded-xl p-6 shadow-md border border-border">
                <h3 className="font-display text-xl font-bold mb-4">
                  Síguenos en Redes Sociales
                </h3>
                <div className="flex gap-4">
                  <a
                    href="https://www.facebook.com/RapiPizzaRapidoyCaliente"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-12 h-12 bg-primary/10 hover:bg-primary hover:text-primary-foreground rounded-full transition-all"
                  >
                    <Facebook className="w-5 h-5" />
                  </a>
                  <a
                    href="https://www.instagram.com/team_rapipizza"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-12 h-12 bg-primary/10 hover:bg-primary hover:text-primary-foreground rounded-full transition-all"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-4xl font-bold mb-4">
              ¿Prefieres llamar?
            </h2>
            <p className="text-xl mb-6">
              Nuestro equipo está listo para atenderte
            </p>
            <a href="tel:+51999888777">
              <Button size="lg" variant="secondary">
                <Phone className="mr-2 w-5 h-5" />
                +51 903 582 008
              </Button>
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  );
}