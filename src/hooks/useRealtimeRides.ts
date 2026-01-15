import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Ride = Database['public']['Tables']['rides']['Row'];
type RideStatus = 'scheduled' | 'active' | 'completed' | 'cancelled';

type RideWithRelations = Ride & {
  driver?: { full_name: string; is_phone_verified: boolean } | null;
  vehicle?: { vehicle_type: string; make: string; model: string; color: string } | null;
};

// Normalize text for fuzzy matching (handles Urdu/English variations)
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[\u0600-\u06FF]/g, '') // Remove Urdu characters for comparison
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
};

// Fuzzy match function for location filtering
const fuzzyMatch = (source: string, query: string): boolean => {
  if (!query) return true;
  const normalizedSource = normalizeText(source);
  const normalizedQuery = normalizeText(query);
  
  // Check if any word in query appears in source
  const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 2);
  return queryWords.some(word => normalizedSource.includes(word));
};

export const useRealtimeRides = (filters?: {
  status?: RideStatus[];
  fromLocation?: string;
  toLocation?: string;
  date?: string;
}) => {
  const [allRides, setAllRides] = useState<RideWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  // Apply client-side filtering
  const rides = useMemo(() => {
    let filtered = [...allRides];

    // Filter by status
    if (filters?.status && filters.status.length > 0) {
      filtered = filtered.filter(ride => 
        ride.status && filters.status!.includes(ride.status as RideStatus)
      );
    }

    // Filter by date
    if (filters?.date) {
      const startOfDay = new Date(filters.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(filters.date);
      endOfDay.setHours(23, 59, 59, 999);
      
      filtered = filtered.filter(ride => {
        const departureTime = new Date(ride.departure_time);
        return departureTime >= startOfDay && departureTime <= endOfDay;
      });
    }

    // Fuzzy filter by from location
    if (filters?.fromLocation && filters.fromLocation.trim()) {
      filtered = filtered.filter(ride => 
        fuzzyMatch(ride.from_location, filters.fromLocation!)
      );
    }

    // Fuzzy filter by to location  
    if (filters?.toLocation && filters.toLocation.trim()) {
      filtered = filtered.filter(ride => 
        fuzzyMatch(ride.to_location, filters.toLocation!)
      );
    }

    // Sort by departure time
    return filtered.sort((a, b) => 
      new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime()
    );
  }, [allRides, filters?.status, filters?.fromLocation, filters?.toLocation, filters?.date]);

  useEffect(() => {
    // Initial fetch - get ALL upcoming rides (no text filtering in DB)
    const fetchRides = async () => {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('rides')
        .select(`
          *,
          driver:profiles(full_name, is_phone_verified),
          vehicle:vehicles(vehicle_type, make, model, color)
        `)
        .in('status', ['scheduled', 'active'])
        .gte('departure_time', new Date().toISOString())
        .order('departure_time', { ascending: true });

      if (!error && data) {
        setAllRides(data as unknown as RideWithRelations[]);
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
                  driver:profiles(full_name, is_phone_verified),
                  vehicle:vehicles(vehicle_type, make, model, color)
                `)
                .eq('id', payload.new.id)
                .single();
              
              if (data) {
                setAllRides((current) => [...current, data as unknown as RideWithRelations]);
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
                  driver:profiles(full_name, is_phone_verified),
                  vehicle:vehicles(vehicle_type, make, model, color)
                `)
                .eq('id', payload.new.id)
                .single();
              
              if (data) {
                setAllRides((current) =>
                  current.map((ride) =>
                    ride.id === payload.old.id ? (data as unknown as RideWithRelations) : ride
                  )
                );
              }
            };
            fetchUpdatedRide();
          } else if (payload.eventType === 'DELETE') {
            setAllRides((current) =>
              current.filter((ride) => ride.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // No dependencies - fetch all rides once, filter client-side

  return { rides, loading, allRides };
};
