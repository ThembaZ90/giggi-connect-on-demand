import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Clock, DollarSign, MapPin, User, CheckCircle, XCircle, MessageSquare } from 'lucide-react';

interface Application {
  id: string;
  status: string;
  message: string;
  proposed_rate: number | null;
  created_at: string;
  gigs: {
    id: string;
    title: string;
    location: string;
    budget_min: number | null;
    budget_max: number | null;
  };
  profiles: {
    full_name: string;
    phone: string | null;
  };
}

interface ReceivedApplication {
  id: string;
  status: string;
  message: string;
  proposed_rate: number | null;
  created_at: string;
  worker_profiles: {
    full_name: string;
    phone: string | null;
    rating: number | null;
    total_jobs_completed: number | null;
  };
}

export function MyApplications() {
  const [myApplications, setMyApplications] = useState<Application[]>([]);
  const [receivedApplications, setReceivedApplications] = useState<ReceivedApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user]);

  const fetchApplications = async () => {
    try {
      // Fetch applications I've submitted
      const { data: myApps, error: myAppsError } = await supabase
        .from('gig_applications')
        .select(`
          *,
          gigs!inner (
            id,
            title,
            location,
            budget_min,
            budget_max
          ),
          profiles!gig_applications_worker_id_fkey (
            full_name,
            phone
          )
        `)
        .eq('worker_id', user?.id)
        .order('created_at', { ascending: false });

      if (myAppsError) throw myAppsError;

      // Fetch applications received for my gigs
      const { data: receivedApps, error: receivedAppsError } = await supabase
        .from('gig_applications')
        .select(`
          *,
          worker_profiles:profiles!gig_applications_worker_id_fkey (
            full_name,
            phone,
            rating,
            total_jobs_completed
          )
        `)
        .in('gig_id', await getMyGigIds())
        .order('created_at', { ascending: false });

      if (receivedAppsError) throw receivedAppsError;

      setMyApplications(myApps || []);
      setReceivedApplications(receivedApps || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: "Error",
        description: "Failed to load applications.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getMyGigIds = async (): Promise<string[]> => {
    const { data, error } = await supabase
      .from('gigs')
      .select('id')
      .eq('poster_id', user?.id);

    if (error) return [];
    return data?.map(gig => gig.id) || [];
  };

  const updateApplicationStatus = async (applicationId: string, status: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('gig_applications')
        .update({ status })
        .eq('id', applicationId);

      if (error) throw error;

      toast({
        title: "Application Updated",
        description: `Application ${status} successfully.`,
      });

      fetchApplications();
    } catch (error) {
      console.error('Error updating application:', error);
      toast({
        title: "Error",
        description: "Failed to update application.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'default';
      case 'rejected': return 'destructive';
      case 'pending': return 'secondary';
      default: return 'outline';
    }
  };

  const formatBudget = (min: number | null, max: number | null) => {
    if (!min && !max) return 'Budget not specified';
    if (min && max) return `$${min} - $${max}`;
    if (min) return `From $${min}`;
    if (max) return `Up to $${max}`;
    return 'Budget not specified';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <Tabs defaultValue="my-applications" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="my-applications">My Applications</TabsTrigger>
        <TabsTrigger value="received">Received Applications</TabsTrigger>
      </TabsList>

      <TabsContent value="my-applications" className="space-y-4">
        <h3 className="text-lg font-semibold">Applications I've Submitted</h3>
        {myApplications.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Applications Yet</h3>
            <p className="text-muted-foreground">Start applying for gigs to see your applications here.</p>
          </div>
        ) : (
          myApplications.map((application) => (
            <Card key={application.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{application.gigs.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <MapPin className="h-4 w-4" />
                      {application.gigs.location}
                    </CardDescription>
                  </div>
                  <Badge variant={getStatusColor(application.status)}>
                    {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span>{formatBudget(application.gigs.budget_min, application.gigs.budget_max)}</span>
                  {application.proposed_rate && (
                    <span className="ml-2">• Proposed: ${application.proposed_rate}</span>
                  )}
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm">{application.message}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Applied {new Date(application.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </TabsContent>

      <TabsContent value="received" className="space-y-4">
        <h3 className="text-lg font-semibold">Applications for My Gigs</h3>
        {receivedApplications.length === 0 ? (
          <div className="text-center py-8">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Applications Received</h3>
            <p className="text-muted-foreground">When people apply for your gigs, you'll see them here.</p>
          </div>
        ) : (
          receivedApplications.map((application) => (
            <Card key={application.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {application.worker_profiles.full_name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-1">
                      {application.worker_profiles.rating && (
                        <span>⭐ {application.worker_profiles.rating.toFixed(1)}</span>
                      )}
                      {application.worker_profiles.total_jobs_completed && (
                        <span>{application.worker_profiles.total_jobs_completed} jobs completed</span>
                      )}
                    </CardDescription>
                  </div>
                  <Badge variant={getStatusColor(application.status)}>
                    {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {application.proposed_rate && (
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <span className="font-medium">Proposed Rate: ${application.proposed_rate}</span>
                  </div>
                )}
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm">{application.message}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Applied {new Date(application.created_at).toLocaleDateString()}
                  </div>
                  {application.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateApplicationStatus(application.id, 'rejected')}
                        className="text-destructive border-destructive hover:bg-destructive hover:text-white"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => updateApplicationStatus(application.id, 'accepted')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                    </div>
                  )}
                </div>
                {application.worker_profiles.phone && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">
                      Contact: {application.worker_profiles.phone}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </TabsContent>
    </Tabs>
  );
}