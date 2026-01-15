import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Calendar, Clock, Users, Wallet, RotateCcw, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

const EditRide = () => {
  const { rideId } = useParams<{ rideId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ride, setRide] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  
  // Form state
  const [departureTime, setDepartureTime] = useState("");
  const [availableSeats, setAvailableSeats] = useState(1);
  const [farePerSeat, setFarePerSeat] = useState(0);
  const [notes, setNotes] = useState("");
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [returnTime, setReturnTime] = useState("");

  useEffect(() => {
    const fetchRide = async () => {
      if (!rideId) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Fetch ride details
      const { data: rideData, error: rideError } = await supabase
        .from("rides")
        .select("*")
        .eq("id", rideId)
        .eq("driver_id", user.id)
        .single();

      if (rideError || !rideData) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Ride not found or you don't have permission to edit it",
        });
        navigate("/my-rides");
        return;
      }

      // Fetch bookings for this ride
      const { data: bookingsData } = await supabase
        .from("bookings")
        .select(`
          id,
          passenger_id,
          seats_requested,
          status,
          passenger:profiles!passenger_id(full_name)
        `)
        .eq("ride_id", rideId)
        .in("status", ["pending", "confirmed"]);

      setRide(rideData);
      setBookings(bookingsData || []);
      
      // Populate form
      setDepartureTime(format(new Date(rideData.departure_time), "yyyy-MM-dd'T'HH:mm"));
      setAvailableSeats(rideData.available_seats);
      setFarePerSeat(rideData.fare_per_seat);
      setNotes(rideData.notes || "");
      setIsRoundTrip(rideData.is_round_trip || false);
      if (rideData.return_time) {
        setReturnTime(format(new Date(rideData.return_time), "yyyy-MM-dd'T'HH:mm"));
      }
      
      setLoading(false);
    };

    fetchRide();
  }, [rideId, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const originalRide = ride;
      const changes: { type: string; old_value: string; new_value: string }[] = [];

      // Track changes for notifications
      if (format(new Date(originalRide.departure_time), "yyyy-MM-dd'T'HH:mm") !== departureTime) {
        changes.push({
          type: "time_change",
          old_value: format(new Date(originalRide.departure_time), "PPp"),
          new_value: format(new Date(departureTime), "PPp"),
        });
      }

      if (originalRide.fare_per_seat !== farePerSeat) {
        changes.push({
          type: "fare_change",
          old_value: `PKR ${originalRide.fare_per_seat}`,
          new_value: `PKR ${farePerSeat}`,
        });
      }

      // Update ride
      const { error: updateError } = await supabase
        .from("rides")
        .update({
          departure_time: new Date(departureTime).toISOString(),
          available_seats: availableSeats,
          fare_per_seat: farePerSeat,
          notes,
          is_round_trip: isRoundTrip,
          return_time: isRoundTrip && returnTime ? new Date(returnTime).toISOString() : null,
        })
        .eq("id", rideId);

      if (updateError) throw updateError;

      // Create notifications for all passengers with bookings
      if (changes.length > 0 && bookings.length > 0) {
        const notifications = bookings.flatMap((booking) =>
          changes.map((change) => ({
            ride_id: rideId,
            booking_id: booking.id,
            change_type: change.type,
            old_value: change.old_value,
            new_value: change.new_value,
          }))
        );

        await supabase.from("ride_change_notifications").insert(notifications);
      }

      toast({
        title: "Ride Updated",
        description: bookings.length > 0 
          ? `Ride updated and ${bookings.length} passenger(s) notified`
          : "Ride updated successfully",
      });

      navigate("/my-rides");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const bookedSeats = bookings.reduce((sum, b) => sum + b.seats_requested, 0);

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-6 rounded-b-3xl shadow-lg mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Button variant="ghost" size="icon" className="text-primary-foreground" onClick={() => navigate("/my-rides")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Edit Ride</h1>
        </div>
        <p className="text-primary-foreground/80 text-sm ml-11">
          {ride.from_location} → {ride.to_location}
        </p>
      </div>

      <div className="px-4 space-y-4">
        {/* Warning if there are bookings */}
        {bookings.length > 0 && (
          <Card className="border-orange-400 bg-orange-50 dark:bg-orange-950/20">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
                <div>
                  <p className="font-medium text-orange-700 dark:text-orange-400">
                    {bookings.length} passenger(s) have booked this ride
                  </p>
                  <p className="text-sm text-orange-600 dark:text-orange-500">
                    They will be notified of any changes you make.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Route Info (non-editable) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Route</CardTitle>
            <CardDescription>Route cannot be changed after posting</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <p><strong>From:</strong> {ride.from_location}</p>
              <p><strong>To:</strong> {ride.to_location}</p>
              {ride.route_distance_km && (
                <p><strong>Distance:</strong> {ride.route_distance_km} km</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Editable Fields */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ride Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Departure Time */}
              <div className="space-y-2">
                <Label htmlFor="departureTime" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Departure Time
                </Label>
                <Input
                  id="departureTime"
                  type="datetime-local"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                  required
                />
              </div>

              {/* Round Trip */}
              <div className="flex items-center justify-between py-2">
                <Label htmlFor="roundTrip" className="flex items-center gap-2 cursor-pointer">
                  <RotateCcw className="w-4 h-4 text-primary" />
                  Round Trip
                </Label>
                <Switch
                  id="roundTrip"
                  checked={isRoundTrip}
                  onCheckedChange={setIsRoundTrip}
                />
              </div>

              {isRoundTrip && (
                <div className="space-y-2">
                  <Label htmlFor="returnTime" className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Return Time
                  </Label>
                  <Input
                    id="returnTime"
                    type="datetime-local"
                    value={returnTime}
                    onChange={(e) => setReturnTime(e.target.value)}
                    min={departureTime}
                  />
                </div>
              )}

              {/* Available Seats */}
              <div className="space-y-2">
                <Label htmlFor="seats" className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Available Seats
                </Label>
                <Input
                  id="seats"
                  type="number"
                  min={bookedSeats || 1}
                  max={8}
                  value={availableSeats}
                  onChange={(e) => setAvailableSeats(parseInt(e.target.value) || 1)}
                  required
                />
                {bookedSeats > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {bookedSeats} seat(s) already booked. Minimum: {bookedSeats}
                  </p>
                )}
              </div>

              {/* Fare Per Seat */}
              <div className="space-y-2">
                <Label htmlFor="fare" className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-primary" />
                  Fare Per Seat (PKR)
                </Label>
                <Input
                  id="fare"
                  type="number"
                  min={50}
                  value={farePerSeat}
                  onChange={(e) => setFarePerSeat(parseInt(e.target.value) || 0)}
                  required
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional information..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default EditRide;
