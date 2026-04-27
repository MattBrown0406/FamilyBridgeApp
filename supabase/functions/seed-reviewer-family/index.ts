/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// One-shot seeder for the App Review demo family.
// Protected by SEED_REVIEWER_SECRET. POST { secret: "..." }.
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const expectedSecret = Deno.env.get("SEED_REVIEWER_SECRET");
    const reviewerEmail = Deno.env.get("REVIEWER_EMAIL") || "appreview@familybridgeapp.com";
    const reviewerPassword = Deno.env.get("REVIEWER_PASSWORD") || "AppReview!2026";
    const memberEmail = Deno.env.get("REVIEWER_MEMBER_EMAIL") || "reviewer-family@familybridgeapp.com";
    const memberPassword = Deno.env.get("REVIEWER_MEMBER_PASSWORD") || "AppReview!2026";

    if (!expectedSecret) {
      return json({ error: "SEED_REVIEWER_SECRET not configured" }, 500);
    }
    const body = await req.json().catch(() => ({}));
    if (body?.secret !== expectedSecret) {
      return json({ error: "Unauthorized" }, 401);
    }

    const admin = createClient(url, serviceKey);

    // Helper: get-or-create auth user
    async function ensureUser(email: string, password: string, fullName: string): Promise<string> {
      // Try sign-in by listing users (paged); use admin.getUserByEmail via listUsers filter
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      const existing = list?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      if (existing) return existing.id;

      const { data: created, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });
      if (error || !created.user) throw new Error(`createUser ${email}: ${error?.message}`);
      return created.user.id;
    }

    const reviewerId = await ensureUser(reviewerEmail, reviewerPassword, "App Reviewer");
    const memberId = await ensureUser(memberEmail, memberPassword, "Jamie Demo");

    // Ensure profiles (handle_new_user trigger usually does this, but be safe)
    await admin.from("profiles").upsert(
      [
        { id: reviewerId, full_name: "App Reviewer" },
        { id: memberId, full_name: "Jamie Demo" },
      ],
      { onConflict: "id" },
    );

    // Idempotency: find or create the reviewer family
    const familyName = "App Review Demo Family";
    const { data: existingFam } = await admin
      .from("families")
      .select("id")
      .eq("created_by", reviewerId)
      .eq("name", familyName)
      .maybeSingle();

    let familyId = existingFam?.id as string | undefined;

    if (!familyId) {
      const { data: fam, error: famErr } = await admin
        .from("families")
        .insert({
          name: familyName,
          description: "Sample family group used for App Store review. All data is fictional and used for coordination demo only.",
          created_by: reviewerId,
        })
        .select("id")
        .single();
      if (famErr) throw new Error("families insert: " + famErr.message);
      familyId = fam.id;

      await admin.from("family_members").insert([
        { family_id: familyId, user_id: reviewerId, role: "admin", relationship_type: "parent" },
        { family_id: familyId, user_id: memberId, role: "member", relationship_type: "child" },
      ]);

      await admin.from("family_invite_codes").insert({ family_id: familyId }).select();

      // Messages
      await admin.from("messages").insert([
        { family_id: familyId, sender_id: reviewerId, content: "Welcome to our family group! This is a shared space to coordinate support and stay in touch." },
        { family_id: familyId, sender_id: memberId, content: "Thanks for setting this up. Glad we have one place to keep things organized." },
        { family_id: familyId, sender_id: reviewerId, content: "Reminder: family check-in this Sunday at 6pm. Looking forward to it!" },
      ]);

      // Financial request (sample, small amount, neutral framing)
      await admin.from("financial_requests").insert({
        family_id: familyId,
        requester_id: memberId,
        amount: 45.00,
        reason: "Bus pass for the month so I can get to work and the community center.",
        status: "pending",
      });

      // Boundary / support-plan item (already approved)
      await admin.from("family_boundaries").insert({
        family_id: familyId,
        created_by: reviewerId,
        target_user_id: memberId,
        content: "We agree to share weekly schedules in this group so everyone stays on the same page.",
        consequence: "If schedules aren't shared, we'll set a 10-minute Sunday call to plan together.",
        status: "approved",
        approved_by: reviewerId,
        approved_at: new Date().toISOString(),
        author_name: "App Reviewer",
      });

      // Meeting / check-in example (Support Group, neutral coordinates - SF City Hall)
      const checkedIn = new Date();
      await admin.from("meeting_checkins").insert({
        user_id: memberId,
        family_id: familyId,
        meeting_type: "Support Group",
        meeting_name: "Community Support Group",
        meeting_address: "Community Center, Main St",
        latitude: 37.7793,
        longitude: -122.4193,
        notes: "Weekly community support meet-up.",
        checked_in_at: checkedIn.toISOString(),
      });
    }

    return json({
      ok: true,
      family_id: familyId,
      reviewer: { email: reviewerEmail, user_id: reviewerId },
      member: { email: memberEmail, user_id: memberId },
    }, 200);
  } catch (e) {
    console.log("seed-reviewer-family error", e);
    return json({ error: String((e as Error).message ?? e) }, 500);
  }

  function json(payload: unknown, status: number) {
    return new Response(JSON.stringify(payload), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
