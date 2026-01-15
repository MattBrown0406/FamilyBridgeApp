import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    if (!accessToken) {
      throw new Error('Square credentials not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { entityType, entityId, email, redirectUrl } = await req.json();

    if (!entityType || !entityId || !email) {
      throw new Error('Missing required fields');
    }

    console.log(`Creating payment update checkout for ${entityType}:${entityId}`);

    // Get the subscription payment status
    const { data: paymentStatus } = await supabase
      .from('subscription_payment_status')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .single();

    if (!paymentStatus) {
      throw new Error('Payment status not found');
    }

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
    if (locationsData.errors || !locationsData.locations?.length) {
      throw new Error('No Square locations found');
    }

    const activeLocation = locationsData.locations.find((loc: any) => loc.status === 'ACTIVE') || locationsData.locations[0];
    const locationId = activeLocation.id;

    // Determine the price based on entity type
    const priceInCents = entityType === 'family' ? 1999 : 25000; // $19.99 for family, $250 for provider
    const subscriptionName = entityType === 'family' 
      ? 'FamilyBridge Family Subscription (Payment Update)'
      : 'FamilyBridge Provider Subscription (Payment Update)';

    // Create a checkout link
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
          redirect_url: redirectUrl,
          ask_for_shipping_address: false,
        },
        pre_populated_data: {
          buyer_email: email,
        },
        payment_note: `Payment update for ${entityType}:${entityId}`,
      }),
    });

    const checkoutData = await checkoutResponse.json();

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
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
