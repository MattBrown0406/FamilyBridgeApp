/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type RelationshipType = 
  | 'recovering'
  | 'parent'
  | 'spouse_partner'
  | 'sibling'
  | 'child'
  | 'grandparent'
  | 'aunt_uncle'
  | 'cousin'
  | 'friend'
  | 'other';

type JoinFamilyBody = {
  inviteCode?: string;
  relationshipType?: RelationshipType;
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
    const relationshipType = body.relationshipType;

    if (!inviteCode || inviteCode.length > 32) {
      return new Response(JSON.stringify({ error: "Invalid invite code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validRelationships: RelationshipType[] = [
      'recovering', 'parent', 'spouse_partner', 'sibling', 'child',
      'grandparent', 'aunt_uncle', 'cousin', 'friend', 'other'
    ];

    if (!relationshipType || !validRelationships.includes(relationshipType)) {
      return new Response(JSON.stringify({ error: "Relationship type is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;

    // First try to find family by invite_code in families table
    let family: { id: string; name: string } | null = null;
    
    const { data: familyDirect, error: familyDirectError } = await supabaseAdmin
      .from("families")
      .select("id, name")
      .eq("invite_code", inviteCode)
      .maybeSingle();

    if (familyDirectError) {
      console.log("families lookup error", familyDirectError);
      return new Response(JSON.stringify({ error: familyDirectError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (familyDirect) {
      family = familyDirect;
    } else {
      // Try to find in family_invite_codes table
      const { data: inviteCodeData, error: inviteCodeError } = await supabaseAdmin
        .from("family_invite_codes")
        .select("family_id, families!inner(id, name)")
        .eq("invite_code", inviteCode)
        .maybeSingle();

      if (inviteCodeError) {
        console.log("family_invite_codes lookup error", inviteCodeError);
        return new Response(JSON.stringify({ error: inviteCodeError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (inviteCodeData && inviteCodeData.families) {
        const familyData = inviteCodeData.families as unknown as { id: string; name: string };
        family = { id: familyData.id, name: familyData.name };
      }
    }

    if (!family) {
      console.log("No family found for invite code:", inviteCode);
      return new Response(JSON.stringify({ error: "Invalid invite code" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    console.log("Found family:", family.name, "for invite code:", inviteCode);

    // Check if this is a provider-created family (has organization_id)
    const { data: familyDetails, error: familyDetailsError } = await supabaseAdmin
      .from("families")
      .select("organization_id")
      .eq("id", family.id)
      .single();

    if (familyDetailsError) {
      console.log("Error fetching family details", familyDetailsError);
    }

    const requiresHipaaRelease = !!(familyDetails?.organization_id);

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

    // If user is 'recovering', set role to 'recovering', otherwise 'member'
    const memberRole = relationshipType === 'recovering' ? 'recovering' : 'member';

    const { error: joinError } = await supabaseAdmin
      .from("family_members")
      .insert({ 
        family_id: family.id, 
        user_id: userId, 
        role: memberRole,
        relationship_type: relationshipType 
      });

    if (joinError) {
      console.log("family_members join error", joinError);
      return new Response(JSON.stringify({ error: joinError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ 
      family,
      requiresHipaaRelease,
    }), {
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