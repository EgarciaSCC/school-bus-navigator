import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Loader2, Search } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MAPBOX_TOKEN } from '@/config/mapbox';

interface GeocodeResult {
  place_name: string;
  center: [number, number];
}

interface StructuredAddressInputProps {
  onAddressChange: (address: string) => void;
  onLocationFound: (coordinates: [number, number]) => void;
  disabled?: boolean;
}

type RoadType = 'CL' | 'KR' | 'DG' | 'TV' | 'AV' | 'AU' | 'VI';

const ROAD_TYPES: { value: RoadType; label: string; description: string }[] = [
  { value: 'CL', label: 'CL', description: 'Calle (Oriente-Occidente)' },
  { value: 'KR', label: 'KR', description: 'Carrera (Sur-Norte)' },
  { value: 'DG', label: 'DG', description: 'Diagonal' },
  { value: 'TV', label: 'TV', description: 'Transversal' },
  { value: 'AV', label: 'AV', description: 'Avenida' },
  { value: 'AU', label: 'AU', description: 'Autopista' },
  { value: 'VI', label: 'VI', description: 'Vía' },
];

const SUFFIXES = ['', 'A', 'B', 'C', 'D', 'E', 'F', 'BIS'];
const ORIENTATIONS = ['', 'SUR', 'NORTE', 'ESTE', 'OESTE', 'ORIENTE', 'OCCIDENTE'];

