import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendFamilyInviteRequest {
  recipientEmail: string;
  recipientName: string;
  familyName: string;
  inviteCode: string;
  organizationName: string;
  creatorName?: string;
  organizationLogo?: string;
  intendedRole?: string;
  familyId?: string;
}

const ROLE_LABELS: Record<string, string> = {
  member: 'Family Member',
  recovering: 'Person in Recovery',
  dad: 'Dad',
  mom: 'Mom',
  husband: 'Husband',
  wife: 'Wife',
  brother: 'Brother',
  sister: 'Sister',
  friend: 'Friend',
  employer: 'Employer',
  moderator: 'Moderator',
  admin: 'Admin',
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      recipientEmail, 
      recipientName, 
      familyName, 
      inviteCode, 
      organizationName, 
      creatorName, 
      organizationLogo,
      intendedRole,
      familyId
    }: SendFamilyInviteRequest = await req.json();

    if (!recipientEmail || !recipientName || !familyName || !inviteCode) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Store pending invite role if familyId and intendedRole are provided
    if (familyId && intendedRole) {
      const url = Deno.env.get("SUPABASE_URL");
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      
      if (url && serviceKey) {
        const supabaseAdmin = createClient(url, serviceKey);
        
        // Upsert the pending invite role
        const { error: upsertError } = await supabaseAdmin
          .from("pending_invite_roles")
          .upsert({
            family_id: familyId,
            invite_code: inviteCode.toLowerCase(),
            email: recipientEmail.toLowerCase().trim(),
            intended_role: intendedRole,
            used_at: null,
          }, {
            onConflict: 'family_id,email',
            ignoreDuplicates: false,
          });
        
        if (upsertError) {
          console.error("Error storing pending invite role:", upsertError);
          // Continue with email - role assignment is not critical for invite
        } else {
          console.log(`Stored pending role ${intendedRole} for ${recipientEmail}`);
        }
      }
    }

    const appUrl = 'https://familybridgeapp.com';
    const joinUrl = `${appUrl}/auth?mode=signup&familyInvite=${encodeURIComponent(inviteCode)}`;
    
    const roleLabel = intendedRole ? ROLE_LABELS[intendedRole] || intendedRole : 'Family Member';

    const emailResponse = await resend.emails.send({
      from: `${organizationName} <noreply@familybridgeapp.com>`,
      to: [recipientEmail],
      subject: `You're Invited to Join ${familyName} on FamilyBridge`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="https://familybridgeapp.com/og-image.png" alt="FamilyBridge" style="max-width: 200px; height: auto; margin-bottom: 15px;" />
            <h1 style="color: #2d7d6f; margin: 0;">FamilyBridge</h1>
            <p style="color: #666; margin-top: 5px;">Family Recovery Support Platform</p>
          </div>
          
          <div style="background: #f8f9fa; border-radius: 12px; padding: 30px; margin-bottom: 20px;">
            <h2 style="margin-top: 0; color: #333;">Hello ${recipientName},</h2>
            
            <p>You have been invited to join <strong>${familyName}</strong> on FamilyBridge as a <strong>${roleLabel}</strong>.</p>
            
            <p>${organizationName} has set up a family group for you. To get started, use the invite code below:</p>
            
            <div style="background: #fff; border: 2px dashed #2d7d6f; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
              <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Your Invite Code</p>
              <p style="margin: 0; font-size: 28px; font-weight: bold; font-family: monospace; letter-spacing: 2px; color: #2d7d6f;">${inviteCode}</p>
              <p style="margin: 10px 0 0 0; font-size: 13px; color: #888;">Your Role: <strong style="color: #2d7d6f;">${roleLabel}</strong></p>
            </div>
            
            <p style="text-align: center;">
              <a href="${joinUrl}" style="display: inline-block; background: #2d7d6f; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Set Up Your Account →
              </a>
            </p>
            
            <p style="color: #666; font-size: 14px; margin-top: 20px; text-align: center;">Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; font-size: 14px; color: #2d7d6f; text-align: center;">${joinUrl}</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 25px 0;" />
            
            <h3 style="color: #2d7d6f;">To join your family group:</h3>
            <ol style="color: #555; padding-left: 20px;">
              <li style="margin-bottom: 8px;">Click the button above or visit FamilyBridge</li>
              <li style="margin-bottom: 8px;">Enter the invite code shown above</li>
              <li style="margin-bottom: 8px;">Create your account</li>
              <li style="margin-bottom: 8px;">You'll be connected to your family group immediately</li>
            </ol>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #888; font-size: 14px;">
            <p>This invitation was sent by ${organizationName}.</p>
            ${creatorName ? `
              <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-top: 20px;">
                ${organizationLogo ? `<img src="${organizationLogo}" alt="${organizationName}" style="width: 40px; height: 40px; object-fit: contain; border-radius: 4px;" />` : ''}
                <div style="text-align: left;">
                  <p style="margin: 0 0 2px 0; font-size: 13px;">Thank you,</p>
                  <p style="margin: 0; font-weight: bold;">${creatorName}</p>
                  <p style="margin: 0; color: #666; font-size: 13px;">${organizationName}</p>
                </div>
              </div>
            ` : `
              <p style="margin-bottom: 5px; margin-top: 20px;">Thank you,</p>
              <p style="font-weight: bold; margin-top: 0;">Matt Brown, Creator of Family Bridge</p>
            `}
          </div>
        </body>
        </html>
      `,
    });

    console.log("Family invite email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, ...emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-family-invite function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
