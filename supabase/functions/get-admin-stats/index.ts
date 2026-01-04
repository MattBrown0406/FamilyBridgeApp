import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    ]);

    // Get activity by family (last 30 days)
    const { data: familyActivity } = await adminClient
      .from("families")
      .select(`
        id,
        name,
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
