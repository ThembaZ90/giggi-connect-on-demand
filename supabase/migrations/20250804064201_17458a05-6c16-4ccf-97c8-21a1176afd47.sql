-- Create SA ID verification and security features

-- Create verification status enum
CREATE TYPE public.verification_status AS ENUM ('pending', 'in_review', 'approved', 'rejected');

-- Create verification documents table  
CREATE TABLE public.verification_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('sa_id_front', 'sa_id_back', 'proof_of_address', 'selfie')),
  document_url TEXT NOT NULL,
  verification_status verification_status NOT NULL DEFAULT 'pending',
  verification_notes TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create SA ID verification table
CREATE TABLE public.sa_id_verification (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  id_number TEXT NOT NULL,
  first_names TEXT NOT NULL,
  surname TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('Male', 'Female')),
  citizenship TEXT NOT NULL CHECK (citizenship IN ('SA Citizen', 'Permanent Resident')),
  verification_status verification_status NOT NULL DEFAULT 'pending',
  verification_score INTEGER CHECK (verification_score >= 0 AND verification_score <= 100),
  verification_notes TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create phone verification table
CREATE TABLE public.phone_verification (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  phone_number TEXT NOT NULL,
  verification_code TEXT,
  code_expires_at TIMESTAMP WITH TIME ZONE,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verification_attempts INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create security settings table
CREATE TABLE public.security_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  sms_notifications BOOLEAN NOT NULL DEFAULT true,
  account_locked BOOLEAN NOT NULL DEFAULT false,
  lock_reason TEXT,
  locked_at TIMESTAMP WITH TIME ZONE,
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  last_failed_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user reports table for safety
CREATE TABLE public.user_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL,
  reported_user_id UUID NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('fraud', 'inappropriate_behavior', 'fake_profile', 'scam', 'other')),
  description TEXT NOT NULL,
  evidence_urls TEXT[],
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  admin_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Update profiles table with security fields
ALTER TABLE public.profiles ADD COLUMN verification_level INTEGER NOT NULL DEFAULT 0 CHECK (verification_level >= 0 AND verification_level <= 5);
ALTER TABLE public.profiles ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN background_check_status verification_status DEFAULT 'pending';
ALTER TABLE public.profiles ADD COLUMN account_status TEXT NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'banned', 'pending_verification'));

-- Enable Row Level Security
ALTER TABLE public.verification_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sa_id_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Verification documents policies
CREATE POLICY "Users can view their own verification documents" 
ON public.verification_documents 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own verification documents" 
ON public.verification_documents 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update verification documents" 
ON public.verification_documents 
FOR UPDATE 
USING (true);

-- SA ID verification policies
CREATE POLICY "Users can view their own SA ID verification" 
ON public.sa_id_verification 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own SA ID verification" 
ON public.sa_id_verification 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own SA ID verification" 
ON public.sa_id_verification 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Phone verification policies
CREATE POLICY "Users can manage their own phone verification" 
ON public.phone_verification 
FOR ALL 
USING (auth.uid() = user_id);

-- Security settings policies
CREATE POLICY "Users can manage their own security settings" 
ON public.security_settings 
FOR ALL 
USING (auth.uid() = user_id);

-- User reports policies
CREATE POLICY "Users can create reports" 
ON public.user_reports 
FOR INSERT 
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view reports they made" 
ON public.user_reports 
FOR SELECT 
USING (auth.uid() = reporter_id);

CREATE POLICY "Users can view reports about them" 
ON public.user_reports 
FOR SELECT 
USING (auth.uid() = reported_user_id);

-- Create storage bucket for verification documents
INSERT INTO storage.buckets (id, name, public) VALUES ('verification-docs', 'verification-docs', false);

-- Create storage policies for verification documents
CREATE POLICY "Users can upload their verification documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'verification-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own verification documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'verification-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "System can view all verification documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'verification-docs');

