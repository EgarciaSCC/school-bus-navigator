export interface Stop {
  id: string;
  name: string;
  address: string;
  coordinates: [number, number];
  students: Student[];
  status: 'pending' | 'active' | 'completed';
  completedAt?: Date;
  isTerminal?: boolean; // True for start and end points (not modifiable, no student pickup)
}

export interface Student {
  id: string;
  name: string;
  status: 'waiting' | 'picked' | 'dropped' | 'absent';
}

export interface RouteData {
  id: string;
  name: string;
  stops: Stop[];
  startTime: string;
  estimatedEndTime: string;
  currentStopIndex: number;
  status: 'not_started' | 'in_progress' | 'completed';
  direction: 'outbound' | 'return'; // ida o regreso
}

export type IncidentType = 
  | 'high_traffic'
  | 'road_closed'
  | 'breakdown'
  | 'weather'
  | 'custom'
  | 'stop_completed'
  | 'student_picked'
  | 'student_dropped'
  | 'route_finished';

export interface Incident {
  id: string;
  type: IncidentType;
  description: string;
  timestamp: Date;
  location?: [number, number];
}

export const INCIDENT_CONFIG: Record<IncidentType, { label: string; icon: string; color: string }> = {
  high_traffic: { label: 'Tráfico Alto', icon: 'AlertTriangle', color: 'yellow' },
  road_closed: { label: 'Vía Cerrada', icon: 'XCircle', color: 'red' },
  breakdown: { label: 'Bus Averiado', icon: 'Wrench', color: 'grey' },
  weather: { label: 'Clima Adverso', icon: 'CloudRain', color: 'blue' },
  custom: { label: 'Novedad Personalizada', icon: 'MessageSquare', color: 'purple' },
  stop_completed: { label: 'Parada Completada', icon: 'CheckCircle', color: 'green' },
  student_picked: { label: 'Estudiante Recogido', icon: 'UserPlus', color: 'green' },
  student_dropped: { label: 'Estudiante Dejado', icon: 'UserMinus', color: 'blue' },
  route_finished: { label: 'Ruta Finalizada', icon: 'Flag', color: 'purple' },
};
