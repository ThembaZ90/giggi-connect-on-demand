-- Create enum for gig status
CREATE TYPE public.gig_status AS ENUM ('open', 'in_progress', 'completed', 'cancelled');

-- Create enum for gig categories
CREATE TYPE public.gig_category AS ENUM (
  'cleaning', 'moving', 'delivery', 'handyman', 'gardening', 
  'tech_support', 'tutoring', 'pet_care', 'event_help', 'other'
);

-- Create gigs table
CREATE TABLE public.gigs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poster_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category gig_category NOT NULL,
  location TEXT NOT NULL,
  budget_min DECIMAL(10,2),
  budget_max DECIMAL(10,2),
  duration_hours INTEGER,
  status gig_status NOT NULL DEFAULT 'open',
  required_skills TEXT[],
  contact_phone TEXT,
  preferred_start_date TIMESTAMP WITH TIME ZONE,
  is_urgent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.gigs ENABLE ROW LEVEL SECURITY;

-- Create policies for gigs
CREATE POLICY "Anyone can view open gigs" 
ON public.gigs 
FOR SELECT 
USING (status = 'open' OR auth.uid() = poster_id);

CREATE POLICY "Users can create their own gigs" 
ON public.gigs 
FOR INSERT 
WITH CHECK (auth.uid() = poster_id);

CREATE POLICY "Users can update their own gigs" 
ON public.gigs 
FOR UPDATE 
USING (auth.uid() = poster_id);

CREATE POLICY "Users can delete their own gigs" 
ON public.gigs 
FOR DELETE 
USING (auth.uid() = poster_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_gigs_updated_at
BEFORE UPDATE ON public.gigs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_gigs_poster_id ON public.gigs(poster_id);
CREATE INDEX idx_gigs_category ON public.gigs(category);
CREATE INDEX idx_gigs_status ON public.gigs(status);
CREATE INDEX idx_gigs_location ON public.gigs USING gin(to_tsvector('english', location));
CREATE INDEX idx_gigs_created_at ON public.gigs(created_at DESC);