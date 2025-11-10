import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Booking = Database['public']['Tables']['bookings']['Row'];

export const useRealtimeBookings = (userId: string | undefined) => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Initial fetch with ride details
    const fetchBookings = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          ride:rides(
            from_location,
            to_location,
            departure_time
          )
        `)
        .eq('passenger_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setBookings(data);
      }
      setLoading(false);
    };

    fetchBookings();

    // Set up real-time subscription
    const channel = supabase
      .channel('bookings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `passenger_id=eq.${userId}`
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            // Fetch the full booking with ride details
            const { data } = await supabase
              .from('bookings')
              .select(`
                *,
                ride:rides(
                  from_location,
                  to_location,
                  departure_time
                )
              `)
              .eq('id', payload.new.id)
              .single();
            
            if (data) {
              setBookings((current) => [data, ...current]);
            }
          } else if (payload.eventType === 'UPDATE') {
            // Fetch the updated booking with ride details
            const { data } = await supabase
              .from('bookings')
              .select(`
                *,
                ride:rides(
                  from_location,
                  to_location,
                  departure_time
                )
              `)
              .eq('id', payload.new.id)
              .single();
            
            if (data) {
              setBookings((current) =>
                current.map((booking) =>
                  booking.id === payload.old.id ? data : booking
                )
              );
            }
          } else if (payload.eventType === 'DELETE') {
            setBookings((current) =>
              current.filter((booking) => booking.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { bookings, loading };
};
