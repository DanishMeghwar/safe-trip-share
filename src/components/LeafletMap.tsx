import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { cn } from '@/lib/utils';

// Fix default marker icons for Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  type?: 'pickup' | 'dropoff' | 'driver' | 'passenger';
}

interface LeafletMapProps {
  markers?: MapMarker[];
  center?: [number, number];
  zoom?: number;
  className?: string;
  onMapClick?: (lat: number, lng: number) => void;
  showRoute?: boolean;
  routeStart?: [number, number];
  routeEnd?: [number, number];
}

const markerColors: Record<string, string> = {
  pickup: '#22c55e',
  dropoff: '#ef4444',
  driver: '#3b82f6',
  passenger: '#8b5cf6',
};

const LeafletMap = ({
  markers = [],
  center = [30.3753, 69.3451], // Pakistan center
  zoom = 6,
  className,
  onMapClick,
  showRoute = false,
  routeStart,
  routeEnd,
}: LeafletMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const routeRef = useRef<L.Polyline | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    mapInstanceRef.current = L.map(mapRef.current).setView(center, zoom);

    // Add OpenStreetMap tiles (FREE!)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(mapInstanceRef.current);

    // Add click handler
    if (onMapClick) {
      mapInstanceRef.current.on('click', (e) => {
        onMapClick(e.latlng.lat, e.latlng.lng);
      });
    }

    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update center and zoom
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(center, zoom);
    }
  }, [center, zoom]);

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers
    markers.forEach((marker) => {
      const color = markerColors[marker.type || 'pickup'] || '#3b82f6';
      
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          background-color: ${color};
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const leafletMarker = L.marker([marker.lat, marker.lng], { icon })
        .addTo(mapInstanceRef.current!);

      if (marker.label) {
        leafletMarker.bindPopup(marker.label);
      }

      markersRef.current.push(leafletMarker);
    });

    // Fit bounds to markers if there are any
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [markers]);

  // Draw route line
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Remove existing route
    if (routeRef.current) {
      routeRef.current.remove();
      routeRef.current = null;
    }

    // Draw new route
    if (showRoute && routeStart && routeEnd) {
      routeRef.current = L.polyline([routeStart, routeEnd], {
        color: '#3b82f6',
        weight: 4,
        opacity: 0.7,
        dashArray: '10, 10',
      }).addTo(mapInstanceRef.current);
    }
  }, [showRoute, routeStart, routeEnd]);

  return (
    <div 
      ref={mapRef} 
      className={cn('w-full h-[300px] rounded-lg overflow-hidden border', className)}
    />
  );
};

export default LeafletMap;
