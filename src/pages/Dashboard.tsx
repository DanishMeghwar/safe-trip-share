import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Car, Users, MapPin, Search, Settings, LogOut, Star, Activity, FileCheck, MessageCircle } from "lucide-react";
import VerificationNotifications from "@/components/VerificationNotifications";
import { VerificationBadges } from "@/components/VerificationBadges";
import { useRealtimeBookings } from "@/hooks/useRealtimeBookings";
import { useUserStats } from "@/hooks/useUserStats";
import { format } from "date-fns";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [driverVerified, setDriverVerified] = useState(false);
  const [hasVehicle, setHasVehicle] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { bookings } = useRealtimeBookings(user?.id);
  const { rating, totalTrips, loading: statsLoading } = useUserStats(user?.id);

  const isDriver = roles.includes("driver");
  const isPassenger = roles.includes("passenger");
  const isAdmin = roles.includes("admin");

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setLoading(false);
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      await loadUserData(session.user.id);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadUserData(session.user.id);
        } else {
          navigate("/auth");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadUserData = async (userId: string) => {
    try {
      // Load profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      setProfile(profileData);

      // Load roles
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      const userRoles = rolesData?.map(r => r.role) || [];
      setRoles(userRoles);

      // Check driver verification if user is a driver
      if (userRoles.includes("driver")) {
        const { data: driverDocs } = await supabase
          .from("driver_documents")
          .select("is_verified")
          .eq("driver_id", userId)
          .maybeSingle();

        setDriverVerified(driverDocs?.is_verified || false);

        // Check if user has a vehicle
        const { data: vehicleData } = await supabase
          .from("vehicles")
          .select("id")
          .eq("driver_id", userId)
          .maybeSingle();

        setHasVehicle(!!vehicleData);
      }
    } catch (error: any) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background pb-20">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 border-2 border-primary-foreground/20">
              <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} />
              <AvatarFallback className="bg-secondary text-secondary-foreground text-lg">
                {profile?.full_name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold">{profile?.full_name || "User"}</h1>
              <div className="flex gap-2 mt-1">
                {isDriver && (
                  <Badge variant="secondary" className="text-xs">
                    <Car className="w-3 h-3 mr-1" />
                    Driver
                  </Badge>
                )}
                {isPassenger && (
                  <Badge variant="secondary" className="text-xs">
                    <Users className="w-3 h-3 mr-1" />
                    Passenger
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <VerificationNotifications />
            <Button variant="ghost" size="icon" className="text-primary-foreground" onClick={handleSignOut}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Verification Badges */}
        <div className="mt-2">
          <VerificationBadges 
            isPhoneVerified={profile?.is_phone_verified}
            isCnicVerified={profile?.is_cnic_verified}
            isDriverVerified={driverVerified}
            size="sm"
          />
        </div>
      </div>

      <div className="px-4 mt-6 space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{statsLoading ? "..." : rating.toFixed(1)}</p>
              <p className="text-sm text-muted-foreground">Rating</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <MapPin className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{statsLoading ? "..." : totalTrips}</p>
              <p className="text-sm text-muted-foreground">Trips</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold px-2">Quick Actions</h2>

          {/* Driver: Vehicle Management (show first if no vehicle) */}
          {isDriver && !hasVehicle && (
            <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-orange-400" onClick={() => navigate("/vehicle")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Car className="w-5 h-5 text-orange-500" />
                  Add Your Vehicle
                </CardTitle>
                <CardDescription>
                  Required to post rides - add your vehicle details first
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {/* Driver: Verification */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate(isDriver ? "/driver-verification" : "/passenger-verification")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileCheck className="w-5 h-5 text-primary" />
                {isDriver ? "Verify Driver Documents" : "Verify CNIC"}
              </CardTitle>
              <CardDescription>
                {isDriver ? "Upload your license and vehicle documents" : "Complete identity verification"}
              </CardDescription>
            </CardHeader>
          </Card>

          {isPassenger && (
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/search-rides")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Search className="w-5 h-5 text-primary" />
                  Search for Rides
                </CardTitle>
                <CardDescription>Find available rides near you</CardDescription>
              </CardHeader>
            </Card>
          )}

          {isDriver && (
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/post-ride")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Car className="w-5 h-5 text-primary" />
                  Post a Ride
                </CardTitle>
                <CardDescription>Offer a ride and earn money</CardDescription>
              </CardHeader>
            </Card>
          )}

          {isDriver && hasVehicle && (
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/vehicle")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Car className="w-5 h-5 text-primary" />
                  Manage Vehicle
                </CardTitle>
                <CardDescription>Update your vehicle information</CardDescription>
              </CardHeader>
            </Card>
          )}

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/profile")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="w-5 h-5 text-primary" />
                Complete Your Profile
              </CardTitle>
              <CardDescription>Add phone, CNIC, and verify your account</CardDescription>
            </CardHeader>
          </Card>

          {isAdmin && (
            <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-primary" onClick={() => navigate("/admin")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="w-5 h-5 text-primary" />
                  Admin Dashboard
                </CardTitle>
                <CardDescription>Monitor real-time ride activity</CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>

        {/* My Bookings */}
        {isPassenger && bookings.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold px-2">My Bookings</h2>
            {bookings.slice(0, 3).map((booking: any) => (
              <Card key={booking.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate(`/booking/${booking.id}`)}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{booking.ride?.from_location} → {booking.ride?.to_location}</CardTitle>
                    <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                      {booking.status}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-2 mt-2">
                    <MapPin className="h-4 w-4" />
                    {booking.ride?.departure_time && format(new Date(booking.ride.departure_time), 'PPp')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Seats: {booking.seats_requested}</span>
                    <Button variant="outline" size="sm" onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/booking/${booking.id}`);
                    }}>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Chat
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Recent Activity */}
        {bookings.length === 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold px-2">Recent Activity</h2>
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <p>No recent activity</p>
                <p className="text-sm mt-1">Your trips will appear here</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
