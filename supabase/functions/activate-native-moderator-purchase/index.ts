import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


const CRISIS_MODERATION_PRODUCT_ID = "com.familybridgeapp.app.crisis_moderation_daily";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      throw new Error("Supabase environment is not configured");
    }

    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData.user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const { familyId, productId, transactionId, purchaseDate } = await req.json();

    if (!familyId || productId !== CRISIS_MODERATION_PRODUCT_ID) {
      return jsonResponse({ error: "Invalid purchase payload" }, 400);
    }

    const { data: membership, error: membershipError } = await adminClient
      .from("family_members")
      .select("id")
      .eq("family_id", familyId)
      .eq("user_id", authData.user.id)
      .maybeSingle();

    if (membershipError) throw membershipError;
    if (!membership) {
      return jsonResponse({ error: "User is not a member of this family" }, 403);
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const purchaseCompletedAt = purchaseDate ? new Date(purchaseDate) : now;

    const { data: request, error: insertError } = await adminClient
      .from("paid_moderator_requests")
      .insert({
        family_id: familyId,
        requested_by: authData.user.id,
        status: "active",
        hours_purchased: 24,
        amount_paid: 399,
        square_order_id: transactionId ? `appstore:${transactionId}` : null,
        payment_completed_at: purchaseCompletedAt.toISOString(),
        activated_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .select("id, expires_at")
      .single();

    if (insertError) throw insertError;

    return jsonResponse({
      success: true,
      requestId: request.id,
      expiresAt: request.expires_at,
    });
  } catch (error: unknown) {
    console.error("activate-native-moderator-purchase failed:", error);
    const message = error instanceof Error ? error.message : "Failed to activate guidance window";
    return jsonResponse({ error: message }, 500);
  }
});

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
