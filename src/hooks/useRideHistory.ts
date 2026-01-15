import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RideHistoryItem {
  id: string;
  type: 'driver' | 'passenger';
  from_location: string;
  to_location: string;
  departure_time: string;
  fare: number;
  status: string;
  is_round_trip?: boolean;
  other_party: {
    full_name: string;
    avatar_url?: string;
  } | null;
  vehicle?: {
    vehicle_type: string;
    make: string;
    model: string;
    color: string;
  } | null;
}

export const useRideHistory = (userId?: string) => {
  const [history, setHistory] = useState<RideHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      setLoading(true);

      // Fetch rides as driver
      const { data: driverRides } = await supabase
        .from('rides')
        .select(`
          id,
          from_location,
          to_location,
          departure_time,
          fare_per_seat,
          status,
          is_round_trip,
          vehicle:vehicles(vehicle_type, make, model, color),
          bookings(
            seats_requested,
            total_fare,
            passenger:profiles!passenger_id(full_name, avatar_url)
          )
        `)
        .eq('driver_id', userId)
        .eq('status', 'completed')
        .order('departure_time', { ascending: false });

      // Fetch rides as passenger
      const { data: passengerBookings } = await supabase
        .from('bookings')
        .select(`
          id,
          total_fare,
          status,
          ride:rides(
            id,
            from_location,
            to_location,
            departure_time,
            status,
            is_round_trip,
            driver:profiles!driver_id(full_name, avatar_url),
            vehicle:vehicles(vehicle_type, make, model, color)
          )
        `)
        .eq('passenger_id', userId)
        .eq('status', 'confirmed')
        .order('created_at', { ascending: false });

      const historyItems: RideHistoryItem[] = [];

      // Process driver rides
      if (driverRides) {
        driverRides.forEach((ride: any) => {
          const totalEarnings = ride.bookings?.reduce((sum: number, b: any) => sum + (b.total_fare || 0), 0) || 0;
          historyItems.push({
            id: ride.id,
            type: 'driver',
            from_location: ride.from_location,
            to_location: ride.to_location,
            departure_time: ride.departure_time,
            fare: totalEarnings,
            status: ride.status,
            is_round_trip: ride.is_round_trip,
            other_party: ride.bookings?.[0]?.passenger || null,
            vehicle: ride.vehicle,
          });
        });
      }

      // Process passenger bookings
      if (passengerBookings) {
        passengerBookings.forEach((booking: any) => {
          if (booking.ride?.status === 'completed') {
            historyItems.push({
              id: booking.id,
              type: 'passenger',
              from_location: booking.ride.from_location,
              to_location: booking.ride.to_location,
              departure_time: booking.ride.departure_time,
              fare: booking.total_fare,
              status: booking.status,
              is_round_trip: booking.ride.is_round_trip,
              other_party: booking.ride.driver,
              vehicle: booking.ride.vehicle,
            });
          }
        });
      }

      // Sort by departure time (most recent first)
      historyItems.sort((a, b) => 
        new Date(b.departure_time).getTime() - new Date(a.departure_time).getTime()
      );

      setHistory(historyItems);
      setLoading(false);
    };

    fetchHistory();
  }, [userId]);

  return { history, loading };
};
