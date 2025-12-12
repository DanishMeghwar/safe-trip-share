import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, Calendar, Users, DollarSign, XCircle } from 'lucide-react';
import { BookingChat } from '@/components/BookingChat';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { VerifiedBadge } from '@/components/VerificationBadges';

type BookingWithDetails = {
  id: string;
  status: string;
  seats_requested: number;
  total_fare: number;
  pickup_location: string | null;
  passenger_id: string;
  ride: {
    from_location: string;
    to_location: string;
    departure_time: string;
    fare_per_seat: number;
    driver_id: string;
    driver: {
      full_name: string;
      phone: string | null;
      is_phone_verified: boolean;
      is_cnic_verified: boolean;
    };
  };
};

const BookingDetails = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [booking, setBooking] = useState<BookingWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [driverVerified, setDriverVerified] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id || null);
    });
  }, []);

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
          passenger_id,
          ride:rides (
            from_location,
            to_location,
            departure_time,
            fare_per_seat,
            driver_id,
            driver:profiles!driver_id (
              full_name,
              phone,
              is_phone_verified,
              is_cnic_verified
            )
          )
        `)
        .eq('id', bookingId)
        .single();

      if (error) {
        console.error('Error fetching booking:', error);
      } else if (data) {
        setBooking(data as any);
        
        // Check if driver is verified
        const { data: driverDocs } = await supabase
          .from('driver_documents')
          .select('is_verified')
          .eq('driver_id', (data as any).ride.driver_id)
          .maybeSingle();
        
        setDriverVerified(driverDocs?.is_verified || false);
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
        <Button variant="ghost" onClick={() => navigate('/')}>
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
      <div className="bg-primary text-primary-foreground p-4 rounded-b-3xl shadow-lg">
        <Button variant="ghost" onClick={() => navigate('/')} className="text-primary-foreground mb-2">
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
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Name</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {booking.ride.driver.full_name}
                  </span>
                  <VerifiedBadge verified={driverVerified} />
                </div>
              </div>
              {booking.ride.driver.phone && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Phone</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {booking.ride.driver.phone}
                    </span>
                    {booking.ride.driver.is_phone_verified && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">CNIC Verified</span>
                <Badge variant={booking.ride.driver.is_cnic_verified ? 'default' : 'secondary'}>
                  {booking.ride.driver.is_cnic_verified ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cancel Button for pending bookings */}
        {booking.status === 'pending' && currentUserId === booking.passenger_id && (
          <Button
            variant="destructive"
            className="w-full"
            disabled={cancelling}
            onClick={async () => {
              setCancelling(true);
              try {
                const { error } = await supabase
                  .from('bookings')
                  .update({ status: 'cancelled' })
                  .eq('id', bookingId);
                
                if (error) throw error;
                
                toast({
                  title: "Booking Cancelled",
                  description: "Your booking has been cancelled successfully",
                });
                navigate('/');
              } catch (error: any) {
                toast({
                  variant: "destructive",
                  title: "Error",
                  description: error.message,
                });
              } finally {
                setCancelling(false);
              }
            }}
          >
            <XCircle className="h-4 w-4 mr-2" />
            {cancelling ? "Cancelling..." : "Cancel Booking"}
          </Button>
        )}

        {bookingId && <BookingChat bookingId={bookingId} />}
      </div>
    </div>
  );
};

export default BookingDetails;
