-- Create payment methods table for users
CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('bank_account', 'card', 'paypal')),
  provider TEXT NOT NULL CHECK (provider IN ('payfast', 'ozow', 'paypal', 'manual_eft')),
  
  -- Bank account details (for SA banks)
  bank_name TEXT,
  account_holder_name TEXT,
  account_number TEXT,
  branch_code TEXT,
  account_type TEXT CHECK (account_type IN ('savings', 'current', 'cheque')),
  
  -- Card details (encrypted/tokenized)
  card_last_four TEXT,
  card_brand TEXT,
  card_token TEXT,
  
  -- PayPal details
  paypal_email TEXT,
  
  -- General
  is_default BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create credit purchases table
CREATE TABLE public.credit_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  credits_amount DECIMAL(10,2) NOT NULL, -- Usually same as amount, but could have bonuses
  payment_provider TEXT NOT NULL,
  external_transaction_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')) NOT NULL,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create withdrawal requests table
CREATE TABLE public.withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_method_id UUID NOT NULL REFERENCES public.payment_methods(id) ON DELETE RESTRICT,
  amount DECIMAL(10,2) NOT NULL,
  withdrawal_fee DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
  net_amount DECIMAL(10,2) NOT NULL, -- Amount after fees
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')) NOT NULL,
  external_transaction_id TEXT,
  processing_notes TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Payment methods policies
CREATE POLICY "Users can view their own payment methods" ON public.payment_methods
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own payment methods" ON public.payment_methods
FOR ALL USING (auth.uid() = user_id);

-- Credit purchases policies
CREATE POLICY "Users can view their own purchases" ON public.credit_purchases
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage purchases" ON public.credit_purchases
FOR ALL USING (true);

-- Withdrawal requests policies
CREATE POLICY "Users can view their own withdrawals" ON public.withdrawal_requests
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create withdrawal requests" ON public.withdrawal_requests
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update withdrawals" ON public.withdrawal_requests
FOR UPDATE USING (true);

-- Add triggers for updated_at
CREATE TRIGGER update_payment_methods_updated_at
BEFORE UPDATE ON public.payment_methods
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_credit_purchases_updated_at
BEFORE UPDATE ON public.credit_purchases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_withdrawal_requests_updated_at
BEFORE UPDATE ON public.withdrawal_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();