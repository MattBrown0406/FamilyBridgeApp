import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { email, redirectUrl } = await req.json();

    if (!email) {
      throw new Error('Email is required');
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
          name: 'Provider Account Subscription',
          price_money: {
            amount: 4999, // $49.99 in cents
            currency: 'USD',
          },
          location_id: 'main', // You may need to update this with your actual location ID
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
