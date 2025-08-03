import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  MapPin, 
  DollarSign, 
  Clock, 
  Users, 
  Eye,
  CheckCircle,
  XCircle,
  MessageSquare,
  Wallet
} from 'lucide-react';
import { PayWorkerDialog } from '@/components/PayWorkerDialog';
import { WalletComponent } from '@/components/WalletComponent';

interface Gig {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  budget_min?: number;
  budget_max?: number;
  duration_hours?: number;
  status: string;
  created_at: string;
  preferred_start_date?: string;
  is_urgent: boolean;
  required_skills?: string[];
}

interface Application {
  id: string;
  gig_id: string;
  worker_id: string;
  message: string;
  proposed_rate?: number;
  status: string;
  created_at: string;
  profiles: {
    full_name: string;
    rating?: number;
    total_jobs_completed?: number;
  };
}

export default function GigPosterDashboard() {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [applications, setApplications] = useState<{ [gigId: string]: Application[] }>({});
  const [loading, setLoading] = useState(true);
  const [selectedGig, setSelectedGig] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchGigs();
    }
  }, [user]);

  const fetchGigs = async () => {
    try {
      const { data: gigsData, error: gigsError } = await supabase
        .from('gigs')
        .select('*')
        .eq('poster_id', user?.id)
        .order('created_at', { ascending: false });

      if (gigsError) throw gigsError;

      setGigs(gigsData || []);

      // Fetch applications for each gig
      const applicationsPromises = (gigsData || []).map(async (gig) => {
        const { data: appsData, error: appsError } = await supabase
          .from('gig_applications')
          .select(`
            *,
            profiles (
              full_name,
              rating,
              total_jobs_completed
            )
          `)
          .eq('gig_id', gig.id)
          .order('created_at', { ascending: false });

        if (appsError) throw appsError;
        return { gigId: gig.id, applications: appsData || [] };
      });

      const applicationsResults = await Promise.all(applicationsPromises);
      const applicationsMap = applicationsResults.reduce((acc, { gigId, applications }) => {
        acc[gigId] = applications;
        return acc;
      }, {} as { [gigId: string]: Application[] });

      setApplications(applicationsMap);
    } catch (error) {
      console.error('Error fetching gigs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch your gigs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId: string, status: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('gig_applications')
        .update({ status })
        .eq('id', applicationId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Application ${status}`,
      });

      fetchGigs(); // Refresh data
    } catch (error) {
      console.error('Error updating application:', error);
      toast({
        title: "Error",
        description: "Failed to update application",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      open: 'default',
      closed: 'secondary',
      completed: 'outline'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getApplicationStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      accepted: 'default',
      rejected: 'destructive'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatBudget = (min?: number, max?: number) => {
    if (min && max) return `$${min} - $${max}`;
    if (min) return `From $${min}`;
    if (max) return `Up to $${max}`;
    return 'Not specified';
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Gig Poster Dashboard</h1>
        <p className="text-muted-foreground">Manage your posted gigs and applications</p>
      </div>

      <Tabs defaultValue="gigs" className="space-y-6">
        <TabsList>
          <TabsTrigger value="gigs">My Gigs ({gigs.length})</TabsTrigger>
          <TabsTrigger value="applications">
            All Applications ({Object.values(applications).flat().length})
          </TabsTrigger>
          <TabsTrigger value="wallet">
            <Wallet className="h-4 w-4 mr-2" />
            Wallet
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gigs" className="space-y-6">
          {gigs.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">You haven't posted any gigs yet.</p>
              </CardContent>
            </Card>
          ) : (
            gigs.map((gig) => (
              <Card key={gig.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {gig.title}
                        {gig.is_urgent && <Badge variant="destructive">Urgent</Badge>}
                      </CardTitle>
                      <CardDescription>{gig.description}</CardDescription>
                    </div>
                    {getStatusBadge(gig.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {gig.location}
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      {formatBudget(gig.budget_min, gig.budget_max)}
                    </div>
                    {gig.duration_hours && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {gig.duration_hours} hours
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {applications[gig.id]?.length || 0} application(s)
                      </span>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedGig(selectedGig === gig.id ? null : gig.id)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {selectedGig === gig.id ? 'Hide' : 'View'} Applications
                    </Button>
                  </div>

                  {selectedGig === gig.id && applications[gig.id] && (
                    <div className="mt-4 space-y-3">
                      <Separator />
                      <h4 className="font-medium">Applications:</h4>
                      {applications[gig.id].length === 0 ? (
                        <p className="text-sm text-muted-foreground">No applications yet.</p>
                      ) : (
                        applications[gig.id].map((app) => (
                          <Card key={app.id} className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h5 className="font-medium">{app.profiles.full_name}</h5>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span>Rating: {app.profiles.rating || 'N/A'}</span>
                                  <span>Jobs: {app.profiles.total_jobs_completed || 0}</span>
                                </div>
                              </div>
                              {getApplicationStatusBadge(app.status)}
                            </div>
                            
                            <div className="mb-3">
                              <div className="flex items-center gap-2 mb-2">
                                <MessageSquare className="h-4 w-4" />
                                <span className="text-sm font-medium">Message:</span>
                              </div>
                              <p className="text-sm text-muted-foreground">{app.message}</p>
                            </div>

                            {app.proposed_rate && (
                              <div className="mb-3">
                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-4 w-4" />
                                  <span className="text-sm">Proposed Rate: ${app.proposed_rate}</span>
                                </div>
                              </div>
                            )}

                            {app.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => updateApplicationStatus(app.id, 'accepted')}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => updateApplicationStatus(app.id, 'rejected')}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                              </div>
                            )}

                            {app.status === 'accepted' && (
                              <PayWorkerDialog
                                applicationId={app.id}
                                workerName={app.profiles.full_name}
                                gigTitle={gig.title}
                                proposedRate={app.proposed_rate}
                                onPaymentComplete={fetchGigs}
                              />
                            )}
                          </Card>
                        ))
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="applications" className="space-y-6">
          {Object.values(applications).flat().length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">No applications received yet.</p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(applications).map(([gigId, apps]) => {
              const gig = gigs.find(g => g.id === gigId);
              if (!gig || apps.length === 0) return null;
              
              return (
                <Card key={gigId}>
                  <CardHeader>
                    <CardTitle>{gig.title}</CardTitle>
                    <CardDescription>{apps.length} application(s)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {apps.map((app) => (
                      <Card key={app.id} className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h5 className="font-medium">{app.profiles.full_name}</h5>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>Rating: {app.profiles.rating || 'N/A'}</span>
                              <span>Jobs: {app.profiles.total_jobs_completed || 0}</span>
                            </div>
                          </div>
                          {getApplicationStatusBadge(app.status)}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3">{app.message}</p>

                        {app.proposed_rate && (
                          <div className="mb-3">
                            <span className="text-sm">Proposed Rate: ${app.proposed_rate}</span>
                          </div>
                        )}

                        {app.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => updateApplicationStatus(app.id, 'accepted')}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateApplicationStatus(app.id, 'rejected')}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        )}

                        {app.status === 'accepted' && (
                          <PayWorkerDialog
                            applicationId={app.id}
                            workerName={app.profiles.full_name}
                            gigTitle={gig.title}
                            proposedRate={app.proposed_rate}
                            onPaymentComplete={fetchGigs}
                          />
                        )}
                      </Card>
                    ))}
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="wallet">
          <WalletComponent />
        </TabsContent>
      </Tabs>
    </div>
  );
}