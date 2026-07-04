import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { isInternalRequest, forbiddenResponse } from "../_shared/internal-auth.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (!isInternalRequest(req)) {
    return forbiddenResponse(corsHeaders);
  }

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const windowDays = Number(body?.window_days || 90);
    const limit = Math.min(100, Math.max(1, Number(body?.limit || 25)));

    const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

    const [recentCoachingRes, recentFeedbackRes, recentModeratorRes] = await Promise.all([
      supabase
        .from("coaching_sessions")
        .select("family_id, started_at")
        .gte("started_at", since)
        .order("started_at", { ascending: false })
        .limit(500),
      supabase
        .from("fiis_analysis_feedback")
        .select("family_id, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("fiis_moderator_sessions")
        .select("family_id, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(500),
    ]);

    const familyIds = new Set<string>();
    (recentCoachingRes.data || []).forEach((row: any) => row.family_id && familyIds.add(row.family_id));
    (recentFeedbackRes.data || []).forEach((row: any) => row.family_id && familyIds.add(row.family_id));
    (recentModeratorRes.data || []).forEach((row: any) => row.family_id && familyIds.add(row.family_id));

    const orderedFamilyIds = [...familyIds].slice(0, limit);
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const results: Array<{ family_id: string; success: boolean; error?: string }> = [];

    for (const familyId of orderedFamilyIds) {
      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/calculate-fiis-learning`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${serviceKey}`,
            apikey: anonKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ family_id: familyId, window_days: windowDays }),
        });

        if (!response.ok) {
          const text = await response.text();
          results.push({ family_id: familyId, success: false, error: text.slice(0, 500) });
          continue;
        }

        results.push({ family_id: familyId, success: true });
      } catch (error) {
        results.push({ family_id: familyId, success: false, error: (error as Error).message });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      processed: results.length,
      refreshed: results.filter((item) => item.success).length,
      failed: results.filter((item) => !item.success).length,
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("refresh-fiis-learning error", error);
    return new Response(JSON.stringify({ error: (error as Error).message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
