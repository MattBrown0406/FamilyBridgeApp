import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ArchiveNotificationRequest {
  familyId: string;
  familyName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { familyId, familyName }: ArchiveNotificationRequest = await req.json();

    if (!familyId || !familyName) {
      return new Response(
        JSON.stringify({ error: "Missing familyId or familyName" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[send-archive-notification] Processing archive notification for family: ${familyId}`);

    // Get the family admin(s) for this family
    const { data: admins, error: adminError } = await supabase
      .from("family_members")
      .select(`
        user_id,
        profiles:user_id (
          full_name
        )
      `)
      .eq("family_id", familyId)
      .eq("role", "admin");

    if (adminError) {
      console.error("[send-archive-notification] Error fetching admins:", adminError);
      throw new Error("Failed to fetch family admins");
    }

    if (!admins || admins.length === 0) {
      console.log("[send-archive-notification] No admins found for family");
      return new Response(
        JSON.stringify({ success: true, message: "No admins to notify" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get admin emails from auth.users
    const adminIds = admins.map((a: any) => a.user_id);
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error("[send-archive-notification] Error fetching auth users:", authError);
      throw new Error("Failed to fetch user emails");
    }

    const adminEmails = authUsers.users
      .filter((u: any) => adminIds.includes(u.id) && u.email)
      .map((u: any) => ({ email: u.email, id: u.id }));

    if (adminEmails.length === 0) {
      console.log("[send-archive-notification] No admin emails found");
      return new Response(
        JSON.stringify({ success: true, message: "No admin emails found" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const appUrl = "https://familybridgeapp.com";
    const subscriptionUrl = `${appUrl}/family-purchase`;

    // Send email to each admin
    for (const admin of adminEmails) {
      const adminProfile = admins.find((a: any) => a.user_id === admin.id);
      const profileData = adminProfile?.profiles as any;
      const adminName = profileData?.full_name || "Family Admin";

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Continue Your Family Bridge Journey</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Family Bridge</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Your Recovery Journey Continues</p>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Dear ${adminName},</p>
            
            <p style="font-size: 16px;">
              Your family group "<strong>${familyName}</strong>" has been archived by the provider organization. 
              However, this doesn't have to be the end of your recovery support journey!
            </p>
            
            <div style="background: white; border-left: 4px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
              <h2 style="color: #667eea; margin-top: 0; font-size: 20px;">Continue Using Family Bridge Independently</h2>
              <p style="margin-bottom: 0;">
                You can reactivate your family group and continue your recovery journey without provider oversight. 
                Your entire family history, messages, check-ins, and progress will remain intact.
              </p>
            </div>
            
            <h3 style="color: #333; font-size: 18px; margin-top: 30px;">What's Included in Your Membership:</h3>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 15px 0;">
              <h4 style="color: #667eea; margin-top: 0;">🛡️ Professional Moderation Support</h4>
              <p style="margin-bottom: 0;">
                Every membership includes <strong>one 24-hour emergency moderation session per month</strong> with a trained 
                professional interventionist. When family tensions rise or you need neutral guidance during a crisis, 
                simply request an emergency moderator and a professional will join your family chat to help facilitate 
                healthy communication and de-escalate conflicts.
              </p>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 15px 0;">
              <h4 style="color: #667eea; margin-top: 0;">➕ Need More Support?</h4>
              <p style="margin-bottom: 0;">
                If your family needs additional moderation beyond the included monthly session, you can purchase 
                extra 24-hour moderation days as needed. This flexibility ensures you always have access to 
                professional support during challenging times in your recovery journey.
              </p>
            </div>
            
            <h3 style="color: #333; font-size: 18px; margin-top: 30px;">Additional Features:</h3>
            <ul style="padding-left: 20px;">
              <li style="margin-bottom: 10px;"><strong>Family Chat</strong> - Communicate in a moderated, filtered environment</li>
              <li style="margin-bottom: 10px;"><strong>Meeting Check-ins</strong> - Track recovery meeting attendance with location verification</li>
              <li style="margin-bottom: 10px;"><strong>Sobriety Counter</strong> - Celebrate milestones together as a family</li>
              <li style="margin-bottom: 10px;"><strong>Financial Requests</strong> - Transparent money requests with family voting</li>
              <li style="margin-bottom: 10px;"><strong>Emotional Check-ins</strong> - Daily mood tracking with pattern detection</li>
              <li style="margin-bottom: 10px;"><strong>FIIS Insights</strong> - AI-powered behavioral pattern analysis</li>
            </ul>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="${subscriptionUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Reactivate Your Family Group →
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666; text-align: center;">
              Or copy this link: <a href="${subscriptionUrl}" style="color: #667eea;">${subscriptionUrl}</a>
            </p>
            
            <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px;">
              <p style="font-size: 16px; margin-bottom: 5px;">Thank you,</p>
              <p style="font-size: 16px; font-weight: bold; margin-top: 0;">Matt Brown, Creator of Family Bridge</p>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Family Bridge. Supporting families in recovery.</p>
          </div>
        </body>
        </html>
      `;

      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Family Bridge <noreply@familybridgeapp.com>",
            to: [admin.email],
            subject: `Continue Your Family Bridge Journey - ${familyName}`,
            html: emailHtml,
          }),
        });

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text();
          throw new Error(`Resend API error: ${errorText}`);
        }

        const emailResult = await emailResponse.json();
        console.log(`[send-archive-notification] Email sent to ${admin.email}:`, emailResult);
      } catch (emailError: any) {
        console.error(`[send-archive-notification] Failed to send email to ${admin.email}:`, emailError);
        // Continue with other admins even if one fails
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Sent archive notification to ${adminEmails.length} admin(s)` 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("[send-archive-notification] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
