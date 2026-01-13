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

interface AdminInfo {
  name: string;
  email: string;
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

    const { inviteCode, familyName, familyDescription, adminName, adminEmail, members } = await req.json();

    if (!inviteCode || !familyName || !members || members.length === 0) {
      throw new Error('Invite code, family name, and at least one member are required');
    }

    if (!adminName || !adminEmail) {
      throw new Error('Admin name and email are required');
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

    // Send emails via Resend
    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      
      // Send welcome email to admin with detailed instructions
      try {
        await resend.emails.send({
          from: 'FamilyBridge <onboarding@resend.dev>',
          to: [adminEmail],
          subject: `Welcome to FamilyBridge - Your ${familyName} Group is Ready!`,
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
                <h2 style="margin-top: 0; color: #333;">Welcome, ${adminName}!</h2>
                
                <p>Congratulations! Your family group <strong>"${familyName}"</strong> has been successfully created. As the family administrator, you'll have access to special features to help manage and support your family.</p>
                
                <div style="background: #fff; border: 2px solid #2d7d6f; border-radius: 8px; padding: 20px; margin: 25px 0;">
                  <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Your Family Invite Code (share with family members):</p>
                  <p style="margin: 0; font-size: 28px; font-weight: bold; font-family: monospace; letter-spacing: 2px; color: #2d7d6f; text-align: center;">${memberInviteCode}</p>
                </div>
                
                <h3 style="color: #2d7d6f; margin-top: 30px;">📱 Getting Started</h3>
                <ol style="color: #555; padding-left: 20px;">
                  <li style="margin-bottom: 10px;"><strong>Create your account</strong> - Visit FamilyBridge and sign up with this email address (${adminEmail})</li>
                  <li style="margin-bottom: 10px;"><strong>Join your family</strong> - Use the invite code above when prompted</li>
                  <li style="margin-bottom: 10px;"><strong>Complete your profile</strong> - Add your details and set your preferences</li>
                  <li style="margin-bottom: 10px;"><strong>Sign the HIPAA release</strong> - If applicable, this helps protect everyone's privacy</li>
                </ol>

                <h3 style="color: #2d7d6f; margin-top: 30px;">👥 Inviting Family Members</h3>
                <p>We've already sent invitation emails to the family members you listed during setup. Each email contains the family invite code above.</p>
                <p>If you need to invite additional members later:</p>
                <ul style="color: #555; padding-left: 20px;">
                  <li>Share the invite code: <strong style="font-family: monospace;">${memberInviteCode}</strong></li>
                  <li>Direct them to FamilyBridge to create an account</li>
                  <li>They'll use the code to join your family group</li>
                </ul>

                <h3 style="color: #2d7d6f; margin-top: 30px;">🛡️ As Family Admin, You Can:</h3>
                <ul style="color: #555; padding-left: 20px;">
                  <li>View the family invite code anytime from your dashboard</li>
                  <li>See family activity and check-ins</li>
                  <li>Manage family boundaries and agreements</li>
                  <li>Approve financial requests</li>
                  <li>Access the family chat</li>
                </ul>

                <h3 style="color: #2d7d6f; margin-top: 30px;">💡 Quick Tips</h3>
                <ul style="color: #555; padding-left: 20px;">
                  <li>Enable notifications so you never miss important updates</li>
                  <li>Set up your payment info if you want to participate in financial support</li>
                  <li>Use the Conversation Starters to get meaningful discussions going</li>
                  <li>Check in regularly - consistent engagement helps everyone</li>
                </ul>
              </div>
              
              <div style="background: #e8f5e9; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h3 style="margin-top: 0; color: #2e7d32;">Need Help?</h3>
                <p style="margin-bottom: 0;">Visit our Support page within the app or reply to this email if you have any questions. We're here to help your family on this journey.</p>
              </div>
              
              <div style="text-align: center; padding: 20px; color: #888; font-size: 14px;">
                <p>Thank you for choosing FamilyBridge.</p>
                <p>Together, we can build stronger families.</p>
              </div>
            </body>
            </html>
          `,
        });
        console.log('Admin welcome email sent to:', adminEmail);
      } catch (emailError) {
        console.error('Failed to send admin welcome email:', emailError);
      }
      
      // Send invitation emails to all family members
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
