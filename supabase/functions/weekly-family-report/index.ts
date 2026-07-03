import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

// Weekly Family Report (CX improvement 3.3)
// Runs Sundays via pg_cron (see migration 20260703090000). For every active
// family it composes a short digest from family_health_status and delivers it
// as an in-app notification + push to every member, and (when configured)
// an email via Resend.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STATUS_COPY: Record<string, { headline: string; tone: string }> = {
  improving: {
    headline: "Your family is trending in the right direction",
    tone: "Keep doing what you're doing — consistency is what makes this stick.",
  },
  stable: {
    headline: "Your family held steady this week",
    tone: "Stability is a win. Small, repeated actions are what recovery is built on.",
  },
  tension: {
    headline: "Some tension showed up this week",
    tone: "That's normal — what matters is how it's handled. Consider revisiting boundaries together.",
  },
  concern: {
    headline: "This week showed some concerning patterns",
    tone: "Don't carry this alone. Your moderator can help — reach out through the app.",
  },
  crisis: {
    headline: "Your family needed extra support this week",
    tone: "If things feel unsafe, call or text 988. Your moderator has been alerted and is available.",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const resendKey = Deno.env.get("RESEND_API_KEY");
    const resend = resendKey ? new Resend(resendKey) : null;

    // Active families only
    const { data: families, error: famError } = await supabase
      .from("families")
      .select("id, name")
      .eq("is_archived", false);

    if (famError) throw famError;

    let reportsSent = 0;
    let emailsSent = 0;

    for (const family of families || []) {
      try {
        const { data: health } = await supabase
          .from("family_health_status")
          .select("status, status_reason, calculated_at")
          .eq("family_id", family.id)
          .maybeSingle();

        const status = health?.status || "stable";
        const copy = STATUS_COPY[status] || STATUS_COPY.stable;

        const { data: members } = await supabase
          .from("family_members")
          .select("user_id")
          .eq("family_id", family.id);

        const memberIds = (members || []).map((m: { user_id: string }) => m.user_id);
        if (memberIds.length === 0) continue;

        const title = `Weekly report: ${copy.headline}`;
        const body =
          `${family.name} — this week's status: ${status}.` +
          (health?.status_reason ? ` ${health.status_reason}` : "") +
          ` ${copy.tone}`;

        // In-app notifications for every member
        const { error: notifyError } = await supabase.from("notifications").insert(
          memberIds.map((userId: string) => ({
            user_id: userId,
            family_id: family.id,
            type: "weekly_family_report",
            title,
            body,
            related_id: family.id,
          }))
        );

        if (notifyError) {
          console.error(`Notifications failed for family ${family.name}:`, notifyError);
          continue;
        }

        // Push to every member
        try {
          await supabase.functions.invoke("send-push-notification", {
            body: {
              user_ids: memberIds,
              title,
              body: `${copy.headline}. Open FamilyBridge to see your family's week.`,
              type: "weekly_family_report",
            },
          });
        } catch (pushError) {
          console.error("Push failed:", pushError);
        }

        // Email each member (best effort, only when Resend is configured)
        if (resend) {
          for (const userId of memberIds) {
            try {
              const { data: userData } = await supabase.auth.admin.getUserById(userId);
              const email = userData?.user?.email;
              if (!email || email.startsWith("sms:")) continue;

              await resend.emails.send({
                from: "FamilyBridge <noreply@familybridgeapp.com>",
                to: [email],
                subject: `Your weekly FamilyBridge report — ${family.name}`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #2d3748;">
                    <h2 style="color: #1a365d;">${copy.headline}</h2>
                    <p style="font-size: 15px; line-height: 1.6;">
                      Here's the weekly check-in for <strong>${family.name}</strong>.
                    </p>
                    <div style="background: #eef3f8; border-left: 4px solid #4a7c9e; padding: 14px 16px; border-radius: 4px;">
                      <p style="margin: 0; font-size: 14px; line-height: 1.6;">
                        <strong>Status:</strong> ${status.charAt(0).toUpperCase() + status.slice(1)}<br/>
                        ${health?.status_reason ? `<strong>What we noticed:</strong> ${health.status_reason}<br/>` : ""}
                        ${copy.tone}
                      </p>
                    </div>
                    <p style="font-size: 14px; line-height: 1.6;">
                      Open the app to see details, message your family, or talk with your moderator.
                    </p>
                    <p style="font-size: 12px; color: #718096;">
                      If you or a loved one is in crisis, call or text <strong>988</strong> (Suicide &amp; Crisis Lifeline).
                    </p>
                  </div>
                `,
              });
              emailsSent++;
            } catch (emailError) {
              console.error(`Email failed for user ${userId}:`, emailError);
            }
          }
        }

        reportsSent++;
      } catch (familyError) {
        console.error(`Weekly report failed for family ${family.id}:`, familyError);
        continue;
      }
    }

    console.log(`Weekly reports: ${reportsSent} families, ${emailsSent} emails`);
    return new Response(
      JSON.stringify({ message: "Weekly family reports sent", families: reportsSent, emails: emailsSent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in weekly-family-report:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
