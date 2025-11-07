import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Car, Users, MapPin, Search, Settings, LogOut, Shield, Star, Activity } from "lucide-react";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const isDriver = roles.includes("driver");
  const isPassenger = roles.includes("passenger");
  const isAdmin = roles.includes("admin");

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
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

      // Note: These client-side role checks only control UI visibility.
      // Actual authorization is enforced server-side via RLS policies.
      setRoles(rolesData?.map(r => r.role) || []);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background pb-20">
      {/* Header */}
      <div className="bg-primary text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 border-2 border-white">
              <AvatarFallback className="bg-secondary text-white text-lg">
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
          <Button variant="ghost" size="icon" className="text-white" onClick={handleSignOut}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>

        {profile?.is_phone_verified && (
          <div className="flex items-center gap-2 text-sm bg-white/20 px-3 py-1.5 rounded-full w-fit">
            <Shield className="w-4 h-4" />
            <span>Verified User</span>
          </div>
        )}
      </div>

      <div className="px-4 mt-6 space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <Star className="w-8 h-8 text-warning mx-auto mb-2" />
              <p className="text-2xl font-bold">0.0</p>
              <p className="text-sm text-muted-foreground">Rating</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <MapPin className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">Trips</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold px-2">Quick Actions</h2>

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

        {/* Recent Activity */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold px-2">Recent Activity</h2>
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              <p>No recent activity</p>
              <p className="text-sm mt-1">Your trips will appear here</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
