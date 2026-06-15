/**
 * Chatbot — Widget de asistente virtual flotante para RapiPizza.
 *
 * Responde preguntas frecuentes sobre el menú, precios, delivery,
 * horarios y el sistema de pedidos usando un motor de reglas basado
 * en palabras clave. Accesible via teclado y compatible con lectores
 * de pantalla.
 *
 * No requiere backend: todas las respuestas son locales.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, Bot, User, RotateCcw } from 'lucide-react';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Message {
  /** Identificador único del mensaje */
  id: string;
  /** Origen del mensaje */
  role: 'user' | 'bot';
  /** Contenido textual */
  text: string;
  /** Marca de tiempo */
  timestamp: Date;
}

interface QuickReply {
  /** Etiqueta visible */
  label: string;
  /** Texto que se envía al chatbot */
  value: string;
}

// ─── Base de conocimiento ─────────────────────────────────────────────────────

/**
 * Cada entrada del knowledge base define:
 * - keywords: palabras que disparan la respuesta (minúsculas)
 * - response: texto de respuesta del bot
 */
interface KBEntry {
  keywords: string[];
  response: string;
}

const KNOWLEDGE_BASE: KBEntry[] = [
  {
    keywords: ['hola', 'buenos', 'buenas', 'hey', 'hi', 'saludos', 'ola'],
    response: '¡Hola! 👋 Bienvenido a RapiPizza. Soy tu asistente virtual. Puedo ayudarte con el menú, precios, combos, delivery y más. ¿En qué te puedo ayudar?',
  },
  {
    keywords: ['menu', 'menú', 'carta', 'qué tienen', 'que tienen', 'opciones', 'productos'],
    response: '🍕 Nuestro menú completo incluye:\n\n**🔥 Combo Rapilover** (desde S/ 41.90)\n• Combo Rapilover, Pizza Doble, para Compartir (3 pizzas), 4U Para Ti\n\n**⭐ Promo Ame & Peppe** (S/ 25.90 c/u)\n• Pizza Americana y Pizza Pepperoni\n\n**🎉 Promo Rapilover** (desde S/ 52.90)\n• Familiar, Tri Clásico, Familiar x2, Tridente Supremo\n\n**🍕 Pizza Personal** — S/ 12.00 (9 sabores)\n\n**📦 Combos 6 Porciones** (desde S/ 39.90)\n• 6 combos diferentes con bebida incluida\n\n**👨‍👩‍👧‍👦 Promos 8 Porciones** (desde S/ 51.90)\n• 7 promos para familia\n\n**💥 Promos Extremas** (desde S/ 59.90)\n• Pizza con 8 ingredientes + extra queso\n\n**🧄 Complementos**\n• Pan al ajo tradicional S/ 10.90, especial S/ 15.90, Crema Rapipizza S/ 3.00',
  },
  {
    keywords: ['combo rapilover', 'rapilover'],
    response: '🔥 **Combos Rapilover:**\n• **Combo Rapilover** — Pizza americana grande + pan al ajo (4) + Pepsi 1lt → **S/ 41.90**\n• **Combo Pizza Doble** — 2 pizzas grandes + Pepsi 1lt → **S/ 56.90**\n• **Combo para Compartir** — 3 pizzas grandes (americana/pepperoni) + Pepsi 1lt → **S/ 70.90**\n• **Combo 4U Para Ti** — 4 pizzas grandes + Pepsi 1lt → **S/ 98.90**',
  },
  {
    keywords: ['pizza personal', 'personal', '12', 'sabores'],
    response: '🍕 **Pizza Personal Cualquier Sabor — S/ 12.00**\n\nElige entre 9 sabores:\n• Americana\n• Pepperoni\n• Hawaiana\n• Vegetariana\n• Pepperoni Especial\n• Carnívora\n• Mixta\n• Alemana\n• Carnívora Tropical\n\n¡Perfecta para ti solo! 😋',
  },
  {
    keywords: ['promo 8', 'promo ocho', '8 porciones', 'familiar'],
    response: '👨‍👩‍👧‍👦 **Promos 8 Porciones (Familiares):**\n• Promo 1 — Pizza americana familiar + pan al ajo (8) + bebida 1.5lt → **S/ 51.90**\n• Promo 2 — 2 pizzas familiares (pepperoni) → **S/ 64.00**\n• Promo 3 — 3 pizzas familiares clásicas → **S/ 77.00**\n• Promo 4 — Pizza especial familiar + pan al ajo + bebida → **S/ 55.90**\n• Promo 5 — 2 pizzas familiares + bebida 1.5lt → **S/ 71.90**\n• Promo 6 — 2 pizzas especiales + pan al ajo (8) + bebida → **S/ 84.90**\n• Promo 7 — 3 pizzas familiares + bebida 1.5lt → **S/ 96.90**',
  },
  {
    keywords: ['extrema', 'extremo', 'promo extrema', '8 ingredientes'],
    response: '💥 **Promos Extremas:**\n• **Promo Extrema 1** — 1 pizza extrema (8 ingredientes + extra queso) + pan al ajo (8) + bebida → **S/ 59.90**\n• **Promo Extrema 2** — 2 pizzas extremas + pan al ajo (8) + bebida 1.5lt → **S/ 88.90**\n\nLa pizza extrema incluye 8 ingredientes seleccionados + doble queso. ¡Para los amantes del sabor intenso! 🔥',
  },
  {
    keywords: ['complemento', 'complementos', 'pan al ajo', 'pan ajo', 'crema', 'rocoto'],
    response: '🧄 **Complementos:**\n• **Pan al Ajo Tradicional** — 8 panecillos con mantequilla al ajo → **S/ 10.90**\n• **Pan al Ajo Especial** — 8 panecillos con mantequilla al ajo + queso cheddar + 100g mozzarella → **S/ 15.90**\n• **Crema Rapipizza** — 2 tapecitos de crema de rocoto → **S/ 3.00**',
  },
  {
    keywords: ['precio', 'precios', 'cuánto', 'cuanto', 'cuesta', 'vale', 'costo', 'barato'],
    response: '💰 **Resumen de precios:**\n• Pizza Personal: **S/ 12.00**\n• Pizza Americana / Pepperoni: **S/ 25.90**\n• Combo Rapilover: desde **S/ 41.90**\n• Combos 6 Porciones: desde **S/ 39.90**\n• Promos 8 Porciones: desde **S/ 51.90**\n• Promos Extremas: desde **S/ 59.90**\n• Pan al ajo: desde **S/ 10.90**\n\n¡Tenemos opciones para todos los presupuestos!',
  },
  {
    keywords: ['delivery', 'entrega', 'envío', 'envio', 'llegar', 'tiempo', 'demora', 'cuánto demora', 'rapido'],
    response: '🚚 **Información de Delivery:**\n• **Tiempo estimado**: 25–45 minutos según la zona\n• **Costo de delivery**: varía por distrito (se calcula en el checkout)\n• Cubrimos Villa María del Triunfo, Villa El Salvador y distritos cercanos\n\n¡También puedes recoger tu pedido en nuestra tienda sin costo adicional! 🏪',
  },
  {
    keywords: ['horario', 'horarios', 'hora', 'abierto', 'abre', 'cierra', 'disponible'],
    response: '🕐 **Horarios de Atención:**\n• **Lunes a Jueves**: 18:00 – 23:30\n• **Viernes y Sábado**: 18:00 – 00:00\n• **Domingo**: 18:00 – 23:30\n\nDelivery hasta 30 minutos antes del cierre. 🍕',
  },
  {
    keywords: ['promoción', 'promociones', 'oferta', 'ofertas', '2x1', 'descuento promo'],
    response: '🎉 **Promociones Vigentes:**\n• **2×1 en pizzas clásicas** — todos los martes\n• **Jueves de combos** — 30% en Combos Rapilover\n• Código **PROMO10** → 10% de descuento en cualquier pedido\n• Código **PRIMERA** → 15% en tu primer pedido\n• Código **HAPPY20** → 20% en horario 5pm–7pm\n• Código **FAMILIA25** → Descuento especial en combos familiares\n\nVisita la página de Promociones para ver todas las ofertas.',
  },
  {
    keywords: ['cupon', 'cupón', 'código', 'codigo', 'promo10', 'primera', 'happy20'],
    response: '🏷️ **Cupones disponibles:**\n• **PROMO10** → 10% de descuento\n• **PRIMERA** → 15% en tu primer pedido\n• **HAPPY20** → 20% de 5pm a 7pm\n• **FAMILIA25** → Descuento en combos familiares\n\n**¿Cómo usarlos?**\n1. Agrega productos al carrito\n2. Ve al Checkout\n3. Ingresa el código en "¿Tienes un cupón?"\n4. ¡El descuento se aplica automáticamente!',
  },
  {
    keywords: ['pizza personalizada', 'crear pizza', 'personalizar', 'armar', 'personaliza'],
    response: '🎨 **¡Crea tu Pizza Perfecta!**\nNuestra función especial te permite armar tu pizza desde cero:\n1. Elige el **tamaño** — Personal (S/15), Mediana (S/20) o Familiar (S/25)\n2. Selecciona la **masa** — Clásica, Delgada, Gruesa o Integral\n3. Elige la **salsa** — Tomate, BBQ, Crema o Pesto\n4. Selecciona el **queso** — Mozzarella, Parmesano, Gorgonzola\n5. Agrega hasta **12 toppings** — carnes, vegetales y extras\n\n¡La vista previa 3D se actualiza en tiempo real! 🍕',
  },
  {
    keywords: ['pago', 'pagar', 'tarjeta', 'efectivo', 'yape', 'plin'],
    response: '💳 **Métodos de Pago:**\n• Tarjeta de crédito/débito (Visa, Mastercard)\n• Efectivo al momento de la entrega\n\nPara pedidos online, selecciona tu método en el Checkout. 💳',
  },
  {
    keywords: ['dirección', 'ubicacion', 'ubicación', 'donde', 'dónde', 'local', 'tienda', 'villa maria'],
    response: '📍 **Nuestra Ubicación:**\n**Av. Sucre 112 San Gabriel, Villa María del Triunfo 15811**\n\n📞 **Teléfono**: +51 903 582 008\n📧 **Email**: info@rapipizza.com\n\n¡También hacemos delivery a domicilio! 🚚',
  },
  {
    keywords: ['cuenta', 'registro', 'registrar', 'login', 'iniciar sesion', 'perfil', 'crear cuenta'],
    response: '👤 **¿Cómo crear tu cuenta?**\n1. Clic en **"Mi Cuenta"** en la barra de navegación\n2. Selecciona la pestaña **"Registrarse"**\n3. Completa: nombre, email, teléfono y contraseña\n4. ¡Listo! Con tu cuenta puedes:\n   • Ver historial de pedidos\n   • Guardar tu dirección\n   • Acceder a promociones exclusivas\n   • Descargar boleta de cada compra 🧾',
  },
  {
    keywords: ['boleta', 'factura', 'comprobante', 'recibo', 'pdf'],
    response: '🧾 **Boleta de compra:**\nAl finalizar tu pedido en el Checkout, podrás **descargar tu boleta en PDF** directamente desde el sitio.\n\nLa boleta incluye:\n• Número de pedido\n• Detalle de productos\n• Descuentos aplicados\n• Total pagado\n• Información de delivery',
  },
  {
    keywords: ['problema', 'error', 'falla', 'no funciona', 'ayuda', 'soporte', 'queja', 'reclamo'],
    response: '🛠️ **Centro de Soporte:**\n• Visita nuestra página de **Soporte** en el menú\n• 📞 Llámanos: **+51 903 582 008**\n• 📧 Email: **info@rapipizza.com**\n• Horario soporte: 18:00 – 23:00 todos los días\n\nRespondemos en menos de 30 minutos. ⚡',
  },
  {
    keywords: ['gracias', 'ok', 'okay', 'listo', 'entendido', 'perfecto', 'excelente', 'chevere'],
    response: '😊 ¡De nada! Fue un placer ayudarte. Si tienes más preguntas, estoy aquí. ¡Buen provecho! 🍕❤️',
  },
  {
    keywords: ['adios', 'adiós', 'chao', 'bye', 'hasta luego', 'ciao', 'nos vemos'],
    response: '👋 ¡Hasta luego! Que disfrutes tu pizza. ¡Vuelve pronto! 🍕❤️',
  },
];

