import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_TOKEN, MAPBOX_STYLE } from '@/config/mapbox';
import { Stop } from '@/types/route';
import { useMapboxDirections } from '@/hooks/useMapboxDirections';
import { useRouteDeviation } from '@/hooks/useRouteDeviation';
import { getBusImageForHeading, getBusRotationOffset } from '@/utils/busDirectionImage';

interface MapProps {
  userLocation: [number, number] | null;
  stops: Stop[];
  currentStopIndex: number;
  onStopClick?: (stop: Stop) => void;
  isNavigating?: boolean;
  heading?: number | null;
  onRouteRecalculated?: () => void;
  isOffRoute?: boolean;
  onResize?: boolean; // Trigger resize when this prop changes
}

const Map: React.FC<MapProps> = ({ 
  userLocation, 
  stops, 
  currentStopIndex, 
  onStopClick,
  isNavigating = false,
  heading = null,
  onRouteRecalculated,
  isOffRoute: externalIsOffRoute,
  onResize
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const stopMarkers = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [approachRouteFetched, setApproachRouteFetched] = useState(false);
  
  // Main school route
  const { routeCoordinates, fetchRoute, isLoading: isRouteLoading } = useMapboxDirections();
  
  // Approach route (driver location to first stop)
  const { 
    routeCoordinates: approachRouteCoordinates, 
    fetchRoute: fetchApproachRoute, 
    isLoading: isApproachRouteLoading,
    distance: approachDistance 
  } = useMapboxDirections();

  // Get remaining stops for recalculation
  const remainingStops = useMemo(() => {
    return stops.slice(currentStopIndex).map(s => s.coordinates);
  }, [stops, currentStopIndex]);

  // Route deviation detection
  const { isOffRoute, isRecalculating } = useRouteDeviation(
    userLocation,
    routeCoordinates,
    isNavigating,
    remainingStops,
    async (waypoints) => {
      await fetchRoute(waypoints);
      onRouteRecalculated?.();
    }
  );

  // Track last heading for image selection and turn animation
  const lastHeadingRef = useRef<number | null>(null);
  const turnAnimationRef = useRef<number>(0); // Current tilt angle
  const turnAnimationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Navigation zoom and bus marker size constants
  const NAVIGATION_ZOOM = 25.5; // 25% increase from base zoom 17
  const BUS_MARKER_SIZE = 52; // 30% larger than 40px base
  const MAX_TILT_ANGLE = 15; // Maximum tilt angle in degrees for turns

  // Calculate turn direction and intensity (-1 to 1, negative = left, positive = right)
  const calculateTurnIntensity = useCallback((prevHeading: number | null, currentHeading: number | null): number => {
    if (prevHeading === null || currentHeading === null) return 0;
    
    // Calculate the shortest angle difference
    let diff = currentHeading - prevHeading;
    
    // Normalize to -180 to 180
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    
    // Clamp and normalize to -1 to 1
    const intensity = Math.max(-1, Math.min(1, diff / 45));
    return intensity;
  }, []);

  // Create bus marker element with direction-aware image and 3D perspective
  const createBusMarkerElement = useCallback((currentHeading: number | null) => {
    const el = document.createElement('div');
    el.className = 'bus-marker';
    el.style.cssText = `
      width: ${BUS_MARKER_SIZE}px;
      height: ${BUS_MARKER_SIZE}px;
      display: flex;
      align-items: center;
      justify-content: center;
      transform-origin: center center;
      transform-style: preserve-3d;
      perspective: 1000px;
    `;
    
    const img = document.createElement('img');
    img.src = getBusImageForHeading(currentHeading);
    img.alt = 'Bus';
    img.className = 'bus-image';
    img.style.cssText = `
      width: 100%;
      height: 100%;
      object-fit: contain;
      filter: drop-shadow(0 6px 12px rgba(0,0,0,0.4));
      transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.3s ease-out;
      transform-style: preserve-3d;
      backface-visibility: hidden;
      will-change: transform;
    `;
    
    // Apply fine rotation offset
    const rotationOffset = getBusRotationOffset(currentHeading);
    img.style.transform = `rotate(${rotationOffset}deg) rotateY(0deg) rotateX(0deg)`;
    
    el.appendChild(img);
    return el;
  }, []);

  const createStopMarkerElement = useCallback((stop: Stop, index: number, isStart: boolean, isEnd: boolean) => {
    const isActive = index === currentStopIndex;
    const isCompleted = stop.status === 'completed';
    
    const el = document.createElement('div');
    el.className = 'stop-marker cursor-pointer';
    
    let bgColor = '#94a3b8'; // grey
    let borderColor = '#64748b';
    let icon = `${index + 1}`;
    
    if (isStart) {
      bgColor = '#22c55e'; // green
      borderColor = '#16a34a';
      icon = '🏠';
    } else if (isEnd) {
      bgColor = '#ef4444'; // red
      borderColor = '#dc2626';
      icon = '🏁';
    } else if (isCompleted) {
      bgColor = '#22c55e';
      borderColor = '#16a34a';
      icon = '✓';
    } else if (isActive) {
      bgColor = '#eab308'; // yellow
      borderColor = '#ca8a04';
    }
    
    el.innerHTML = `
      <div class="relative flex items-center justify-center">
        ${isActive ? '<div class="absolute -inset-3 rounded-full animate-ping" style="background-color: rgba(234, 179, 8, 0.4);"></div>' : ''}
        <div class="relative flex items-center justify-center shadow-lg font-bold text-white text-sm" 
             style="width: 44px; height: 44px; background-color: ${bgColor}; border: 4px solid ${borderColor}; border-radius: 50%;">
          ${icon}
        </div>
        <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-semibold px-2 py-1 rounded bg-white shadow-md text-grey-800">
          ${stop.name.length > 15 ? stop.name.substring(0, 15) + '...' : stop.name}
        </div>
      </div>
    `;
    
    el.addEventListener('click', () => onStopClick?.(stop));
    return el;
  }, [currentStopIndex, onStopClick]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    // Default center: First stop or Bogotá
    const defaultCenter: [number, number] = stops.length > 0 ? stops[0].coordinates : [-74.0721, 4.7110];
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAPBOX_STYLE,
      center: defaultCenter,
      zoom: 15,
      pitch: 60, // First person perspective
      bearing: 0,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: true }),
      'bottom-right'
    );

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    map.current.on('style.load', () => {
      // Add traffic layer from Mapbox after style is fully loaded
      if (map.current && !map.current.getSource('mapbox-traffic')) {
        try {
          map.current.addSource('mapbox-traffic', {
            type: 'vector',
            url: 'mapbox://mapbox.mapbox-traffic-v1'
          });
          
          map.current.addLayer({
            id: 'traffic-layer',
            type: 'line',
            source: 'mapbox-traffic',
            'source-layer': 'traffic',
            paint: {
              'line-width': 2,
              'line-color': [
                'match',
                ['get', 'congestion'],
                'low', '#4ade80',
                'moderate', '#facc15',
                'heavy', '#f97316',
                'severe', '#ef4444',
                '#94a3b8'
              ],
              'line-opacity': 0.75
            }
          });
        } catch (e) {
          console.warn('Could not add traffic layer:', e);
        }
      }
    });

    // Fallback timeout
    const timeout = setTimeout(() => {
      setMapLoaded(true);
    }, 5000);

    return () => {
      clearTimeout(timeout);
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Handle map resize when panel visibility changes
  useEffect(() => {
    if (!map.current) return;
    
    // Small delay to allow CSS transition to complete
    const timeoutId = setTimeout(() => {
      map.current?.resize();
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [onResize]);

  // Fetch optimized route from Directions API
  useEffect(() => {
    if (stops.length >= 2 && mapLoaded) {
      const waypoints = stops.map(s => s.coordinates);
      fetchRoute(waypoints);
    }
  }, [stops, mapLoaded, fetchRoute]);

  // Fetch approach route (from driver location to first stop) - only before route starts
  useEffect(() => {
    if (!mapLoaded || !userLocation || stops.length === 0 || isNavigating || approachRouteFetched) return;
    
    const firstStop = stops[0];
    
    // Only fetch if driver is more than 100m from first stop
    const distance = Math.sqrt(
      Math.pow(userLocation[0] - firstStop.coordinates[0], 2) +
      Math.pow(userLocation[1] - firstStop.coordinates[1], 2)
    ) * 111000; // rough conversion to meters
    
    if (distance > 100) {
      fetchApproachRoute([userLocation, firstStop.coordinates]);
      setApproachRouteFetched(true);
    }
  }, [mapLoaded, userLocation, stops, isNavigating, fetchApproachRoute, approachRouteFetched]);

  // Update user location marker with bus icon, direction-aware image, and turn animations
  useEffect(() => {
    if (!map.current || !userLocation) return;

    // Check if heading changed significantly (need new image)
    const headingChanged = heading !== null && (
      lastHeadingRef.current === null ||
      Math.abs(heading - lastHeadingRef.current) >= 22.5
    );

    if (userMarker.current) {
      userMarker.current.setLngLat(userLocation);
      
      const el = userMarker.current.getElement();
      const img = el.querySelector('.bus-image') as HTMLImageElement;
      
      if (img && heading !== null) {
        // Calculate turn intensity for tilt animation
        const turnIntensity = calculateTurnIntensity(lastHeadingRef.current, heading);
        const tiltAngle = turnIntensity * MAX_TILT_ANGLE;
        
        // Update image source if heading bracket changed
        if (headingChanged) {
          const newImageSrc = getBusImageForHeading(heading);
          if (img.src !== newImageSrc) {
            img.src = newImageSrc;
          }
        }
        
        // Apply rotation with 3D tilt effect for turning
        const rotationOffset = getBusRotationOffset(heading);
        
        // Tilt on Y axis for left/right lean, slight X tilt for depth effect
        const yTilt = tiltAngle;
        const xTilt = Math.abs(turnIntensity) * 5; // Slight forward lean when turning
        
        img.style.transform = `rotate(${rotationOffset}deg) rotateY(${yTilt}deg) rotateX(${xTilt}deg)`;
        
        // Enhanced shadow during turns for more realism
        const shadowIntensity = 0.4 + Math.abs(turnIntensity) * 0.2;
        const shadowOffset = 6 + Math.abs(turnIntensity) * 4;
        img.style.filter = `drop-shadow(${tiltAngle * 0.3}px ${shadowOffset}px ${12 + Math.abs(tiltAngle)}px rgba(0,0,0,${shadowIntensity}))`;
        
        // Clear previous timeout and set new one to reset tilt
        if (turnAnimationTimeoutRef.current) {
          clearTimeout(turnAnimationTimeoutRef.current);
        }
        
        // Smoothly reset tilt after turn completes
        turnAnimationTimeoutRef.current = setTimeout(() => {
          if (img) {
            const currentRotation = getBusRotationOffset(heading);
            img.style.transform = `rotate(${currentRotation}deg) rotateY(0deg) rotateX(0deg)`;
            img.style.filter = `drop-shadow(0 6px 12px rgba(0,0,0,0.4))`;
          }
        }, 600);
        
        lastHeadingRef.current = heading;
      }
    } else {
      lastHeadingRef.current = heading;
      userMarker.current = new mapboxgl.Marker({
        element: createBusMarkerElement(heading),
        rotationAlignment: 'viewport', // Keep marker oriented to viewport for better 3D effect
        pitchAlignment: 'viewport',    // Marker stays upright when map is tilted
      })
        .setLngLat(userLocation)
        .addTo(map.current);
    }

    // First person view: follow user and rotate map based on heading
    if (isNavigating && heading !== null) {
      map.current.easeTo({
        center: userLocation,
        bearing: heading,
        pitch: 65,
        zoom: NAVIGATION_ZOOM, // Closer zoom for navigation
        duration: 1000,
      });
    } else {
      map.current.flyTo({
        center: userLocation,
        zoom: 15,
        pitch: 60,
        duration: 1500,
      });
    }
  }, [userLocation, heading, isNavigating, createBusMarkerElement, calculateTurnIntensity, NAVIGATION_ZOOM, MAX_TILT_ANGLE]);

  // Update stop markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    stopMarkers.current.forEach(marker => marker.remove());
    stopMarkers.current = [];

    // Add new markers
    stops.forEach((stop, index) => {
      const isStart = index === 0;
      const isEnd = index === stops.length - 1;
      
      const marker = new mapboxgl.Marker({
        element: createStopMarkerElement(stop, index, isStart, isEnd),
      })
        .setLngLat(stop.coordinates)
        .addTo(map.current!);
      
      stopMarkers.current.push(marker);
    });

    // Fit bounds to show all stops
    if (stops.length > 1 && !isNavigating) {
      const bounds = new mapboxgl.LngLatBounds();
      stops.forEach(stop => bounds.extend(stop.coordinates));
      map.current.fitBounds(bounds, { 
        padding: { top: 100, bottom: 100, left: 100, right: 100 }, 
        pitch: 45,
        duration: 1000 
      });
    }
  }, [stops, currentStopIndex, createStopMarkerElement, mapLoaded, isNavigating]);

  // Draw approach route (driver to first stop) in secondary color
  useEffect(() => {
    if (!map.current || !mapLoaded || isNavigating) return;

    const sourceId = 'approach-route';
    const outlineId = 'approach-route-outline';
    const lineId = 'approach-route-line';

    // Remove approach route when navigating starts
    if (isNavigating) {
      if (map.current.getLayer(lineId)) map.current.removeLayer(lineId);
      if (map.current.getLayer(outlineId)) map.current.removeLayer(outlineId);
      if (map.current.getSource(sourceId)) map.current.removeSource(sourceId);
      return;
    }

    if (!approachRouteCoordinates || approachRouteCoordinates.length < 2) return;

    if (map.current.getSource(sourceId)) {
      (map.current.getSource(sourceId) as mapboxgl.GeoJSONSource).setData({
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: approachRouteCoordinates },
      });
    } else {
      map.current.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: approachRouteCoordinates },
        },
      });

      // Approach route outline (white border)
      map.current.addLayer({
        id: outlineId,
        type: 'line',
        source: sourceId,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#ffffff',
          'line-width': 10,
        },
      });

      // Approach route line (secondary/yellow color with dashed pattern)
      map.current.addLayer({
        id: lineId,
        type: 'line',
        source: sourceId,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#FFD166', // secondary yellow
          'line-width': 6,
          'line-dasharray': [2, 1],
        },
      });
    }
  }, [approachRouteCoordinates, mapLoaded, isNavigating]);

  // Draw main route line from Directions API
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Use Directions API route if available, otherwise fall back to straight lines
    const coordinates = routeCoordinates || (stops.length >= 2 ? stops.map(s => s.coordinates) : null);
    
    if (!coordinates || coordinates.length < 2) return;

    const sourceId = 'route';
    const outlineId = 'route-outline';
    const lineId = 'route-line';

    if (map.current.getSource(sourceId)) {
      (map.current.getSource(sourceId) as mapboxgl.GeoJSONSource).setData({
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates },
      });
    } else {
      map.current.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates },
        },
      });

      // Route outline (white border)
      map.current.addLayer({
        id: outlineId,
        type: 'line',
        source: sourceId,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#ffffff',
          'line-width': 12,
        },
      });

      // Route line (purple/primary color)
      map.current.addLayer({
        id: lineId,
        type: 'line',
        source: sourceId,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#7124F5',
          'line-width': 8,
        },
      });
    }
  }, [routeCoordinates, stops, mapLoaded]);

  return (
    <div className="relative w-full h-full bg-grey-100">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Route loading indicator */}
      {(isRouteLoading || isApproachRouteLoading) && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium text-grey-700">
            {isApproachRouteLoading ? 'Calculando ruta al punto de inicio...' : 'Calculando ruta óptima...'}
          </span>
        </div>
      )}

      {/* Route recalculation indicator */}
      {isRecalculating && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-yellow-50 border border-yellow-300 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium text-yellow-700">Recalculando ruta...</span>
        </div>
      )}

      {/* Off-route warning */}
      {(isOffRoute || externalIsOffRoute) && !isRecalculating && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-red-50 border border-red-300 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
          <span className="text-sm font-medium text-red-700">⚠️ Fuera de ruta</span>
        </div>
      )}
    </div>
  );
};

export default Map;
