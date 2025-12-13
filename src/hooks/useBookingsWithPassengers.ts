import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type Booking = Database["public"]["Tables"]["bookings"]["Row"];

interface BookingWithPassenger extends Booking {
  passenger?: {
    full_name: string;
    phone: string | null;
  } | null | Array<{ full_name: string; phone: string | null }>;
}

export const useBookingsWithPassengers = () => {
  const [bookings, setBookings] = useState<BookingWithPassenger[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          passenger:profiles!passenger_id (
            full_name,
            phone
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching bookings with passengers:", error);
      } else {
        setBookings(data as BookingWithPassenger[] || []);
      }
      
      setLoading(false);
    };

    fetchBookings();

    // Subscribe to realtime updates - optimized to update only changed items
    const channel = supabase
      .channel("admin-bookings-with-passengers")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bookings",
        },
        async (payload) => {
          const { data } = await supabase
            .from("bookings")
            .select(`*, passenger:profiles!passenger_id (full_name, phone)`)
            .eq("id", payload.new.id)
            .single();
          if (data) {
            setBookings(prev => [data as BookingWithPassenger, ...prev]);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "bookings",
        },
        (payload) => {
          setBookings(prev => 
            prev.map(b => b.id === payload.new.id ? { ...b, ...payload.new } : b)
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "bookings",
        },
        (payload) => {
          setBookings(prev => prev.filter(b => b.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { bookings, loading };
};
