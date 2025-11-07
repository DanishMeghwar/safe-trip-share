import MapView from "@/components/MapView";

const MapPage = () => {
  return (
    <div className="flex flex-col items-center">
      <h1 className="text-2xl font-semibold mb-4">Safe Trip Share Map</h1>
      <MapView />
    </div>
  );
};

export default MapPage;