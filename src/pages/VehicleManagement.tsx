import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Car, CheckCircle, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { z } from "zod";

const vehicleSchema = z.object({
  make: z.string().min(1, "Make is required").max(50),
  model: z.string().min(1, "Model is required").max(50),
  year: z.number().min(1990, "Year must be 1990 or later").max(new Date().getFullYear() + 1),
  color: z.string().min(1, "Color is required").max(30),
  plate_number: z.string().min(1, "Plate number is required").max(20),
  vehicle_type: z.enum(["sedan", "suv", "hatchback", "van", "motorcycle"]),
  seats_available: z.number().min(1, "At least 1 seat required").max(8, "Maximum 8 seats"),
});

const VehicleManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDriver, setIsDriver] = useState(false);
  const [vehicle, setVehicle] = useState<any>(null);

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [color, setColor] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [vehicleType, setVehicleType] = useState<string>("");
  const [seatsAvailable, setSeatsAvailable] = useState("");

  useEffect(() => {
    checkDriverRole();
  }, []);

  const checkDriverRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "driver")
      .maybeSingle();

    if (!roleData) {
      toast({
        title: "Access Denied",
        description: "Only drivers can access this page.",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    setIsDriver(true);
    await loadVehicle(user.id);
  };

  const loadVehicle = async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("vehicles")
      .select("*")
      .eq("driver_id", userId)
      .maybeSingle();

    if (!error && data) {
      setVehicle(data);
      setMake(data.make || "");
      setModel(data.model || "");
      setYear(data.year?.toString() || "");
      setColor(data.color || "");
      setPlateNumber(data.plate_number || "");
      setVehicleType(data.vehicle_type || "");
      setSeatsAvailable(data.seats_available?.toString() || "");
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const validation = vehicleSchema.safeParse({
        make,
        model,
        year: parseInt(year),
        color,
        plate_number: plateNumber,
        vehicle_type: vehicleType,
        seats_available: parseInt(seatsAvailable),
      });

      if (!validation.success) {
        throw new Error(validation.error.errors[0].message);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const vehicleData = {
        driver_id: user.id,
        make,
        model,
        year: parseInt(year),
        color,
        plate_number: plateNumber,
        vehicle_type: vehicleType as any,
        seats_available: parseInt(seatsAvailable),
        is_verified: false,
      };

      if (vehicle) {
        const { error } = await supabase
          .from("vehicles")
          .update(vehicleData)
          .eq("driver_id", user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("vehicles")
          .insert(vehicleData);

        if (error) throw error;
      }

      toast({
        title: "Vehicle Saved",
        description: "Your vehicle information has been saved successfully.",
      });

      await loadVehicle(user.id);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Manage Vehicle</h1>
            <p className="text-muted-foreground">
              Add or update your vehicle information
            </p>
          </div>
        </div>

        {vehicle && (
          <Alert className={vehicle.is_verified ? "border-green-500 bg-green-50 dark:bg-green-950" : "border-yellow-500 bg-yellow-50 dark:bg-yellow-950"}>
            {vehicle.is_verified ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <Clock className="h-4 w-4 text-yellow-600" />
            )}
            <AlertDescription className={vehicle.is_verified ? "text-green-600" : "text-yellow-600"}>
              {vehicle.is_verified
                ? "Your vehicle is verified! You can post rides."
                : "Vehicle saved. Complete driver verification to post rides."}
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5 text-primary" />
              Vehicle Information
            </CardTitle>
            <CardDescription>
              Enter your vehicle details to start offering rides
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="make">Make *</Label>
                  <Input
                    id="make"
                    placeholder="e.g., Toyota"
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model *</Label>
                  <Input
                    id="model"
                    placeholder="e.g., Corolla"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Year *</Label>
                  <Input
                    id="year"
                    type="number"
                    placeholder="e.g., 2020"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    min="1990"
                    max={new Date().getFullYear() + 1}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color *</Label>
                  <Input
                    id="color"
                    placeholder="e.g., White"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="plateNumber">Plate Number *</Label>
                <Input
                  id="plateNumber"
                  placeholder="e.g., ABC-1234"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicleType">Vehicle Type *</Label>
                  <Select value={vehicleType} onValueChange={setVehicleType} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sedan">Sedan</SelectItem>
                      <SelectItem value="suv">SUV</SelectItem>
                      <SelectItem value="hatchback">Hatchback</SelectItem>
                      <SelectItem value="van">Van</SelectItem>
                      <SelectItem value="motorcycle">Motorcycle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seats">Available Seats *</Label>
                  <Input
                    id="seats"
                    type="number"
                    placeholder="e.g., 4"
                    value={seatsAvailable}
                    onChange={(e) => setSeatsAvailable(e.target.value)}
                    min="1"
                    max="8"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Saving..." : vehicle ? "Update Vehicle" : "Add Vehicle"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {!vehicle && (
          <Card className="border-dashed">
            <CardContent className="pt-6 text-center text-muted-foreground">
              <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Add your vehicle to start posting rides</p>
              <p className="text-sm mt-1">After adding your vehicle, complete driver verification to get started</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default VehicleManagement;
