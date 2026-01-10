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
