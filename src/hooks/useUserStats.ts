import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UserStats {
  rating: number;
  totalTrips: number;
  loading: boolean;
}

export const useUserStats = (userId: string | undefined): UserStats => {
  const [stats, setStats] = useState<UserStats>({
    rating: 0,
    totalTrips: 0,
    loading: true,
  });

  useEffect(() => {
    if (!userId) {
      setStats(prev => ({ ...prev, loading: false }));
      return;
    }

    const fetchStats = async () => {
      try {
        // Count completed trips (as passenger)
        const { count: passengerTrips } = await supabase
          .from("bookings")
          .select("*", { count: "exact", head: true })
          .eq("passenger_id", userId)
          .eq("status", "completed");

        // Count completed trips (as driver)
        const { count: driverTrips } = await supabase
          .from("rides")
          .select("*", { count: "exact", head: true })
          .eq("driver_id", userId)
          .eq("status", "completed");

        // Get average rating (as reviewed user)
        const { data: reviews } = await supabase
          .from("reviews")
          .select("rating")
          .eq("reviewed_id", userId);

        const avgRating = reviews && reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;

        setStats({
          rating: Math.round(avgRating * 10) / 10,
          totalTrips: (passengerTrips || 0) + (driverTrips || 0),
          loading: false,
        });
      } catch (error) {
        console.error("Error fetching user stats:", error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, [userId]);

  return stats;
};
