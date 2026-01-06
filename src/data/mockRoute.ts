import { RouteData, Stop } from '@/types/route';

// Coordenadas de ejemplo en Bogotá, Colombia
export const MOCK_STOPS: Stop[] = [
  {
    id: '1',
    name: 'Colegio San Rafael',
    address: 'Cra 7 #45-10, Chapinero',
    coordinates: [-74.0608, 4.6351],
    students: [
      { id: 's1', name: 'María García', status: 'waiting' },
      { id: 's2', name: 'Juan Pérez', status: 'waiting' },
    ],
    status: 'pending',
  },
  {
    id: '2',
    name: 'Parada Parque Nacional',
    address: 'Cra 7 #36-20',
    coordinates: [-74.0621, 4.6297],
    students: [
      { id: 's3', name: 'Ana Rodríguez', status: 'waiting' },
      { id: 's4', name: 'Carlos López', status: 'waiting' },
      { id: 's5', name: 'Laura Martínez', status: 'waiting' },
    ],
    status: 'pending',
  },
  {
    id: '3',
    name: 'Parada Calle 26',
    address: 'Cra 7 #26-05',
    coordinates: [-74.0635, 4.6245],
    students: [
      { id: 's6', name: 'Diego Hernández', status: 'waiting' },
    ],
    status: 'pending',
  },
  {
    id: '4',
    name: 'Centro Comercial Gran Estación',
    address: 'Av. Calle 26 #62-47',
    coordinates: [-74.0889, 4.6477],
    students: [
      { id: 's7', name: 'Sofía Torres', status: 'waiting' },
      { id: 's8', name: 'Andrés Castro', status: 'waiting' },
    ],
    status: 'pending',
  },
  {
    id: '5',
    name: 'Terminal Norte',
    address: 'Autopista Norte #175-50',
    coordinates: [-74.0521, 4.7542],
    students: [
      { id: 's9', name: 'Valentina Ruiz', status: 'waiting' },
      { id: 's10', name: 'Mateo Gómez', status: 'waiting' },
      { id: 's11', name: 'Isabella Díaz', status: 'waiting' },
    ],
    status: 'pending',
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
};
