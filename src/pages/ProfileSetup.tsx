import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, User, MapPin, Phone, FileText, Briefcase, Wrench, Users } from 'lucide-react';

const ProfileSetup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  const [profileData, setProfileData] = useState({
    full_name: '',
    phone: '',
    location: '',
    bio: '',
    user_type: 'both' as 'job_poster' | 'gig_worker' | 'both'
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // Check if user already has a complete profile
    const checkProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data && data.phone && data.location) {
        // Profile is already complete, redirect to home
        navigate('/');
        return;
      }

      if (data) {
        setProfileData({
          full_name: data.full_name || '',
          phone: data.phone || '',
          location: data.location || '',
          bio: data.bio || '',
          user_type: data.user_type || 'both'
        });
      }
    };

    checkProfile();
  }, [user, navigate]);

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.full_name,
          phone: profileData.phone,
          location: profileData.location,
          bio: profileData.bio,
          user_type: profileData.user_type
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Profile completed!",
        description: "Welcome to Grafty! Your profile has been set up successfully."
      });

      navigate('/');
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

  const updateProfileData = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return profileData.full_name.trim() !== '';
      case 2:
        return profileData.phone.trim() !== '' && profileData.location.trim() !== '';
      case 3:
        return true; // Bio and user type are optional/have defaults
      default:
        return false;
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl border-0 bg-card/95 backdrop-blur">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-brand font-black bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Complete Your Grafty Profile
          </CardTitle>
          <CardDescription>
            Step {step} of 3 - Let's get you set up to start connecting with opportunities
          </CardDescription>
          
          {/* Progress Bar */}
          <div className="flex justify-center mt-4">
            <div className="flex space-x-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-2 w-8 rounded-full transition-colors ${
                    i <= step ? 'bg-gradient-to-r from-primary to-secondary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold">Tell us about yourself</h3>
                <p className="text-muted-foreground">Start with your basic information</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  placeholder="Enter your full name"
                  value={profileData.full_name}
                  onChange={(e) => updateProfileData('full_name', e.target.value)}
                  className="text-lg"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-secondary to-accent rounded-full flex items-center justify-center">
                  <MapPin className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold">Contact & Location</h3>
                <p className="text-muted-foreground">Help others connect with you</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      placeholder="Your phone number"
                      value={profileData.phone}
                      onChange={(e) => updateProfileData('phone', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="location"
                      placeholder="City, State"
                      value={profileData.location}
                      onChange={(e) => updateProfileData('location', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-accent to-primary rounded-full flex items-center justify-center">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold">How will you use Grafty?</h3>
                <p className="text-muted-foreground">Choose your role in the platform</p>
              </div>

              <div className="space-y-4">
                <Label>I want to...</Label>
                <RadioGroup
                  value={profileData.user_type}
                  onValueChange={(value) => updateProfileData('user_type', value)}
                  className="grid grid-cols-1 gap-4"
                >
                  <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="job_poster" id="job_poster" />
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
                        <Briefcase className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <Label htmlFor="job_poster" className="text-base font-medium cursor-pointer">
                          Post jobs and hire workers
                        </Label>
                        <p className="text-sm text-muted-foreground">I need help with tasks and projects</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="gig_worker" id="gig_worker" />
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-10 h-10 bg-gradient-to-r from-secondary to-accent rounded-lg flex items-center justify-center">
                        <Wrench className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <Label htmlFor="gig_worker" className="text-base font-medium cursor-pointer">
                          Find gig work and earn money
                        </Label>
                        <p className="text-sm text-muted-foreground">I want to work on projects and tasks</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="both" id="both" />
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-10 h-10 bg-gradient-to-r from-accent to-primary rounded-lg flex items-center justify-center">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <Label htmlFor="both" className="text-base font-medium cursor-pointer">
                          Both - post jobs and find work
                        </Label>
                        <p className="text-sm text-muted-foreground">I want to do both depending on the opportunity</p>
                      </div>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio (Optional)</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    id="bio"
                    placeholder="Tell others about your skills, experience, or what you're looking for..."
                    value={profileData.bio}
                    onChange={(e) => updateProfileData('bio', e.target.value)}
                    className="pl-10 min-h-[100px]"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 1}
              className="flex items-center gap-2"
            >
              Back
            </Button>

            {step < 3 ? (
              <Button
                onClick={handleNext}
                disabled={!isStepValid()}
                className="flex items-center gap-2 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading || !isStepValid()}
                className="flex items-center gap-2 bg-gradient-to-r from-secondary to-accent hover:from-secondary/90 hover:to-accent/90"
              >
                {loading ? 'Completing...' : 'Complete Setup'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSetup;