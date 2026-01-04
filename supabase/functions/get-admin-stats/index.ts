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

    // Get organization names for families
    const { data: orgs } = await adminClient
      .from("organizations")
      .select("id, name");

    const orgMap: Record<string, string> = {};
    (orgs || []).forEach(o => {
      orgMap[o.id] = o.name;
    });

    // Combine family data with activity
    const familiesWithActivity = (familyActivity || []).map(f => ({
      id: f.id,
      name: f.name,
      account_number: f.account_number,
      organization_name: f.organization_id ? orgMap[f.organization_id] || null : null,
      created_at: f.created_at,
      messages_last_30_days: familyMessageCounts[f.id] || 0,
      checkins_last_30_days: familyCheckinCounts[f.id] || 0,
      total_activity: (familyMessageCounts[f.id] || 0) + (familyCheckinCounts[f.id] || 0),
    }));

    // Sort by activity (most active first)
    familiesWithActivity.sort((a, b) => b.total_activity - a.total_activity);

    // Get organization stats
    const { data: orgData } = await adminClient
      .from("organizations")
      .select("id, name, subdomain, created_at");

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
    }));

    // Get family memberships count per user
    const { data: familyMemberships } = await adminClient
      .from("family_members")
      .select("user_id");

    const userFamilyCounts: Record<string, number> = {};
    (familyMemberships || []).forEach(m => {
      userFamilyCounts[m.user_id] = (userFamilyCounts[m.user_id] || 0) + 1;
    });

    const usersWithStats = (usersListResult.data || []).map(u => ({
      id: u.id,
      full_name: u.full_name,
      avatar_url: u.avatar_url,
      created_at: u.created_at,
      family_count: userFamilyCounts[u.id] || 0,
    }));

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
