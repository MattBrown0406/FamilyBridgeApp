import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { getCorsHeaders } from "../_shared/cors.ts";

type RoleTemplate =
  | "interventionist"
  | "therapist"
  | "treatment_provider"
  | "case_manager"
  | "family_member"
  | "read_only_support";

interface InviteRequest {
  familyId: string;
  inviteeEmail: string;
  roleTemplate: RoleTemplate;
  capabilities: string[];
  expiresAt: string;
}

const ROLE_LABELS: Record<RoleTemplate, string> = {
  interventionist: "Interventionist",
  therapist: "Therapist",
  treatment_provider: "Treatment Provider",
  case_manager: "Case Manager",
  family_member: "Family Support Participant",
  read_only_support: "Read-only Support",
};

const json = (body: unknown, status: number, headers: Record<string, string>) => new Response(
  JSON.stringify(body),
  { status, headers: { ...headers, "Content-Type": "application/json" } },
);

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, corsHeaders);

  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) return json({ error: "Authentication required" }, 401, corsHeaders);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!supabaseUrl || !anonKey || !resendKey) throw new Error("Required server configuration is missing");

    const client = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userError } = await client.auth.getUser();
    if (userError || !userData.user) return json({ error: "Invalid or expired session" }, 401, corsHeaders);

    const body = await req.json() as InviteRequest;
    const email = body.inviteeEmail?.trim().toLowerCase();
    if (!body.familyId || !email || !email.includes("@") || !ROLE_LABELS[body.roleTemplate]) {
      return json({ error: "A family, valid email, and role template are required" }, 400, corsHeaders);
    }
    if (!Array.isArray(body.capabilities) || body.capabilities.length === 0 || !body.expiresAt) {
      return json({ error: "Capabilities and expiration are required" }, 400, corsHeaders);
    }

    const { data: invitationRows, error: invitationError } = await client.rpc(
      "create_family_professional_invitation",
      {
        p_family_id: body.familyId,
        p_invitee_email: email,
        p_role_template: body.roleTemplate,
        p_capabilities: body.capabilities,
        p_expires_at: body.expiresAt,
      },
    );
    if (invitationError) {
      const status = /not authorized/i.test(invitationError.message) ? 403 : 400;
      return json({ error: invitationError.message }, status, corsHeaders);
    }

    const invitation = invitationRows?.[0];
    if (!invitation?.invitation_id || !invitation.invite_token) throw new Error("Invitation could not be created");

    const inviteUrl = `https://familybridgeapp.com/professional-invite?token=${encodeURIComponent(invitation.invite_token)}`;
    const roleLabel = ROLE_LABELS[body.roleTemplate];
    const resend = new Resend(resendKey);
    const emailResult = await resend.emails.send({
      from: "FamilyBridge <noreply@familybridgeapp.com>",
      to: [email],
      subject: `FamilyBridge invitation: ${roleLabel}`,
      html: `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#24332f;line-height:1.55;max-width:600px;margin:0 auto;padding:24px">
        <h1 style="color:#2d7d6f">FamilyBridge</h1>
        <p>You have been invited to support a family as a <strong>${roleLabel}</strong>.</p>
        <p>This invitation provides only the capabilities authorized for this role. It expires on <strong>${new Date(invitation.expires_at).toLocaleDateString("en-US", { timeZone: "UTC" })}</strong> and can be revoked at any time.</p>
        <p style="margin:28px 0"><a href="${inviteUrl}" style="background:#2d7d6f;color:white;text-decoration:none;padding:13px 22px;border-radius:8px;font-weight:600">Review and accept invitation</a></p>
        <p style="font-size:13px;color:#64736e">Sign in or create an account using this email address. Family and care details are not included in this email.</p>
      </body></html>`,
    });

    if (emailResult.error) {
      await client.rpc("revoke_family_professional_invitation", { p_invitation_id: invitation.invitation_id });
      throw new Error("Invitation email could not be delivered");
    }

    return json({
      success: true,
      invitationId: invitation.invitation_id,
      expiresAt: invitation.expires_at,
    }, 200, corsHeaders);
  } catch (error) {
    console.error("send-family-professional-invite failed", error);
    return json({ error: error instanceof Error ? error.message : "Unable to send invitation" }, 500, corsHeaders);
  }
});
