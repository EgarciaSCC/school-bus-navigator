import React from 'react';
import { MapPin, CheckCircle, X, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ArrivalConfirmationProps {
  stopName: string;
  distance: number | null;
  onConfirm: () => void;
  onDismiss: () => void;
}

const ArrivalConfirmation: React.FC<ArrivalConfirmationProps> = ({
  stopName,
  distance,
  onConfirm,
  onDismiss,
}) => {
  return (
    <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-card border-2 border-primary rounded-2xl shadow-2xl overflow-hidden">
        {/* Header with animation */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10 animate-pulse" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
              <Navigation className="w-6 h-6 text-white animate-bounce" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">¡Has llegado!</h3>
              <p className="text-white/90 text-sm">Confirma tu llegada a la parada</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-primary/10 rounded-full p-2">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{stopName}</p>
              {distance !== null && (
                <p className="text-sm text-muted-foreground">
                  A {distance} metros de la parada
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onDismiss}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Cerrar
            </Button>
            <Button
              onClick={onConfirm}
              className="flex-1 bg-green-500 hover:bg-green-600"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirmar Llegada
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArrivalConfirmation;
