import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Plus, MapPin, Users, Trash2, Search, Check, Loader2, Move } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Stop, Student } from '@/types/route';
import { MAPBOX_TOKEN, MAPBOX_STYLE } from '@/config/mapbox';
import mapboxgl from 'mapbox-gl';

interface GeocodeResult {
  place_name: string;
  center: [number, number];
}

interface AddStopModalProps {
  open: boolean;
  onClose: () => void;
  onAddStop: (stop: Omit<Stop, 'id' | 'status' | 'completedAt'>) => void;
}

const AddStopModal: React.FC<AddStopModalProps> = ({ open, onClose, onAddStop }) => {
  const [stopName, setStopName] = useState('');
  const [address, setAddress] = useState('');
  const [studentNames, setStudentNames] = useState<string[]>(['']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Geocoding and map states
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const [confirmedLocation, setConfirmedLocation] = useState<[number, number] | null>(null);
  const [showMap, setShowMap] = useState(false);
  
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize map when location is selected
  useEffect(() => {
    if (!showMap || !selectedLocation || !mapContainerRef.current) return;
    
    // Clean up existing map
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAPBOX_STYLE,
      center: selectedLocation,
      zoom: 16,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.on('load', () => {
      // Add draggable marker
      const marker = new mapboxgl.Marker({
        color: '#ef4444',
        draggable: true,
      })
        .setLngLat(selectedLocation)
        .addTo(map);

      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        const newCoords: [number, number] = [lngLat.lng, lngLat.lat];
        setSelectedLocation(newCoords);
        // Trigger reverse geocoding to update address
        reverseGeocode(newCoords);
      });

      markerRef.current = marker;
    });

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [showMap, selectedLocation?.[0], selectedLocation?.[1]]);

  // Update marker position when selectedLocation changes (but don't reinitialize map)
  useEffect(() => {
    if (markerRef.current && selectedLocation) {
      markerRef.current.setLngLat(selectedLocation);
    }
  }, [selectedLocation]);

  // Reverse geocode coordinates to get address
  const reverseGeocode = useCallback(async (coordinates: [number, number]) => {
    setIsReverseGeocoding(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${coordinates[0]},${coordinates[1]}.json?access_token=${MAPBOX_TOKEN}&language=es&limit=1`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const placeName = data.features[0].place_name;
        setAddress(placeName);
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    } finally {
      setIsReverseGeocoding(false);
    }
  }, []);

  // Geocode address (forward geocoding)
  const searchAddress = useCallback(async (query: string) => {
    if (query.length < 3) {
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

  // Debounced search
  const handleAddressChange = (value: string) => {
    setAddress(value);
    setConfirmedLocation(null);
    setShowMap(false);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      searchAddress(value);
    }, 300);
  };

  // Select a geocode result
  const handleSelectResult = (result: GeocodeResult) => {
    setAddress(result.place_name);
    setSelectedLocation(result.center);
    setSearchResults([]);
    setShowMap(true);
  };

  // Confirm the location
  const handleConfirmLocation = () => {
    if (selectedLocation) {
      setConfirmedLocation(selectedLocation);
      setShowMap(false);
    }
  };

  // Cancel location selection
  const handleCancelLocation = () => {
    setShowMap(false);
    setSelectedLocation(null);
    setAddress('');
  };

  const handleAddStudentField = () => {
    setStudentNames(prev => [...prev, '']);
  };

  const handleRemoveStudentField = (index: number) => {
    setStudentNames(prev => prev.filter((_, i) => i !== index));
  };

  const handleStudentNameChange = (index: number, value: string) => {
    setStudentNames(prev => prev.map((name, i) => i === index ? value : name));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stopName.trim() || !address.trim() || !confirmedLocation) {
      return;
    }

    setIsSubmitting(true);

    // Filter out empty student names and create student objects
    const students: Student[] = studentNames
      .filter(name => name.trim())
      .map((name, index) => ({
        id: `new-student-${Date.now()}-${index}`,
        name: name.trim(),
        status: 'waiting' as const,
      }));

    const newStop: Omit<Stop, 'id' | 'status' | 'completedAt'> = {
      name: stopName.trim(),
      address: address.trim(),
      coordinates: confirmedLocation,
      students,
    };

    onAddStop(newStop);
    
    // Reset form
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setStopName('');
    setAddress('');
    setStudentNames(['']);
    setIsSubmitting(false);
    setSelectedLocation(null);
    setConfirmedLocation(null);
    setShowMap(false);
    setSearchResults([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Nueva Parada
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Stop Name */}
          <div className="space-y-2">
            <Label htmlFor="stopName" className="text-sm font-medium">
              Nombre de la Parada *
            </Label>
            <Input
              id="stopName"
              placeholder="Ej: Casa Familia García"
              value={stopName}
              onChange={(e) => setStopName(e.target.value)}
              required
              maxLength={100}
              className="w-full"
            />
          </div>

          {/* Address with Geocoding */}
          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm font-medium">
              Dirección *
            </Label>
            <div className="relative">
              <Input
                id="address"
                placeholder="Ej: Calle 123 #45-67, Barrio Centro"
                value={address}
                onChange={(e) => handleAddressChange(e.target.value)}
                required
                maxLength={200}
                className="w-full pr-10"
                disabled={showMap}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                ) : confirmedLocation ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Search className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && !showMap && (
              <div className="border rounded-lg overflow-hidden bg-card shadow-lg">
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

            {/* Confirmed Location Badge */}
            {confirmedLocation && !showMap && (
              <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700 dark:text-green-400">
                  Ubicación confirmada
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setConfirmedLocation(null);
                    setShowMap(true);
                  }}
                  className="ml-auto h-6 text-xs"
                >
                  Ajustar
                </Button>
              </div>
            )}
          </div>

          {/* Map for Location Confirmation */}
          {showMap && selectedLocation && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Move className="w-4 h-4" />
                <span>Arrastra el marcador para ajustar la ubicación exacta</span>
              </div>

              {/* Current Address Display */}
              <div className="p-2 bg-muted rounded-lg border">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  {isReverseGeocoding ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Obteniendo dirección...</span>
                    </div>
                  ) : (
                    <span className="text-sm line-clamp-2">{address}</span>
                  )}
                </div>
              </div>
              
              <div 
                ref={mapContainerRef} 
                className="w-full h-48 rounded-lg overflow-hidden border"
              />
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelLocation}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmLocation}
                  disabled={isReverseGeocoding}
                  className="flex-1"
                >
                  {isReverseGeocoding ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  Confirmar Ubicación
                </Button>
              </div>
            </div>
          )}

          {/* Students */}
          {!showMap && (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Estudiantes
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddStudentField}
                    className="h-8 text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Agregar
                  </Button>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {studentNames.map((name, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        placeholder={`Nombre del estudiante ${index + 1}`}
                        value={name}
                        onChange={(e) => handleStudentNameChange(index, e.target.value)}
                        maxLength={100}
                        className="flex-1"
                      />
                      {studentNames.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveStudentField(index)}
                          className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Puedes agregar múltiples estudiantes para esta parada
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !stopName.trim() || !address.trim() || !confirmedLocation}
                  className="flex-1"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Parada
                </Button>
              </div>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddStopModal;
