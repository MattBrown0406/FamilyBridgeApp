import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
};

// Same list as verify-super-admin - must match
const SUPER_ADMIN_EMAILS = [
  "matt@freedominterventions.com",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify user with anon key first
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Not authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify super admin
    if (!SUPER_ADMIN_EMAILS.includes(user.email?.toLowerCase() || "")) {
      return new Response(
        JSON.stringify({ error: "Not authorized" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role key for admin queries
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check if this is a detail or action request
    const url = new URL(req.url);
    const familyId = url.searchParams.get("family_id");
    const orgId = url.searchParams.get("org_id");
    const userId = url.searchParams.get("user_id");
    const action = url.searchParams.get("action");

    // Handle DELETE actions
    if (req.method === "DELETE" || action === "delete") {
      if (familyId) {
        // Delete family and related data
        await adminClient.from("messages").delete().eq("family_id", familyId);
        await adminClient.from("meeting_checkins").delete().eq("family_id", familyId);
        await adminClient.from("financial_requests").delete().eq("family_id", familyId);
        await adminClient.from("family_members").delete().eq("family_id", familyId);
        await adminClient.from("family_boundaries").delete().eq("family_id", familyId);
        await adminClient.from("family_values").delete().eq("family_id", familyId);
        await adminClient.from("family_goals").delete().eq("family_id", familyId);
        await adminClient.from("family_common_goals").delete().eq("family_id", familyId);
        await adminClient.from("family_invite_codes").delete().eq("family_id", familyId);
        await adminClient.from("notifications").delete().eq("family_id", familyId);
        await adminClient.from("location_checkin_requests").delete().eq("family_id", familyId);
        await adminClient.from("private_messages").delete().eq("family_id", familyId);
        await adminClient.from("temporary_moderator_requests").delete().eq("family_id", familyId);
        await adminClient.from("paid_moderator_requests").delete().eq("family_id", familyId);
        const { error } = await adminClient.from("families").delete().eq("id", familyId);
        
        if (error) {
          console.error("Error deleting family:", error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (orgId) {
        // Delete organization and related data
        await adminClient.from("organization_members").delete().eq("organization_id", orgId);
        // Unlink families from org
        await adminClient.from("families").update({ organization_id: null }).eq("organization_id", orgId);
        const { error } = await adminClient.from("organizations").delete().eq("id", orgId);
        
        if (error) {
          console.error("Error deleting organization:", error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (userId) {
        // Delete user's related data first to avoid foreign key constraint violations
        try {
          // Delete from tables that reference user_id
          await adminClient.from("family_members").delete().eq("user_id", userId);
          await adminClient.from("organization_members").delete().eq("user_id", userId);
          await adminClient.from("messages").delete().eq("sender_id", userId);
          await adminClient.from("meeting_checkins").delete().eq("user_id", userId);
          await adminClient.from("financial_requests").delete().eq("requester_id", userId);
          await adminClient.from("financial_votes").delete().eq("voter_id", userId);
          await adminClient.from("financial_pledges").delete().eq("user_id", userId);
          await adminClient.from("location_checkin_requests").delete().eq("requester_id", userId);
          await adminClient.from("location_checkin_requests").delete().eq("target_user_id", userId);
          await adminClient.from("notifications").delete().eq("user_id", userId);
          await adminClient.from("private_messages").delete().eq("sender_id", userId);
          await adminClient.from("private_messages").delete().eq("recipient_id", userId);
          await adminClient.from("boundary_acknowledgments").delete().eq("user_id", userId);
          await adminClient.from("family_boundaries").delete().eq("created_by", userId);
          await adminClient.from("family_values").delete().eq("selected_by", userId);
          await adminClient.from("family_common_goals").delete().eq("selected_by", userId);
          await adminClient.from("family_goals").delete().eq("created_by", userId);
          await adminClient.from("push_subscriptions").delete().eq("user_id", userId);
          await adminClient.from("payment_info").delete().eq("user_id", userId);
          await adminClient.from("temporary_moderator_requests").delete().eq("requested_by", userId);
          await adminClient.from("temporary_moderator_requests").delete().eq("assigned_moderator_id", userId);
          await adminClient.from("paid_moderator_requests").delete().eq("requested_by", userId);
          await adminClient.from("paid_moderator_requests").delete().eq("assigned_moderator_id", userId);
          
          // Update families where this user is the creator
          await adminClient.from("families").update({ created_by: null }).eq("created_by", userId);
          
          // Delete profile (should cascade from auth.users but let's be safe)
          await adminClient.from("profiles").delete().eq("id", userId);
          
          // Finally delete the auth user
          const { error } = await adminClient.auth.admin.deleteUser(userId);
          
          if (error) {
            console.error("Error deleting user from auth:", error);
            return new Response(
              JSON.stringify({ error: error.message }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        } catch (err) {
          console.error("Error during user deletion:", err);
          return new Response(
            JSON.stringify({ error: "Failed to delete user and related data" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Handle UPDATE actions
    if (req.method === "PUT" || req.method === "PATCH") {
      const body = await req.json();

      if (familyId) {
        const { error } = await adminClient.from("families")
          .update({ name: body.name, description: body.description })
          .eq("id", familyId);
        
        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (orgId) {
        const { error } = await adminClient.from("organizations")
          .update({ 
            name: body.name, 
            subdomain: body.subdomain,
            tagline: body.tagline,
            support_email: body.support_email,
            phone: body.phone,
            website_url: body.website_url
          })
          .eq("id", orgId);
        
        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (userId) {
        const { error } = await adminClient.from("profiles")
          .update({ full_name: body.full_name })
          .eq("id", userId);
        
        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Return user details
    if (userId) {
      const [profileResult, familyMembersResult, orgMembersResult] = await Promise.all([
        adminClient.from("profiles").select("*").eq("id", userId).single(),
        adminClient.from("family_members").select("*, families(id, name)").eq("user_id", userId),
        adminClient.from("organization_members").select("*, organizations(id, name)").eq("user_id", userId),
      ]);

      // Get user auth data
      const { data: authData } = await adminClient.auth.admin.getUserById(userId);

      return new Response(
        JSON.stringify({
          profile: profileResult.data,
          email: authData?.user?.email,
          last_sign_in: authData?.user?.last_sign_in_at,
          created_at: authData?.user?.created_at,
          family_memberships: familyMembersResult.data || [],
          organization_memberships: orgMembersResult.data || [],
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return family details
    if (familyId) {
      const [familyResult, membersResult, messagesResult, checkinsResult, requestsResult] = await Promise.all([
        adminClient.from("families").select("*").eq("id", familyId).single(),
        adminClient.from("family_members").select("*, profiles(id, full_name, avatar_url)").eq("family_id", familyId),
        adminClient.from("messages").select("id, created_at, sender_id, content").eq("family_id", familyId).order("created_at", { ascending: false }).limit(20),
        adminClient.from("meeting_checkins").select("*").eq("family_id", familyId).order("checked_in_at", { ascending: false }).limit(20),
        adminClient.from("financial_requests").select("*").eq("family_id", familyId).order("created_at", { ascending: false }).limit(10),
      ]);

      // Get org name if applicable
      let organizationName = null;
      if (familyResult.data?.organization_id) {
        const { data: orgData } = await adminClient.from("organizations").select("name").eq("id", familyResult.data.organization_id).single();
        organizationName = orgData?.name;
      }

      return new Response(
        JSON.stringify({
          family: familyResult.data,
          organization_name: organizationName,
          members: membersResult.data || [],
          recent_messages: messagesResult.data || [],
          recent_checkins: checkinsResult.data || [],
          recent_requests: requestsResult.data || [],
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return organization details
    if (orgId) {
      const [orgResult, membersResult, familiesResult] = await Promise.all([
        adminClient.from("organizations").select("*").eq("id", orgId).single(),
        adminClient.from("organization_members").select("*, profiles(id, full_name, avatar_url)").eq("organization_id", orgId),
        adminClient.from("families").select("id, name, created_at").eq("organization_id", orgId).order("created_at", { ascending: false }),
      ]);

      return new Response(
        JSON.stringify({
          organization: orgResult.data,
          members: membersResult.data || [],
          families: familiesResult.data || [],
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Fetch all stats in parallel
    const [
      familiesResult,
      organizationsResult,
      profilesResult,
      messagesResult,
      messagesWeekResult,
      messagesMonthResult,
      checkinsResult,
      checkinsWeekResult,
      financialRequestsResult,
      financialRequestsMonthResult,
      usersListResult,
    ] = await Promise.all([
      // Total families
      adminClient.from("families").select("id", { count: "exact", head: true }),
      // Total organizations
      adminClient.from("organizations").select("id", { count: "exact", head: true }),
      // Total users
      adminClient.from("profiles").select("id", { count: "exact", head: true }),
      // Total messages
      adminClient.from("messages").select("id", { count: "exact", head: true }),
      // Messages this week
      adminClient.from("messages").select("id", { count: "exact", head: true })
        .gte("created_at", weekAgo.toISOString()),
      // Messages this month
      adminClient.from("messages").select("id", { count: "exact", head: true })
        .gte("created_at", monthAgo.toISOString()),
      // Total checkins
      adminClient.from("meeting_checkins").select("id", { count: "exact", head: true }),
      // Checkins this week
      adminClient.from("meeting_checkins").select("id", { count: "exact", head: true })
        .gte("created_at", weekAgo.toISOString()),
      // Total financial requests
      adminClient.from("financial_requests").select("id", { count: "exact", head: true }),
      // Financial requests this month
      adminClient.from("financial_requests").select("id", { count: "exact", head: true })
        .gte("created_at", monthAgo.toISOString()),
      // Users list
      adminClient.from("profiles").select("id, full_name, avatar_url, created_at").order("created_at", { ascending: false }),
    ]);

    // Get activity by family (last 30 days)
    const { data: familyActivity } = await adminClient
      .from("families")
      .select(`
        id,
        name,
        account_number,
        organization_id,
        created_at
      `)
      .order("created_at", { ascending: false });

    // Get all invite codes for families
    const { data: inviteCodes } = await adminClient
      .from("family_invite_codes")
      .select("family_id, invite_code");
    
    const inviteCodeMap: Record<string, string> = {};
    (inviteCodes || []).forEach(ic => {
      inviteCodeMap[ic.family_id] = ic.invite_code;
    });

    // Get message counts per family
    const { data: messagesByFamily } = await adminClient
      .from("messages")
      .select("family_id")
      .gte("created_at", monthAgo.toISOString());

    // Get checkin counts per family
    const { data: checkinsByFamily } = await adminClient
      .from("meeting_checkins")
      .select("family_id")
      .gte("created_at", monthAgo.toISOString());

    // Calculate counts per family
    const familyMessageCounts: Record<string, number> = {};
    const familyCheckinCounts: Record<string, number> = {};

    (messagesByFamily || []).forEach(m => {
      familyMessageCounts[m.family_id] = (familyMessageCounts[m.family_id] || 0) + 1;
    });

    (checkinsByFamily || []).forEach(c => {
      familyCheckinCounts[c.family_id] = (familyCheckinCounts[c.family_id] || 0) + 1;
    });

    // Get organization names and logos for families
    const { data: orgs } = await adminClient
      .from("organizations")
      .select("id, name, logo_url, primary_color");

    const orgMap: Record<string, { name: string; logo_url: string | null; primary_color: string | null }> = {};
    (orgs || []).forEach(o => {
      orgMap[o.id] = { name: o.name, logo_url: o.logo_url, primary_color: o.primary_color };
    });

    // Combine family data with activity
    const familiesWithActivity = (familyActivity || []).map(f => ({
      id: f.id,
      name: f.name,
      account_number: f.account_number,
      invite_code: inviteCodeMap[f.id] || null,
      organization_name: f.organization_id ? orgMap[f.organization_id]?.name || null : null,
      organization_logo_url: f.organization_id ? orgMap[f.organization_id]?.logo_url || null : null,
      organization_primary_color: f.organization_id ? orgMap[f.organization_id]?.primary_color || null : null,
      created_at: f.created_at,
      messages_last_30_days: familyMessageCounts[f.id] || 0,
      checkins_last_30_days: familyCheckinCounts[f.id] || 0,
      total_activity: (familyMessageCounts[f.id] || 0) + (familyCheckinCounts[f.id] || 0),
    }));

    // Sort by activity (most active first)
    familiesWithActivity.sort((a, b) => b.total_activity - a.total_activity);

    // Get organization stats with branding
    const { data: orgData } = await adminClient
      .from("organizations")
      .select("id, name, subdomain, created_at, logo_url, primary_color, secondary_color, accent_color, background_color, foreground_color");

    // Count families per org
    const familiesPerOrg: Record<string, number> = {};
    (familyActivity || []).forEach(f => {
      if (f.organization_id) {
        familiesPerOrg[f.organization_id] = (familiesPerOrg[f.organization_id] || 0) + 1;
      }
    });

    const organizationsWithStats = (orgData || []).map(o => ({
      id: o.id,
      name: o.name,
      subdomain: o.subdomain,
      created_at: o.created_at,
      family_count: familiesPerOrg[o.id] || 0,
      logo_url: o.logo_url,
      primary_color: o.primary_color,
      secondary_color: o.secondary_color,
      accent_color: o.accent_color,
      background_color: o.background_color,
      foreground_color: o.foreground_color,
    }));

    // Get family memberships with roles per user
    const { data: familyMemberships } = await adminClient
      .from("family_members")
      .select("user_id, role");

    // Get organization memberships with roles per user, including org details
    const { data: orgMemberships } = await adminClient
      .from("organization_members")
      .select("user_id, role, organization_id");

    // Get all org data for logo lookup
    const orgLogoMap: Record<string, { logo_url: string | null; name: string; primary_color: string | null }> = {};
    (orgs || []).forEach(o => {
      orgLogoMap[o.id] = { logo_url: o.logo_url, name: o.name, primary_color: o.primary_color };
    });

    const userFamilyCounts: Record<string, number> = {};
    const userFamilyRoles: Record<string, Set<string>> = {};
    (familyMemberships || []).forEach(m => {
      userFamilyCounts[m.user_id] = (userFamilyCounts[m.user_id] || 0) + 1;
      if (!userFamilyRoles[m.user_id]) {
        userFamilyRoles[m.user_id] = new Set();
      }
      userFamilyRoles[m.user_id].add(m.role);
    });

    const userOrgRoles: Record<string, Set<string>> = {};
    const userOrgInfo: Record<string, { logo_url: string | null; name: string; primary_color: string | null }> = {};
    (orgMemberships || []).forEach(m => {
      if (!userOrgRoles[m.user_id]) {
        userOrgRoles[m.user_id] = new Set();
      }
      userOrgRoles[m.user_id].add(m.role);
      // Store org info for users with owner/admin roles
      if ((m.role === 'owner' || m.role === 'admin') && orgLogoMap[m.organization_id]) {
        userOrgInfo[m.user_id] = orgLogoMap[m.organization_id];
      }
    });

    // Get user emails to check for super admin
    const userEmails: Record<string, string> = {};
    for (const u of (usersListResult.data || [])) {
      try {
        const { data: authData } = await adminClient.auth.admin.getUserById(u.id);
        if (authData?.user?.email) {
          userEmails[u.id] = authData.user.email.toLowerCase();
        }
      } catch (e) {
        // Skip if can't get email
      }
    }

    const usersWithStats = (usersListResult.data || []).map(u => {
      const familyRoles = userFamilyRoles[u.id] ? Array.from(userFamilyRoles[u.id]) : [];
      const orgRoles = userOrgRoles[u.id] ? Array.from(userOrgRoles[u.id]) : [];
      const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(userEmails[u.id] || "");
      const orgInfo = userOrgInfo[u.id] || null;
      
      return {
        id: u.id,
        full_name: u.full_name,
        avatar_url: u.avatar_url,
        created_at: u.created_at,
        family_count: userFamilyCounts[u.id] || 0,
        family_roles: familyRoles,
        org_roles: orgRoles,
        is_super_admin: isSuperAdmin,
        org_logo_url: orgInfo?.logo_url || null,
        org_name: orgInfo?.name || null,
        org_primary_color: orgInfo?.primary_color || null,
      };
    });

    const [
      recoveringMembersResult,
      sobrietyJourneysResult,
      carePhasesResult,
      providerHandoffsResult,
      accountabilityScoresResult,
      accountabilityAlertsResult,
      aftercarePlansResult,
      aftercareRecommendationsResult,
      messages90DayResult,
      checkins90DayResult,
      coachingSessionsResult,
    ] = await Promise.all([
      adminClient
        .from("family_members")
        .select("user_id, family_id, joined_at")
        .eq("role", "recovering"),
      adminClient
        .from("sobriety_journeys")
        .select("user_id, family_id, start_date, reset_count, is_active, updated_at"),
      adminClient
        .from("care_phases")
        .select("user_id, family_id, organization_id, phase_type, started_at, ended_at, is_current, created_at"),
      adminClient
        .from("provider_handoffs")
        .select("user_id, family_id, from_organization_id, to_organization_id, status, initiated_at, completed_at, created_at"),
      adminClient
        .from("accountability_scores")
        .select("organization_id, family_id, score_type, score, trend, calculated_at")
        .order("calculated_at", { ascending: false }),
      adminClient
        .from("accountability_alerts")
        .select("organization_id, family_id, severity, is_dismissed, created_at"),
      adminClient
        .from("aftercare_plans")
        .select("id, family_id, target_user_id, created_at, is_active"),
      adminClient
        .from("aftercare_recommendations")
        .select("id, plan_id, is_completed, completed_at, created_at"),
      adminClient
        .from("messages")
        .select("family_id, created_at, content")
        .gte("created_at", weekAgo.toISOString()),
      adminClient
        .from("meeting_checkins")
        .select("family_id, checked_in_at, meeting_type")
        .gte("checked_in_at", weekAgo.toISOString()),
      adminClient
        .from("coaching_sessions")
        .select("family_id, session_type, started_at, user_id, talking_to_name, talking_to_user_id")
        .gte("started_at", weekAgo.toISOString()),
    ]);

    const recoveringMembers = recoveringMembersResult.data || [];
    const sobrietyJourneys = sobrietyJourneysResult.data || [];
    const carePhases = carePhasesResult.data || [];
    const providerHandoffs = providerHandoffsResult.data || [];
    const accountabilityScores = accountabilityScoresResult.data || [];
    const accountabilityAlerts = accountabilityAlertsResult.data || [];
    const aftercarePlans = aftercarePlansResult.data || [];
    const aftercareRecommendations = aftercareRecommendationsResult.data || [];
    const recentMessages = messages90DayResult.data || [];
    const recentCheckins = checkins90DayResult.data || [];
    const coachingSessions = coachingSessionsResult.data || [];

    const uniqueRecoveringUserIds = Array.from(new Set(recoveringMembers.map((member) => member.user_id)));
    const activeJourneys = sobrietyJourneys.filter((journey) => journey.is_active);
    const stableJourneys = activeJourneys.filter((journey) => (journey.reset_count || 0) === 0);
    const resetJourneys = activeJourneys.filter((journey) => (journey.reset_count || 0) > 0);
    const currentPhases = carePhases.filter((phase) => phase.is_current);
    const completedHandoffs = providerHandoffs.filter((handoff) => handoff.status === "completed");
    const activeCriticalAlerts = accountabilityAlerts.filter((alert) => !alert.is_dismissed && alert.severity === "critical");
    const activeWarningAlerts = accountabilityAlerts.filter((alert) => !alert.is_dismissed && alert.severity === "warning");

    const currentPhaseByUser = new Map<string, any>();
    currentPhases.forEach((phase) => {
      currentPhaseByUser.set(phase.user_id, phase);
    });

    const phasesByUser = new Map<string, any[]>();
    carePhases.forEach((phase) => {
      const existing = phasesByUser.get(phase.user_id) || [];
      existing.push(phase);
      phasesByUser.set(phase.user_id, existing);
    });

    const familiesById = new Map((familyActivity || []).map((family) => [family.id, family]));
    const organizationsById = new Map((orgData || []).map((org) => [org.id, org]));

    const progressionRank: Record<string, number> = {
      detox: 0,
      residential_treatment: 1,
      partial_hospitalization: 2,
      intensive_outpatient: 3,
      outpatient: 4,
      sober_living: 5,
      independent: 6,
    };

    const benchmarkDefinitions = [
      { key: "day_30", label: "30 days", days: 30 },
      { key: "day_90", label: "90 days", days: 90 },
      { key: "day_180", label: "6 months", days: 180 },
      { key: "day_270", label: "9 months", days: 270 },
      { key: "day_365", label: "12 months", days: 365 },
    ];

    const aftercarePlanByUserFamily = new Map<string, any>();
    aftercarePlans.forEach((plan) => {
      const key = `${plan.family_id}:${plan.target_user_id}`;
      if (!aftercarePlanByUserFamily.has(key)) aftercarePlanByUserFamily.set(key, plan);
    });

    const recommendationsByPlan = new Map<string, any[]>();
    aftercareRecommendations.forEach((recommendation) => {
      const existing = recommendationsByPlan.get(recommendation.plan_id) || [];
      existing.push(recommendation);
      recommendationsByPlan.set(recommendation.plan_id, existing);
    });

    const openAIApiKey = Deno.env.get("OPENAI_API_KEY") || Deno.env.get("OPENAI_APIKEY") || "";

    const recentMessageCountByFamily = new Map<string, number>();
    recentMessages.forEach((message) => {
      recentMessageCountByFamily.set(message.family_id, (recentMessageCountByFamily.get(message.family_id) || 0) + 1);
    });

    const recentCheckinCountByFamily = new Map<string, number>();
    recentCheckins.forEach((checkin) => {
      recentCheckinCountByFamily.set(checkin.family_id, (recentCheckinCountByFamily.get(checkin.family_id) || 0) + 1);
    });

    const supportEngagementMeetingTypes = new Set([
      "AA",
      "Al-Anon",
      "NA",
      "Nar-Anon",
      "Refuge Recovery",
      "Smart Recovery",
      "ACA",
      "CoDA",
      "Families Anonymous",
      "Celebrate Recovery",
      "Therapy",
      "Support Group",
      "Other",
    ]);

    const directFamilySupportCountByFamily = new Map<string, number>();
    recentCheckins.forEach((checkin) => {
      if (!supportEngagementMeetingTypes.has(checkin.meeting_type)) return;
      directFamilySupportCountByFamily.set(
        checkin.family_id,
        (directFamilySupportCountByFamily.get(checkin.family_id) || 0) + 1,
      );
    });


    let progressedUsers = 0;
    let regressedUsers = 0;

    uniqueRecoveringUserIds.forEach((userId) => {
      const userPhases = (phasesByUser.get(userId) || [])
        .slice()
        .sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime());

      let movedForward = false;
      let movedBackward = false;

      for (let i = 1; i < userPhases.length; i += 1) {
        const previousRank = progressionRank[userPhases[i - 1].phase_type] ?? -1;
        const currentRank = progressionRank[userPhases[i].phase_type] ?? -1;
        if (currentRank > previousRank) movedForward = true;
        if (currentRank < previousRank) movedBackward = true;
      }

      if (movedForward && !movedBackward) progressedUsers += 1;
      if (movedBackward) regressedUsers += 1;
    });

    const totalRecoveringMembers = uniqueRecoveringUserIds.length;
    const sobrietyStabilityRate = totalRecoveringMembers > 0
      ? Math.round((stableJourneys.length / totalRecoveringMembers) * 100)
      : 0;
    const resetRate = totalRecoveringMembers > 0
      ? Math.round((resetJourneys.length / totalRecoveringMembers) * 100)
      : 0;
    const progressionRate = totalRecoveringMembers > 0
      ? Math.round((progressedUsers / totalRecoveringMembers) * 100)
      : 0;
    const regressionRate = totalRecoveringMembers > 0
      ? Math.round((regressedUsers / totalRecoveringMembers) * 100)
      : 0;

    const completedClients = currentPhases.filter((phase) => phase.phase_type === "independent").length;
    const completionRate = totalRecoveringMembers > 0
      ? Math.round((completedClients / totalRecoveringMembers) * 100)
      : 0;

    const averageDaysInCare = recoveringMembers.length > 0
      ? Math.round(recoveringMembers.reduce((sum, member) => {
          const joined = member.joined_at ? new Date(member.joined_at).getTime() : Date.now();
          const diffDays = Math.max(0, Math.floor((Date.now() - joined) / (1000 * 60 * 60 * 24)));
          return sum + diffDays;
        }, 0) / recoveringMembers.length)
      : 0;

    const scoreByOrganization = new Map<string, any>();
    accountabilityScores
      .filter((score) => score.organization_id && score.score_type === "provider")
      .forEach((score) => {
        if (!score.organization_id || scoreByOrganization.has(score.organization_id)) return;
        scoreByOrganization.set(score.organization_id, score);
      });

    const alertsByOrganization = new Map<string, { critical: number; warning: number }>();
    accountabilityAlerts.forEach((alert) => {
      if (!alert.organization_id || alert.is_dismissed) return;
      const current = alertsByOrganization.get(alert.organization_id) || { critical: 0, warning: 0 };
      if (alert.severity === "critical") current.critical += 1;
      if (alert.severity === "warning") current.warning += 1;
      alertsByOrganization.set(alert.organization_id, current);
    });

    const buildBenchmarkSummary = (rows: Array<{
      family_id: string;
      user_id: string;
      organization_id: string | null;
      treatment_completion_date: string | null;
      sobriety_days: number;
      had_reset: boolean;
      family_engaged: boolean;
      direct_support_engaged?: boolean;
      coaching_engaged?: boolean;
      coaching_session_count?: number;
      supportive_communication_score?: number;
      concerning_communication_score?: number;
      communication_valence?: string;
      aftercare_adherent: boolean;
    }>) => {
      return benchmarkDefinitions.map((benchmark) => {
        const eligibleRows = rows.filter((row) => {
          if (!row.treatment_completion_date) return false;
          const completionAgeDays = Math.max(0, Math.floor((Date.now() - new Date(row.treatment_completion_date).getTime()) / (1000 * 60 * 60 * 24)));
          return completionAgeDays >= benchmark.days;
        });

        const totalClients = eligibleRows.length;
        const soberCount = eligibleRows.filter((row) => row.sobriety_days >= benchmark.days && !row.had_reset).length;
        const familyEngagedCount = eligibleRows.filter((row) => row.family_engaged).length;
        const directSupportCount = eligibleRows.filter((row) => row.direct_support_engaged).length;
        const coachingEngagedCount = eligibleRows.filter((row) => row.coaching_engaged).length;
        const coachingSessionCount = eligibleRows.reduce((sum, row) => sum + (row.coaching_session_count || 0), 0);
        const aftercareAdherentCount = eligibleRows.filter((row) => row.aftercare_adherent).length;
        const avgSupportiveCommunication = totalClients > 0
          ? Math.round(eligibleRows.reduce((sum, row) => sum + (row.supportive_communication_score || 0), 0) / totalClients)
          : 0;
        const avgConcerningCommunication = totalClients > 0
          ? Math.round(eligibleRows.reduce((sum, row) => sum + (row.concerning_communication_score || 0), 0) / totalClients)
          : 0;
        const supportiveValenceCount = eligibleRows.filter((row) => row.communication_valence === "supportive").length;
        const mixedValenceCount = eligibleRows.filter((row) => row.communication_valence === "mixed").length;
        const strainedValenceCount = eligibleRows.filter((row) => row.communication_valence === "strained").length;
        const destabilizingValenceCount = eligibleRows.filter((row) => row.communication_valence === "destabilizing").length;

        return {
          key: benchmark.key,
          label: benchmark.label,
          days: benchmark.days,
          total_clients: totalClients,
          sober_count: soberCount,
          sober_percent: totalClients > 0 ? Math.round((soberCount / totalClients) * 100) : 0,
          family_engaged_count: familyEngagedCount,
          family_engaged_percent: totalClients > 0 ? Math.round((familyEngagedCount / totalClients) * 100) : 0,
          direct_support_count: directSupportCount,
          direct_support_percent: totalClients > 0 ? Math.round((directSupportCount / totalClients) * 100) : 0,
          avg_supportive_communication_score: avgSupportiveCommunication,
          avg_concerning_communication_score: avgConcerningCommunication,
          coaching_engaged_count: coachingEngagedCount,
          coaching_engaged_percent: totalClients > 0 ? Math.round((coachingEngagedCount / totalClients) * 100) : 0,
          coaching_session_count: coachingSessionCount,
          supportive_valence_count: supportiveValenceCount,
          mixed_valence_count: mixedValenceCount,
          strained_valence_count: strainedValenceCount,
          destabilizing_valence_count: destabilizingValenceCount,
          aftercare_adherent_count: aftercareAdherentCount,
          aftercare_adherent_percent: totalClients > 0 ? Math.round((aftercareAdherentCount / totalClients) * 100) : 0,
        };
      });
    };

    const communicationAnalysisByFamily = new Map<string, any>();
    for (const familyId of Array.from(new Set(recoveringMembers.map((member) => member.family_id)))) {
      const familyMessages = recentMessages.filter((message) => message.family_id === familyId);
      const { analyzeFamilyCommunicationBatch } = await import("../_shared/family-engagement-analysis.ts");
      const analysis = await analyzeFamilyCommunicationBatch(familyMessages);
      communicationAnalysisByFamily.set(familyId, analysis);
    }

    const coachingSessionsByFamily = new Map<string, any[]>();
    (coachingSessions || []).forEach((session) => {
      const existing = coachingSessionsByFamily.get(session.family_id) || [];
      existing.push(session);
      coachingSessionsByFamily.set(session.family_id, existing);
    });

    const outcomesByOrganization = new Map<string, any>();

    (orgData || []).forEach((org) => {
      const orgFamilyIds = (familyActivity || [])
        .filter((family) => family.organization_id === org.id)
        .map((family) => family.id);
      const orgFamilyIdSet = new Set(orgFamilyIds);
      const orgRecoveringMembers = recoveringMembers.filter((member) => orgFamilyIdSet.has(member.family_id));
      const orgUserIds = Array.from(new Set(orgRecoveringMembers.map((member) => member.user_id)));
      const orgJourneys = activeJourneys.filter((journey) => orgFamilyIdSet.has(journey.family_id));
      const orgStableJourneys = orgJourneys.filter((journey) => (journey.reset_count || 0) === 0);
      const orgResetJourneys = orgJourneys.filter((journey) => (journey.reset_count || 0) > 0);
      const orgCurrentPhases = currentPhases.filter((phase) => orgFamilyIdSet.has(phase.family_id));
      const orgCompletedHandoffs = completedHandoffs.filter((handoff) => handoff.from_organization_id === org.id || handoff.to_organization_id === org.id);
      const orgInitiatedHandoffs = providerHandoffs.filter((handoff) => handoff.from_organization_id === org.id).length;
      const orgReceivedHandoffs = providerHandoffs.filter((handoff) => handoff.to_organization_id === org.id).length;

      let orgProgressedUsers = 0;
      let orgRegressedUsers = 0;
      orgUserIds.forEach((userId) => {
        const userPhases = (phasesByUser.get(userId) || [])
          .filter((phase) => orgFamilyIdSet.has(phase.family_id))
          .slice()
          .sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime());

        let movedForward = false;
        let movedBackward = false;
        for (let i = 1; i < userPhases.length; i += 1) {
          const previousRank = progressionRank[userPhases[i - 1].phase_type] ?? -1;
          const currentRank = progressionRank[userPhases[i].phase_type] ?? -1;
          if (currentRank > previousRank) movedForward = true;
          if (currentRank < previousRank) movedBackward = true;
        }
        if (movedForward && !movedBackward) orgProgressedUsers += 1;
        if (movedBackward) orgRegressedUsers += 1;
      });

      const orgClientCount = orgUserIds.length;
      const orgCompletionRate = orgClientCount > 0
        ? Math.round((orgCurrentPhases.filter((phase) => phase.phase_type === "independent").length / orgClientCount) * 100)
        : 0;
      const orgStabilityRate = orgClientCount > 0
        ? Math.round((orgStableJourneys.length / orgClientCount) * 100)
        : 0;
      const orgResetRate = orgClientCount > 0
        ? Math.round((orgResetJourneys.length / orgClientCount) * 100)
        : 0;
      const orgProgressionRate = orgClientCount > 0
        ? Math.round((orgProgressedUsers / orgClientCount) * 100)
        : 0;
      const orgRegressionRate = orgClientCount > 0
        ? Math.round((orgRegressedUsers / orgClientCount) * 100)
        : 0;

      const orgBenchmarkRows = orgRecoveringMembers.map((member) => {
        const journey = activeJourneys.find((item) => item.user_id === member.user_id && item.family_id === member.family_id);
        const treatmentCompletionPhase = (phasesByUser.get(member.user_id) || [])
          .filter((phase) => phase.family_id === member.family_id && phase.ended_at)
          .slice()
          .sort((a, b) => new Date(b.ended_at).getTime() - new Date(a.ended_at).getTime())[0] || null;
        const treatmentCompletionDate = treatmentCompletionPhase?.ended_at || null;
        const sobrietyDays = journey?.start_date
          ? Math.max(0, Math.floor((Date.now() - new Date(journey.start_date).getTime()) / (1000 * 60 * 60 * 24)))
          : 0;
        const aiCommunication = communicationAnalysisByFamily.get(member.family_id) || {
          supportive_score: 0,
          criticism_score: 0,
          enabling_score: 0,
          emotional_regulation_score: 0,
          boundary_consistency_score: 0,
          recovery_alignment_score: 0,
          communication_valence: "mixed",
          signals: [],
          summary: "",
        };
        const directSupportEngaged = (directFamilySupportCountByFamily.get(member.family_id) || 0) > 0;
        const familyCoachingSessions = coachingSessionsByFamily.get(member.family_id) || [];
        const coachingEngaged = familyCoachingSessions.length > 0;
        const familyEngaged = directSupportEngaged || coachingEngaged || (recentMessageCountByFamily.get(member.family_id) ?? 0) > 0;
        const supportiveScore = aiCommunication.supportive_score;
        const concerningScore = Math.max(aiCommunication.criticism_score || 0, aiCommunication.enabling_score || 0);
        const communicationValence = aiCommunication.communication_valence;
        const aftercarePlan = aftercarePlanByUserFamily.get(`${member.family_id}:${member.user_id}`);
        const planRecommendations = aftercarePlan ? (recommendationsByPlan.get(aftercarePlan.id) || []) : [];
        const completedRecommendations = planRecommendations.filter((recommendation) => recommendation.is_completed).length;
        const aftercareAdherent = planRecommendations.length > 0
          ? completedRecommendations / planRecommendations.length >= 0.7
          : false;

        return {
          family_id: member.family_id,
          user_id: member.user_id,
          organization_id: org.id,
          treatment_completion_date: treatmentCompletionDate,
          sobriety_days: sobrietyDays,
          had_reset: (journey?.reset_count || 0) > 0,
          family_engaged: familyEngaged,
          direct_support_engaged: directSupportEngaged,
          coaching_engaged: coachingEngaged,
          coaching_session_count: familyCoachingSessions.length,
          supportive_communication_score: supportiveScore,
          concerning_communication_score: concerningScore,
          communication_valence: communicationValence,
          aftercare_adherent: aftercareAdherent,
        };
      });

      const explicitScore = scoreByOrganization.get(org.id)?.score ?? null;
      const computedScoreRaw = ((orgStabilityRate / 100) * 2.5)
        + ((orgProgressionRate / 100) * 2.5)
        + (((100 - orgRegressionRate) / 100) * 2.0)
        + (((100 - orgResetRate) / 100) * 1.5)
        + ((orgCompletionRate / 100) * 1.5);
      const computedScore = orgClientCount > 0
        ? Math.max(1, Math.min(10, Math.round(computedScoreRaw * 10) / 10))
        : 0;

      outcomesByOrganization.set(org.id, {
        organization_id: org.id,
        organization_name: org.name,
        family_count: orgFamilyIds.length,
        client_count: orgClientCount,
        active_recovering_count: orgClientCount,
        sobriety_stability_rate: orgStabilityRate,
        progression_rate: orgProgressionRate,
        regression_rate: orgRegressionRate,
        reset_rate: orgResetRate,
        completion_rate: orgCompletionRate,
        avg_days_in_care: orgRecoveringMembers.length > 0
          ? Math.round(orgRecoveringMembers.reduce((sum, member) => {
              const joined = member.joined_at ? new Date(member.joined_at).getTime() : Date.now();
              const diffDays = Math.max(0, Math.floor((Date.now() - joined) / (1000 * 60 * 60 * 24)));
              return sum + diffDays;
            }, 0) / orgRecoveringMembers.length)
          : 0,
        total_handoffs: orgCompletedHandoffs.length,
        handoffs_initiated: orgInitiatedHandoffs,
        handoffs_received: orgReceivedHandoffs,
        handoffs_completed: orgCompletedHandoffs.length,
        success_score: explicitScore ?? computedScore,
        score_trend: scoreByOrganization.get(org.id)?.trend ?? "stable",
        critical_alert_count: alertsByOrganization.get(org.id)?.critical || 0,
        warning_alert_count: alertsByOrganization.get(org.id)?.warning || 0,
        benchmark_opt_in: (org as any).benchmark_opt_in ?? false,
        provider_category: (org as any).provider_category ?? null,
        levels_of_care: (org as any).levels_of_care ?? [],
        benchmark_timelines: buildBenchmarkSummary(orgBenchmarkRows),
      });
    });

    const familyOutcomeRows = recoveringMembers.map((member) => {
      const family = familiesById.get(member.family_id);
      const journey = activeJourneys.find((item) => item.user_id === member.user_id && item.family_id === member.family_id);
      const userCurrentPhase = currentPhaseByUser.get(member.user_id);
      const orgId = family?.organization_id || null;
      const org = orgId ? organizationsById.get(orgId) : null;
      const userPhases = (phasesByUser.get(member.user_id) || [])
        .filter((phase) => phase.family_id === member.family_id)
        .slice()
        .sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime());

      let movedForward = false;
      let movedBackward = false;
      for (let i = 1; i < userPhases.length; i += 1) {
        const previousRank = progressionRank[userPhases[i - 1].phase_type] ?? -1;
        const currentRank = progressionRank[userPhases[i].phase_type] ?? -1;
        if (currentRank > previousRank) movedForward = true;
        if (currentRank < previousRank) movedBackward = true;
      }

      const sobrietyDays = journey?.start_date
        ? Math.max(0, Math.floor((Date.now() - new Date(journey.start_date).getTime()) / (1000 * 60 * 60 * 24)))
        : 0;
      const daysInCare = member.joined_at
        ? Math.max(0, Math.floor((Date.now() - new Date(member.joined_at).getTime()) / (1000 * 60 * 60 * 24)))
        : 0;

      const treatmentCompletionPhase = userPhases
        .filter((phase) => phase.ended_at)
        .slice()
        .sort((a, b) => new Date(b.ended_at).getTime() - new Date(a.ended_at).getTime())[0] || null;
      const treatmentCompletionDate = treatmentCompletionPhase?.ended_at || null;
      const aiCommunication = communicationAnalysisByFamily.get(member.family_id) || {
        supportive_score: 0,
        criticism_score: 0,
        enabling_score: 0,
        emotional_regulation_score: 0,
        boundary_consistency_score: 0,
        recovery_alignment_score: 0,
        communication_valence: "mixed",
      };
      const directSupportEngaged = (directFamilySupportCountByFamily.get(member.family_id) || 0) > 0;
      const familyCoachingSessions = coachingSessionsByFamily.get(member.family_id) || [];
      const coachingEngaged = familyCoachingSessions.length > 0;
      const familyEngaged = directSupportEngaged || coachingEngaged || (recentMessageCountByFamily.get(member.family_id) ?? 0) > 0;
      const supportiveScore = aiCommunication.supportive_score;
      const concerningScore = Math.max(aiCommunication.criticism_score || 0, aiCommunication.enabling_score || 0);
      const communicationValence = aiCommunication.communication_valence;
      const aftercarePlan = aftercarePlanByUserFamily.get(`${member.family_id}:${member.user_id}`);
      const planRecommendations = aftercarePlan ? (recommendationsByPlan.get(aftercarePlan.id) || []) : [];
      const completedRecommendations = planRecommendations.filter((recommendation) => recommendation.is_completed).length;
      const aftercareAdherent = planRecommendations.length > 0
        ? completedRecommendations / planRecommendations.length >= 0.7
        : false;

      return {
        family_id: member.family_id,
        family_name: family?.name || "Unknown family",
        organization_id: orgId,
        organization_name: org?.name || null,
        user_id: member.user_id,
        current_phase: userCurrentPhase?.phase_type || null,
        sobriety_days: sobrietyDays,
        reset_count: journey?.reset_count || 0,
        had_reset: (journey?.reset_count || 0) > 0,
        moved_forward: movedForward,
        moved_backward: movedBackward,
        days_in_care: daysInCare,
        was_handed_off: providerHandoffs.some((handoff) => handoff.user_id === member.user_id && handoff.family_id === member.family_id && handoff.status === "completed"),
        treatment_completion_date: treatmentCompletionDate,
        family_engaged: familyEngaged,
        direct_support_engaged: directSupportEngaged,
        coaching_engaged: coachingEngaged,
        coaching_session_count: familyCoachingSessions.length,
        supportive_communication_score: supportiveScore,
        concerning_communication_score: concerningScore,
        communication_valence: communicationValence,
        aftercare_adherent: aftercareAdherent,
      };
    });

    const globalOutcomes = {
      total_recovering_members: totalRecoveringMembers,
      active_recovering_members: activeJourneys.length,
      providers_with_outcome_tracking: (orgData || []).filter((org: any) => org.outcome_tracking_enabled).length,
      providers_opted_into_benchmarks: (orgData || []).filter((org: any) => org.benchmark_opt_in).length,
      total_completed_handoffs: completedHandoffs.length,
      critical_alert_count: activeCriticalAlerts.length,
      warning_alert_count: activeWarningAlerts.length,
      sobriety_stability_rate: sobrietyStabilityRate,
      progression_rate: progressionRate,
      regression_rate: regressionRate,
      reset_rate: resetRate,
      completion_rate: completionRate,
      avg_days_in_care: averageDaysInCare,
      benchmark_timelines: buildBenchmarkSummary(familyOutcomeRows),
    };

    return new Response(
      JSON.stringify({
        overview: {
          total_families: familiesResult.count || 0,
          total_organizations: organizationsResult.count || 0,
          total_users: profilesResult.count || 0,
          total_messages: messagesResult.count || 0,
          messages_this_week: messagesWeekResult.count || 0,
          messages_this_month: messagesMonthResult.count || 0,
          total_checkins: checkinsResult.count || 0,
          checkins_this_week: checkinsWeekResult.count || 0,
          total_financial_requests: financialRequestsResult.count || 0,
          financial_requests_this_month: financialRequestsMonthResult.count || 0,
        },
        families: familiesWithActivity,
        organizations: organizationsWithStats,
        users: usersWithStats,
        outcomes: {
          overview: globalOutcomes,
          organizations: Array.from(outcomesByOrganization.values()).sort((a, b) => (b.success_score || 0) - (a.success_score || 0)),
          families: familyOutcomeRows,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
