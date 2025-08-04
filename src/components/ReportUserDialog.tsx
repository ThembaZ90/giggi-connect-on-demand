import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AlertTriangle, Upload, FileText } from 'lucide-react';

interface ReportUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportedUserId?: string;
}

const ReportUserDialog = ({ open, onOpenChange, reportedUserId }: ReportUserDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState({
    reported_user_id: reportedUserId || '',
    report_type: '',
    description: '',
    evidence_urls: [] as string[]
  });

  const reportTypes = [
    { value: 'fraud', label: 'Fraud or Scam' },
    { value: 'inappropriate_behavior', label: 'Inappropriate Behavior' },
    { value: 'fake_profile', label: 'Fake Profile' },
    { value: 'scam', label: 'Payment Scam' },
    { value: 'other', label: 'Other Safety Concern' }
  ];

  const handleFileUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/report_evidence_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('verification-docs')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('verification-docs')
        .getPublicUrl(fileName);

      setReportData(prev => ({
        ...prev,
        evidence_urls: [...prev.evidence_urls, publicUrl]
      }));

      toast({
        title: "Evidence Uploaded",
        description: "Your evidence has been uploaded successfully"
      });
    } catch (error: any) {
      toast({
        title: "Upload Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const submitReport = async () => {
    if (!reportData.reported_user_id || !reportData.report_type || !reportData.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_reports')
        .insert({
          reporter_id: user?.id,
          reported_user_id: reportData.reported_user_id,
          report_type: reportData.report_type,
          description: reportData.description,
          evidence_urls: reportData.evidence_urls,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Report Submitted",
        description: "Thank you for helping keep our community safe. We'll review your report within 24 hours.",
      });

      onOpenChange(false);
      setReportData({
        reported_user_id: '',
        report_type: '',
        description: '',
        evidence_urls: []
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
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Report Safety Concern
          </DialogTitle>
          <DialogDescription>
            Help us keep the community safe by reporting suspicious or inappropriate behavior
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                <div className="text-sm text-red-800">
                  <p className="font-medium">Important:</p>
                  <ul className="mt-1 list-disc list-inside space-y-1">
                    <li>Only report genuine safety concerns</li>
                    <li>Provide detailed and accurate information</li>
                    <li>False reports may result in account suspension</li>
                    <li>For emergencies, contact local authorities immediately</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="reported_user_id">User ID or Profile Link (if applicable)</Label>
              <Input
                id="reported_user_id"
                placeholder="Enter user ID or paste profile link"
                value={reportData.reported_user_id}
                onChange={(e) => setReportData(prev => ({ ...prev, reported_user_id: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Leave blank if reporting a general safety concern
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="report_type">Type of Concern *</Label>
              <Select value={reportData.report_type} onValueChange={(value) => setReportData(prev => ({ ...prev, report_type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select the type of safety concern" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Detailed Description *</Label>
              <Textarea
                id="description"
                placeholder="Please provide a detailed description of the incident, including dates, times, and specific behaviors that concern you..."
                value={reportData.description}
                onChange={(e) => setReportData(prev => ({ ...prev, description: e.target.value }))}
                className="min-h-[120px]"
              />
              <p className="text-xs text-muted-foreground">
                The more details you provide, the better we can investigate
              </p>
            </div>

            <div className="space-y-2">
              <Label>Evidence (Optional)</Label>
              <Card className="border-dashed">
                <CardContent className="pt-6">
                  <div className="text-center space-y-2">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    <div>
                      <Input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file);
                        }}
                        className="text-sm"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Screenshots, messages, or other relevant evidence (Max 5MB)
                    </p>
                  </div>
                </CardContent>
              </Card>

              {reportData.evidence_urls.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Uploaded Evidence:</p>
                  {reportData.evidence_urls.map((url, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4" />
                      <span>Evidence file {index + 1}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReportData(prev => ({
                          ...prev,
                          evidence_urls: prev.evidence_urls.filter((_, i) => i !== index)
                        }))}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={submitReport} 
              disabled={loading || !reportData.report_type || !reportData.description}
              className="w-full"
            >
              {loading ? 'Submitting Report...' : 'Submit Safety Report'}
            </Button>

            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportUserDialog;