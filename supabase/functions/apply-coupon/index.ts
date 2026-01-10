import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Valid coupon codes (in production, store these in database)
const VALID_COUPONS: Record<string, { discount: number; description: string }> = {
  'RECOVERED': { discount: 100, description: 'Full subscription waiver' },
};

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { couponCode, email } = await req.json();

    if (!couponCode || !email) {
      throw new Error('Coupon code and email are required');
    }

    // Normalize coupon code
    const normalizedCode = couponCode.trim().toUpperCase();

    // Check if coupon is valid
    const coupon = VALID_COUPONS[normalizedCode];
    if (!coupon) {
      return new Response(JSON.stringify({ 
        valid: false, 
        error: 'Invalid coupon code' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // For 100% discount, generate activation code directly
    if (coupon.discount === 100) {
      const activationCode = generateActivationCode();

      // Encrypt email before storage (plaintext columns are not stored)
      const { data: emailEncrypted, error: encError } = await supabase.rpc('encrypt_sensitive', {
        plain_text: email,
      });

      if (encError) {
        console.error('Error encrypting email:', encError);
        throw new Error('Failed to create activation code');
      }

      // Store activation code in database
      const { error } = await supabase
        .from('activation_codes')
        .insert({
          code: activationCode,
          email_encrypted: emailEncrypted,
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year expiry
        });

      if (error) {
        console.error('Error creating activation code:', error);
        throw new Error('Failed to create activation code');
      }

      console.log('Activation code created via coupon:', activationCode);

      return new Response(JSON.stringify({ 
        valid: true,
        activationCode: activationCode,
        message: coupon.description
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // For partial discounts, return the discount percentage
    return new Response(JSON.stringify({ 
      valid: true,
      discount: coupon.discount,
      message: coupon.description
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Coupon error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      valid: false, 
      error: message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
