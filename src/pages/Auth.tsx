import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"driver" | "passenger">("passenger");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate input
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
        // Create profile
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: authData.user.id,
            full_name: fullName,
          });

        if (profileError) throw profileError;

        // Add role
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

        navigate("/");
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
      // Validate input
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

      navigate("/");
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
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-primary/70 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      <Card className="w-full max-w-md backdrop-blur-sm bg-background/95 shadow-2xl border-primary/20 relative z-10">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
            <Car className="w-10 h-10 text-white" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">ShareRide</CardTitle>
            <CardDescription className="text-base">Your trusted companion for safe, affordable journeys</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pb-8">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-12 bg-muted/50">
              <TabsTrigger value="signin" className="text-base data-[state=active]:bg-primary data-[state=active]:text-white">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="text-base data-[state=active]:bg-primary data-[state=active]:text-white">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-6">
              <form onSubmit={handleSignIn} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="signin-email" className="text-base">Email Address</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password" className="text-base">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11"
                    required
                  />
                </div>
                <Button type="submit" className="w-full h-11 text-base shadow-lg" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <form onSubmit={handleSignUp} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="text-base">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-11"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-base">Email Address</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-base">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Must be 8+ chars with uppercase, lowercase & number</p>
                </div>
                <div className="space-y-3">
                  <Label className="text-base">Choose your role</Label>
                  <RadioGroup value={role} onValueChange={(v) => setRole(v as any)} className="space-y-3">
                    <div className="flex items-center space-x-3 border-2 rounded-xl p-4 cursor-pointer hover:bg-accent hover:border-primary transition-all">
                      <RadioGroupItem value="passenger" id="passenger" />
                      <Label htmlFor="passenger" className="flex items-center gap-3 cursor-pointer flex-1">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Passenger</p>
                          <p className="text-xs text-muted-foreground">Find and book rides</p>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 border-2 rounded-xl p-4 cursor-pointer hover:bg-accent hover:border-primary transition-all">
                      <RadioGroupItem value="driver" id="driver" />
                      <Label htmlFor="driver" className="flex items-center gap-3 cursor-pointer flex-1">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Car className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Driver</p>
                          <p className="text-xs text-muted-foreground">Offer rides and earn money</p>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                <Button type="submit" className="w-full h-11 text-base shadow-lg" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
