/**
 * PizzaPreview — Vista previa realista de la pizza personalizada.
 *
 * Arquitectura:
 * - SVG vectorial para capas base (crust, salsa, queso con gradientes)
 * - Imágenes HTML <img> absolutamente posicionadas para los toppings
 *
 * Algoritmo de distribución de toppings:
 *   Para N unidades totales (ej. pepperoni×3 + champiñón×2 = 5 unidades),
 *   se intercalan primero entre sí (round-robin por topping) para garantizar
 *   que las mismas unidades queden SEPARADAS, y luego se distribuyen
 *   equitativamente en ángulos alrededor de la pizza en anillos alternados
 *   (inner r≈15% / outer r≈27%), dando un aspecto artesanal natural.
 */

import { motion, AnimatePresence } from 'motion/react';
import type { Ingredient } from '../data/productsDetailed';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface ToppingEntry {
  /** Ingrediente seleccionado */
  ingredient: Ingredient;
  /** Cantidad de unidades (1–12) */
  quantity: number;
}

/** Unidad individual a renderizar en la pizza */
interface ToppingUnit {
  ingredient: Ingredient;
  /** Índice de pass (para dar ligero giro entre capas) */
  pass: number;
  /** Índice único para key */
  uid: string;
}

// ─── Paleta de salsas ─────────────────────────────────────────────────────────

const SAUCE_PALETTE: Record<string, { light: string; dark: string }> = {
  'sauce-tomato': { light: '#c0392b', dark: '#8c1a0a' },
  'sauce-bbq':    { light: '#6b3a1f', dark: '#3d1e08' },
  'sauce-cream':  { light: '#e8cfa0', dark: '#d4b580' },
  'sauce-pesto':  { light: '#3a6642', dark: '#2a4e32' },
};

// ─── Algoritmo de posicionamiento ────────────────────────────────────────────

/**
 * Transforma la lista de ToppingEntry en una lista plana de unidades
 * intercaladas (round-robin), garantizando que unidades del mismo topping
 * estén lo más separadas posible en la pizza.
 */
function buildUnits(entries: ToppingEntry[]): ToppingUnit[] {
  const maxPass = Math.max(...entries.map(e => e.quantity), 1);
  const units: ToppingUnit[] = [];

  for (let pass = 0; pass < maxPass; pass++) {
    for (const entry of entries) {
      if (pass < entry.quantity) {
        units.push({
          ingredient: entry.ingredient,
          pass,
          uid: `${entry.ingredient.id}-${pass}`,
        });
      }
    }
  }

  return units;
}

/**
 * Calcula la posición (x, y) en porcentaje de la caja contenedora
 * para el i-ésimo topping del total de n unidades.
 *
 * - Distribuye ángulos equitativamente: ángulo_i = (i/n) × 2π
 * - Alterna radio: par → anillo interior (r≈15%), impar → exterior (r≈27%)
 * - Agrega ligera rotación por "pass" para evitar solapamiento exacto
 *
 * La pizza (SVG 200×200) tiene:
 *   - Queso r=70px → 35% del contenedor
 *   - Imágenes de topping 14% × 14% → radio=7%
 *   - Máx distancia al borde = 35% - 7% = 28% → usamos r≤28%
 */
function calcPosition(i: number, n: number, pass: number): { x: number; y: number } {
  const baseAngle = n > 0 ? (i / n) * 2 * Math.PI - Math.PI / 2 : 0;
  const rotationPerPass = 0.12; // radianes de giro por capa adicional
  const angle = baseAngle + pass * rotationPerPass;

  // Anillo interior para índices pares, exterior para impares
  const r = i % 2 === 0 ? 15 : 26;

  return {
    x: 50 + r * Math.cos(angle),
    y: 50 + r * Math.sin(angle),
  };
}

// ─── Componente ───────────────────────────────────────────────────────────────

/** Tamaño de cada imagen de topping (% del contenedor) */
const IMG_SIZE = 14;

/** Máximo de unidades visibles simultáneamente en la pizza */
const MAX_VISIBLE = 40;

interface PizzaPreviewProps {
  sauceId:  string;
  cheeseId: string;
  toppings: ToppingEntry[];
}

