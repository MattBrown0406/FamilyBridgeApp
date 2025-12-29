/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!url || !serviceKey) {
      console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
      return new Response(JSON.stringify({ error: "Server not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(url, serviceKey);

    const body = await req.json().catch(() => ({}));
    const { request_id } = body;

    if (!request_id) {
      return new Response(JSON.stringify({ error: "Missing request_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Checking expiration for request: ${request_id}`);

    // Check if the request is still pending
    const { data: request, error: fetchError } = await supabaseAdmin
      .from("location_checkin_requests")
      .select("id, status, requested_at")
      .eq("id", request_id)
      .single();

    if (fetchError) {
      console.error("Error fetching request:", fetchError);
      return new Response(JSON.stringify({ error: "Request not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only expire if still pending
    if (request.status !== "pending") {
      console.log(`Request ${request_id} is no longer pending (status: ${request.status})`);
      return new Response(JSON.stringify({ message: "Request already processed", status: request.status }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if 5 minutes have passed
    const requestedAt = new Date(request.requested_at);
    const now = new Date();
    const diffMs = now.getTime() - requestedAt.getTime();
    const diffMinutes = diffMs / (1000 * 60);

    if (diffMinutes < 5) {
      console.log(`Request ${request_id} is only ${diffMinutes.toFixed(2)} minutes old, not expired yet`);
      return new Response(JSON.stringify({ message: "Request not yet expired", minutes_elapsed: diffMinutes }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Expire the request
    const { error: updateError } = await supabaseAdmin
      .from("location_checkin_requests")
      .update({
        status: "expired",
        responded_at: new Date().toISOString(),
      })
      .eq("id", request_id)
      .eq("status", "pending"); // Only update if still pending

    if (updateError) {
      console.error("Error expiring request:", updateError);
      return new Response(JSON.stringify({ error: "Failed to expire request" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Request ${request_id} expired successfully`);
    return new Response(JSON.stringify({ message: "Request expired", request_id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("Unexpected error:", e);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
