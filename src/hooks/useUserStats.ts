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
        // Parallel fetch for better performance
        const [passengerResult, driverResult, reviewsResult] = await Promise.all([
          supabase.from("bookings").select("*", { count: "exact", head: true }).eq("passenger_id", userId).eq("status", "completed"),
          supabase.from("rides").select("*", { count: "exact", head: true }).eq("driver_id", userId).eq("status", "completed"),
          supabase.from("reviews").select("rating").eq("reviewed_id", userId)
        ]);

        const avgRating = reviewsResult.data && reviewsResult.data.length > 0
          ? reviewsResult.data.reduce((sum, r) => sum + r.rating, 0) / reviewsResult.data.length
          : 0;

        setStats({
          rating: Math.round(avgRating * 10) / 10,
          totalTrips: (passengerResult.count || 0) + (driverResult.count || 0),
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