const StructuredAddressInput: React.FC<StructuredAddressInputProps> = ({
  onAddressChange,
  onLocationFound,
  disabled = false,
}) => {
  // Address fields
  const [roadType, setRoadType] = useState<RoadType>('CL');
  const [roadNumber, setRoadNumber] = useState('');
  const [roadSuffix, setRoadSuffix] = useState('');
  const [roadOrientation, setRoadOrientation] = useState('');
  const [generatorNumber, setGeneratorNumber] = useState('');
  const [generatorSuffix, setGeneratorSuffix] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('Barranquilla');

  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Build the structured address
  const buildAddress = useCallback(() => {
    if (!roadNumber || !generatorNumber) return '';

    let address = `${roadType} ${roadNumber}`;
    
    if (roadSuffix) address += roadSuffix;
    if (roadOrientation) address += ` ${roadOrientation}`;
    
    address += ` # ${generatorNumber}`;
    if (generatorSuffix) address += generatorSuffix;
    
    if (plateNumber) address += ` - ${plateNumber}`;
    
    if (neighborhood) address += `, ${neighborhood}`;
    if (city) address += `, ${city}`;

    return address;
  }, [roadType, roadNumber, roadSuffix, roadOrientation, generatorNumber, generatorSuffix, plateNumber, neighborhood, city]);

  // Geocode the address
  const searchAddress = useCallback(async (query: string) => {
    if (query.length < 5) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=co&language=es&limit=5`
      );
      const data = await response.json();
      
      if (data.features) {
        setSearchResults(data.features.map((f: any) => ({
          place_name: f.place_name,
          center: f.center as [number, number],
        })));
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Update address and trigger geocoding when fields change
  useEffect(() => {
    const address = buildAddress();
    onAddressChange(address);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (address.length >= 5) {
      searchTimeoutRef.current = setTimeout(() => {
        searchAddress(address);
      }, 500);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [buildAddress, onAddressChange, searchAddress]);

  const handleSelectResult = (result: GeocodeResult) => {
    onLocationFound(result.center);
    setSearchResults([]);
  };

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium flex items-center gap-2">
        <MapPin className="w-4 h-4" />
        Dirección Estructurada *
      </Label>

      {/* Main road */}
      <div className="grid grid-cols-12 gap-2">
        {/* Road Type */}
        <div className="col-span-3">
          <Label className="text-xs text-muted-foreground mb-1 block">Tipo</Label>
          <Select value={roadType} onValueChange={(v) => setRoadType(v as RoadType)} disabled={disabled}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROAD_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <span className="font-medium">{type.label}</span>
                  <span className="text-muted-foreground text-xs ml-1">({type.description})</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Road Number */}
        <div className="col-span-3">
          <Label className="text-xs text-muted-foreground mb-1 block">Número</Label>
          <Input
            placeholder="26"
            value={roadNumber}
            onChange={(e) => setRoadNumber(e.target.value.replace(/[^0-9]/g, ''))}
            maxLength={4}
            className="h-9"
            disabled={disabled}
          />
        </div>

        {/* Road Suffix */}
        <div className="col-span-3">
          <Label className="text-xs text-muted-foreground mb-1 block">Sufijo</Label>
          <Select value={roadSuffix} onValueChange={setRoadSuffix} disabled={disabled}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="-" />
            </SelectTrigger>
            <SelectContent>
              {SUFFIXES.map((suffix) => (
                <SelectItem key={suffix || 'none'} value={suffix || 'none'}>
                  {suffix || 'Ninguno'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Road Orientation */}
        <div className="col-span-3">
          <Label className="text-xs text-muted-foreground mb-1 block">Orient.</Label>
          <Select value={roadOrientation} onValueChange={setRoadOrientation} disabled={disabled}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="-" />
            </SelectTrigger>
            <SelectContent>
              {ORIENTATIONS.map((orient) => (
                <SelectItem key={orient || 'none'} value={orient || 'none'}>
                  {orient || 'Ninguno'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Separator */}
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <span className="font-bold text-lg">#</span>
        <span>Vía generadora</span>
      </div>

      {/* Generator road */}
      <div className="grid grid-cols-12 gap-2">
        {/* Generator Number */}
        <div className="col-span-4">
          <Label className="text-xs text-muted-foreground mb-1 block">Número</Label>
          <Input
            placeholder="45"
            value={generatorNumber}
            onChange={(e) => setGeneratorNumber(e.target.value.replace(/[^0-9]/g, ''))}
            maxLength={4}
            className="h-9"
            disabled={disabled}
          />
        </div>

        {/* Generator Suffix */}
        <div className="col-span-4">
          <Label className="text-xs text-muted-foreground mb-1 block">Sufijo</Label>
          <Select value={generatorSuffix} onValueChange={setGeneratorSuffix} disabled={disabled}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="-" />
            </SelectTrigger>
            <SelectContent>
              {SUFFIXES.map((suffix) => (
                <SelectItem key={suffix || 'none-gen'} value={suffix || 'none'}>
                  {suffix || 'Ninguno'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Plate Number */}
        <div className="col-span-4">
          <Label className="text-xs text-muted-foreground mb-1 block">Placa (-)</Label>
          <Input
            placeholder="67"
            value={plateNumber}
            onChange={(e) => setPlateNumber(e.target.value.replace(/[^0-9]/g, ''))}
            maxLength={4}
            className="h-9"
            disabled={disabled}
          />
        </div>
      </div>

      {/* Additional info */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Barrio</Label>
          <Input
            placeholder="San Vicente"
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
            maxLength={50}
            className="h-9"
            disabled={disabled}
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Ciudad</Label>
          <Input
            placeholder="Barranquilla"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            maxLength={50}
            className="h-9"
            disabled={disabled}
          />
        </div>
      </div>

      {/* Preview of constructed address */}
      {buildAddress() && (
        <div className="p-2 bg-muted rounded-lg border">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary shrink-0" />
            <span className="text-sm font-medium">{buildAddress()}</span>
            {isSearching && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground ml-auto" />}
          </div>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="border rounded-lg overflow-hidden bg-card shadow-lg">
          <div className="px-3 py-2 bg-muted border-b">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Search className="w-3 h-3" />
              Selecciona la ubicación correcta:
            </span>
          </div>
          {searchResults.map((result, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelectResult(result)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors border-b last:border-b-0 flex items-start gap-2"
            >
              <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span className="line-clamp-2">{result.place_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default StructuredAddressInput;
