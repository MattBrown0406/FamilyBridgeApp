import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Super admin emails who can trigger password resets
const SUPER_ADMIN_EMAILS = [
  "matt@freedominterventions.com",
  "cory@freedominterventions.com",
  "support@familybridgeapp.com",
];

interface PasswordResetRequest {
  userId: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Check for authorization - if present, verify caller is super admin
    const authHeader = req.headers.get("Authorization");
    let isAuthorized = false;
    
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user: callerUser } } = await supabaseAdmin.auth.getUser(token);
      
      if (callerUser && SUPER_ADMIN_EMAILS.includes(callerUser.email || "")) {
        isAuthorized = true;
      }
    }

    // Also allow service-level calls (for admin tooling)
    const serviceKey = req.headers.get("x-service-key");
    if (serviceKey === supabaseServiceKey) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      throw new Error("Unauthorized - super admin access required");
    }

    const { userId }: PasswordResetRequest = await req.json();

    if (!userId) {
      throw new Error("Missing userId");
    }

    // Get the user's email
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (userError || !userData.user) {
      throw new Error("User not found");
    }

    const userEmail = userData.user.email;
    if (!userEmail) {
      throw new Error("User has no email address");
    }

    // Generate password reset link
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: userEmail,
      options: {
        redirectTo: "https://familybridgeapp.com/auth?mode=reset",
      },
    });

    if (linkError) {
      throw new Error(`Failed to generate reset link: ${linkError.message}`);
    }

    // Send email via Resend if API key is available
    if (resendApiKey && linkData?.properties?.action_link) {
      const resend = new Resend(resendApiKey);
      
      await resend.emails.send({
        from: "FamilyBridge <noreply@familybridgeapp.com>",
        to: [userEmail],
        subject: "Reset Your FamilyBridge Password",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1a365d;">Reset Your Password</h1>
            <p>Hi there,</p>
            <p>We received a request to reset your FamilyBridge password. Click the button below to create a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${linkData.properties.action_link}" 
                 style="background-color: #3182ce; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Reset Password
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email. This link expires in 24 hours.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px;">FamilyBridge - Supporting families through recovery</p>
          </div>
        `,
      });
      
      console.log("Password reset email sent via Resend to:", userEmail);
    } else {
      console.log("Password reset link generated for:", userEmail, "- Link:", linkData?.properties?.action_link);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        email: userEmail,
        message: `Password reset email sent to ${userEmail}` 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-password-reset:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
