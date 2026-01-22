import { RouteData, Stop } from '@/types/route';

// Coordenadas de ejemplo en Bogotá, Colombia
export const MOCK_STOPS: Stop[] = [
  {
    id: '1',
    name: 'Colegio Liceo cervantez',
    address: 'Cra 51B #87-99, San Vicente',
    coordinates: [-74.8318124, 11.0073157],
    students: [], // Punto de partida - sin estudiantes
    status: 'pending',
    isTerminal: true, // No modificable
  },
  {
    id: '2',
    name: 'Casa Familia Rodriguez',
    address: 'Calle 76 #45-87, Ciudad Jardin',
    coordinates: [-74.8247257, 10.9957874],
    students: [
      { id: 's3', name: 'Ana Rodríguez', status: 'waiting' },
      { id: 's4', name: 'Carlos López', status: 'waiting' },
      { id: 's5', name: 'Laura Martínez', status: 'waiting' },
    ],
    status: 'pending',
  },
  {
    id: '3',
    name: 'Casa Familia Hernandez',
    address: 'Cra. 59 #79-2',
    coordinates: [-74.8120105, 11.0090702],
    students: [
      { id: 's6', name: 'Diego Hernández', status: 'waiting' },
    ],
    status: 'pending',
  },
  {
    id: '4',
    name: 'Casa Familia Torres',
    address: 'Cra. 64B #86-2',
    coordinates: [-74.820099, 11.0153537],
    students: [
      { id: 's7', name: 'Sofía Torres', status: 'waiting' },
      { id: 's8', name: 'Andrés Castro', status: 'waiting' },
    ],
    status: 'pending',
  },
  {
    id: '5',
    name: 'Colegio Liceo cervantez',
    address: 'Cra 51B #87-99, San Vicente',
    coordinates: [-74.8318124, 11.0073157],
    students: [], // Punto de llegada - sin estudiantes
    status: 'pending',
    isTerminal: true, // No modificable
  },
];

export const MOCK_ROUTE: RouteData = {
  id: 'route-1',
  name: 'Ruta Norte AM',
  stops: MOCK_STOPS,
  startTime: '06:30',
  estimatedEndTime: '08:00',
  currentStopIndex: 0,
  status: 'not_started',
  direction: 'outbound', // Ruta de ida
};
