import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { getCorsHeaders } from "../_shared/cors.ts";
import {
  type RevenueCatWebhookEvent,
  secureCompare,
  validateRevenueCatWebhookPayload,
} from "../_shared/revenuecat.ts";

const GUIDANCE_PRODUCT_ID = "com.familybridgeapp.app.crisis_moderation_daily";
const ALLOWED_PRODUCT_IDS = [
  "com.familybridgeapp.app.family_monthly",
  "com.familybridgeapp.app.provider_monthly_v2",
  "com.familybridgeapp.app.provider_quarterly_v2",
  "com.familybridgeapp.app.provider_annual",
  GUIDANCE_PRODUCT_ID,
] as const;

Deno.serve(async (req) => {
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

  const webhookAuthorization = Deno.env.get("REVENUECAT_WEBHOOK_AUTHORIZATION")
    ?.trim();
  const iosAppId = Deno.env.get("REVENUECAT_IOS_APP_ID")?.trim();
  const androidAppId = Deno.env.get("REVENUECAT_ANDROID_APP_ID")?.trim();
  const allowedEnvironments = getAllowedEnvironments(
    Deno.env.get("REVENUECAT_ALLOWED_ENVIRONMENTS"),
  );
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (
    !webhookAuthorization || !iosAppId || !androidAppId ||
    !supabaseUrl || !serviceRoleKey
  ) {
    console.error("RevenueCat webhook environment is incomplete");
    return jsonResponse({ error: "Webhook is not configured" }, 503);
  }

  const providedAuthorization = req.headers.get("Authorization") ?? "";
  if (!secureCompare(providedAuthorization, webhookAuthorization)) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(await req.text());
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  let event: RevenueCatWebhookEvent;
  try {
    event = validateRevenueCatWebhookPayload(
      payload,
      {
        [iosAppId]: "APP_STORE",
        [androidAppId]: "PLAY_STORE",
      },
      ALLOWED_PRODUCT_IDS,
      allowedEnvironments,
    );
  } catch (error) {
    console.warn(
      "Rejected RevenueCat webhook:",
      error instanceof Error ? error.message : "invalid event",
    );
    return jsonResponse({ error: "Invalid RevenueCat event" }, 400);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const eventTimestamp = new Date(event.event_timestamp_ms).toISOString();
  const transactionId = event.transaction_id ?? event.original_transaction_id;
  const eventRecord = {
    event_id: event.id,
    event_type: event.type,
    app_id: event.app_id,
    app_user_id: event.app_user_id,
    product_id: event.product_id,
    transaction_id: transactionId,
    environment: event.environment,
    store: event.store,
    event_timestamp: eventTimestamp,
    processing_status: "processing",
    details: {
      store: event.store,
      entitlement_ids: event.entitlement_ids,
      cancel_reason: event.cancel_reason,
      original_transaction_id: event.original_transaction_id,
    },
  };

  const { error: insertError } = await supabase.from(
    "revenuecat_webhook_events",
  ).insert(eventRecord);
  if (insertError && insertError.code !== "23505") {
    console.error("Failed to reserve RevenueCat event:", insertError);
    return jsonResponse({ error: "Unable to persist event" }, 500);
  }

  if (insertError?.code === "23505") {
    const { data: existing, error: existingError } = await supabase
      .from("revenuecat_webhook_events")
      .select("processing_status")
      .eq("event_id", event.id)
      .single();
    if (existingError) {
      return jsonResponse({ error: "Unable to read event state" }, 500);
    }
    if (existing.processing_status === "completed") {
      return jsonResponse({ received: true, duplicate: true });
    }
  }

  try {
    if (event.type !== "TEST") {
      const lifecycleStatus = getLifecycleStatus(event);
      const expirationAt = event.expiration_at_ms
        ? new Date(event.expiration_at_ms).toISOString()
        : null;
      const lifecycleKey = event.product_id === GUIDANCE_PRODUCT_ID
        ? transactionId
        : event.product_id;
      if (!lifecycleKey) {
        throw new Error("RevenueCat event is missing a lifecycle key");
      }

      const nativeAction = event.product_id === GUIDANCE_PRODUCT_ID
        ? event.type === "CANCELLATION"
          ? "revoke"
          : event.type === "REFUND_REVERSED"
          ? "restore"
          : "none"
        : "none";

      const { error: lifecycleError } = await supabase.rpc(
        "apply_revenuecat_lifecycle_event",
        {
          p_event_id: event.id,
          p_event_type: event.type,
          p_event_timestamp: eventTimestamp,
          p_app_id: event.app_id,
          p_environment: event.environment,
          p_store: event.store,
          p_app_user_id: event.app_user_id,
          p_product_id: event.product_id,
          p_lifecycle_key: lifecycleKey,
          p_lifecycle_status: lifecycleStatus,
          p_entitlement_ids: event.entitlement_ids,
          p_transaction_id: transactionId,
          p_expiration_at: expirationAt,
          p_native_action: nativeAction,
        },
      );
      if (lifecycleError) throw lifecycleError;
    }

    const { error: completeError } = await supabase
      .from("revenuecat_webhook_events")
      .update({
        processing_status: "completed",
        processed_at: new Date().toISOString(),
        last_error: null,
      })
      .eq("event_id", event.id);
    if (completeError) throw completeError;

    return jsonResponse({ received: true });
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "Lifecycle update failed";
    console.error("RevenueCat webhook processing failed:", message);
    await supabase
      .from("revenuecat_webhook_events")
      .update({
        processing_status: "failed",
        last_error: message.slice(0, 1000),
      })
      .eq("event_id", event.id);
    return jsonResponse({ error: "Webhook processing failed" }, 500);
  }
});

function getAllowedEnvironments(
  configured: string | undefined,
): ("PRODUCTION" | "SANDBOX")[] {
  const values = (configured ?? "PRODUCTION")
    .split(",")
    .map((value) => value.trim().toUpperCase())
    .filter((value): value is "PRODUCTION" | "SANDBOX" =>
      value === "PRODUCTION" || value === "SANDBOX"
    );
  return values.length > 0 ? [...new Set(values)] : ["PRODUCTION"];
}

function getLifecycleStatus(event: RevenueCatWebhookEvent): string {
  switch (event.type) {
    case "CANCELLATION":
      return event.product_id === GUIDANCE_PRODUCT_ID ? "refunded" : "canceled";
    case "EXPIRATION":
      return "expired";
    case "BILLING_ISSUE":
      return "billing_issue";
    case "SUBSCRIPTION_PAUSED":
      return "pause_scheduled";
    case "TRANSFER":
      return "transferred";
    case "PRODUCT_CHANGE":
      return "product_change_pending";
    default:
      return "active";
  }
}
