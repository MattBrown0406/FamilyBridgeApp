import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GRACE_PERIOD_DAYS = 5;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  const accessToken = Deno.env.get('SQUARE_ACCESS_TOKEN');

  if (!accessToken) {
    console.error('Square credentials not configured');
    return new Response(JSON.stringify({ error: 'Square not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const now = new Date();
    
    // Get all past_due payments that need retry
    const { data: pastDuePayments, error: fetchError } = await supabase
      .from('subscription_payment_status')
      .select('*')
      .eq('status', 'past_due')
      .lte('next_retry_at', now.toISOString());

    if (fetchError) {
      console.error('Error fetching past due payments:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${pastDuePayments?.length || 0} payments to retry`);

    const results = [];

    for (const payment of pastDuePayments || []) {
      try {
        // Check if grace period has expired
        const gracePeriodEnd = payment.grace_period_ends_at 
          ? new Date(payment.grace_period_ends_at) 
          : null;

        if (gracePeriodEnd && now > gracePeriodEnd) {
          // Suspend the account
          console.log(`Suspending account for ${payment.entity_type}:${payment.entity_id}`);
          
          const { error: suspendError } = await supabase
            .from('subscription_payment_status')
            .update({
              status: 'suspended',
              suspension_date: now.toISOString(),
            })
            .eq('id', payment.id);

          if (suspendError) {
            console.error('Error suspending account:', suspendError);
          }

          // Archive the family/org if it's a family
          if (payment.entity_type === 'family') {
            await supabase
              .from('families')
              .update({
                is_archived: true,
                archived_at: now.toISOString(),
              })
              .eq('id', payment.entity_id);
          }

          results.push({ id: payment.id, action: 'suspended' });
          continue;
        }

        // Attempt to retry payment via Square
        // Note: This requires stored payment method which Square Subscriptions handles
        // For now, we'll just increment retry count and set next retry time
        
        const nextRetry = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

        const { error: updateError } = await supabase
          .from('subscription_payment_status')
          .update({
            last_payment_attempt: now.toISOString(),
            next_retry_at: nextRetry.toISOString(),
            retry_count: payment.retry_count + 1,
          })
          .eq('id', payment.id);

        if (updateError) {
          console.error('Error updating payment status:', updateError);
        }

        results.push({ 
          id: payment.id, 
          action: 'retry_scheduled',
          next_retry: nextRetry.toISOString(),
        });

      } catch (paymentError) {
        console.error(`Error processing payment ${payment.id}:`, paymentError);
        const errMsg = paymentError instanceof Error ? paymentError.message : 'Unknown error';
        results.push({ id: payment.id, action: 'error', error: errMsg });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      processed: results.length,
      results 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in retry-failed-payments:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
