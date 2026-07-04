import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));


const REASON_LABELS: Record<string, string> = {
  step_up: "Step-up to higher level of care",
  step_down: "Step-down to lower level of care",
  relapse_higher_loc: "Relapse — higher level of care needed",
  aftercare_transition: "Aftercare / continuing care transition",
  sober_living: "Moving to sober living",
  provider_change: "Provider change (same level of care)",
  geographic_move: "Geographic relocation",
  other: "Other",
};

interface SendOrgTransferInviteRequest {
  inviteId: string; // org_transfer_invites.id — we load everything from DB
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const db = createClient(supabaseUrl, serviceKey);

    const { inviteId }: SendOrgTransferInviteRequest = await req.json();
    if (!inviteId) {
      return new Response(JSON.stringify({ error: "inviteId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Load the invite with related data
    const { data: invite, error: inviteErr } = await db
      .from("org_transfer_invites")
      .select(`
        *,
        families!family_id(name),
        organizations!from_organization_id(name, logo_url, website_url)
      `)
      .eq("id", inviteId)
      .single();

    if (inviteErr || !invite) {
      return new Response(JSON.stringify({ error: "Invite not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get the inviter's profile
    const { data: inviterProfile } = await db
      .from("profiles")
      .select("full_name")
      .eq("id", invite.invited_by)
      .single();

    // Get the inviter's auth email so we can CC them
    const { data: { user: inviterUser } } = await db.auth.admin.getUserById(invite.invited_by);

    const familyName = (invite.families as any)?.name || "a family group";
    const fromOrgName = (invite.organizations as any)?.name || "a FamilyBridge provider";
    const fromOrgLogo = (invite.organizations as any)?.logo_url || null;
    const inviterName = inviterProfile?.full_name || "A provider";
    const inviterEmail = inviterUser?.email || null;

    const reasonLabel = invite.transfer_reason
      ? REASON_LABELS[invite.transfer_reason] || invite.transfer_reason
      : null;

    // Build the registration URL — includes invite token so the app can auto-link
    const appUrl = "https://familybridgeapp.com";
    const registrationUrl = `${appUrl}/provider-purchase?orgInvite=${encodeURIComponent(invite.invite_token)}&family=${encodeURIComponent(invite.family_id)}&ref=${encodeURIComponent(fromOrgName)}`;
    const expiryDate = new Date(invite.expires_at).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const greeting = invite.contact_name
      ? `Hello ${invite.contact_name},`
      : "Hello,";

    // ---- Send to the program contact ----
    const toEmails = [invite.contact_email];
    const ccEmails = inviterEmail ? [inviterEmail] : [];

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="https://familybridgeapp.com/og-image.png" alt="FamilyBridge" style="max-width: 180px; height: auto; margin-bottom: 12px;" />
          <h1 style="color: #2d7d6f; margin: 0; font-size: 24px;">FamilyBridge</h1>
          <p style="color: #666; margin-top: 4px; font-size: 14px;">Family Recovery Support Platform</p>
        </div>

        <!-- Main card -->
        <div style="background: #f8f9fa; border-radius: 12px; padding: 30px; margin-bottom: 24px;">
          <h2 style="margin-top: 0; color: #333; font-size: 20px;">${greeting}</h2>

          <p>
            <strong>${inviterName}</strong> from <strong>${fromOrgName}</strong> is referring 
            a family group to your program and wants to connect them with you through 
            <strong>FamilyBridge</strong> — a HIPAA-compliant platform that keeps families 
            engaged in recovery alongside their loved one's treatment.
          </p>

          <!-- Transfer context box -->
          <div style="background: #fff; border-left: 4px solid #2d7d6f; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 20px 0;">
            <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #2d7d6f; text-transform: uppercase; letter-spacing: 0.5px;">Transfer Details</p>
            <p style="margin: 4px 0; font-size: 14px;"><span style="color: #666;">Family:</span> <strong>${familyName}</strong></p>
            ${reasonLabel ? `<p style="margin: 4px 0; font-size: 14px;"><span style="color: #666;">Reason:</span> <strong>${reasonLabel}</strong></p>` : ""}
            ${invite.invite_message ? `<p style="margin: 8px 0 0 0; font-size: 14px; color: #555; font-style: italic;">"${invite.invite_message}"</p>` : ""}
          </div>

          <p>
            FamilyBridge gives your program a private, structured support environment for each 
            family you work with — check-ins, communication tools, behavioral pattern tracking, 
            and AI coaching for the whole family system. Unlimited families on your subscription.
          </p>

          <!-- CTA button -->
          <div style="text-align: center; margin: 28px 0;">
            <a href="${registrationUrl}"
               style="display: inline-block; background: #2d7d6f; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Get Started — Claim This Family →
            </a>
          </div>

          <p style="text-align: center; color: #888; font-size: 13px;">
            Or copy and paste this link into your browser:<br/>
            <a href="${registrationUrl}" style="color: #2d7d6f; word-break: break-all;">${registrationUrl}</a>
          </p>

          <p style="color: #888; font-size: 13px; text-align: center; margin-top: 20px;">
            This invitation expires on <strong>${expiryDate}</strong>.
          </p>
        </div>

        <!-- What you get section -->
        <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <h3 style="color: #2d7d6f; margin-top: 0; font-size: 16px;">What FamilyBridge gives your program:</h3>
          <ul style="color: #555; padding-left: 20px; margin: 0;">
            <li style="margin-bottom: 8px;">Private family groups with unlimited members per family</li>
            <li style="margin-bottom: 8px;">Structured check-ins and behavioral pattern tracking</li>
            <li style="margin-bottom: 8px;">HIPAA-compliant communication between families and your staff</li>
            <li style="margin-bottom: 8px;">AI coaching support for family members between sessions</li>
            <li style="margin-bottom: 8px;">Assign a moderator (therapist, case manager, etc.) to each family</li>
            <li style="margin-bottom: 8px;">Seamless handoffs as clients move between levels of care</li>
          </ul>
        </div>

        <!-- Footer / sender -->
        <div style="text-align: center; padding: 16px; color: #888; font-size: 13px;">
          ${fromOrgLogo
            ? `<img src="${fromOrgLogo}" alt="${fromOrgName}" style="max-width: 100px; height: auto; margin-bottom: 10px; border-radius: 4px;" /><br/>`
            : ""}
          <p style="margin: 0;">This invitation was sent by <strong>${inviterName}</strong>, ${fromOrgName}.</p>
          <p style="margin: 4px 0 0 0; color: #aaa;">
            Questions? Reply to this email or visit 
            <a href="${appUrl}" style="color: #2d7d6f;">familybridgeapp.com</a>
          </p>
        </div>

      </body>
      </html>
    `;

    const emailPayload: any = {
      from: `${fromOrgName} via FamilyBridge <noreply@familybridgeapp.com>`,
      to: toEmails,
      subject: `${inviterName} is referring a family to your program — FamilyBridge`,
      html: emailHtml,
      reply_to: inviterEmail || undefined,
    };

    if (ccEmails.length > 0) {
      emailPayload.cc = ccEmails;
    }

    const emailResponse = await resend.emails.send(emailPayload);
    console.log("Org transfer invite email sent:", emailResponse);

    // Mark the invite as 'sent' (it defaults to sent, but update updated_at)
    await db
      .from("org_transfer_invites")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", inviteId);

    return new Response(JSON.stringify({ success: true, ...emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-org-transfer-invite:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
