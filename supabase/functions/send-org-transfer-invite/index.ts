import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface SendOrgTransferInviteRequest {
  inviteId?: string;
}

const json = (
  body: Record<string, unknown>,
  status: number,
  corsHeaders: Record<string, string>,
) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json", ...corsHeaders },
});

const escapeHtml = (value: string | null | undefined) =>
  (value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

serve(async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));

  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, corsHeaders);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const authHeader = req.headers.get("Authorization");

    if (!supabaseUrl || !serviceKey || !anonKey) {
      console.error("send-org-transfer-invite is missing required Supabase configuration");
      return json({ error: "Service unavailable" }, 503, corsHeaders);
    }
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Authentication required" }, 401, corsHeaders);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return json({ error: "Authentication required" }, 401, corsHeaders);

    let body: SendOrgTransferInviteRequest;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400, corsHeaders);
    }
    if (!body.inviteId) return json({ error: "inviteId is required" }, 400, corsHeaders);

    const db = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: invite, error: inviteError } = await db
      .from("org_transfer_invites")
      .select("id, family_id, from_organization_id, invited_by, contact_email, contact_name, invite_token, status, expires_at, organizations!from_organization_id(name)")
      .eq("id", body.inviteId)
      .maybeSingle();

    // Use the same response for absent and inaccessible records to avoid identifier probing.
    if (inviteError || !invite) return json({ error: "Invite not available" }, 404, corsHeaders);

    const [{ data: membership }, { data: isSuperAdmin }] = await Promise.all([
      db
        .from("organization_members")
        .select("role")
        .eq("organization_id", invite.from_organization_id)
        .eq("user_id", user.id)
        .in("role", ["owner", "admin"])
        .maybeSingle(),
      db.rpc("is_super_admin", { _user_id: user.id }),
    ]);

    const authorized = invite.invited_by === user.id || Boolean(membership) || isSuperAdmin === true;
    if (!authorized) {
      await db.from("security_audit_log").insert({
        user_id: user.id,
        action: "org_transfer_invite_send_denied",
        resource_type: "org_transfer_invite",
        ip_address: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
        user_agent: req.headers.get("user-agent"),
        details: { invite_id: invite.id },
      });
      return json({ error: "Invite not available" }, 404, corsHeaders);
    }

    if (!["sent", "registered"].includes(invite.status) || new Date(invite.expires_at).getTime() <= Date.now()) {
      return json({ error: "This invitation is no longer active" }, 409, corsHeaders);
    }

    const { data: inviterProfile } = await db
      .from("profiles")
      .select("full_name")
      .eq("id", invite.invited_by)
      .maybeSingle();

    const fromOrgName = (invite.organizations as { name?: string } | null)?.name || "a FamilyBridge provider";
    const inviterName = inviterProfile?.full_name || "A provider";
    const registrationUrl = `https://familybridgeapp.com/provider-purchase?orgInvite=${encodeURIComponent(invite.invite_token)}`;
    const expiryDate = new Date(invite.expires_at).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });

    // Deliberately exclude family name, transfer reason, clinical details, and free-text notes.
    // Those details are available only after authenticated acceptance and recipient-specific consent.
    const emailHtml = `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.6;color:#253238;max-width:600px;margin:0 auto;padding:24px">
  <div style="text-align:center;margin-bottom:24px">
    <h1 style="color:#2d7d6f;margin-bottom:4px">FamilyBridge</h1>
    <p style="color:#667085;margin-top:0">Secure care coordination</p>
  </div>
  <div style="background:#f7faf9;border:1px solid #d9e8e4;border-radius:12px;padding:28px">
    <h2 style="margin-top:0">${escapeHtml(invite.contact_name ? `Hello ${invite.contact_name},` : "Hello,")}</h2>
    <p><strong>${escapeHtml(inviterName)}</strong> from <strong>${escapeHtml(fromOrgName)}</strong> invited your organization to a secure FamilyBridge handoff.</p>
    <p>To protect the family’s privacy, this email does not contain names, treatment information, transfer reasons, or case notes. Sign in through the secure link to review only information the family has specifically authorized for your organization.</p>
    <div style="text-align:center;margin:28px 0">
      <a href="${escapeHtml(registrationUrl)}" style="display:inline-block;background:#2d7d6f;color:white;text-decoration:none;padding:14px 24px;border-radius:8px;font-weight:700">Review secure invitation</a>
    </div>
    <p style="font-size:13px;color:#667085;text-align:center">This invitation expires ${escapeHtml(expiryDate)}. Do not forward this link.</p>
  </div>
  <p style="font-size:12px;color:#98a2b3;text-align:center;margin-top:20px">FamilyBridge will never ask you to send protected family information by email.</p>
</body></html>`;

    const emailResponse = await resend.emails.send({
      from: "FamilyBridge Secure Coordination <noreply@familybridgeapp.com>",
      to: [invite.contact_email],
      subject: `Secure handoff invitation from ${fromOrgName}`,
      html: emailHtml,
    });

    if (emailResponse.error) {
      console.error("Failed to send organization transfer invitation", emailResponse.error);
      return json({ error: "Unable to send invitation" }, 502, corsHeaders);
    }

    await Promise.all([
      db.from("org_transfer_invites").update({ updated_at: new Date().toISOString() }).eq("id", invite.id),
      db.from("security_audit_log").insert({
        user_id: user.id,
        action: "org_transfer_invite_sent",
        resource_type: "org_transfer_invite",
        ip_address: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
        user_agent: req.headers.get("user-agent"),
        details: { invite_id: invite.id, destination_domain: invite.contact_email.split("@")[1] || null },
      }),
    ]);

    return json({ success: true, messageId: emailResponse.data?.id ?? null }, 200, corsHeaders);
  } catch (error) {
    console.error("Error in send-org-transfer-invite", error);
    return json({ error: "Unable to send invitation" }, 500, corsHeaders);
  }
});
