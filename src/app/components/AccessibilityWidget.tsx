import { useState, useEffect } from "react";
import { X, RotateCcw } from "lucide-react";

type Profile = "none" | "vision-baja" | "dislexia" | "tdha" | "daltonismo";

interface A11yState {
  profile: Profile;
  fontSize: number;      // 0=normal, 1=grande, 2=muy grande
  contrast: number;      // 0=normal, 1=alto, 2=invertido
  bigCursor: boolean;
  readingMask: boolean;
  dyslexicFont: boolean;
  lineHeight: number;    // 0=normal, 1=amplio, 2=muy amplio
}

const DEFAULT: A11yState = {
  profile: "none",
  fontSize: 0,
  contrast: 0,
  bigCursor: false,
  readingMask: false,
  dyslexicFont: false,
  lineHeight: 0,
};

function applyState(s: A11yState) {
  const root = document.documentElement;
  const fontSizes = ["1rem", "1.125rem", "1.3rem"];
  root.style.setProperty("--a11y-font-size", fontSizes[s.fontSize]);

  const lineHeights = ["1.5", "1.9", "2.4"];
  root.style.setProperty("--a11y-line-height", lineHeights[s.lineHeight]);

  root.classList.toggle("a11y-contrast-high", s.contrast === 1);
  root.classList.toggle("a11y-contrast-invert", s.contrast === 2);
  root.classList.toggle("a11y-big-cursor", s.bigCursor);
  root.classList.toggle("a11y-dyslexic", s.dyslexicFont);
  root.classList.toggle("a11y-reading-mask", s.readingMask);
}

const PROFILE_PRESETS: Record<Profile, Partial<A11yState>> = {
  none: {},
  "vision-baja": { fontSize: 2 },
  dislexia: { dyslexicFont: true, lineHeight: 1 },
  tdha: { readingMask: true, lineHeight: 1 },
  daltonismo: { contrast: 1 },
};

