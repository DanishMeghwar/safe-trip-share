import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Phone, CreditCard, Shield, FileCheck, Car, Camera } from "lucide-react";
import { z } from "zod";
import { VerificationBadges } from "@/components/VerificationBadges";

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
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [phone, setPhone] = useState("");
  const [cnic, setCnic] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [driverVerified, setDriverVerified] = useState(false);
  const [hasVehicle, setHasVehicle] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const isDriver = roles.includes("driver");

  useEffect(() => {
    loadProfile();
    loadRoles();
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

      // Check driver verification status
      const { data: driverDocs } = await supabase
        .from("driver_documents")
        .select("is_verified")
        .eq("driver_id", user.id)
        .maybeSingle();

      setDriverVerified(driverDocs?.is_verified || false);

      // Check if user has a vehicle
      const { data: vehicleData } = await supabase
        .from("vehicles")
        .select("id")
        .eq("driver_id", user.id)
        .maybeSingle();

      setHasVehicle(!!vehicleData);
    } catch (error: any) {
      console.error("Error loading profile:", error);
    }
  };

  const loadRoles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      setRoles(rolesData?.map(r => r.role) || []);
    } catch (error: any) {
      console.error("Error loading roles:", error);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please upload an image file",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Image must be less than 5MB",
      });
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Profile picture updated",
      });

      loadProfile();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
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
      <div className="bg-primary text-primary-foreground p-6 rounded-b-3xl shadow-lg mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Button variant="ghost" size="icon" className="text-primary-foreground" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Profile & Verification</h1>
        </div>
        <p className="text-primary-foreground/80 text-sm ml-11">Complete your profile for better trust</p>
      </div>

      <div className="px-4 space-y-4">
        {/* Profile Picture */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="w-32 h-32 border-4 border-primary/20">
                  <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-4xl">
                    {profile?.full_name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <label 
                  htmlFor="avatar-upload" 
                  className="absolute bottom-0 right-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-primary/90 transition-colors"
                >
                  <Camera className="w-5 h-5 text-primary-foreground" />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold">{profile?.full_name}</h2>
                <p className="text-sm text-muted-foreground mb-2">
                  {uploading ? "Uploading..." : "Tap camera icon to change"}
                </p>
                <VerificationBadges 
                  isPhoneVerified={profile?.is_phone_verified}
                  isCnicVerified={profile?.is_cnic_verified}
                  isDriverVerified={driverVerified}
                />
              </div>
            </div>
          </CardContent>
        </Card>

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
              <span className={profile?.is_phone_verified ? "text-green-600" : "text-muted-foreground"}>
                {profile?.is_phone_verified ? "✓ Verified" : "Not Verified"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>CNIC</span>
              <span className={profile?.is_cnic_verified ? "text-green-600" : "text-muted-foreground"}>
                {profile?.is_cnic_verified ? "✓ Verified" : "Not Verified"}
              </span>
            </div>
            {isDriver && (
              <div className="flex items-center justify-between">
                <span>Driver Documents</span>
                <span className={driverVerified ? "text-green-600" : "text-muted-foreground"}>
                  {driverVerified ? "✓ Verified" : "Not Verified"}
                </span>
              </div>
            )}
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

        {/* Driver Vehicle Management */}
        {isDriver && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="w-5 h-5 text-primary" />
                Vehicle Management
              </CardTitle>
              <CardDescription>
                {hasVehicle ? "Update your vehicle information" : "Add your vehicle to start posting rides"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant={hasVehicle ? "outline" : "default"}
                className="w-full" 
                onClick={() => navigate("/vehicle")}
              >
                <Car className="w-4 h-4 mr-2" />
                {hasVehicle ? "Edit Vehicle" : "Add Vehicle"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Document Verification */}
        <Card>
          <CardHeader>
            <CardTitle>Document Verification</CardTitle>
            <CardDescription>Upload and verify your documents</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start" 
              onClick={() => navigate("/passenger-verification")}
            >
              <FileCheck className="w-4 h-4 mr-2" />
              Verify CNIC
            </Button>
            {isDriver && (
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={() => navigate("/driver-verification")}
              >
                <Car className="w-4 h-4 mr-2" />
                Verify Driver Documents
              </Button>
            )}
            <p className="text-xs text-muted-foreground text-center">
              Complete verification to unlock all features
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
