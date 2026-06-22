import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

export type SpineEventName =
  | "assessment_completed"
  | "session_booked"
  | "payment"
  | "contract_sent"
  | "contract_signed"
  | "cart_abandoned"
  | "lead_captured"
  | "checklist_downloaded";

export interface SpinePayment {
  id?: string;
  processor: string;
  amount_cents: number;
  kind: string;
}

export interface SpinePayload {
  email?: string | null;
  phone?: string | null;
  name?: string | null;
  property: "familybridge";
  props?: Record<string, unknown>;
  payment?: SpinePayment;
}

let cachedClient: SupabaseClient | null = null;
function getServiceClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return null;
  cachedClient = createClient(url, key);
  return cachedClient;
}

export async function enqueueSpineEvent(
  event_name: SpineEventName,
  payload: Omit<SpinePayload, "property"> & { property?: "familybridge" },
  client?: SupabaseClient,
): Promise<boolean> {
  try {
    const supabase = client ?? getServiceClient();
    if (!supabase) {
      console.error("[spine] no supabase client available");
      return false;
    }
    const fullPayload: SpinePayload = { property: "familybridge", ...payload };
    const { error } = await supabase.from("spine_outbox").insert({
      event_name,
      payload: fullPayload,
    });
    if (error) {
      console.error("[spine] enqueue failed:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[spine] enqueue exception:", err instanceof Error ? err.message : err);
    return false;
  }
}