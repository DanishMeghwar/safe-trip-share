import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, CheckCircle, Clock, XCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function DriverVerification() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDriver, setIsDriver] = useState(false);
  const [driverDocs, setDriverDocs] = useState<any>(null);
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseExpiry, setLicenseExpiry] = useState("");
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [registrationFile, setRegistrationFile] = useState<File | null>(null);

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
      navigate("/dashboard");
      return;
    }

    setIsDriver(true);
    await loadDriverDocuments(user.id);
  };

  const loadDriverDocuments = async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("driver_documents")
      .select("*")
      .eq("driver_id", userId)
      .maybeSingle();

    if (!error && data) {
      setDriverDocs(data);
      setLicenseNumber(data.license_number || "");
      setLicenseExpiry(data.license_expiry || "");
    }
    setLoading(false);
  };

  const uploadFile = async (file: File, bucket: string, userId: string) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!licenseNumber || !licenseExpiry) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let licenseImageUrl = driverDocs?.license_image_url;
      let vehicleRegistrationUrl = driverDocs?.vehicle_registration_url;

      if (licenseFile) {
        licenseImageUrl = await uploadFile(licenseFile, "driver-licenses", user.id);
      }

      if (registrationFile) {
        vehicleRegistrationUrl = await uploadFile(registrationFile, "vehicle-registrations", user.id);
      }

      const docData = {
        driver_id: user.id,
        license_number: licenseNumber,
        license_expiry: licenseExpiry,
        license_image_url: licenseImageUrl,
        vehicle_registration_url: vehicleRegistrationUrl,
        is_verified: false,
      };

      if (driverDocs) {
        const { error } = await supabase
          .from("driver_documents")
          .update(docData)
          .eq("driver_id", user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("driver_documents")
          .insert(docData);

        if (error) throw error;
      }

      toast({
        title: "Documents Submitted",
        description: "Your documents have been submitted for verification.",
      });

      await loadDriverDocuments(user.id);
      setLicenseFile(null);
      setRegistrationFile(null);
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getStatusBadge = () => {
    if (!driverDocs) {
      return (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            No documents submitted yet. Please upload your documents.
          </AlertDescription>
        </Alert>
      );
    }

    if (driverDocs.is_verified) {
      return (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-600">
            Your documents have been verified! You can now create rides.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
        <Clock className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-600">
          Your documents are under review. You'll be notified once verified.
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Driver Verification</h1>
            <p className="text-muted-foreground">
              Upload your documents to get verified as a driver
            </p>
          </div>
        </div>

        {getStatusBadge()}

        <Card>
          <CardHeader>
            <CardTitle>License Information</CardTitle>
            <CardDescription>
              Provide your driver's license details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="licenseNumber">License Number *</Label>
                <Input
                  id="licenseNumber"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="Enter your license number"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="licenseExpiry">License Expiry Date *</Label>
                <Input
                  id="licenseExpiry"
                  type="date"
                  value={licenseExpiry}
                  onChange={(e) => setLicenseExpiry(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="licenseImage">License Image</Label>
                {driverDocs?.license_image_url && (
                  <div className="text-sm text-muted-foreground mb-2">
                    Current: File uploaded ✓
                  </div>
                )}
                <Input
                  id="licenseImage"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setLicenseFile(e.target.files?.[0] || null)}
                />
                <p className="text-xs text-muted-foreground">
                  Upload a clear photo of your driver's license (Max 5MB)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="registration">Vehicle Registration</Label>
                {driverDocs?.vehicle_registration_url && (
                  <div className="text-sm text-muted-foreground mb-2">
                    Current: File uploaded ✓
                  </div>
                )}
                <Input
                  id="registration"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setRegistrationFile(e.target.files?.[0] || null)}
                />
                <p className="text-xs text-muted-foreground">
                  Upload your vehicle registration document (Max 5MB)
                </p>
              </div>

              <Button type="submit" disabled={uploading} className="w-full">
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    {driverDocs ? "Update Documents" : "Submit Documents"}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {driverDocs && (
          <Card>
            <CardHeader>
              <CardTitle>Verification Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">License Number</p>
                  <p className="font-medium">{driverDocs.license_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expiry Date</p>
                  <p className="font-medium">{driverDocs.license_expiry}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">License Image</p>
                  <p className="font-medium">
                    {driverDocs.license_image_url ? "Uploaded ✓" : "Not uploaded"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vehicle Registration</p>
                  <p className="font-medium">
                    {driverDocs.vehicle_registration_url ? "Uploaded ✓" : "Not uploaded"}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Verification Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    {driverDocs.is_verified ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-600">Verified</span>
                      </>
                    ) : (
                      <>
                        <Clock className="h-5 w-5 text-yellow-600" />
                        <span className="font-medium text-yellow-600">Pending Review</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
