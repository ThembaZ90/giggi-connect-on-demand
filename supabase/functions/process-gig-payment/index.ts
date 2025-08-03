import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-GIG-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );

  try {
    logStep('Function started');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header provided');

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error('User not authenticated');
    logStep('User authenticated', { userId: user.id });

    const { applicationId, amount } = await req.json();
    if (!applicationId || !amount) {
      throw new Error('Missing required fields: applicationId and amount');
    }

    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      throw new Error('Invalid payment amount');
    }

    logStep('Processing payment', { applicationId, amount: paymentAmount });

    // Get application details
    const { data: application, error: appError } = await supabaseClient
      .from('gig_applications')
      .select(`
        *,
        gigs!inner(
          id,
          title,
          poster_id
        )
      `)
      .eq('id', applicationId)
      .eq('status', 'accepted')
      .single();

    if (appError || !application) {
      throw new Error('Application not found or not accepted');
    }

    const gig = application.gigs;
    if (gig.poster_id !== user.id) {
      throw new Error('Only the gig poster can process payment');
    }

    logStep('Application verified', { gigId: gig.id, workerId: application.worker_id });

    // Check if payment already exists
    const { data: existingPayment } = await supabaseClient
      .from('gig_payments')
      .select('id')
      .eq('application_id', applicationId)
      .single();

    if (existingPayment) {
      throw new Error('Payment already processed for this application');
    }

    // Calculate fees
    const serviceFeeRate = 0.03; // 3%
    const serviceFee = Math.round(paymentAmount * serviceFeeRate * 100) / 100;
    const netAmount = paymentAmount - serviceFee;

    logStep('Calculated fees', { 
      grossAmount: paymentAmount, 
      serviceFee, 
      netAmount 
    });

    // Get payer's wallet
    const { data: payerWallet, error: payerWalletError } = await supabaseClient
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (payerWalletError || !payerWallet) {
      throw new Error('Payer wallet not found');
    }

    if (payerWallet.balance < paymentAmount) {
      throw new Error('Insufficient credits. Please add credits to your wallet.');
    }

    // Get or create payee wallet
    let { data: payeeWallet, error: payeeWalletError } = await supabaseClient
      .from('wallets')
      .select('*')
      .eq('user_id', application.worker_id)
      .single();

    if (payeeWalletError) {
      // Create wallet for payee if it doesn't exist
      const { data: newWallet, error: createWalletError } = await supabaseClient
        .from('wallets')
        .insert({
          user_id: application.worker_id,
          balance: 0.00
        })
        .select()
        .single();

      if (createWalletError) throw new Error('Failed to create payee wallet');
      payeeWallet = newWallet;
    }

    logStep('Wallets verified', { 
      payerBalance: payerWallet.balance, 
      payeeBalance: payeeWallet.balance 
    });

    // Process the payment transaction
    const { error: transactionError } = await supabaseClient.rpc('process_gig_payment_transaction', {
      p_application_id: applicationId,
      p_gig_id: gig.id,
      p_payer_id: user.id,
      p_payee_id: application.worker_id,
      p_gross_amount: paymentAmount,
      p_service_fee: serviceFee,
      p_net_amount: netAmount,
      p_gig_title: gig.title
    });

    if (transactionError) {
      logStep('Transaction failed', { error: transactionError });
      throw new Error(`Payment processing failed: ${transactionError.message}`);
    }

    logStep('Payment processed successfully');

    return new Response(JSON.stringify({
      success: true,
      message: 'Payment processed successfully',
      grossAmount: paymentAmount,
      serviceFee: serviceFee,
      netAmount: netAmount
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep('ERROR', { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});