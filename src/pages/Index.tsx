import React, { useState, useCallback } from 'react';
import { PanelLeftClose, PanelLeft, MapIcon, Navigation } from 'lucide-react';
import Map from '@/components/Map';
import RoutePanel from '@/components/RoutePanel';
import ActionBar from '@/components/ActionBar';
import StopDetailSheet from '@/components/StopDetailSheet';
import SpeedIndicator from '@/components/SpeedIndicator';
import ETADisplay from '@/components/ETADisplay';
import ParentNotification from '@/components/ParentNotification';
import AddStopModal from '@/components/AddStopModal';
import ArrivalConfirmation from '@/components/ArrivalConfirmation';
import RouteReportModal from '@/components/RouteReportModal';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useSmartETA } from '@/hooks/useSmartETA';
import { useProximityAlerts } from '@/hooks/useProximityAlerts';
import { useGeofencing } from '@/hooks/useGeofencing';
import { useRouteTracking } from '@/hooks/useRouteTracking';
import { useToast } from '@/hooks/use-toast';
import { MOCK_ROUTE } from '@/data/mockRoute';
import { RouteData, Stop, Student, IncidentType, INCIDENT_CONFIG } from '@/types/route';
import { RouteReport } from '@/types/routeReport';

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
  const [showRouteOverview, setShowRouteOverview] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [currentReport, setCurrentReport] = useState<RouteReport | null>(null);

  // Route tracking for report generation
  const {
    startTracking,
    stopTracking,
    recordStudentAction,
    recordStopCompletion,
    recordIncident,
    submitReport,
    totalDistanceKm,
    averageSpeedKmh,
  } = useRouteTracking({
    route,
    coordinates,
    speed,
    isNavigating: route.status === 'in_progress',
  });

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

  // Handle auto-arrival when bus enters geofence
  const handleAutoArrival = useCallback((stopId: string, stopName: string) => {
    toast({
      title: '📍 Llegada Detectada',
      description: `Has llegado a: ${stopName}`,
    });
  }, [toast]);

  // Geofencing for automatic arrival detection
  const {
    geofenceState,
    hasArrivedAtStop,
    confirmArrival,
    dismissArrival,
  } = useGeofencing(
    coordinates,
    nextStop,
    route.status === 'in_progress',
    handleAutoArrival
  );

  // Handle confirming arrival and opening stop sheet
  const handleConfirmArrival = useCallback(() => {
    confirmArrival();
    if (nextStop) {
      setSelectedStop(nextStop);
      setIsStopSheetOpen(true);
    }
  }, [confirmArrival, nextStop]);

  // Handle start route
  const handleStartRoute = useCallback(() => {
    setRoute(prev => ({
      ...prev,
      status: 'in_progress',
      stops: prev.stops.map((s, i) => 
        i === 0 ? { ...s, status: 'active' } : s
      ),
    }));
    
    // Start tracking for report
    startTracking();
    
    // Auto-hide panel when route starts
    setIsPanelVisible(false);
    
    toast({
      title: '🚌 Ruta Iniciada',
      description: `${route.name} - ${route.stops.length} paradas`,
    });
  }, [route.name, route.stops.length, toast, startTracking]);

  // Handle complete current stop and trigger route recalculation
  const handleCompleteStop = useCallback(() => {
    const currentStop = route.stops[route.currentStopIndex];
    
    // Record stop completion for report
    if (currentStop) {
      recordStopCompletion(currentStop);
    }
    
    const isLastStop = route.currentStopIndex + 1 >= route.stops.length;
    
    // If this is the last stop, generate and show report
    if (isLastStop) {
      const report = stopTracking();
      
      setRoute(prev => ({
        ...prev,
        status: 'completed',
        stops: prev.stops.map((s, i) => 
          i === prev.currentStopIndex 
            ? { ...s, status: 'completed' as const, completedAt: new Date() }
            : s
        ),
      }));

      if (report) {
        setCurrentReport(report);
        setIsReportModalOpen(true);
      }

      toast({
        title: '🏁 Ruta Finalizada',
        description: '¡Buen trabajo! Todas las paradas completadas.',
      });
      
      return;
    }
    
    setRoute(prev => {
      const currentIndex = prev.currentStopIndex;
      const nextIndex = currentIndex + 1;
      
      const updatedStops = prev.stops.map((s, i) => {
        if (i === currentIndex) return { ...s, status: 'completed' as const, completedAt: new Date() };
        if (i === nextIndex) return { ...s, status: 'active' as const };
        return s;
      });

      return {
        ...prev,
        stops: updatedStops,
        currentStopIndex: nextIndex,
        status: 'in_progress',
      };
    });

    // Trigger route recalculation for remaining stops
    setRouteVersion(v => v + 1);

    toast({
      title: '✅ Parada Completada',
      description: 'Continuando a la siguiente parada...',
    });
  }, [toast, route.stops, route.currentStopIndex, recordStopCompletion, stopTracking]);

  // Handle report incident
  const handleReportIncident = useCallback((type: IncidentType) => {
    const config = INCIDENT_CONFIG[type];
    
    // Record incident for report
    recordIncident();
    
    toast({
      title: `📍 ${config.label}`,
      description: 'Novedad reportada exitosamente',
    });
  }, [toast, recordIncident]);

  // Handle finish route
  const handleFinishRoute = useCallback(() => {
    // Generate report before updating route status
    const report = stopTracking();
    
    setRoute(prev => ({
      ...prev,
      status: 'completed',
      stops: prev.stops.map(s => ({ ...s, status: 'completed' as const })),
    }));

    // Show report modal
    if (report) {
      setCurrentReport(report);
      setIsReportModalOpen(true);
    }

    toast({
      title: '🏁 Ruta Finalizada',
      description: '¡Buen trabajo! Todas las paradas completadas.',
    });
  }, [toast, stopTracking]);

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
  const handleStudentAction = useCallback((student: Student, action: 'picked' | 'dropped' | 'absent') => {
    // Find the stop containing this student for tracking
    const stop = route.stops.find(s => s.students.some(st => st.id === student.id));
    
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

    // Record student action for report
    if (stop) {
      recordStudentAction(student, stop, action);
    }

    const actionLabel = action === 'picked' ? 'recogido' : action === 'dropped' ? 'dejado en casa' : 'no abordó';
    const emoji = action === 'absent' ? '⚠️' : '👤';
    toast({
      title: `${emoji} ${student.name}`,
      description: `Estudiante ${actionLabel}`,
    });
  }, [toast, route.stops, recordStudentAction]);

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
      // Create new array with new references to ensure React detects changes
      const stops = prev.stops.map(s => ({ ...s }));
      const [movedStop] = stops.splice(fromIndex, 1);
      stops.splice(toIndex, 0, movedStop);
      return {
        ...prev,
        stops,
      };
    });

    // Trigger route recalculation after state update
    setTimeout(() => {
      setRouteVersion(v => v + 1);
    }, 50);

    toast({
      title: '🔄 Paradas Reordenadas',
      description: 'La ruta ha sido recalculada',
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
          showOverview={showRouteOverview}
        />

        {/* Route Overview Toggle Button - positioned above Mapbox zoom controls */}
        <button
          onClick={() => setShowRouteOverview(!showRouteOverview)}
          className={`absolute z-20 right-[10px] bottom-[150px] shadow-lg p-2.5 transition-all duration-300 rounded-lg border
            ${showRouteOverview 
              ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90' 
              : 'bg-card text-foreground border-border hover:bg-muted'
            }
          `}
          title={showRouteOverview ? 'Volver a navegación' : 'Ver ruta completa'}
        >
          {showRouteOverview ? (
            <Navigation className="w-5 h-5" />
          ) : (
            <MapIcon className="w-5 h-5" />
          )}
        </button>

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
          currentStop={nextStop}
          onStartRoute={handleStartRoute}
          onReportIncident={handleReportIncident}
          onCompleteStop={handleCompleteStop}
          onShowStopDetail={() => {
            if (nextStop) {
              setSelectedStop(nextStop);
              setIsStopSheetOpen(true);
            }
          }}
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
        onCompleteStop={() => {
          handleCompleteStop();
          setIsStopSheetOpen(false);
        }}
        canCompleteStop={route.status === 'in_progress' && selectedStop?.id === route.stops[route.currentStopIndex]?.id}
      />

      {/* Add Stop Modal - stays open to add multiple stops */}
      <AddStopModal
        open={isAddStopModalOpen}
        onClose={() => setIsAddStopModalOpen(false)}
        onAddStop={handleAddStop}
        keepOpenAfterAdd={route.status === 'not_started'}
      />

      {/* Route Report Modal */}
      <RouteReportModal
        open={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        report={currentReport}
        onSubmit={submitReport}
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

      {/* Geofencing Arrival Confirmation */}
      {hasArrivedAtStop && nextStop && (
        <ArrivalConfirmation
          stopName={nextStop.name}
          distance={geofenceState.distanceToStop}
          onConfirm={handleConfirmArrival}
          onDismiss={dismissArrival}
        />
      )}
    </div>
  );
};

export default Index;
