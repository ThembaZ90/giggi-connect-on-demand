-- Create payments table to track gig payments
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id UUID REFERENCES public.gigs(id) ON DELETE CASCADE NOT NULL,
  application_id UUID REFERENCES public.gig_applications(id) ON DELETE CASCADE NOT NULL,
  payer_id UUID NOT NULL, -- The gig poster who pays
  payee_id UUID NOT NULL, -- The worker who gets paid
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'usd' NOT NULL,
  stripe_session_id TEXT UNIQUE,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(application_id) -- One payment per application
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Policies for payments table
CREATE POLICY "Users can view payments they are involved in" 
ON public.payments 
FOR SELECT 
USING (auth.uid() = payer_id OR auth.uid() = payee_id);

CREATE POLICY "Gig posters can create payments" 
ON public.payments 
FOR INSERT 
WITH CHECK (auth.uid() = payer_id);

CREATE POLICY "System can update payment status" 
ON public.payments 
FOR UPDATE 
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();