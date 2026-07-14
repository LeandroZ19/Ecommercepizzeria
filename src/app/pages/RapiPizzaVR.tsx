/**
 * RapiPizzaVR — Renderiza la experiencia VR en iframe fullscreen.
 * La pantalla de inicio pertenece al HTML; no hay pantalla intermedia en React.
 */

import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router';

export default function RapiPizzaVR() {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="absolute top-3 left-3 z-10">
        <button
          onClick={() => navigate('/')}
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
