import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ConvertLeadRequest {
  leadId: string;
  organizationId: string;
  organizationName: string;
  organizationLogo?: string;
  creatorName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!url || !serviceKey) {
      console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
      return new Response(
        JSON.stringify({ error: "Server not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseAdmin = createClient(url, serviceKey);

    // Verify auth
    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!jwt) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(jwt);
    if (userErr || !userData?.user) {
      console.error("auth.getUser error", userErr);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { 
      leadId, 
      organizationId, 
      organizationName, 
      organizationLogo,
      creatorName 
    }: ConvertLeadRequest = await req.json();

    if (!leadId || !organizationId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch the lead
    const { data: lead, error: leadError } = await supabaseAdmin
      .from("crm_leads")
      .select("*")
      .eq("id", leadId)
      .single();

    if (leadError || !lead) {
      console.error("Error fetching lead:", leadError);
      return new Response(
        JSON.stringify({ error: "Lead not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if lead already converted
    if (lead.converted_to_family_id) {
      return new Response(
        JSON.stringify({ error: "Lead already converted to a family" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create family name from patient name or contact name
    const familyName = lead.patient_name 
      ? `The ${lead.patient_name.split(' ').pop() || lead.patient_name} Family`
      : `${lead.contact_name}'s Family`;

    // Create the family
    const { data: family, error: familyError } = await supabaseAdmin
      .from("families")
      .insert({
        name: familyName,
        description: lead.presenting_issue || null,
        created_by: userData.user.id,
        organization_id: organizationId,
      })
      .select("*")
      .single();

    if (familyError) {
      console.error("Error creating family:", familyError);
      return new Response(
        JSON.stringify({ error: familyError.message }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Add the creator as moderator
    const { error: memberError } = await supabaseAdmin
      .from("family_members")
      .insert({ 
        family_id: family.id, 
        user_id: userData.user.id, 
        role: "moderator" 
      });

    if (memberError) {
      console.error("Error adding member:", memberError);
      // Rollback family creation
      await supabaseAdmin.from("families").delete().eq("id", family.id);
      return new Response(
        JSON.stringify({ error: memberError.message }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create invite code
    const { data: inviteData, error: inviteCodeError } = await supabaseAdmin
      .from("family_invite_codes")
      .insert({ family_id: family.id })
      .select("invite_code")
      .single();

    if (inviteCodeError) {
      console.error("Error creating invite code:", inviteCodeError);
    }

    const inviteCode = inviteData?.invite_code || null;

    // Update the lead with conversion info
    const { error: updateError } = await supabaseAdmin
      .from("crm_leads")
      .update({
        converted_to_family_id: family.id,
        converted_at: new Date().toISOString(),
        stage: "active",
        stage_entered_at: new Date().toISOString(),
      })
      .eq("id", leadId);

    if (updateError) {
      console.error("Error updating lead:", updateError);
    }

    // Log CRM activity
    await supabaseAdmin.from("crm_activities").insert({
      organization_id: organizationId,
      user_id: userData.user.id,
      activity_type: "stage_change",
      title: `Lead converted to family: ${familyName}`,
      description: `Created family group and sent onboarding invitation to ${lead.contact_email || 'contact'}`,
      lead_id: leadId,
      family_id: family.id,
    });

    // Send onboarding email if we have an email and invite code
    let emailSent = false;
    if (lead.contact_email && inviteCode) {
      try {
        const appUrl = 'https://familybridgeapp.com';
        const setupUrl = `${appUrl}/auth?mode=signup&familyInvite=${encodeURIComponent(inviteCode)}`;

        const emailResponse = await resend.emails.send({
          from: `${organizationName} <noreply@familybridgeapp.com>`,
          to: [lead.contact_email],
          subject: `Welcome to FamilyBridge - Set Up Your Family Group`,
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
                <h2 style="margin-top: 0; color: #333;">Hello ${lead.contact_name},</h2>
                
                <p>Great news! ${organizationName} has created a FamilyBridge group for your family${lead.patient_name ? ` to support ${lead.patient_name}'s recovery journey` : ''}.</p>
                
                <p>FamilyBridge is a secure platform that helps families:</p>
                <ul style="color: #555; padding-left: 20px;">
                  <li style="margin-bottom: 8px;">Communicate effectively with each other and care providers</li>
                  <li style="margin-bottom: 8px;">Track recovery progress and milestones</li>
                  <li style="margin-bottom: 8px;">Coordinate care and support</li>
                  <li style="margin-bottom: 8px;">Access resources and guidance</li>
                </ul>
                
                <p>To get started, use the invite code below:</p>
                
                <div style="background: #fff; border: 2px dashed #2d7d6f; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
                  <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Your Family Invite Code</p>
                  <p style="margin: 0; font-size: 28px; font-weight: bold; font-family: monospace; letter-spacing: 2px; color: #2d7d6f;">${inviteCode}</p>
                </div>
                
                <p style="text-align: center;">
                  <a href="${setupUrl}" style="display: inline-block; background: #2d7d6f; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                    Set Up Your Family Group →
                  </a>
                </p>
                
                <p style="color: #666; font-size: 14px; margin-top: 20px; text-align: center;">Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; font-size: 14px; color: #2d7d6f; text-align: center;">${setupUrl}</p>
                
                <hr style="border: none; border-top: 1px solid #ddd; margin: 25px 0;" />
                
                <h3 style="color: #2d7d6f;">Next Steps:</h3>
                <ol style="color: #555; padding-left: 20px;">
                  <li style="margin-bottom: 8px;">Click the button above to create your account</li>
                  <li style="margin-bottom: 8px;">Complete your family profile</li>
                  <li style="margin-bottom: 8px;">Invite other family members using the same code</li>
                  <li style="margin-bottom: 8px;">Start communicating securely with your care team</li>
                </ol>
                
                <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-top: 20px; border-radius: 4px;">
                  <p style="margin: 0; font-size: 14px;"><strong>📋 Save this code!</strong> You'll need it to invite other family members to join your group.</p>
                </div>
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

        console.log("Onboarding email sent:", emailResponse);
        emailSent = true;
      } catch (emailError) {
        console.error("Error sending onboarding email:", emailError);
        // Continue - email is not critical for the conversion
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        family,
        inviteCode,
        emailSent,
        message: emailSent 
          ? `Family created and onboarding email sent to ${lead.contact_email}` 
          : `Family created${inviteCode ? ` with invite code ${inviteCode}` : ''}`
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in convert-lead-to-family function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
