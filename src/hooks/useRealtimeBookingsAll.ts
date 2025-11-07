import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Booking = Database['public']['Tables']['bookings']['Row'];

export const useRealtimeBookingsAll = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial fetch - get all bookings for admin
    const fetchBookings = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setBookings(data);
      }
      setLoading(false);
    };

    fetchBookings();

    // Set up real-time subscription for all bookings
    const channel = supabase
      .channel('all-bookings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setBookings((current) => [payload.new as Booking, ...current]);
          } else if (payload.eventType === 'UPDATE') {
            setBookings((current) =>
              current.map((booking) =>
                booking.id === payload.old.id ? (payload.new as Booking) : booking
              )
            );
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
  }, []);

  return { bookings, loading };
};
