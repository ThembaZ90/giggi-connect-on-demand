import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { StarRating } from './StarRating';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface Review {
  id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  reviewer_profile: {
    full_name: string;
  };
  gig?: {
    title: string;
  };
}

interface ReviewsListProps {
  userId: string;
  showGigTitles?: boolean;
}

export const ReviewsList: React.FC<ReviewsListProps> = ({ 
  userId, 
  showGigTitles = false 
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const { data, error } = await supabase
          .from('reviews')
          .select(`
            id,
            rating,
            review_text,
            created_at,
            reviewer_id,
            gig_id
          `)
          .eq('reviewee_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Get reviewer profiles
        const reviewerIds = data?.map(r => r.reviewer_id) || [];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', reviewerIds);

        // Get gig titles if needed
        const gigIds = data?.filter(r => r.gig_id).map(r => r.gig_id) || [];
        const { data: gigs } = showGigTitles && gigIds.length > 0 
          ? await supabase
              .from('gigs')
              .select('id, title')
              .in('id', gigIds)
          : { data: [] };

        // Combine the data
        const reviewsWithProfiles = data?.map(review => ({
          ...review,
          reviewer_profile: profiles?.find(p => p.user_id === review.reviewer_id) || { full_name: 'Anonymous' },
          gig: gigs?.find(g => g.id === review.gig_id) || null
        })) || [];

        setReviews(reviewsWithProfiles);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [userId]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No reviews yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarFallback>
                    {review.reviewer_profile?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {review.reviewer_profile?.full_name || 'Anonymous'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(review.created_at))} ago
                  </p>
                  {showGigTitles && review.gig?.title && (
                    <p className="text-sm text-primary">
                      For: {review.gig.title}
                    </p>
                  )}
                </div>
              </div>
              <StarRating rating={review.rating} readonly size="sm" />
            </div>
          </CardHeader>
          {review.review_text && (
            <CardContent>
              <p className="text-sm">{review.review_text}</p>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
};