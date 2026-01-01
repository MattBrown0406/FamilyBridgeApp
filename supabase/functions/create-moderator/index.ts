import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateModeratorRequest {
  organizationId: string;
  email: string;
  password: string;
  fullName: string;
  role: 'admin' | 'staff';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    // Create admin client for user creation
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get the authorization header to verify the caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    // Verify the caller is authenticated and is an org admin
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: callerUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !callerUser) {
      throw new Error("Unauthorized");
    }

    const { organizationId, email, password, fullName, role }: CreateModeratorRequest = await req.json();

    if (!organizationId || !email || !password || !fullName) {
      throw new Error("Missing required fields: organizationId, email, password, fullName");
    }

    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    // Verify caller is an admin/owner of the organization
    const { data: callerMembership, error: membershipError } = await supabaseAdmin
      .from("organization_members")
      .select("role")
      .eq("organization_id", organizationId)
      .eq("user_id", callerUser.id)
      .single();

    if (membershipError || !callerMembership) {
      throw new Error("You are not a member of this organization");
    }

    if (!["owner", "admin"].includes(callerMembership.role)) {
      throw new Error("Only organization admins can add moderators");
    }

    // Check if user with this email already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

    let userId: string;

    if (existingUser) {
      // User exists, just add them to the organization
      userId = existingUser.id;
      
      // Check if they're already a member of this org
      const { data: existingMember } = await supabaseAdmin
        .from("organization_members")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("user_id", userId)
        .single();

      if (existingMember) {
        throw new Error("This user is already a member of the organization");
      }
    } else {
      // Create new user account
      const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name: fullName,
        },
      });

      if (createUserError) {
        console.error("Error creating user:", createUserError);
        throw new Error(`Failed to create user account: ${createUserError.message}`);
      }

      if (!newUser.user) {
        throw new Error("Failed to create user account");
      }

      userId = newUser.user.id;

      // The profile should be created automatically by the trigger, but update the name just in case
      await supabaseAdmin
        .from("profiles")
        .upsert({
          id: userId,
          full_name: fullName,
        });
    }

    // Add user to organization
    const { error: orgMemberError } = await supabaseAdmin
      .from("organization_members")
      .insert({
        organization_id: organizationId,
        user_id: userId,
        role: role,
      });

    if (orgMemberError) {
      console.error("Error adding organization member:", orgMemberError);
      throw new Error(`Failed to add user to organization: ${orgMemberError.message}`);
    }

    console.log(`Successfully created moderator ${email} for organization ${organizationId}`);

    return new Response(
      JSON.stringify({
        success: true,
        userId,
        message: existingUser 
          ? "Existing user added to organization" 
          : "New user account created and added to organization",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in create-moderator function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