/** Vista previa realista y animada de la pizza personalizada */
export default function PizzaPreview({ sauceId, cheeseId, toppings }: PizzaPreviewProps) {
  const sauce = SAUCE_PALETTE[sauceId] ?? SAUCE_PALETTE['sauce-tomato'];

  // Color del queso según tipo
  const isWhiteCheese = cheeseId === 'cheese-mozzarella' || cheeseId === 'cheese-goat';
  const cheeseLight = isWhiteCheese ? '#f9f4c5' : '#e8c84a';
  const cheeseDark  = isWhiteCheese ? '#d5c060' : '#c09820';

  // Construir lista intercalada de unidades
  const allUnits = buildUnits(toppings);
  const visibleUnits = allUnits.slice(0, MAX_VISIBLE);
  const n = visibleUnits.length;

  return (
    <div
      className="relative w-full max-w-[300px] mx-auto select-none"
      style={{ aspectRatio: '1 / 1' }}
      role="img"
      aria-label={
        n === 0
          ? 'Pizza sin toppings'
          : `Pizza con: ${toppings.map(t => `${t.ingredient.name} ×${t.quantity}`).join(', ')}`
      }
    >
      {/* ── Capa SVG: estructura de la pizza ── */}
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full"
        aria-hidden="true"
      >
        <defs>
          {/* Gradiente de la corteza */}
          <radialGradient id="pv-crust" cx="38%" cy="34%" r="65%">
            <stop offset="0%"   stopColor="#e8b86d" />
            <stop offset="55%"  stopColor="#c8902e" />
            <stop offset="100%" stopColor="#8c5c10" />
          </radialGradient>

          {/* Gradiente de la salsa */}
          <radialGradient id="pv-sauce" cx="42%" cy="38%" r="60%">
            <stop offset="0%"   stopColor={sauce.light} />
            <stop offset="100%" stopColor={sauce.dark}  />
          </radialGradient>

          {/* Gradiente del queso */}
          <radialGradient id="pv-cheese" cx="36%" cy="32%" r="68%">
            <stop offset="0%"   stopColor={cheeseLight} />
            <stop offset="65%"  stopColor={cheeseDark}  />
            <stop offset="100%" stopColor={cheeseDark}  stopOpacity="0.9" />
          </radialGradient>

          {/* Viñeta periférica para dar volumen */}
          <radialGradient id="pv-vignette" cx="50%" cy="50%" r="50%">
            <stop offset="55%" stopColor="rgba(0,0,0,0)"    />
            <stop offset="100%" stopColor="rgba(0,0,0,0.22)" />
          </radialGradient>
        </defs>

        {/* Sombra base */}
        <ellipse cx="100" cy="104" rx="88" ry="82" fill="rgba(0,0,0,0.17)" />

        {/* Corteza exterior */}
        <circle cx="100" cy="100" r="90" fill="url(#pv-crust)" />

        {/* Manchas de horneado en la corteza */}
        {[
          { cx: 100, cy: 12,  rx: 7,  ry: 4  },
          { cx: 162, cy: 46,  rx: 5,  ry: 3.5},
          { cx: 177, cy: 110, rx: 4,  ry: 6  },
          { cx: 148, cy: 168, rx: 6,  ry: 4  },
          { cx: 67,  cy: 182, rx: 5,  ry: 3  },
          { cx: 22,  cy: 138, rx: 3.5,ry: 5  },
          { cx: 13,  cy: 72,  rx: 5,  ry: 3.5},
          { cx: 50,  cy: 16,  rx: 4,  ry: 3  },
          { cx: 134, cy: 13,  rx: 3,  ry: 4  },
          { cx: 184, cy: 82,  rx: 3.5,ry: 3  },
        ].map((s, i) => (
          <ellipse key={i} cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry}
            fill="rgba(70,30,5,0.5)" />
        ))}

        {/* Capa de salsa */}
        <motion.circle
          key={sauceId}
          cx="100" cy="100" r="75"
          fill="url(#pv-sauce)"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1,    opacity: 1 }}
          transition={{ duration: 0.3 }}
        />

        {/* Capa de queso derretido */}
        <motion.circle
          key={cheeseId}
          cx="100" cy="100" r="70"
          fill="url(#pv-cheese)"
          fillOpacity="0.92"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1,    opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        />

        {/* Manchas de queso — textura de derretido */}
        {[
          { cx: 86,  cy: 86,  rx: 17, ry: 11, op: 0.5 },
          { cx: 118, cy: 93,  rx: 13, ry:  9, op: 0.4 },
          { cx: 100, cy: 116, rx: 15, ry: 10, op: 0.45},
          { cx: 76,  cy: 112, rx: 11, ry:  7, op: 0.38},
          { cx: 122, cy: 120, rx: 12, ry:  8, op: 0.38},
          { cx: 106, cy: 77,  rx:  9, ry:  6, op: 0.32},
          { cx: 88,  cy: 60,  rx:  7, ry:  5, op: 0.25},
        ].map((b, i) => (
          <ellipse key={i} cx={b.cx} cy={b.cy} rx={b.rx} ry={b.ry}
            fill={cheeseLight} fillOpacity={b.op} />
        ))}

        {/* Viñeta periférica */}
        <circle cx="100" cy="100" r="90" fill="url(#pv-vignette)" />

        {/* Reflejo especular */}
        <ellipse cx="74" cy="62" rx="18" ry="10"
          fill="white" fillOpacity="0.12"
          transform="rotate(-28, 74, 62)" />
      </svg>

      {/* ── Capa HTML: imágenes reales de toppings ── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <AnimatePresence>
          {visibleUnits.map((unit, i) => {
            if (!unit.ingredient.image) return null;
            const pos = calcPosition(i, n, unit.pass);

            return (
              <motion.div
                key={unit.uid}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 380,
                  damping: 22,
                  delay: i * 0.025,
                }}
                className="absolute rounded-full overflow-hidden border-[2px] border-white shadow-md"
                style={{
                  width:     `${IMG_SIZE}%`,
                  height:    `${IMG_SIZE}%`,
                  left:      `${pos.x}%`,
                  top:       `${pos.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <img
                  src={unit.ingredient.image}
                  alt={unit.ingredient.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Mensaje cuando no hay toppings */}
      {n === 0 && (
        <div className="absolute inset-0 flex items-end justify-center pb-3 pointer-events-none">
          <span className="text-[11px] text-white/90 bg-black/35 rounded-full px-3 py-1 backdrop-blur-sm">
            Agrega toppings para verlos aquí
          </span>
        </div>
      )}
    </div>
  );
}
