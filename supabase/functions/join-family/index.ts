/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type JoinFamilyBody = {
  inviteCode?: string;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) {
      console.log("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
      return new Response(JSON.stringify({ error: "Server not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(url, serviceKey);

    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!jwt) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(jwt);
    if (userErr || !userData?.user) {
      console.log("auth.getUser error", userErr);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json().catch(() => ({}))) as JoinFamilyBody;
    const inviteCode = (body.inviteCode || "").trim().toLowerCase();

    if (!inviteCode || inviteCode.length > 32) {
      return new Response(JSON.stringify({ error: "Invalid invite code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;

    const { data: family, error: familyError } = await supabaseAdmin
      .from("families")
      .select("id, name")
      .eq("invite_code", inviteCode)
      .maybeSingle();

    if (familyError) {
      console.log("families lookup error", familyError);
      return new Response(JSON.stringify({ error: familyError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!family) {
      return new Response(JSON.stringify({ error: "Invalid invite code" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("family_members")
      .select("id")
      .eq("family_id", family.id)
      .eq("user_id", userId)
      .maybeSingle();

    if (existingError) {
      console.log("family_members existing lookup error", existingError);
      return new Response(JSON.stringify({ error: existingError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (existing) {
      return new Response(JSON.stringify({ error: "Already a member" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: joinError } = await supabaseAdmin
      .from("family_members")
      .insert({ family_id: family.id, user_id: userId, role: "member" });

    if (joinError) {
      console.log("family_members join error", joinError);
      return new Response(JSON.stringify({ error: joinError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ family }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.log("join-family unexpected error", e);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
