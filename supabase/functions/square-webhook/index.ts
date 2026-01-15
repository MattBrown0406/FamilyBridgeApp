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

// Generate activation code
function generateActivationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
    if (i === 3 || i === 7) {
      result += '-';
    }
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

    // Verify webhook signature
    if (signature && !(await verifySignature(payload, signature, webhookUrl))) {
      console.error('Invalid webhook signature');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const event = JSON.parse(payload);
    console.log('Square webhook event:', event.type);

    // Handle payment completed events
    if (event.type === 'payment.completed') {
      const payment = event.data.object.payment;
      const orderId = payment.order_id;
      const customerId = payment.customer_id;
      const receiptEmail = payment.receipt_email;

      console.log('Payment completed:', { orderId, customerId, receiptEmail });

      // Generate activation code
      const activationCode = generateActivationCode();

      // Encrypt sensitive fields before storage (plaintext columns are not stored)
      const { data: emailEncrypted, error: emailEncError } = await supabase.rpc('encrypt_sensitive', {
        plain_text: receiptEmail,
      });
      if (emailEncError) {
        console.error('Error encrypting receipt email:', emailEncError);
        return new Response(JSON.stringify({ error: 'Failed to create activation code' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: customerEncrypted, error: customerEncError } = await supabase.rpc('encrypt_sensitive', {
        plain_text: customerId,
      });
      if (customerEncError) {
        console.error('Error encrypting customer ID:', customerEncError);
        return new Response(JSON.stringify({ error: 'Failed to create activation code' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const squareCustomerIdHash = await sha256Hex(customerId);

      // Store activation code in database
      const { data, error } = await supabase
        .from('activation_codes')
        .insert({
          code: activationCode,
          email_encrypted: emailEncrypted,
          square_customer_id_encrypted: customerEncrypted,
          square_customer_id_hash: squareCustomerIdHash,
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year expiry
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating activation code:', error);
        return new Response(JSON.stringify({ error: 'Failed to create activation code' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Activation code created:', activationCode);

      // TODO: Send email with activation code (would need email service integration)
      // For now, the code is stored and can be retrieved via the purchase flow

      return new Response(JSON.stringify({ success: true, code: activationCode }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle subscription events
    if (event.type === 'subscription.created' || event.type === 'subscription.updated') {
      const subscription = event.data.object.subscription;
      console.log('Subscription event:', subscription);

      // Update activation code with subscription ID if exists
      if (subscription.customer_id) {
        const customerHash = await sha256Hex(subscription.customer_id);

        const { data: subEncrypted, error: subEncError } = await supabase.rpc('encrypt_sensitive', {
          plain_text: subscription.id,
        });

        if (subEncError) {
          console.error('Error encrypting subscription ID:', subEncError);
        } else {
          await supabase
            .from('activation_codes')
            .update({ square_subscription_id_encrypted: subEncrypted })
            .eq('square_customer_id_hash', customerHash);
        }
      }
    }

    // Handle payment failed events
    if (event.type === 'payment.failed' || event.type === 'invoice.payment_failed') {
      const payment = event.data?.object?.payment || event.data?.object?.invoice;
      const customerId = payment?.customer_id;
      const cardLast4 = payment?.card_details?.card?.last_4;
      const errorMessage = payment?.processing_fee?.[0]?.effective_at || 'Payment declined';

      console.log('Payment failed:', { customerId, cardLast4 });

      if (customerId) {
        const customerHash = await sha256Hex(customerId);
        const now = new Date();
        const gracePeriodEnd = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days
        const nextRetry = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

        // Find or create payment status record
        const { data: existingStatus } = await supabase
          .from('subscription_payment_status')
          .select('*')
          .eq('square_customer_id_hash', customerHash)
          .single();

        if (existingStatus) {
          // Update existing record
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
        }

        console.log('Payment status updated to past_due');
      }
    }

    // Handle successful payment after being past_due
    if (event.type === 'payment.completed') {
      const payment = event.data?.object?.payment;
      const customerId = payment?.customer_id;

      if (customerId) {
        const customerHash = await sha256Hex(customerId);

        // Check if this customer was past_due and reactivate
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

          // Unarchive family if it was suspended
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
