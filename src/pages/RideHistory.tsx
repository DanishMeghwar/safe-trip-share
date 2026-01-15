import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Calendar, Car, Users, RotateCcw } from "lucide-react";
import { useRideHistory } from "@/hooks/useRideHistory";
import { format } from "date-fns";

const RideHistory = () => {
  const [userId, setUserId] = useState<string>();
  const navigate = useNavigate();
  const { history, loading } = useRideHistory(userId);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUserId(user.id);
    };
    getUser();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-6 rounded-b-3xl shadow-lg mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Button variant="ghost" size="icon" className="text-primary-foreground" onClick={() => navigate("/profile")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Ride History</h1>
        </div>
        <p className="text-primary-foreground/80 text-sm ml-11">Your completed trips</p>
      </div>

      <div className="px-4 space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading history...</p>
          </div>
        ) : history.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              <Car className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>No completed trips yet</p>
              <p className="text-sm mt-1">Your ride history will appear here</p>
            </CardContent>
          </Card>
        ) : (
          history.map((item) => (
            <Card key={item.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  {item.other_party && (
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={item.other_party.avatar_url} />
                      <AvatarFallback>
                        {item.other_party.full_name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={item.type === 'driver' ? 'default' : 'secondary'}>
                          {item.type === 'driver' ? (
                            <><Car className="w-3 h-3 mr-1" /> Driver</>
                          ) : (
                            <><Users className="w-3 h-3 mr-1" /> Passenger</>
                          )}
                        </Badge>
                        {item.is_round_trip && (
                          <Badge variant="outline" className="text-xs">
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Round Trip
                          </Badge>
                        )}
                      </div>
                      <span className="font-semibold text-primary">
                        PKR {item.fare}
                      </span>
                    </div>

                    <p className="font-medium flex items-center gap-1 text-sm">
                      <MapPin className="w-3 h-3 text-primary" />
                      {item.from_location} → {item.to_location}
                    </p>

                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(item.departure_time), 'PPp')}
                    </div>

                    {item.other_party && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.type === 'driver' ? 'Passenger' : 'Driver'}: {item.other_party.full_name}
                      </p>
                    )}

                    {item.vehicle && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Car className="w-3 h-3" />
                        {item.vehicle.color} {item.vehicle.make} {item.vehicle.model}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default RideHistory;
