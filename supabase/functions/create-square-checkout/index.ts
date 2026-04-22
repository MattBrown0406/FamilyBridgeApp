import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Square SUBSCRIPTION_PLAN_VARIATION IDs (STATIC pricing) for the Provider tier.
// These are used by finalize-provider-purchase AFTER the first payment is verified.
const PROVIDER_PLAN_IDS: Record<string, string> = {
  monthly: "BBC2S6S42PUSEC5E4TARE5SK",
  quarterly: "HCBQIKP5PX4OMSFTAS35XDLU",
  annual: "UQO7ZIJKHHBA377GMRNXEM4I",
};

// First-period charge collected today via hosted checkout (Square Payment Link).
// MUST match the variation's recurring price so customers are not surprised.
const PROVIDER_PRICE_CENTS: Record<string, number> = {
  monthly: 25000,    // $250.00 / month
  quarterly: 62900,  // $629.00 / 3 months
  annual: 250000,    // $2,500.00 / year
};

const PROVIDER_PERIOD_LABEL: Record<string, string> = {
  monthly: '1 month',
  quarterly: '3 months',
  annual: '1 year',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get('SQUARE_ACCESS_TOKEN');
    if (!accessToken) {
      throw new Error('Square credentials not configured');
    }

    const { email, redirectUrl, billingPeriod = 'monthly', couponCode, specialPrice } = await req.json();

    if (!email) {
      throw new Error('Email is required');
    }

    const planId = PROVIDER_PLAN_IDS[billingPeriod];
    const defaultCents = PROVIDER_PRICE_CENTS[billingPeriod];
    const periodLabel = PROVIDER_PERIOD_LABEL[billingPeriod];
    if (!planId || !defaultCents) {
      throw new Error(`Invalid billing period: ${billingPeriod}`);
    }

    // Coupon support: special_price (cents) overrides the first-period charge.
    const firstPeriodCents = typeof specialPrice === 'number' && specialPrice > 0
      ? specialPrice
      : defaultCents;

    console.log('Creating provider hosted checkout', {
      email,
      billingPeriod,
      planId,
      firstPeriodCents,
      hasCoupon: !!couponCode,
    });

    // Step 1: Get an active Square location
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

    // Step 2: Build a hosted Payment Link that charges the FIRST period upfront.
    // This guarantees Square collects a real card and captures a real payment.
    // After redirect back, finalize-provider-purchase verifies the COMPLETED payment,
    // saves the card-on-file, creates the recurring subscription against that card,
    // and only then mints the activation code.
    const successUrl = redirectUrl || `${req.headers.get('origin')}/provider-purchase?status=success`;

    const checkoutBody = {
      idempotency_key: crypto.randomUUID(),
      quick_pay: {
        name: `FamilyBridge — Provider Subscription (${periodLabel})`,
        price_money: { amount: firstPeriodCents, currency: 'USD' },
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
      payment_note: `FamilyBridge provider ${billingPeriod} subscription for ${email}`,
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
    console.log('Square provider payment link response:', JSON.stringify(checkoutData));

    if (checkoutData.errors) {
      const sqErr = checkoutData.errors[0];
      const detail = sqErr?.detail || 'Failed to create checkout link';
      return new Response(JSON.stringify({
        error: `Square: ${detail}`,
        squareErrorCode: sqErr?.code,
        squareErrorCategory: sqErr?.category,
        diagnostics: { stage: 'create_payment_link', planId, billingPeriod },
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
      billingPeriod,
      planId,
      // Subscription is NOT created here. finalize-provider-purchase handles it
      // ONLY after the first payment is verified COMPLETED.
      subscriptionPending: true,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Provider checkout creation error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
