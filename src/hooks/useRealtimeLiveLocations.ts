import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type LiveLocation = Database["public"]["Tables"]["live_locations"]["Row"];

export const useRealtimeLiveLocations = (rideId: string | undefined) => {
  const [locations, setLocations] = useState<LiveLocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!rideId) {
      setLoading(false);
      return;
    }

    // Initial fetch
    const fetchLocations = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("live_locations")
        .select("*")
        .eq("ride_id", rideId);

      if (error) {
        console.error("Error fetching live locations:", error);
      } else if (data) {
        setLocations(data);
      }
      setLoading(false);
    };

    fetchLocations();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`live-locations-${rideId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "live_locations",
          filter: `ride_id=eq.${rideId}`,
        },
        (payload) => {
          console.log("Live location update:", payload.eventType);

          if (payload.eventType === "INSERT") {
            setLocations((current) => {
              // Replace if same user, otherwise add
              const newLoc = payload.new as LiveLocation;
              const filtered = current.filter(
                (loc) => loc.user_id !== newLoc.user_id
              );
              return [...filtered, newLoc];
            });
          } else if (payload.eventType === "UPDATE") {
            setLocations((current) =>
              current.map((loc) =>
                loc.id === payload.new.id ? (payload.new as LiveLocation) : loc
              )
            );
          } else if (payload.eventType === "DELETE") {
            setLocations((current) =>
              current.filter((loc) => loc.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe((status) => {
        console.log("Live locations subscription:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rideId]);

  return { locations, loading };
};

export default useRealtimeLiveLocations;
