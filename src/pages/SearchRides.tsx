import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Search, MapPin, Calendar, Users, DollarSign, Star, Shield } from "lucide-react";
import { z } from "zod";
import { useRealtimeRides } from "@/hooks/useRealtimeRides";

const bookingSchema = z.object({
  seatsRequested: z.coerce.number().int("Seats must be a whole number").min(1, "At least 1 seat required").max(8, "Maximum 8 seats"),
});

const SearchRides = () => {
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  // Use real-time rides hook
  const { rides, loading } = useRealtimeRides({
    status: ['scheduled', 'active'],
    fromLocation: fromLocation || undefined,
    toLocation: toLocation || undefined,
    date: departureDate || undefined,
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    // Real-time hook automatically fetches and updates rides
    if (rides.length === 0 && !loading) {
      toast({
        title: "No rides found",
        description: "Try adjusting your search criteria",
      });
    }
  };

  const handleBookRide = async (rideId: string, farePerSeat: number) => {
    try {
      // Validate seats requested
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

      // Refresh rides (will trigger re-render via hook)
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

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="bg-primary text-white p-6 rounded-b-3xl shadow-lg mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Button variant="ghost" size="icon" className="text-white" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Search Rides</h1>
        </div>
        <p className="text-white/80 text-sm ml-11">Find your perfect ride</p>
      </div>

      <div className="px-4 space-y-6">
        {/* Search Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Where are you going?</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="search-from" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  From
                </Label>
                <Input
                  id="search-from"
                  placeholder="Starting location"
                  value={fromLocation}
                  onChange={(e) => setFromLocation(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="search-to" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  To
                </Label>
                <Input
                  id="search-to"
                  placeholder="Destination"
                  value={toLocation}
                  onChange={(e) => setToLocation(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="search-date" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Date
                </Label>
                <Input
                  id="search-date"
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                <Search className="w-4 h-4 mr-2" />
                {loading ? "Searching..." : "Search Rides"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        {rides.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold px-2">{rides.length} Available Rides</h2>
            {rides.map((ride) => (
              <Card key={ride.id} className="overflow-hidden">
                <CardContent className="p-4 space-y-4">
                  {/* Driver Info */}
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-white">
                        {ride.driver?.full_name?.charAt(0) || "D"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{ride.driver?.full_name || "Driver"}</p>
                        {ride.driver?.is_phone_verified && (
                          <Shield className="w-4 h-4 text-success" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="w-3 h-3 fill-warning text-warning" />
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
                      <MapPin className="w-4 h-4 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">{ride.from_location}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(ride.departure_time).toLocaleString("en-PK", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-primary mt-0.5" />
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
                      <div className="flex items-center gap-1 text-primary font-semibold">
                        <DollarSign className="w-4 h-4" />
                        <span>PKR {ride.fare_per_seat}</span>
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

        {!loading && rides.length === 0 && (fromLocation || toLocation || departureDate) && (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No rides found matching your search</p>
              <p className="text-sm mt-1">Try different locations or dates</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SearchRides;
