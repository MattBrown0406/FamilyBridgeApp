import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// One-off helper: provision a free provider account (auth user + organization + owner membership)
// and email the new provider step-by-step onboarding instructions, CC'ing a super admin.
// Caller must present the service-role key OR a super-admin JWT.
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (p: unknown, s: number) =>
    new Response(JSON.stringify(p), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, serviceKey);

    const authHeader = req.headers.get("Authorization") || "";
    const presented = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    const internalToken = Deno.env.get("ONBOARD_INTERNAL_TOKEN") || "";
    const headerInternal = req.headers.get("x-internal-token") || "";
    const isInternal = internalToken && headerInternal === internalToken;
    if (!isInternal && !presented) return json({ error: "Unauthorized" }, 401);
    if (!isInternal && presented !== serviceKey) {
      const { data: u, error: uErr } = await admin.auth.getUser(presented);
      if (uErr || !u?.user) return json({ error: "Unauthorized" }, 401);
      const { data: isSuper } = await admin.rpc("is_super_admin", { _user_id: u.user.id });
      if (!isSuper) return json({ error: "Forbidden" }, 403);
    }

    const body = await req.json();
    const email: string = body.email;
    const fullName: string = body.fullName;
    const orgName: string = body.orgName;
    const orgSubdomain: string = body.orgSubdomain;
    const ccEmail: string | undefined = body.ccEmail;
    const senderName: string | undefined = body.senderName;

    if (!email || !fullName || !orgName || !orgSubdomain) {
      return json({ error: "email, fullName, orgName, orgSubdomain required" }, 400);
    }

    // 1. Get-or-create auth user (invite by email so they set their own password)
    let userId: string | undefined;
    let isNew = false;
    let page = 1;
    while (true) {
      const { data: list, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw new Error(`listUsers: ${error.message}`);
      const found = list?.users?.find((x) => x.email?.toLowerCase() === email.toLowerCase());
      if (found) { userId = found.id; break; }
      if (!list?.users?.length || list.users.length < 200) break;
      page += 1;
    }

    if (!userId) {
      const { data: invited, error: invErr } = await admin.auth.admin.inviteUserByEmail(email, {
        redirectTo: "https://familybridgeapp.com/auth",
        data: { full_name: fullName },
      });
      if (invErr || !invited?.user) throw new Error(`inviteUserByEmail: ${invErr?.message}`);
      userId = invited.user.id;
      isNew = true;
    }

    await admin.from("profiles").upsert({ id: userId, full_name: fullName }, { onConflict: "id" });

    // 2. Get-or-create organization
    let orgId: string | undefined;
    const { data: existingOrg } = await admin
      .from("organizations")
      .select("id")
      .eq("subdomain", orgSubdomain)
      .maybeSingle();
    if (existingOrg) {
      orgId = existingOrg.id;
    } else {
      const { data: org, error: orgErr } = await admin
        .from("organizations")
        .insert({
          name: orgName,
          subdomain: orgSubdomain,
          created_by: userId,
          provider_category: "intervention",
          levels_of_care: ["intervention", "coordination"],
          outcome_tracking_enabled: true,
          intervention_tracking_enabled: true,
          benchmark_opt_in: false,
        })
        .select("id")
        .single();
      if (orgErr) throw new Error("organizations insert: " + orgErr.message);
      orgId = org.id;
    }

    // 3. Make user owner
    await admin
      .from("organization_members")
      .upsert([{ organization_id: orgId!, user_id: userId, role: "owner" }], {
        onConflict: "organization_id,user_id",
      });

    // 4. Send onboarding email
    const resendKey = Deno.env.get("RESEND_API_KEY");
    let emailResult: any = null;
    if (resendKey) {
      const resend = new Resend(resendKey);
      const firstName = fullName.split(" ")[0] || fullName;
      const html = `
        <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#222;max-width:640px;margin:0 auto;padding:24px;">
          <div style="text-align:center;margin-bottom:24px;">
            <img src="https://familybridgeapp.com/og-image.png" alt="FamilyBridge" style="max-width:180px;height:auto;" />
          </div>
          <h2 style="color:#2d7d6f;margin-top:0;">Welcome to FamilyBridge, ${firstName}!</h2>
          <p>Your complimentary provider account for <strong>${orgName}</strong> has been created. Here is how to get started, step by step.</p>

          <div style="background:#f6f9f8;border-left:4px solid #2d7d6f;padding:16px 20px;border-radius:8px;margin:20px 0;">
            <strong>Step 1 — Activate your login</strong>
            <p style="margin:8px 0 0 0;">You will receive a separate email titled "Confirm your signup" from FamilyBridge. Click the link inside to set your password. Use this email address (<strong>${email}</strong>) to sign in.</p>
          </div>

          <div style="background:#f6f9f8;border-left:4px solid #2d7d6f;padding:16px 20px;border-radius:8px;margin:20px 0;">
            <strong>Step 2 — Sign in to the Provider Dashboard</strong>
            <p style="margin:8px 0 0 0;">Go to <a href="https://familybridgeapp.com/auth">familybridgeapp.com/auth</a> and sign in. You will land on your Provider workspace for <strong>${orgName}</strong>.</p>
          </div>

          <div style="background:#f6f9f8;border-left:4px solid #2d7d6f;padding:16px 20px;border-radius:8px;margin:20px 0;">
            <strong>Step 3 — Brand your organization</strong>
            <p style="margin:8px 0 0 0;">Open <em>Provider Admin → Branding</em> to upload your logo, set colors, and confirm your organization details. Your families will see this branding throughout the app.</p>
          </div>

          <div style="background:#f6f9f8;border-left:4px solid #2d7d6f;padding:16px 20px;border-radius:8px;margin:20px 0;">
            <strong>Step 4 — Invite your team</strong>
            <p style="margin:8px 0 0 0;">Under <em>Provider Admin → Moderators</em>, invite the clinicians and staff who should have access. You can assign Admin or Staff roles.</p>
          </div>

          <div style="background:#f6f9f8;border-left:4px solid #2d7d6f;padding:16px 20px;border-radius:8px;margin:20px 0;">
            <strong>Step 5 — Onboard your first family</strong>
            <p style="margin:8px 0 0 0;">From <em>Provider Admin → Families</em>, create a family group, then share the invite code (or send an email/SMS invite) to the family members and the recovering individual.</p>
          </div>

          <div style="background:#f6f9f8;border-left:4px solid #2d7d6f;padding:16px 20px;border-radius:8px;margin:20px 0;">
            <strong>Step 6 — Explore the clinical tools</strong>
            <p style="margin:8px 0 0 0;">Upload intervention letters and aftercare plans (FIIS will extract boundaries, values, and goals automatically), review the Accountability Engine, and use the Moderator AI Chat for private clinical guidance.</p>
          </div>

          <p style="margin-top:24px;">If you have any questions or want a walkthrough, just reply to this email — I am copied here and happy to help.</p>

          <hr style="border:none;border-top:1px solid #e3e6e8;margin:28px 0;" />
          <p style="margin:0;">Thank you,</p>
          <p style="margin:4px 0 0 0;font-weight:bold;">${senderName || "Matt Brown"}</p>
          <p style="margin:0;color:#666;font-size:13px;">Creator of FamilyBridge</p>
        </div>
      `;

      emailResult = await resend.emails.send({
        from: "FamilyBridge <noreply@familybridgeapp.com>",
        to: [email],
        cc: ccEmail ? [ccEmail] : undefined,
        reply_to: ccEmail,
        subject: `Welcome to FamilyBridge — your ${orgName} provider account is ready`,
        html,
      });
    }

    return json({ ok: true, userId, orgId, isNew, emailResult }, 200);
  } catch (e) {
    console.error("onboard-free-provider error", e);
    return json({ error: String((e as Error).message ?? e) }, 500);
  }
});