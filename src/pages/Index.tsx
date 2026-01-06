import React, { useState, useCallback } from 'react';
import Map from '@/components/Map';
import RoutePanel from '@/components/RoutePanel';
import ActionBar from '@/components/ActionBar';
import StopDetailSheet from '@/components/StopDetailSheet';
import SpeedIndicator from '@/components/SpeedIndicator';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useToast } from '@/hooks/use-toast';
import { MOCK_ROUTE } from '@/data/mockRoute';
import { RouteData, Stop, Student, IncidentType, INCIDENT_CONFIG } from '@/types/route';

const Index = () => {
  const { coordinates, speed, heading, error: geoError } = useGeolocation();
  const { toast } = useToast();
  
  const [route, setRoute] = useState<RouteData>(MOCK_ROUTE);
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);
  const [isStopSheetOpen, setIsStopSheetOpen] = useState(false);

  // Handle start route
  const handleStartRoute = useCallback(() => {
    setRoute(prev => ({
      ...prev,
      status: 'in_progress',
      stops: prev.stops.map((s, i) => 
        i === 0 ? { ...s, status: 'active' } : s
      ),
    }));
    
    toast({
      title: '🚌 Ruta Iniciada',
      description: `${route.name} - ${route.stops.length} paradas`,
    });
  }, [route.name, route.stops.length, toast]);

  // Handle complete current stop
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

      toast({
        title: '✅ Parada Completada',
        description: prev.stops[currentIndex].name,
      });

      return {
        ...prev,
        stops: updatedStops,
        currentStopIndex: isLastStop ? currentIndex : nextIndex,
        status: isLastStop ? 'completed' : 'in_progress',
      };
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

  return (
    <div className="h-screen w-screen flex overflow-hidden">
      {/* Left Panel - Route Info */}
      <div className="w-80 shrink-0 border-r border-border shadow-lg z-20">
        <RoutePanel 
          route={route} 
          onStopSelect={handleStopSelect}
        />
      </div>

      {/* Map Area */}
      <div className="flex-1 relative">
        <Map
          userLocation={coordinates}
          stops={route.stops}
          currentStopIndex={route.currentStopIndex}
          onStopClick={(stop) => handleStopSelect(stop, route.stops.findIndex(s => s.id === stop.id))}
        />

        {/* Speed Indicator */}
        <SpeedIndicator speed={speed} heading={heading} />

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
      />
    </div>
  );
};

export default Index;
