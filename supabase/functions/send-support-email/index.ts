import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendSupportEmailRequest {
  name: string;
  email: string;
  phone: string;
  message: string;
  accountNumber?: string;
  organizationName?: string;
  organizationId?: string;
  userType: 'family' | 'moderator' | 'provider';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      name, 
      email, 
      phone, 
      message, 
      accountNumber, 
      organizationName,
      organizationId,
      userType 
    }: SendSupportEmailRequest = await req.json();

    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: "Name, email, and message are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Build identifying information section based on user type
    let identifyingInfo = '';
    if (userType === 'family' && accountNumber) {
      identifyingInfo = `
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #ddd; font-weight: bold; background: #f9fafb;">Account Number:</td>
          <td style="padding: 8px 12px; border: 1px solid #ddd;">${accountNumber}</td>
        </tr>
      `;
    } else if ((userType === 'moderator' || userType === 'provider') && organizationName) {
      identifyingInfo = `
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #ddd; font-weight: bold; background: #f9fafb;">Organization:</td>
          <td style="padding: 8px 12px; border: 1px solid #ddd;">${organizationName}${organizationId ? ` (ID: ${organizationId.substring(0, 8)}...)` : ''}</td>
        </tr>
      `;
    }

    const userTypeLabel = userType === 'family' ? 'Family Admin' : userType === 'moderator' ? 'Moderator' : 'Provider Admin';

    const emailResponse = await resend.emails.send({
      from: "FamilyBridge Support <noreply@familybridgeapp.com>",
      to: ["Matt@FreedomInterventions.com"],
      reply_to: email,
      subject: `[FamilyBridge Support] New inquiry from ${name} (${userTypeLabel})`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="https://familybridgeapp.com/og-image.png" alt="FamilyBridge" style="max-width: 200px; height: auto; margin-bottom: 15px;" />
            <h1 style="color: #2d7d6f; margin: 0;">FamilyBridge Support Request</h1>
          </div>
          
          <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <h2 style="margin-top: 0; color: #333; font-size: 18px;">New Support Inquiry</h2>
            
            <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
              <tr>
                <td style="padding: 8px 12px; border: 1px solid #ddd; font-weight: bold; background: #f9fafb;">User Type:</td>
                <td style="padding: 8px 12px; border: 1px solid #ddd;">${userTypeLabel}</td>
              </tr>
              ${identifyingInfo}
              <tr>
                <td style="padding: 8px 12px; border: 1px solid #ddd; font-weight: bold; background: #f9fafb;">Name:</td>
                <td style="padding: 8px 12px; border: 1px solid #ddd;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; border: 1px solid #ddd; font-weight: bold; background: #f9fafb;">Email:</td>
                <td style="padding: 8px 12px; border: 1px solid #ddd;"><a href="mailto:${email}" style="color: #2d7d6f;">${email}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; border: 1px solid #ddd; font-weight: bold; background: #f9fafb;">Phone:</td>
                <td style="padding: 8px 12px; border: 1px solid #ddd;">${phone || 'Not provided'}</td>
              </tr>
            </table>
          </div>
          
          <div style="background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #333;">Message:</h3>
            <p style="white-space: pre-wrap; margin: 0;">${message}</p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
            <p>This email was sent from the FamilyBridge app support form.</p>
            <p>Reply directly to this email to respond to the user.</p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Support email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, ...emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-support-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
