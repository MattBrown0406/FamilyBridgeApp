import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type GetProfilesBody = {
  ids: string[];
};

const RATE_LIMIT_KEY = "profiles_batch";
const RATE_LIMIT_WINDOW_SECONDS = 60;
const RATE_LIMIT_MAX_PER_WINDOW = 30;
const MAX_IDS = 50;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = (await req.json()) as Partial<GetProfilesBody>;
    const ids = Array.isArray(body.ids) ? body.ids.filter(Boolean) : [];

    if (ids.length === 0) {
      return new Response(JSON.stringify({ profiles: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (ids.length > MAX_IDS) {
      return new Response(
        JSON.stringify({ error: `Too many ids (max ${MAX_IDS})` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // --- Rate limit (durable, service-only table) ---
    const windowStart = new Date(Math.floor(Date.now() / (RATE_LIMIT_WINDOW_SECONDS * 1000)) * RATE_LIMIT_WINDOW_SECONDS * 1000)
      .toISOString();

    const { data: rlRow, error: rlError } = await supabase
      .from("api_rate_limits")
      .upsert(
        {
          user_id: user.id,
          key: RATE_LIMIT_KEY,
          window_start: windowStart,
          count: 1,
        },
        { onConflict: "user_id,key,window_start" },
      )
      .select("count")
      .single();

    if (rlError) {
      console.error("Rate limit upsert error:", rlError);
    }

    // If existing row, count won't auto-increment via upsert. Increment explicitly.
    let currentCount = rlRow?.count ?? 1;
    if (rlRow) {
      const { data: incRow } = await supabase
        .from("api_rate_limits")
        .update({ count: (rlRow.count ?? 0) + 1 })
        .eq("user_id", user.id)
        .eq("key", RATE_LIMIT_KEY)
        .eq("window_start", windowStart)
        .select("count")
        .single();

      currentCount = incRow?.count ?? currentCount;
    }

    if (currentCount > RATE_LIMIT_MAX_PER_WINDOW) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // --- Authorization: compute allowed user ids for this requester ---
    // Families the user belongs to
    const { data: myFamilies } = await supabase
      .from("family_members")
      .select("family_id")
      .eq("user_id", user.id);

    const myFamilyIds = (myFamilies ?? []).map((r) => r.family_id);

    // Families the user moderates (temp + paid)
    const nowIso = new Date().toISOString();

    const { data: tempFamilies } = await supabase
      .from("temporary_moderator_requests")
      .select("family_id")
      .eq("assigned_moderator_id", user.id)
      .eq("status", "active")
      .gt("expires_at", nowIso);

    const { data: paidFamilies } = await supabase
      .from("paid_moderator_requests")
      .select("family_id")
      .eq("assigned_moderator_id", user.id)
      .eq("status", "active");

    const moderatedFamilyIds = new Set<string>([
      ...(tempFamilies ?? []).map((r) => r.family_id),
      ...(paidFamilies ?? []).map((r) => r.family_id),
    ]);

    // Organization colleagues
    const { data: myOrgs } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id);

    const myOrgIds = (myOrgs ?? []).map((r) => r.organization_id);

    const allowedUserIds = new Set<string>();
    allowedUserIds.add(user.id);

    if (myFamilyIds.length > 0 || moderatedFamilyIds.size > 0) {
      const familyIdsForLookup = Array.from(new Set([...myFamilyIds, ...Array.from(moderatedFamilyIds)]));
      const { data: familyUsers } = await supabase
        .from("family_members")
        .select("user_id")
        .in("family_id", familyIdsForLookup);

      (familyUsers ?? []).forEach((r) => allowedUserIds.add(r.user_id));
    }

    if (myOrgIds.length > 0) {
      const { data: orgUsers } = await supabase
        .from("organization_members")
        .select("user_id")
        .in("organization_id", myOrgIds);

      (orgUsers ?? []).forEach((r) => allowedUserIds.add(r.user_id));
    }

    const filteredIds = ids.filter((id) => allowedUserIds.has(id));

    if (filteredIds.length === 0) {
      return new Response(JSON.stringify({ profiles: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only return minimum fields needed for UI
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", filteredIds);

    if (profilesError) {
      console.error("Profiles fetch error:", profilesError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch profiles" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ profiles: profiles ?? [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("get-profiles error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
