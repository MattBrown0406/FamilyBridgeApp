import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendFamilyInviteRequest {
  recipientEmail: string;
  recipientName: string;
  familyName: string;
  inviteCode: string;
  organizationName: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipientEmail, recipientName, familyName, inviteCode, organizationName }: SendFamilyInviteRequest = await req.json();

    if (!recipientEmail || !recipientName || !familyName || !inviteCode) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const appUrl = Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovable.app") || "https://familybridge.app";
    const joinUrl = `${appUrl}/family-purchase?inviteCode=${encodeURIComponent(inviteCode)}`;

    const emailResponse = await resend.emails.send({
      from: `${organizationName} <noreply@familybridgeapp.com>`,
      to: [recipientEmail],
      subject: `You're Invited to Join ${familyName} on FamilyBridge`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2d7d6f; margin: 0;">FamilyBridge</h1>
            <p style="color: #666; margin-top: 5px;">Family Recovery Support Platform</p>
          </div>
          
          <div style="background: #f8f9fa; border-radius: 12px; padding: 30px; margin-bottom: 20px;">
            <h2 style="margin-top: 0; color: #333;">Hello ${recipientName},</h2>
            
            <p>You have been invited to join <strong>${familyName}</strong> on FamilyBridge, a secure platform for family recovery support.</p>
            
            <p>${organizationName} has set up a family group for you. To get started, use the invite code below:</p>
            
            <div style="background: #fff; border: 2px dashed #2d7d6f; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
              <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Your Invite Code</p>
              <p style="margin: 0; font-size: 28px; font-weight: bold; font-family: monospace; letter-spacing: 2px; color: #2d7d6f;">${inviteCode}</p>
            </div>
            
            <p>To join your family group:</p>
            <ol style="color: #555;">
              <li>Visit FamilyBridge and click "Get Started"</li>
              <li>Enter the invite code shown above</li>
              <li>Create your account</li>
              <li>You'll be connected to your family group immediately</li>
            </ol>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #888; font-size: 14px;">
            <p>This invitation was sent by ${organizationName}.</p>
            <p>If you have any questions, please contact your family coordinator.</p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Family invite email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, ...emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-family-invite function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
