import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MapPin, Calendar, Users, DollarSign, Calculator, Info } from "lucide-react";
import { z } from "zod";
import { calculateFare, getSuggestedFareRange } from "@/lib/fareCalculator";
import { Database } from "@/integrations/supabase/types";
import { FareBreakdownDialog } from "@/components/FareBreakdownDialog";

const rideSchema = z.object({
  fromLocation: z.string().min(3, "From location too short").max(200, "Location too long").trim(),
  toLocation: z.string().min(3, "To location too short").max(200, "Location too long").trim(),
  departureTime: z.string().refine(
    (date) => new Date(date) > new Date(),
    "Departure time must be in the future"
  ),
  availableSeats: z.coerce.number().int("Seats must be a whole number").min(1, "At least 1 seat required").max(8, "Maximum 8 seats"),
  farePerSeat: z.coerce.number().min(1, "Fare must be at least 1").max(100000, "Fare too high"),
  notes: z.string().max(500, "Notes too long").optional(),
});

const PostRide = () => {
  const [loading, setLoading] = useState(false);
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [availableSeats, setAvailableSeats] = useState("1");
  const [farePerSeat, setFarePerSeat] = useState("");
  const [distance, setDistance] = useState("");
  const [notes, setNotes] = useState("");
  const [vehicleType, setVehicleType] = useState<Database['public']['Enums']['vehicle_type'] | null>(null);
  const [suggestedFare, setSuggestedFare] = useState<ReturnType<typeof getSuggestedFareRange> | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch user's vehicle type
  useEffect(() => {
    const fetchVehicle = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: vehicle } = await supabase
        .from("vehicles")
        .select("vehicle_type")
        .eq("driver_id", user.id)
        .single();

      if (vehicle) {
        setVehicleType(vehicle.vehicle_type);
      }
    };

    fetchVehicle();
  }, []);

  // Calculate fare when distance, seats, or vehicle type changes
  useEffect(() => {
    if (distance && availableSeats && vehicleType) {
      const distanceKm = parseFloat(distance);
      const seats = parseInt(availableSeats);
      
      if (distanceKm > 0 && seats > 0) {
        const fareRange = getSuggestedFareRange(distanceKm, vehicleType, seats);
        setSuggestedFare(fareRange);
        setFarePerSeat(fareRange.suggested.toString());
      }
    }
  }, [distance, availableSeats, vehicleType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate input
      const validation = rideSchema.safeParse({
        fromLocation,
        toLocation,
        departureTime,
        availableSeats,
        farePerSeat,
        notes,
      });
      
      if (!validation.success) {
        throw new Error(validation.error.errors[0].message);
      }

      const distanceKm = parseFloat(distance);
      if (!distanceKm || distanceKm <= 0) {
        throw new Error("Please enter a valid distance");
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // For now, we'll create a dummy vehicle if none exists
      // In production, user should add vehicle first
      let vehicleId;
      const { data: vehicles } = await supabase
        .from("vehicles")
        .select("id")
        .eq("driver_id", user.id)
        .limit(1);

      if (!vehicles || vehicles.length === 0) {
        toast({
          variant: "destructive",
          title: "No Vehicle",
          description: "Please add a vehicle to your profile first",
        });
        navigate("/profile");
        return;
      }

      vehicleId = vehicles[0].id;

      const { error } = await supabase.from("rides").insert({
        driver_id: user.id,
        vehicle_id: vehicleId,
        from_location: fromLocation,
        to_location: toLocation,
        departure_time: new Date(departureTime).toISOString(),
        available_seats: parseInt(availableSeats),
        fare_per_seat: parseFloat(farePerSeat),
        route_distance_km: distanceKm,
        notes: notes || null,
        status: "scheduled",
      });

      if (error) throw error;

      toast({
        title: "Ride Posted!",
        description: "Your ride has been posted successfully",
      });

      navigate("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
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
          <h1 className="text-2xl font-bold">Post a Ride</h1>
        </div>
        <p className="text-white/80 text-sm ml-11">Share your journey and earn</p>
      </div>

      <div className="px-4">
        <Card>
          <CardHeader>
            <CardTitle>Ride Details</CardTitle>
            <CardDescription>Fill in the details for your ride</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="from" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  From
                </Label>
                <Input
                  id="from"
                  placeholder="Starting location"
                  value={fromLocation}
                  onChange={(e) => setFromLocation(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="to" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  To
                </Label>
                <Input
                  id="to"
                  placeholder="Destination"
                  value={toLocation}
                  onChange={(e) => setToLocation(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="datetime" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Departure Date & Time
                </Label>
                <Input
                  id="datetime"
                  type="datetime-local"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="distance">Distance (km)</Label>
                <Input
                  id="distance"
                  type="number"
                  min="1"
                  step="0.1"
                  placeholder="e.g., 50"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Enter the approximate distance for automatic fare calculation
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="seats" className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    Available Seats
                  </Label>
                  <Select value={availableSeats} onValueChange={setAvailableSeats}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="fare" className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-primary" />
                      Fare per Seat (PKR)
                    </Label>
                    {suggestedFare && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-xs"
                        onClick={() => setShowBreakdown(true)}
                      >
                        <Info className="w-3 h-3 mr-1" />
                        Breakdown
                      </Button>
                    )}
                  </div>
                  <Input
                    id="fare"
                    type="number"
                    min="0"
                    step="10"
                    placeholder="500"
                    value={farePerSeat}
                    onChange={(e) => setFarePerSeat(e.target.value)}
                    required
                  />
                  {suggestedFare && (
                    <div className="space-y-1">
                      <Badge variant="outline" className="bg-muted text-xs">
                        <Calculator className="w-3 h-3 mr-1" />
                        Suggested: PKR {suggestedFare.suggested}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        Range: {suggestedFare.min} - {suggestedFare.max} (negotiable)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any special instructions or preferences..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Posting..." : "Post Ride"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {suggestedFare && (
          <FareBreakdownDialog
            open={showBreakdown}
            onOpenChange={setShowBreakdown}
            breakdown={suggestedFare.breakdown}
          />
        )}
      </div>
    </div>
  );
};

export default PostRide;
