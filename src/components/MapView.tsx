import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const MapView = () => {
  const mapContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: [67.0011, 24.8547], // Karachi example
      zoom: 10,
    });

    // Add zoom & rotation controls
    map.addControl(new maplibregl.NavigationControl(), "top-right");

    return () => map.remove();
  }, []);

  return <div ref={mapContainer} className="w-full h-[80vh]" />;
};

export default MapView;