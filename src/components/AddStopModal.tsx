import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, MapPin, Users, Trash2, Check, Loader2, Move } from 'lucide-react';
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
import StructuredAddressInput from './StructuredAddressInput';

interface AddStopModalProps {
  open: boolean;
  onClose: () => void;
  onAddStop: (stop: Omit<Stop, 'id' | 'status' | 'completedAt'>) => void;
  keepOpenAfterAdd?: boolean;
}

const AddStopModal: React.FC<AddStopModalProps> = ({ open, onClose, onAddStop, keepOpenAfterAdd = false }) => {
  const [stopName, setStopName] = useState('');
  const [address, setAddress] = useState('');
  const [studentNames, setStudentNames] = useState<string[]>(['']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Map states
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const [confirmedLocation, setConfirmedLocation] = useState<[number, number] | null>(null);
  const [showMap, setShowMap] = useState(false);
  
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

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

  // Handle address change from structured input
  const handleAddressChange = (value: string) => {
    setAddress(value);
    setConfirmedLocation(null);
  };

  // Handle location found from structured input
  const handleLocationFound = (coordinates: [number, number]) => {
    setSelectedLocation(coordinates);
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
    
    // Reset form but optionally keep modal open
    resetForm();
    setIsSubmitting(false);
    
    if (!keepOpenAfterAdd) {
      onClose();
    }
  };

  const resetForm = () => {
    setStopName('');
    setAddress('');
    setStudentNames(['']);
    setIsSubmitting(false);
    setSelectedLocation(null);
    setConfirmedLocation(null);
    setShowMap(false);
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

          {/* Structured Address Input */}
          <StructuredAddressInput
            onAddressChange={handleAddressChange}
            onLocationFound={handleLocationFound}
            disabled={showMap}
            showResults={!showMap && !confirmedLocation}
          />

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
                  {keepOpenAfterAdd ? 'Cerrar' : 'Cancelar'}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !stopName.trim() || !address.trim() || !confirmedLocation}
                  className="flex-1"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {keepOpenAfterAdd ? 'Agregar y Continuar' : 'Crear Parada'}
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
