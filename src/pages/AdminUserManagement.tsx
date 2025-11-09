import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, Shield, UserPlus, UserMinus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type UserRole = "admin" | "driver" | "passenger";

interface UserWithRoles {
  id: string;
  full_name: string;
  phone: string | null;
  roles: UserRole[];
}

export default function AdminUserManagement() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

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

  const fetchUsers = async () => {
    try {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, phone")
        .order("full_name");

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Combine the data
      const usersWithRoles: UserWithRoles[] = (profiles || []).map(profile => ({
        id: profile.id,
        full_name: profile.full_name,
        phone: profile.phone,
        roles: (userRoles || [])
          .filter(ur => ur.user_id === profile.id)
          .map(ur => ur.role as UserRole)
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    }
  };

  const addRole = async (userId: string, role: UserRole) => {
    setUpdatingUser(userId);
    try {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role });

      if (error) throw error;

      toast.success(`Added ${role} role successfully`);
      await fetchUsers();
    } catch (error: any) {
      console.error("Error adding role:", error);
      if (error.code === "23505") {
        toast.error("User already has this role");
      } else {
        toast.error("Failed to add role");
      }
    } finally {
      setUpdatingUser(null);
    }
  };

  const removeRole = async (userId: string, role: UserRole) => {
    setUpdatingUser(userId);
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);

      if (error) throw error;

      toast.success(`Removed ${role} role successfully`);
      await fetchUsers();
    } catch (error) {
      console.error("Error removing role:", error);
      toast.error("Failed to remove role");
    } finally {
      setUpdatingUser(null);
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    const variants: Record<UserRole, "default" | "secondary" | "destructive"> = {
      admin: "destructive",
      driver: "default",
      passenger: "secondary"
    };
    return variants[role];
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
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">User Management</h1>
              <p className="text-muted-foreground">Manage user roles and permissions</p>
            </div>
          </div>
          <Badge variant="default" className="text-lg px-4 py-2">
            <Users className="h-4 w-4 mr-2" />
            {users.length} Users
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              All Users & Roles
            </CardTitle>
            <CardDescription>View and manage user roles in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Current Roles</TableHead>
                    <TableHead>Add Role</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name}</TableCell>
                        <TableCell>{user.phone || "N/A"}</TableCell>
                        <TableCell>
                          <div className="flex gap-2 flex-wrap">
                            {user.roles.length === 0 ? (
                              <span className="text-muted-foreground text-sm">No roles</span>
                            ) : (
                              user.roles.map((role) => (
                                <Badge key={role} variant={getRoleBadgeVariant(role)}>
                                  {role}
                                </Badge>
                              ))
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            disabled={updatingUser === user.id}
                            onValueChange={(value) => addRole(user.id, value as UserRole)}
                          >
                            <SelectTrigger className="w-[150px]">
                              <SelectValue placeholder="Add role..." />
                            </SelectTrigger>
                            <SelectContent>
                              {!user.roles.includes("admin") && (
                                <SelectItem value="admin">Admin</SelectItem>
                              )}
                              {!user.roles.includes("driver") && (
                                <SelectItem value="driver">Driver</SelectItem>
                              )}
                              {!user.roles.includes("passenger") && (
                                <SelectItem value="passenger">Passenger</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {user.roles.map((role) => (
                              <Button
                                key={role}
                                variant="ghost"
                                size="sm"
                                disabled={updatingUser === user.id}
                                onClick={() => removeRole(user.id, role)}
                              >
                                <UserMinus className="h-4 w-4 mr-1" />
                                Remove {role}
                              </Button>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
