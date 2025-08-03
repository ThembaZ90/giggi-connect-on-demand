-- Create function to process gig payment transaction atomically
CREATE OR REPLACE FUNCTION public.process_gig_payment_transaction(
  p_application_id UUID,
  p_gig_id UUID,
  p_payer_id UUID,
  p_payee_id UUID,
  p_gross_amount DECIMAL(10,2),
  p_service_fee DECIMAL(10,2),
  p_net_amount DECIMAL(10,2),
  p_gig_title TEXT
)
RETURNS VOID AS $$
DECLARE
  v_payer_new_balance DECIMAL(10,2);
  v_payee_new_balance DECIMAL(10,2);
BEGIN
  -- Start transaction (implicit in function)
  
  -- Update payer wallet (deduct full amount)
  UPDATE public.wallets 
  SET 
    balance = balance - p_gross_amount,
    total_spent = total_spent + p_gross_amount,
    updated_at = now()
  WHERE user_id = p_payer_id
  RETURNING balance INTO v_payer_new_balance;
  
  -- Check if payer has sufficient balance
  IF v_payer_new_balance < 0 THEN
    RAISE EXCEPTION 'Insufficient credits in wallet';
  END IF;
  
  -- Update payee wallet (add net amount)
  UPDATE public.wallets 
  SET 
    balance = balance + p_net_amount,
    total_earned = total_earned + p_net_amount,
    updated_at = now()
  WHERE user_id = p_payee_id
  RETURNING balance INTO v_payee_new_balance;
  
  -- Create gig payment record
  INSERT INTO public.gig_payments (
    gig_id,
    application_id,
    payer_id,
    payee_id,
    gross_amount,
    service_fee,
    net_amount,
    payment_status
  ) VALUES (
    p_gig_id,
    p_application_id,
    p_payer_id,
    p_payee_id,
    p_gross_amount,
    p_service_fee,
    p_net_amount,
    'completed'
  );
  
  -- Record payer transaction (payment)
  INSERT INTO public.credit_transactions (
    user_id,
    type,
    amount,
    balance_after,
    description,
    gig_id,
    application_id,
    status
  ) VALUES (
    p_payer_id,
    'gig_payment',
    -p_gross_amount,
    v_payer_new_balance,
    'Payment for gig: ' || p_gig_title,
    p_gig_id,
    p_application_id,
    'completed'
  );
  
  -- Record payee transaction (earnings)
  INSERT INTO public.credit_transactions (
    user_id,
    type,
    amount,
    balance_after,
    description,
    gig_id,
    application_id,
    status
  ) VALUES (
    p_payee_id,
    'gig_payment',
    p_net_amount,
    v_payee_new_balance,
    'Earnings from gig: ' || p_gig_title || ' (after 3% service fee)',
    p_gig_id,
    p_application_id,
    'completed'
  );
  
  -- Record service fee transaction (platform earnings)
  INSERT INTO public.credit_transactions (
    user_id,
    type,
    amount,
    balance_after,
    description,
    gig_id,
    application_id,
    status
  ) VALUES (
    p_payer_id,
    'service_fee',
    p_service_fee,
    v_payer_new_balance,
    'Service fee (3%) for gig: ' || p_gig_title,
    p_gig_id,
    p_application_id,
    'completed'
  );
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;