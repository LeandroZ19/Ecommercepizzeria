/**
 * AccessibilityWidget — Menú flotante de accesibilidad para RapiPizza.
 *
 * Funciones incluidas:
 * - Perfiles rápidos: Visión Baja, Dislexia, TDHA, Daltonismo
 * - Ajuste de tamaño de texto (CSS custom property)
 * - Alto contraste / contraste invertido (clases CSS en <html>)
 * - Cursor grande (clase CSS en <html>)
 * - Máscara de lectura que sigue al mouse
 * - Fuente amigable para dislexia
 * - Interlineado ampliado
 * - Lectura en voz alta (Web Speech API) — similar a Microsoft Narrator
 *
 */

import { useState, useEffect, useCallback } from 'react';
import { X, RotateCcw, Volume2, Loader2 } from 'lucide-react';

// Tipos

type Profile = 'none' | 'vision-baja' | 'dislexia' | 'tdha' | 'daltonismo';

interface A11yState {
  /** Perfil de accesibilidad activo */
  profile: Profile;
  /** Nivel de tamaño de texto: 0=normal, 1=grande, 2=muy grande */
  fontSize: number;
  /** Nivel de contraste: 0=normal, 1=alto, 2=invertido */
  contrast: number;
  /** Si el cursor grande está activo */
  bigCursor: boolean;
  /** Si la máscara de lectura está activa */
  readingMask: boolean;
  /** Si la fuente para dislexia está activa */
  dyslexicFont: boolean;
  /** Nivel de interlineado: 0=normal, 1=amplio, 2=muy amplio */
  lineHeight: number;
  /** Si la lectura en voz alta automática está activa */
  screenReader: boolean;
}

/** Estado por defecto — sin ninguna modificación */
const DEFAULT: A11yState = {
  profile: 'none',
  fontSize: 0,
  contrast: 0,
  bigCursor: false,
  readingMask: false,
  dyslexicFont: false,
  lineHeight: 0,
  screenReader: false,
};

// ─── Helpers CSS ──────────────────────────────────────────────────────────────

/** Aplica todas las propiedades CSS y clases de accesibilidad al documento */
function applyState(s: A11yState) {
  const root = document.documentElement;

  // Tamaño de texto vía custom property
  const fontSizes = ['1rem', '1.125rem', '1.3rem'];
  root.style.setProperty('--a11y-font-size', fontSizes[s.fontSize]);

  // Interlineado: inyectar/remover <style> para sobrescribir utilidades de Tailwind
  const lineHeights = ['1.5', '1.9', '2.4'];
  const lhValue = lineHeights[s.lineHeight];
  root.style.setProperty('--a11y-line-height', lhValue);

  let lhStyle = document.getElementById('a11y-lh-override') as HTMLStyleElement | null;
  if (s.lineHeight > 0) {
    if (!lhStyle) {
      lhStyle = document.createElement('style');
      lhStyle.id = 'a11y-lh-override';
      document.head.appendChild(lhStyle);
    }
    lhStyle.textContent = `* { line-height: ${lhValue} !important; }`;
  } else {
    lhStyle?.remove();
  }

  // Clases de accesibilidad en el elemento raíz
  root.classList.toggle('a11y-contrast-high', s.contrast === 1);
  root.classList.toggle('a11y-contrast-invert', s.contrast === 2);
  root.classList.toggle('a11y-big-cursor', s.bigCursor);
  root.classList.toggle('a11y-dyslexic', s.dyslexicFont);
  root.classList.toggle('a11y-reading-mask', s.readingMask);
}

// Presets de perfiles

const PROFILE_PRESETS: Record<Profile, Partial<A11yState>> = {
  none: {},
  'vision-baja': { fontSize: 2 },
  dislexia: { dyslexicFont: true, lineHeight: 1 },
  tdha: { readingMask: true, lineHeight: 1 },
  daltonismo: { contrast: 1 },
};

// TTS helpers

/**
 * Extrae el texto visible de la página, ignorando nav y scripts.
 * Usado por la función de lectura en voz alta.
 */
