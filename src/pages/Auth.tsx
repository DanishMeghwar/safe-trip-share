import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Car, Users, Mail, Lock, User, MapPin, Navigation } from "lucide-react";
import { z } from "zod";
import { motion } from "framer-motion";

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
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"driver" | "passenger">("passenger");

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
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Optimized Background - CSS only, no JS animations */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary/20" />
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cpath d='M36 18c3.314 0 6 2.686 6 6s-2.686 6-6 6-6-2.686-6-6 2.686-6 6-6m0 2c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z' fill='currentColor' fill-opacity='.05'/%3E%3C/g%3E%3C/svg%3E")`
      }} />
      
      {/* Static decorative elements - no animations for better performance */}
      <div className="absolute top-20 left-10 w-16 h-16 bg-primary/10 rounded-full blur-xl" />
      <div className="absolute bottom-20 right-10 w-24 h-24 bg-secondary/10 rounded-full blur-xl" />
      <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-accent/10 rounded-full blur-xl" />

      {/* Content Container */}
      <div className="relative min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
          
          {/* Left Side - Branding - Simplified animation */}
          <div className="hidden lg:block space-y-8 animate-fade-in">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-3 bg-primary/10 backdrop-blur-sm px-6 py-3 rounded-full border border-primary/20">
                <Car className="w-6 h-6 text-primary" />
                <span className="text-2xl font-bold text-primary">ShareRide</span>
              </div>
              <h1 className="text-5xl font-bold text-foreground leading-tight">
                Your Journey,<br />
                <span className="text-primary">Shared & Safe</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-md">
                Join thousands of commuters who save money, reduce traffic, and make meaningful connections every day.
              </p>
            </div>

            {/* Feature Pills */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 bg-card/50 backdrop-blur-sm px-4 py-3 rounded-xl border">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Smart Route Matching</p>
                  <p className="text-xs text-muted-foreground">AI-powered ride optimization</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-card/50 backdrop-blur-sm px-4 py-3 rounded-xl border">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Verified Community</p>
                  <p className="text-xs text-muted-foreground">CNIC & license verification</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-card/50 backdrop-blur-sm px-4 py-3 rounded-xl border">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Navigation className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Real-time Tracking</p>
                  <p className="text-xs text-muted-foreground">Live location sharing for safety</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Auth Form - CSS animation */}
          <div className="w-full animate-fade-in" style={{ animationDelay: '0.1s' }}>
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-primary/10 backdrop-blur-sm px-5 py-2 rounded-full border border-primary/20 mb-4">
                <Car className="w-5 h-5 text-primary" />
                <span className="text-xl font-bold text-primary">ShareRide</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground">Your Journey Starts Here</h2>
            </div>

            {/* Auth Card */}
            <div className="bg-card/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-border/50 p-8">
              {/* Toggle Buttons */}
              <div className="flex gap-2 mb-8 p-1 bg-muted/30 rounded-2xl">
                <button
                  onClick={() => setIsSignUp(false)}
                  className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                    !isSignUp
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setIsSignUp(true)}
                  className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                    isSignUp
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Forms */}
              {!isSignUp ? (
                <form onSubmit={handleSignIn} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-12 h-12 bg-background/50 border-border/50 focus:border-primary rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-12 h-12 bg-background/50 border-border/50 focus:border-primary rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold rounded-xl"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="link"
                    className="w-full text-muted-foreground"
                    onClick={() => navigate("/forgot-password")}
                  >
                    Forgot your password?
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleSignUp} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-12 h-12 bg-background/50 border-border/50 focus:border-primary rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-12 h-12 bg-background/50 border-border/50 focus:border-primary rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-12 h-12 bg-background/50 border-border/50 focus:border-primary rounded-xl"
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      8+ chars with uppercase, lowercase & number
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label>Choose your role</Label>
                    <RadioGroup value={role} onValueChange={(v) => setRole(v as any)} className="grid grid-cols-2 gap-3">
                      <Label
                        htmlFor="passenger"
                        className={`flex flex-col items-center gap-2 border-2 rounded-xl p-4 cursor-pointer transition-all ${
                          role === "passenger"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <RadioGroupItem value="passenger" id="passenger" className="sr-only" />
                        <Users className="w-8 h-8 text-primary" />
                        <div className="text-center">
                          <p className="font-semibold text-sm">Passenger</p>
                          <p className="text-xs text-muted-foreground">Find rides</p>
                        </div>
                      </Label>

                      <Label
                        htmlFor="driver"
                        className={`flex flex-col items-center gap-2 border-2 rounded-xl p-4 cursor-pointer transition-all ${
                          role === "driver"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <RadioGroupItem value="driver" id="driver" className="sr-only" />
                        <Car className="w-8 h-8 text-primary" />
                        <div className="text-center">
                          <p className="font-semibold text-sm">Driver</p>
                          <p className="text-xs text-muted-foreground">Offer rides</p>
                        </div>
                      </Label>
                    </RadioGroup>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold rounded-xl"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
