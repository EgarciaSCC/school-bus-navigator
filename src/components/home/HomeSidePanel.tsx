import React from 'react';
import { ChevronLeft, ChevronRight, Bus, Users, Clock, Calendar, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BackendRoutePreview } from '@/services/driverService';

interface HomeSidePanelProps {
  isOpen: boolean;
  onToggle: () => void;
  activeRoutes: BackendRoutePreview[];
  scheduledRoutes: BackendRoutePreview[];
  completedRoutes: BackendRoutePreview[];
  onRouteSelect: (route: BackendRoutePreview) => void;
}

const getDirectionLabel = (tipoRuta: string) => {
  return tipoRuta === 'RECOGIDA' ? 'Recogida' : 'Regreso';
};

const getDirectionBadgeVariant = (tipoRuta: string): "default" | "secondary" => {
  return tipoRuta === 'RECOGIDA' ? 'default' : 'secondary';
};

const HomeSidePanel: React.FC<HomeSidePanelProps> = ({
  isOpen,
  onToggle,
  activeRoutes,
  scheduledRoutes,
  completedRoutes,
  onRouteSelect,
}) => {
  const allRoutes = [...activeRoutes, ...scheduledRoutes, ...completedRoutes];

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className={`
          fixed top-1/2 -translate-y-1/2 z-40
          flex items-center justify-center
          w-6 h-16 rounded-l-lg
          bg-card border border-r-0 border-border
          shadow-lg hover:bg-muted transition-all duration-300
          ${isOpen ? 'right-80' : 'right-0'}
        `}
        title={isOpen ? 'Ocultar panel' : 'Mostrar panel'}
      >
        {isOpen ? (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {/* Side Panel */}
      <aside
        className={`
          fixed top-0 right-0 h-full w-80 z-30
          bg-card border-l border-border shadow-xl
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <div className="h-full flex flex-col pt-16">
          <div className="px-4 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Rutas del Día
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {allRoutes.length} ruta{allRoutes.length !== 1 ? 's' : ''} programada{allRoutes.length !== 1 ? 's' : ''}
            </p>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {activeRoutes.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Ruta Activa
                  </p>
                  <div className="space-y-2">
                    {activeRoutes.map((route) => (
                      <RouteCard
                        key={route.id}
                        route={route}
                        isActive
                        onClick={() => onRouteSelect(route)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {scheduledRoutes.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Programadas
                  </p>
                  <div className="space-y-2">
                    {scheduledRoutes.map((route) => (
                      <RouteCard
                        key={route.id}
                        route={route}
                        onClick={() => onRouteSelect(route)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {completedRoutes.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Completadas
                  </p>
                  <div className="space-y-2">
                    {completedRoutes.map((route) => (
                      <RouteCard
                        key={route.id}
                        route={route}
                        isCompleted
                        onClick={() => onRouteSelect(route)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {allRoutes.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Bus className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No hay rutas para hoy</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </aside>
    </>
  );
};

// Route Card Component
interface RouteCardProps {
  route: BackendRoutePreview;
  isActive?: boolean;
  isCompleted?: boolean;
  onClick: () => void;
}

const RouteCard: React.FC<RouteCardProps> = ({ route, isActive, isCompleted, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left p-3 rounded-xl transition-all
        border hover:shadow-md
        ${isActive 
          ? 'border-primary/50 bg-primary/5 hover:bg-primary/10' 
          : isCompleted 
            ? 'border-border bg-muted/30 hover:bg-muted/50' 
            : 'border-border bg-card hover:bg-muted/30'
        }
      `}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className={`font-medium text-sm truncate ${isCompleted ? 'text-muted-foreground' : 'text-foreground'}`}>
          {route.nombre}
        </h4>
        <Badge 
          variant={isCompleted ? 'outline' : getDirectionBadgeVariant(route.tipoRuta)} 
          className="text-[10px] shrink-0"
        >
          {getDirectionLabel(route.tipoRuta)}
        </Badge>
      </div>
      
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {route.horaInicio}
        </span>
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          {(route.estudiantes || []).length}
        </span>
      </div>

      {isActive && (
        <div className="mt-2 flex items-center gap-1 text-xs text-primary font-medium">
          <Bus className="w-3 h-3" />
          <span>{route.busId.slice(0, 8)}...</span>
        </div>
      )}

      {isCompleted && (
        <div className="mt-2 flex items-center gap-1 text-xs text-primary">
          <CheckCircle2 className="w-3 h-3" />
          <span>Completada</span>
        </div>
      )}
    </button>
  );
};

export default HomeSidePanel;
