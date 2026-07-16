import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { isInternalRequest, forbiddenResponse } from "../_shared/internal-auth.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


// Tiered escalation SLA (CX improvement 3.2):
//  - crisis:  alert IMMEDIATELY (any run), re-alert every 4h while unresolved, send SMS
//  - concern: alert after 24h in status, re-alert every 24h
//  - tension: alert after 72h in status, re-alert every 72h
// This function is scheduled every 15 minutes (see migration 20260703090000),
// so "immediate" means within ~15 minutes of the status being computed.
const SLA: Record<string, { delayHours: number; realertHours: number; sms: boolean }> = {
  crisis:  { delayHours: 0,  realertHours: 4,  sms: true },
  concern: { delayHours: 24, realertHours: 24, sms: false },
  tension: { delayHours: 72, realertHours: 72, sms: false },
};

interface FamilyHealthRecord {
  family_id: string;
  status: string;
  status_reason: string;
  concerning_status_since: string;
  escalation_alert_sent_at: string | null;
}

interface FamilyMember {
  user_id: string;
  profiles: {
    full_name: string;
  }[] | null;
}

async function sendCrisisSms(familyName: string, hoursInStatus: number, reason: string) {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");
  // Comma-separated E.164 numbers, e.g. "+14582988003,+15415551234"
  const recipients = (Deno.env.get("ESCALATION_SMS_TO") || "")
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean);

  if (!accountSid || !authToken || !twilioPhone || recipients.length === 0) {
    console.log("Crisis SMS skipped: Twilio secrets or ESCALATION_SMS_TO not configured");
    return;
  }

  const bodyText =
    `FamilyBridge CRISIS: "${familyName}" entered crisis status ` +
    `${hoursInStatus < 1 ? "just now" : `${hoursInStatus}h ago`}. ` +
    `${reason ? `Reason: ${reason.slice(0, 200)}` : "Open the moderator dashboard for details."}`;

  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  for (const to of recipients) {
    try {
      const formData = new URLSearchParams();
      formData.append("To", to);
      formData.append("From", twilioPhone);
      formData.append("Body", bodyText);

      const resp = await fetch(twilioUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      const result = await resp.json();
      if (!resp.ok) {
        console.error(`Crisis SMS to ${to} failed:`, result);
      } else {
        console.log(`Crisis SMS sent to ${to}:`, result.sid);
      }
    } catch (err) {
      console.error(`Crisis SMS to ${to} errored:`, err);
    }
  }
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (!isInternalRequest(req)) {
    return forbiddenResponse(corsHeaders);
  }

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Checking for families requiring escalation (tiered SLA)...");

    // Pull every family currently in a concerning status; per-status thresholds
    // and re-alert windows are applied below.
    const { data: candidates, error: queryError } = await supabase
      .from("family_health_status")
      .select("family_id, status, status_reason, concerning_status_since, escalation_alert_sent_at")
      .in("status", ["crisis", "concern", "tension"])
      .not("concerning_status_since", "is", null);

    if (queryError) {
      console.error("Error querying escalation candidates:", queryError);
      throw queryError;
    }

    const now = Date.now();
    const due = (candidates as FamilyHealthRecord[] | null || []).filter((r) => {
      const sla = SLA[r.status];
      if (!sla) return false;
      const hoursInStatus = (now - new Date(r.concerning_status_since).getTime()) / 36e5;
      if (hoursInStatus < sla.delayHours) return false;
      if (!r.escalation_alert_sent_at) return true;
      const hoursSinceAlert = (now - new Date(r.escalation_alert_sent_at).getTime()) / 36e5;
      return hoursSinceAlert >= sla.realertHours;
    });

    console.log(`Found ${due.length} of ${candidates?.length || 0} concerning families due for escalation`);

    if (due.length === 0) {
      return new Response(
        JSON.stringify({ message: "No escalations needed", count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let alertsSent = 0;

    for (const record of due) {
      try {
        // Get family details including organization
        const { data: family, error: familyError } = await supabase
          .from("families")
          .select("id, name, organization_id")
          .eq("id", record.family_id)
          .eq("is_archived", false)
          .single();

        if (familyError || !family) {
          console.log(`Family ${record.family_id} not found or archived, skipping`);
          continue;
        }

        // Get the moderator(s) assigned to this family
        const { data: moderators } = await supabase
          .from("family_members")
          .select("user_id, profiles(full_name)")
          .eq("family_id", record.family_id)
          .eq("role", "moderator");

        const moderatorNames = (moderators as FamilyMember[] || [])
          .map((m) => m.profiles?.[0]?.full_name || "Unknown")
          .join(", ") || "No moderator assigned";

        const concerningSince = new Date(record.concerning_status_since);
        const hoursInStatus = Math.round((now - concerningSince.getTime()) / (1000 * 60 * 60));

        const severityLabel = record.status === "crisis" ? "🚨 CRITICAL" :
                              record.status === "concern" ? "⚠️ CONCERN" : "⚡ TENSION";

        const durationText = hoursInStatus < 1
          ? "in the last hour"
          : `for ${hoursInStatus}+ hours`;

        // Find provider admins to notify
        let adminUserIds: string[] = [];

        if (family.organization_id) {
          const { data: orgAdmins, error: orgError } = await supabase
            .from("organization_members")
            .select("user_id")
            .eq("organization_id", family.organization_id)
            .in("role", ["owner", "admin"]);

          if (!orgError && orgAdmins) {
            adminUserIds = orgAdmins.map((a) => a.user_id);
          }
        }

        // Also notify super admins
        const { data: superAdmins, error: superError } = await supabase
          .rpc("get_super_admin_ids");

        if (!superError && superAdmins) {
          adminUserIds = [...new Set([...adminUserIds, ...superAdmins])];
        }

        // Include the family's moderators in crisis notifications
        if (record.status === "crisis" && moderators) {
          adminUserIds = [...new Set([...adminUserIds, ...(moderators as FamilyMember[]).map((m) => m.user_id)])];
        }

        if (adminUserIds.length === 0) {
          console.log(`No admins found to notify for family ${family.name}, skipping`);
          continue;
        }

        // Create notifications for each admin
        const notifications = adminUserIds.map((userId) => ({
          user_id: userId,
          family_id: record.family_id,
          type: "moderator_escalation",
          title: `${severityLabel} - Moderator Support Needed`,
          body: `"${family.name}" has been in ${record.status} status ${durationText}. Moderator: ${moderatorNames}. Reason: ${record.status_reason || "AI analysis detected concerning patterns."}`,
          related_id: record.family_id,
        }));

        const { error: notifyError } = await supabase
          .from("notifications")
          .insert(notifications);

        if (notifyError) {
          console.error(`Error creating notifications for family ${family.name}:`, notifyError);
          continue;
        }

        // Update the escalation_alert_sent_at timestamp
        const { error: updateError } = await supabase
          .from("family_health_status")
          .update({ escalation_alert_sent_at: new Date().toISOString() })
          .eq("family_id", record.family_id);

        if (updateError) {
          console.error(`Error updating escalation timestamp for family ${family.name}:`, updateError);
        }

        console.log(`Escalation alert (${record.status}) sent for family "${family.name}" to ${adminUserIds.length} admin(s)`);
        alertsSent++;

        // Push notifications
        try {
          await supabase.functions.invoke("send-push-notification", {
            body: {
              user_ids: adminUserIds,
              title: `${severityLabel} - Moderator Support Needed`,
              body: `"${family.name}" has been in ${record.status} status ${durationText}.`,
              type: "moderator_escalation",
            },
          });
        } catch (pushError) {
          console.error("Error sending push notification:", pushError);
        }

        // Crisis additionally sends SMS (immediate human reach — CX 3.2)
        if (SLA[record.status]?.sms) {
          await sendCrisisSms(family.name, hoursInStatus, record.status_reason || "");
        }

      } catch (familyError) {
        console.error(`Error processing family ${record.family_id}:`, familyError);
        continue;
      }
    }

    return new Response(
      JSON.stringify({
        message: "Escalation check complete",
        familiesChecked: due.length,
        alertsSent,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in check-escalations:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
