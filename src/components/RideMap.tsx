import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapboxTokenInput, useMapboxToken } from "./MapboxTokenInput";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface RideMarker {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  type: "pickup" | "dropoff" | "driver" | "passenger";
}

interface RideMapProps {
  markers?: RideMarker[];
  center?: [number, number];
  zoom?: number;
  onMapClick?: (lat: number, lng: number) => void;
  showTokenInput?: boolean;
  className?: string;
}

const markerColors = {
  pickup: "#22c55e",
  dropoff: "#ef4444",
  driver: "#3b82f6",
  passenger: "#f59e0b",
};

export const RideMap = ({
  markers = [],
  center = [73.0479, 33.6844], // Default to Islamabad
  zoom = 10,
  onMapClick,
  showTokenInput = true,
  className = "h-[400px]",
}: RideMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { token } = useMapboxToken();
  const [tokenState, setTokenState] = useState<string | null>(token);

  const handleTokenChange = useCallback((newToken: string | null) => {
    setTokenState(newToken);
  }, []);

  // Initialize map when token is available
  useEffect(() => {
    if (!mapContainer.current || !tokenState) return;

    mapboxgl.accessToken = tokenState;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: center,
        zoom: zoom,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

      map.current.on("load", () => {
        setIsLoaded(true);
      });

      if (onMapClick) {
        map.current.on("click", (e) => {
          onMapClick(e.lngLat.lat, e.lngLat.lng);
        });
      }
    } catch (error) {
      console.error("Error initializing map:", error);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [tokenState, center, zoom, onMapClick]);

  // Update markers when they change
  useEffect(() => {
    if (!map.current || !isLoaded) return;

    // Remove existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers
    markers.forEach((markerData) => {
      if (!markerData.lat || !markerData.lng) return;

      const el = document.createElement("div");
      el.className = "marker";
      el.style.width = "24px";
      el.style.height = "24px";
      el.style.borderRadius = "50%";
      el.style.backgroundColor = markerColors[markerData.type];
      el.style.border = "3px solid white";
      el.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
      el.style.cursor = "pointer";

      const marker = new mapboxgl.Marker(el)
        .setLngLat([markerData.lng, markerData.lat])
        .addTo(map.current!);

      if (markerData.label) {
        marker.setPopup(
          new mapboxgl.Popup({ offset: 25 }).setText(markerData.label)
        );
      }

      markersRef.current.push(marker);
    });

    // Fit bounds if multiple markers
    if (markers.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      markers.forEach((m) => {
        if (m.lat && m.lng) bounds.extend([m.lng, m.lat]);
      });
      map.current.fitBounds(bounds, { padding: 50 });
    }
  }, [markers, isLoaded]);

  if (!tokenState && showTokenInput) {
    return <MapboxTokenInput onTokenChange={handleTokenChange} />;
  }

  if (!tokenState) {
    return (
      <Card className={className}>
        <CardContent className="h-full flex items-center justify-center text-muted-foreground">
          Map requires Mapbox token
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`relative rounded-lg overflow-hidden ${className}`}>
      <div ref={mapContainer} className="absolute inset-0" />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
};

export default RideMap;
