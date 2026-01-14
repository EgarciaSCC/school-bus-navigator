export interface SpeedSample {
  timestamp: Date;
  speed: number; // km/h
  coordinates: [number, number];
}

export interface StudentAction {
  studentId: string;
  studentName: string;
  stopId: string;
  stopName: string;
  action: 'picked' | 'dropped' | 'absent';
  timestamp: Date;
  coordinates: [number, number];
}

export interface StopCompletion {
  stopId: string;
  stopName: string;
  arrivalTime: Date;
  departureTime?: Date;
  studentsProcessed: number;
}

export interface RouteReport {
  routeId: string;
  routeName: string;
  direction: 'outbound' | 'return';
  
  // Timing
  startTime: Date;
  endTime: Date;
  totalDurationMinutes: number;
  
  // Distance
  totalDistanceKm: number;
  
  // Speed metrics
  averageSpeedKmh: number;
  maxSpeedKmh: number;
  minSpeedKmh: number;
  speedSamples: SpeedSample[];
  
  // Stops
  stopsCompleted: number;
  totalStops: number;
  stopCompletions: StopCompletion[];
  
  // Students
  studentsTotal: number;
  studentsPicked: number;
  studentsDropped: number;
  studentsAbsent: number;
  studentActions: StudentAction[];
  
  // Incidents
  incidentsReported: number;
  
  // Metadata
  generatedAt: Date;
  driverNotes?: string;
}

// Mock report structure for API submission
export interface RouteReportPayload {
  report: RouteReport;
  metadata: {
    appVersion: string;
    deviceInfo?: string;
    submittedAt: Date;
  };
}
