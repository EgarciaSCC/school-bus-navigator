import { useState, useEffect, useCallback, useRef } from 'react';
import { MAPBOX_TOKEN } from '@/config/mapbox';

interface StopETA {
  stopId: string;
  distanceRemaining: number; // in meters
  etaMinutes: number | null; // in minutes
  etaTime: Date | null;
}

interface Stop {
  id: string;
  coordinates: [number, number];
  status: string;
}

interface UseSmartETAResult {
  stopETAs: StopETA[];
  nextStopETA: StopETA | null;
  totalDistanceRemaining: number;
  totalETAMinutes: number | null;
  isUpdating: boolean;
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

export function useSmartETA(
  userLocation: [number, number] | null,
  stops: Stop[],
  currentStopIndex: number,
  isNavigating: boolean,
  isOffRoute: boolean
): UseSmartETAResult {
  const [stopETAs, setStopETAs] = useState<StopETA[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Track conditions for updates
  const lastUpdateTimeRef = useRef<number>(0);
  const lastUpdateLocationRef = useRef<[number, number] | null>(null);
  const wasOffRouteRef = useRef(false);

  // Fetch ETAs from Mapbox Directions API
  const fetchMapboxETAs = useCallback(async (
    origin: [number, number],
    remainingStops: Stop[]
  ): Promise<StopETA[]> => {
    if (remainingStops.length === 0) return [];

    const waypoints = [origin, ...remainingStops.map(s => s.coordinates)];
    const coordinates = waypoints.map(wp => wp.join(',')).join(';');
    
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?` +
      `geometries=geojson&` +
      `overview=full&` +
      `annotations=duration,distance&` +
      `access_token=${MAPBOX_TOKEN}`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('API error');
      
      const data = await response.json();
      
      if (!data.routes || data.routes.length === 0) {
        throw new Error('No route found');
      }

      const route = data.routes[0];
      const legs = route.legs || [];
      
      const etas: StopETA[] = [];
      let cumulativeDistance = 0;
      let cumulativeDuration = 0;

      remainingStops.forEach((stop, index) => {
        const leg = legs[index];
        if (leg) {
          cumulativeDistance += leg.distance || 0;
          cumulativeDuration += leg.duration || 0;
        }

        const etaTime = new Date();
        etaTime.setSeconds(etaTime.getSeconds() + cumulativeDuration);

        etas.push({
          stopId: stop.id,
          distanceRemaining: Math.round(cumulativeDistance),
          etaMinutes: Math.round(cumulativeDuration / 60),
          etaTime,
        });
      });

      return etas;
    } catch (error) {
      console.error('Error fetching Mapbox ETAs:', error);
      return [];
    }
  }, []);

  // Check if update is needed
  const shouldUpdate = useCallback((currentLocation: [number, number]): boolean => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTimeRef.current;
    
    // Condition 1: Every 60 seconds
    if (timeSinceLastUpdate >= 60000) {
      return true;
    }

    // Condition 2: If bus deviated from route (changed from not off-route to off-route)
    if (isOffRoute && !wasOffRouteRef.current) {
      return true;
    }

    // Condition 3: If bus traveled 200 meters since last update
    if (lastUpdateLocationRef.current) {
      const distanceTraveled = calculateDistance(
        lastUpdateLocationRef.current,
        currentLocation
      );
      if (distanceTraveled >= 200) {
        return true;
      }
    }

    return false;
  }, [isOffRoute]);

  // Main effect to update ETAs
  useEffect(() => {
    if (!userLocation || !isNavigating || stops.length === 0) return;

    const remainingStops = stops.slice(currentStopIndex);
    if (remainingStops.length === 0) return;

    // Check if we need to update
    const needsUpdate = shouldUpdate(userLocation) || lastUpdateTimeRef.current === 0;

    if (needsUpdate) {
      setIsUpdating(true);
      
      fetchMapboxETAs(userLocation, remainingStops).then(newETAs => {
        if (newETAs.length > 0) {
          // Create full ETAs array with null values for completed stops
          const fullETAs: StopETA[] = stops.map((stop, index) => {
            if (index < currentStopIndex) {
              return {
                stopId: stop.id,
                distanceRemaining: 0,
                etaMinutes: null,
                etaTime: null,
              };
            }
            const etaIndex = index - currentStopIndex;
            return newETAs[etaIndex] || {
              stopId: stop.id,
              distanceRemaining: 0,
              etaMinutes: null,
              etaTime: null,
            };
          });

          setStopETAs(fullETAs);
          lastUpdateTimeRef.current = Date.now();
          lastUpdateLocationRef.current = userLocation;
          wasOffRouteRef.current = isOffRoute;
        }
        setIsUpdating(false);
      });
    }
  }, [userLocation, stops, currentStopIndex, isNavigating, isOffRoute, shouldUpdate, fetchMapboxETAs]);

  // Update wasOffRouteRef when isOffRoute changes
  useEffect(() => {
    wasOffRouteRef.current = isOffRoute;
  }, [isOffRoute]);

  // Initial fetch when navigation starts
  useEffect(() => {
    if (isNavigating && userLocation && stops.length > 0 && lastUpdateTimeRef.current === 0) {
      const remainingStops = stops.slice(currentStopIndex);
      if (remainingStops.length > 0) {
        setIsUpdating(true);
        fetchMapboxETAs(userLocation, remainingStops).then(newETAs => {
          if (newETAs.length > 0) {
            const fullETAs: StopETA[] = stops.map((stop, index) => {
              if (index < currentStopIndex) {
                return {
                  stopId: stop.id,
                  distanceRemaining: 0,
                  etaMinutes: null,
                  etaTime: null,
                };
              }
              const etaIndex = index - currentStopIndex;
              return newETAs[etaIndex] || {
                stopId: stop.id,
                distanceRemaining: 0,
                etaMinutes: null,
                etaTime: null,
              };
            });
            setStopETAs(fullETAs);
            lastUpdateTimeRef.current = Date.now();
            lastUpdateLocationRef.current = userLocation;
          }
          setIsUpdating(false);
        });
      }
    }
  }, [isNavigating, userLocation, stops, currentStopIndex, fetchMapboxETAs]);

  // Reset when navigation stops
  useEffect(() => {
    if (!isNavigating) {
      lastUpdateTimeRef.current = 0;
      lastUpdateLocationRef.current = null;
      wasOffRouteRef.current = false;
    }
  }, [isNavigating]);

  const nextStopETA = stopETAs.find((_, index) => index >= currentStopIndex) || null;
  
  const totalDistanceRemaining = stopETAs.length > 0 
    ? stopETAs[stopETAs.length - 1]?.distanceRemaining || 0 
    : 0;

  const lastStopETA = stopETAs[stopETAs.length - 1];
  const totalETAMinutes = lastStopETA?.etaMinutes ?? null;

  return {
    stopETAs,
    nextStopETA,
    totalDistanceRemaining,
    totalETAMinutes,
    isUpdating,
  };
}
