import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendWelcomeEmailRequest {
  email: string;
  fullName?: string;
  accountType?: "family" | "provider";
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, fullName, accountType = "family" }: SendWelcomeEmailRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const displayName = fullName || "there";
    const appUrl = "https://familybridgeapp.com";
    
    // Determine purchase URL based on account type
    const purchaseUrl = accountType === "provider" 
      ? `${appUrl}/provider-purchase?email=${encodeURIComponent(email)}`
      : `${appUrl}/family-purchase?email=${encodeURIComponent(email)}`;
    
    const purchaseLabel = accountType === "provider" ? "Provider Subscription" : "Family Subscription";

    const emailResponse = await resend.emails.send({
      from: "FamilyBridge <noreply@familybridgeapp.com>",
      to: [email],
      subject: "Welcome to FamilyBridge – Complete Your Setup",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #2d7d6f 0%, #1d5d4f 100%); padding: 40px 30px; text-align: center;">
              <img src="https://familybridgeapp.com/og-image.png" alt="FamilyBridge" style="max-width: 180px; height: auto; margin-bottom: 15px;" />
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Welcome to FamilyBridge</h1>
              <p style="color: rgba(255,255,255,0.9); margin-top: 8px; font-size: 16px;">Family Recovery Support Platform</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <h2 style="margin-top: 0; color: #333; font-size: 20px;">Hi ${displayName},</h2>
              
              <p style="font-size: 16px; color: #555;">
                Thank you for creating your FamilyBridge account! You're one step away from connecting with your family's recovery journey.
              </p>
              
              <div style="background: #f0f9f7; border-left: 4px solid #2d7d6f; border-radius: 0 8px 8px 0; padding: 20px; margin: 25px 0;">
                <h3 style="margin: 0 0 10px 0; color: #2d7d6f; font-size: 16px;">📱 Downloaded our app?</h3>
                <p style="margin: 0; color: #555; font-size: 14px;">
                  To start using FamilyBridge, you'll need to set up or join a family group. Visit our website to get started with your subscription.
                </p>
              </div>
              
              <p style="text-align: center; margin: 30px 0;">
                <a href="${purchaseUrl}" style="display: inline-block; background: linear-gradient(135deg, #2d7d6f 0%, #1d5d4f 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(45,125,111,0.3);">
                  Complete Your ${purchaseLabel} →
                </a>
              </p>
              
              <p style="text-align: center; color: #888; font-size: 14px; margin-top: 10px;">
                Or visit: <a href="${appUrl}" style="color: #2d7d6f;">${appUrl}</a>
              </p>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
              
              <h3 style="color: #2d7d6f; font-size: 16px; margin-bottom: 15px;">What you can do with FamilyBridge:</h3>
              <ul style="color: #555; padding-left: 20px; font-size: 15px;">
                <li style="margin-bottom: 10px;"><strong>Group Communication</strong> – Keep your family connected with secure messaging</li>
                <li style="margin-bottom: 10px;"><strong>Recovery Support</strong> – Track sobriety milestones and emotional check-ins</li>
                <li style="margin-bottom: 10px;"><strong>Accountability Tools</strong> – Meeting check-ins, location sharing, and more</li>
                <li style="margin-bottom: 10px;"><strong>Professional Moderation</strong> – Optional support from trained moderators</li>
              </ul>
              
              <div style="background: #fef3cd; border-radius: 8px; padding: 15px; margin-top: 25px;">
                <p style="margin: 0; color: #856404; font-size: 14px;">
                  <strong>Already have an invite code?</strong> You can skip the subscription and join an existing family group using your code in the app.
                </p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #eee;">
              <p style="margin: 0 0 10px 0; color: #888; font-size: 14px;">
                Need help? Reply to this email or contact us at support@familybridgeapp.com
              </p>
              <div style="margin-top: 15px;">
                <p style="margin: 0 0 2px 0; font-size: 13px; color: #888;">Thank you,</p>
                <p style="margin: 0; font-weight: bold; color: #555;">Matt Brown, Creator of FamilyBridge</p>
              </div>
            </div>
          </div>
          
          <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
            © ${new Date().getFullYear()} FamilyBridge. All rights reserved.
          </p>
        </body>
        </html>
      `,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, ...emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
