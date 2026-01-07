import React from 'react';
import { Clock, Navigation, MapPin } from 'lucide-react';

interface ETADisplayProps {
  distanceRemaining: number; // in meters
  etaMinutes: number | null;
  etaTime: Date | null;
  stopName?: string;
}

const ETADisplay: React.FC<ETADisplayProps> = ({
  distanceRemaining,
  etaMinutes,
  etaTime,
  stopName,
}) => {
  const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatETA = (minutes: number | null): string => {
    if (minutes === null) return '--';
    if (minutes < 1) return '<1 min';
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}min`;
    }
    return `${minutes} min`;
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-grey-200 p-4 min-w-[200px]">
      {/* Next stop name */}
      {stopName && (
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-grey-100">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-grey-700 truncate">{stopName}</span>
        </div>
      )}
      
      <div className="flex items-center justify-between gap-6">
        {/* ETA */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1 text-grey-500 mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs uppercase font-medium">Llegada</span>
          </div>
          <span className="text-2xl font-bold text-primary">
            {formatETA(etaMinutes)}
          </span>
          {etaTime && (
            <span className="text-xs text-grey-500">
              {formatTime(etaTime)}
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="h-12 w-px bg-grey-200" />

        {/* Distance */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1 text-grey-500 mb-1">
            <Navigation className="w-3.5 h-3.5" />
            <span className="text-xs uppercase font-medium">Distancia</span>
          </div>
          <span className="text-2xl font-bold text-grey-800">
            {formatDistance(distanceRemaining)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ETADisplay;
