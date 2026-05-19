import { Label } from './ui/label';

export interface District {
  name: string;
  deliveryFee: number;
}

export const districts: District[] = [
  { name: 'San Juan de Miraflores', deliveryFee: 5 },
  { name: 'Surco', deliveryFee: 8 },
  { name: 'Villa el Salvador', deliveryFee: 5 },
  { name: 'La Molina', deliveryFee: 10 },
  { name: 'Miraflores', deliveryFee: 7 },
  { name: 'San Isidro', deliveryFee: 7 },
  { name: 'Barranco', deliveryFee: 6 },
  { name: 'Chorrillos', deliveryFee: 6 },
  { name: 'San Borja', deliveryFee: 8 },
  { name: 'Santiago de Surco', deliveryFee: 8 },
  { name: 'Lima Centro', deliveryFee: 9 },
  { name: 'Ate', deliveryFee: 7 },
  { name: 'San Juan de Lurigancho', deliveryFee: 10 },
  { name: 'Villa María del Triunfo', deliveryFee: 6 },
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
        <p className="text-sm text-muted-foreground mt-2">
          Costo de delivery: <span className="font-medium text-primary">S/ {selectedDistrictData.deliveryFee.toFixed(2)}</span>
        </p>
      )}
    </div>
  );
}
