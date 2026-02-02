/**
 * Mock data para las rutas del conductor
 * Simula la respuesta de GET /api/driver/routes/today
 */

export interface DriverRoutePreview {
  id: string;
  name: string;
  direction: 'to_school' | 'from_school';
  status: 'not_started' | 'in_progress' | 'completed' | 'scheduled';
  estimatedStartTime: string;
  estimatedEndTime: string;
  actualStartTime?: string;
  actualEndTime?: string;
  stopsCount: number;
  studentsCount: number;
  studentsTransported?: number;
  busPlate: string;
  busId: string;
}

export interface DriverRoutesResponse {
  driverId: string;
  driverName: string;
  date: string;
  activeRoute: DriverRoutePreview | null;
  scheduledRoutes: DriverRoutePreview[];
  completedRoutes: DriverRoutePreview[];
}

// Simular fecha actual para la demo
const today = new Date().toISOString().split('T')[0];

export const MOCK_DRIVER_ROUTES: DriverRoutesResponse = {
  driverId: 'driver-001',
  driverName: 'Juan Pérez',
  date: today,
  
  // Ruta activa/asignada que puede iniciar ahora
  activeRoute: {
    id: 'route-morning-1',
    name: 'Ruta Norte - Mañana',
    direction: 'to_school',
    status: 'not_started',
    estimatedStartTime: '06:30',
    estimatedEndTime: '07:45',
    stopsCount: 8,
    studentsCount: 24,
    busPlate: 'ABC-123',
    busId: 'bus-001',
  },
  
  // Rutas programadas para más tarde
  scheduledRoutes: [
    {
      id: 'route-afternoon-1',
      name: 'Ruta Norte - Tarde',
      direction: 'from_school',
      status: 'scheduled',
      estimatedStartTime: '14:00',
      estimatedEndTime: '15:30',
      stopsCount: 8,
      studentsCount: 24,
      busPlate: 'ABC-123',
      busId: 'bus-001',
    },
    {
      id: 'route-afternoon-2',
      name: 'Ruta Sur - Tarde',
      direction: 'from_school',
      status: 'scheduled',
      estimatedStartTime: '15:45',
      estimatedEndTime: '17:00',
      stopsCount: 6,
      studentsCount: 18,
      busPlate: 'ABC-123',
      busId: 'bus-001',
    },
  ],
  
  // Rutas completadas hoy
  completedRoutes: [
    // Vacío para el ejemplo inicial, pero puede tener datos:
    // {
    //   id: 'route-morning-0',
    //   name: 'Ruta Sur - Mañana',
    //   direction: 'to_school',
    //   status: 'completed',
    //   estimatedStartTime: '05:30',
    //   estimatedEndTime: '06:15',
    //   actualStartTime: '05:32',
    //   actualEndTime: '06:18',
    //   stopsCount: 5,
    //   studentsCount: 15,
    //   studentsTransported: 14,
    //   busPlate: 'ABC-123',
    //   busId: 'bus-001',
    // },
  ],
};
