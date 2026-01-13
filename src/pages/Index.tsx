import React, { useState, useCallback } from 'react';
import { PanelLeftClose, PanelLeft } from 'lucide-react';
import Map from '@/components/Map';
import RoutePanel from '@/components/RoutePanel';
import ActionBar from '@/components/ActionBar';
import StopDetailSheet from '@/components/StopDetailSheet';
import SpeedIndicator from '@/components/SpeedIndicator';
import ETADisplay from '@/components/ETADisplay';
import ParentNotification from '@/components/ParentNotification';
import AddStopModal from '@/components/AddStopModal';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useSmartETA } from '@/hooks/useSmartETA';
import { useProximityAlerts } from '@/hooks/useProximityAlerts';
import { useToast } from '@/hooks/use-toast';
import { MOCK_ROUTE } from '@/data/mockRoute';
import { RouteData, Stop, Student, IncidentType, INCIDENT_CONFIG } from '@/types/route';

interface NotificationData {
  stopName: string;
  distance: number;
  etaMinutes: number;
  studentCount: number;
}

const Index = () => {
  const { coordinates, speed, heading, error: geoError } = useGeolocation();
  const { toast } = useToast();
  
  const [route, setRoute] = useState<RouteData>(MOCK_ROUTE);
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);
  const [isStopSheetOpen, setIsStopSheetOpen] = useState(false);
  const [isAddStopModalOpen, setIsAddStopModalOpen] = useState(false);
  const [activeNotification, setActiveNotification] = useState<NotificationData | null>(null);
  const [isOffRoute, setIsOffRoute] = useState(false);
  const [isPanelVisible, setIsPanelVisible] = useState(true);
  const [routeVersion, setRouteVersion] = useState(0);

  // Smart ETA calculation using Mapbox with intelligent update conditions
  const { nextStopETA, stopETAs } = useSmartETA(
    coordinates,
    route.stops,
    route.currentStopIndex,
    route.status === 'in_progress',
    isOffRoute
  );

  // Get next stop
  const nextStop = route.stops[route.currentStopIndex];

  // Handle parent notification when bus is within 5km
  const handleProximityNotification = useCallback((stopName: string, distance: number, etaMinutes: number) => {
    const stop = route.stops.find(s => s.name === stopName);
    const studentCount = stop?.students.length || 0;

    setActiveNotification({
      stopName,
      distance,
      etaMinutes,
      studentCount,
    });
  }, [route.stops]);

  // Proximity alerts hook
  useProximityAlerts(
    coordinates,
    speed,
    route.stops,
    route.currentStopIndex,
    route.status === 'in_progress',
    handleProximityNotification
  );

  // Handle start route
  const handleStartRoute = useCallback(() => {
    setRoute(prev => ({
      ...prev,
      status: 'in_progress',
      stops: prev.stops.map((s, i) => 
        i === 0 ? { ...s, status: 'active' } : s
      ),
    }));
    
    // Auto-hide panel when route starts
    setIsPanelVisible(false);
    
    toast({
      title: '🚌 Ruta Iniciada',
      description: `${route.name} - ${route.stops.length} paradas`,
    });
  }, [route.name, route.stops.length, toast]);

  // Handle complete current stop and trigger route recalculation
  const handleCompleteStop = useCallback(() => {
    setRoute(prev => {
      const currentIndex = prev.currentStopIndex;
      const nextIndex = currentIndex + 1;
      
      const updatedStops = prev.stops.map((s, i) => {
        if (i === currentIndex) return { ...s, status: 'completed' as const, completedAt: new Date() };
        if (i === nextIndex) return { ...s, status: 'active' as const };
        return s;
      });

      const isLastStop = nextIndex >= prev.stops.length;

      return {
        ...prev,
        stops: updatedStops,
        currentStopIndex: isLastStop ? currentIndex : nextIndex,
        status: isLastStop ? 'completed' : 'in_progress',
      };
    });

    // Trigger route recalculation for remaining stops
    setRouteVersion(v => v + 1);

    toast({
      title: '✅ Parada Completada',
      description: 'Continuando a la siguiente parada...',
    });
  }, [toast]);

  // Handle report incident
  const handleReportIncident = useCallback((type: IncidentType) => {
    const config = INCIDENT_CONFIG[type];
    
    toast({
      title: `📍 ${config.label}`,
      description: 'Novedad reportada exitosamente',
    });
  }, [toast]);

  // Handle finish route
  const handleFinishRoute = useCallback(() => {
    setRoute(prev => ({
      ...prev,
      status: 'completed',
      stops: prev.stops.map(s => ({ ...s, status: 'completed' as const })),
    }));

    toast({
      title: '🏁 Ruta Finalizada',
      description: '¡Buen trabajo! Todas las paradas completadas.',
    });
  }, [toast]);

  // Handle route recalculation notification
  const handleRouteRecalculated = useCallback(() => {
    setIsOffRoute(false);
    toast({
      title: '🔄 Ruta Recalculada',
      description: 'Se ha encontrado una nueva ruta óptima',
    });
  }, [toast]);

  // Handle off-route detection
  const handleOffRoute = useCallback((offRoute: boolean) => {
    setIsOffRoute(offRoute);
  }, []);

  // Handle stop selection
  const handleStopSelect = useCallback((stop: Stop, index: number) => {
    setSelectedStop(stop);
    setIsStopSheetOpen(true);
  }, []);

  // Handle student action
  const handleStudentAction = useCallback((student: Student, action: 'picked' | 'dropped') => {
    setRoute(prev => ({
      ...prev,
      stops: prev.stops.map(stop => ({
        ...stop,
        students: stop.students.map(s => 
          s.id === student.id ? { ...s, status: action } : s
        ),
      })),
    }));

    // Update selected stop to reflect changes
    setSelectedStop(prev => {
      if (!prev) return null;
      return {
        ...prev,
        students: prev.students.map(s => 
          s.id === student.id ? { ...s, status: action } : s
        ),
      };
    });

    const actionLabel = action === 'picked' ? 'recogido' : 'dejado en casa';
    toast({
      title: `👤 ${student.name}`,
      description: `Estudiante ${actionLabel}`,
    });
  }, [toast]);

  // Handle add new stop - inserts before the last stop (as intermediate stop) and triggers route recalculation
  const handleAddStop = useCallback((stopData: Omit<Stop, 'id' | 'status' | 'completedAt'>) => {
    const newStop: Stop = {
      ...stopData,
      id: `stop-${Date.now()}`,
      status: 'pending',
    };

    setRoute(prev => {
      const stops = [...prev.stops];
      // Insert before the last stop to keep the final destination unchanged
      if (stops.length > 1) {
        stops.splice(stops.length - 1, 0, newStop);
      } else {
        stops.push(newStop);
      }
      return {
        ...prev,
        stops,
      };
    });

    // Trigger route recalculation
    setRouteVersion(v => v + 1);

    toast({
      title: '📍 Nueva Parada Agregada',
      description: `${newStop.name} - ${newStop.students.length} estudiante(s) (parada intermedia)`,
    });
  }, [toast]);

  // Handle reorder stops via drag and drop
  const handleReorderStops = useCallback((fromIndex: number, toIndex: number) => {
    setRoute(prev => {
      const stops = [...prev.stops];
      const [movedStop] = stops.splice(fromIndex, 1);
      stops.splice(toIndex, 0, movedStop);
      return {
        ...prev,
        stops,
      };
    });

    // Trigger route recalculation
    setRouteVersion(v => v + 1);

    toast({
      title: '🔄 Paradas Reordenadas',
      description: 'La ruta ha sido actualizada',
    });
  }, [toast]);

  return (
    <div className="h-screen w-screen flex overflow-hidden">
      {/* Left Panel - Route Info */}
      {isPanelVisible && (
        <div className="w-full sm:w-80 md:w-96 shrink-0 border-r border-border shadow-lg z-20 absolute sm:relative inset-0 sm:inset-auto bg-card">
          <RoutePanel 
            route={route} 
            onStopSelect={handleStopSelect}
            onStartRoute={handleStartRoute}
            onAddStop={() => setIsAddStopModalOpen(true)}
            onReorderStops={handleReorderStops}
          />
          {/* Close button for mobile - inside panel */}
          <button
            onClick={() => setIsPanelVisible(false)}
            className="sm:hidden absolute top-4 right-4 z-40 bg-muted/80 backdrop-blur-sm rounded-full p-2 shadow-md hover:bg-muted transition-colors"
          >
            <PanelLeftClose className="w-5 h-5 text-foreground" />
          </button>
        </div>
      )}

      {/* Toggle Panel Button - Desktop: at panel edge, Mobile: floating */}
      <button
        onClick={() => setIsPanelVisible(!isPanelVisible)}
        className={`absolute z-30 bg-card shadow-lg p-2.5 hover:bg-muted transition-all duration-300 border border-border
          ${isPanelVisible 
            ? 'hidden sm:flex sm:left-80 md:left-96 sm:rounded-r-lg sm:border-l-0 sm:top-1/2 sm:-translate-y-1/2' 
            : 'left-4 top-4 rounded-lg sm:left-0 sm:top-1/2 sm:-translate-y-1/2 sm:rounded-r-lg sm:border-l-0'
          }`}
      >
        {isPanelVisible ? (
          <PanelLeftClose className="w-5 h-5 text-foreground" />
        ) : (
          <PanelLeft className="w-5 h-5 text-foreground" />
        )}
      </button>

      {/* Map Area */}
      <div className="flex-1 relative">
        <Map
          userLocation={coordinates}
          stops={route.stops}
          currentStopIndex={route.currentStopIndex}
          onStopClick={(stop) => handleStopSelect(stop, route.stops.findIndex(s => s.id === stop.id))}
          isNavigating={route.status === 'in_progress'}
          heading={heading}
          onRouteRecalculated={handleRouteRecalculated}
          isOffRoute={isOffRoute}
          onResize={isPanelVisible}
          routeVersion={routeVersion}
        />

        {/* Speed Indicator - positioned based on panel visibility */}
        <div className={`absolute top-4 z-10 transition-all duration-300 ${
          isPanelVisible 
            ? 'left-4' 
            : 'left-14 sm:left-16'
        }`}>
          <SpeedIndicator 
            speed={speed} 
            heading={heading} 
            compact={!isPanelVisible}
          />
        </div>

        {/* ETA Display - Only show when navigating */}
        {route.status === 'in_progress' && nextStopETA && nextStop && (
          <div className={`absolute top-4 z-10 transition-all duration-300 ${
            isPanelVisible 
              ? 'left-[calc(1rem+5rem+1rem)] sm:left-[calc(1rem+6rem+1rem)]'
              : 'right-4'
          }`}>
            <ETADisplay
              distanceRemaining={nextStopETA.distanceRemaining}
              etaMinutes={nextStopETA.etaMinutes}
              etaTime={nextStopETA.etaTime}
              stopName={nextStop.name}
              compact={!isPanelVisible}
            />
          </div>
        )}

        {/* Geolocation Error */}
        {geoError && (
          <div className="absolute top-4 right-4 z-10 panel-card p-3 bg-red-50 border-red-200">
            <p className="text-sm text-red-700">⚠️ {geoError}</p>
          </div>
        )}

        {/* Action Bar */}
        <ActionBar
          routeStatus={route.status}
          onStartRoute={handleStartRoute}
          onReportIncident={handleReportIncident}
          onCompleteStop={handleCompleteStop}
          onFinishRoute={handleFinishRoute}
        />
      </div>

      {/* Stop Detail Sheet */}
      <StopDetailSheet
        stop={selectedStop}
        open={isStopSheetOpen}
        onClose={() => setIsStopSheetOpen(false)}
        onStudentAction={handleStudentAction}
        routeDirection={route.direction}
      />

      {/* Add Stop Modal */}
      <AddStopModal
        open={isAddStopModalOpen}
        onClose={() => setIsAddStopModalOpen(false)}
        onAddStop={handleAddStop}
      />

      {/* Parent Notification Popup */}
      {activeNotification && (
        <ParentNotification
          stopName={activeNotification.stopName}
          distance={activeNotification.distance}
          etaMinutes={activeNotification.etaMinutes}
          studentCount={activeNotification.studentCount}
          onClose={() => setActiveNotification(null)}
        />
      )}
    </div>
  );
};

export default Index;
