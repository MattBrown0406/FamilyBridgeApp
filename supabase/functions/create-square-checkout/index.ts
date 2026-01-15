import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Default pricing in cents
const DEFAULT_PRICING = {
  monthly: 25000, // $250/month
  quarterly: 62900, // $629/quarter
  annual: 250000, // $2,500/year
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get('SQUARE_ACCESS_TOKEN');
    const applicationId = Deno.env.get('SQUARE_APPLICATION_ID');

    if (!accessToken || !applicationId) {
      throw new Error('Square credentials not configured');
    }

    const { email, redirectUrl, billingPeriod = 'monthly', couponCode, specialPrice } = await req.json();

    if (!email) {
      throw new Error('Email is required');
    }

    console.log(`Creating checkout for ${email}, period: ${billingPeriod}, coupon: ${couponCode || 'none'}, specialPrice: ${specialPrice || 'none'}`);

    // Fetch locations to get a valid location ID
    const locationsResponse = await fetch('https://connect.squareup.com/v2/locations', {
      method: 'GET',
      headers: {
        'Square-Version': '2024-01-18',
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const locationsData = await locationsResponse.json();
    console.log('Square locations:', locationsData);

    if (locationsData.errors || !locationsData.locations?.length) {
      throw new Error('No Square locations found. Please set up a location in your Square dashboard.');
    }

    // Use the first active location
    const activeLocation = locationsData.locations.find((loc: any) => loc.status === 'ACTIVE') || locationsData.locations[0];
    const locationId = activeLocation.id;
    console.log('Using location:', locationId, activeLocation.name);

    // Determine the price - use special price if provided, otherwise use default for billing period
    let priceInCents: number;
    let subscriptionName: string;

    if (specialPrice) {
      // Use the special coupon price (monthly subscription at discounted rate)
      priceInCents = specialPrice;
      subscriptionName = `Provider Account Subscription (${couponCode || 'Promo'} - $${(specialPrice / 100).toFixed(2)}/month)`;
      console.log(`Using special price: $${priceInCents / 100}`);
    } else {
      // Use default pricing based on billing period
      priceInCents = DEFAULT_PRICING[billingPeriod as keyof typeof DEFAULT_PRICING] || DEFAULT_PRICING.monthly;
      const periodLabel = billingPeriod === 'annual' ? 'Annual' : billingPeriod === 'quarterly' ? 'Quarterly' : 'Monthly';
      subscriptionName = `Provider Account Subscription (${periodLabel})`;
    }

    // Create a checkout link using Square Checkout API
    const idempotencyKey = crypto.randomUUID();
    
    const checkoutResponse = await fetch('https://connect.squareup.com/v2/online-checkout/payment-links', {
      method: 'POST',
      headers: {
        'Square-Version': '2024-01-18',
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idempotency_key: idempotencyKey,
        quick_pay: {
          name: subscriptionName,
          price_money: {
            amount: priceInCents,
            currency: 'USD',
          },
          location_id: locationId,
        },
        checkout_options: {
          redirect_url: redirectUrl || `${req.headers.get('origin')}/provider-purchase?status=success`,
          ask_for_shipping_address: false,
        },
        pre_populated_data: {
          buyer_email: email,
        },
      }),
    });

    const checkoutData = await checkoutResponse.json();
    console.log('Square checkout response:', checkoutData);

    if (checkoutData.errors) {
      console.error('Square checkout errors:', checkoutData.errors);
      throw new Error(checkoutData.errors[0]?.detail || 'Failed to create checkout');
    }

    return new Response(JSON.stringify({
      checkoutUrl: checkoutData.payment_link?.url,
      orderId: checkoutData.payment_link?.order_id,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Checkout creation error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
