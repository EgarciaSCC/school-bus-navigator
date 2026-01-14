import { useRef, useCallback, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';

interface UseSmoothMarkerOptions {
  animationDuration?: number; // Duration in ms for each animation frame
  frameRate?: number; // Target frames per second
}

export function useSmoothMarker(options: UseSmoothMarkerOptions = {}) {
  const { animationDuration = 1000, frameRate = 60 } = options;
  
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const currentPosition = useRef<[number, number] | null>(null);
  const targetPosition = useRef<[number, number] | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const startTime = useRef<number | null>(null);
  const startPosition = useRef<[number, number] | null>(null);

  // Linear interpolation between two values
  const lerp = useCallback((start: number, end: number, t: number): number => {
    return start + (end - start) * t;
  }, []);

  // Ease-out cubic for smooth deceleration
  const easeOutCubic = useCallback((t: number): number => {
    return 1 - Math.pow(1 - t, 3);
  }, []);

  // Animate the marker position
  const animate = useCallback((timestamp: number) => {
    if (!markerRef.current || !startPosition.current || !targetPosition.current || !startTime.current) {
      return;
    }

    const elapsed = timestamp - startTime.current;
    const progress = Math.min(elapsed / animationDuration, 1);
    const easedProgress = easeOutCubic(progress);

    const newLng = lerp(startPosition.current[0], targetPosition.current[0], easedProgress);
    const newLat = lerp(startPosition.current[1], targetPosition.current[1], easedProgress);

    currentPosition.current = [newLng, newLat];
    markerRef.current.setLngLat([newLng, newLat]);

    if (progress < 1) {
      animationFrameId.current = requestAnimationFrame(animate);
    } else {
      // Animation complete, update positions
      currentPosition.current = targetPosition.current;
      animationFrameId.current = null;
      startTime.current = null;
      startPosition.current = null;
    }
  }, [animationDuration, easeOutCubic, lerp]);

  // Update marker position with smooth animation
  const updatePosition = useCallback((newPosition: [number, number]) => {
    if (!markerRef.current) return;

    // Cancel any ongoing animation
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }

    // If no current position, set immediately
    if (!currentPosition.current) {
      currentPosition.current = newPosition;
      markerRef.current.setLngLat(newPosition);
      return;
    }

    // Calculate distance to determine if we should animate
    const distance = Math.sqrt(
      Math.pow(newPosition[0] - currentPosition.current[0], 2) +
      Math.pow(newPosition[1] - currentPosition.current[1], 2)
    );

    // If distance is very small (< 0.00001 degrees, ~1 meter), skip animation
    if (distance < 0.00001) {
      return;
    }

    // If distance is very large (> 0.01 degrees, ~1km), teleport instead of animate
    if (distance > 0.01) {
      currentPosition.current = newPosition;
      markerRef.current.setLngLat(newPosition);
      return;
    }

    // Start smooth animation
    startPosition.current = [...currentPosition.current];
    targetPosition.current = newPosition;
    startTime.current = performance.now();
    
    animationFrameId.current = requestAnimationFrame(animate);
  }, [animate]);

  // Set the marker reference
  const setMarker = useCallback((marker: mapboxgl.Marker | null) => {
    markerRef.current = marker;
    if (marker) {
      const lngLat = marker.getLngLat();
      currentPosition.current = [lngLat.lng, lngLat.lat];
    }
  }, []);

  // Get current interpolated position
  const getCurrentPosition = useCallback((): [number, number] | null => {
    return currentPosition.current;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  return {
    setMarker,
    updatePosition,
    getCurrentPosition,
    markerRef,
  };
}
