import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Square Subscription Plan IDs
const SQUARE_PLAN_IDS: Record<string, string> = {
  monthly: "J5JSSBKZASUKMISQBLISFUZP",
  quarterly: "MYPV3BWPOMVKFCGKFLD5CMLU",
  annual: "JJFJPR2WOCB6PIJZL4TUUQGF",
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

    const planId = SQUARE_PLAN_IDS[billingPeriod];
    if (!planId) {
      throw new Error(`Invalid billing period: ${billingPeriod}`);
    }

    console.log(`Creating subscription for ${email}, period: ${billingPeriod}, plan: ${planId}`);

    // Step 1: Find or create a Square customer
    const customerSearchRes = await fetch('https://connect.squareup.com/v2/customers/search', {
      method: 'POST',
      headers: {
        'Square-Version': '2024-01-18',
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: {
          filter: {
            email_address: { exact: email },
          },
        },
      }),
    });

    const customerSearchData = await customerSearchRes.json();
    let customerId: string;

    if (customerSearchData.customers?.length > 0) {
      customerId = customerSearchData.customers[0].id;
      console.log('Found existing customer:', customerId);
    } else {
      // Create new customer
      const createCustomerRes = await fetch('https://connect.squareup.com/v2/customers', {
        method: 'POST',
        headers: {
          'Square-Version': '2024-01-18',
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idempotency_key: crypto.randomUUID(),
          email_address: email,
        }),
      });

      const createCustomerData = await createCustomerRes.json();
      if (createCustomerData.errors) {
        throw new Error(createCustomerData.errors[0]?.detail || 'Failed to create customer');
      }
      customerId = createCustomerData.customer.id;
      console.log('Created new customer:', customerId);
    }

    // Step 2: Get location
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

    // Step 3: Create subscription
    const subscriptionBody: any = {
      idempotency_key: crypto.randomUUID(),
      location_id: locationId,
      plan_variation_id: planId,
      customer_id: customerId,
      start_date: new Date().toISOString().split('T')[0],
    };

    // If there's a coupon with special pricing, apply price override
    if (specialPrice) {
      console.log(`Applying special price override: $${specialPrice / 100}`);
      subscriptionBody.price_override_money = {
        amount: specialPrice,
        currency: 'USD',
      };
    }

    const subscriptionRes = await fetch('https://connect.squareup.com/v2/subscriptions', {
      method: 'POST',
      headers: {
        'Square-Version': '2024-01-18',
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscriptionBody),
    });

    const subscriptionData = await subscriptionRes.json();
    console.log('Square subscription response:', JSON.stringify(subscriptionData));

    if (subscriptionData.errors) {
      console.error('Square subscription errors:', subscriptionData.errors);
      throw new Error(subscriptionData.errors[0]?.detail || 'Failed to create subscription');
    }

    const subscription = subscriptionData.subscription;

    // Return the subscription info — the webhook will handle activation code creation
    // If Square returns an action URL (for card-on-file), redirect there
    const actionUrl = subscriptionData.actions?.[0]?.url;

    return new Response(JSON.stringify({
      subscriptionId: subscription.id,
      customerId,
      // If there's a checkout action (customer needs to add card), use that URL
      // Otherwise redirect to success
      checkoutUrl: actionUrl || (redirectUrl || `${req.headers.get('origin')}/provider-purchase?status=success`),
      status: subscription.status,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Subscription creation error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
