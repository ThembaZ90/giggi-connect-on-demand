import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Shield, Upload, Camera, CheckCircle, AlertCircle, FileText } from 'lucide-react';

interface SAIDVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SAIDVerificationDialog = ({ open, onOpenChange }: SAIDVerificationDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [idNumber, setIdNumber] = useState('');
  const [idInfo, setIdInfo] = useState<any>(null);
  const [documents, setDocuments] = useState({
    sa_id_front: null as File | null,
    sa_id_back: null as File | null,
    selfie: null as File | null,
    proof_of_address: null as File | null
  });

  const validateIdNumber = async () => {
    if (!idNumber || idNumber.length !== 13) {
      toast({
        title: "Invalid ID Number",
        description: "Please enter a valid 13-digit South African ID number",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('validate_sa_id_number', { id_number: idNumber });
      
      if (error) throw error;
      
      if (!data) {
        toast({
          title: "Invalid ID Number",
          description: "The ID number format is invalid",
          variant: "destructive"
        });
        return;
      }

      // Extract ID information
      const { data: extractedInfo, error: extractError } = await supabase.rpc('extract_sa_id_info', { id_number: idNumber });
      
      if (extractError) throw extractError;
      
      setIdInfo(extractedInfo);
      setStep(2);
      
      toast({
        title: "ID Number Validated",
        description: "Please upload your documents for verification"
      });
    } catch (error: any) {
      toast({
        title: "Validation Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (documentType: string, file: File) => {
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    setDocuments(prev => ({
      ...prev,
      [documentType]: file
    }));
  };

  const uploadDocument = async (documentType: string, file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id}/${documentType}_${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('verification-docs')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('verification-docs')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const submitVerification = async () => {
    setLoading(true);
    try {
      // First, save SA ID verification data
      const { error: idError } = await supabase
        .from('sa_id_verification')
        .upsert({
          user_id: user?.id,
          id_number: idNumber,
          first_names: idInfo.first_names || '',
          surname: idInfo.surname || '',
          date_of_birth: idInfo.date_of_birth,
          gender: idInfo.gender,
          citizenship: idInfo.citizenship,
          verification_status: 'pending'
        });

      if (idError) throw idError;

      // Upload documents
      const documentUploads = [];
      for (const [docType, file] of Object.entries(documents)) {
        if (file) {
          const url = await uploadDocument(docType, file);
          documentUploads.push({
            user_id: user?.id,
            document_type: docType,
            document_url: url,
            verification_status: 'pending'
          });
        }
      }

      if (documentUploads.length > 0) {
        const { error: docsError } = await supabase
          .from('verification_documents')
          .insert(documentUploads);

        if (docsError) throw docsError;
      }

      // Update profile verification level
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          verification_level: 2,
          account_status: 'pending_verification'
        })
        .eq('user_id', user?.id);

      if (profileError) throw profileError;

      toast({
        title: "Verification Submitted",
        description: "Your documents have been submitted for verification. You'll be notified within 24-48 hours.",
      });

      onOpenChange(false);
      setStep(1);
      setIdNumber('');
      setIdInfo(null);
      setDocuments({
        sa_id_front: null,
        sa_id_back: null,
        selfie: null,
        proof_of_address: null
      });
    } catch (error: any) {
      toast({
        title: "Submission Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            South African ID Verification
          </DialogTitle>
          <DialogDescription>
            Step {step} of 2 - Verify your identity to increase your trust score and access more features
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-6">
            <Card className="border-primary/20">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-center w-16 h-16 mx-auto bg-gradient-to-r from-primary to-secondary rounded-full">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  
                  <div className="text-center">
                    <h3 className="text-lg font-semibold">Enter Your SA ID Number</h3>
                    <p className="text-sm text-muted-foreground">
                      We'll validate your 13-digit South African ID number
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="id_number">South African ID Number</Label>
                    <Input
                      id="id_number"
                      placeholder="9001015009087"
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, '').slice(0, 13))}
                      className="text-center text-lg tracking-widest"
                      maxLength={13}
                    />
                    <p className="text-xs text-muted-foreground">
                      Your ID number is encrypted and secure
                    </p>
                  </div>

                  {idInfo && (
                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">ID Validated</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>Date of Birth: {idInfo.date_of_birth}</div>
                          <div>Gender: {idInfo.gender}</div>
                          <div className="col-span-2">Citizenship: {idInfo.citizenship}</div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </CardContent>
            </Card>

            <Button 
              onClick={validateIdNumber} 
              disabled={loading || idNumber.length !== 13}
              className="w-full"
            >
              {loading ? 'Validating...' : 'Validate ID Number'}
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Upload Verification Documents</h3>
              <p className="text-sm text-muted-foreground">
                Upload clear photos of your documents for manual verification
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'sa_id_front', label: 'ID Front', icon: FileText, required: true },
                { key: 'sa_id_back', label: 'ID Back', icon: FileText, required: true },
                { key: 'selfie', label: 'Selfie with ID', icon: Camera, required: true },
                { key: 'proof_of_address', label: 'Proof of Address', icon: FileText, required: false }
              ].map(({ key, label, icon: Icon, required }) => (
                <Card key={key} className="border-dashed">
                  <CardContent className="pt-6">
                    <div className="text-center space-y-2">
                      <Icon className="h-8 w-8 mx-auto text-muted-foreground" />
                      <Label className="text-sm font-medium">
                        {label} {required && <span className="text-red-500">*</span>}
                      </Label>
                      
                      {documents[key as keyof typeof documents] ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-xs">Uploaded</span>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          {required ? 'Required' : 'Optional'}
                        </Badge>
                      )}
                      
                      <Input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(key, file);
                        }}
                        className="text-xs"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Document Requirements:</p>
                  <ul className="mt-1 list-disc list-inside space-y-1 text-xs">
                    <li>Clear, well-lit photos</li>
                    <li>All text must be readable</li>
                    <li>Selfie should show you holding your ID clearly</li>
                    <li>Proof of address must be less than 3 months old</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} disabled={loading}>
                Back
              </Button>
              <Button 
                onClick={submitVerification} 
                disabled={loading || !documents.sa_id_front || !documents.sa_id_back || !documents.selfie}
                className="flex-1"
              >
                {loading ? 'Submitting...' : 'Submit for Verification'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SAIDVerificationDialog;