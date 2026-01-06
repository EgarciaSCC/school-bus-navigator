import React from 'react';
import { Gauge } from 'lucide-react';

interface SpeedIndicatorProps {
  speed: number | null;
  heading: number | null;
}

const SpeedIndicator: React.FC<SpeedIndicatorProps> = ({ speed, heading }) => {
  const speedKmh = speed ? Math.round(speed * 3.6) : 0;

  return (
    <div className="absolute top-4 left-4 z-10">
      <div className="panel-card p-4 flex items-center gap-4">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-900 to-red-700 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-card flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-foreground">{speedKmh}</span>
              <span className="text-xs text-muted-foreground">km/h</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Gauge className="w-4 h-4" />
            <span className="text-sm">Velocidad Actual</span>
          </div>
          {heading !== null && (
            <div className="text-xs text-muted-foreground">
              Dirección: {Math.round(heading)}°
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpeedIndicator;
