import { useEffect, useRef, memo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { cn } from '@/lib/utils';
import { MAPBOX_ACCESS_TOKEN, DEFAULT_CENTER, DEFAULT_ZOOM } from '@/lib/mapboxConfig';

mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  type?: 'pickup' | 'dropoff' | 'driver' | 'passenger';
  fare?: number;
  time?: string;
}

interface MapboxMapProps {
  markers?: MapMarker[];
  center?: [number, number];
  zoom?: number;
  className?: string;
  onMapClick?: (lat: number, lng: number) => void;
  showRoute?: boolean;
  routeStart?: [number, number];
  routeEnd?: [number, number];
  onMarkerClick?: (markerId: string) => void;
}

const markerColors: Record<string, string> = {
  pickup: '#22c55e',
  dropoff: '#ef4444',
  driver: '#3b82f6',
  passenger: '#8b5cf6',
};

const MapboxMap = memo(({
  markers = [],
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  className,
  onMapClick,
  showRoute = false,
  routeStart,
  routeEnd,
  onMarkerClick,
}: MapboxMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [center[1], center[0]], // Mapbox uses [lng, lat]
      zoom: zoom,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add click handler
    if (onMapClick) {
      map.current.on('click', (e) => {
        onMapClick(e.lngLat.lat, e.lngLat.lng);
      });
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update center and zoom
  useEffect(() => {
    if (map.current) {
      map.current.flyTo({
        center: [center[1], center[0]],
        zoom: zoom,
        duration: 500,
      });
    }
  }, [center, zoom]);

  // Update markers
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers
    markers.forEach((marker) => {
      const color = markerColors[marker.type || 'pickup'] || '#3b82f6';
      
      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'mapbox-marker';
      el.style.cssText = `
        background-color: ${color};
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
        transition: transform 0.2s;
      `;
      
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.2)';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
      });
      
      if (onMarkerClick) {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          onMarkerClick(marker.id);
        });
      }

      const mapboxMarker = new mapboxgl.Marker(el)
        .setLngLat([marker.lng, marker.lat])
        .addTo(map.current!);

      // Add popup with ride info
      if (marker.label || marker.fare || marker.time) {
        const popupContent = `
          <div style="padding: 8px; font-family: system-ui, sans-serif;">
            ${marker.label ? `<p style="margin: 0 0 4px; font-weight: 600; font-size: 13px;">${marker.label}</p>` : ''}
            ${marker.time ? `<p style="margin: 0 0 2px; font-size: 12px; color: #666;">🕐 ${marker.time}</p>` : ''}
            ${marker.fare ? `<p style="margin: 0; font-size: 12px; color: #22c55e; font-weight: 600;">PKR ${marker.fare}</p>` : ''}
          </div>
        `;
        mapboxMarker.setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(popupContent));
      }

      markersRef.current.push(mapboxMarker);
    });

    // Fit bounds to markers if there are any
    if (markers.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      markers.forEach((m) => bounds.extend([m.lng, m.lat]));
      map.current.fitBounds(bounds, { padding: 60, maxZoom: 14 });
    } else if (markers.length === 1) {
      map.current.flyTo({
        center: [markers[0].lng, markers[0].lat],
        zoom: 12,
        duration: 500,
      });
    }
  }, [markers, onMarkerClick]);

  // Draw route line
  useEffect(() => {
    if (!map.current) return;

    const sourceId = 'route-line';
    const layerId = 'route-line-layer';

    // Wait for map to be fully loaded
    const addRoute = () => {
      // Remove existing route
      if (map.current?.getLayer(layerId)) {
        map.current.removeLayer(layerId);
      }
      if (map.current?.getSource(sourceId)) {
        map.current.removeSource(sourceId);
      }

      // Draw new route
      if (showRoute && routeStart && routeEnd) {
        map.current?.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [
                [routeStart[1], routeStart[0]],
                [routeEnd[1], routeEnd[0]],
              ],
            },
          },
        });

        map.current?.addLayer({
          id: layerId,
          type: 'line',
          source: sourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#3b82f6',
            'line-width': 4,
            'line-opacity': 0.8,
            'line-dasharray': [2, 1],
          },
        });
      }
    };

    if (map.current.isStyleLoaded()) {
      addRoute();
    } else {
      map.current.on('load', addRoute);
    }
  }, [showRoute, routeStart, routeEnd]);

  return (
    <div 
      ref={mapContainer} 
      className={cn('w-full h-[300px] rounded-lg overflow-hidden', className)}
    />
  );
});

MapboxMap.displayName = 'MapboxMap';

export default MapboxMap;