/** Respuesta por defecto cuando no hay coincidencia de palabras clave */
const DEFAULT_RESPONSE =
  'Lo siento, no entendí bien tu pregunta. 🤔 Puedo ayudarte con:\n• Información del menú y precios\n• Tiempos y costos de delivery\n• Horarios de atención\n• Promociones y cupones\n• Crear tu pizza personalizada\n\n¿Sobre qué tema te gustaría saber más?';

/** Respuestas rápidas sugeridas al inicio */
const INITIAL_QUICK_REPLIES: QuickReply[] = [
  { label: '📋 Ver menú', value: 'menú' },
  { label: '🚚 Delivery', value: 'delivery' },
  { label: '🎉 Promociones', value: 'promociones' },
  { label: '🕐 Horarios', value: 'horario' },
];

// ─── Lógica del motor de respuestas ──────────────────────────────────────────

/**
 * Encuentra la mejor respuesta para el texto ingresado por el usuario.
 * Usa coincidencia simple de keywords en minúsculas.
 */
function getResponse(userText: string): string {
  const normalized = userText.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  for (const entry of KNOWLEDGE_BASE) {
    if (entry.keywords.some((kw) => normalized.includes(kw))) {
      return entry.response;
    }
  }
  return DEFAULT_RESPONSE;
}

