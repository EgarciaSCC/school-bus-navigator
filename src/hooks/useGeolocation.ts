import { useState, useEffect, useCallback } from 'react';

interface GeolocationState {
  coordinates: [number, number] | null;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    coordinates: null,
    accuracy: null,
    heading: null,
    speed: null,
    error: null,
    loading: true,
  });

  const updatePosition = useCallback((position: GeolocationPosition) => {
    setState({
      coordinates: [position.coords.longitude, position.coords.latitude],
      accuracy: position.coords.accuracy,
      heading: position.coords.heading,
      speed: position.coords.speed,
      error: null,
      loading: false,
    });
  }, []);

  const handleError = useCallback((error: GeolocationPositionError) => {
    setState(prev => ({
      ...prev,
      error: error.message,
      loading: false,
    }));
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocalización no soportada',
        loading: false,
      }));
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    // Get initial position
    navigator.geolocation.getCurrentPosition(updatePosition, handleError, options);

    // Watch position changes
    const watchId = navigator.geolocation.watchPosition(updatePosition, handleError, options);

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [updatePosition, handleError]);

  return state;
}
