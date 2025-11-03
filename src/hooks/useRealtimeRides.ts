import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Ride = Database['public']['Tables']['rides']['Row'];
type RideStatus = 'scheduled' | 'active' | 'completed' | 'cancelled';

type RideWithRelations = Ride & {
  driver?: { full_name: string; is_phone_verified: boolean } | null;
  vehicle?: { vehicle_type: string; make: string; model: string; color: string } | null;
};

export const useRealtimeRides = (filters?: {
  status?: RideStatus[];
  fromLocation?: string;
  toLocation?: string;
  date?: string;
}) => {
  const [rides, setRides] = useState<RideWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
    const fetchRides = async () => {
      setLoading(true);
      let query = supabase
        .from('rides')
        .select(`
          *,
          driver:profiles!driver_id(full_name, is_phone_verified),
          vehicle:vehicles(vehicle_type, make, model, color)
        `)
        .order('departure_time', { ascending: true });

      if (filters?.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      if (filters?.fromLocation) {
        query = query.ilike('from_location', `%${filters.fromLocation}%`);
      }

      if (filters?.toLocation) {
        query = query.ilike('to_location', `%${filters.toLocation}%`);
      }

      if (filters?.date) {
        const startOfDay = new Date(filters.date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(filters.date);
        endOfDay.setHours(23, 59, 59, 999);
        
        query = query
          .gte('departure_time', startOfDay.toISOString())
          .lte('departure_time', endOfDay.toISOString());
      }

      const { data, error } = await query;
      
      if (!error && data) {
        setRides(data as any);
      }
      setLoading(false);
    };

    fetchRides();

    // Set up real-time subscription
    const channel = supabase
      .channel('rides-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rides'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // Fetch the full ride with driver and vehicle data
            const fetchNewRide = async () => {
              const { data } = await supabase
                .from('rides')
                .select(`
                  *,
                  driver:profiles!driver_id(full_name, is_phone_verified),
                  vehicle:vehicles(vehicle_type, make, model, color)
                `)
                .eq('id', payload.new.id)
                .single();
              
              if (data) {
                setRides((current) => {
                  const newRide = data as any;
                  // Apply filters
                  if (filters?.status && filters.status.length > 0) {
                    if (!newRide.status || !filters.status.includes(newRide.status as RideStatus)) {
                      return current;
                    }
                  }
                  return [...current, newRide].sort((a: any, b: any) => 
                    new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime()
                  );
                });
              }
            };
            fetchNewRide();
          } else if (payload.eventType === 'UPDATE') {
            // Fetch updated ride with full data
            const fetchUpdatedRide = async () => {
              const { data } = await supabase
                .from('rides')
                .select(`
                  *,
                  driver:profiles!driver_id(full_name, is_phone_verified),
                  vehicle:vehicles(vehicle_type, make, model, color)
                `)
                .eq('id', payload.new.id)
                .single();
              
              if (data) {
                setRides((current) =>
                  current.map((ride: any) =>
                    ride.id === payload.old.id ? data : ride
                  )
                );
              }
            };
            fetchUpdatedRide();
          } else if (payload.eventType === 'DELETE') {
            setRides((current) =>
              current.filter((ride: any) => ride.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filters?.status, filters?.fromLocation, filters?.toLocation, filters?.date]);

  return { rides, loading };
};
