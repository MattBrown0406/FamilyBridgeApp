import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-sensitive-access-token",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const sensitiveToken = req.headers.get("x-sensitive-access-token");
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!sensitiveToken) {
      return new Response(
        JSON.stringify({ error: "Re-authentication required", code: "REAUTH_REQUIRED" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the user's session
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Validate the sensitive access token
    const { data: tokenData, error: tokenError } = await adminClient
      .from("sensitive_access_tokens")
      .select("*")
      .eq("token", sensitiveToken)
      .eq("user_id", user.id)
      .eq("purpose", "transition_summaries")
      .eq("is_used", false)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (tokenError || !tokenData) {
      // Log failed access attempt
      await adminClient
        .from("security_audit_log")
        .insert({
          user_id: user.id,
          action: "sensitive_access_denied",
          resource_type: "transition_summaries",
          ip_address: req.headers.get("x-forwarded-for") || null,
          details: { reason: "Invalid or expired token" },
        });

      return new Response(
        JSON.stringify({ error: "Re-authentication required", code: "REAUTH_REQUIRED" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark token as used (single-use for additional security)
    await adminClient
      .from("sensitive_access_tokens")
      .update({ is_used: true, used_at: new Date().toISOString() })
      .eq("id", tokenData.id);

    const { familyId, userId } = await req.json();

    if (!familyId) {
      return new Response(
        JSON.stringify({ error: "familyId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user has access to this family
    const { data: membership } = await adminClient
      .from("family_members")
      .select("role")
      .eq("family_id", familyId)
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: orgMembership } = await adminClient
      .rpc("is_managing_org_member", { _family_id: familyId, _user_id: user.id });

    if (!membership && !orgMembership) {
      await adminClient
        .from("security_audit_log")
        .insert({
          user_id: user.id,
          action: "sensitive_access_denied",
          resource_type: "transition_summaries",
          ip_address: req.headers.get("x-forwarded-for") || null,
          details: { reason: "Not a family member", family_id: familyId },
        });

      return new Response(
        JSON.stringify({ error: "Access denied" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Only moderators, admins, or org members can view transition summaries
    const isModerator = membership?.role === "moderator";
    const isAdmin = membership?.role === "admin";
    
    if (!isModerator && !isAdmin && !orgMembership) {
      return new Response(
        JSON.stringify({ error: "Insufficient permissions" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch transition summaries
    let query = adminClient
      .from("transition_summaries")
      .select(`
        id,
        user_id,
        family_id,
        from_phase,
        to_phase,
        from_organization_id,
        to_organization_id,
        sobriety_days_at_transition,
        reset_count_at_transition,
        treatment_progress_summary,
        strengths_identified,
        risk_factors,
        protective_factors,
        medication_notes,
        support_system_notes,
        aftercare_recommendations,
        transition_readiness_score,
        is_shared_with_next_provider,
        created_by,
        created_at
      `)
      .eq("family_id", familyId)
      .order("created_at", { ascending: false });

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data: summaries, error: summariesError } = await query;

    if (summariesError) {
      console.error("Error fetching summaries:", summariesError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch summaries" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log successful access
    await adminClient
      .from("security_audit_log")
      .insert({
        user_id: user.id,
        action: "sensitive_data_accessed",
        resource_type: "transition_summaries",
        ip_address: req.headers.get("x-forwarded-for") || null,
        details: { 
          family_id: familyId, 
          records_accessed: summaries?.length || 0,
          target_user_id: userId || "all",
        },
      });

    return new Response(
      JSON.stringify({ summaries: summaries || [] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in get-transition-summaries:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
