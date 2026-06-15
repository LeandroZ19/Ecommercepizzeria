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
    response: '¡Hola! 👋 Bienvenido a RapiPizza. Soy tu asistente virtual. Puedo ayudarte con información sobre nuestro menú, precios, delivery y horarios. ¿En qué te puedo ayudar?',
  },
  {
    keywords: ['menu', 'menú', 'carta', 'pizzas', 'qué tienen', 'que tienen', 'opciones'],
    response: '🍕 Contamos con una gran variedad:\n• **Pizzas Clásicas**: Margherita, Pepperoni, Hawaiana y más\n• **Pizzas Especiales**: Trufa Negra, Prosciutto e Rúcula, Diavola\n• **Combos Familiares**: ideales para compartir\n• **Bebidas y Complementos**: para completar tu pedido\n\nTambién puedes **crear tu pizza personalizada** eligiendo masa, salsa, queso y toppings. ¡Visita nuestro menú para ver todos los detalles!',
  },
  {
    keywords: ['precio', 'precios', 'cuánto', 'cuanto', 'cuesta', 'vale', 'costo'],
    response: '💰 Nuestros precios varían según el tamaño:\n• **Personal (25cm)**: desde S/ 15.00\n• **Mediana (30cm)**: desde S/ 20.00\n• **Familiar (35cm)**: desde S/ 25.00\n\nLas pizzas especiales y gourmet tienen precios superiores. Visita nuestro Menú para ver los precios exactos de cada producto.',
  },
  {
    keywords: ['delivery', 'entrega', 'envío', 'envio', 'llegar', 'tiempo', 'demora', 'cuánto demora'],
    response: '🚚 Realizamos delivery a varios distritos de Lima:\n• **Tiempo estimado**: 25-45 minutos según la zona\n• **Precio de delivery**: varía por distrito (S/ 3 - S/ 8)\n• El costo exacto se muestra al ingresar tu dirección en el Checkout\n\n¡Primer pedido con delivery gratis para usuarios nuevos! 🎉',
  },
  {
    keywords: ['horario', 'horarios', 'hora', 'abierto', 'abre', 'cierra', 'disponible'],
    response: '🕐 Nuestros horarios de atención:\n• **Lunes a Jueves**: 11:00 am – 10:00 pm\n• **Viernes y Sábado**: 11:00 am – 11:30 pm\n• **Domingo**: 12:00 pm – 10:00 pm\n\nRalizamos delivery hasta 30 minutos antes del cierre.',
  },
  {
    keywords: ['promoción', 'promociones', 'promo', 'descuento', 'oferta', 'ofertas', '2x1'],
    response: '🎉 ¡Tenemos promociones increíbles!\n• **2x1 en pizzas clásicas** todos los martes\n• **Combo familiar** con bebida incluida los fines de semana\n• **Descuentos exclusivos** para usuarios registrados\n• Usa el código **PROMO10** para 10% de descuento en tu primer pedido\n\nVisita nuestra página de Promociones para ver todas las ofertas vigentes.',
  },
  {
    keywords: ['cupon', 'cupón', 'código', 'codigo', 'descuento'],
    response: '🏷️ Para usar un cupón de descuento:\n1. Agrega tus productos al carrito\n2. Ve al Checkout\n3. Ingresa el código en el campo "Cupón de descuento"\n4. El descuento se aplica automáticamente\n\nCódigos disponibles: **PROMO10** (10% off), **PRIMERA** (15% en primer pedido).',
  },
  {
    keywords: ['pizza personalizada', 'crear pizza', 'personalizar', 'armé', 'armar'],
    response: '🎨 ¡Nuestra función estrella! Puedes crear tu pizza perfecta:\n1. Elige el **tamaño** (Personal, Mediana o Familiar)\n2. Selecciona la **masa** (Clásica, Delgada, Gruesa o Integral)\n3. Elige tu **salsa** favorita\n4. Selecciona el **queso**\n5. Agrega los **toppings** que quieras\n\n¡Una vista previa animada te muestra cómo queda mientras la armas! 🍕',
  },
  {
    keywords: ['ingredientes', 'alergia', 'alergenos', 'alérgenos', 'gluten', 'lácteos'],
    response: '⚠️ Información importante sobre alérgenos:\n• La mayoría de nuestras pizzas contienen **Gluten** y **Lácteos**\n• Cada producto en el detalle muestra sus alérgenos específicos\n• Si tienes alguna alergia severa, por favor contáctanos directamente al **+51 903 582 008** antes de ordenar',
  },
  {
    keywords: ['pago', 'pagar', 'tarjeta', 'efectivo', 'yape', 'plin', 'transferencia'],
    response: '💳 Métodos de pago disponibles:\n• **Tarjetas de crédito/débito** (Visa, Mastercard)\n• **Yape** y **Plin**\n• **Efectivo** al momento de la entrega\n• **Transferencia bancaria**\n\nTodos los pagos online son 100% seguros.',
  },
  {
    keywords: ['dirección', 'ubicacion', 'ubicación', 'donde', 'dónde', 'local', 'tienda'],
    response: '📍 Nos encontramos en:\n**Av. Sucre 112 San Gabriel, Villa María del Triunfo 15811**\n\nTambién puedes seguirnos en redes sociales o llamarnos:\n📞 +51 903 582 008\n📧 info@rapipizza.com',
  },
  {
    keywords: ['cuenta', 'registro', 'registrar', 'login', 'iniciar sesión', 'perfil'],
    response: '👤 Para crear tu cuenta en RapiPizza:\n1. Haz clic en **"Mi Cuenta"** en la barra de navegación\n2. Selecciona **"Crear cuenta"**\n3. Completa tus datos\n4. ¡Listo! Podrás ver tu historial de pedidos y guardar tus direcciones favoritas\n\nTener cuenta desbloquea promociones exclusivas y delivery prioritario.',
  },
  {
    keywords: ['problema', 'error', 'falla', 'no funciona', 'ayuda', 'soporte', 'queja'],
    response: '🛠️ Lamentamos los inconvenientes. Puedes obtener ayuda en:\n• **Soporte**: visita nuestra página de Soporte\n• **Teléfono**: +51 903 582 008\n• **Email**: info@rapipizza.com\n• **Horario de atención al cliente**: 9am – 11pm todos los días\n\nNuestro equipo responde en menos de 2 horas.',
  },
  {
    keywords: ['gracias', 'ok', 'okay', 'listo', 'entendido', 'perfecto', 'excelente'],
    response: '😊 ¡De nada! Fue un placer ayudarte. Si tienes más preguntas, no dudes en consultarme. ¡Buen provecho! 🍕',
  },
  {
    keywords: ['adios', 'adiós', 'chao', 'bye', 'hasta luego', 'ciao'],
    response: '👋 ¡Hasta luego! Que disfrutes tu pizza. Vuelve cuando quieras. 🍕❤️',
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
