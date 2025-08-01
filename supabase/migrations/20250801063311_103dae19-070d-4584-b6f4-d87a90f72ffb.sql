-- Create gig applications table to track applications
CREATE TYPE application_status AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');

CREATE TABLE public.gig_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gig_id UUID NOT NULL REFERENCES public.gigs(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  status application_status NOT NULL DEFAULT 'pending',
  message TEXT,
  proposed_rate NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure a worker can only apply once per gig
  UNIQUE(gig_id, worker_id)
);

-- Enable RLS
ALTER TABLE public.gig_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gig applications
CREATE POLICY "Workers can view their own applications" 
ON public.gig_applications 
FOR SELECT 
USING (auth.uid() = worker_id);

CREATE POLICY "Gig posters can view applications for their gigs" 
ON public.gig_applications 
FOR SELECT 
USING (
  auth.uid() IN (
    SELECT poster_id FROM public.gigs WHERE id = gig_applications.gig_id
  )
);

CREATE POLICY "Workers can create applications" 
ON public.gig_applications 
FOR INSERT 
WITH CHECK (auth.uid() = worker_id);

CREATE POLICY "Workers can update their own applications" 
ON public.gig_applications 
FOR UPDATE 
USING (auth.uid() = worker_id);

CREATE POLICY "Gig posters can update applications for their gigs" 
ON public.gig_applications 
FOR UPDATE 
USING (
  auth.uid() IN (
    SELECT poster_id FROM public.gigs WHERE id = gig_applications.gig_id
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_gig_applications_updated_at
BEFORE UPDATE ON public.gig_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_gig_applications_gig_id ON public.gig_applications(gig_id);
CREATE INDEX idx_gig_applications_worker_id ON public.gig_applications(worker_id);
CREATE INDEX idx_gig_applications_status ON public.gig_applications(status);