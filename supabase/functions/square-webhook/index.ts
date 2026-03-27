import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-square-hmacsha256-signature',
};

// Verify Square webhook signature
async function verifySignature(payload: string, signature: string, webhookUrl: string): Promise<boolean> {
  const sigKey = Deno.env.get('SQUARE_WEBHOOK_SIGNATURE_KEY');
  if (!sigKey) {
    console.error('SQUARE_WEBHOOK_SIGNATURE_KEY not configured');
    return false;
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(sigKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signaturePayload = webhookUrl + payload;
  const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(signaturePayload));
  const computedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)));

  return computedSignature === signature;
}

function generateActivationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
    if (i === 3 || i === 7) result += '-';
  }
  return result;
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload = await req.text();
    const signature = req.headers.get('x-square-hmacsha256-signature');
    const webhookUrl = `${supabaseUrl}/functions/v1/square-webhook`;

    if (signature && !(await verifySignature(payload, signature, webhookUrl))) {
      console.error('Invalid webhook signature');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const event = JSON.parse(payload);
    console.log('Square webhook event:', event.type);

    // ── SUBSCRIPTION CREATED ──
    if (event.type === 'subscription.created') {
      const subscription = event.data?.object?.subscription;
      if (!subscription) {
        console.log('No subscription object in event');
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const customerId = subscription.customer_id;
      const subscriptionId = subscription.id;
      const planId = subscription.plan_variation_id;

      console.log('Subscription created:', { subscriptionId, customerId, planId });

      // Fetch customer email from Square
      const accessToken = Deno.env.get('SQUARE_ACCESS_TOKEN');
      let receiptEmail = '';
      if (accessToken && customerId) {
        try {
          const custRes = await fetch(`https://connect.squareup.com/v2/customers/${customerId}`, {
            headers: {
              'Square-Version': '2024-01-18',
              'Authorization': `Bearer ${accessToken}`,
            },
          });
          const custData = await custRes.json();
          receiptEmail = custData.customer?.email_address || '';
        } catch (e) {
          console.error('Failed to fetch customer email:', e);
        }
      }

      // Generate activation code
      const activationCode = generateActivationCode();
      const customerHash = await sha256Hex(customerId);

      // Encrypt sensitive fields
      const { data: emailEncrypted } = await supabase.rpc('encrypt_sensitive', { plain_text: receiptEmail });
      const { data: customerEncrypted } = await supabase.rpc('encrypt_sensitive', { plain_text: customerId });
      const { data: subEncrypted } = await supabase.rpc('encrypt_sensitive', { plain_text: subscriptionId });

      const { error } = await supabase
        .from('activation_codes')
        .insert({
          code: activationCode,
          email_encrypted: emailEncrypted,
          square_customer_id_encrypted: customerEncrypted,
          square_customer_id_hash: customerHash,
          square_subscription_id_encrypted: subEncrypted,
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        });

      if (error) {
        console.error('Error creating activation code:', error);
      } else {
        console.log('Activation code created for subscription:', activationCode);
      }

      return new Response(JSON.stringify({ success: true, code: activationCode }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── SUBSCRIPTION UPDATED (status changes, cancellations) ──
    if (event.type === 'subscription.updated') {
      const subscription = event.data?.object?.subscription;
      if (!subscription?.customer_id) {
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const customerHash = await sha256Hex(subscription.customer_id);
      const status = subscription.status; // ACTIVE, CANCELED, PAUSED, DEACTIVATED

      console.log('Subscription updated:', { id: subscription.id, status });

      if (status === 'CANCELED' || status === 'DEACTIVATED') {
        // Update payment status to suspended
        const { data: existingStatus } = await supabase
          .from('subscription_payment_status')
          .select('*')
          .eq('square_customer_id_hash', customerHash)
          .single();

        if (existingStatus) {
          await supabase
            .from('subscription_payment_status')
            .update({
              status: 'suspended',
              suspension_date: new Date().toISOString(),
              last_error: `Subscription ${status.toLowerCase()}`,
            })
            .eq('id', existingStatus.id);

          // Archive family if applicable
          if (existingStatus.entity_type === 'family') {
            await supabase
              .from('families')
              .update({
                is_archived: true,
                archived_at: new Date().toISOString(),
              })
              .eq('id', existingStatus.entity_id);
          }
        }
      }
    }

    // ── INVOICE PAYMENT MADE (recurring payment success) ──
    if (event.type === 'invoice.payment_made') {
      const invoice = event.data?.object?.invoice;
      const subscriptionId = invoice?.subscription_id;
      const customerId = invoice?.primary_recipient?.customer_id;

      console.log('Invoice payment made:', { subscriptionId, customerId });

      if (customerId) {
        const customerHash = await sha256Hex(customerId);

        // Reactivate if was past_due or suspended
        const { data: existingStatus } = await supabase
          .from('subscription_payment_status')
          .select('*')
          .eq('square_customer_id_hash', customerHash)
          .in('status', ['past_due', 'suspended'])
          .single();

        if (existingStatus) {
          console.log('Reactivating account after successful invoice payment');

          await supabase
            .from('subscription_payment_status')
            .update({
              status: 'active',
              last_payment_attempt: new Date().toISOString(),
              next_retry_at: null,
              failed_at: null,
              grace_period_ends_at: null,
              suspension_date: null,
              retry_count: 0,
              last_error: null,
              payment_updated_at: new Date().toISOString(),
            })
            .eq('id', existingStatus.id);

          // Unarchive family if suspended
          if (existingStatus.entity_type === 'family' && existingStatus.status === 'suspended') {
            await supabase
              .from('families')
              .update({
                is_archived: false,
                archived_at: null,
                archived_by: null,
              })
              .eq('id', existingStatus.entity_id);
          }
        }
      }
    }

    // ── PAYMENT COMPLETED (one-time or first subscription payment) ──
    if (event.type === 'payment.completed') {
      const payment = event.data?.object?.payment;
      const customerId = payment?.customer_id;

      if (customerId) {
        const customerHash = await sha256Hex(customerId);

        // Reactivate if past_due/suspended
        const { data: existingStatus } = await supabase
          .from('subscription_payment_status')
          .select('*')
          .eq('square_customer_id_hash', customerHash)
          .in('status', ['past_due', 'suspended'])
          .single();

        if (existingStatus) {
          console.log('Reactivating account after successful payment');
          await supabase
            .from('subscription_payment_status')
            .update({
              status: 'active',
              last_payment_attempt: new Date().toISOString(),
              next_retry_at: null,
              failed_at: null,
              grace_period_ends_at: null,
              suspension_date: null,
              retry_count: 0,
              last_error: null,
              payment_updated_at: new Date().toISOString(),
            })
            .eq('id', existingStatus.id);

          if (existingStatus.entity_type === 'family' && existingStatus.status === 'suspended') {
            await supabase
              .from('families')
              .update({ is_archived: false, archived_at: null, archived_by: null })
              .eq('id', existingStatus.entity_id);
          }
        }
      }
    }

    // ── PAYMENT FAILED / INVOICE PAYMENT FAILED ──
    if (event.type === 'payment.failed' || event.type === 'invoice.payment_failed') {
      const payment = event.data?.object?.payment || event.data?.object?.invoice;
      const customerId = payment?.customer_id || payment?.primary_recipient?.customer_id;
      const cardLast4 = payment?.card_details?.card?.last_4;
      const errorMessage = payment?.processing_fee?.[0]?.effective_at || 'Payment declined';

      console.log('Payment failed:', { customerId, cardLast4 });

      if (customerId) {
        const customerHash = await sha256Hex(customerId);
        const now = new Date();
        const gracePeriodEnd = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
        const nextRetry = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        const { data: existingStatus } = await supabase
          .from('subscription_payment_status')
          .select('*')
          .eq('square_customer_id_hash', customerHash)
          .single();

        if (existingStatus) {
          await supabase
            .from('subscription_payment_status')
            .update({
              status: 'past_due',
              last_payment_attempt: now.toISOString(),
              next_retry_at: nextRetry.toISOString(),
              failed_at: existingStatus.failed_at || now.toISOString(),
              grace_period_ends_at: existingStatus.grace_period_ends_at || gracePeriodEnd.toISOString(),
              retry_count: (existingStatus.retry_count || 0) + 1,
              last_error: errorMessage,
              card_last_four: cardLast4 || existingStatus.card_last_four,
            })
            .eq('id', existingStatus.id);

          console.log('Payment status updated to past_due');
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
