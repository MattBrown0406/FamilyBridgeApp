import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FamilyHealthRecord {
  family_id: string;
  status: string;
  status_reason: string;
  concerning_status_since: string;
  escalation_alert_sent_at: string | null;
}

interface Family {
  id: string;
  name: string;
  organization_id: string | null;
}

interface FamilyMember {
  user_id: string;
  profiles: {
    full_name: string;
  }[] | null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Checking for families requiring escalation...");

    // Find families that have been in concerning status for > 48 hours without an alert sent
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    const { data: escalationCandidates, error: queryError } = await supabase
      .from("family_health_status")
      .select("family_id, status, status_reason, concerning_status_since, escalation_alert_sent_at")
      .in("status", ["crisis", "concern", "tension"])
      .not("concerning_status_since", "is", null)
      .lt("concerning_status_since", fortyEightHoursAgo)
      .or("escalation_alert_sent_at.is.null,escalation_alert_sent_at.lt." + fortyEightHoursAgo);

    if (queryError) {
      console.error("Error querying escalation candidates:", queryError);
      throw queryError;
    }

    console.log(`Found ${escalationCandidates?.length || 0} families requiring escalation`);

    if (!escalationCandidates || escalationCandidates.length === 0) {
      return new Response(
        JSON.stringify({ message: "No escalations needed", count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let alertsSent = 0;

    for (const record of escalationCandidates as FamilyHealthRecord[]) {
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
        const { data: moderators, error: modError } = await supabase
          .from("family_members")
          .select("user_id, profiles(full_name)")
          .eq("family_id", record.family_id)
          .eq("role", "moderator");

        const moderatorNames = (moderators as FamilyMember[] || [])
          .map(m => m.profiles?.[0]?.full_name || "Unknown")
          .join(", ") || "No moderator assigned";

        // Calculate how long the family has been in concerning status
        const concerningSince = new Date(record.concerning_status_since);
        const hoursInStatus = Math.round((Date.now() - concerningSince.getTime()) / (1000 * 60 * 60));

        // Determine severity label
        const severityLabel = record.status === "crisis" ? "🚨 CRITICAL" : 
                              record.status === "concern" ? "⚠️ CONCERN" : "⚡ TENSION";

        // Find provider admins to notify
        let adminUserIds: string[] = [];

        if (family.organization_id) {
          // Notify organization admins/owners
          const { data: orgAdmins, error: orgError } = await supabase
            .from("organization_members")
            .select("user_id")
            .eq("organization_id", family.organization_id)
            .in("role", ["owner", "admin"]);

          if (!orgError && orgAdmins) {
            adminUserIds = orgAdmins.map(a => a.user_id);
          }
        }

        // Also notify super admins
        const { data: superAdmins, error: superError } = await supabase
          .rpc("get_super_admin_ids");

        if (!superError && superAdmins) {
          adminUserIds = [...new Set([...adminUserIds, ...superAdmins])];
        }

        if (adminUserIds.length === 0) {
          console.log(`No admins found to notify for family ${family.name}, skipping`);
          continue;
        }

        // Create notifications for each admin
        const notifications = adminUserIds.map(userId => ({
          user_id: userId,
          family_id: record.family_id,
          type: "moderator_escalation",
          title: `${severityLabel} - Moderator Support Needed`,
          body: `"${family.name}" has been in ${record.status} status for ${hoursInStatus}+ hours. Moderator: ${moderatorNames}. Reason: ${record.status_reason || "AI analysis detected concerning patterns."}`,
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

        console.log(`Escalation alert sent for family "${family.name}" to ${adminUserIds.length} admin(s)`);
        alertsSent++;

        // Also trigger push notifications
        try {
          await supabase.functions.invoke("send-push-notification", {
            body: {
              user_ids: adminUserIds,
              title: `${severityLabel} - Moderator Support Needed`,
              body: `"${family.name}" has been in ${record.status} status for ${hoursInStatus}+ hours.`,
              type: "moderator_escalation",
            },
          });
        } catch (pushError) {
          console.error("Error sending push notification:", pushError);
          // Don't fail the whole operation if push fails
        }

      } catch (familyError) {
        console.error(`Error processing family ${record.family_id}:`, familyError);
        continue;
      }
    }

    return new Response(
      JSON.stringify({ 
        message: "Escalation check complete", 
        familiesChecked: escalationCandidates.length,
        alertsSent 
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