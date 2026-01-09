import React from 'react';
import { Gauge } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpeedIndicatorProps {
  speed: number | null;
  heading: number | null;
  compact?: boolean;
}

const SpeedIndicator: React.FC<SpeedIndicatorProps> = ({ speed, heading, compact = false }) => {
  const speedKmh = speed ? Math.round(speed * 3.6) : 0;

  return (
    <div className={cn(
      "panel-card flex items-center",
      compact ? "p-2 gap-2" : "p-3 gap-3"
    )}>
      <div className="relative">
        <div className={cn(
          "rounded-full bg-gradient-to-br from-purple-900 to-red-700 flex items-center justify-center",
          compact ? "w-12 h-12" : "w-14 h-14 md:w-16 md:h-16"
        )}>
          <div className={cn(
            "rounded-full bg-card flex flex-col items-center justify-center",
            compact ? "w-9 h-9" : "w-11 h-11 md:w-13 md:h-13"
          )}>
            <span className={cn(
              "font-bold text-foreground",
              compact ? "text-base" : "text-lg md:text-xl"
            )}>{speedKmh}</span>
            <span className={cn(
              "text-muted-foreground",
              compact ? "text-[8px]" : "text-[10px]"
            )}>km/h</span>
          </div>
        </div>
      </div>

      {!compact && (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Gauge className="w-3 h-3" />
            <span className="text-xs">Velocidad</span>
          </div>
          {heading !== null && (
            <div className="text-[10px] text-muted-foreground">
              {Math.round(heading)}°
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SpeedIndicator;
