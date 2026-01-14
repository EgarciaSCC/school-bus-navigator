import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_TOKEN, MAPBOX_STYLE } from '@/config/mapbox';
import { Stop } from '@/types/route';
import { useMapboxDirections } from '@/hooks/useMapboxDirections';
import { useRouteDeviation } from '@/hooks/useRouteDeviation';
import { useSmoothMarker } from '@/hooks/useSmoothMarker';
import { useSnapToRoute } from '@/hooks/useSnapToRoute';
import bus0 from '@/assets/bus-0.png';

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
  routeVersion?: number; // Triggers route recalculation when changed
  showOverview?: boolean; // Show full route overview
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
  onResize,
  routeVersion = 0,
  showOverview = false
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const stopMarkers = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [approachRouteFetched, setApproachRouteFetched] = useState(false);
  
  // Smooth marker animation hook
  const { setMarker: setBusMarker, updatePosition: updateBusPosition, markerRef: busMarkerRef } = useSmoothMarker({
    animationDuration: 800, // Smooth 800ms transitions
  });
  
  // Track previous camera position for smooth transitions
  const lastCameraUpdate = useRef<number>(0);
  const CAMERA_THROTTLE_MS = 100; // Throttle camera updates to prevent jitter
  
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

  // Snap to route for precise bus positioning on the road
  const { snapToRoute } = useSnapToRoute(routeCoordinates);
  
  // Calculate snapped location for the bus
  const snappedUserLocation = useMemo(() => {
    if (!userLocation || !isNavigating) return userLocation;
    const result = snapToRoute(userLocation);
    return result?.snappedLocation ?? userLocation;
  }, [userLocation, isNavigating, snapToRoute]);

  // Navigation zoom and bus marker size constants
  const NAVIGATION_ZOOM = 19.5; // 15% increase from base zoom 17
  const BUS_MARKER_SIZE = 52; // 30% larger than 40px base

  // Create simple bus marker element with static bus-0.png
  const createBusMarkerElement = useCallback(() => {
    const el = document.createElement('div');
    el.className = 'bus-marker';
    el.style.cssText = `
      width: ${BUS_MARKER_SIZE}px;
      height: ${BUS_MARKER_SIZE}px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    const img = document.createElement('img');
    img.src = bus0;
    img.alt = 'Bus';
    img.className = 'bus-image';
    img.style.cssText = `
      width: 100%;
      height: 100%;
      object-fit: contain;
      filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
    `;
    
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

    // Wait for style to be fully loaded before setting mapLoaded
    map.current.on('style.load', () => {
      if (!map.current) return;
      
      // Add traffic layer from Mapbox after style is fully loaded
      if (!map.current.getSource('mapbox-traffic')) {
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
      
      // Now it's safe to set mapLoaded
      setMapLoaded(true);
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

  // Fetch optimized route from Directions API (triggered by stops change, routeVersion, or currentStopIndex)
  // Always navigates from current user location to next uncompleted stop
  useEffect(() => {
    if (stops.length >= 2 && mapLoaded) {
      // When navigating, always calculate route from current position to remaining stops
      if (isNavigating && userLocation) {
        // Find the next uncompleted stop
        const nextUncompletedIndex = stops.findIndex((s, i) => i >= currentStopIndex && s.status !== 'completed');
        
        if (nextUncompletedIndex !== -1) {
          // Get all remaining stops from the next uncompleted one to the end
          const remainingStops = stops.slice(nextUncompletedIndex);
          
          if (remainingStops.length > 0) {
            // Always start from current user location (real-time position)
            const waypoints: [number, number][] = [
              userLocation,
              ...remainingStops.map(s => s.coordinates)
            ];
            fetchRoute(waypoints);
          }
        }
      } else if (!isNavigating) {
        // When not navigating, show full route preview
        const waypoints = stops.map(s => s.coordinates);
        fetchRoute(waypoints);
      }
    }
  }, [stops, mapLoaded, fetchRoute, routeVersion, isNavigating, userLocation, currentStopIndex]);

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

  // Update user location marker with smooth animation (uses snapped position when navigating)
  useEffect(() => {
    if (!map.current || !snappedUserLocation) return;

    const now = performance.now();

    if (busMarkerRef.current) {
      // Use smooth position update with snapped location for precise road positioning
      updateBusPosition(snappedUserLocation);
    } else {
      const marker = new mapboxgl.Marker({
        element: createBusMarkerElement(),
        rotationAlignment: 'viewport',
        pitchAlignment: 'viewport',
      })
        .setLngLat(snappedUserLocation)
        .addTo(map.current);
      
      setBusMarker(marker);
    }

    // Throttle camera updates to prevent jitter
    if (now - lastCameraUpdate.current < CAMERA_THROTTLE_MS) {
      return;
    }
    lastCameraUpdate.current = now;

    // Skip camera updates if showing overview
    if (showOverview) return;

    // First person view: follow user and rotate map based on heading
    if (isNavigating && heading !== null) {
      map.current.easeTo({
        center: snappedUserLocation,
        bearing: heading,
        pitch: 65,
        zoom: NAVIGATION_ZOOM,
        duration: 800, // Match marker animation duration
        easing: (t) => 1 - Math.pow(1 - t, 3), // ease-out cubic
      });
    } else if (!isNavigating) {
      map.current.flyTo({
        center: snappedUserLocation,
        zoom: 18,
        pitch: 60,
        duration: 1500,
      });
    }
  }, [snappedUserLocation, heading, isNavigating, createBusMarkerElement, NAVIGATION_ZOOM, updateBusPosition, setBusMarker, busMarkerRef, showOverview]);

  // Handle overview mode - show full route or return to bus position
  useEffect(() => {
    if (!map.current || !mapLoaded || stops.length < 2) return;

    if (showOverview) {
      const bounds = new mapboxgl.LngLatBounds();
      stops.forEach(stop => bounds.extend(stop.coordinates));
      
      // Include user location in bounds if available
      if (snappedUserLocation) {
        bounds.extend(snappedUserLocation);
      }

      map.current.fitBounds(bounds, {
        padding: { top: 80, bottom: 120, left: 60, right: 60 },
        pitch: 30,
        bearing: 0,
        duration: 1000,
      });
    } else if (snappedUserLocation) {
      // Return to bus position when exiting overview mode
      map.current.easeTo({
        center: snappedUserLocation,
        bearing: heading ?? 0,
        pitch: isNavigating ? 65 : 60,
        zoom: isNavigating ? NAVIGATION_ZOOM : 18,
        duration: 1000,
      });
    }
  }, [showOverview, stops, mapLoaded, snappedUserLocation, heading, isNavigating, NAVIGATION_ZOOM]);

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
    if (!map.current || !mapLoaded || !map.current.isStyleLoaded()) return;

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

  // Draw completed route segments (from start to current position) with same color as main route
  useEffect(() => {
    if (!map.current || !mapLoaded || !isNavigating || !map.current.isStyleLoaded()) return;

    const sourceId = 'completed-route';
    const lineId = 'completed-route-line';

    // Get completed stops coordinates
    const completedStops = stops.slice(0, currentStopIndex + 1);
    
    if (completedStops.length < 2) {
      // Remove completed route if not enough stops
      if (map.current.getLayer(lineId)) map.current.removeLayer(lineId);
      if (map.current.getSource(sourceId)) map.current.removeSource(sourceId);
      return;
    }

    const completedCoordinates = completedStops.map(s => s.coordinates);

    if (map.current.getSource(sourceId)) {
      (map.current.getSource(sourceId) as mapboxgl.GeoJSONSource).setData({
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: completedCoordinates },
      });
    } else {
      map.current.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: completedCoordinates },
        },
      });

      // Completed route line - gray color to show it's done
      map.current.addLayer({
        id: lineId,
        type: 'line',
        source: sourceId,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#9ca3af', // Gray color for completed route
          'line-width': 8,
          'line-opacity': 0.8,
        },
      });
    }
  }, [stops, currentStopIndex, mapLoaded, isNavigating, routeVersion]);

  // Draw main route line from Directions API
  useEffect(() => {
    if (!map.current || !mapLoaded || !map.current.isStyleLoaded()) return;

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
