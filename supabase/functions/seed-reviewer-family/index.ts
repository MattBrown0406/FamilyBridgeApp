/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// One-shot seeder for the App Review demo family.
// Protected: only callable by an authenticated Super Admin.
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const reviewerEmail = Deno.env.get("REVIEWER_EMAIL") || "appreview@familybridgeapp.com";
    const reviewerPassword = Deno.env.get("REVIEWER_PASSWORD") || "AppReview!2026";
    const memberEmail = Deno.env.get("REVIEWER_MEMBER_EMAIL") || "reviewer-family@familybridgeapp.com";
    const memberPassword = Deno.env.get("REVIEWER_MEMBER_PASSWORD") || "AppReview!2026";
    const deletionReviewerEmail = Deno.env.get("DELETION_REVIEWER_EMAIL") || "appstoreconnect@apple.com";
    const deletionReviewerPassword = Deno.env.get("DELETION_REVIEWER_PASSWORD") || "appstorereview";
    const deletionMemberEmail = Deno.env.get("DELETION_REVIEWER_MEMBER_EMAIL") || "appstoreconnect-family@familybridgeapp.com";
    const deletionMemberPassword = Deno.env.get("DELETION_REVIEWER_MEMBER_PASSWORD") || "appstorereview";

    const admin = createClient(url, serviceKey);

    // Require a logged-in super admin
    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!jwt) return json({ error: "Unauthorized" }, 401);
    const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);
    const { data: isSuper } = await admin.rpc("is_super_admin", { _user_id: userData.user.id });
    if (!isSuper) return json({ error: "Forbidden: super admin only" }, 403);

    // Helper: get-or-create auth user
    async function ensureUser(email: string, password: string, fullName: string): Promise<string> {
      let page = 1;
      while (true) {
        const { data: list, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
        if (error) throw new Error(`listUsers: ${error.message}`);
        const existing = list?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
        if (existing) {
          const { error: updateError } = await admin.auth.admin.updateUserById(existing.id, {
            password,
            email_confirm: true,
            user_metadata: { full_name: fullName },
          });
          if (updateError) throw new Error(`updateUser ${email}: ${updateError.message}`);
          return existing.id;
        }
        if (!list?.users?.length || list.users.length < 200) break;
        page += 1;
      }

      const { data: created, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });
      if (error || !created.user) throw new Error(`createUser ${email}: ${error?.message}`);
      return created.user.id;
    }

    async function ensureFamilyForReviewer({
      reviewerId,
      memberId,
      familyName,
      description,
      reviewerDisplayName,
      deletionSafe = false,
    }: {
      reviewerId: string;
      memberId?: string;
      familyName: string;
      description: string;
      reviewerDisplayName: string;
      deletionSafe?: boolean;
    }) {
      const { data: existingFam } = await admin
        .from("families")
        .select("id")
        .eq("created_by", reviewerId)
        .eq("name", familyName)
        .maybeSingle();

      let familyId = existingFam?.id as string | undefined;

      if (familyId) return familyId;

      const { data: fam, error: famErr } = await admin
        .from("families")
        .insert({
          name: familyName,
          description,
          created_by: reviewerId,
        })
        .select("id")
        .single();
      if (famErr) throw new Error("families insert: " + famErr.message);
      familyId = fam.id;

      const members = [
        { family_id: familyId, user_id: reviewerId, role: "admin", relationship_type: "parent" },
      ];
      if (memberId) {
        members.push({ family_id: familyId, user_id: memberId, role: "member", relationship_type: "child" });
      }
      await admin.from("family_members").insert(members);

      await admin.from("family_invite_codes").insert({ family_id: familyId }).select();

      await admin.from("messages").insert([
        {
          family_id: familyId,
          sender_id: reviewerId,
          content: deletionSafe
            ? "This disposable demo family is safe to use when testing the in-app account deletion flow."
            : "Welcome to our family group! This is a shared space to coordinate support and stay in touch.",
        },
        ...(memberId
          ? [{
              family_id: familyId,
              sender_id: memberId,
              content: "Thanks for setting this up. Glad we have one place to keep things organized.",
            }]
          : []),
        {
          family_id: familyId,
          sender_id: reviewerId,
          content: deletionSafe
            ? "To test deletion, open Settings and choose Delete Account. This account and its demo data are disposable."
            : "Reminder: family check-in this Sunday at 6pm. Looking forward to it!",
        },
      ]);

      await admin.from("financial_requests").insert({
        family_id: familyId,
        requester_id: memberId ?? reviewerId,
        amount: deletionSafe ? 12.00 : 45.00,
        reason: deletionSafe
          ? "Disposable sample request for account deletion testing."
          : "Bus pass for the month so I can get to work and the community center.",
        status: "pending",
      });

      await admin.from("family_boundaries").insert({
        family_id: familyId,
        created_by: reviewerId,
        target_user_id: memberId ?? reviewerId,
        content: deletionSafe
          ? "This demo family exists only so App Review can safely complete account deletion."
          : "We agree to share weekly schedules in this group so everyone stays on the same page.",
        consequence: deletionSafe
          ? "No real user data is affected by deleting this demo account."
          : "If schedules aren't shared, we'll set a 10-minute Sunday call to plan together.",
        status: "approved",
        approved_by: reviewerId,
        approved_at: new Date().toISOString(),
        author_name: reviewerDisplayName,
      });

      await admin.from("meeting_checkins").insert({
        user_id: memberId ?? reviewerId,
        family_id: familyId,
        meeting_type: "Support Group",
        meeting_name: deletionSafe ? "Deletion Flow Demo Check-in" : "Community Support Group",
        meeting_address: "Community Center, Main St",
        latitude: 37.7793,
        longitude: -122.4193,
        notes: deletionSafe ? "Fictional check-in for deletion-flow review." : "Weekly community support meet-up.",
        checked_in_at: new Date().toISOString(),
      });

      return familyId;
    }

    const reviewerId = await ensureUser(reviewerEmail, reviewerPassword, "App Reviewer");
    const memberId = await ensureUser(memberEmail, memberPassword, "Jamie Demo");
    const deletionReviewerId = await ensureUser(
      deletionReviewerEmail,
      deletionReviewerPassword,
      "App Store Connect Reviewer",
    );
    const deletionMemberId = await ensureUser(
      deletionMemberEmail,
      deletionMemberPassword,
      "App Store Connect Demo Member",
    );

    // Ensure profiles (handle_new_user trigger usually does this, but be safe)
    await admin.from("profiles").upsert(
      [
        { id: reviewerId, full_name: "App Reviewer" },
        { id: memberId, full_name: "Jamie Demo" },
        { id: deletionReviewerId, full_name: "App Store Connect Reviewer" },
        { id: deletionMemberId, full_name: "App Store Connect Demo Member" },
      ],
      { onConflict: "id" },
    );

    const familyId = await ensureFamilyForReviewer({
      reviewerId,
      memberId,
      familyName: "App Review Demo Family",
      description: "Sample family group used for App Store review. All data is fictional and used for coordination demo only.",
      reviewerDisplayName: "App Reviewer",
    });

    await admin.from("family_members").upsert(
      [{
        family_id: familyId,
        user_id: deletionReviewerId,
        role: "admin",
        relationship_type: "reviewer",
      }],
      { onConflict: "family_id,user_id" },
    );

    const deletionReviewerFullFeatureFamilyId = await ensureFamilyForReviewer({
      reviewerId: deletionReviewerId,
      memberId: deletionMemberId,
      familyName: "App Review Full Feature Demo",
      description: "Full-feature fictional family for App Store Connect reviewers to test FamilyBridge functionality before account deletion.",
      reviewerDisplayName: "App Store Connect Reviewer",
    });

    const deletionFamilyId = await ensureFamilyForReviewer({
      reviewerId: deletionReviewerId,
      familyName: "Demo Account for Deletion",
      description: "Disposable sample family for App Review account deletion testing. All data is fictional and safe to delete.",
      reviewerDisplayName: "App Store Connect Reviewer",
      deletionSafe: true,
    });

    return json({
      ok: true,
      family_id: familyId,
      reviewer: { email: reviewerEmail, user_id: reviewerId },
      member: { email: memberEmail, user_id: memberId },
      deletion_demo: {
        email: deletionReviewerEmail,
        password: deletionReviewerPassword,
        user_id: deletionReviewerId,
        family_id: deletionFamilyId,
        family_name: "Demo Account for Deletion",
        shared_full_feature_family_id: familyId,
        shared_full_feature_family_name: "App Review Demo Family",
        full_feature_family_id: deletionReviewerFullFeatureFamilyId,
        full_feature_family_name: "App Review Full Feature Demo",
      },
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
