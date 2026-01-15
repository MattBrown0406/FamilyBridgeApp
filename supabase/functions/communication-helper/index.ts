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
    const { rawMessage, familyId } = await req.json();

    if (!rawMessage || !familyId) {
      return new Response(
        JSON.stringify({ error: "Missing rawMessage or familyId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get user's auth token to fetch their previous messages for style analysis
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let userWritingStyle = "";
    
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      
      if (user) {
        // Fetch user's recent messages to understand their writing style
        const { data: recentMessages } = await supabase
          .from("messages")
          .select("content")
          .eq("family_id", familyId)
          .eq("sender_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10);

        if (recentMessages && recentMessages.length > 0) {
          userWritingStyle = `
Here are examples of how this person typically writes:
${recentMessages.map((m, i) => `${i + 1}. "${m.content}"`).join("\n")}

Try to match their tone, vocabulary level, and communication style when suggesting alternatives.`;
        }
      }
    }

    const systemPrompt = `You are a compassionate communication coach specializing in family recovery dynamics. Your role is to help users express difficult emotions and concerns in ways that are:
- Non-confrontational and non-judgmental
- Using "I" statements instead of "you" accusations
- Focused on feelings and needs rather than blame
- Supportive of recovery while maintaining healthy boundaries
- Honest but kind

${userWritingStyle}

When the user shares what they want to say, provide 2-3 alternative phrasings that:
1. Preserve their core message and intent
2. Match their natural writing style (casual, formal, etc.)
3. Remove potentially triggering or accusatory language
4. Focus on connection rather than conflict

Format your response as a JSON object with this structure:
{
  "suggestions": [
    {
      "text": "the suggested message",
      "approach": "brief 5-10 word description of the approach"
    }
  ],
  "tip": "A brief tip about the communication principle used"
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
          { role: "user", content: `I want to say this to my family member: "${rawMessage}"\n\nPlease suggest better ways to phrase this.` }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_phrasings",
              description: "Provide alternative phrasings for a message",
              parameters: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        text: { type: "string", description: "The suggested message text" },
                        approach: { type: "string", description: "Brief description of the approach (5-10 words)" }
                      },
                      required: ["text", "approach"]
                    }
                  },
                  tip: { type: "string", description: "A brief tip about the communication principle used" }
                },
                required: ["suggestions", "tip"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "suggest_phrasings" } }
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
    
    // Extract the function call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fallback: try to parse content as JSON
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      try {
        const parsed = JSON.parse(content);
        return new Response(
          JSON.stringify(parsed),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch {
        // If not JSON, return a simple suggestion
        return new Response(
          JSON.stringify({
            suggestions: [{ text: content, approach: "AI suggestion" }],
            tip: "Consider using 'I' statements to express your feelings."
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    throw new Error("No valid response from AI");
  } catch (error) {
    console.error("Communication helper error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
