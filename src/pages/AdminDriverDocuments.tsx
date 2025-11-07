import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeDriverDocuments } from "@/hooks/useRealtimeDriverDocuments";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, XCircle, FileText, Calendar, Shield } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function AdminDriverDocuments() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);

  const { documents } = useRealtimeDriverDocuments();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const hasAdminRole = roles?.some(r => r.role === "admin");
      
      if (!hasAdminRole) {
        navigate("/");
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error("Admin check error:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDocument = async (documentId: string, isVerified: boolean) => {
    setVerifying(documentId);
    try {
      const { error } = await supabase
        .from("driver_documents")
        .update({ is_verified: isVerified })
        .eq("id", documentId);

      if (error) throw error;

      toast({
        title: isVerified ? "Document Verified" : "Document Rejected",
        description: isVerified 
          ? "Driver document has been verified successfully" 
          : "Driver document has been rejected",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setVerifying(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const pendingDocuments = documents.filter(d => !d.is_verified);
  const verifiedDocuments = documents.filter(d => d.is_verified);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Driver Document Verification</h1>
              <p className="text-muted-foreground">Review and verify driver documents</p>
            </div>
          </div>
          <div className="flex gap-4">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {pendingDocuments.length} Pending
            </Badge>
            <Badge variant="default" className="text-lg px-4 py-2">
              {verifiedDocuments.length} Verified
            </Badge>
          </div>
        </div>

        {/* Pending Documents */}
        <Card className="border-orange-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-orange-500" />
              Pending Verification ({pendingDocuments.length})
            </CardTitle>
            <CardDescription>Documents awaiting verification</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>License Number</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Documents</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No pending documents
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingDocuments.map((doc) => (
                    <TableRow key={doc.id} className="bg-orange-50/50 dark:bg-orange-950/20">
                      <TableCell className="font-medium">
                        {doc.driver?.full_name || "Unknown"}
                      </TableCell>
                      <TableCell>{doc.driver?.phone || "N/A"}</TableCell>
                      <TableCell>{doc.license_number}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(doc.license_expiry), "MMM dd, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {doc.license_image_url && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedImage(doc.license_image_url)}
                            >
                              License
                            </Button>
                          )}
                          {doc.vehicle_registration_url && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedImage(doc.vehicle_registration_url)}
                            >
                              Registration
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(doc.created_at || new Date()), "MMM dd, HH:mm")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            disabled={verifying === doc.id}
                            onClick={() => handleVerifyDocument(doc.id, true)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Verify
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={verifying === doc.id}
                            onClick={() => handleVerifyDocument(doc.id, false)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Verified Documents */}
        <Card className="border-green-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-500" />
              Verified Documents ({verifiedDocuments.length})
            </CardTitle>
            <CardDescription>Successfully verified driver documents</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>License Number</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Documents</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {verifiedDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No verified documents
                    </TableCell>
                  </TableRow>
                ) : (
                  verifiedDocuments.map((doc) => (
                    <TableRow key={doc.id} className="bg-green-50/50 dark:bg-green-950/20">
                      <TableCell className="font-medium">
                        {doc.driver?.full_name || "Unknown"}
                      </TableCell>
                      <TableCell>{doc.driver?.phone || "N/A"}</TableCell>
                      <TableCell>{doc.license_number}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(doc.license_expiry), "MMM dd, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {doc.license_image_url && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedImage(doc.license_image_url)}
                            >
                              License
                            </Button>
                          )}
                          {doc.vehicle_registration_url && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedImage(doc.vehicle_registration_url)}
                            >
                              Registration
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Verified
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={verifying === doc.id}
                          onClick={() => handleVerifyDocument(doc.id, false)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Revoke
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Document Preview</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="w-full max-h-[80vh] overflow-auto">
              <img 
                src={selectedImage} 
                alt="Document" 
                className="w-full h-auto rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