export default function AccessibilityWidget() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<A11yState>(DEFAULT);
  const [maskY, setMaskY] = useState(200);

  useEffect(() => {
    applyState(state);
  }, [state]);

  useEffect(() => {
    if (!state.readingMask) return;
    const move = (e: MouseEvent) => setMaskY(e.clientY);
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [state.readingMask]);

  const update = (patch: Partial<A11yState>) =>
    setState((prev) => ({ ...prev, ...patch }));

  const applyProfile = (profile: Profile) => {
    const preset = PROFILE_PRESETS[profile];
    setState({ ...DEFAULT, profile, ...preset });
  };

  const reset = () => {
    setState(DEFAULT);
  };

  const fontLabels = ["Normal", "Grande", "Muy grande"];
  const contrastLabels = ["Normal", "Alto", "Invertido"];
  const lineLabels = ["Normal", "Amplio", "Muy amplio"];

  return (
    <>
      {/* Reading mask overlay */}
      {state.readingMask && (
        <div
          className="pointer-events-none fixed inset-0 z-[9998]"
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

      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Abrir menú de accesibilidad"
        className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full bg-[#e25216] text-white shadow-xl flex items-center justify-center hover:bg-[#e25216]/90 transition-all hover:scale-110 focus:outline-none focus:ring-4 focus:ring-[#e25216]/40"
      >
        {/* Accessibility icon (person with circle) */}
        <svg viewBox="0 0 32 32" className="w-8 h-8" fill="currentColor">
          <circle cx="16" cy="16" r="15" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="16" cy="9" r="2.5" />
          <path d="M10 13.5h12M16 13.5v9M12 22.5l4-5 4 5" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Panel */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-[9999] w-[320px] max-h-[80vh] overflow-y-auto rounded-2xl shadow-2xl bg-white border border-gray-200 flex flex-col"
          role="dialog"
          aria-label="Menú de accesibilidad"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#e25216] text-white rounded-t-2xl">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                <circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="12" cy="6.5" r="1.8" />
                <path d="M7.5 10h9M12 10v7M9 17l3-3.5 3 3.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Menú de accesibilidad
            </div>
            <button onClick={() => setOpen(false)} aria-label="Cerrar" className="hover:opacity-70 transition-opacity">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Perfil */}
            <section>
              <h3 className="text-xs font-bold text-[#e25216] uppercase tracking-wide mb-2">Perfil</h3>
              <div className="bg-gray-50 rounded-xl divide-y divide-gray-100">
                {(
                  [
                    { id: "vision-baja", label: "Visión Baja", icon: "👁️" },
                    { id: "dislexia", label: "Dislexia", icon: "𝔸" },
                    { id: "tdha", label: "TDHA", icon: "🔄" },
                    { id: "daltonismo", label: "Daltonismo", icon: "◑" },
                  ] as const
                ).map(({ id, label, icon }) => (
                  <button
                    key={id}
                    onClick={() => applyProfile(state.profile === id ? "none" : id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors hover:bg-orange-50 first:rounded-t-xl last:rounded-b-xl ${
                      state.profile === id ? "text-[#e25216] font-semibold" : "text-gray-700"
                    }`}
                  >
                    <span className="text-base w-5 text-center">{icon}</span>
                    {label}
                    {state.profile === id && (
                      <span className="ml-auto text-[#e25216]">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </section>

            {/* Feature tiles */}
            <section>
              <div className="grid grid-cols-2 gap-2">
                {/* Tamaño de texto */}
                <button
                  onClick={() => update({ fontSize: (state.fontSize + 1) % 3 })}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-medium transition-all ${
                    state.fontSize > 0 ? "border-[#e25216] bg-orange-50 text-[#e25216]" : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <span className="text-xl font-bold">TT</span>
                  <span>Tamaño de texto</span>
                  <span className="text-[10px] opacity-70">{fontLabels[state.fontSize]}</span>
                </button>

                {/* Contrastes */}
                <button
                  onClick={() => update({ contrast: (state.contrast + 1) % 3 })}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-medium transition-all ${
                    state.contrast > 0 ? "border-[#e25216] bg-orange-50 text-[#e25216]" : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <span className="text-xl">◑</span>
                  <span>Contrastes</span>
                  <span className="text-[10px] opacity-70">{contrastLabels[state.contrast]}</span>
                </button>

                {/* Cursor */}
                <button
                  onClick={() => update({ bigCursor: !state.bigCursor })}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-medium transition-all ${
                    state.bigCursor ? "border-[#e25216] bg-orange-50 text-[#e25216]" : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <span className="text-xl">↖</span>
                  <span>Cursor</span>
                  <span className="text-[10px] opacity-70">{state.bigCursor ? "Grande" : "Normal"}</span>
                </button>

                {/* Máscara de lectura */}
                <button
                  onClick={() => update({ readingMask: !state.readingMask })}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-medium transition-all ${
                    state.readingMask ? "border-[#e25216] bg-orange-50 text-[#e25216]" : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <span className="text-xl">☰</span>
                  <span>Máscara de lectura</span>
                  <span className="text-[10px] opacity-70">{state.readingMask ? "Activa" : "Inactiva"}</span>
                </button>

                {/* Dislexia amigable */}
                <button
                  onClick={() => update({ dyslexicFont: !state.dyslexicFont })}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-medium transition-all ${
                    state.dyslexicFont ? "border-[#e25216] bg-orange-50 text-[#e25216]" : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <span className="text-xl font-bold">AZ</span>
                  <span>Dislexia amigable</span>
                  <span className="text-[10px] opacity-70">{state.dyslexicFont ? "Activa" : "Inactiva"}</span>
                </button>

                {/* Interlineado */}
                <button
                  onClick={() => update({ lineHeight: (state.lineHeight + 1) % 3 })}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-medium transition-all ${
                    state.lineHeight > 0 ? "border-[#e25216] bg-orange-50 text-[#e25216]" : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <span className="text-xl">↕</span>
                  <span>Interlineado</span>
                  <span className="text-[10px] opacity-70">{lineLabels[state.lineHeight]}</span>
                </button>
              </div>
            </section>

            {/* Reset */}
            <button
              onClick={reset}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Restablecer
            </button>
          </div>
        </div>
      )}
    </>
  );
}
