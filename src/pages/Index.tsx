import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PanelLeftClose, PanelLeft, MapIcon, Navigation, Loader2 } from 'lucide-react';
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
import { RouteData, Stop, Student, IncidentType, INCIDENT_CONFIG } from '@/types/route';
import { RouteReport } from '@/types/routeReport';
import {
  getRutaById,
  getBusById,
  getCoordinadorById,
  BusDetail,
  CoordinadorDetail,
  EstudianteDetail,
} from '@/services/entityService';
import { passengerPickup, passengerDropoff } from '@/services/driverRouteActions';

interface NotificationData {
  stopName: string;
  distance: number;
  etaMinutes: number;
  studentCount: number;
}

/**
 * Transform backend estudiantes into Stop[] with coordinates.
 * Each student with a unique lat/lng becomes a stop; students at the same address are grouped.
 */
type GroupEntry = { students: EstudianteDetail[]; lat: number; lng: number; address: string; barrio: string };

const buildStopsFromEstudiantes = (
  estudiantes: EstudianteDetail[],
  tipoRuta: 'RECOGIDA' | 'REGRESO',
): Stop[] => {
  const groups: Record<string, GroupEntry> = {};

  estudiantes.forEach(est => {
    const key = `${est.lat.toFixed(6)},${est.lng.toFixed(6)}`;
    if (!groups[key]) {
      groups[key] = {
        students: [],
        lat: est.lat,
        lng: est.lng,
        address: est.direccion,
        barrio: est.barrio,
      };
    }
    groups[key].students.push(est);
  });

  // Build intermediate stops
  const stops: Stop[] = [];
  let stopIndex = 0;

  Object.values(groups).forEach((group) => {
    stopIndex++;
    stops.push({
      id: `stop-${stopIndex}`,
      name: group.barrio || `Parada ${stopIndex}`,
      address: group.address,
      coordinates: [group.lng, group.lat],
      students: group.students.map(est => ({
        id: est.id,
        name: est.nombre,
        status: 'waiting' as const,
      })),
      status: 'pending',
    });
  });

  // Terminal points — default coords from first stop
  const defaultCoords: [number, number] = stops.length > 0 ? stops[0].coordinates : [-74.8318124, 11.0073157];

  const terminalStart: Stop = {
    id: 'terminal-start',
    name: tipoRuta === 'RECOGIDA' ? 'Punto de Partida' : 'Colegio',
    address: 'Sede Principal',
    coordinates: defaultCoords,
    students: [],
    status: 'pending',
    isTerminal: true,
  };

  const terminalEnd: Stop = {
    id: 'terminal-end',
    name: tipoRuta === 'RECOGIDA' ? 'Colegio' : 'Punto de Llegada',
    address: 'Sede Principal',
    coordinates: defaultCoords,
    students: [],
    status: 'pending',
    isTerminal: true,
  };

  return [terminalStart, ...stops, terminalEnd];
};

