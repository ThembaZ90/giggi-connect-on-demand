-- Create reviews table for rating system between users
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reviewer_id UUID NOT NULL,
  reviewee_id UUID NOT NULL,
  gig_id UUID,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(reviewer_id, reviewee_id, gig_id)
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reviews
CREATE POLICY "Users can view reviews about them or by them"
ON public.reviews
FOR SELECT
USING (auth.uid() = reviewer_id OR auth.uid() = reviewee_id);

CREATE POLICY "Users can create reviews"
ON public.reviews
FOR INSERT
WITH CHECK (auth.uid() = reviewer_id AND reviewer_id != reviewee_id);

CREATE POLICY "Users can update their own reviews"
ON public.reviews
FOR UPDATE
USING (auth.uid() = reviewer_id);

-- Add trigger for updated_at
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate average rating for a user
CREATE OR REPLACE FUNCTION public.calculate_user_rating(user_id UUID)
RETURNS DECIMAL(3,2)
LANGUAGE SQL
STABLE
AS $$
  SELECT COALESCE(AVG(rating), 0.00)::DECIMAL(3,2)
  FROM public.reviews
  WHERE reviewee_id = user_id;
$$;

-- Function to update profile rating
CREATE OR REPLACE FUNCTION public.update_profile_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.profiles
  SET rating = public.calculate_user_rating(NEW.reviewee_id)
  WHERE user_id = NEW.reviewee_id;
  RETURN NEW;
END;
$$;

-- Trigger to auto-update profile rating when review is added/updated
CREATE TRIGGER update_profile_rating_on_review
AFTER INSERT OR UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_profile_rating();