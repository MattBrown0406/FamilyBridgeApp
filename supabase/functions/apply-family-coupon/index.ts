import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Valid coupon codes for families
const VALID_COUPONS: Record<string, { discount: number; description: string }> = {
  'FAMILY100': { discount: 100, description: 'Full subscription waiver' },
  'FAMILYFREE': { discount: 100, description: 'Free family subscription' },
};

// Generate invite code
function generateInviteCode(): string {
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
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { couponCode, email } = await req.json();

    if (!couponCode || !email) {
      throw new Error('Coupon code and email are required');
    }

    console.log('Applying family coupon:', couponCode, 'for:', email);

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

    // For 100% discount, generate invite code directly
    if (coupon.discount === 100) {
      const inviteCode = generateInviteCode();

      // Store the invite code in a new table or reuse activation_codes
      const { error } = await supabase
        .from('activation_codes')
        .insert({
          code: inviteCode,
          email: email,
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year expiry
        });

      if (error) {
        console.error('Error creating invite code:', error);
        throw new Error('Failed to create invite code');
      }

      console.log('Invite code created via coupon:', inviteCode);

      // Send email with invite code if Resend is configured
      if (resendApiKey) {
        try {
          const resend = new Resend(resendApiKey);
          await resend.emails.send({
            from: 'FamilyBridge <onboarding@resend.dev>',
            to: [email],
            subject: 'Your FamilyBridge Invite Code',
            html: `
              <h1>Welcome to FamilyBridge!</h1>
              <p>Thank you for creating your family group. Your invite code is:</p>
              <div style="background: #f4f4f4; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <p style="font-size: 28px; font-family: monospace; font-weight: bold; letter-spacing: 3px; margin: 0;">
                  ${inviteCode}
                </p>
              </div>
              <p>Use this code to set up your family group and invite your family members.</p>
              <p>Best regards,<br>The FamilyBridge Team</p>
            `,
          });
          console.log('Invite code email sent to:', email);
        } catch (emailError) {
          console.error('Failed to send email:', emailError);
          // Don't fail the request if email fails
        }
      }

      return new Response(JSON.stringify({ 
        valid: true,
        inviteCode: inviteCode,
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
