import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Car, Users } from "lucide-react";
import { z } from "zod";

const signUpSchema = z.object({
  email: z.string().email("Invalid email address").max(255, "Email too long"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password too long")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
  fullName: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name too long")
    .trim(),
});

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password required"),
});

interface AuthDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const AuthDrawer = ({ open, onOpenChange, onSuccess }: AuthDrawerProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"driver" | "passenger">("passenger");
  const { toast } = useToast();

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setFullName("");
    setRole("passenger");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validation = signUpSchema.safeParse({ email, password, fullName });
      if (!validation.success) {
        throw new Error(validation.error.errors[0].message);
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: authData.user.id,
            full_name: fullName,
          });

        if (profileError) throw profileError;

        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: authData.user.id,
            role: role,
          });

        if (roleError) throw roleError;

        toast({
          title: "Account created!",
          description: "Welcome to ShareRide",
        });

        resetForm();
        onOpenChange(false);
        onSuccess?.();
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validation = signInSchema.safeParse({ email, password });
      if (!validation.success) {
        throw new Error(validation.error.errors[0].message);
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "You've successfully signed in",
      });

      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <div className="mx-auto w-full max-w-md overflow-y-auto p-6">
          <DrawerHeader className="text-center space-y-4 px-0">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg">
              <Car className="w-8 h-8 text-white" />
            </div>
            <div className="space-y-1">
              <DrawerTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">ShareRide</DrawerTitle>
              <DrawerDescription>Your trusted companion for safe, affordable journeys</DrawerDescription>
            </div>
          </DrawerHeader>

          <Tabs defaultValue="signin" className="w-full mt-6">
            <TabsList className="grid w-full grid-cols-2 h-11 bg-muted/50">
              <TabsTrigger value="signin" className="data-[state=active]:bg-primary data-[state=active]:text-white">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-primary data-[state=active]:text-white">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-6">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email Address</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-10"
                    required
                  />
                </div>
                <Button type="submit" className="w-full h-10 shadow-lg" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-10"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email Address</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-10"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Must be 8+ chars with uppercase, lowercase & number</p>
                </div>
                <div className="space-y-3">
                  <Label>Choose your role</Label>
                  <RadioGroup value={role} onValueChange={(v) => setRole(v as any)} className="space-y-2">
                    <div className="flex items-center space-x-3 border-2 rounded-lg p-3 cursor-pointer hover:bg-accent hover:border-primary transition-all">
                      <RadioGroupItem value="passenger" id="passenger" />
                      <Label htmlFor="passenger" className="flex items-center gap-3 cursor-pointer flex-1">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Users className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Passenger</p>
                          <p className="text-xs text-muted-foreground">Find and book rides</p>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 border-2 rounded-lg p-3 cursor-pointer hover:bg-accent hover:border-primary transition-all">
                      <RadioGroupItem value="driver" id="driver" />
                      <Label htmlFor="driver" className="flex items-center gap-3 cursor-pointer flex-1">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Car className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Driver</p>
                          <p className="text-xs text-muted-foreground">Offer rides and earn money</p>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                <Button type="submit" className="w-full h-10 shadow-lg" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </DrawerContent>
    </Drawer>
  );
};