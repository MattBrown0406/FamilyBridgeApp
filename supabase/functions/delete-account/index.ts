import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const removeStorageObjects = async (
  adminClient: ReturnType<typeof createClient>,
  bucket: string,
  paths: string[],
) => {
  const uniquePaths = [...new Set(paths.filter(Boolean))];
  if (uniquePaths.length === 0) return;

  const { error } = await adminClient.storage.from(bucket).remove(uniquePaths);
  if (error) {
    console.warn(`Storage cleanup failed for ${bucket}:`, error.message);
  }
};

const pathFromPublicUrl = (value: string | null, bucket: string) => {
  if (!value) return null;

  const marker = `/${bucket}/`;
  const markerIndex = value.indexOf(marker);
  if (markerIndex >= 0) {
    return decodeURIComponent(value.slice(markerIndex + marker.length));
  }

  const prefixedMarker = `${bucket}/`;
  const prefixedIndex = value.indexOf(prefixedMarker);
  if (prefixedIndex >= 0) {
    return decodeURIComponent(value.slice(prefixedIndex + prefixedMarker.length));
  }

  return null;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      return jsonResponse({ error: "Server configuration is incomplete" }, 500);
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const userId = user.id;

    const [{ data: familyDocs }, { data: providerDocs }, { data: medications }, { data: financialRequests }] =
      await Promise.all([
        adminClient.from("family_documents").select("file_path").eq("uploaded_by", userId),
        adminClient.from("provider_documents").select("file_path").eq("uploaded_by", userId),
        adminClient
          .from("medications")
          .select("label_image_url, label_image_urls")
          .or(`user_id.eq.${userId},created_by.eq.${userId}`),
        adminClient
          .from("financial_requests")
          .select("attachment_url")
          .or(
            `requester_id.eq.${userId},paid_by_user_id.eq.${userId},payment_confirmed_by_user_id.eq.${userId}`,
          ),
      ]);

    await removeStorageObjects(
      adminClient,
      "family-documents",
      (familyDocs ?? []).map((doc) => doc.file_path),
    );
    await removeStorageObjects(
      adminClient,
      "provider-documents",
      (providerDocs ?? []).map((doc) => doc.file_path),
    );
    await removeStorageObjects(
      adminClient,
      "medication-labels",
      (medications ?? []).flatMap((medication) => {
        const urls = [
          medication.label_image_url,
          ...((medication.label_image_urls as string[] | null) ?? []),
        ];
        return urls.map((url) => pathFromPublicUrl(url, "medication-labels")).filter(Boolean) as string[];
      }),
    );
    await removeStorageObjects(
      adminClient,
      "bill-attachments",
      (financialRequests ?? [])
        .map((request) => pathFromPublicUrl(request.attachment_url, "bill-attachments"))
        .filter(Boolean) as string[],
    );

    const deleteWhere = async (table: string, column: string) => {
      const { error } = await adminClient.from(table).delete().eq(column, userId);
      if (error) {
        console.warn(`Account deletion cleanup skipped ${table}.${column}:`, error.message);
      }
    };

    const updateWhere = async (table: string, column: string, values: Record<string, unknown>) => {
      const { error } = await adminClient.from(table).update(values).eq(column, userId);
      if (error) {
        console.warn(`Account deletion update skipped ${table}.${column}:`, error.message);
      }
    };

    await Promise.all([
      deleteWhere("accountability_alerts", "user_id"),
      deleteWhere("accountability_commitments", "created_by"),
      deleteWhere("aftercare_event_participants", "user_id"),
      updateWhere("activation_codes", "used_by", { used_by: null }),
      deleteWhere("boundary_acknowledgments", "user_id"),
      deleteWhere("coaching_sessions", "user_id"),
      updateWhere("coaching_sessions", "talking_to_user_id", { talking_to_user_id: null }),
      updateWhere("coaching_screenshots", "talking_to_user_id", { talking_to_user_id: null }),
      deleteWhere("conversation_channels", "created_by"),
      deleteWhere("conversation_participants", "user_id"),
      deleteWhere("conversation_messages", "sender_id"),
      deleteWhere("family_common_goals", "selected_by"),
      deleteWhere("family_documents", "uploaded_by"),
      deleteWhere("family_goals", "created_by"),
      deleteWhere("family_members", "user_id"),
      deleteWhere("family_values", "selected_by"),
      deleteWhere("financial_pledges", "user_id"),
      deleteWhere("financial_transactions", "payer_user_id"),
      deleteWhere("financial_transactions", "requester_user_id"),
      deleteWhere("financial_votes", "voter_id"),
      deleteWhere("intervention_notes", "created_by"),
      deleteWhere("location_checkin_requests", "requester_id"),
      deleteWhere("location_checkin_requests", "target_user_id"),
      deleteWhere("meeting_checkins", "user_id"),
      deleteWhere("medication_alerts", "user_id"),
      deleteWhere("medication_alerts", "acknowledged_by"),
      deleteWhere("medication_inventory_events", "user_id"),
      deleteWhere("messages", "sender_id"),
      deleteWhere("notifications", "user_id"),
      deleteWhere("organization_members", "user_id"),
      deleteWhere("paid_moderator_requests", "requested_by"),
      deleteWhere("paid_moderator_requests", "assigned_moderator_id"),
      deleteWhere("payment_failures", "user_id"),
      deleteWhere("payment_info", "user_id"),
      deleteWhere("payment_transactions", "payment_info_user_id"),
      deleteWhere("private_messages", "sender_id"),
      deleteWhere("private_messages", "recipient_id"),
      deleteWhere("provider_documents", "uploaded_by"),
      deleteWhere("push_subscriptions", "user_id"),
      deleteWhere("security_audit_log", "user_id"),
      deleteWhere("sensitive_access_tokens", "user_id"),
      deleteWhere("subscriptions", "user_id"),
      deleteWhere("temporary_moderator_requests", "requested_by"),
      deleteWhere("temporary_moderator_requests", "assigned_moderator_id"),
      deleteWhere("user_consent_records", "user_id"),
      deleteWhere("user_feedback", "user_id"),
      updateWhere("family_boundaries", "created_by", { created_by: null }),
      updateWhere("families", "created_by", { created_by: null }),
      updateWhere("moderator_assignments", "assigned_moderator_id", { assigned_moderator_id: null }),
      updateWhere("organizations", "created_by", { created_by: null }),
      updateWhere("provider_notes", "created_by", { created_by: null }),
      updateWhere("transition_summaries", "created_by", { created_by: null }),
    ]);

    await Promise.all([
      deleteWhere("financial_requests", "requester_id"),
      updateWhere("financial_requests", "paid_by_user_id", { paid_by_user_id: null }),
      updateWhere("financial_requests", "payment_confirmed_by_user_id", { payment_confirmed_by_user_id: null }),
      deleteWhere("medications", "created_by"),
      deleteWhere("medications", "user_id"),
    ]);

    const { error: profileError } = await adminClient.from("profiles").delete().eq("id", userId);
    if (profileError) {
      console.warn("Profile cleanup skipped:", profileError.message);
    }

    const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteUserError) {
      console.error("Auth user deletion failed:", deleteUserError);
      return jsonResponse({ error: "Failed to delete account" }, 500);
    }

    return jsonResponse({ success: true });
  } catch (error) {
    console.error("delete-account failed:", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
