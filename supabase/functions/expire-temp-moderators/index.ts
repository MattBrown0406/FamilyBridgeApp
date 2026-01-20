import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const now = new Date().toISOString();

    console.log(`[expire-temp-moderators] Running expiration check at ${now}`);

    // Find all temporary moderator requests that have expired and are still active
    const { data: expiredRequests, error: fetchError } = await supabase
      .from("temporary_moderator_requests")
      .select(`
        id,
        family_id,
        assigned_moderator_id,
        requested_by,
        expires_at,
        status,
        families:family_id (name)
      `)
      .eq("status", "active")
      .lt("expires_at", now);

    if (fetchError) {
      console.error("[expire-temp-moderators] Error fetching expired requests:", fetchError);
      throw new Error("Failed to fetch expired requests");
    }

    if (!expiredRequests || expiredRequests.length === 0) {
      console.log("[expire-temp-moderators] No expired requests found");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No expired requests to process",
          processed: 0 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`[expire-temp-moderators] Found ${expiredRequests.length} expired request(s)`);

    let processed = 0;
    const errors: string[] = [];

    for (const request of expiredRequests) {
      try {
        console.log(`[expire-temp-moderators] Processing request ${request.id} for family ${request.family_id}`);

        // Update the request status to completed
        const { error: updateError } = await supabase
          .from("temporary_moderator_requests")
          .update({ 
            status: "completed",
            completed_at: now
          })
          .eq("id", request.id);

        if (updateError) {
          console.error(`[expire-temp-moderators] Error updating request ${request.id}:`, updateError);
          errors.push(`Failed to update request ${request.id}`);
          continue;
        }

        // Remove the moderator from the family
        const { error: removeMemberError } = await supabase
          .from("family_members")
          .delete()
          .eq("family_id", request.family_id)
          .eq("user_id", request.assigned_moderator_id)
          .eq("role", "moderator");

        if (removeMemberError) {
          console.error(`[expire-temp-moderators] Error removing moderator from family:`, removeMemberError);
          // Don't fail the whole process, just log the error
        } else {
          console.log(`[expire-temp-moderators] Removed moderator ${request.assigned_moderator_id} from family ${request.family_id}`);
        }

        const familyName = (request.families as any)?.name || "the family";

        // Notify the moderator that their session has ended
        await supabase
          .from("notifications")
          .insert({
            user_id: request.assigned_moderator_id,
            family_id: request.family_id,
            type: "temp_moderator_expired",
            title: "Crisis Moderation Session Ended",
            body: `Your 24-hour crisis moderation session for ${familyName} has ended.`,
            related_id: request.id,
          });

        // Notify the requester that the session has ended
        await supabase
          .from("notifications")
          .insert({
            user_id: request.requested_by,
            family_id: request.family_id,
            type: "temp_moderator_expired",
            title: "Crisis Moderation Session Ended",
            body: `Your 24-hour crisis moderation session has ended. You can purchase additional days for $150 each if needed.`,
            related_id: request.id,
          });

        // Send email notification if Resend is configured
        if (resendApiKey) {
          try {
            const resend = new Resend(resendApiKey);
            
            // Get moderator email
            const { data: authUsers } = await supabase.auth.admin.listUsers();
            const moderator = authUsers.users.find(u => u.id === request.assigned_moderator_id);
            const requester = authUsers.users.find(u => u.id === request.requested_by);

            if (moderator?.email) {
              await resend.emails.send({
                from: "FamilyBridge <noreply@familybridgeapp.com>",
                to: [moderator.email],
                subject: "Crisis Moderation Session Ended",
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #7c3aed;">Session Ended</h1>
                    <p>Your 24-hour crisis moderation session for <strong>${familyName}</strong> has ended.</p>
                    <p>You have been automatically removed from the family group.</p>
                    <p style="margin-top: 30px; margin-bottom: 5px;">Thank you,</p>
                    <p style="font-weight: bold; margin-top: 0;">Matt Brown, Creator of Family Bridge</p>
                  </div>
                `,
              });
            }

            if (requester?.email) {
              await resend.emails.send({
                from: "FamilyBridge <noreply@familybridgeapp.com>",
                to: [requester.email],
                subject: "Your Crisis Moderation Session Has Ended",
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #7c3aed;">Session Ended</h1>
                    <p>Your 24-hour crisis moderation session for <strong>${familyName}</strong> has ended.</p>
                    <p>The assigned moderator has been removed from your family group.</p>
                    
                    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                      <p><strong>Need more support?</strong></p>
                      <p>You can purchase additional crisis moderation days for $150 each directly in the FamilyBridge app.</p>
                    </div>
                    
                    <p style="margin-top: 30px; margin-bottom: 5px;">Thank you,</p>
                    <p style="font-weight: bold; margin-top: 0;">Matt Brown, Creator of Family Bridge</p>
                  </div>
                `,
              });
            }
          } catch (emailError) {
            console.error("[expire-temp-moderators] Error sending email:", emailError);
            // Don't fail the process for email errors
          }
        }

        processed++;
        console.log(`[expire-temp-moderators] Successfully processed request ${request.id}`);
      } catch (requestError) {
        console.error(`[expire-temp-moderators] Error processing request ${request.id}:`, requestError);
        errors.push(`Error processing request ${request.id}`);
      }
    }

    console.log(`[expire-temp-moderators] Completed. Processed: ${processed}, Errors: ${errors.length}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${processed} expired moderator session(s)`,
        processed,
        errors: errors.length > 0 ? errors : undefined
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("[expire-temp-moderators] Fatal error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
