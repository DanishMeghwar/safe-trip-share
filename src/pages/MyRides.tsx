import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, MapPin, Users, Edit, Car, RotateCcw, Clock } from "lucide-react";
import { useDriverRides } from "@/hooks/useDriverRides";
import { format } from "date-fns";

const MyRides = () => {
  const [userId, setUserId] = useState<string>();
  const navigate = useNavigate();
  const { upcomingRides, completedRides, cancelledRides, loading } = useDriverRides(userId);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500';
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-gray-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const RideCard = ({ ride }: { ride: any }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            {ride.from_location}
          </CardTitle>
          <Badge className={getStatusColor(ride.status)}>{ride.status}</Badge>
        </div>
        <p className="text-sm text-muted-foreground flex items-center gap-1">
          → {ride.to_location}
          {ride.is_round_trip && (
            <RotateCcw className="w-3 h-3 text-primary ml-2" />
          )}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {format(new Date(ride.departure_time), 'PP')}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {format(new Date(ride.departure_time), 'p')}
          </span>
        </div>

        {ride.is_round_trip && ride.return_time && (
          <p className="text-xs text-primary flex items-center gap-1">
            <RotateCcw className="w-3 h-3" />
            Return: {format(new Date(ride.return_time), 'PP p')}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {ride.confirmed_bookings || 0}/{ride.available_seats} seats
            </span>
            <span className="font-semibold text-primary">
              PKR {ride.fare_per_seat}/seat
            </span>
          </div>
          
          {ride.vehicle && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Car className="w-3 h-3" />
              {ride.vehicle.make} {ride.vehicle.model}
            </span>
          )}
        </div>

        {(ride.status === 'scheduled' || ride.status === 'active') && (
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => navigate(`/edit-ride/${ride.id}`)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              className="flex-1"
              onClick={() => navigate(`/ride/${ride.id}`)}
            >
              View Details
            </Button>
          </div>
        )}

        {ride.status === 'completed' && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => navigate(`/ride/${ride.id}`)}
          >
            View Summary
          </Button>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-6 rounded-b-3xl shadow-lg mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Button variant="ghost" size="icon" className="text-primary-foreground" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">My Rides</h1>
        </div>
        <p className="text-primary-foreground/80 text-sm ml-11">Manage your posted rides</p>
      </div>

      <div className="px-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading rides...</p>
          </div>
        ) : (
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="upcoming">
                Upcoming ({upcomingRides.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({completedRides.length})
              </TabsTrigger>
              <TabsTrigger value="cancelled">
                Cancelled ({cancelledRides.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-4">
              {upcomingRides.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    <Car className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>No upcoming rides</p>
                    <Button 
                      className="mt-4" 
                      onClick={() => navigate("/post-ride")}
                    >
                      Post a Ride
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                upcomingRides.map(ride => (
                  <RideCard key={ride.id} ride={ride} />
                ))
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {completedRides.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    <p>No completed rides yet</p>
                  </CardContent>
                </Card>
              ) : (
                completedRides.map(ride => (
                  <RideCard key={ride.id} ride={ride} />
                ))
              )}
            </TabsContent>

            <TabsContent value="cancelled" className="space-y-4">
              {cancelledRides.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    <p>No cancelled rides</p>
                  </CardContent>
                </Card>
              ) : (
                cancelledRides.map(ride => (
                  <RideCard key={ride.id} ride={ride} />
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default MyRides;
