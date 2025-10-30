import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Phone, CreditCard, Shield, Upload } from "lucide-react";
import { z } from "zod";

const profileSchema = z.object({
  phone: z.string()
    .regex(/^(\+92|0)?3[0-9]{9}$/, "Invalid Pakistani phone number (e.g., 03001234567)")
    .or(z.literal("")),
  cnic: z.string()
    .regex(/^[0-9]{5}-[0-9]{7}-[0-9]$/, "CNIC must be in format XXXXX-XXXXXXX-X")
    .or(z.literal("")),
});

const Profile = () => {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [phone, setPhone] = useState("");
  const [cnic, setCnic] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setPhone(data?.phone || "");
      setCnic(data?.cnic || "");
    } catch (error: any) {
      console.error("Error loading profile:", error);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate input
      const validation = profileSchema.safeParse({ phone, cnic });
      if (!validation.success) {
        throw new Error(validation.error.errors[0].message);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({
          phone,
          cnic,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      });

      loadProfile();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="bg-primary text-white p-6 rounded-b-3xl shadow-lg mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Button variant="ghost" size="icon" className="text-white" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Profile & Verification</h1>
        </div>
        <p className="text-white/80 text-sm ml-11">Complete your profile for better trust</p>
      </div>

      <div className="px-4 space-y-4">
        {/* Verification Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="w-5 h-5 text-primary" />
              Verification Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Phone Number</span>
              <span className={profile?.is_phone_verified ? "text-success" : "text-muted-foreground"}>
                {profile?.is_phone_verified ? "✓ Verified" : "Not Verified"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>CNIC</span>
              <span className={profile?.is_cnic_verified ? "text-success" : "text-muted-foreground"}>
                {profile?.is_cnic_verified ? "✓ Verified" : "Not Verified"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your contact details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+92 300 1234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  OTP verification coming soon
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnic" className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" />
                  CNIC Number
                </Label>
                <Input
                  id="cnic"
                  placeholder="12345-1234567-1"
                  value={cnic}
                  onChange={(e) => setCnic(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Keep your CNIC private and secure
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Saving..." : "Save Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Document Upload Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Document Verification</CardTitle>
            <CardDescription>Upload documents for verification (Coming Soon)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start" disabled>
              <Upload className="w-4 h-4 mr-2" />
              Upload CNIC Front
            </Button>
            <Button variant="outline" className="w-full justify-start" disabled>
              <Upload className="w-4 h-4 mr-2" />
              Upload CNIC Back
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Document upload will be available soon
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
