/// <reference lib="deno.ns" />
import { getCorsHeaders } from "../_shared/cors.ts";
import { isInternalRequest, forbiddenResponse } from "../_shared/internal-auth.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";


serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (!isInternalRequest(req)) {
    return forbiddenResponse(corsHeaders);
  }

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!url || !serviceKey) {
      return new Response(JSON.stringify({ success: false, error: "Server not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(url, serviceKey);

    const { data, error } = await supabase.rpc("expire_pending_location_requests");

    if (error) {
      console.error("Sweep failed:", error);
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const expiredCount = Array.isArray(data) && data[0]?.expired_count != null
      ? Number(data[0].expired_count)
      : 0;

    console.log(`Expired ${expiredCount} pending location request(s)`);

    return new Response(JSON.stringify({ success: true, expiredCount }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Unexpected error:", e);
    return new Response(JSON.stringify({ success: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});