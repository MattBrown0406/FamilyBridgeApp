import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FamilyMember {
  name: string;
  email: string;
  relationship: string;
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

    const { inviteCode, familyName, familyDescription, members } = await req.json();

    if (!inviteCode || !familyName || !members || members.length === 0) {
      throw new Error('Invite code, family name, and at least one member are required');
    }

    console.log('Creating family group:', familyName, 'with invite code:', inviteCode);

    // Verify the invite code exists and is not used
    // SECURITY: select only what we need (avoid pulling any sensitive fields)
    const { data: codeData, error: codeError } = await supabase
      .from('activation_codes')
      .select('id')
      .eq('code', inviteCode.trim().toUpperCase())
      .eq('is_used', false)
      .maybeSingle();

    if (codeError) {
      console.error('Error checking invite code:', codeError);
      throw new Error('Failed to verify invite code');
    }

    if (!codeData) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid or already used invite code' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate a new member invite code for the family
    const chars = 'abcdefghjklmnpqrstuvwxyz23456789';
    let memberInviteCode = '';
    for (let i = 0; i < 8; i++) {
      memberInviteCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Create the family
    const { data: familyData, error: familyError } = await supabase
      .from('families')
      .insert({
        name: familyName,
        description: familyDescription || null,
        invite_code: memberInviteCode,
      })
      .select()
      .single();

    if (familyError) {
      console.error('Error creating family:', familyError);
      throw new Error('Failed to create family group');
    }

    console.log('Family created:', familyData.id);

    // Create invite code entry for family members to use
    const { error: inviteCodeError } = await supabase
      .from('family_invite_codes')
      .insert({
        family_id: familyData.id,
        invite_code: memberInviteCode,
      });

    if (inviteCodeError) {
      console.error('Error creating family invite code:', inviteCodeError);
    }

    // Mark the purchase invite code as used
    const { error: updateError } = await supabase
      .from('activation_codes')
      .update({
        is_used: true,
        used_at: new Date().toISOString(),
      })
      .eq('id', codeData.id);

    if (updateError) {
      console.error('Error updating invite code:', updateError);
    }

    // Send invitation emails to all family members
    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      
      for (const member of members as FamilyMember[]) {
        try {
          await resend.emails.send({
            from: 'FamilyBridge <onboarding@resend.dev>',
            to: [member.email],
            subject: `You're Invited to Join ${familyName} on FamilyBridge`,
            html: `
              <h1>You've Been Invited to FamilyBridge!</h1>
              <p>Hello ${member.name},</p>
              <p>You've been invited to join <strong>${familyName}</strong> on FamilyBridge - a safe space for families to communicate, set boundaries, and support each other.</p>
              
              <div style="background: #f4f4f4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0 0 10px 0; font-weight: bold;">Your Family Invite Code:</p>
                <p style="font-size: 24px; font-family: monospace; font-weight: bold; letter-spacing: 2px; margin: 0; color: #2563eb;">
                  ${memberInviteCode}
                </p>
              </div>

              <h3>Getting Started:</h3>
              <ol>
                <li>Visit FamilyBridge and create an account</li>
                <li>Click "Join with Code" and enter the invite code above</li>
                <li>Select your relationship to the family</li>
                <li>Start connecting with your family!</li>
              </ol>

              <p>We're here to help your family heal and grow together.</p>
              <p>Best regards,<br>The FamilyBridge Team</p>
            `,
          });
          console.log('Invitation email sent to:', member.email);
        } catch (emailError) {
          console.error('Failed to send email to:', member.email, emailError);
          // Continue with other emails even if one fails
        }
      }
    } else {
      console.log('RESEND_API_KEY not configured, skipping emails');
    }

    return new Response(JSON.stringify({ 
      success: true,
      familyId: familyData.id,
      memberInviteCode: memberInviteCode,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Create family group error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      success: false, 
      error: message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
