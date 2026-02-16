import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { familyId, imageBase64, additionalContext, talkingToName, talkingToUserId } = await req.json();

    if (!familyId || !imageBase64) {
      return new Response(
        JSON.stringify({ error: "Missing familyId or image" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user is a family member
    const { data: membership } = await supabase
      .from("family_members")
      .select("id, role, relationship_type")
      .eq("family_id", familyId)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return new Response(
        JSON.stringify({ error: "Not authorized for this family" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    // Get talking-to person's info
    let talkingToDisplay = talkingToName || "their loved one";
    if (talkingToUserId) {
      const { data: ttProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", talkingToUserId)
        .single();
      if (ttProfile) talkingToDisplay = ttProfile.full_name;
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are FIIS Text Coaching — an expert communication coach for families dealing with addiction and recovery.

**Context:**
- You are coaching: ${profile?.full_name || "a family member"} (${membership.relationship_type || membership.role})
- They are sharing a screenshot of a text conversation with: ${talkingToDisplay}

**Your Task:**
1. Read and understand the text conversation in the screenshot
2. Identify the emotional dynamics at play
3. Provide specific response suggestions the family member can send

**Coaching Principles:**
- **CRAFT Method**: Community Reinforcement and Family Training
- **De-escalation**: If the conversation is heated, prioritize calming
- **Boundaries with Love**: Help maintain limits without cutting connection
- **"I" Statements**: Transform blame into feelings
- **Recovery-Aware**: Understand addiction patterns (manipulation, deflection, minimizing)
- **Leave the Door Open**: Responses should always leave room for future engagement
- **Recognize Progress**: If the loved one shows ANY positive movement, acknowledge it

**Response Format (JSON):**
{
  "conversation_summary": "Brief summary of what's happening in the text exchange",
  "emotional_dynamics": "What emotions and patterns you see at play",
  "suggested_responses": [
    {
      "response": "The exact text they could send",
      "approach": "Brief description of this approach (5-10 words)",
      "when_to_use": "When this response is most appropriate"
    }
  ],
  "warning_signs": ["Any concerning patterns you notice"],
  "coaching_tip": "A broader coaching insight for the family member"
}`;

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
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Please analyze this text conversation screenshot and suggest how I should respond.${additionalContext ? `\n\nAdditional context: ${additionalContext}` : ""}`,
              },
              {
                type: "image_url",
                image_url: { url: `data:image/png;base64,${imageBase64}` },
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_text_conversation",
              description: "Analyze a text conversation screenshot and provide coaching suggestions",
              parameters: {
                type: "object",
                properties: {
                  conversation_summary: { type: "string" },
                  emotional_dynamics: { type: "string" },
                  suggested_responses: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        response: { type: "string" },
                        approach: { type: "string" },
                        when_to_use: { type: "string" },
                      },
                      required: ["response", "approach", "when_to_use"],
                    },
                  },
                  warning_signs: { type: "array", items: { type: "string" } },
                  coaching_tip: { type: "string" },
                },
                required: ["conversation_summary", "emotional_dynamics", "suggested_responses", "coaching_tip"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "analyze_text_conversation" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();

    // Extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fallback to content parsing
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      try {
        const parsed = JSON.parse(content);
        return new Response(JSON.stringify(parsed), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        return new Response(
          JSON.stringify({
            conversation_summary: "Analysis completed",
            emotional_dynamics: "See suggestions below",
            suggested_responses: [{ response: content, approach: "AI suggestion", when_to_use: "General response" }],
            coaching_tip: "Consider using 'I' statements to express your feelings.",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    throw new Error("No valid response from AI");
  } catch (error) {
    console.error("Screenshot coaching error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
