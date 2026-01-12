import React from 'react';
import { Clock, MapPin, Users, ChevronRight, CheckCircle2, Play, Plus } from 'lucide-react';
import { RouteData, Stop } from '@/types/route';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import isotipoNCA from '@/assets/isotipo-NCA.png';

interface RoutePanelProps {
  route: RouteData;
  onStopSelect: (stop: Stop, index: number) => void;
  onStartRoute?: () => void;
  onAddStop?: () => void;
}

const RoutePanel: React.FC<RoutePanelProps> = ({ route, onStopSelect, onStartRoute, onAddStop }) => {
  const completedStops = route.stops.filter(s => s.status === 'completed').length;
  const totalStudents = route.stops.reduce((acc, s) => acc + s.students.length, 0);
  const pickedStudents = route.stops.reduce(
    (acc, s) => acc + s.students.filter(st => st.status !== 'waiting').length,
    0
  );

  return (
    <div className="h-full flex flex-col bg-card overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-border shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <img src={isotipoNCA} alt="NCA" className="w-10 h-10 object-contain shrink-0" />
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-foreground truncate">{route.name}</h1>
            <p className="text-sm text-muted-foreground">Conductor Activo</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-purple-50 rounded-xl p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 text-purple-900 mb-0.5">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="font-bold text-sm">{completedStops}/{route.stops.length}</span>
            </div>
            <p className="text-[10px] text-purple-700">Paradas</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 text-yellow-900 mb-0.5">
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span className="font-bold text-sm">{pickedStudents}/{totalStudents}</span>
            </div>
            <p className="text-[10px] text-yellow-700">Estudiantes</p>
          </div>
          <div className="bg-red-50 rounded-xl p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 text-red-900 mb-0.5">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span className="font-bold text-sm">{route.estimatedEndTime}</span>
            </div>
            <p className="text-[10px] text-red-700">Llegada Est.</p>
          </div>
        </div>
      </div>

      {/* Stops List */}
      <ScrollArea className="flex-1">
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Paradas de la Ruta
            </h2>
            {onAddStop && route.status === 'not_started' && (
              <Button
                variant="outline"
                size="sm"
                onClick={onAddStop}
                className="h-7 text-xs gap-1 shrink-0"
              >
                <Plus className="w-3 h-3" />
                Nueva
              </Button>
            )}
          </div>
          <div className="space-y-3">
            {route.stops.map((stop, index) => {
              const isActive = index === route.currentStopIndex && route.status === 'in_progress';
              const isCompleted = stop.status === 'completed';
              
              let cardClass = 'stop-card stop-card-pending';
              if (isActive) cardClass = 'stop-card stop-card-active';
              if (isCompleted) cardClass = 'stop-card stop-card-completed';

              return (
                <div
                  key={stop.id}
                  className={cardClass}
                  onClick={() => onStopSelect(stop, index)}
                >
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0
                    ${isCompleted ? 'bg-green-500 text-white' : 
                      isActive ? 'bg-yellow-900 text-foreground' : 
                      'bg-grey-200 text-grey-700'}
                  `}>
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <p className={`font-semibold text-sm truncate ${isCompleted ? 'text-green-700' : 'text-foreground'}`}>
                      {stop.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{stop.address}</p>
                    <p className="text-xs text-primary mt-0.5">
                      {stop.students.length} estudiante{stop.students.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                </div>
              );
            })}
          </div>
        </div>
      </ScrollArea>

      {/* Start Route Button - Only show when route is pending */}
      {route.status === 'not_started' && onStartRoute && (
        <div className="p-5 border-t border-border shrink-0">
          <Button
            onClick={onStartRoute}
            className="w-full h-12 text-base font-semibold gap-2"
            size="lg"
          >
            <Play className="w-5 h-5" />
            Iniciar Ruta
          </Button>
        </div>
      )}
    </div>
  );
};

export default RoutePanel;
