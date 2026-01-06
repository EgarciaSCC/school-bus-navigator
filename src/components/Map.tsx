import React, { useEffect, useRef, useCallback, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_TOKEN, MAPBOX_STYLE } from '@/config/mapbox';
import { Stop } from '@/types/route';

interface MapProps {
  userLocation: [number, number] | null;
  stops: Stop[];
  currentStopIndex: number;
  onStopClick?: (stop: Stop) => void;
}

const Map: React.FC<MapProps> = ({ userLocation, stops, currentStopIndex, onStopClick }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const stopMarkers = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  const createUserMarkerElement = useCallback(() => {
    const el = document.createElement('div');
    el.className = 'user-marker';
    el.innerHTML = `
      <div class="relative">
        <div class="absolute -inset-4 bg-purple-500/30 rounded-full animate-ping"></div>
        <div class="relative w-6 h-6 bg-gradient-to-br from-purple-600 to-red-500 rounded-full border-4 border-white shadow-lg"></div>
        <div class="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-purple-600" style="transform: translateX(-50%) rotate(0deg);"></div>
      </div>
    `;
    return el;
  }, []);

  const createStopMarkerElement = useCallback((stop: Stop, index: number) => {
    const isActive = index === currentStopIndex;
    const isCompleted = stop.status === 'completed';
    
    const el = document.createElement('div');
    el.className = 'stop-marker cursor-pointer';
    
    let bgColor = 'bg-grey-300';
    let borderColor = 'border-grey-500';
    
    if (isCompleted) {
      bgColor = 'bg-green-500';
      borderColor = 'border-green-700';
    } else if (isActive) {
      bgColor = 'bg-yellow-900';
      borderColor = 'border-yellow-700';
    }
    
    el.innerHTML = `
      <div class="relative flex items-center justify-center">
        ${isActive ? '<div class="absolute -inset-3 bg-yellow-500/40 rounded-full animate-ping"></div>' : ''}
        <div class="relative w-10 h-10 ${bgColor} ${borderColor} border-4 rounded-full flex items-center justify-center shadow-lg font-bold text-white text-sm">
          ${isCompleted ? '✓' : index + 1}
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

    // Default center: Bogotá
    const defaultCenter: [number, number] = [-74.0721, 4.7110];
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAPBOX_STYLE,
      center: stops.length > 0 ? stops[0].coordinates : defaultCenter,
      zoom: 12,
      pitch: 30,
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

    // Fallback timeout in case load event doesn't fire
    const timeout = setTimeout(() => {
      setMapLoaded(true);
    }, 5000);

    return () => {
      clearTimeout(timeout);
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update user location marker
  useEffect(() => {
    if (!map.current || !userLocation) return;

    if (userMarker.current) {
      userMarker.current.setLngLat(userLocation);
    } else {
      userMarker.current = new mapboxgl.Marker({
        element: createUserMarkerElement(),
      })
        .setLngLat(userLocation)
        .addTo(map.current);

      map.current.flyTo({
        center: userLocation,
        zoom: 14,
        duration: 1500,
      });
    }
  }, [userLocation, createUserMarkerElement]);

  // Update stop markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    stopMarkers.current.forEach(marker => marker.remove());
    stopMarkers.current = [];

    // Add new markers
    stops.forEach((stop, index) => {
      const marker = new mapboxgl.Marker({
        element: createStopMarkerElement(stop, index),
      })
        .setLngLat(stop.coordinates)
        .addTo(map.current!);
      
      stopMarkers.current.push(marker);
    });

    // Fit bounds to show all stops
    if (stops.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      stops.forEach(stop => bounds.extend(stop.coordinates));
      map.current.fitBounds(bounds, { padding: 80, duration: 1000 });
    }
  }, [stops, currentStopIndex, createStopMarkerElement, mapLoaded]);

  // Draw route line
  useEffect(() => {
    if (!map.current || stops.length < 2 || !mapLoaded) return;

    const coordinates = stops.map(s => s.coordinates);
    
    if (map.current.getSource('route')) {
      (map.current.getSource('route') as mapboxgl.GeoJSONSource).setData({
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates },
      });
    } else {
      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates },
        },
      });

      map.current.addLayer({
        id: 'route-outline',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#ffffff',
          'line-width': 10,
        },
      });

      map.current.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#7124F5',
          'line-width': 6,
        },
      });
    }
  }, [stops, mapLoaded]);

  return (
    <div className="relative w-full h-full bg-grey-100">
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
};

export default Map;
