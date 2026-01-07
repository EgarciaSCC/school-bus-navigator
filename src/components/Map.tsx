import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_TOKEN, MAPBOX_STYLE } from '@/config/mapbox';
import { Stop } from '@/types/route';
import { useMapboxDirections } from '@/hooks/useMapboxDirections';
import { useRouteDeviation } from '@/hooks/useRouteDeviation';
import busFrontImage from '@/assets/bus-front.png';

interface MapProps {
  userLocation: [number, number] | null;
  stops: Stop[];
  currentStopIndex: number;
  onStopClick?: (stop: Stop) => void;
  isNavigating?: boolean;
  heading?: number | null;
  onRouteRecalculated?: () => void;
}

const Map: React.FC<MapProps> = ({ 
  userLocation, 
  stops, 
  currentStopIndex, 
  onStopClick,
  isNavigating = false,
  heading = null,
  onRouteRecalculated
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const stopMarkers = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  const { routeCoordinates, fetchRoute, isLoading: isRouteLoading } = useMapboxDirections();

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

  // Create bus marker element
  const createBusMarkerElement = useCallback(() => {
    const el = document.createElement('div');
    el.className = 'bus-marker';
    el.style.cssText = `
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      transform-origin: center center;
    `;
    
    const img = document.createElement('img');
    img.src = busFrontImage;
    img.alt = 'Bus';
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

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    map.current.on('style.load', () => {
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

  // Fetch optimized route from Directions API
  useEffect(() => {
    if (stops.length >= 2 && mapLoaded) {
      const waypoints = stops.map(s => s.coordinates);
      fetchRoute(waypoints);
    }
  }, [stops, mapLoaded, fetchRoute]);

  // Update user location marker with bus icon
  useEffect(() => {
    if (!map.current || !userLocation) return;

    if (userMarker.current) {
      userMarker.current.setLngLat(userLocation);
      
      // Rotate bus based on heading
      if (heading !== null) {
        const el = userMarker.current.getElement();
        el.style.transform = `rotate(${heading}deg)`;
      }
    } else {
      userMarker.current = new mapboxgl.Marker({
        element: createBusMarkerElement(),
        rotationAlignment: 'map',
        pitchAlignment: 'map',
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
        zoom: 17,
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
  }, [userLocation, heading, isNavigating, createBusMarkerElement]);

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

  // Draw route line from Directions API
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

      // Route line (purple gradient effect)
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
      {isRouteLoading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium text-grey-700">Calculando ruta óptima...</span>
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
      {isOffRoute && !isRecalculating && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-red-50 border border-red-300 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
          <span className="text-sm font-medium text-red-700">⚠️ Fuera de ruta</span>
        </div>
      )}
    </div>
  );
};

export default Map;
