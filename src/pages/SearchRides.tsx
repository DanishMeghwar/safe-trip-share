import { useState, useMemo, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Search, MapPin, Calendar, Users, DollarSign, Star, Info, Map, List, CheckCircle, Clock } from "lucide-react";
import { z } from "zod";
import { useRealtimeRides } from "@/hooks/useRealtimeRides";
import { calculateFare } from "@/lib/fareCalculator";
import { FareBreakdownDialog } from "@/components/FareBreakdownDialog";
import { Database } from "@/integrations/supabase/types";

// Lazy load map for better performance
const MapboxMap = lazy(() => import("@/components/MapboxMap"));

const bookingSchema = z.object({
  seatsRequested: z.coerce.number().int("Seats must be a whole number").min(1, "At least 1 seat required").max(8, "Maximum 8 seats"),
});

type SortOption = "time" | "fare_low" | "fare_high";

const SearchRides = () => {
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [selectedRideBreakdown, setSelectedRideBreakdown] = useState<ReturnType<typeof calculateFare> | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [sortBy, setSortBy] = useState<SortOption>("time");
  const [selectedRideId, setSelectedRideId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Use real-time rides hook - locations are now optional for flexible search
  const { rides, loading } = useRealtimeRides({
    status: ['scheduled', 'active'],
    fromLocation: fromLocation.length >= 3 ? fromLocation : undefined,
    toLocation: toLocation.length >= 3 ? toLocation : undefined,
    date: departureDate || undefined,
  });

  // Sort and filter rides
  const sortedRides = useMemo(() => {
    const sorted = [...rides];
    switch (sortBy) {
      case "fare_low":
        return sorted.sort((a, b) => a.fare_per_seat - b.fare_per_seat);
      case "fare_high":
        return sorted.sort((a, b) => b.fare_per_seat - a.fare_per_seat);
      case "time":
      default:
        return sorted.sort((a, b) => 
          new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime()
        );
    }
  }, [rides, sortBy]);

  const handleShowAllRides = () => {
    setFromLocation("");
    setToLocation("");
    // Set today's date to show upcoming rides
    setDepartureDate(new Date().toISOString().split('T')[0]);
  };

  const handleBookRide = async (rideId: string, farePerSeat: number) => {
    try {
      const validation = bookingSchema.safeParse({ seatsRequested: 1 });
      if (!validation.success) {
        throw new Error(validation.error.errors[0].message);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("bookings").insert({
        ride_id: rideId,
        passenger_id: user.id,
        seats_requested: 1,
        total_fare: farePerSeat,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Booking Request Sent!",
        description: "The driver will review your request",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  // Prepare map markers from rides with enhanced info
  const mapMarkers = useMemo(() => {
    return sortedRides
      .filter((ride) => ride.from_lat && ride.from_lng)
      .map((ride) => ({
        id: ride.id,
        lat: ride.from_lat!,
        lng: ride.from_lng!,
        label: `${ride.from_location} → ${ride.to_location}`,
        type: "pickup" as const,
        fare: ride.fare_per_seat,
        time: new Date(ride.departure_time).toLocaleTimeString("en-PK", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      }));
  }, [sortedRides]);

  // Get selected ride for route display
  const selectedRide = useMemo(() => 
    sortedRides.find(r => r.id === selectedRideId),
    [sortedRides, selectedRideId]
  );

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-6 rounded-b-3xl shadow-lg mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20" onClick={() => navigate("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold">Search Rides</h1>
          </div>
          <div className="flex gap-1 bg-primary-foreground/20 rounded-lg p-1">
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className={viewMode === "list" ? "" : "text-primary-foreground hover:bg-primary-foreground/20"}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "map" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("map")}
              className={viewMode === "map" ? "" : "text-primary-foreground hover:bg-primary-foreground/20"}
            >
              <Map className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <p className="text-primary-foreground/80 text-sm ml-11">Find your perfect ride</p>
      </div>

      <div className="px-4 space-y-6">
        {/* Search Form */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Where are you going?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="search-from" className="flex items-center gap-2 text-sm">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  From (optional)
                </Label>
                <Input
                  id="search-from"
                  placeholder="Starting location"
                  value={fromLocation}
                  onChange={(e) => setFromLocation(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="search-to" className="flex items-center gap-2 text-sm">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  To (optional)
                </Label>
                <Input
                  id="search-to"
                  placeholder="Destination"
                  value={toLocation}
                  onChange={(e) => setToLocation(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="search-date" className="flex items-center gap-2 text-sm">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  Date
                </Label>
                <Input
                  id="search-date"
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-2 text-sm">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  Sort by
                </Label>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="time">Departure Time</SelectItem>
                    <SelectItem value="fare_low">Fare: Low to High</SelectItem>
                    <SelectItem value="fare_high">Fare: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={handleShowAllRides} 
              variant="outline" 
              className="w-full"
              disabled={loading}
            >
              <Search className="w-4 h-4 mr-2" />
              Show All Upcoming Rides
            </Button>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[180px] w-full rounded-lg" />
            ))}
          </div>
        )}

        {/* Map View */}
        {!loading && viewMode === "map" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{sortedRides.length} Available Rides</h2>
              {selectedRide && (
                <Button size="sm" variant="outline" onClick={() => setSelectedRideId(null)}>
                  Clear Selection
                </Button>
              )}
            </div>
            
            <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-lg" />}>
              <MapboxMap 
                markers={mapMarkers} 
                className="h-[400px]"
                zoom={mapMarkers.length > 0 ? 10 : 6}
                onMarkerClick={setSelectedRideId}
                showRoute={!!selectedRide && !!selectedRide.from_lat && !!selectedRide.to_lat}
                routeStart={selectedRide ? [selectedRide.from_lat!, selectedRide.from_lng!] : undefined}
                routeEnd={selectedRide ? [selectedRide.to_lat!, selectedRide.to_lng!] : undefined}
              />
            </Suspense>

            {/* Selected Ride Card */}
            {selectedRide && (
              <Card className="border-primary">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{selectedRide.from_location} → {selectedRide.to_location}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(selectedRide.departure_time).toLocaleString("en-PK")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">PKR {selectedRide.fare_per_seat}</p>
                      <Button size="sm" onClick={() => handleBookRide(selectedRide.id, selectedRide.fare_per_seat)}>
                        Book Now
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {mapMarkers.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No rides with map coordinates yet. Select a date to see available rides.
              </p>
            )}
          </div>
        )}

        {/* List Results */}
        {!loading && viewMode === "list" && sortedRides.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold px-2">{sortedRides.length} Available Rides</h2>
            {sortedRides.map((ride) => (
              <Card key={ride.id} className="overflow-hidden">
                <CardContent className="p-4 space-y-4">
                  {/* Driver Info */}
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {ride.driver?.full_name?.charAt(0) || "D"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{ride.driver?.full_name || "Driver"}</p>
                        {ride.driver?.is_phone_verified && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-green-50 text-green-700 border-green-200">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span>0.0</span>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {ride.vehicle?.vehicle_type || "Vehicle"}
                    </Badge>
                  </div>

                  {/* Route */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium">{ride.from_location}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(ride.departure_time).toLocaleString("en-PK", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-red-500 mt-0.5" />
                      <p className="font-medium">{ride.to_location}</p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>{ride.available_seats} seats</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1 text-primary font-semibold">
                          <DollarSign className="w-4 h-4" />
                          <span>PKR {ride.fare_per_seat}</span>
                        </div>
                        {ride.route_distance_km && ride.vehicle?.vehicle_type && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-xs text-muted-foreground hover:text-primary"
                            onClick={() => {
                              const breakdown = calculateFare(
                                Number(ride.route_distance_km),
                                ride.vehicle.vehicle_type as Database['public']['Enums']['vehicle_type'],
                                ride.available_seats
                              );
                              setSelectedRideBreakdown(breakdown);
                              setShowBreakdown(true);
                            }}
                          >
                            <Info className="w-3 h-3 mr-1" />
                            See breakdown
                          </Button>
                        )}
                      </div>
                    </div>
                    <Button size="sm" onClick={() => handleBookRide(ride.id, ride.fare_per_seat)}>
                      Request to Join
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && viewMode === "list" && sortedRides.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No rides found</p>
              <p className="text-sm mt-1">Select a date or click "Show All Upcoming Rides"</p>
            </CardContent>
          </Card>
        )}
      </div>

      {selectedRideBreakdown && (
        <FareBreakdownDialog
          open={showBreakdown}
          onOpenChange={setShowBreakdown}
          breakdown={selectedRideBreakdown}
        />
      )}
    </div>
  );
};

export default SearchRides;
