import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { StarRating } from './StarRating';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  revieweeId: string;
  revieweeName: string;
  gigId?: string;
  gigTitle?: string;
  onReviewSubmitted?: () => void;
}

export const ReviewDialog: React.FC<ReviewDialogProps> = ({
  open,
  onOpenChange,
  revieweeId,
  revieweeName,
  gigId,
  gigTitle,
  onReviewSubmitted
}) => {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a star rating before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('reviews')
        .insert({
          reviewer_id: user.id,
          reviewee_id: revieweeId,
          gig_id: gigId,
          rating,
          review_text: reviewText.trim() || null,
        });

      if (error) throw error;

      toast({
        title: "Review submitted",
        description: `Your review for ${revieweeName} has been submitted successfully.`,
      });

      // Reset form
      setRating(0);
      setReviewText('');
      onOpenChange(false);
      onReviewSubmitted?.();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rate & Review</DialogTitle>
          <DialogDescription>
            Share your experience working with {revieweeName}
            {gigTitle && ` on "${gigTitle}"`}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Rating</Label>
            <StarRating
              rating={rating}
              onRatingChange={setRating}
              size="lg"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="review-text">Review (Optional)</Label>
            <Textarea
              id="review-text"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share details about your experience..."
              className="min-h-[100px]"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {reviewText.length}/500 characters
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
          >
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};