import { useState, useEffect, useCallback, useRef } from 'react';

interface UseRouteDeviationResult {
  isOffRoute: boolean;
  distanceFromRoute: number;
  isRecalculating: boolean;
}

// Calculate perpendicular distance from a point to a line segment
function pointToSegmentDistance(
  point: [number, number],
  lineStart: [number, number],
  lineEnd: [number, number]
): number {
  const [px, py] = point;
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;

  const dx = x2 - x1;
  const dy = y2 - y1;

  if (dx === 0 && dy === 0) {
    // Segment is a point
    return haversineDistance(point, lineStart);
  }

  // Calculate projection parameter
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));

  // Find nearest point on segment
  const nearestPoint: [number, number] = [x1 + t * dx, y1 + t * dy];

  return haversineDistance(point, nearestPoint);
}

// Haversine formula for distance in meters
function haversineDistance(coord1: [number, number], coord2: [number, number]): number {
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

// Find minimum distance from point to route polyline
function distanceToRoute(
  point: [number, number],
  routeCoordinates: [number, number][]
): number {
  if (routeCoordinates.length < 2) return Infinity;

  let minDistance = Infinity;

  for (let i = 0; i < routeCoordinates.length - 1; i++) {
    const distance = pointToSegmentDistance(
      point,
      routeCoordinates[i],
      routeCoordinates[i + 1]
    );
    if (distance < minDistance) {
      minDistance = distance;
    }
  }

  return minDistance;
}

const OFF_ROUTE_THRESHOLD = 50; // meters - trigger recalculation
const RECALCULATION_COOLDOWN = 10000; // 10 seconds between recalculations

export function useRouteDeviation(
  userLocation: [number, number] | null,
  routeCoordinates: [number, number][] | null,
  isNavigating: boolean,
  remainingStops: [number, number][],
  onRecalculate: (waypoints: [number, number][]) => Promise<void>
): UseRouteDeviationResult {
  const [isOffRoute, setIsOffRoute] = useState(false);
  const [distanceFromRoute, setDistanceFromRoute] = useState(0);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const lastRecalculationTime = useRef<number>(0);

  const checkDeviation = useCallback(() => {
    if (!userLocation || !routeCoordinates || routeCoordinates.length < 2 || !isNavigating) {
      setIsOffRoute(false);
      setDistanceFromRoute(0);
      return;
    }

    const distance = distanceToRoute(userLocation, routeCoordinates);
    setDistanceFromRoute(Math.round(distance));

    const now = Date.now();
    const timeSinceLastRecalc = now - lastRecalculationTime.current;

    if (distance > OFF_ROUTE_THRESHOLD && timeSinceLastRecalc > RECALCULATION_COOLDOWN) {
      setIsOffRoute(true);
    } else if (distance <= OFF_ROUTE_THRESHOLD * 0.5) {
      // Back on route - use hysteresis to avoid flapping
      setIsOffRoute(false);
    }
  }, [userLocation, routeCoordinates, isNavigating]);

  // Check deviation every 2 seconds
  useEffect(() => {
    checkDeviation();
    const interval = setInterval(checkDeviation, 2000);
    return () => clearInterval(interval);
  }, [checkDeviation]);

  // Trigger recalculation when off-route
  useEffect(() => {
    if (!isOffRoute || isRecalculating || !userLocation || remainingStops.length === 0) {
      return;
    }

    const now = Date.now();
    if (now - lastRecalculationTime.current < RECALCULATION_COOLDOWN) {
      return;
    }

    const recalculate = async () => {
      setIsRecalculating(true);
      lastRecalculationTime.current = Date.now();

      try {
        // Create new waypoints: current location + remaining stops
        const newWaypoints: [number, number][] = [userLocation, ...remainingStops];
        await onRecalculate(newWaypoints);
      } finally {
        setIsRecalculating(false);
        setIsOffRoute(false);
      }
    };

    recalculate();
  }, [isOffRoute, isRecalculating, userLocation, remainingStops, onRecalculate]);

  return {
    isOffRoute,
    distanceFromRoute,
    isRecalculating,
  };
}
