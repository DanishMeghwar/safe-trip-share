import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Ride = Database['public']['Tables']['rides']['Row'];
type RideStatus = 'scheduled' | 'active' | 'completed' | 'cancelled';

type RideWithDetails = Ride & {
  vehicle?: { vehicle_type: string; make: string; model: string; color: string } | null;
  bookings_count?: number;
  confirmed_bookings?: number;
};

export const useDriverRides = (driverId?: string) => {
  const [rides, setRides] = useState<RideWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRides = useCallback(async () => {
    if (!driverId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const { data, error } = await supabase
      .from('rides')
      .select(`
        *,
        vehicle:vehicles(vehicle_type, make, model, color),
        bookings(id, status)
      `)
      .eq('driver_id', driverId)
      .order('departure_time', { ascending: false });

    if (!error && data) {
      const ridesWithCounts = data.map((ride: any) => ({
        ...ride,
        bookings_count: ride.bookings?.length || 0,
        confirmed_bookings: ride.bookings?.filter((b: any) => b.status === 'confirmed').length || 0,
      }));
      setRides(ridesWithCounts);
    }
    setLoading(false);
  }, [driverId]);

  useEffect(() => {
    fetchRides();

    if (!driverId) return;

    // Set up real-time subscription for driver's rides
    const channel = supabase
      .channel(`driver-rides-${driverId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rides',
          filter: `driver_id=eq.${driverId}`
        },
        () => {
          fetchRides();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driverId, fetchRides]);

  const upcomingRides = rides.filter(r => r.status === 'scheduled' || r.status === 'active');
  const completedRides = rides.filter(r => r.status === 'completed');
  const cancelledRides = rides.filter(r => r.status === 'cancelled');

  return { 
    rides, 
    upcomingRides, 
    completedRides, 
    cancelledRides, 
    loading, 
    refetch: fetchRides 
  };
};
