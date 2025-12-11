import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MapPin, Navigation } from "lucide-react";
import { locationService } from "@/services/locationService";
import useRealtimeLiveLocations from "@/hooks/useRealtimeLiveLocations";
import LeafletMap from "@/components/LeafletMap";

const ActiveRide = () => {
  const navigate = useNavigate();
  const { rideId } = useParams();
  const { toast } = useToast();
  const [ride, setRide] = useState<any>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [loading, setLoading] = useState(true);
  const { locations } = useRealtimeLiveLocations(rideId);

  useEffect(() => {
    if (!rideId) return;

    const loadRide = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: rideData, error } = await supabase
        .from('rides')
        .select('*')
        .eq('id', rideId)
        .single();

      if (error || !rideData) {
        toast({
          title: "Error",
          description: "Ride not found",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      setRide(rideData);
      setLoading(false);

      // Check if user is driver
      if (rideData.driver_id === user.id) {
        // Auto-start tracking for driver
        startLocationTracking();
      }
    };

    loadRide();

    return () => {
      locationService.stopTracking();
    };
  }, [rideId, navigate, toast]);

  // Create map markers from live locations
  const mapMarkers = useMemo(() => {
    const markers: { id: string; lat: number; lng: number; label: string; type: "driver" | "passenger" }[] = [];
    
    locations.forEach((loc) => {
      markers.push({
        id: loc.id,
        lat: loc.latitude,
        lng: loc.longitude,
        label: `User ${loc.user_id.substring(0, 8)}...`,
        type: loc.user_id === ride?.driver_id ? "driver" : "passenger",
      });
    });

    // Add ride origin/destination if available
    if (ride?.from_lat && ride?.from_lng) {
      markers.push({
        id: "origin",
        lat: ride.from_lat,
        lng: ride.from_lng,
        label: `Start: ${ride.from_location}`,
        type: "driver",
      });
    }

    if (ride?.to_lat && ride?.to_lng) {
      markers.push({
        id: "destination",
        lat: ride.to_lat,
        lng: ride.to_lng,
        label: `End: ${ride.to_location}`,
        type: "passenger",
      });
    }

    return markers;
  }, [locations, ride]);

  const startLocationTracking = async () => {
    if (!rideId) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const success = await locationService.startTracking(
      rideId,
      user.id,
      (position) => {
        console.log('Location updated:', position.coords);
      }
    );

    if (success) {
      setIsTracking(true);
      toast({
        title: "Location tracking started",
        description: "Your location is now being shared",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to start location tracking",
        variant: "destructive",
      });
    }
  };

  const stopLocationTracking = async () => {
    await locationService.stopTracking();
    setIsTracking(false);
    toast({
      title: "Location tracking stopped",
      description: "Your location is no longer being shared",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-muted-foreground">Loading ride details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Active Ride</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {ride?.from_location} → {ride?.to_location}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Live Map - Always shown with free OpenStreetMap */}
            <div className="mb-4">
              <h3 className="font-medium mb-2">Live Map</h3>
              <LeafletMap 
                markers={mapMarkers} 
                className="h-[300px]"
                center={ride?.from_lat && ride?.from_lng ? [ride.from_lat, ride.from_lng] : undefined}
                zoom={12}
                showRoute={ride?.from_lat && ride?.to_lat}
                routeStart={ride?.from_lat && ride?.from_lng ? [ride.from_lat, ride.from_lng] : undefined}
                routeEnd={ride?.to_lat && ride?.to_lng ? [ride.to_lat, ride.to_lng] : undefined}
              />
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Departure Time</p>
              <p className="font-medium">
                {new Date(ride?.departure_time).toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Available Seats</p>
              <p className="font-medium">{ride?.available_seats}</p>
            </div>

            {ride?.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="font-medium">{ride.notes}</p>
              </div>
            )}

            <div className="pt-4 border-t">
              {isTracking ? (
                <Button 
                  onClick={stopLocationTracking} 
                  variant="destructive"
                  className="w-full"
                >
                  <Navigation className="mr-2 h-4 w-4" />
                  Stop Sharing Location
                </Button>
              ) : (
                <Button 
                  onClick={startLocationTracking}
                  className="w-full"
                >
                  <Navigation className="mr-2 h-4 w-4" />
                  Start Sharing Location
                </Button>
              )}
            </div>

            {locations.length > 0 && (
              <div className="pt-4 border-t">
                <h3 className="font-medium mb-2">Live Locations ({locations.length})</h3>
                <div className="space-y-2">
                  {locations.map((loc) => (
                    <div key={loc.id} className="text-sm p-2 bg-muted rounded">
                      <p className="font-medium">
                        {loc.user_id === ride?.driver_id ? "🚗 Driver" : "👤 Passenger"}
                      </p>
                      <p className="text-muted-foreground">
                        {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Updated: {new Date(loc.updated_at || '').toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ActiveRide;
