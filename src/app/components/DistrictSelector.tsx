import { Label } from './ui/label';
import { Clock } from 'lucide-react';

export interface District {
  name: string;
  deliveryFee: number;
  estimatedTime: string; // e.g., "30-40 min"
}

export const districts: District[] = [
  { name: 'San Juan de Miraflores', deliveryFee: 5, estimatedTime: '25-35 min' },
  { name: 'Surco', deliveryFee: 8, estimatedTime: '35-45 min' },
  { name: 'Villa el Salvador', deliveryFee: 5, estimatedTime: '30-40 min' },
  { name: 'La Molina', deliveryFee: 10, estimatedTime: '40-50 min' },
  { name: 'Miraflores', deliveryFee: 7, estimatedTime: '30-40 min' },
  { name: 'San Isidro', deliveryFee: 7, estimatedTime: '30-40 min' },
  { name: 'Barranco', deliveryFee: 6, estimatedTime: '25-35 min' },
  { name: 'Chorrillos', deliveryFee: 6, estimatedTime: '30-40 min' },
  { name: 'San Borja', deliveryFee: 8, estimatedTime: '35-45 min' },
  { name: 'Santiago de Surco', deliveryFee: 8, estimatedTime: '35-45 min' },
  { name: 'Lima Centro', deliveryFee: 9, estimatedTime: '35-45 min' },
  { name: 'Ate', deliveryFee: 7, estimatedTime: '30-40 min' },
  { name: 'San Juan de Lurigancho', deliveryFee: 10, estimatedTime: '40-50 min' },
  { name: 'Villa María del Triunfo', deliveryFee: 6, estimatedTime: '25-35 min' },
];

interface DistrictSelectorProps {
  selectedDistrict: string;
  onDistrictChange: (district: string) => void;
  className?: string;
}

export default function DistrictSelector({
  selectedDistrict,
  onDistrictChange,
  className = '',
}: DistrictSelectorProps) {
  const selectedDistrictData = districts.find((d) => d.name === selectedDistrict);

  return (
    <div className={className}>
      <Label htmlFor="district">Distrito *</Label>
      <select
        id="district"
        value={selectedDistrict}
        onChange={(e) => onDistrictChange(e.target.value)}
        required
        className="mt-1 w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
      >
        <option value="">Selecciona tu distrito</option>
        {districts.map((district) => (
          <option key={district.name} value={district.name}>
            {district.name} - S/ {district.deliveryFee.toFixed(2)}
          </option>
        ))}
      </select>
      {selectedDistrictData && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Costo de delivery:</span>
            <span className="font-medium text-primary">S/ {selectedDistrictData.deliveryFee.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Tiempo estimado:
            </span>
            <span className="font-medium text-foreground">{selectedDistrictData.estimatedTime}</span>
          </div>
        </div>
      )}
    </div>
  );
}
