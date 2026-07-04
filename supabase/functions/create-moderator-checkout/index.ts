import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";


const maskEmail = (email: string) => {
  const [localPart, domain = ''] = email.split('@');
  if (!localPart) return '[redacted]';
  const visibleLocal = localPart.length <= 2 ? `${localPart[0]}*` : `${localPart.slice(0, 2)}***`;
  return `${visibleLocal}@${domain || '[redacted]'}`;
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));

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

    console.log('Creating moderator support checkout', { buyerEmail: maskEmail(email) });

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
    console.log('Using active Square location for moderator support checkout');

    // Create payment link for a $399 Professional Guidance Window
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
          name: 'FamilyBridge Professional Guidance Window',
          price_money: {
            amount: 39900, // $399.00 in cents
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
    console.error('Error creating moderator checkout:', error instanceof Error ? error.message : 'Unknown error');
    const errorMessage = error instanceof Error ? error.message : 'Failed to create checkout';
    return new Response(JSON.stringify({ 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
