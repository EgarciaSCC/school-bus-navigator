import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bus, 
  Clock, 
  MapPin, 
  Users, 
  Calendar,
  CheckCircle2,
  PlayCircle,
  Route,
  FileText,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  getDriverRoutesToday, 
  DriverRoutesTodayResponse, 
  DriverRoutePreview 
} from '@/services/driverService';
import HomeHeader from '@/components/home/HomeHeader';
import HomeSidePanel from '@/components/home/HomeSidePanel';

const Home = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const [isLoading, setIsLoading] = useState(true);
  const [driverRoutes, setDriverRoutes] = useState<DriverRoutesTodayResponse | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<DriverRoutePreview | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  useEffect(() => {
    const fetchRoutes = async () => {
      setIsLoading(true);
      try {
        const data = await getDriverRoutesToday();
        setDriverRoutes(data);
      } catch (error) {
        console.error('Error fetching routes:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRoutes();
  }, []);

  // Get the bus plate from any available route
  const busPlate = useMemo(() => {
    return driverRoutes?.activeRoute?.busPlate 
      || driverRoutes?.scheduledRoutes?.[0]?.busPlate 
      || driverRoutes?.completedRoutes?.[0]?.busPlate
      || undefined;
  }, [driverRoutes]);

  // Filter routes based on search query
  const filteredRoutes = useMemo(() => {
    if (!driverRoutes || !searchQuery.trim()) {
      return {
        activeRoute: driverRoutes?.activeRoute || null,
        scheduledRoutes: driverRoutes?.scheduledRoutes || [],
        completedRoutes: driverRoutes?.completedRoutes || [],
      };
    }

    const query = searchQuery.toLowerCase();
    
    const matchesQuery = (route: DriverRoutePreview) => {
      return (
        route.name.toLowerCase().includes(query) ||
        route.busPlate.toLowerCase().includes(query) ||
        (route.direction === 'to_school' && 'recogida'.includes(query)) ||
        (route.direction === 'from_school' && 'regreso'.includes(query))
      );
    };

    return {
      activeRoute: driverRoutes.activeRoute && matchesQuery(driverRoutes.activeRoute) 
        ? driverRoutes.activeRoute 
        : null,
      scheduledRoutes: driverRoutes.scheduledRoutes?.filter(matchesQuery) || [],
      completedRoutes: driverRoutes.completedRoutes?.filter(matchesQuery) || [],
    };
  }, [driverRoutes, searchQuery]);

  // Check if there are any results
  const hasResults = useMemo(() => {
    return filteredRoutes.activeRoute !== null 
      || filteredRoutes.scheduledRoutes.length > 0 
      || filteredRoutes.completedRoutes.length > 0;
  }, [filteredRoutes]);

  const handleViewRoutePreview = (route: DriverRoutePreview) => {
    setSelectedRoute(route);
    setIsPreviewOpen(true);
  };

  const handleStartRoute = (routeId: string) => {
    navigate(`/route/${routeId}`);
  };

  const handlePanelRouteSelect = (route: DriverRoutePreview) => {
    setSelectedRoute(route);
    setIsPreviewOpen(true);
  };

  const getDirectionLabel = (direction: 'to_school' | 'from_school') => {
    return direction === 'to_school' ? 'Recogida' : 'Regreso';
  };

  const getDirectionBadgeVariant = (direction: 'to_school' | 'from_school') => {
    return direction === 'to_school' ? 'default' : 'secondary';
  };

  const formatTime = (time: string) => time;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Unified Header */}
      <HomeHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        busPlate={busPlate}
        isPanelOpen={isPanelOpen}
        onTogglePanel={() => setIsPanelOpen(!isPanelOpen)}
        showPanelToggle={!isMobile}
      />

      {/* Side Panel - Desktop/Tablet only */}
      {!isMobile && (
        <HomeSidePanel
          isOpen={isPanelOpen}
          onToggle={() => setIsPanelOpen(!isPanelOpen)}
          activeRoute={filteredRoutes.activeRoute}
          scheduledRoutes={filteredRoutes.scheduledRoutes}
          completedRoutes={filteredRoutes.completedRoutes}
          onRouteSelect={handlePanelRouteSelect}
        />
      )}

      <main className={`max-w-4xl mx-auto p-4 sm:p-6 space-y-6 transition-all duration-300 ${isPanelOpen && !isMobile ? 'mr-80' : ''}`}>
        {/* Search Results Info */}
        {searchQuery && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Resultados para "<span className="font-medium text-foreground">{searchQuery}</span>"
            </p>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setSearchQuery('')}
              className="text-xs"
            >
              Limpiar
            </Button>
          </div>
        )}

        {/* No Results */}
        {searchQuery && !hasResults && (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-muted-foreground">
              <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No se encontraron rutas para "{searchQuery}"</p>
              <p className="text-sm mt-1">Intenta buscar por nombre de ruta, placa de bus o dirección</p>
            </CardContent>
          </Card>
        )}

        {/* Ruta Activa / Asignada */}
        {(!searchQuery || filteredRoutes.activeRoute) && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <PlayCircle className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Ruta Asignada</h2>
            </div>

            {filteredRoutes.activeRoute ? (
              <Card className="border-primary/50 bg-primary/5">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{filteredRoutes.activeRoute.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Clock className="w-4 h-4" />
                        {formatTime(filteredRoutes.activeRoute.estimatedStartTime)} - {formatTime(filteredRoutes.activeRoute.estimatedEndTime)}
                      </CardDescription>
                    </div>
                    <Badge variant={getDirectionBadgeVariant(filteredRoutes.activeRoute.direction)}>
                      {getDirectionLabel(filteredRoutes.activeRoute.direction)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {filteredRoutes.activeRoute.stopsCount} paradas
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {filteredRoutes.activeRoute.studentsCount} estudiantes
                    </span>
                    <span className="flex items-center gap-1">
                      <Bus className="w-4 h-4" />
                      {filteredRoutes.activeRoute.busPlate}
                    </span>
                  </div>
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => handleStartRoute(filteredRoutes.activeRoute!.id)}
                  >
                    <Route className="w-5 h-5 mr-2" />
                    Iniciar Ruta
                  </Button>
                </CardContent>
              </Card>
            ) : !searchQuery && (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Bus className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No tienes rutas asignadas para este momento</p>
                </CardContent>
              </Card>
            )}
          </section>
        )}

        {/* Rutas Programadas */}
        {(!searchQuery || filteredRoutes.scheduledRoutes.length > 0) && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Rutas Programadas Hoy</h2>
            </div>

            {filteredRoutes.scheduledRoutes.length > 0 ? (
              <div className="space-y-3">
                {filteredRoutes.scheduledRoutes.map((route) => (
                  <Card key={route.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{route.name}</h3>
                            <Badge variant={getDirectionBadgeVariant(route.direction)} className="text-xs">
                              {getDirectionLabel(route.direction)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {formatTime(route.estimatedStartTime)}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {route.stopsCount} paradas
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" />
                              {route.studentsCount}
                            </span>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewRoutePreview(route)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : !searchQuery && (
              <Card className="border-dashed">
                <CardContent className="py-6 text-center text-muted-foreground">
                  <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay más rutas programadas para hoy</p>
                </CardContent>
              </Card>
            )}
          </section>
        )}

        {/* Rutas Completadas */}
        {(!searchQuery || filteredRoutes.completedRoutes.length > 0) && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Rutas Completadas Hoy</h2>
              {filteredRoutes.completedRoutes.length > 0 && (
                <Badge variant="outline" className="ml-auto">
                  {filteredRoutes.completedRoutes.length} completadas
                </Badge>
              )}
            </div>

            {filteredRoutes.completedRoutes.length > 0 ? (
              <div className="space-y-3">
                {filteredRoutes.completedRoutes.map((route) => (
                  <Card key={route.id} className="bg-muted/30">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                            <h3 className="font-medium text-muted-foreground">{route.name}</h3>
                            <Badge variant="outline" className="text-xs">
                              {getDirectionLabel(route.direction)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>
                              {formatTime(route.actualStartTime || route.estimatedStartTime)} - {formatTime(route.actualEndTime || route.estimatedEndTime)}
                            </span>
                            <span>•</span>
                            <span>{route.studentsTransported}/{route.studentsCount} estudiantes</span>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewRoutePreview(route)}
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          Reporte
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : !searchQuery && (
              <Card className="border-dashed">
                <CardContent className="py-6 text-center text-muted-foreground">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aún no has completado rutas hoy</p>
                </CardContent>
              </Card>
            )}
          </section>
        )}
      </main>

      {/* Route Preview/Report Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
            {selectedRoute?.status === 'completed' ? (
              <>
                <FileText className="w-5 h-5 text-primary" />
                Reporte de Ruta
              </>
            ) : (
              <>
                <Eye className="w-5 h-5 text-primary" />
                Vista Previa de Ruta
              </>
            )}
            </DialogTitle>
            <DialogDescription>
              {selectedRoute?.name} - {selectedRoute && getDirectionLabel(selectedRoute.direction)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRoute && (
            <div className="space-y-4">
              {/* Route Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Horario</p>
                  <p className="font-medium">
                    {formatTime(selectedRoute.actualStartTime || selectedRoute.estimatedStartTime)} - {formatTime(selectedRoute.actualEndTime || selectedRoute.estimatedEndTime)}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Bus</p>
                  <p className="font-medium">{selectedRoute.busPlate}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-primary/10 rounded-lg">
                  <MapPin className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <p className="text-lg font-bold">{selectedRoute.stopsCount}</p>
                  <p className="text-xs text-muted-foreground">Paradas</p>
                </div>
                <div className="text-center p-3 bg-primary/10 rounded-lg">
                  <Users className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <p className="text-lg font-bold">
                    {selectedRoute.status === 'completed' 
                      ? `${selectedRoute.studentsTransported}/${selectedRoute.studentsCount}`
                      : selectedRoute.studentsCount
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">Estudiantes</p>
                </div>
                <div className="text-center p-3 bg-primary/10 rounded-lg">
                  <Clock className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <p className="text-lg font-bold">
                    {selectedRoute.status === 'completed' ? '45' : '--'} min
                  </p>
                  <p className="text-xs text-muted-foreground">Duración</p>
                </div>
              </div>

              {/* Completed route specific info */}
              {selectedRoute.status === 'completed' && (
                <div className="border-t pt-4 space-y-3">
                  <h4 className="font-medium text-sm">Resumen del Recorrido</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span>Todas las paradas completadas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      <span>{selectedRoute.studentsTransported} estudiantes transportados</span>
                    </div>
                  </div>
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                    <p className="text-sm text-primary">
                      ✓ Ruta completada exitosamente sin incidentes reportados
                    </p>
                  </div>
                </div>
              )}

              {/* Scheduled route specific info */}
              {selectedRoute.status === 'not_started' && (
                <div className="border-t pt-4 space-y-3">
                  <h4 className="font-medium text-sm">Información de la Ruta</h4>
                  <div className="bg-secondary border border-border rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">
                      ⏰ Esta ruta está programada para hoy. Estará disponible para iniciar a las {formatTime(selectedRoute.estimatedStartTime)}.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Button for Active Route */}
              {selectedRoute.status === 'not_started' && filteredRoutes.activeRoute?.id === selectedRoute.id && (
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => {
                    setIsPreviewOpen(false);
                    handleStartRoute(selectedRoute.id);
                  }}
                >
                  <Route className="w-5 h-5 mr-2" />
                  Iniciar Ruta
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Home;
