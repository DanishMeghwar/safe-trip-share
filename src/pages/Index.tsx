import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Car, Users, Shield, Star, MapPin } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 via-background to-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 rounded-b-[3rem]" />
        <div className="relative px-6 pt-16 pb-12 text-center">
          <div className="mx-auto w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mb-6 shadow-lg">
            <Car className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Welcome to ShareRide
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
            Safe, affordable ride sharing for daily commutes and long trips
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto">
            <Button 
              size="lg" 
              className="text-lg py-6 rounded-xl"
              onClick={() => navigate("/auth")}
            >
              Get Started
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg py-6 rounded-xl"
              onClick={() => navigate("/auth")}
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="px-6 py-16 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-12">Why ShareRide?</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-card p-6 rounded-2xl border shadow-sm">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Community Driven</h3>
            <p className="text-muted-foreground">
              Connect with verified drivers and passengers in your area. Share rides, save money, reduce traffic.
            </p>
          </div>

          <div className="bg-card p-6 rounded-2xl border shadow-sm">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Safe & Verified</h3>
            <p className="text-muted-foreground">
              CNIC and phone verification, driver license checks, and user ratings ensure your safety.
            </p>
          </div>

          <div className="bg-card p-6 rounded-2xl border shadow-sm">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Smart Matching</h3>
            <p className="text-muted-foreground">
              AI-powered route matching finds the best rides for your journey, whether daily commute or long trip.
            </p>
          </div>

          <div className="bg-card p-6 rounded-2xl border shadow-sm">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <Star className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Affordable Fares</h3>
            <p className="text-muted-foreground">
              Split costs fairly with automatic fare calculation. Save up to 70% compared to solo rides.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 py-16 text-center">
        <div className="max-w-2xl mx-auto bg-primary/5 p-8 rounded-3xl border border-primary/10">
          <h2 className="text-2xl font-bold mb-4">Ready to Start Sharing?</h2>
          <p className="text-muted-foreground mb-6">
            Join thousands of users already saving money and reducing their carbon footprint
          </p>
          <Button 
            size="lg" 
            className="text-lg py-6 px-8 rounded-xl"
            onClick={() => navigate("/auth")}
          >
            Create Account
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
