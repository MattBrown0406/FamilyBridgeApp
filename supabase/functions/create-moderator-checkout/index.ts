import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SQUARE_ACCESS_TOKEN = Deno.env.get('SQUARE_ACCESS_TOKEN');
    const SQUARE_APPLICATION_ID = Deno.env.get('SQUARE_APPLICATION_ID');

    if (!SQUARE_ACCESS_TOKEN || !SQUARE_APPLICATION_ID) {
      console.error('Missing Square credentials');
      throw new Error('Payment system not configured');
    }

    const { email, redirectUrl, familyId, requestId } = await req.json();

    if (!email || !redirectUrl || !familyId || !requestId) {
      throw new Error('Missing required fields: email, redirectUrl, familyId, requestId');
    }

    console.log('Creating moderator support checkout for:', email, 'familyId:', familyId);

    // Get active locations
    const locationsResponse = await fetch('https://connect.squareup.com/v2/locations', {
      headers: {
        'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Square-Version': '2024-01-18'
      }
    });

    const locationsData = await locationsResponse.json();
    const activeLocation = locationsData.locations?.find((loc: any) => loc.status === 'ACTIVE');
    
    if (!activeLocation) {
      throw new Error('No active Square location found');
    }

    const locationId = activeLocation.id;
    console.log('Using location:', locationId);

    // Create payment link for $150 moderator support
    const checkoutResponse = await fetch('https://connect.squareup.com/v2/online-checkout/payment-links', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Square-Version': '2024-01-18'
      },
      body: JSON.stringify({
        idempotency_key: `mod-support-${requestId}-${Date.now()}`,
        quick_pay: {
          name: 'FamilyBridge 24-Hour Crisis Moderation',
          price_money: {
            amount: 15000, // $150.00 in cents
            currency: 'USD'
          },
          location_id: locationId
        },
        checkout_options: {
          redirect_url: redirectUrl,
          merchant_support_email: 'support@familybridge.app'
        },
        pre_populated_data: {
          buyer_email: email
        },
        payment_note: `Family ID: ${familyId}, Request ID: ${requestId}`
      })
    });

    const checkoutData = await checkoutResponse.json();
    console.log('Square checkout response:', JSON.stringify(checkoutData));

    if (checkoutData.errors) {
      console.error('Square API errors:', checkoutData.errors);
      throw new Error(checkoutData.errors[0]?.detail || 'Failed to create checkout');
    }

    if (!checkoutData.payment_link?.url) {
      throw new Error('No checkout URL returned from Square');
    }

    return new Response(JSON.stringify({
      checkoutUrl: checkoutData.payment_link.url,
      orderId: checkoutData.payment_link.order_id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Error creating moderator checkout:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create checkout';
    return new Response(JSON.stringify({ 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
