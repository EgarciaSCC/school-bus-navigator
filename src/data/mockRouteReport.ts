import { RouteReport, RouteReportPayload } from '@/types/routeReport';

// Example mock report for reference
export const MOCK_ROUTE_REPORT: RouteReport = {
  routeId: 'route-1',
  routeName: 'Ruta Norte AM',
  direction: 'outbound',
  
  startTime: new Date('2024-01-15T06:30:00'),
  endTime: new Date('2024-01-15T07:45:00'),
  totalDurationMinutes: 75,
  
  totalDistanceKm: 18.5,
  
  averageSpeedKmh: 24.5,
  maxSpeedKmh: 60,
  minSpeedKmh: 0,
  speedSamples: [
    { timestamp: new Date('2024-01-15T06:30:00'), speed: 0, coordinates: [-74.0608, 4.6351] },
    { timestamp: new Date('2024-01-15T06:35:00'), speed: 35, coordinates: [-74.0615, 4.6320] },
    { timestamp: new Date('2024-01-15T06:40:00'), speed: 28, coordinates: [-74.0621, 4.6297] },
  ],
  
  stopsCompleted: 5,
  totalStops: 5,
  stopCompletions: [
    { stopId: '1', stopName: 'Colegio San Rafael', arrivalTime: new Date('2024-01-15T06:30:00'), studentsProcessed: 0 },
    { stopId: '2', stopName: 'Parada Parque Nacional', arrivalTime: new Date('2024-01-15T06:45:00'), studentsProcessed: 3 },
    { stopId: '3', stopName: 'Parada Calle 26', arrivalTime: new Date('2024-01-15T07:00:00'), studentsProcessed: 1 },
    { stopId: '4', stopName: 'Centro Comercial Gran Estación', arrivalTime: new Date('2024-01-15T07:20:00'), studentsProcessed: 2 },
    { stopId: '5', stopName: 'Terminal Norte', arrivalTime: new Date('2024-01-15T07:45:00'), studentsProcessed: 0 },
  ],
  
  studentsTotal: 6,
  studentsPicked: 5,
  studentsDropped: 0,
  studentsAbsent: 1,
  studentActions: [
    { studentId: 's3', studentName: 'Ana Rodríguez', stopId: '2', stopName: 'Parada Parque Nacional', action: 'picked', timestamp: new Date('2024-01-15T06:46:00'), coordinates: [-74.0621, 4.6297] },
    { studentId: 's4', studentName: 'Carlos López', stopId: '2', stopName: 'Parada Parque Nacional', action: 'picked', timestamp: new Date('2024-01-15T06:47:00'), coordinates: [-74.0621, 4.6297] },
    { studentId: 's5', studentName: 'Laura Martínez', stopId: '2', stopName: 'Parada Parque Nacional', action: 'absent', timestamp: new Date('2024-01-15T06:48:00'), coordinates: [-74.0621, 4.6297] },
    { studentId: 's6', studentName: 'Diego Hernández', stopId: '3', stopName: 'Parada Calle 26', action: 'picked', timestamp: new Date('2024-01-15T07:01:00'), coordinates: [-74.0635, 4.6245] },
    { studentId: 's7', studentName: 'Sofía Torres', stopId: '4', stopName: 'Centro Comercial Gran Estación', action: 'picked', timestamp: new Date('2024-01-15T07:21:00'), coordinates: [-74.0889, 4.6477] },
    { studentId: 's8', studentName: 'Andrés Castro', stopId: '4', stopName: 'Centro Comercial Gran Estación', action: 'picked', timestamp: new Date('2024-01-15T07:22:00'), coordinates: [-74.0889, 4.6477] },
  ],
  
  incidentsReported: 0,
  
  generatedAt: new Date('2024-01-15T07:45:30'),
};

export const MOCK_REPORT_PAYLOAD: RouteReportPayload = {
  report: MOCK_ROUTE_REPORT,
  metadata: {
    appVersion: '1.0.0',
    deviceInfo: 'Chrome/120.0.0.0',
    submittedAt: new Date('2024-01-15T07:45:35'),
  },
};

// Simulated API endpoint for route reports
export const ROUTE_REPORT_API_ENDPOINT = 'https://api.ncatransporte.com/v1/routes/reports';
