import { useMemo, useCallback } from 'react';

interface SnappedPosition {
  snappedLocation: [number, number];
  distanceToRoute: number; // in meters
  isOnRoute: boolean;
}

// Maximum distance from route to snap (in meters)
const SNAP_THRESHOLD_METERS = 50;

/**
 * Hook to snap GPS coordinates to the nearest point on a route line.
 * This improves the visual accuracy of the bus position on the map.
 */
export const useSnapToRoute = (routeCoordinates: [number, number][]) => {
  
  // Convert degrees to radians
  const toRad = (deg: number) => deg * (Math.PI / 180);
  
  // Convert radians to degrees
  const toDeg = (rad: number) => rad * (180 / Math.PI);
  
  // Calculate distance between two points using Haversine formula (returns meters)
  const haversineDistance = useCallback((
    point1: [number, number], 
    point2: [number, number]
  ): number => {
    const R = 6371000; // Earth radius in meters
    const lat1 = toRad(point1[1]);
    const lat2 = toRad(point2[1]);
    const deltaLat = toRad(point2[1] - point1[1]);
    const deltaLon = toRad(point2[0] - point1[0]);
    
    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  }, []);
  
  // Find the closest point on a line segment to a given point
  const closestPointOnSegment = useCallback((
    point: [number, number],
    segmentStart: [number, number],
    segmentEnd: [number, number]
  ): [number, number] => {
    const [px, py] = point;
    const [ax, ay] = segmentStart;
    const [bx, by] = segmentEnd;
    
    const abx = bx - ax;
    const aby = by - ay;
    const apx = px - ax;
    const apy = py - ay;
    
    const abSquared = abx * abx + aby * aby;
    
    if (abSquared === 0) {
      // Segment is a point
      return segmentStart;
    }
    
    // Project point onto line, clamping to segment
    let t = (apx * abx + apy * aby) / abSquared;
    t = Math.max(0, Math.min(1, t));
    
    return [ax + t * abx, ay + t * aby];
  }, []);
  
  // Snap a location to the route
  const snapToRoute = useCallback((
    location: [number, number] | null
  ): SnappedPosition | null => {
    if (!location || routeCoordinates.length < 2) {
      return null;
    }
    
    let closestPoint: [number, number] = location;
    let minDistance = Infinity;
    
    // Find the closest point on any segment of the route
    for (let i = 0; i < routeCoordinates.length - 1; i++) {
      const segmentStart = routeCoordinates[i];
      const segmentEnd = routeCoordinates[i + 1];
      
      const pointOnSegment = closestPointOnSegment(location, segmentStart, segmentEnd);
      const distance = haversineDistance(location, pointOnSegment);
      
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = pointOnSegment;
      }
    }
    
    // Only snap if within threshold
    const isOnRoute = minDistance <= SNAP_THRESHOLD_METERS;
    
    return {
      snappedLocation: isOnRoute ? closestPoint : location,
      distanceToRoute: minDistance,
      isOnRoute,
    };
  }, [routeCoordinates, closestPointOnSegment, haversineDistance]);
  
  return {
    snapToRoute,
    hasRoute: routeCoordinates.length >= 2,
  };
};
