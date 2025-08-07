import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { StarRating } from '@/components/StarRating';
import { ReviewsList } from '@/components/ReviewsList';
import { useToast } from '@/hooks/use-toast';
import { User, MapPin, Calendar, Briefcase } from 'lucide-react';

interface UserProfile {
  user_id: string;
  full_name: string;
  bio: string | null;
  location: string | null;
  rating: number | null;
  total_jobs_completed: number | null;
  user_type: string;
  is_verified: boolean;
  created_at: string;
}

export function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load user profile.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="h-48 bg-muted rounded-lg animate-pulse" />
        <div className="h-64 bg-muted rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-muted-foreground">User not found</h1>
      </div>
    );
  }

  const formatUserType = (type: string) => {
    switch (type) {
      case 'worker': return 'Job Seeker';
      case 'poster': return 'Job Poster';
      case 'both': return 'Job Seeker & Poster';
      default: return type;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="text-2xl">
                {profile.full_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{profile.full_name}</h1>
                {profile.is_verified && (
                  <Badge variant="default" className="bg-green-600">
                    Verified
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>{formatUserType(profile.user_type)}</span>
                </div>
                {profile.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{profile.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-6">
                {profile.rating && profile.rating > 0 && (
                  <StarRating rating={profile.rating} readonly />
                )}
                {profile.total_jobs_completed && profile.total_jobs_completed > 0 && (
                  <div className="flex items-center gap-1 text-sm">
                    <Briefcase className="h-4 w-4" />
                    <span>{profile.total_jobs_completed} jobs completed</span>
                  </div>
                )}
              </div>

              {profile.bio && (
                <p className="text-muted-foreground mt-4">{profile.bio}</p>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Reviews Section */}
      <Card>
        <CardHeader>
          <CardTitle>Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <ReviewsList userId={profile.user_id} showGigTitles />
        </CardContent>
      </Card>
    </div>
  );
}