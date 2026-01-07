import { useState, useEffect, useCallback } from 'react';

interface StopETA {
  stopId: string;
  distanceRemaining: number; // in meters
  etaMinutes: number | null; // in minutes
  etaTime: Date | null;
}

interface UseETACalculationResult {
  stopETAs: StopETA[];
  nextStopETA: StopETA | null;
  totalDistanceRemaining: number;
  totalETAMinutes: number | null;
}

// Haversine formula to calculate distance between two coordinates
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
  coordinates: [number, number];
  status: string;
}

export function useETACalculation(
  userLocation: [number, number] | null,
  currentSpeed: number | null,
  stops: Stop[],
  currentStopIndex: number
): UseETACalculationResult {
  const [stopETAs, setStopETAs] = useState<StopETA[]>([]);

  const calculateETAs = useCallback(() => {
    if (!userLocation) {
      return [];
    }

    // Use current speed or default to average urban speed (30 km/h = 8.33 m/s)
    const speed = currentSpeed && currentSpeed > 0.5 ? currentSpeed : 8.33;

    const etas: StopETA[] = [];
    let cumulativeDistance = 0;
    let previousCoord = userLocation;

    stops.forEach((stop, index) => {
      if (index < currentStopIndex) {
        // Already passed stops
        etas.push({
          stopId: stop.id,
          distanceRemaining: 0,
          etaMinutes: null,
          etaTime: null,
        });
        return;
      }

      // Calculate distance from previous point to this stop
      const distance = calculateDistance(previousCoord, stop.coordinates);
      cumulativeDistance += distance;

      // Calculate ETA in minutes based on current speed
      const etaSeconds = cumulativeDistance / speed;
      const etaMinutes = Math.round(etaSeconds / 60);

      // Calculate actual arrival time
      const etaTime = new Date();
      etaTime.setSeconds(etaTime.getSeconds() + etaSeconds);

      etas.push({
        stopId: stop.id,
        distanceRemaining: Math.round(cumulativeDistance),
        etaMinutes,
        etaTime,
      });

      previousCoord = stop.coordinates;
    });

    return etas;
  }, [userLocation, currentSpeed, stops, currentStopIndex]);

  useEffect(() => {
    const etas = calculateETAs();
    setStopETAs(etas);
  }, [calculateETAs]);

  // Recalculate every 5 seconds for more responsive updates
  useEffect(() => {
    const interval = setInterval(() => {
      const etas = calculateETAs();
      setStopETAs(etas);
    }, 5000);

    return () => clearInterval(interval);
  }, [calculateETAs]);

  const nextStopETA = stopETAs.find((eta, index) => index >= currentStopIndex) || null;
  
  const totalDistanceRemaining = stopETAs.reduce((sum, eta) => {
    return eta.distanceRemaining > 0 ? eta.distanceRemaining : sum;
  }, 0);

  // Get ETA to last stop
  const lastStopETA = stopETAs[stopETAs.length - 1];
  const totalETAMinutes = lastStopETA?.etaMinutes ?? null;

  return {
    stopETAs,
    nextStopETA,
    totalDistanceRemaining,
    totalETAMinutes,
  };
}
