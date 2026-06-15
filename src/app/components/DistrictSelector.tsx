/**
 * DistrictSelector — Selector de distrito de delivery con tarifa y tiempo estimado.
 *
 * Carga los distritos desde la tabla `districts` de Supabase (migración 003).
 * Si la carga falla (tabla no existe o error de red), utiliza datos locales
 * como respaldo para garantizar que el checkout siempre funcione.
 *
 * Interfaz exportada:
 *  - `District`          — forma del objeto de distrito
 *  - `districts`         — lista local de respaldo (usada si Supabase falla)
 *  - `DistrictSelector`  — componente por defecto
 */

import { useState, useEffect } from 'react';
import { Label } from './ui/label';
import { Clock, MapPin } from 'lucide-react';
import { fetchDistricts, type DistrictRow } from '../../../utils/supabase/db';

// ─── Tipos ────────────────────────────────────────────────────────────────────

/** Forma del objeto de distrito expuesto al resto de la app. */
export interface District {
  name:          string;
  deliveryFee:   number;
  estimatedTime: string;  // ej. "25-35 min"
}

// ─── Datos locales de respaldo ────────────────────────────────────────────────

/**
 * Lista de distritos locales utilizada cuando Supabase no está disponible.
 * Debe mantenerse sincronizada con los datos en 003_districts_promotions.sql.
 * Exportada para que Checkout.tsx pueda calcular tarifas sin esperar a Supabase.
 */
export const districts: District[] = [
  { name: 'Villa María del Triunfo', deliveryFee: 0,  estimatedTime: '20-30 min' },
  { name: 'San Juan de Miraflores',  deliveryFee: 5,  estimatedTime: '25-35 min' },
  { name: 'Villa el Salvador',       deliveryFee: 5,  estimatedTime: '30-40 min' },
  { name: 'Barranco',                deliveryFee: 6,  estimatedTime: '25-35 min' },
  { name: 'Chorrillos',              deliveryFee: 6,  estimatedTime: '30-40 min' },
  { name: 'Miraflores',              deliveryFee: 7,  estimatedTime: '30-40 min' },
  { name: 'San Isidro',              deliveryFee: 7,  estimatedTime: '30-40 min' },
  { name: 'Ate',                     deliveryFee: 7,  estimatedTime: '30-40 min' },
  { name: 'Surco',                   deliveryFee: 8,  estimatedTime: '35-45 min' },
  { name: 'Santiago de Surco',       deliveryFee: 8,  estimatedTime: '35-45 min' },
  { name: 'San Borja',               deliveryFee: 8,  estimatedTime: '35-45 min' },
  { name: 'Lima Centro',             deliveryFee: 9,  estimatedTime: '35-45 min' },
  { name: 'San Juan de Lurigancho',  deliveryFee: 10, estimatedTime: '40-50 min' },
  { name: 'La Molina',               deliveryFee: 10, estimatedTime: '40-50 min' },
];

/** Convierte un DistrictRow de Supabase al formato District de la app. */
function toDistrict(row: DistrictRow): District {
  return {
    name:          row.name,
    deliveryFee:   Number(row.delivery_fee),
    estimatedTime: `${row.estimated_min}-${row.estimated_max} min`,
  };
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface DistrictSelectorProps {
  /** Nombre del distrito actualmente seleccionado */
  selectedDistrict: string;
  /** Callback invocado cuando el usuario cambia la selección */
  onDistrictChange: (district: string) => void;
  /** Clases CSS adicionales para el contenedor raíz */
  className?: string;
}

// ─── Componente ───────────────────────────────────────────────────────────────

/**
 * Selector de distrito con carga dinámica desde Supabase.
 *
 * Al montar, intenta cargar los distritos de la tabla `districts`.
 * Si falla, usa la lista local `districts` como respaldo para que el
 * checkout nunca quede bloqueado.
 *
 * Muestra para el distrito seleccionado:
 *  - Costo de delivery en soles
 *  - Tiempo estimado de entrega
 */
export default function DistrictSelector({
  selectedDistrict,
  onDistrictChange,
  className = '',
}: DistrictSelectorProps) {
  const [districtList, setDistrictList] = useState<District[]>(districts);

  // Cargar distritos desde Supabase al montar
  useEffect(() => {
    fetchDistricts().then(({ data, error }) => {
      if (!error && data.length > 0) {
        setDistrictList(data.map(toDistrict));
      }
      // Si falla: mantener los datos locales ya cargados
    });
  }, []);

  const selected = districtList.find(d => d.name === selectedDistrict);

  return (
    <div className={className}>
      {/* Etiqueta y select */}
      <Label htmlFor="district" className="flex items-center gap-1.5 mb-1">
        <MapPin className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
        Distrito de entrega *
      </Label>
      <select
        id="district"
        value={selectedDistrict}
        onChange={e => onDistrictChange(e.target.value)}
        required
        aria-label="Selecciona tu distrito"
        className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground text-sm"
      >
        <option value="">-- Selecciona tu distrito --</option>
        {districtList.map(district => (
          <option key={district.name} value={district.name}>
            {district.name}
            {district.deliveryFee === 0
              ? ' — Gratis'
              : ` — S/ ${district.deliveryFee.toFixed(2)}`}
          </option>
        ))}
      </select>

      {/* Info del distrito seleccionado */}
      {selected && (
        <div className="mt-3 bg-muted/40 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Costo de delivery:</span>
            {selected.deliveryFee === 0 ? (
              <span className="font-semibold text-green-600">Gratis</span>
            ) : (
              <span className="font-semibold text-primary">
                S/ {selected.deliveryFee.toFixed(2)}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
              Tiempo estimado:
            </span>
            <span className="font-semibold text-foreground">{selected.estimatedTime}</span>
          </div>
        </div>
      )}
    </div>
  );
}
