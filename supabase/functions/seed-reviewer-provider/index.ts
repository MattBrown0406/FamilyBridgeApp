/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Seeds an Apple App Store reviewer PROVIDER account with a demo organization
// and a fully-populated demo family the reviewer can fully access and test.
// Idempotent. Callable only by the service role (invoked from the Lovable agent).
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  function json(payload: unknown, status: number) {
    return new Response(JSON.stringify(payload), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Service-role gate: caller must present the service-role key in Authorization
    const authHeader = req.headers.get("Authorization") || "";
    const presentedKey = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!presentedKey || presentedKey !== serviceKey) {
      return json({ error: "Unauthorized: service role required" }, 401);
    }

    const admin = createClient(url, serviceKey);

    const PROVIDER_EMAIL = "appstorereview@apple.com";
    const PROVIDER_PASSWORD = "appstorereview";
    const ORG_NAME = "App Review Demo Provider";
    const ORG_SUBDOMAIN = "appreview-demo";
    const FAMILY_NAME = "App Review Demo Family";

    // Helper: get-or-create auth user
    async function ensureUser(email: string, password: string, fullName: string): Promise<string> {
      // Page through users to find existing
      let page = 1;
      while (true) {
        const { data: list, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
        if (error) throw new Error(`listUsers: ${error.message}`);
        const found = list?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
        if (found) return found.id;
        if (!list?.users?.length || list.users.length < 200) break;
        page += 1;
      }
      const { data: created, error: cErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });
      if (cErr || !created.user) throw new Error(`createUser ${email}: ${cErr?.message}`);
      return created.user.id;
    }

    // 1. Provider (owner) + 3 demo family members
    const providerId = await ensureUser(PROVIDER_EMAIL, PROVIDER_PASSWORD, "App Store Reviewer");
    const memberAId = await ensureUser("review-parent@familybridgeapp.com", "AppReview!2026", "Pat Reviewer (Parent)");
    const memberBId = await ensureUser("review-loved-one@familybridgeapp.com", "AppReview!2026", "Jamie Reviewer (Loved One)");
    const memberCId = await ensureUser("review-sibling@familybridgeapp.com", "AppReview!2026", "Alex Reviewer (Sibling)");

    await admin.from("profiles").upsert(
      [
        { id: providerId, full_name: "App Store Reviewer" },
        { id: memberAId, full_name: "Pat Reviewer" },
        { id: memberBId, full_name: "Jamie Reviewer" },
        { id: memberCId, full_name: "Alex Reviewer" },
      ],
      { onConflict: "id" },
    );

    // 2. Organization (provider)
    let orgId: string | undefined;
    const { data: existingOrg } = await admin
      .from("organizations")
      .select("id")
      .eq("subdomain", ORG_SUBDOMAIN)
      .maybeSingle();
    if (existingOrg) {
      orgId = existingOrg.id;
    } else {
      const { data: org, error: orgErr } = await admin
        .from("organizations")
        .insert({
          name: ORG_NAME,
          subdomain: ORG_SUBDOMAIN,
          tagline: "Apple App Review demo provider organization",
          created_by: providerId,
          provider_category: "demo",
          levels_of_care: ["coordination"],
          outcome_tracking_enabled: true,
          intervention_tracking_enabled: true,
          benchmark_opt_in: false,
          intake_notes: "Demo organization for App Store reviewers. All data fictional.",
        })
        .select("id")
        .single();
      if (orgErr) throw new Error("organizations insert: " + orgErr.message);
      orgId = org.id;
    }

    // 3. Provider as org owner
    await admin
      .from("organization_members")
      .upsert(
        [{ organization_id: orgId!, user_id: providerId, role: "owner" }],
        { onConflict: "organization_id,user_id" },
      );

    // 4. Demo family under this org
    let familyId: string | undefined;
    const { data: existingFam } = await admin
      .from("families")
      .select("id")
      .eq("organization_id", orgId!)
      .eq("name", FAMILY_NAME)
      .maybeSingle();

    if (existingFam) {
      familyId = existingFam.id;
    } else {
      const { data: fam, error: famErr } = await admin
        .from("families")
        .insert({
          name: FAMILY_NAME,
          description: "Sample family used for App Store review. All data is fictional and only demonstrates family coordination features.",
          created_by: providerId,
          organization_id: orgId!,
        })
        .select("id")
        .single();
      if (famErr) throw new Error("families insert: " + famErr.message);
      familyId = fam.id;

      // Family members - provider is moderator so reviewer can fully test all tabs
      await admin.from("family_members").insert([
        { family_id: familyId, user_id: providerId, role: "moderator", relationship_type: "professional" },
        { family_id: familyId, user_id: memberAId, role: "admin", relationship_type: "parent" },
        { family_id: familyId, user_id: memberBId, role: "member", relationship_type: "child" },
        { family_id: familyId, user_id: memberCId, role: "member", relationship_type: "sibling" },
      ]);

      await admin.from("family_invite_codes").insert({ family_id: familyId });

      // Family chat messages - neutral coordination framing
      await admin.from("messages").insert([
        { family_id: familyId, sender_id: memberAId, content: "Welcome everyone — this is our shared family space for staying connected and coordinated." },
        { family_id: familyId, sender_id: memberBId, content: "Thanks for setting this up. Glad we can keep things in one place." },
        { family_id: familyId, sender_id: memberCId, content: "Adding the Sunday call to my calendar — see you all then." },
        { family_id: familyId, sender_id: providerId, content: "Hi all, I'll check in weekly to help keep things organized. Reach out anytime." },
        { family_id: familyId, sender_id: memberAId, content: "Reminder: weekly family check-in this Sunday at 6pm." },
      ]);

      // Financial request
      await admin.from("financial_requests").insert({
        family_id: familyId,
        requester_id: memberBId,
        amount: 45.00,
        reason: "Monthly bus pass for work and the community center.",
        status: "pending",
      });

      // Approved boundary / support-plan item
      await admin.from("family_boundaries").insert({
        family_id: familyId,
        created_by: memberAId,
        target_user_id: memberBId,
        content: "We agree to share our weekly schedules in this group so everyone stays on the same page.",
        consequence: "If schedules aren't shared, we'll set a 10-minute Sunday call to plan together.",
        status: "approved",
        approved_by: memberAId,
        approved_at: new Date().toISOString(),
        author_name: "Pat Reviewer",
      });

      // Meeting check-in
      await admin.from("meeting_checkins").insert({
        user_id: memberBId,
        family_id: familyId,
        meeting_type: "Support Group",
        meeting_name: "Community Support Group",
        meeting_address: "Community Center, Main St",
        latitude: 37.7793,
        longitude: -122.4193,
        notes: "Weekly community support meet-up.",
        checked_in_at: new Date().toISOString(),
      });
    }

    return json({
      ok: true,
      provider: { email: PROVIDER_EMAIL, user_id: providerId },
      organization_id: orgId,
      family_id: familyId,
      members: [
        { email: "review-parent@familybridgeapp.com", user_id: memberAId },
        { email: "review-loved-one@familybridgeapp.com", user_id: memberBId },
        { email: "review-sibling@familybridgeapp.com", user_id: memberCId },
      ],
    }, 200);
  } catch (e) {
    console.log("seed-reviewer-provider error", e);
    return json({ error: String((e as Error).message ?? e) }, 500);
  }
});