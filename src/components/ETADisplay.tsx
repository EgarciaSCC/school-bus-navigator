import React from 'react';
import { Clock, Navigation, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ETADisplayProps {
  distanceRemaining: number; // in meters
  etaMinutes: number | null;
  etaTime: Date | null;
  stopName?: string;
  compact?: boolean;
}

const ETADisplay: React.FC<ETADisplayProps> = ({
  distanceRemaining,
  etaMinutes,
  etaTime,
  stopName,
  compact = false,
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
      return `${hours}h ${mins}m`;
    }
    return `${minutes} min`;
  };

  if (compact) {
    return (
      <div className="bg-background/95 backdrop-blur-sm rounded-xl shadow-lg border border-border p-2 min-w-[120px]">
        {stopName && (
          <div className="flex items-center gap-1 mb-1.5 pb-1.5 border-b border-border">
            <MapPin className="w-3 h-3 text-primary" />
            <span className="text-xs font-medium text-foreground truncate max-w-[100px]">{stopName}</span>
          </div>
        )}
        
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col items-center">
            <span className="text-xs text-muted-foreground">ETA</span>
            <span className="text-sm font-bold text-primary">
              {formatETA(etaMinutes)}
            </span>
          </div>

          <div className="h-6 w-px bg-border" />

          <div className="flex flex-col items-center">
            <span className="text-xs text-muted-foreground">Dist</span>
            <span className="text-sm font-bold text-foreground">
              {formatDistance(distanceRemaining)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background/95 backdrop-blur-sm rounded-2xl shadow-xl border border-border p-3 min-w-[160px]">
      {stopName && (
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
          <MapPin className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium text-foreground truncate">{stopName}</span>
        </div>
      )}
      
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1 text-muted-foreground mb-0.5">
            <Clock className="w-3 h-3" />
            <span className="text-[10px] uppercase font-medium">Llegada</span>
          </div>
          <span className="text-lg font-bold text-primary">
            {formatETA(etaMinutes)}
          </span>
          {etaTime && (
            <span className="text-[10px] text-muted-foreground">
              {formatTime(etaTime)}
            </span>
          )}
        </div>

        <div className="h-10 w-px bg-border" />

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1 text-muted-foreground mb-0.5">
            <Navigation className="w-3 h-3" />
            <span className="text-[10px] uppercase font-medium">Distancia</span>
          </div>
          <span className="text-lg font-bold text-foreground">
            {formatDistance(distanceRemaining)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ETADisplay;
