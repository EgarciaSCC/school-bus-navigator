import { useState, useEffect, useCallback, useRef } from 'react';

interface ProximityAlert {
  stopId: string;
  stopName: string;
  distance: number;
  etaMinutes: number;
  triggered: boolean;
}

interface UseProximityAlertsResult {
  currentAlert: ProximityAlert | null;
  notificationsSent: string[]; // stop IDs that have been notified
}

// Haversine formula to calculate distance between two coordinates in meters
function calculateDistance(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const R = 6371000; // Earth's radius in meters
  const lat1 = (coord1[1] * Math.PI) / 180;
  const lat2 = (coord2[1] * Math.PI) / 180;
  const deltaLat = ((coord2[1] - coord1[1]) * Math.PI) / 180;
  const deltaLon = ((coord2[0] - coord1[0]) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

interface Stop {
  id: string;
  name: string;
  coordinates: [number, number];
}

const PROXIMITY_THRESHOLD = 5000; // 5 km in meters

export function useProximityAlerts(
  userLocation: [number, number] | null,
  currentSpeed: number | null,
  stops: Stop[],
  currentStopIndex: number,
  isNavigating: boolean,
  onNotificationSent?: (stopName: string, distance: number, eta: number) => void
): UseProximityAlertsResult {
  const [currentAlert, setCurrentAlert] = useState<ProximityAlert | null>(null);
  const [notificationsSent, setNotificationsSent] = useState<string[]>([]);
  const lastCheckRef = useRef<number>(0);

  const checkProximity = useCallback(() => {
    if (!userLocation || !isNavigating || stops.length === 0) {
      return;
    }

    const now = Date.now();
    // Throttle checks to every 10 seconds
    if (now - lastCheckRef.current < 10000) {
      return;
    }
    lastCheckRef.current = now;

    const nextStop = stops[currentStopIndex];
    if (!nextStop) return;

    const distance = calculateDistance(userLocation, nextStop.coordinates);
    
    // Check if within 5km and not already notified
    if (distance <= PROXIMITY_THRESHOLD && !notificationsSent.includes(nextStop.id)) {
      // Calculate ETA
      const speed = currentSpeed && currentSpeed > 0.5 ? currentSpeed : 8.33; // default 30 km/h
      const etaSeconds = distance / speed;
      const etaMinutes = Math.round(etaSeconds / 60);

      const alert: ProximityAlert = {
        stopId: nextStop.id,
        stopName: nextStop.name,
        distance: Math.round(distance),
        etaMinutes,
        triggered: true,
      };

      setCurrentAlert(alert);
      setNotificationsSent(prev => [...prev, nextStop.id]);

      // Trigger callback to show notification
      onNotificationSent?.(nextStop.name, Math.round(distance), etaMinutes);
    }
  }, [userLocation, currentSpeed, stops, currentStopIndex, isNavigating, notificationsSent, onNotificationSent]);

  useEffect(() => {
    if (!isNavigating) {
      setCurrentAlert(null);
      return;
    }

    checkProximity();
    const interval = setInterval(checkProximity, 5000);
    return () => clearInterval(interval);
  }, [checkProximity, isNavigating]);

  // Reset notifications when route restarts
  useEffect(() => {
    if (!isNavigating) {
      setNotificationsSent([]);
    }
  }, [isNavigating]);

  return {
    currentAlert,
    notificationsSent,
  };
}
