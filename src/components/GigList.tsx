import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Clock, DollarSign, Phone, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { GigApplicationDialog } from './GigApplicationDialog';
import { ChatDialog } from './ChatDialog';

interface Gig {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  budget_min: number | null;
  budget_max: number | null;
  duration_hours: number | null;
  is_urgent: boolean;
  required_skills: string[] | null;
  contact_phone: string | null;
  preferred_start_date: string | null;
  created_at: string;
  poster_id: string;
  profiles: {
    full_name: string;
  } | null;
}

export function GigList() {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [selectedChatGig, setSelectedChatGig] = useState<Gig | null>(null);
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const categories = [
    'cleaning',
    'delivery',
    'handyman',
    'tutoring',
    'tech_support',
    'pet_care',
    'gardening',
    'moving',
    'event_help',
    'other'
  ];

  useEffect(() => {
    fetchGigs();
  }, []);

  const fetchGigs = async () => {
    try {
      let query = supabase
        .from('gigs')
        .select(`
          *,
          profiles!gigs_poster_id_fkey (
            full_name
          )
        `)
        .eq('status', 'open');

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory as any);
      }

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`);
      }

      // Sort
      switch (sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'urgent':
          query = query.order('is_urgent', { ascending: false }).order('created_at', { ascending: false });
          break;
        case 'budget_high':
          query = query.order('budget_max', { ascending: false, nullsFirst: false });
          break;
        case 'budget_low':
          query = query.order('budget_min', { ascending: true, nullsFirst: false });
          break;
      }

      const { data, error } = await query;

      if (error) throw error;
      setGigs(data || []);
    } catch (error) {
      console.error('Error fetching gigs:', error);
      toast({
        title: "Error",
        description: "Failed to load gigs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGigs();
  }, [searchTerm, selectedCategory, sortBy]);

  const formatBudget = (min: number | null, max: number | null) => {
    if (!min && !max) return 'Budget not specified';
    if (min && max) return `$${min} - $${max}`;
    if (min) return `From $${min}`;
    if (max) return `Up to $${max}`;
    return 'Budget not specified';
  };

  const formatCategory = (category: string) => {
    return category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const handleChatClick = (gig: Gig) => {
    setSelectedChatGig(gig);
    setChatDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search gigs by title, description, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {formatCategory(category)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="urgent">Urgent First</SelectItem>
            <SelectItem value="budget_high">Highest Budget</SelectItem>
            <SelectItem value="budget_low">Lowest Budget</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Gig Cards */}
      {gigs.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-muted-foreground">No gigs found</h3>
          <p className="text-muted-foreground">Try adjusting your search criteria or check back later.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {gigs.map((gig) => (
            <Card key={gig.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {gig.title}
                      {gig.is_urgent && (
                        <Badge variant="destructive" className="text-xs">
                          URGENT
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Posted by {gig.profiles?.full_name || 'Anonymous'}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">
                    {formatCategory(gig.category)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{gig.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{gig.location}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>{formatBudget(gig.budget_min, gig.budget_max)}</span>
                  </div>
                  
                  {gig.duration_hours && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{gig.duration_hours} hours</span>
                    </div>
                  )}
                  
                  {gig.contact_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{gig.contact_phone}</span>
                    </div>
                  )}
                </div>

                {gig.required_skills && gig.required_skills.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Required Skills:</h4>
                    <div className="flex flex-wrap gap-1">
                      {gig.required_skills.map((skill, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {gig.preferred_start_date && (
                  <div className="text-sm text-muted-foreground">
                    <strong>Preferred Start:</strong> {new Date(gig.preferred_start_date).toLocaleDateString()}
                  </div>
                )}

                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs text-muted-foreground">
                    Posted {new Date(gig.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex gap-2">
                    {gig.contact_phone && (
                      <Button size="sm" variant="outline">
                        Call
                      </Button>
                    )}
                    {user && user.id !== gig.poster_id ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleChatClick(gig)}
                          className="flex items-center gap-1"
                        >
                          <MessageCircle className="h-3 w-3" />
                          Chat
                        </Button>
                        <GigApplicationDialog
                          gigId={gig.id}
                          gigTitle={gig.title}
                          budgetMin={gig.budget_min}
                          budgetMax={gig.budget_max}
                          onApplicationSubmitted={fetchGigs}
                        />
                      </>
                    ) : (
                      user && user.id === gig.poster_id && (
                        <Badge variant="outline" className="text-xs">
                          Your Gig
                        </Badge>
                      )
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedChatGig && (
        <ChatDialog
          open={chatDialogOpen}
          onOpenChange={setChatDialogOpen}
          gigId={selectedChatGig.id}
          gigTitle={selectedChatGig.title}
          otherUserId={selectedChatGig.poster_id}
          otherUserName={selectedChatGig.profiles?.full_name || 'Anonymous'}
          isGigPoster={false}
        />
      )}
    </div>
  );
}