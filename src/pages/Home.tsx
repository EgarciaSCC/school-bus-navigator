import React, { useState, useEffect } from 'react';
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
  LogOut,
  FileText,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import logoNCA from '@/assets/isotipo-NCA.png';

const Home = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [driverRoutes, setDriverRoutes] = useState<DriverRoutesTodayResponse | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<DriverRoutePreview | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

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

  const handleViewRoutePreview = (route: DriverRoutePreview) => {
    setSelectedRoute(route);
    setIsPreviewOpen(true);
  };

  const handleStartRoute = (routeId: string) => {
    // Navegar a la página de navegación con la ruta seleccionada
    navigate(`/route/${routeId}`);
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
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoNCA} alt="NCA Logo" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="text-lg font-semibold text-foreground">NCA Transporte</h1>
              <p className="text-sm text-muted-foreground">Hola, {user?.name || 'Conductor'}</p>
            </div>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <LogOut className="w-5 h-5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Cerrar sesión?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se cerrará tu sesión actual y deberás iniciar sesión nuevamente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => logout()}>Cerrar Sesión</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Ruta Activa / Asignada */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <PlayCircle className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Ruta Asignada</h2>
          </div>

          {driverRoutes?.activeRoute ? (
            <Card className="border-primary/50 bg-primary/5">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{driverRoutes.activeRoute.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Clock className="w-4 h-4" />
                      {formatTime(driverRoutes.activeRoute.estimatedStartTime)} - {formatTime(driverRoutes.activeRoute.estimatedEndTime)}
                    </CardDescription>
                  </div>
                  <Badge variant={getDirectionBadgeVariant(driverRoutes.activeRoute.direction)}>
                    {getDirectionLabel(driverRoutes.activeRoute.direction)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {driverRoutes.activeRoute.stopsCount} paradas
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {driverRoutes.activeRoute.studentsCount} estudiantes
                  </span>
                  <span className="flex items-center gap-1">
                    <Bus className="w-4 h-4" />
                    {driverRoutes.activeRoute.busPlate}
                  </span>
                </div>
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => handleStartRoute(driverRoutes.activeRoute!.id)}
                >
                  <Route className="w-5 h-5 mr-2" />
                  Iniciar Ruta
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-muted-foreground">
                <Bus className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No tienes rutas asignadas para este momento</p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Rutas Programadas */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Rutas Programadas Hoy</h2>
          </div>

          {(driverRoutes?.scheduledRoutes?.length ?? 0) > 0 ? (
            <div className="space-y-3">
              {driverRoutes?.scheduledRoutes?.map((route) => (
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
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-6 text-center text-muted-foreground">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay más rutas programadas para hoy</p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Rutas Completadas */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Rutas Completadas Hoy</h2>
            {(driverRoutes?.completedRoutes?.length ?? 0) > 0 && (
              <Badge variant="outline" className="ml-auto">
                {driverRoutes?.completedRoutes?.length} completadas
              </Badge>
            )}
          </div>

          {(driverRoutes?.completedRoutes?.length ?? 0) > 0 ? (
            <div className="space-y-3">
              {driverRoutes?.completedRoutes?.map((route) => (
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
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-6 text-center text-muted-foreground">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aún no has completado rutas hoy</p>
              </CardContent>
            </Card>
          )}
        </section>
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Home;