function extractPageText(): string {
  const main = document.querySelector('main') ?? document.body;
  // Clonar para no alterar el DOM real
  const clone = main.cloneNode(true) as HTMLElement;

  // Remover elementos que no deben leerse
  clone.querySelectorAll('nav, script, style, noscript, [aria-hidden="true"]').forEach((el) =>
    el.remove()
  );

  return clone.innerText.replace(/\s+/g, ' ').trim();
}

// Componente principal

/** Widget flotante de accesibilidad */
export default function AccessibilityWidget() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<A11yState>(DEFAULT);
  const [maskY, setMaskY] = useState(200);

  // Estado de la lectura en voz alta
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);

  // Verificar soporte de Web Speech API al montar
  useEffect(() => {
    setTtsSupported('speechSynthesis' in window);
  }, []);

  // Sincronizar eventos del sintetizador
  useEffect(() => {
    if (!ttsSupported) return;
    const synth = window.speechSynthesis;

    const handleEnd = () => setIsSpeaking(false);
    // No existe 'end' directo en speechSynthesis; se escucha via utterance
    return () => {
      synth.cancel();
    };
  }, [ttsSupported]);

  // Aplicar cambios CSS cuando el estado cambia
  useEffect(() => {
    applyState(state);
  }, [state]);

  // Máscara de lectura: seguir el mouse
  useEffect(() => {
    if (!state.readingMask) return;
    const move = (e: MouseEvent) => setMaskY(e.clientY);
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, [state.readingMask]);

  /** Actualiza parcialmente el estado */
  const update = (patch: Partial<A11yState>) =>
    setState((prev) => ({ ...prev, ...patch }));

  /** Aplica un perfil predefinido y resetea el resto */
  const applyProfile = (profile: Profile) => {
    const preset = PROFILE_PRESETS[profile];
    setState({ ...DEFAULT, profile, ...preset });
  };

  /** Restablece todos los ajustes al estado inicial */
  const reset = () => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setState(DEFAULT);
  };

  /**
   * Activa / desactiva la lectura en voz alta usando la Web Speech API.
   * Si ya está leyendo, detiene la reproducción.
   * Si no, extrae el texto de la página y lo sintetiza en español.
   */
  const toggleScreenReader = useCallback(() => {
    if (!ttsSupported) return;
    const synth = window.speechSynthesis;

    if (isSpeaking) {
      synth.cancel();
      setIsSpeaking(false);
      return;
    }

    const text = extractPageText();
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-PE'; // Preferir voz en español peruano
    utterance.rate = 0.95;
    utterance.pitch = 1;

    // Intentar usar voz en español si está disponible
    const voices = synth.getVoices();
    const spanishVoice = voices.find(
      (v) => v.lang.startsWith('es') && !v.name.toLowerCase().includes('compact')
    );
    if (spanishVoice) utterance.voice = spanishVoice;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synth.cancel();
    synth.speak(utterance);
    setIsSpeaking(true);
  }, [isSpeaking, ttsSupported]);

  // Detener TTS al cerrar el widget
  const handleToggleOpen = () => {
    setOpen((o) => {
      if (o && isSpeaking) {
        window.speechSynthesis?.cancel();
        setIsSpeaking(false);
      }
      return !o;
    });
  };

  // Etiquetas descriptivas para los niveles
  const fontLabels = ['Normal', 'Grande', 'Muy grande'];
  const contrastLabels = ['Normal', 'Alto', 'Invertido'];
  const lineLabels = ['Normal', 'Amplio', 'Muy amplio'];

  return (
    <>
      {/* ── Máscara de lectura ── */}
      {state.readingMask && (
        <div
          className="pointer-events-none fixed inset-0 z-[9998]"
          aria-hidden="true"
          style={{
            background: `linear-gradient(
              to bottom,
              rgba(0,0,0,0.55) 0px,
              rgba(0,0,0,0.55) ${maskY - 28}px,
              transparent ${maskY - 28}px,
              transparent ${maskY + 28}px,
              rgba(0,0,0,0.55) ${maskY + 28}px,
              rgba(0,0,0,0.55) 100%
            )`,
          }}
        />
      )}

      {/* ── Botón flotante principal ── */}
      <button
        onClick={handleToggleOpen}
        aria-label="Abrir menú de accesibilidad"
        aria-expanded={open}
        className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full text-white shadow-xl flex items-center justify-center transition-all hover:scale-110 focus:outline-none focus:ring-4 focus:ring-[#f4a832]/50"
        style={{ backgroundColor: '#f4a832' }}
      >
        {/* Icono de accesibilidad (figura con círculo) */}
        <svg viewBox="0 0 32 32" className="w-8 h-8" fill="currentColor" aria-hidden="true">
          <circle cx="16" cy="16" r="15" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="16" cy="9" r="2.5" />
          <path
            d="M10 13.5h12M16 13.5v9M12 22.5l4-5 4 5"
            strokeWidth="2"
            stroke="currentColor"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* ── Panel de opciones ── */}
      {open && (
        <div
          className="fixed bottom-24 right-4 sm:right-6 z-[9999] w-[calc(100vw-2rem)] sm:w-[320px] max-h-[80vh] overflow-y-auto rounded-2xl shadow-2xl bg-white border border-gray-200 flex flex-col"
          role="dialog"
          aria-label="Menú de accesibilidad"
        >
          {/* Cabecera */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#e25216] text-white rounded-t-2xl flex-shrink-0">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
                <circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="12" cy="6.5" r="1.8" />
                <path
                  d="M7.5 10h9M12 10v7M9 17l3-3.5 3 3.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Menú de accesibilidad
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Cerrar menú de accesibilidad"
              className="hover:opacity-70 transition-opacity"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          <div className="p-4 space-y-4">

            {/* ── Lectura en voz alta (TTS) ── */}
            {ttsSupported && (
              <section aria-labelledby="tts-heading">
                <h3 id="tts-heading" className="text-xs font-bold text-[#e25216] uppercase tracking-wide mb-2">
                  Lector de pantalla
                </h3>
                <button
                  onClick={toggleScreenReader}
                  aria-pressed={isSpeaking}
                  aria-label={isSpeaking ? 'Detener lectura en voz alta' : 'Leer página en voz alta'}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    isSpeaking
                      ? 'border-[#e25216] bg-orange-50 text-[#e25216]'
                      : 'border-gray-200 text-gray-700 hover:border-[#e25216]/50 hover:bg-orange-50/50'
                  }`}
                >
                  {isSpeaking ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                      <span>Leyendo página... (clic para detener)</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-5 h-5" aria-hidden="true" />
                      <span>Leer página en voz alta</span>
                    </>
                  )}
                </button>
                <p className="text-xs text-gray-400 mt-1.5 px-1">
                  Usa la API Web Speech para leer el contenido visible, similar a Microsoft Narrator.
                </p>
              </section>
            )}

            {/* ── Perfiles rápidos ── */}
            <section aria-labelledby="profile-heading">
              <h3 id="profile-heading" className="text-xs font-bold text-[#e25216] uppercase tracking-wide mb-2">
                Perfil
              </h3>
              <div className="bg-gray-50 rounded-xl divide-y divide-gray-100">
                {(
                  [
                    { id: 'vision-baja', label: 'Visión Baja', icon: '👁️' },
                    { id: 'dislexia', label: 'Dislexia', icon: '𝔸' },
                    { id: 'tdha', label: 'TDHA', icon: '🔄' },
                    { id: 'daltonismo', label: 'Daltonismo', icon: '◑' },
                  ] as const
                ).map(({ id, label, icon }) => (
                  <button
                    key={id}
                    onClick={() => applyProfile(state.profile === id ? 'none' : id)}
                    aria-pressed={state.profile === id}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors hover:bg-orange-50 first:rounded-t-xl last:rounded-b-xl ${
                      state.profile === id ? 'text-[#e25216] font-semibold' : 'text-gray-700'
                    }`}
                  >
                    <span className="text-base w-5 text-center" aria-hidden="true">{icon}</span>
                    {label}
                    {state.profile === id && (
                      <span className="ml-auto text-[#e25216]" aria-label="activo">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </section>

            {/* ── Controles individuales ── */}
            <section aria-labelledby="controls-heading">
              <h3 id="controls-heading" className="sr-only">Controles de accesibilidad</h3>
              <div className="grid grid-cols-2 gap-2">

                {/* Tamaño de texto */}
                <button
                  onClick={() => update({ fontSize: (state.fontSize + 1) % 3 })}
                  aria-label={`Tamaño de texto: ${fontLabels[state.fontSize]}. Clic para cambiar`}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-medium transition-all ${
                    state.fontSize > 0
                      ? 'border-[#e25216] bg-orange-50 text-[#e25216]'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span className="text-xl font-bold" aria-hidden="true">TT</span>
                  <span>Tamaño de texto</span>
                  <span className="text-[10px] opacity-70">{fontLabels[state.fontSize]}</span>
                </button>

                {/* Contrastes */}
                <button
                  onClick={() => update({ contrast: (state.contrast + 1) % 3 })}
                  aria-label={`Contraste: ${contrastLabels[state.contrast]}. Clic para cambiar`}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-medium transition-all ${
                    state.contrast > 0
                      ? 'border-[#e25216] bg-orange-50 text-[#e25216]'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span className="text-xl" aria-hidden="true">◑</span>
                  <span>Contrastes</span>
                  <span className="text-[10px] opacity-70">{contrastLabels[state.contrast]}</span>
                </button>

                {/* Cursor */}
                <button
                  onClick={() => update({ bigCursor: !state.bigCursor })}
                  aria-label={`Cursor grande: ${state.bigCursor ? 'activo' : 'inactivo'}. Clic para cambiar`}
                  aria-pressed={state.bigCursor}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-medium transition-all ${
                    state.bigCursor
                      ? 'border-[#e25216] bg-orange-50 text-[#e25216]'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span className="text-xl" aria-hidden="true">↖</span>
                  <span>Cursor</span>
                  <span className="text-[10px] opacity-70">{state.bigCursor ? 'Grande' : 'Normal'}</span>
                </button>

                {/* Máscara de lectura */}
                <button
                  onClick={() => update({ readingMask: !state.readingMask })}
                  aria-label={`Máscara de lectura: ${state.readingMask ? 'activa' : 'inactiva'}. Clic para cambiar`}
                  aria-pressed={state.readingMask}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-medium transition-all ${
                    state.readingMask
                      ? 'border-[#e25216] bg-orange-50 text-[#e25216]'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span className="text-xl" aria-hidden="true">☰</span>
                  <span>Máscara de lectura</span>
                  <span className="text-[10px] opacity-70">{state.readingMask ? 'Activa' : 'Inactiva'}</span>
                </button>

                {/* Dislexia amigable */}
                <button
                  onClick={() => update({ dyslexicFont: !state.dyslexicFont })}
                  aria-label={`Fuente para dislexia: ${state.dyslexicFont ? 'activa' : 'inactiva'}. Clic para cambiar`}
                  aria-pressed={state.dyslexicFont}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-medium transition-all ${
                    state.dyslexicFont
                      ? 'border-[#e25216] bg-orange-50 text-[#e25216]'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span className="text-xl font-bold" aria-hidden="true">AZ</span>
                  <span>Dislexia amigable</span>
                  <span className="text-[10px] opacity-70">{state.dyslexicFont ? 'Activa' : 'Inactiva'}</span>
                </button>

                {/* Interlineado */}
                <button
                  onClick={() => update({ lineHeight: (state.lineHeight + 1) % 3 })}
                  aria-label={`Interlineado: ${lineLabels[state.lineHeight]}. Clic para cambiar`}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-medium transition-all ${
                    state.lineHeight > 0
                      ? 'border-[#e25216] bg-orange-50 text-[#e25216]'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span className="text-xl" aria-hidden="true">↕</span>
                  <span>Interlineado</span>
                  <span className="text-[10px] opacity-70">{lineLabels[state.lineHeight]}</span>
                </button>
              </div>
            </section>

            {/* ── Botón de reset ── */}
            <button
              onClick={reset}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              aria-label="Restablecer todos los ajustes de accesibilidad"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              Restablecer todo
            </button>
          </div>
        </div>
      )}
    </>
  );
}
