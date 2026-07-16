import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { getCorsHeaders } from "../_shared/cors.ts";
import {
  getLatestRevenueCatNonSubscriptionPurchase,
  getRevenueCatSubscriber,
} from "../_shared/revenuecat.ts";

const CRISIS_MODERATION_PRODUCT_ID =
  "com.familybridgeapp.app.crisis_moderation_daily";
const PURCHASE_LOOKBACK_MS = 24 * 60 * 60 * 1000;
const SAFE_TRANSACTION_ID = /^[A-Za-z0-9._:$@+\-/]{1,255}$/;

type RequestBody = {
  familyId?: unknown;
  productId?: unknown;
  transactionId?: unknown;
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  const jsonResponse = (body: Record<string, unknown>, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Supabase environment is not configured");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: authData, error: authError } = await adminClient.auth.getUser(
      authHeader.slice(7),
    );
    if (authError || !authData.user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    let body: RequestBody;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    const familyId = typeof body.familyId === "string" ? body.familyId : "";
    const transactionId = typeof body.transactionId === "string"
      ? body.transactionId.trim()
      : "";
    if (
      !familyId || body.productId !== CRISIS_MODERATION_PRODUCT_ID ||
      !SAFE_TRANSACTION_ID.test(transactionId)
    ) {
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
      return jsonResponse(
        { error: "User is not a member of this family" },
        403,
      );
    }

    const now = new Date();
    const allowSandbox = Deno.env.get("ALLOW_REVENUECAT_SANDBOX_PURCHASES") === "true";
    const subscriber = await getRevenueCatSubscriber(authData.user.id);
    const purchase = getLatestRevenueCatNonSubscriptionPurchase(
      subscriber,
      CRISIS_MODERATION_PRODUCT_ID,
      new Date(now.getTime() - PURCHASE_LOOKBACK_MS),
      transactionId,
      now,
      allowSandbox,
    );
    if (!purchase?.id || !purchase.purchase_date) {
      return jsonResponse({
        error: "Purchase could not be verified. Please try again shortly.",
      }, 409);
    }

    const purchaseDate = new Date(purchase.purchase_date);
    const store = (purchase.store ?? "").toLowerCase();
    const { data: existing, error: existingError } = await adminClient
      .from("paid_moderator_requests")
      .select("id, family_id, requested_by, expires_at, status, native_refunded_at")
      .eq("native_store_transaction_id", purchase.id)
      .maybeSingle();
    if (existingError) throw existingError;

    if (existing) {
      if (
        existing.family_id !== familyId ||
        existing.requested_by !== authData.user.id
      ) {
        return jsonResponse(
          { error: "This purchase has already been used." },
          409,
        );
      }
      if (!isActiveNativeRequest(existing, now)) {
        return jsonResponse({ error: "This purchase is no longer active." }, 409);
      }
      return jsonResponse({
        success: true,
        requestId: existing.id,
        expiresAt: existing.expires_at,
        idempotent: true,
      });
    }

    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const record = {
      family_id: familyId,
      requested_by: authData.user.id,
      status: "active",
      hours_purchased: 24,
      amount_paid: 399,
      square_order_id: `revenuecat:${purchase.id}`,
      native_store_transaction_id: purchase.id,
      native_store: store,
      native_product_id: CRISIS_MODERATION_PRODUCT_ID,
      native_purchase_at: purchaseDate.toISOString(),
      payment_completed_at: purchaseDate.toISOString(),
      activated_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    };

    const { data: created, error: insertError } = await adminClient
      .from("paid_moderator_requests")
      .insert(record)
      .select("id, expires_at")
      .single();

    if (insertError?.code === "23505") {
      const { data: raced, error: racedError } = await adminClient
        .from("paid_moderator_requests")
        .select("id, family_id, requested_by, expires_at, status, native_refunded_at")
        .eq("native_store_transaction_id", purchase.id)
        .single();
      if (racedError) throw racedError;
      if (
        raced.family_id !== familyId || raced.requested_by !== authData.user.id
      ) {
        return jsonResponse(
          { error: "This purchase has already been used." },
          409,
        );
      }
      if (!isActiveNativeRequest(raced, now)) {
        return jsonResponse({ error: "This purchase is no longer active." }, 409);
      }
      return jsonResponse({
        success: true,
        requestId: raced.id,
        expiresAt: raced.expires_at,
        idempotent: true,
      });
    }
    if (insertError) throw insertError;

    return jsonResponse({
      success: true,
      requestId: created.id,
      expiresAt: created.expires_at,
    });
  } catch (error: unknown) {
    console.error("activate-native-moderator-purchase failed:", error);
    return jsonResponse({ error: "Failed to activate guidance window" }, 500);
  }
});

function isActiveNativeRequest(
  request: { status: string; native_refunded_at: string | null; expires_at: string | null },
  now: Date,
) {
  if (request.status !== "active" || request.native_refunded_at) return false;
  if (!request.expires_at) return false;
  const expiration = new Date(request.expires_at).getTime();
  return Number.isFinite(expiration) && expiration > now.getTime();
}