const Index = () => {
  const { routeId } = useParams<{ routeId: string }>();
  const navigate = useNavigate();
  const { coordinates, speed, heading, error: geoError } = useGeolocation();
  const { toast } = useToast();

  // Loading state
  const [isLoadingRoute, setIsLoadingRoute] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Entity data
  const [busDetail, setBusDetail] = useState<BusDetail | null>(null);
  const [coordinadorDetail, setCoordinadorDetail] = useState<CoordinadorDetail | null>(null);

  const [route, setRoute] = useState<RouteData>({
    id: '',
    name: '',
    stops: [],
    startTime: '',
    estimatedEndTime: '',
    currentStopIndex: 0,
    status: 'not_started',
    direction: 'outbound',
  });

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

  // ===== Fetch route data from backend =====
  useEffect(() => {
    if (!routeId) {
      setLoadError('No se proporcionó un ID de ruta');
      setIsLoadingRoute(false);
      return;
    }

    const fetchRouteData = async () => {
      setIsLoadingRoute(true);
      setLoadError(null);

      try {
        // Fetch ruta detail (includes estudiantes with coordinates)
        const rutaData = await getRutaById(routeId);

        if (!rutaData) {
          setLoadError('No se pudo cargar la ruta');
          setIsLoadingRoute(false);
          return;
        }

        const { ruta, estudiantes } = rutaData;

        // Fetch bus and coordinador in parallel
        const [bus, coordinador] = await Promise.all([
          getBusById(ruta.busId),
          getCoordinadorById(ruta.coordinadorId),
        ]);

        setBusDetail(bus);
        setCoordinadorDetail(coordinador);

        // Build stops from student data
        const stops = buildStopsFromEstudiantes(
          estudiantes,
          ruta.tipoRuta,
        );

        // Build RouteData
        const routeData: RouteData = {
          id: ruta.id,
          name: ruta.nombre,
          stops,
          startTime: ruta.horaInicio,
          estimatedEndTime: ruta.horaFin,
          currentStopIndex: 0,
          status: 'not_started',
          direction: ruta.tipoRuta === 'RECOGIDA' ? 'outbound' : 'return',
        };

        setRoute(routeData);
      } catch (error) {
        console.error('Error loading route data:', error);
        setLoadError('Error al cargar los datos de la ruta');
      } finally {
        setIsLoadingRoute(false);
      }
    };

    fetchRouteData();
  }, [routeId]);

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

  // Smart ETA calculation
  const { nextStopETA, stopETAs } = useSmartETA(
    coordinates,
    route.stops,
    route.currentStopIndex,
    route.status === 'in_progress',
    isOffRoute
  );

  const nextStop = route.stops[route.currentStopIndex];

  // Handle parent notification when bus is within 5km
  const handleProximityNotification = useCallback((stopName: string, distance: number, etaMinutes: number) => {
    const stop = route.stops.find(s => s.name === stopName);
    const studentCount = stop?.students.length || 0;
    setActiveNotification({ stopName, distance, etaMinutes, studentCount });
  }, [route.stops]);

  useProximityAlerts(
    coordinates,
    speed,
    route.stops,
    route.currentStopIndex,
    route.status === 'in_progress',
    handleProximityNotification
  );

  const handleAutoArrival = useCallback((stopId: string, stopName: string) => {
    toast({
      title: '📍 Llegada Detectada',
      description: `Has llegado a: ${stopName}`,
    });
  }, [toast]);

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

    startTracking();
    setIsPanelVisible(false);

    toast({
      title: '🚌 Ruta Iniciada',
      description: `${route.name} - ${route.stops.length} paradas`,
    });
  }, [route.name, route.stops.length, toast, startTracking]);

  // Handle complete current stop
  const handleCompleteStop = useCallback(() => {
    const currentStop = route.stops[route.currentStopIndex];
    if (currentStop) recordStopCompletion(currentStop);

    const isLastStop = route.currentStopIndex + 1 >= route.stops.length;

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

      toast({ title: '🏁 Ruta Finalizada', description: '¡Buen trabajo! Todas las paradas completadas.' });
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
      return { ...prev, stops: updatedStops, currentStopIndex: nextIndex, status: 'in_progress' };
    });

    setRouteVersion(v => v + 1);
    toast({ title: '✅ Parada Completada', description: 'Continuando a la siguiente parada...' });
  }, [toast, route.stops, route.currentStopIndex, recordStopCompletion, stopTracking]);

  const handleReportIncident = useCallback((type: IncidentType) => {
    const config = INCIDENT_CONFIG[type];
    recordIncident();
    toast({ title: `📍 ${config.label}`, description: 'Novedad reportada exitosamente' });
  }, [toast, recordIncident]);

  const handleFinishRoute = useCallback(() => {
    const report = stopTracking();
    setRoute(prev => ({
      ...prev,
      status: 'completed',
      stops: prev.stops.map(s => ({ ...s, status: 'completed' as const })),
    }));

    if (report) {
      setCurrentReport(report);
      setIsReportModalOpen(true);
    }

    toast({ title: '🏁 Ruta Finalizada', description: '¡Buen trabajo! Todas las paradas completadas.' });
  }, [toast, stopTracking]);

  const handleRouteRecalculated = useCallback(() => {
    setIsOffRoute(false);
    toast({ title: '🔄 Ruta Recalculada', description: 'Se ha encontrado una nueva ruta óptima' });
  }, [toast]);

  const handleOffRoute = useCallback((offRoute: boolean) => {
    setIsOffRoute(offRoute);
  }, []);

  const handleStopSelect = useCallback((stop: Stop, index: number) => {
    setSelectedStop(stop);
    setIsStopSheetOpen(true);
  }, []);

  const handleStudentAction = useCallback(async (student: Student, action: 'picked' | 'dropped' | 'absent') => {
    const stop = route.stops.find(s => s.students.some(st => st.id === student.id));

    // Call backend for pickup/dropoff
    if (routeId && (action === 'picked' || action === 'dropped')) {
      const success = action === 'picked'
        ? await passengerPickup(routeId, student.id)
        : await passengerDropoff(routeId, student.id);

      if (!success) {
        toast({ title: '⚠️ Error', description: 'No se pudo registrar la acción en el servidor', variant: 'destructive' });
      }
    }

    setRoute(prev => ({
      ...prev,
      stops: prev.stops.map(stop => ({
        ...stop,
        students: stop.students.map(s =>
          s.id === student.id ? { ...s, status: action } : s
        ),
      })),
    }));

    setSelectedStop(prev => {
      if (!prev) return null;
      return {
        ...prev,
        students: prev.students.map(s =>
          s.id === student.id ? { ...s, status: action } : s
        ),
      };
    });

    if (stop) recordStudentAction(student, stop, action);

    const actionLabel = action === 'picked' ? 'recogido' : action === 'dropped' ? 'dejado en casa' : 'no abordó';
    const emoji = action === 'absent' ? '⚠️' : '👤';
    toast({ title: `${emoji} ${student.name}`, description: `Estudiante ${actionLabel}` });
  }, [toast, route.stops, recordStudentAction, routeId]);

  const handleAddStudentToStop = useCallback((student: Student) => {
    if (!selectedStop) return;

    setRoute(prev => ({
      ...prev,
      stops: prev.stops.map(stop =>
        stop.id === selectedStop.id
          ? { ...stop, students: [...stop.students, student] }
          : stop
      ),
    }));

    setSelectedStop(prev => {
      if (!prev) return null;
      return { ...prev, students: [...prev.students, student] };
    });

    toast({ title: '👤 Estudiante Agregado', description: `${student.name} añadido a la parada` });
  }, [selectedStop, toast]);

  const handleAddStop = useCallback((stopData: Omit<Stop, 'id' | 'status' | 'completedAt'>) => {
    const newStop: Stop = { ...stopData, id: `stop-${Date.now()}`, status: 'pending' };

    setRoute(prev => {
      const stops = [...prev.stops];
      if (stops.length > 1) {
        stops.splice(stops.length - 1, 0, newStop);
      } else {
        stops.push(newStop);
      }
      return { ...prev, stops };
    });

    setRouteVersion(v => v + 1);
    toast({ title: '📍 Nueva Parada Agregada', description: `${newStop.name} - ${newStop.students.length} estudiante(s)` });
  }, [toast]);

  const handleReorderStops = useCallback((fromIndex: number, toIndex: number) => {
    setRoute(prev => {
      const stops = prev.stops.map(s => ({ ...s }));
      const [movedStop] = stops.splice(fromIndex, 1);
      stops.splice(toIndex, 0, movedStop);
      return { ...prev, stops };
    });

    setTimeout(() => setRouteVersion(v => v + 1), 50);
    toast({ title: '🔄 Paradas Reordenadas', description: 'La ruta ha sido recalculada' });
  }, [toast]);

  // ===== Loading / Error states =====
  if (isLoadingRoute) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
          <div>
            <p className="font-semibold text-foreground">Cargando ruta...</p>
            <p className="text-sm text-muted-foreground">Obteniendo datos del servidor</p>
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-sm px-4">
          <p className="text-lg font-semibold text-destructive">{loadError}</p>
          <p className="text-sm text-muted-foreground">Verifica tu conexión e intenta de nuevo</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 rounded-lg bg-muted text-foreground hover:bg-muted/80 transition-colors"
            >
              Volver al Dashboard
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            busDetail={busDetail}
            coordinadorDetail={coordinadorDetail}
          />
          <button
            onClick={() => setIsPanelVisible(false)}
            className="sm:hidden absolute top-4 right-4 z-40 bg-muted/80 backdrop-blur-sm rounded-full p-2 shadow-md hover:bg-muted transition-colors"
          >
            <PanelLeftClose className="w-5 h-5 text-foreground" />
          </button>
        </div>
      )}

      {/* Toggle Panel Button */}
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

        {/* Route Overview Toggle */}
        <button
          onClick={() => setShowRouteOverview(!showRouteOverview)}
          className={`absolute z-20 right-[10px] bottom-[150px] shadow-lg p-2.5 transition-all duration-300 rounded-lg border
            ${showRouteOverview
              ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90'
              : 'bg-card text-foreground border-border hover:bg-muted'
            }`}
          title={showRouteOverview ? 'Volver a navegación' : 'Ver ruta completa'}
        >
          {showRouteOverview ? <Navigation className="w-5 h-5" /> : <MapIcon className="w-5 h-5" />}
        </button>

        {/* Speed Indicator */}
        <div className={`absolute top-4 z-10 transition-all duration-300 ${
          isPanelVisible ? 'left-4' : 'left-14 sm:left-16'
        }`}>
          <SpeedIndicator speed={speed} heading={heading} compact={!isPanelVisible} />
        </div>

        {/* ETA Display */}
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
        busLocation={coordinates}
        onAddStudent={handleAddStudentToStop}
      />

      {/* Add Stop Modal */}
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

      {/* Parent Notification */}
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
