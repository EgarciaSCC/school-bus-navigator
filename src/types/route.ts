export interface Stop {
  id: string;
  name: string;
  address: string;
  coordinates: [number, number];
  students: Student[];
  status: 'pending' | 'active' | 'completed';
  completedAt?: Date;
}

export interface Student {
  id: string;
  name: string;
  status: 'waiting' | 'picked' | 'dropped';
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
  | 'forced_detour'
  | 'breakdown'
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
  forced_detour: { label: 'Desvío Forzoso', icon: 'GitBranch', color: 'purple' },
  breakdown: { label: 'Avería', icon: 'Wrench', color: 'grey' },
  stop_completed: { label: 'Parada Completada', icon: 'CheckCircle', color: 'green' },
  student_picked: { label: 'Estudiante Recogido', icon: 'UserPlus', color: 'green' },
  student_dropped: { label: 'Estudiante Dejado', icon: 'UserMinus', color: 'blue' },
  route_finished: { label: 'Ruta Finalizada', icon: 'Flag', color: 'purple' },
};
