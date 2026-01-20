import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Valid coupon codes for families
const VALID_COUPONS: Record<string, { discount: number; description: string; trialDays?: number }> = {
  'FAMILY100': { discount: 100, description: 'Full subscription waiver' },
  'FAMILYFREE': { discount: 100, description: 'Free family subscription' },
  'FREEDOM': { discount: 0, description: '7-day free trial', trialDays: 7 },
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

      // Encrypt email before storage (plaintext columns are not stored)
      const { data: emailEncrypted, error: encError } = await supabase.rpc('encrypt_sensitive', {
        plain_text: email,
      });

      if (encError) {
        console.error('Error encrypting email:', encError);
        throw new Error('Failed to create invite code');
      }

      // Store the invite code in activation_codes
      const { error } = await supabase
        .from('activation_codes')
        .insert({
          code: inviteCode,
          email_encrypted: emailEncrypted,
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year expiry
        });

      if (error) {
        console.error('Error creating invite code:', error);
        throw new Error('Failed to create invite code');
      }

      console.log('Invite code created via coupon:', inviteCode);

      // Build the setup URL
      const appUrl = 'https://familybridgeapp.com';
      const setupUrl = `${appUrl}/family-purchase?inviteCode=${encodeURIComponent(inviteCode)}`;

      // Send email with invite code if Resend is configured
      if (resendApiKey) {
        try {
          const resend = new Resend(resendApiKey);
          await resend.emails.send({
            from: 'FamilyBridge <noreply@familybridgeapp.com>',
            to: [email],
            subject: 'Your FamilyBridge Invite Code',
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #2d7d6f; margin: 0;">FamilyBridge</h1>
                  <p style="color: #666; margin-top: 5px;">Family Recovery Support Platform</p>
                </div>
                
                <div style="background: #f8f9fa; border-radius: 12px; padding: 30px; margin-bottom: 20px;">
                  <h2 style="margin-top: 0; color: #333;">Welcome to FamilyBridge!</h2>
                  
                  <p>Thank you for joining. Your invite code is:</p>
                  
                  <div style="background: #fff; border: 2px dashed #2d7d6f; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
                    <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Your Invite Code</p>
                    <p style="margin: 0; font-size: 28px; font-weight: bold; font-family: monospace; letter-spacing: 3px; color: #2d7d6f;">
                      ${inviteCode}
                    </p>
                  </div>
                  
                  <p style="text-align: center;">
                    <a href="${setupUrl}" style="display: inline-block; background: #2d7d6f; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                      Set Up Your Account →
                    </a>
                  </p>
                  
                  <p style="color: #666; font-size: 14px; margin-top: 20px;">Or copy and paste this link into your browser:</p>
                  <p style="word-break: break-all; font-size: 14px; color: #2d7d6f;">${setupUrl}</p>
                </div>
                
                <div style="text-align: center; padding: 20px; color: #888; font-size: 14px;">
                  <p>Use this code to set up your family group and invite your family members.</p>
                  <p>Best regards,<br>The FamilyBridge Team</p>
                </div>
              </body>
              </html>
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

    // For trial-based coupons, return trial info
    if (coupon.trialDays) {
      return new Response(JSON.stringify({ 
        valid: true,
        trialDays: coupon.trialDays,
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
