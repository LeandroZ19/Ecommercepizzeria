/**
 * RapiPizzaVR — Experiencia interactiva 3D de la pizzería.
 *
 * Renderiza rapipizza-vr.html en un iframe fullscreen.
 * La experiencia está construida con A-Frame (WebXR) y no depende del contexto
 * React: se ejecuta como un documento HTML independiente.
 */

import { motion } from 'motion/react';
import { Link } from 'react-router';
import { ArrowLeft, Gamepad2, Monitor, Headset } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useState } from 'react';

export default function RapiPizzaVR() {
  const [entered, setEntered] = useState(false);

  if (entered) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        {/* Barra superior superpuesta */}
        <div className="absolute top-3 left-3 z-10">
          <button
            onClick={() => setEntered(false)}
            className="flex items-center gap-2 bg-black/60 hover:bg-black/80 text-white text-sm font-medium px-3 py-1.5 rounded-full backdrop-blur border border-white/20 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Salir
          </button>
        </div>
        <iframe
          src="/rapipizza-vr.html"
          className="flex-1 w-full h-full border-0"
          allow="xr-spatial-tracking; gyroscope; accelerometer; fullscreen"
          title="RapiPizza VR"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1b1410] text-[#f7efe3] flex flex-col items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto text-center"
      >
        {/* Logo */}
        <motion.h1
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="text-6xl md:text-8xl font-bold mb-4"
          style={{ fontFamily: "'Fredoka', sans-serif", color: '#ff5a36', textShadow: '0 0 40px rgba(255,90,54,0.6)' }}
        >
          Rapi<span style={{ color: '#f7efe3' }}>Pizza</span> VR
        </motion.h1>

        <p className="text-lg md:text-xl opacity-80 mb-8" style={{ fontFamily: "'Poppins', sans-serif" }}>
          Camina por nuestro local en 3D, habla con la recepcionista y pide tu pizza como si estuvieras ahí.
        </p>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {[
            { icon: Gamepad2, title: 'Controles', desc: 'WASD para moverte, mouse para mirar alrededor' },
            { icon: Monitor,  title: 'Navegador', desc: 'Funciona en Chrome, Edge y Firefox sin instalación' },
            { icon: Headset,  title: 'Visor VR',  desc: 'Compatible con Meta Quest y otros visores WebXR' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-2xl p-5 text-left" style={{ background: 'rgba(247,239,227,0.06)', border: '1px solid rgba(255,90,54,0.25)' }}>
              <Icon className="w-6 h-6 mb-2" style={{ color: '#ff5a36' }} />
              <p className="font-semibold text-sm mb-1" style={{ fontFamily: "'Fredoka', sans-serif" }}>{title}</p>
              <p className="text-xs opacity-70" style={{ fontFamily: "'Poppins', sans-serif" }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <motion.button
          whileHover={{ scale: 1.04, y: -3 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setEntered(true)}
          className="text-xl font-bold px-12 py-5 rounded-full mb-6 cursor-pointer border-0"
          style={{ fontFamily: "'Fredoka', sans-serif", background: '#ff5a36', color: '#1b1410', boxShadow: '0 0 40px rgba(255,90,54,0.55)' }}
        >
          🍕 Entrar al local
        </motion.button>

        <div className="mt-4">
          <Link to="/">
            <Button variant="ghost" className="text-[#f7efe3]/60 hover:text-[#f7efe3] gap-2">
              <ArrowLeft className="w-4 h-4" />
              Volver al inicio
            </Button>
          </Link>
        </div>

        <p className="mt-6 text-xs opacity-40" style={{ fontFamily: "'Poppins', sans-serif" }}>
          Empieza con 🪙 S/ 50.00 de saldo virtual · El botón "🍕 Pedir pizza" siempre está disponible abajo · También puedes usar un visor VR con el botón "Enter VR" de la esquina inferior derecha
        </p>
      </motion.div>
    </div>
  );
}
