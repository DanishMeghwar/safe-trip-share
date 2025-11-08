import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, CheckCircle, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PassengerVerification() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [cnic, setCnic] = useState("");
  const [cnicFile, setCnicFile] = useState<File | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!error && data) {
      setProfile(data);
      setCnic(data.cnic || "");
    }
    setLoading(false);
  };

  const uploadCnicDocument = async (file: File, userId: string) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from("cnic-documents")
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("cnic-documents")
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cnic || !cnicFile) {
      toast({
        title: "Missing Information",
        description: "Please provide your CNIC number and upload a document.",
        variant: "destructive",
      });
      return;
    }

    // Validate CNIC format (XXXXX-XXXXXXX-X)
    const cnicRegex = /^\d{5}-\d{7}-\d$/;
    if (!cnicRegex.test(cnic)) {
      toast({
        title: "Invalid CNIC",
        description: "Please enter a valid CNIC format (XXXXX-XXXXXXX-X)",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const cnicDocumentUrl = await uploadCnicDocument(cnicFile, user.id);

      const { error } = await supabase
        .from("profiles")
        .update({
          cnic,
          cnic_document_url: cnicDocumentUrl,
          is_cnic_verified: false,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "CNIC Submitted",
        description: "Your CNIC has been submitted for verification.",
      });

      await loadProfile();
      setCnicFile(null);
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
    if (!profile?.cnic) {
      return (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            No CNIC submitted yet. Please upload your CNIC for verification.
          </AlertDescription>
        </Alert>
      );
    }

    if (profile.is_cnic_verified) {
      return (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-600">
            Your CNIC has been verified! Your account is fully verified.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
        <Clock className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-600">
          Your CNIC is under review. You'll be notified once verified.
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
            <h1 className="text-3xl font-bold">CNIC Verification</h1>
            <p className="text-muted-foreground">
              Verify your identity with your CNIC
            </p>
          </div>
        </div>

        {getStatusBadge()}

        <Card>
          <CardHeader>
            <CardTitle>CNIC Information</CardTitle>
            <CardDescription>
              Provide your National Identity Card details for verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cnic">CNIC Number *</Label>
                <Input
                  id="cnic"
                  value={cnic}
                  onChange={(e) => setCnic(e.target.value)}
                  placeholder="XXXXX-XXXXXXX-X"
                  required
                  maxLength={15}
                />
                <p className="text-xs text-muted-foreground">
                  Enter your 13-digit CNIC with dashes (e.g., 12345-1234567-1)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnicDocument">CNIC Document *</Label>
                {profile?.cnic_document_url && (
                  <div className="text-sm text-muted-foreground mb-2">
                    Current: File uploaded ✓
                  </div>
                )}
                <Input
                  id="cnicDocument"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setCnicFile(e.target.files?.[0] || null)}
                  required={!profile?.cnic_document_url}
                />
                <p className="text-xs text-muted-foreground">
                  Upload a clear photo of both sides of your CNIC (Max 5MB)
                </p>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Why do we need this?</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Verify your identity for safety</li>
                  <li>• Build trust in the ShareRide community</li>
                  <li>• Comply with transportation regulations</li>
                  <li>• Protect against fraud and misuse</li>
                </ul>
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
                    {profile?.cnic ? "Update CNIC" : "Submit CNIC"}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {profile?.cnic && (
          <Card>
            <CardHeader>
              <CardTitle>Verification Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">CNIC Number</p>
                  <p className="font-medium">{profile.cnic}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Document Status</p>
                  <p className="font-medium">
                    {profile.cnic_document_url ? "Uploaded ✓" : "Not uploaded"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Verification Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    {profile.is_cnic_verified ? (
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
