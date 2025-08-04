import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  Shield, 
  Phone, 
  FileText, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertTriangle,
  Star,
  Eye,
  Settings
} from 'lucide-react';
import SAIDVerificationDialog from './SAIDVerificationDialog';
import PhoneVerificationDialog from './PhoneVerificationDialog';
import ReportUserDialog from './ReportUserDialog';

interface SecurityStatus {
  profile: any;
  saIdVerification: any;
  phoneVerification: any;
  securitySettings: any;
  verificationLevel: number;
  isVerified: boolean;
}

const SecurityDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus | null>(null);
  const [showSAIDDialog, setShowSAIDDialog] = useState(false);
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSecurityStatus();
    }
  }, [user]);

  const fetchSecurityStatus = async () => {
    setLoading(true);
    try {
      // Fetch all security-related data
      const [profileRes, saIdRes, phoneRes, securityRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user?.id).single(),
        supabase.from('sa_id_verification').select('*').eq('user_id', user?.id).maybeSingle(),
        supabase.from('phone_verification').select('*').eq('user_id', user?.id).maybeSingle(),
        supabase.from('security_settings').select('*').eq('user_id', user?.id).maybeSingle()
      ]);

      setSecurityStatus({
        profile: profileRes.data,
        saIdVerification: saIdRes.data,
        phoneVerification: phoneRes.data,
        securitySettings: securityRes.data,
        verificationLevel: profileRes.data?.verification_level || 0,
        isVerified: profileRes.data?.is_verified || false
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch security status",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>;
      case 'pending':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'in_review':
        return <Badge className="bg-blue-100 text-blue-800"><Eye className="h-3 w-3 mr-1" />In Review</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">Not Started</Badge>;
    }
  };

  const getVerificationProgress = () => {
    let progress = 0;
    const status = securityStatus;
    
    if (status?.profile?.phone) progress += 20;
    if (status?.phoneVerification?.is_verified) progress += 20;
    if (status?.saIdVerification) progress += 30;
    if (status?.saIdVerification?.verification_status === 'approved') progress += 20;
    if (status?.profile?.account_status === 'active') progress += 10;
    
    return Math.min(progress, 100);
  };

  const getTrustScore = () => {
    const status = securityStatus;
    let score = 1; // Base score
    
    if (status?.phoneVerification?.is_verified) score += 1;
    if (status?.saIdVerification?.verification_status === 'approved') score += 2;
    if (status?.profile?.rating && status.profile.rating > 4) score += 1;
    
    return Math.min(score, 5);
  };

  if (loading) {
    return <div className="p-6">Loading security dashboard...</div>;
  }

  if (!securityStatus) {
    return <div className="p-6">Failed to load security information</div>;
  }

  const progress = getVerificationProgress();
  const trustScore = getTrustScore();

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Security & Verification</h1>
        <p className="text-muted-foreground">
          Secure your account and build trust with the community
        </p>
      </div>

      {/* Trust Score Overview */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Trust Score
          </CardTitle>
          <CardDescription>
            Your verification level helps others trust you on the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{trustScore}/5</span>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < trustScore ? 'text-yellow-500 fill-current' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Verification Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {securityStatus.profile?.account_status !== 'active' && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">
                  Account verification pending - complete verification to access all features
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Verification Steps */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Phone Verification */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Phone Verification
              </div>
              {getVerificationBadge(
                securityStatus.phoneVerification?.is_verified ? 'approved' : 'pending'
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Verify your phone number with SMS to increase security
            </p>
            <Button 
              variant={securityStatus.phoneVerification?.is_verified ? "outline" : "default"}
              onClick={() => setShowPhoneDialog(true)}
              className="w-full"
              disabled={securityStatus.phoneVerification?.is_verified}
            >
              {securityStatus.phoneVerification?.is_verified ? 'Verified' : 'Verify Phone'}
            </Button>
          </CardContent>
        </Card>

        {/* SA ID Verification */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                SA ID Verification
              </div>
              {getVerificationBadge(
                securityStatus.saIdVerification?.verification_status || 'pending'
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Upload your South African ID for identity verification
            </p>
            <Button 
              variant={securityStatus.saIdVerification?.verification_status === 'approved' ? "outline" : "default"}
              onClick={() => setShowSAIDDialog(true)}
              className="w-full"
              disabled={securityStatus.saIdVerification?.verification_status === 'approved'}
            >
              {securityStatus.saIdVerification?.verification_status === 'approved' 
                ? 'Verified' 
                : securityStatus.saIdVerification 
                  ? 'Update Documents' 
                  : 'Start Verification'
              }
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Security Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Security Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">Extra security for your account</p>
              </div>
              <Badge variant={securityStatus.securitySettings?.two_factor_enabled ? "default" : "outline"}>
                {securityStatus.securitySettings?.two_factor_enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Security alerts via email</p>
              </div>
              <Badge variant={securityStatus.securitySettings?.email_notifications ? "default" : "outline"}>
                {securityStatus.securitySettings?.email_notifications ? 'On' : 'Off'}
              </Badge>
            </div>
          </div>

          <Button variant="outline" className="w-full" onClick={() => setShowReportDialog(true)}>
            <AlertTriangle className="h-4 w-4 mr-2" />
            Report Safety Concern
          </Button>
        </CardContent>
      </Card>

      {/* Verification Status Details */}
      {securityStatus.saIdVerification && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Verification Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">ID Number</p>
                <p className="font-mono">****-****-***{securityStatus.saIdVerification.id_number?.slice(-2)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Verification Score</p>
                <p>{securityStatus.saIdVerification.verification_score || 'Pending'}</p>
              </div>
              {securityStatus.saIdVerification.verification_notes && (
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Notes</p>
                  <p className="text-sm">{securityStatus.saIdVerification.verification_notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <SAIDVerificationDialog 
        open={showSAIDDialog} 
        onOpenChange={setShowSAIDDialog} 
      />
      <PhoneVerificationDialog 
        open={showPhoneDialog} 
        onOpenChange={setShowPhoneDialog} 
      />
      <ReportUserDialog 
        open={showReportDialog} 
        onOpenChange={setShowReportDialog} 
      />
    </div>
  );
};

export default SecurityDashboard;