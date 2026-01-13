import { useState, useEffect, useCallback, useRef } from 'react';

interface GeofenceState {
  isNearStop: boolean;
  stopId: string | null;
  stopName: string | null;
  distanceToStop: number | null;
}

interface UseGeofencingResult {
  geofenceState: GeofenceState;
  hasArrivedAtStop: boolean;
  confirmedArrival: boolean;
  confirmArrival: () => void;
  dismissArrival: () => void;
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

// Geofence radius in meters (50 meters for arrival detection)
const ARRIVAL_RADIUS = 50;
// Approaching radius in meters (200 meters for "approaching" state)
const APPROACHING_RADIUS = 200;

export function useGeofencing(
  userLocation: [number, number] | null,
  currentStop: Stop | null,
  isNavigating: boolean,
  onAutoArrival?: (stopId: string, stopName: string) => void
): UseGeofencingResult {
  const [geofenceState, setGeofenceState] = useState<GeofenceState>({
    isNearStop: false,
    stopId: null,
    stopName: null,
    distanceToStop: null,
  });
  const [hasArrivedAtStop, setHasArrivedAtStop] = useState(false);
  const [confirmedArrival, setConfirmedArrival] = useState(false);
  const arrivedStopsRef = useRef<Set<string>>(new Set());
  const lastCheckRef = useRef<number>(0);

  const checkGeofence = useCallback(() => {
    if (!userLocation || !isNavigating || !currentStop) {
      setGeofenceState({
        isNearStop: false,
        stopId: null,
        stopName: null,
        distanceToStop: null,
      });
      return;
    }

    const now = Date.now();
    // Throttle checks to every 2 seconds for better responsiveness
    if (now - lastCheckRef.current < 2000) {
      return;
    }
    lastCheckRef.current = now;

    const distance = calculateDistance(userLocation, currentStop.coordinates);

    // Update geofence state
    setGeofenceState({
      isNearStop: distance <= APPROACHING_RADIUS,
      stopId: currentStop.id,
      stopName: currentStop.name,
      distanceToStop: Math.round(distance),
    });

    // Check if within arrival radius and not already confirmed for this stop
    if (distance <= ARRIVAL_RADIUS && !arrivedStopsRef.current.has(currentStop.id)) {
      setHasArrivedAtStop(true);
      // Trigger auto-arrival callback
      onAutoArrival?.(currentStop.id, currentStop.name);
    }
  }, [userLocation, currentStop, isNavigating, onAutoArrival]);

  useEffect(() => {
    if (!isNavigating) {
      setHasArrivedAtStop(false);
      setConfirmedArrival(false);
      return;
    }

    checkGeofence();
    const interval = setInterval(checkGeofence, 1000);
    return () => clearInterval(interval);
  }, [checkGeofence, isNavigating]);

  // Reset when current stop changes
  useEffect(() => {
    if (currentStop) {
      setHasArrivedAtStop(false);
      setConfirmedArrival(false);
    }
  }, [currentStop?.id]);

  // Reset arrived stops when navigation stops
  useEffect(() => {
    if (!isNavigating) {
      arrivedStopsRef.current.clear();
    }
  }, [isNavigating]);

  const confirmArrival = useCallback(() => {
    if (currentStop) {
      arrivedStopsRef.current.add(currentStop.id);
      setConfirmedArrival(true);
      setHasArrivedAtStop(false);
    }
  }, [currentStop]);

  const dismissArrival = useCallback(() => {
    setHasArrivedAtStop(false);
  }, []);

  return {
    geofenceState,
    hasArrivedAtStop,
    confirmedArrival,
    confirmArrival,
    dismissArrival,
  };
}
