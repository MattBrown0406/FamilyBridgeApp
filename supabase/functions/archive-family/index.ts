import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


interface ArchiveFamilyRequest {
  familyId: string;
  archive: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) throw new Error("Invalid user token");

    const { familyId, archive }: ArchiveFamilyRequest = await req.json();
    if (!familyId || typeof archive !== "boolean") {
      throw new Error("Family ID and archive status are required");
    }

    const { data: family, error: familyError } = await supabase
      .from("families")
      .select("id, name, organization_id")
      .eq("id", familyId)
      .single();

    if (familyError || !family) throw new Error("Family not found");

    const { data: isSuperAdmin } = await supabase.rpc("is_super_admin", { _user_id: user.id });
    let canManage = Boolean(isSuperAdmin);

    if (!canManage && family.organization_id) {
      const { data: orgMember } = await supabase
        .from("organization_members")
        .select("id")
        .eq("organization_id", family.organization_id)
        .eq("user_id", user.id)
        .maybeSingle();

      canManage = Boolean(orgMember);
    }

    if (!canManage) {
      const { data: familyRole } = await supabase
        .from("family_members")
        .select("id")
        .eq("family_id", familyId)
        .eq("user_id", user.id)
        .in("role", ["admin", "moderator"])
        .maybeSingle();

      canManage = Boolean(familyRole);
    }

    if (!canManage) {
      throw new Error("You do not have permission to manage this family");
    }

    const updates = archive
      ? {
          is_archived: true,
          archived_at: new Date().toISOString(),
          archived_by: user.id,
        }
      : {
          is_archived: false,
          archived_at: null,
          archived_by: null,
        };

    const { error: updateError } = await supabase
      .from("families")
      .update(updates)
      .eq("id", familyId);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({
        success: true,
        familyName: family.name,
        isProviderManaged: Boolean(family.organization_id),
        isArchived: archive,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("archive-family error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to update family archive status" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
