import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Car, Users, Mail, Lock, User, Phone, CreditCard } from "lucide-react";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";

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
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [role, setRole] = useState<"driver" | "passenger">("passenger");
  const { toast } = useToast();

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setFullName("");
    setRole("passenger");
    setRememberMe(false);
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
      <DrawerContent className="max-h-[95vh] border-none">
        {/* Glassmorphism backdrop */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5 backdrop-blur-3xl" />
        
        <div className="relative mx-auto w-full max-w-md overflow-y-auto px-6 py-8">
          {/* Logo Section */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-4 mb-8"
          >
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary via-primary/90 to-primary/70 rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/20 ring-4 ring-primary/10">
              <Car className="w-10 h-10 text-primary-foreground" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
                ShareRide
              </h1>
              <p className="text-sm text-muted-foreground">Your trusted companion for safe journeys</p>
            </div>
          </motion.div>

          {/* Auth Forms Container */}
          <div className="relative bg-card/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-border/50 p-6 overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/5 rounded-full blur-3xl -z-10" />

            {/* Toggle Buttons */}
            <div className="flex gap-2 mb-6 p-1 bg-muted/30 rounded-2xl backdrop-blur-sm">
              <button
                onClick={() => setIsSignUp(false)}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
                  !isSignUp
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setIsSignUp(true)}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
                  isSignUp
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Forms with Animation */}
            <AnimatePresence mode="wait">
              {!isSignUp ? (
                <motion.form
                  key="signin"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleSignIn}
                  className="space-y-5"
                >
                  {/* Email Input */}
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-sm font-medium">Email Address</Label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-12 h-12 bg-background/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl transition-all"
                        required
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-sm font-medium">Password</Label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-12 h-12 bg-background/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl transition-all"
                        required
                      />
                    </div>
                  </div>

                  {/* Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remember"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                        className="rounded-md"
                      />
                      <label
                        htmlFor="remember"
                        className="text-sm font-medium cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Remember me
                      </label>
                    </div>
                    <button
                      type="button"
                      className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                      onClick={() => toast({ title: "Password reset coming soon!" })}
                    >
                      Forgot Password?
                    </button>
                  </div>

                  {/* Sign In Button */}
                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all hover:scale-[1.02] rounded-xl"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full"
                      />
                    ) : (
                      "Sign In"
                    )}
                  </Button>

                  {/* Switch to Sign Up */}
                  <p className="text-center text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setIsSignUp(true)}
                      className="font-semibold text-primary hover:text-primary/80 transition-colors"
                    >
                      Sign Up
                    </button>
                  </p>
                </motion.form>
              ) : (
                <motion.form
                  key="signup"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleSignUp}
                  className="space-y-5"
                >
                  {/* Full Name Input */}
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-sm font-medium">Full Name</Label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-12 h-12 bg-background/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl transition-all"
                        required
                      />
                    </div>
                  </div>

                  {/* Email Input */}
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-sm font-medium">Email Address</Label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-12 h-12 bg-background/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl transition-all"
                        required
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-sm font-medium">Password</Label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-12 h-12 bg-background/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl transition-all"
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground pl-1">
                      8+ chars with uppercase, lowercase & number
                    </p>
                  </div>

                  {/* Role Selection */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Choose your role</Label>
                    <RadioGroup value={role} onValueChange={(v) => setRole(v as any)} className="space-y-3">
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`flex items-center space-x-3 border-2 rounded-xl p-4 cursor-pointer transition-all ${
                          role === "passenger"
                            ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                            : "border-border/50 hover:border-primary/50 hover:bg-accent/50"
                        }`}
                      >
                        <RadioGroupItem value="passenger" id="passenger" />
                        <Label htmlFor="passenger" className="flex items-center gap-3 cursor-pointer flex-1">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                            role === "passenger" ? "bg-primary/20" : "bg-primary/10"
                          }`}>
                            <Users className={`w-5 h-5 ${role === "passenger" ? "text-primary" : "text-primary/60"}`} />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">Passenger</p>
                            <p className="text-xs text-muted-foreground">Find and book rides</p>
                          </div>
                        </Label>
                      </motion.div>

                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`flex items-center space-x-3 border-2 rounded-xl p-4 cursor-pointer transition-all ${
                          role === "driver"
                            ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                            : "border-border/50 hover:border-primary/50 hover:bg-accent/50"
                        }`}
                      >
                        <RadioGroupItem value="driver" id="driver" />
                        <Label htmlFor="driver" className="flex items-center gap-3 cursor-pointer flex-1">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                            role === "driver" ? "bg-primary/20" : "bg-primary/10"
                          }`}>
                            <Car className={`w-5 h-5 ${role === "driver" ? "text-primary" : "text-primary/60"}`} />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">Driver</p>
                            <p className="text-xs text-muted-foreground">Offer rides and earn money</p>
                          </div>
                        </Label>
                      </motion.div>
                    </RadioGroup>
                  </div>

                  {/* Sign Up Button */}
                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all hover:scale-[1.02] rounded-xl"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full"
                      />
                    ) : (
                      "Create Account"
                    )}
                  </Button>

                  {/* Switch to Sign In */}
                  <p className="text-center text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setIsSignUp(false)}
                      className="font-semibold text-primary hover:text-primary/80 transition-colors"
                    >
                      Sign In
                    </button>
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};