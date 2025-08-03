-- Drop the payments table as we're replacing it with a credit system
DROP TABLE IF EXISTS public.payments;

-- Create user wallets to track credits
CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance DECIMAL(10,2) DEFAULT 0.00 NOT NULL CHECK (balance >= 0),
  total_earned DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
  total_spent DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create credit transactions table for all wallet activities
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('credit_purchase', 'gig_payment', 'service_fee', 'withdrawal', 'refund')),
  amount DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  gig_id UUID REFERENCES public.gigs(id) ON DELETE SET NULL,
  application_id UUID REFERENCES public.gig_applications(id) ON DELETE SET NULL,
  reference_transaction_id UUID REFERENCES public.credit_transactions(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create gig payments table to track payments between users
CREATE TABLE public.gig_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id UUID NOT NULL REFERENCES public.gigs(id) ON DELETE CASCADE,
  application_id UUID NOT NULL UNIQUE REFERENCES public.gig_applications(id) ON DELETE CASCADE,
  payer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gross_amount DECIMAL(10,2) NOT NULL, -- Amount before service fee
  service_fee DECIMAL(10,2) NOT NULL, -- 3% service fee
  net_amount DECIMAL(10,2) NOT NULL, -- Amount worker receives
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gig_payments ENABLE ROW LEVEL SECURITY;

-- Wallet policies
CREATE POLICY "Users can view their own wallet" ON public.wallets
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet" ON public.wallets
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert wallets" ON public.wallets
FOR INSERT WITH CHECK (true);

-- Credit transaction policies
CREATE POLICY "Users can view their own transactions" ON public.credit_transactions
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert transactions" ON public.credit_transactions
FOR INSERT WITH CHECK (true);

-- Gig payment policies
CREATE POLICY "Users can view payments they are involved in" ON public.gig_payments
FOR SELECT USING (auth.uid() = payer_id OR auth.uid() = payee_id);

CREATE POLICY "System can manage payments" ON public.gig_payments
FOR ALL USING (true);

-- Add triggers for updated_at
CREATE TRIGGER update_wallets_updated_at
BEFORE UPDATE ON public.wallets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gig_payments_updated_at
BEFORE UPDATE ON public.gig_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically create wallet for new users
CREATE OR REPLACE FUNCTION public.create_wallet_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.wallets (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create wallet when profile is created
CREATE TRIGGER create_wallet_on_profile_creation
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.create_wallet_for_new_user();