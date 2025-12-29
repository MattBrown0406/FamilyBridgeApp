/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type CreateFamilyBody = {
  name?: string;
  description?: string | null;
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

    const body = (await req.json().catch(() => ({}))) as CreateFamilyBody;
    const name = (body.name || "").trim();
    const description = typeof body.description === "string" ? body.description.trim() : null;

    if (!name || name.length > 100) {
      return new Response(JSON.stringify({ error: "Invalid family name" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;

    const { data: family, error: familyError } = await supabaseAdmin
      .from("families")
      .insert({ name, description: description || null, created_by: userId })
      .select("*")
      .single();

    if (familyError) {
      console.log("families insert error", familyError);
      return new Response(JSON.stringify({ error: familyError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: memberError } = await supabaseAdmin
      .from("family_members")
      .insert({ family_id: family.id, user_id: userId, role: "moderator" });

    if (memberError) {
      console.log("family_members insert error", memberError);
      // best-effort rollback
      await supabaseAdmin.from("families").delete().eq("id", family.id);
      return new Response(JSON.stringify({ error: memberError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create invite code in secure table
    const { error: inviteCodeError } = await supabaseAdmin
      .from("family_invite_codes")
      .insert({ family_id: family.id });

    if (inviteCodeError) {
      console.log("family_invite_codes insert error", inviteCodeError);
      // Non-critical - family still works, just no invite code
    }

    return new Response(JSON.stringify({ family }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.log("create-family unexpected error", e);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