-- Create function to validate SA ID number
CREATE OR REPLACE FUNCTION public.validate_sa_id_number(id_number TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  check_digit INTEGER;
  calculated_check_digit INTEGER;
  sum_odd INTEGER := 0;
  sum_even INTEGER := 0;
  temp_number TEXT;
  i INTEGER;
BEGIN
  -- Check if ID number is 13 digits
  IF LENGTH(id_number) != 13 OR id_number !~ '^[0-9]+$' THEN
    RETURN FALSE;
  END IF;
  
  -- Extract check digit
  check_digit := CAST(SUBSTRING(id_number, 13, 1) AS INTEGER);
  
  -- Calculate sum of digits in odd positions (1st, 3rd, 5th, etc.)
  FOR i IN 1..12 BY 2 LOOP
    sum_odd := sum_odd + CAST(SUBSTRING(id_number, i, 1) AS INTEGER);
  END LOOP;
  
  -- Calculate sum of digits in even positions multiplied by 2
  temp_number := '';
  FOR i IN 2..12 BY 2 LOOP
    temp_number := temp_number || (CAST(SUBSTRING(id_number, i, 1) AS INTEGER) * 2)::TEXT;
  END LOOP;
  
  -- Sum all digits in temp_number
  FOR i IN 1..LENGTH(temp_number) LOOP
    sum_even := sum_even + CAST(SUBSTRING(temp_number, i, 1) AS INTEGER);
  END LOOP;
  
  -- Calculate check digit
  calculated_check_digit := (10 - ((sum_odd + sum_even) % 10)) % 10;
  
  RETURN calculated_check_digit = check_digit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to extract info from SA ID number
CREATE OR REPLACE FUNCTION public.extract_sa_id_info(id_number TEXT)
RETURNS JSON AS $$
DECLARE
  year_digits TEXT;
  birth_year INTEGER;
  birth_month INTEGER;
  birth_day INTEGER;
  gender_digit INTEGER;
  citizenship_digit INTEGER;
  result JSON;
BEGIN
  -- Validate ID number first
  IF NOT public.validate_sa_id_number(id_number) THEN
    RETURN '{"valid": false, "error": "Invalid SA ID number"}'::JSON;
  END IF;
  
  -- Extract year (first 2 digits)
  year_digits := SUBSTRING(id_number, 1, 2);
  birth_year := CAST(year_digits AS INTEGER);
  
  -- Determine century (if <= current year - 2000, assume 20xx, else 19xx)
  IF birth_year <= EXTRACT(YEAR FROM CURRENT_DATE) - 2000 THEN
    birth_year := birth_year + 2000;
  ELSE
    birth_year := birth_year + 1900;
  END IF;
  
  birth_month := CAST(SUBSTRING(id_number, 3, 2) AS INTEGER);
  birth_day := CAST(SUBSTRING(id_number, 5, 2) AS INTEGER);
  gender_digit := CAST(SUBSTRING(id_number, 7, 1) AS INTEGER);
  citizenship_digit := CAST(SUBSTRING(id_number, 11, 1) AS INTEGER);
  
  result := json_build_object(
    'valid', true,
    'date_of_birth', birth_year || '-' || LPAD(birth_month::TEXT, 2, '0') || '-' || LPAD(birth_day::TEXT, 2, '0'),
    'gender', CASE WHEN gender_digit >= 5 THEN 'Male' ELSE 'Female' END,
    'citizenship', CASE WHEN citizenship_digit = 0 THEN 'SA Citizen' ELSE 'Permanent Resident' END
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for updated_at columns
CREATE TRIGGER update_verification_documents_updated_at
BEFORE UPDATE ON public.verification_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sa_id_verification_updated_at
BEFORE UPDATE ON public.sa_id_verification
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_phone_verification_updated_at
BEFORE UPDATE ON public.phone_verification
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_security_settings_updated_at
BEFORE UPDATE ON public.security_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_reports_updated_at
BEFORE UPDATE ON public.user_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically create security settings for new users
CREATE OR REPLACE FUNCTION public.create_security_settings_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.security_settings (user_id)
  VALUES (NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create security settings when profile is created
CREATE TRIGGER on_profile_created_create_security_settings
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.create_security_settings_for_new_user();