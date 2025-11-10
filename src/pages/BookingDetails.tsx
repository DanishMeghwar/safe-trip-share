import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, Calendar, Users, DollarSign } from 'lucide-react';
import { BookingChat } from '@/components/BookingChat';
import { format } from 'date-fns';

type BookingWithDetails = {
  id: string;
  status: string;
  seats_requested: number;
  total_fare: number;
  pickup_location: string | null;
  ride: {
    from_location: string;
    to_location: string;
    departure_time: string;
    fare_per_seat: number;
    driver: {
      full_name: string;
      phone: string | null;
      is_phone_verified: boolean;
    };
  };
};

const BookingDetails = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<BookingWithDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId) return;

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          status,
          seats_requested,
          total_fare,
          pickup_location,
          ride:rides (
            from_location,
            to_location,
            departure_time,
            fare_per_seat,
            driver:profiles!driver_id (
              full_name,
              phone,
              is_phone_verified
            )
          )
        `)
        .eq('id', bookingId)
        .single();

      if (error) {
        console.error('Error fetching booking:', error);
      } else if (data) {
        setBooking(data as any);
      }
      setLoading(false);
    };

    fetchBooking();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Button variant="ghost" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="text-center mt-8">
          <p className="text-muted-foreground">Booking not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background pb-20">
      <div className="bg-primary text-white p-4 rounded-b-3xl shadow-lg">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-white mb-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Booking Details</h1>
      </div>

      <div className="px-4 mt-6 space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Trip Information</CardTitle>
              <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                {booking.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary mt-1" />
              <div className="flex-1">
                <p className="font-semibold">Route</p>
                <p className="text-sm text-muted-foreground">
                  {booking.ride.from_location} → {booking.ride.to_location}
                </p>
              </div>
            </div>

            {booking.pickup_location && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-1" />
                <div className="flex-1">
                  <p className="font-semibold">Pickup Location</p>
                  <p className="text-sm text-muted-foreground">{booking.pickup_location}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-primary mt-1" />
              <div className="flex-1">
                <p className="font-semibold">Departure Time</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(booking.ride.departure_time), 'PPpp')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-primary mt-1" />
              <div className="flex-1">
                <p className="font-semibold">Seats Booked</p>
                <p className="text-sm text-muted-foreground">{booking.seats_requested}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-primary mt-1" />
              <div className="flex-1">
                <p className="font-semibold">Total Fare</p>
                <p className="text-sm text-muted-foreground">PKR {booking.total_fare}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Driver Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Name</span>
                <span className="text-sm text-muted-foreground">
                  {booking.ride.driver.full_name}
                </span>
              </div>
              {booking.ride.driver.phone && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Phone</span>
                  <span className="text-sm text-muted-foreground">
                    {booking.ride.driver.phone}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Verification</span>
                <Badge variant={booking.ride.driver.is_phone_verified ? 'default' : 'secondary'}>
                  {booking.ride.driver.is_phone_verified ? 'Verified' : 'Unverified'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {bookingId && <BookingChat bookingId={bookingId} />}
      </div>
    </div>
  );
};

export default BookingDetails;
