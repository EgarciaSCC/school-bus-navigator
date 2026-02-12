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
  BackendRoutePreview 
} from '@/services/driverService';
import { getBusById, BusDetail } from '@/services/entityService';
import HomeHeader from '@/components/home/HomeHeader';
import HomeSidePanel from '@/components/home/HomeSidePanel';

// Helper functions for the new backend structure
const getDirectionLabel = (tipoRuta: string) => {
  return tipoRuta === 'RECOGIDA' ? 'Recogida' : 'Regreso';
};

const getDirectionBadgeVariant = (tipoRuta: string): "default" | "secondary" => {
  return tipoRuta === 'RECOGIDA' ? 'default' : 'secondary';
};

const formatTime = (time: string) => time;

const getCurrentMonthName = () => {
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return months[new Date().getMonth()];
};

const Home = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const [isLoading, setIsLoading] = useState(true);
  const [driverRoutes, setDriverRoutes] = useState<DriverRoutesTodayResponse | null>(null);
  const [busDetail, setBusDetail] = useState<BusDetail | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<BackendRoutePreview | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  useEffect(() => {
    const fetchRoutes = async () => {
      setIsLoading(true);
      try {
        const data = await getDriverRoutesToday();
        setDriverRoutes(data);
        
        // Fetch bus detail
        const anyBusId = data?.activeRoutes?.[0]?.busId 
          || data?.scheduledRoutes?.[0]?.busId 
          || data?.completedRoutes?.[0]?.busId;
        if (anyBusId) {
          const bus = await getBusById(anyBusId);
          setBusDetail(bus);
        }
      } catch (error) {
        console.error('Error fetching routes:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRoutes();
  }, []);

  // Get the bus ID from any available route
  const busId = useMemo(() => {
    return driverRoutes?.activeRoutes?.[0]?.busId 
      || driverRoutes?.scheduledRoutes?.[0]?.busId 
      || driverRoutes?.completedRoutes?.[0]?.busId
      || undefined;
  }, [driverRoutes]);

  // Filter routes based on search query
  const filteredRoutes = useMemo(() => {
    if (!driverRoutes || !searchQuery.trim()) {
      return {
        activeRoutes: driverRoutes?.activeRoutes || [],
        scheduledRoutes: driverRoutes?.scheduledRoutes || [],
        completedRoutes: driverRoutes?.completedRoutes || [],
      };
    }

    const query = searchQuery.toLowerCase();
    
    const matchesQuery = (route: BackendRoutePreview) => {
      return (
        route.nombre.toLowerCase().includes(query) ||
        route.busId.toLowerCase().includes(query) ||
        (route.tipoRuta === 'RECOGIDA' && 'recogida'.includes(query)) ||
        (route.tipoRuta === 'REGRESO' && 'regreso'.includes(query))
      );
    };

    return {
      activeRoutes: driverRoutes.activeRoutes?.filter(matchesQuery) || [],
      scheduledRoutes: driverRoutes.scheduledRoutes?.filter(matchesQuery) || [],
      completedRoutes: driverRoutes.completedRoutes?.filter(matchesQuery) || [],
    };
  }, [driverRoutes, searchQuery]);

  // Check if there are any results
  const hasResults = useMemo(() => {
    return filteredRoutes.activeRoutes.length > 0 
      || filteredRoutes.scheduledRoutes.length > 0 
      || filteredRoutes.completedRoutes.length > 0;
  }, [filteredRoutes]);

  const handleViewRoutePreview = (route: BackendRoutePreview) => {
    setSelectedRoute(route);
    setIsPreviewOpen(true);
  };

  const handleStartRoute = (routeId: string) => {
    navigate(`/route/${routeId}`);
  };

  const handlePanelRouteSelect = (route: BackendRoutePreview) => {
    setSelectedRoute(route);
    setIsPreviewOpen(true);
  };

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
        busPlate={busDetail?.placa || busId}
        isPanelOpen={isPanelOpen}
        onTogglePanel={() => setIsPanelOpen(!isPanelOpen)}
        showPanelToggle={!isMobile}
      />

      {/* Side Panel - Desktop/Tablet only */}
      {!isMobile && (
        <HomeSidePanel
          isOpen={isPanelOpen}
          onToggle={() => setIsPanelOpen(!isPanelOpen)}
          activeRoutes={filteredRoutes.activeRoutes}
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
              <p className="text-sm mt-1">Intenta buscar por nombre de ruta, bus o dirección</p>
            </CardContent>
          </Card>
        )}

        {/* Ruta Activa / Asignada */}
        {(!searchQuery || filteredRoutes.activeRoutes.length > 0) && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <PlayCircle className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Ruta Asignada</h2>
            </div>

            {filteredRoutes.activeRoutes.length > 0 ? (
              <div className="space-y-3">
                {filteredRoutes.activeRoutes.map((route) => (
                  <Card key={route.id} className="border-primary/50 bg-primary/5">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl">{route.nombre}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Clock className="w-4 h-4" />
                            {formatTime(route.horaInicio)} - {formatTime(route.horaFin)}
                          </CardDescription>
                        </div>
                        <Badge variant={getDirectionBadgeVariant(route.tipoRuta)}>
                          {getDirectionLabel(route.tipoRuta)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {(route.estudiantes || []).length} estudiantes
                        </span>
                        <span className="flex items-center gap-1">
                          <Bus className="w-4 h-4" />
                          {busDetail?.placa || route.busId.slice(0, 8)}
                        </span>
                      </div>
                      <Button 
                        className="w-full" 
                        size="lg"
                        onClick={() => handleStartRoute(route.id)}
                      >
                        <Route className="w-5 h-5 mr-2" />
                        Iniciar Ruta
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
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
              <h2 className="text-lg font-semibold">Rutas Programadas</h2>
            </div>

            {filteredRoutes.scheduledRoutes.length > 0 ? (
              <div className="space-y-3">
                {filteredRoutes.scheduledRoutes.map((route) => (
                  <Card key={route.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{route.nombre}</h3>
                            <Badge variant={getDirectionBadgeVariant(route.tipoRuta)} className="text-xs">
                              {getDirectionLabel(route.tipoRuta)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {formatTime(route.horaInicio)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" />
                              {(route.estudiantes || []).length}
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
              <h2 className="text-lg font-semibold">Rutas Completadas {getCurrentMonthName()}</h2>
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
                            <h3 className="font-medium text-muted-foreground">{route.nombre}</h3>
                            <Badge variant="outline" className="text-xs">
                              {getDirectionLabel(route.tipoRuta)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>
                              {formatTime(route.horaInicio)} - {formatTime(route.horaFin)}
                            </span>
                            <span>•</span>
                            <span>{(route.estudiantes || []).length} estudiantes</span>
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
            {selectedRoute?.estado === 'COMPLETED' ? (
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
              {selectedRoute?.nombre} - {selectedRoute && getDirectionLabel(selectedRoute.tipoRuta)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRoute && (
            <div className="space-y-4">
              {/* Route Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Horario</p>
                  <p className="font-medium">
                    {formatTime(selectedRoute.horaInicio)} - {formatTime(selectedRoute.horaFin)}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Bus</p>
                  <p className="font-medium">{busDetail?.placa || selectedRoute.busId.slice(0, 8)}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-primary/10 rounded-lg">
                  <Users className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <p className="text-lg font-bold">{(selectedRoute.estudiantes || []).length}</p>
                  <p className="text-xs text-muted-foreground">Estudiantes</p>
                </div>
                <div className="text-center p-3 bg-primary/10 rounded-lg">
                  <Clock className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <p className="text-lg font-bold">
                    {selectedRoute.estado === 'COMPLETED' ? '45' : '--'} min
                  </p>
                  <p className="text-xs text-muted-foreground">Duración</p>
                </div>
              </div>

              {/* Completed route specific info */}
              {selectedRoute.estado === 'COMPLETED' && (
                <div className="border-t pt-4 space-y-3">
                  <h4 className="font-medium text-sm">Resumen del Recorrido</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span>Ruta completada</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      <span>{selectedRoute.estudiantes.length} estudiantes</span>
                    </div>
                  </div>
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                    <p className="text-sm text-primary">
                      ✓ Ruta completada exitosamente
                    </p>
                  </div>
                </div>
              )}

              {/* Scheduled route specific info */}
              {selectedRoute.estado === 'PROGRAMMED' && (
                <div className="border-t pt-4 space-y-3">
                  <h4 className="font-medium text-sm">Información de la Ruta</h4>
                  <div className="bg-secondary border border-border rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">
                      ⏰ Esta ruta está programada para hoy. Estará disponible para iniciar a las {formatTime(selectedRoute.horaInicio)}.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Button for Active Route */}
              {selectedRoute.estado === 'ACTIVE' && (
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
