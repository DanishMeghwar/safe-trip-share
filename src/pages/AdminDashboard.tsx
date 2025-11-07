import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeRides } from "@/hooks/useRealtimeRides";
import { useRealtimeBookingsAll } from "@/hooks/useRealtimeBookingsAll";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Car, Users, Activity, TrendingUp } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRides: 0,
    activeRides: 0,
    totalBookings: 0,
    pendingBookings: 0
  });

  const { rides } = useRealtimeRides();
  const { bookings: allBookings } = useRealtimeBookingsAll();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (rides.length > 0 || allBookings.length > 0) {
      setStats({
        totalRides: rides.length,
        activeRides: rides.filter(r => r.status === 'active').length,
        totalBookings: allBookings.length,
        pendingBookings: allBookings.filter(b => b.status === 'pending').length
      });
    }
  }, [rides, allBookings]);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const hasAdminRole = roles?.some(r => r.role === "admin");
      
      if (!hasAdminRole) {
        navigate("/");
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error("Admin check error:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      scheduled: "secondary",
      active: "default",
      completed: "secondary",
      cancelled: "destructive",
      pending: "secondary",
      confirmed: "default",
      rejected: "destructive"
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">Monitor real-time ride activity</p>
            </div>
          </div>
          <Badge variant="default" className="text-lg px-4 py-2">
            <Activity className="h-4 w-4 mr-2" />
            Live
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rides</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRides}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Rides</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activeRides}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBookings}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Bookings</CardTitle>
              <Users className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.pendingBookings}</div>
            </CardContent>
          </Card>
        </div>

        {/* Real-time Rides Table */}
        <Card>
          <CardHeader>
            <CardTitle>Real-Time Rides</CardTitle>
            <CardDescription>All rides updating in real-time</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Departure</TableHead>
                  <TableHead>Seats</TableHead>
                  <TableHead>Fare</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rides.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No rides available
                    </TableCell>
                  </TableRow>
                ) : (
                  rides.map((ride) => (
                    <TableRow key={ride.id}>
                      <TableCell className="font-medium">
                        {ride.driver?.full_name || "Unknown"}
                      </TableCell>
                      <TableCell>{ride.from_location}</TableCell>
                      <TableCell>{ride.to_location}</TableCell>
                      <TableCell>
                        {format(new Date(ride.departure_time), "MMM dd, HH:mm")}
                      </TableCell>
                      <TableCell>{ride.available_seats}</TableCell>
                      <TableCell>Rs. {ride.fare_per_seat}</TableCell>
                      <TableCell>{getStatusBadge(ride.status || "scheduled")}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Real-time Bookings Table */}
        <Card>
          <CardHeader>
            <CardTitle>Real-Time Bookings</CardTitle>
            <CardDescription>All bookings updating in real-time</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Passenger</TableHead>
                  <TableHead>Pickup</TableHead>
                  <TableHead>Seats</TableHead>
                  <TableHead>Fare</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No bookings available
                    </TableCell>
                  </TableRow>
                ) : (
                  allBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">
                        Passenger ID: {booking.passenger_id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>{booking.pickup_location || "N/A"}</TableCell>
                      <TableCell>{booking.seats_requested}</TableCell>
                      <TableCell>Rs. {booking.total_fare}</TableCell>
                      <TableCell>{getStatusBadge(booking.status || "pending")}</TableCell>
                      <TableCell>
                        {format(new Date(booking.created_at || new Date()), "MMM dd, HH:mm")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