/** Genera un ID único para cada mensaje */
const uid = () => `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// ─── Componente ───────────────────────────────────────────────────────────────

/** Widget de chatbot flotante */
export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: uid(),
      role: 'bot',
      text: '¡Hola! 👋 Soy el asistente virtual de RapiPizza. ¿En qué puedo ayudarte hoy?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /** Desplaza el scroll al final del chat */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  /** Al abrir el chat, enfoca el input */
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  /** Simula el tiempo de escritura del bot antes de mostrar la respuesta */
  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: uid(),
      role: 'user',
      text: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simular latencia de "escritura" del bot (600–1200ms)
    const delay = 600 + Math.random() * 600;
    setTimeout(() => {
      const botResponse = getResponse(text);
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: 'bot', text: botResponse, timestamp: new Date() },
      ]);
      setIsTyping(false);
    }, delay);
  }, []);

  /** Limpia el historial y reinicia el saludo */
  const resetChat = () => {
    setMessages([
      {
        id: uid(),
        role: 'bot',
        text: '¡Hola! 👋 Soy el asistente virtual de RapiPizza. ¿En qué puedo ayudarte hoy?',
        timestamp: new Date(),
      },
    ]);
  };

  /** Maneja el envío con Enter */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  /** Formatea el texto del bot respetando negritas y saltos de línea */
  const formatBotText = (text: string) => {
    return text.split('\n').map((line, i) => {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <span key={i}>
          {parts.map((part, j) =>
            j % 2 === 1 ? <strong key={j}>{part}</strong> : part
          )}
          {i < text.split('\n').length - 1 && <br />}
        </span>
      );
    });
  };

  return (
    <>
      {/* ── Botón flotante de apertura ── */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Cerrar asistente virtual' : 'Abrir asistente virtual de RapiPizza'}
        aria-expanded={open}
        className="fixed bottom-24 right-6 z-[9998] w-14 h-14 rounded-full text-white shadow-xl flex items-center justify-center hover:scale-110 transition-all focus:outline-none focus:ring-4 focus:ring-[#f4a832]/50"
        style={{ backgroundColor: '#f4a832' }}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-6 h-6" aria-hidden="true" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MessageCircle className="w-6 h-6" aria-hidden="true" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* ── Panel del chat ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-44 right-4 sm:right-6 z-[9997] w-[calc(100vw-2rem)] sm:w-[360px] max-h-[70vh] flex flex-col rounded-2xl shadow-2xl bg-white border border-gray-200 overflow-hidden"
            role="dialog"
            aria-label="Asistente virtual de RapiPizza"
            aria-live="polite"
          >
            {/* ── Cabecera ── */}
            <div
              className="flex items-center justify-between px-4 py-3 text-white flex-shrink-0"
              style={{ backgroundColor: '#e25216' }}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Asistente RapiPizza</p>
                  <p className="text-xs opacity-80">En línea · Respuesta inmediata</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={resetChat}
                  aria-label="Reiniciar conversación"
                  className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Cerrar chat"
                  className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* ── Área de mensajes ── */}
            <div
              className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50"
              aria-live="polite"
              aria-label="Historial de conversación"
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Avatar del bot */}
                  {msg.role === 'bot' && (
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                      style={{ backgroundColor: '#e25216' }}
                      aria-hidden="true"
                    >
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}

                  {/* Burbuja de mensaje */}
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-primary text-white rounded-tr-sm'
                        : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-sm'
                    }`}
                    style={msg.role === 'user' ? { backgroundColor: '#e25216' } : {}}
                  >
                    {msg.role === 'bot' ? formatBotText(msg.text) : msg.text}
                  </div>

                  {/* Avatar del usuario */}
                  {msg.role === 'user' && (
                    <div
                      className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0 mt-1"
                      aria-hidden="true"
                    >
                      <User className="w-3.5 h-3.5 text-gray-600" />
                    </div>
                  )}
                </div>
              ))}

              {/* Indicador de escritura del bot */}
              {isTyping && (
                <div className="flex gap-2 justify-start" aria-label="El asistente está escribiendo">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: '#e25216' }}
                    aria-hidden="true"
                  >
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100 flex gap-1 items-center">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-gray-400"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* ── Respuestas rápidas ── */}
            {messages.length <= 2 && !isTyping && (
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex gap-1.5 overflow-x-auto flex-shrink-0">
                {INITIAL_QUICK_REPLIES.map((qr) => (
                  <button
                    key={qr.value}
                    onClick={() => sendMessage(qr.value)}
                    className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full border-2 border-orange-300 text-orange-700 hover:bg-orange-50 transition-colors whitespace-nowrap font-medium"
                  >
                    {qr.label}
                  </button>
                ))}
              </div>
            )}

            {/* ── Input de mensaje ── */}
            <div className="flex items-center gap-2 px-4 py-3 bg-white border-t border-gray-200 flex-shrink-0">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu pregunta..."
                aria-label="Escribe tu mensaje al asistente virtual"
                className="flex-1 text-sm border border-gray-200 rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-[#e25216]/50 focus:border-[#e25216] transition-all"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isTyping}
                aria-label="Enviar mensaje"
                className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-all hover:scale-110 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{ backgroundColor: '#e25216' }}
              >
                <Send className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
