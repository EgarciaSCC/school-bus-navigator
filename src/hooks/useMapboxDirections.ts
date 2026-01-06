import { useState, useEffect, useCallback } from 'react';
import { MAPBOX_TOKEN } from '@/config/mapbox';

interface DirectionsResult {
  routes: {
    geometry: {
      coordinates: [number, number][];
    };
    duration: number;
    distance: number;
    legs: {
      steps: {
        maneuver: {
          instruction: string;
          location: [number, number];
        };
        distance: number;
        duration: number;
      }[];
    }[];
  }[];
}

interface UseMapboxDirectionsResult {
  routeCoordinates: [number, number][] | null;
  duration: number | null;
  distance: number | null;
  isLoading: boolean;
  error: string | null;
  fetchRoute: (waypoints: [number, number][]) => Promise<void>;
}

export const useMapboxDirections = (): UseMapboxDirectionsResult => {
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][] | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoute = useCallback(async (waypoints: [number, number][]) => {
    if (waypoints.length < 2) {
      setError('Se necesitan al menos 2 puntos para trazar una ruta');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Mapbox Directions API accepts up to 25 waypoints
      const coordinates = waypoints.map(wp => wp.join(',')).join(';');
      
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?` +
        `geometries=geojson&` +
        `overview=full&` +
        `steps=true&` +
        `access_token=${MAPBOX_TOKEN}`;

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error de la API: ${response.status}`);
      }

      const data: DirectionsResult = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        setRouteCoordinates(route.geometry.coordinates as [number, number][]);
        setDuration(route.duration); // in seconds
        setDistance(route.distance); // in meters
      } else {
        setError('No se encontró una ruta válida');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al obtener la ruta');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    routeCoordinates,
    duration,
    distance,
    isLoading,
    error,
    fetchRoute,
  };
};
