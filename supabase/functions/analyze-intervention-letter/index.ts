import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ExtractedBoundary {
  content: string;
  consequence: string | null;
  target_member_name: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId, familyId, documentContent } = await req.json();

    if (!documentId || !familyId || !documentContent) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: documentId, familyId, documentContent" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header for user context
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user is a family member
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Invalid authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify membership
    const { data: membership } = await supabase
      .from("family_members")
      .select("id, role")
      .eq("family_id", familyId)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return new Response(
        JSON.stringify({ error: "Not a member of this family" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get family members for context
    const { data: familyMembers } = await supabase
      .from("family_members")
      .select("user_id")
      .eq("family_id", familyId);

    const memberIds = familyMembers?.map(m => m.user_id) || [];
    
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", memberIds);

    const memberNames = profiles?.map(p => p.full_name).filter(Boolean) || [];

    // Call Lovable AI to extract boundaries
    const systemPrompt = `You are an expert at analyzing intervention letters and extracting boundaries that families have set.

An intervention letter typically contains:
- Expressions of love and concern
- Specific boundaries the family member is committing to
- Consequences if boundaries are violated

Your task is to identify and extract ONLY the specific boundaries mentioned in the letter. A boundary is a clear statement about what the family member will or will not do/allow.

Examples of boundaries:
- "I will no longer give you money for any reason"
- "You cannot stay at our house if you are using"
- "I will not answer the phone after 10pm"

For each boundary, also extract:
1. The consequence if violated (if mentioned)
2. The target person's name if this boundary is specifically about one recovering member

Family member names in this group: ${memberNames.join(", ")}

Respond with a JSON array of boundaries. If no clear boundaries are found, return an empty array.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Please analyze this intervention letter and extract all boundaries:\n\n${documentContent}` }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_boundaries",
              description: "Extract boundaries from an intervention letter",
              parameters: {
                type: "object",
                properties: {
                  boundaries: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        content: { 
                          type: "string", 
                          description: "The boundary statement itself" 
                        },
                        consequence: { 
                          type: "string", 
                          description: "The consequence if this boundary is violated (or null if not specified)" 
                        },
                        target_member_name: { 
                          type: "string", 
                          description: "The name of the recovering member this boundary is specifically about (or null if general)" 
                        }
                      },
                      required: ["content"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["boundaries"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_boundaries" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI analysis failed");
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall || toolCall.function.name !== "extract_boundaries") {
      throw new Error("Unexpected AI response format");
    }

    const extractedData = JSON.parse(toolCall.function.arguments);
    const boundaries: ExtractedBoundary[] = extractedData.boundaries || [];

    // Create boundaries in the database
    let boundariesCreated = 0;
    
    for (const boundary of boundaries) {
      // Find target user if name was extracted
      let targetUserId = null;
      if (boundary.target_member_name) {
        const matchedProfile = profiles?.find(p => 
          p.full_name?.toLowerCase().includes(boundary.target_member_name!.toLowerCase())
        );
        if (matchedProfile) {
          targetUserId = matchedProfile.id;
        }
      }

      // Insert boundary with 'pending' status for moderator review
      const { error: insertError } = await supabase
        .from("family_boundaries")
        .insert({
          family_id: familyId,
          created_by: user.id,
          content: boundary.content,
          consequence: boundary.consequence || null,
          target_user_id: targetUserId,
          status: "pending" // Requires moderator approval
        });

      if (!insertError) {
        boundariesCreated++;
      } else {
        console.error("Error creating boundary:", insertError);
      }
    }

    // Update the document to mark it as analyzed
    await supabase
      .from("family_documents")
      .update({
        fiis_analyzed: true,
        fiis_analyzed_at: new Date().toISOString(),
        boundaries_extracted: boundariesCreated
      })
      .eq("id", documentId);

    return new Response(
      JSON.stringify({
        success: true,
        boundariesFound: boundaries.length,
        boundariesCreated,
        message: boundariesCreated > 0 
          ? `Extracted ${boundariesCreated} boundaries for moderator review.`
          : "No clear boundaries found in this document."
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error analyzing intervention letter:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Analysis failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
