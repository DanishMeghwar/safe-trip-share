import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
// Ensure all component imports are correct
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Car, Users, Zap, UserPlus } from "lucide-react"; // Added Zap and UserPlus for a modern look
import { z } from "zod";

[span_0](start_span)// --- Zod Schemas (Preserved from original file)[span_0](end_span) ---
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
  const [activeTab, setActiveTab] = useState("signin"); // New state to manage active tab for UI
  const { toast } = useToast();

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setFullName("");
    setRole("passenger");
  };

  [span_1](start_span)// --- SignUp Logic (Preserved from original file) [cite: 245-253] ---
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
        [cite_start]// Insert profile[span_1](end_span)
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: authData.user.id,
            full_name: fullName,
          });
        if (profileError) throw profileError;

        [span_2](start_span)// Insert role[span_2](end_span)
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

  [span_3](start_span)// --- SignIn Logic (Preserved from original file) [cite: 254-260] ---
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

  // --- Modernized UI Structure ---
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      {/* Increased max height for a near-full-screen, modern feel on mobile */}
      <DrawerContent className="max-h-[95vh] h-full"> 
        {/* Content wrapper with better padding */}
        <div className="mx-auto w-full max-w-md overflow-y-auto p-6 md:p-8"> 
          
          {/* MODERNIZED HEADER */}
          <DrawerHeader className="text-center space-y-3 px-0 pb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-blue-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/30 transform transition-transform hover:scale-105">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <div className="space-y-1">
              <DrawerTitle className="text-3xl font-extrabold text-foreground tracking-tight">
                Get Moving with ShareRide
              </DrawerTitle>
              <DrawerDescription className="text-base text-muted-foreground">
                Your trusted companion for safe, affordable journeys.
              </DrawerDescription>
            </div>
          </DrawerHeader>

          {/* TABS - Updated styling for active state and size */}
          <Tabs defaultValue="signin" onValueChange={setActiveTab} className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-muted/50 rounded-xl mb-6">
              <TabsTrigger 
                value="signin" 
                className={`text-base font-semibold transition-all duration-300 ${
                  activeTab === 'signin' ? 'bg-primary text-primary-foreground shadow-lg' : 'hover:bg-accent'
                }`}
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger 
                value="signup" 
                className={`text-base font-semibold transition-all duration-300 ${
                  activeTab === 'signup' ? 'bg-primary text-primary-foreground shadow-lg' : 'hover:bg-accent'
                }`}
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            {/* SIGN IN FORM */}
            <TabsContent value="signin" className="mt-6">
              <form onSubmit={handleSignIn} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="signin-email">Email Address</Label>
                  {/* Input height increased to h-12 for modern look */}
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 border-2 focus-visible:ring-primary"
                    required
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 border-2 focus-visible:ring-primary"
                    required
                  />
                  <div className="flex justify-end">
                    <Button variant="link" className="p-0 h-auto text-sm text-primary/80 hover:text-primary">
                        Forgot Password?
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full h-12 text-lg font-bold shadow-xl shadow-primary/30" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Log In Securely"}
                </Button>
              </form>
            </TabsContent>

            {/* SIGN UP FORM */}
            <TabsContent value="signup" className="mt-6">
              <form onSubmit={handleSignUp} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-12 border-2 focus-visible:ring-primary"
                    required
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="signup-email">Email Address</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 border-2 focus-visible:ring-primary"
                    required
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 border-2 focus-visible:ring-primary"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Must be 8+ chars with uppercase, lowercase & number</p>
                </div>

                {/* ROLE SELECTION - Enhanced for better UX */}
                <div className="space-y-3 pt-2">
                  <Label className="text-base font-semibold">Choose your initial role</Label>
                  <RadioGroup 
                    value={role} 
                    onValueChange={(v) => setRole(v as any)} 
                    className="space-y-3"
                  >
                    <div className={`flex items-center space-x-3 border-2 rounded-xl p-4 cursor-pointer transition-all ${
                      role === 'passenger' ? 'border-primary shadow-md' : 'border-border hover:bg-accent/50'
                    }`}>
                      <RadioGroupItem value="passenger" id="passenger" className="w-5 h-5" />
                      <Label htmlFor="passenger" className="flex items-center gap-4 cursor-pointer flex-1">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-base">Passenger</p>
                          <p className="text-sm text-muted-foreground">Find and book safe rides</p>
                        </div>
                      </Label>
                    </div>
                    
                    <div className={`flex items-center space-x-3 border-2 rounded-xl p-4 cursor-pointer transition-all ${
                      role === 'driver' ? 'border-primary shadow-md' : 'border-border hover:bg-accent/50'
                    }`}>
                      <RadioGroupItem value="driver" id="driver" className="w-5 h-5" />
                      <Label htmlFor="driver" className="flex items-center gap-4 cursor-pointer flex-1">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Car className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-base">Driver</p>
                          <p className="text-sm text-muted-foreground">Offer rides and earn money</p>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <Button type="submit" className="w-full h-12 text-lg font-bold shadow-xl shadow-primary/30 mt-8" disabled={isLoading}>
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
