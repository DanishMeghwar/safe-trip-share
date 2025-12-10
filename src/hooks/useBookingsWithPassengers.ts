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

    // Subscribe to realtime updates
    const channel = supabase
      .channel("admin-bookings-with-passengers")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
        },
        () => {
          // Refetch on any change
          fetchBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { bookings, loading };
};
