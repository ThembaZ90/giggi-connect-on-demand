import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, MapPin, Briefcase, Zap, Search } from 'lucide-react';
import { GigList } from '@/components/GigList';

const Index = () => {
  const { user, loading, signOut, checkProfileComplete } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkProfile = async () => {
      if (user) {
        const isComplete = await checkProfileComplete();
        if (!isComplete) {
          navigate('/profile-setup');
        }
      }
    };
    
    checkProfile();
  }, [user, checkProfileComplete, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Grafty...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
        {/* Hero Section */}
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-6xl font-brand font-black mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              GRAFTY
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Connect. Work. Earn. Your gig economy starts here.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold"
                onClick={() => navigate('/auth')}
              >
                Get Started
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-primary text-primary hover:bg-primary hover:text-white"
                onClick={() => navigate('/auth')}
              >
                Sign In
              </Button>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <Card className="border-0 shadow-lg bg-card/80 backdrop-blur">
              <CardHeader className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-white" />
                </div>
                <CardTitle>Post a Gig</CardTitle>
                <CardDescription>
                  Need help with tasks? Post your gig and connect with skilled workers in your area.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg bg-card/80 backdrop-blur">
              <CardHeader className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-secondary to-accent rounded-full flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <CardTitle>Find Work</CardTitle>
                <CardDescription>
                  Looking for quick work? Browse local gigs and start earning money today.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg bg-card/80 backdrop-blur">
              <CardHeader className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-accent to-primary rounded-full flex items-center justify-center">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <CardTitle>Get Paid Fast</CardTitle>
                <CardDescription>
                  Complete gigs, get reviewed, and receive payments quickly and securely.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-brand font-black bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            GRAFTY
          </h1>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="flex items-center gap-2">
              <User className="h-3 w-3" />
              {user.email}
            </Badge>
            <Button 
              variant="outline" 
              size="sm"
              onClick={signOut}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Welcome to Grafty!</h2>
          <p className="text-muted-foreground mb-8">
            Your gig economy platform is ready. What would you like to do today?
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
          <Card className="border-0 shadow-lg bg-card/80 backdrop-blur hover:shadow-xl transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-white" />
                </div>
                Post a Gig
              </CardTitle>
              <CardDescription>
                Need help with a task? Create a gig posting and connect with local workers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                onClick={() => navigate('/create-gig')}
              >
                Create Gig Posting
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-card/80 backdrop-blur hover:shadow-xl transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-secondary to-accent rounded-lg flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                Find Work
              </CardTitle>
              <CardDescription>
                Looking for gig work? Browse available jobs in your area and start earning.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-gradient-to-r from-secondary to-accent hover:from-secondary/90 hover:to-accent/90">
                Browse Available Gigs
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Available Gigs */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Search className="h-5 w-5" />
            <h2 className="text-2xl font-bold">Available Gigs</h2>
          </div>
          <GigList />
        </div>
      </div>
    </div>
  );
};

export default Index;
