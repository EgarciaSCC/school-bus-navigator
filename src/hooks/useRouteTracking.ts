import { useState, useCallback, useRef, useEffect } from 'react';
import { RouteData, Stop, Student } from '@/types/route';
import { RouteReport, SpeedSample, StudentAction, StopCompletion, RouteReportPayload } from '@/types/routeReport';
import { ROUTE_REPORT_API_ENDPOINT } from '@/data/mockRouteReport';

interface UseRouteTrackingProps {
  route: RouteData;
  coordinates: [number, number] | null;
  speed: number | null;
  isNavigating: boolean;
}

interface UseRouteTrackingReturn {
  startTracking: () => void;
  stopTracking: () => RouteReport | null;
  recordSpeedSample: () => void;
  recordStudentAction: (student: Student, stop: Stop, action: 'picked' | 'dropped' | 'absent') => void;
  recordStopCompletion: (stop: Stop) => void;
  recordIncident: () => void;
  submitReport: (report: RouteReport) => Promise<boolean>;
  totalDistanceKm: number;
  averageSpeedKmh: number;
}

export const useRouteTracking = ({
  route,
  coordinates,
  speed,
  isNavigating,
}: UseRouteTrackingProps): UseRouteTrackingReturn => {
  const [totalDistanceKm, setTotalDistanceKm] = useState(0);
  const [averageSpeedKmh, setAverageSpeedKmh] = useState(0);
  
  const startTimeRef = useRef<Date | null>(null);
  const lastCoordinatesRef = useRef<[number, number] | null>(null);
  const speedSamplesRef = useRef<SpeedSample[]>([]);
  const studentActionsRef = useRef<StudentAction[]>([]);
  const stopCompletionsRef = useRef<StopCompletion[]>([]);
  const incidentCountRef = useRef(0);
  const isTrackingRef = useRef(false);

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = useCallback((coord1: [number, number], coord2: [number, number]): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (coord2[1] - coord1[1]) * Math.PI / 180;
    const dLon = (coord2[0] - coord1[0]) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(coord1[1] * Math.PI / 180) * Math.cos(coord2[1] * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  // Start tracking
  const startTracking = useCallback(() => {
    startTimeRef.current = new Date();
    lastCoordinatesRef.current = coordinates;
    speedSamplesRef.current = [];
    studentActionsRef.current = [];
    stopCompletionsRef.current = [];
    incidentCountRef.current = 0;
    isTrackingRef.current = true;
    setTotalDistanceKm(0);
    setAverageSpeedKmh(0);
  }, [coordinates]);

  // Record speed sample (called periodically)
  const recordSpeedSample = useCallback(() => {
    if (!isTrackingRef.current || !coordinates || speed === null) return;

    speedSamplesRef.current.push({
      timestamp: new Date(),
      speed: speed,
      coordinates: coordinates,
    });

    // Update distance
    if (lastCoordinatesRef.current) {
      const distance = calculateDistance(lastCoordinatesRef.current, coordinates);
      if (distance < 0.5) { // Only add if reasonable (< 500m between samples)
        setTotalDistanceKm(prev => prev + distance);
      }
    }
    lastCoordinatesRef.current = coordinates;

    // Update average speed
    const samples = speedSamplesRef.current;
    if (samples.length > 0) {
      const validSpeeds = samples.filter(s => s.speed > 0).map(s => s.speed);
      if (validSpeeds.length > 0) {
        const avg = validSpeeds.reduce((a, b) => a + b, 0) / validSpeeds.length;
        setAverageSpeedKmh(Math.round(avg * 10) / 10);
      }
    }
  }, [coordinates, speed, calculateDistance]);

  // Periodic speed sampling while navigating
  useEffect(() => {
    if (!isNavigating || !isTrackingRef.current) return;

    const interval = setInterval(() => {
      recordSpeedSample();
    }, 5000); // Sample every 5 seconds

    return () => clearInterval(interval);
  }, [isNavigating, recordSpeedSample]);

  // Record student action
  const recordStudentAction = useCallback((student: Student, stop: Stop, action: 'picked' | 'dropped' | 'absent') => {
    if (!isTrackingRef.current) return;

    studentActionsRef.current.push({
      studentId: student.id,
      studentName: student.name,
      stopId: stop.id,
      stopName: stop.name,
      action,
      timestamp: new Date(),
      coordinates: coordinates || stop.coordinates,
    });
  }, [coordinates]);

  // Record stop completion
  const recordStopCompletion = useCallback((stop: Stop) => {
    if (!isTrackingRef.current) return;

    stopCompletionsRef.current.push({
      stopId: stop.id,
      stopName: stop.name,
      arrivalTime: new Date(),
      studentsProcessed: stop.students.length,
    });
  }, []);

  // Record incident
  const recordIncident = useCallback(() => {
    if (!isTrackingRef.current) return;
    incidentCountRef.current += 1;
  }, []);

  // Stop tracking and generate report
  const stopTracking = useCallback((): RouteReport | null => {
    if (!startTimeRef.current) return null;

    const endTime = new Date();
    const durationMs = endTime.getTime() - startTimeRef.current.getTime();
    const durationMinutes = Math.round(durationMs / 60000);

    const samples = speedSamplesRef.current;
    const validSpeeds = samples.filter(s => s.speed > 0).map(s => s.speed);
    
    // Calculate student stats from route data
    let studentsPicked = 0;
    let studentsDropped = 0;
    let studentsAbsent = 0;
    let studentsTotal = 0;

    route.stops.forEach(stop => {
      stop.students.forEach(student => {
        studentsTotal++;
        if (student.status === 'picked') studentsPicked++;
        else if (student.status === 'dropped') studentsDropped++;
        else if (student.status === 'absent') studentsAbsent++;
      });
    });

    const report: RouteReport = {
      routeId: route.id,
      routeName: route.name,
      direction: route.direction,
      
      startTime: startTimeRef.current,
      endTime,
      totalDurationMinutes: durationMinutes,
      
      totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
      
      averageSpeedKmh: validSpeeds.length > 0 
        ? Math.round((validSpeeds.reduce((a, b) => a + b, 0) / validSpeeds.length) * 10) / 10
        : 0,
      maxSpeedKmh: validSpeeds.length > 0 ? Math.max(...validSpeeds) : 0,
      minSpeedKmh: validSpeeds.length > 0 ? Math.min(...validSpeeds) : 0,
      speedSamples: samples,
      
      stopsCompleted: stopCompletionsRef.current.length,
      totalStops: route.stops.length,
      stopCompletions: stopCompletionsRef.current,
      
      studentsTotal,
      studentsPicked,
      studentsDropped,
      studentsAbsent,
      studentActions: studentActionsRef.current,
      
      incidentsReported: incidentCountRef.current,
      
      generatedAt: new Date(),
    };

    isTrackingRef.current = false;
    return report;
  }, [route, totalDistanceKm]);

  // Submit report to API (simulated)
  const submitReport = useCallback(async (report: RouteReport): Promise<boolean> => {
    const payload: RouteReportPayload = {
      report,
      metadata: {
        appVersion: '1.0.0',
        deviceInfo: navigator.userAgent,
        submittedAt: new Date(),
      },
    };

    console.log('📤 Submitting route report to API:', ROUTE_REPORT_API_ENDPOINT);
    console.log('📦 Payload:', JSON.stringify(payload, null, 2));

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    console.log('✅ Route report submitted successfully');
    return true;
  }, []);

  return {
    startTracking,
    stopTracking,
    recordSpeedSample,
    recordStudentAction,
    recordStopCompletion,
    recordIncident,
    submitReport,
    totalDistanceKm,
    averageSpeedKmh,
  };
};
