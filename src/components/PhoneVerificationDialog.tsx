import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Phone, MessageSquare, CheckCircle, Clock } from 'lucide-react';

interface PhoneVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PhoneVerificationDialog = ({ open, onOpenChange }: PhoneVerificationDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timeLeft]);

  const formatPhoneNumber = (phone: string) => {
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');
    
    // SA phone number formatting
    if (cleaned.startsWith('27')) {
      return cleaned;
    } else if (cleaned.startsWith('0')) {
      return '27' + cleaned.slice(1);
    } else if (cleaned.length === 9) {
      return '27' + cleaned;
    }
    return cleaned;
  };

  const sendVerificationCode = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid South African phone number",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      // Generate 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Save verification attempt to database
      const { error } = await supabase
        .from('phone_verification')
        .upsert({
          user_id: user?.id,
          phone_number: formattedPhone,
          verification_code: code,
          code_expires_at: expiresAt.toISOString(),
          verification_attempts: 0
        });

      if (error) throw error;

      // In production, you would integrate with SMS service like Twilio
      // For demo purposes, we'll show the code in a toast
      toast({
        title: "Verification Code Sent",
        description: `Demo mode: Your code is ${code}`,
      });

      setStep(2);
      setTimeLeft(600); // 10 minutes
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter the 6-digit verification code",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Get current verification record
      const { data: verification, error: fetchError } = await supabase
        .from('phone_verification')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (fetchError) throw fetchError;

      // Check if code is correct and not expired
      const now = new Date();
      const expiresAt = new Date(verification.code_expires_at);

      if (now > expiresAt) {
        toast({
          title: "Code Expired",
          description: "Please request a new verification code",
          variant: "destructive"
        });
        return;
      }

      if (verification.verification_code !== verificationCode) {
        // Increment failed attempts
        await supabase
          .from('phone_verification')
          .update({ 
            verification_attempts: verification.verification_attempts + 1,
            last_attempt_at: now.toISOString()
          })
          .eq('user_id', user?.id);

        toast({
          title: "Invalid Code",
          description: "The verification code is incorrect",
          variant: "destructive"
        });
        return;
      }

      // Mark as verified
      const { error: updateError } = await supabase
        .from('phone_verification')
        .update({
          is_verified: true,
          verified_at: now.toISOString()
        })
        .eq('user_id', user?.id);

      if (updateError) throw updateError;

      // Update profile verification level
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          verification_level: 1,
          phone: verification.phone_number
        })
        .eq('user_id', user?.id);

      if (profileError) throw profileError;

      toast({
        title: "Phone Verified",
        description: "Your phone number has been successfully verified",
      });

      onOpenChange(false);
      setStep(1);
      setPhoneNumber('');
      setVerificationCode('');
    } catch (error: any) {
      toast({
        title: "Verification Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            Phone Verification
          </DialogTitle>
          <DialogDescription>
            Step {step} of 2 - Verify your phone number with SMS
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-6">
            <Card className="border-primary/20">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-center w-16 h-16 mx-auto bg-gradient-to-r from-primary to-secondary rounded-full">
                    <Phone className="h-8 w-8 text-white" />
                  </div>
                  
                  <div className="text-center">
                    <h3 className="text-lg font-semibold">Enter Your Phone Number</h3>
                    <p className="text-sm text-muted-foreground">
                      We'll send you a verification code via SMS
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">South African Mobile Number</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-sm text-muted-foreground">+27</span>
                      <Input
                        id="phone"
                        placeholder="81 234 5678"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                        className="pl-12"
                        maxLength={10}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Standard SMS rates apply
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button 
              onClick={sendVerificationCode} 
              disabled={loading || phoneNumber.length < 9}
              className="w-full"
            >
              {loading ? 'Sending...' : 'Send Verification Code'}
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <Card className="border-primary/20">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-center w-16 h-16 mx-auto bg-gradient-to-r from-primary to-secondary rounded-full">
                    <MessageSquare className="h-8 w-8 text-white" />
                  </div>
                  
                  <div className="text-center">
                    <h3 className="text-lg font-semibold">Enter Verification Code</h3>
                    <p className="text-sm text-muted-foreground">
                      We sent a 6-digit code to +27{phoneNumber}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="code">Verification Code</Label>
                    <Input
                      id="code"
                      placeholder="123456"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="text-center text-lg tracking-widest"
                      maxLength={6}
                    />
                  </div>

                  {timeLeft > 0 && (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Code expires in {formatTime(timeLeft)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <Button 
                onClick={verifyCode} 
                disabled={loading || verificationCode.length !== 6}
                className="w-full"
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </Button>

              <Button 
                variant="outline" 
                onClick={() => sendVerificationCode()}
                disabled={loading || timeLeft > 0}
                className="w-full"
              >
                {timeLeft > 0 ? `Resend in ${formatTime(timeLeft)}` : 'Resend Code'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PhoneVerificationDialog;