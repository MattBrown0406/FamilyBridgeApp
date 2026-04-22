import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Square SUBSCRIPTION_PLAN_VARIATION ID for Family Bridge Single Family Subscription (monthly).
// STATIC-priced variation ($49.99/month).
const FAMILY_PLAN_ID = "GEMWDEES3W2AVLKCHDOZESQF";
const FAMILY_PRICE_CENTS = 4999;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get('SQUARE_ACCESS_TOKEN');
    if (!accessToken) {
      throw new Error('Square credentials not configured');
    }

    const { email, redirectUrl, trialDays } = await req.json();

    if (!email) {
      throw new Error('Email is required');
    }

    console.log('Creating family Checkout payment link for:', email, trialDays ? `(trial ${trialDays}d)` : '');

    // Step 1: Get an active location
    const locationsRes = await fetch('https://connect.squareup.com/v2/locations', {
      method: 'GET',
      headers: {
        'Square-Version': '2024-01-18',
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    const locationsData = await locationsRes.json();
    if (!locationsData.locations?.length) {
      throw new Error('No Square locations found');
    }
    const locationId = (locationsData.locations.find((l: any) => l.status === 'ACTIVE') || locationsData.locations[0]).id;

    // Step 2: Build a hosted Payment Link.
    // We charge $0 today (auth-only via $1 then refund? -> not allowed cleanly via Checkout).
    // Cleaner approach: use Square Checkout `quick_pay` for the FIRST month's charge.
    // This GUARANTEES a card is collected and a real payment is captured.
    // After redirect back, finalize-family-purchase verifies the COMPLETED payment by orderId
    // and then issues the activation code and creates the recurring subscription server-side.
    //
    // For trials we still bill $0.50 today (auth) is messy; instead bill the full $49.99 today
    // and treat the purchase as month 1 of service (no separate trial). The previous "7-day trial"
    // wording was misleading anyway because no card was being captured. Trial UX can be added back
    // later via Square Subscriptions hosted flow once available in the account.
    const successUrl = redirectUrl || `${req.headers.get('origin')}/family-purchase?status=success`;

    const checkoutBody = {
      idempotency_key: crypto.randomUUID(),
      quick_pay: {
        name: 'FamilyBridge — Family Subscription (1 month)',
        price_money: { amount: FAMILY_PRICE_CENTS, currency: 'USD' },
        location_id: locationId,
      },
      pre_populated_data: {
        buyer_email: email,
      },
      checkout_options: {
        ask_for_shipping_address: false,
        merchant_support_email: 'support@familybridgeapp.com',
        redirect_url: successUrl,
        accepted_payment_methods: { apple_pay: true, google_pay: true },
      },
      payment_note: `FamilyBridge family subscription for ${email}`,
    };

    const checkoutRes = await fetch('https://connect.squareup.com/v2/online-checkout/payment-links', {
      method: 'POST',
      headers: {
        'Square-Version': '2024-01-18',
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(checkoutBody),
    });

    const checkoutData = await checkoutRes.json();
    console.log('Square payment link response:', JSON.stringify(checkoutData));

    if (checkoutData.errors) {
      const sqErr = checkoutData.errors[0];
      const detail = sqErr?.detail || 'Failed to create checkout link';
      return new Response(JSON.stringify({
        error: `Square: ${detail}`,
        squareErrorCode: sqErr?.code,
        squareErrorCategory: sqErr?.category,
        diagnostics: { stage: 'create_payment_link', planId: FAMILY_PLAN_ID },
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const paymentLink = checkoutData.payment_link;
    if (!paymentLink?.url || !paymentLink?.order_id) {
      throw new Error('Square did not return a hosted checkout URL');
    }

    return new Response(JSON.stringify({
      checkoutUrl: paymentLink.url,
      orderId: paymentLink.order_id,
      paymentLinkId: paymentLink.id,
      // Subscription is NOT created here. It will be created by finalize-family-purchase
      // ONLY after the first payment is verified COMPLETED, and using the saved
      // card-on-file from that payment.
      subscriptionPending: true,
      trialDays: 0,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Family checkout creation error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
