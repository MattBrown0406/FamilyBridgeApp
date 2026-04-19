import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildModeratorEscalationTriggersPrompt } from "../_shared/fiis-doctrine.ts";
import { buildFIISLearningContext } from "../_shared/fiis-learning.ts";
import { buildFIISRuntimeContext } from "../_shared/fiis-runtime.ts";
import { loadFIISRuntimeTelemetry, persistFIISCoachingTelemetry } from "../_shared/fiis-telemetry.ts";
import { fetchFIISFamilyContext } from "../_shared/fiis-family-context.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const FIIS_AI_MODEL = Deno.env.get("FIIS_AI_MODEL") ?? Deno.env.get("FAMILYBRIDGE_AI_MODEL") ?? "google/gemini-3-flash-preview";
// Override in Lovable/Supabase env when needed. Default preserves current production behavior.


serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestStartedAt = Date.now();
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { familyId, imageBase64, pastedConversation, additionalContext, talkingToName, talkingToUserId } = await req.json();
    if (!familyId || (!imageBase64 && !pastedConversation)) {
      return new Response(JSON.stringify({ error: "Missing familyId or conversation content (image or text)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Check family membership OR organization membership (for moderators/providers)
    const { data: membership } = await supabase.from("family_members").select("id, role, relationship_type")
      .eq("family_id", familyId).eq("user_id", user.id).single();
    
    let userRole = membership?.role || "provider";
    let userRelationship = membership?.relationship_type || "provider";
    
    if (!membership) {
      // Check if user is an org member managing this family
      const { data: family } = await supabase.from("families").select("organization_id").eq("id", familyId).single();
      if (family?.organization_id) {
        const { data: orgMember } = await supabase.from("organization_members")
          .select("role").eq("organization_id", family.organization_id).eq("user_id", user.id).single();
        if (!orgMember) {
          return new Response(JSON.stringify({ error: "Not authorized for this family" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        userRole = "provider";
        userRelationship = `organization ${orgMember.role}`;
      } else {
        return new Response(JSON.stringify({ error: "Not authorized for this family" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    const [familyObservations, profileResult, talkingToDisplay, runtimeTelemetry] = await Promise.all([
      fetchFIISFamilyContext(supabase as any, familyId),
      supabase.from("profiles").select("full_name").eq("id", user.id).single(),
      (async () => {
        let display = talkingToName || "their loved one";
        if (talkingToUserId) {
          const { data: ttProfile } = await supabase.from("profiles").select("full_name").eq("id", talkingToUserId).single();
          if (ttProfile) display = ttProfile.full_name;
        }
        return display;
      })(),
      loadFIISRuntimeTelemetry(supabase, familyId),
    ]);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const runtimePrompt = await buildFIISRuntimeContext({
      supabase,
      familyId,
      audience: "family",
      mode: "coaching",
      plainLanguageSurface: true,
      contextText: `${pastedConversation || ''}\n${additionalContext || ''}\n${familyObservations}`,
      extraContext: [familyObservations],
    });

    const systemPrompt = `${runtimePrompt}

You are a text conversation coach helping families navigate difficult conversations during addiction recovery. You speak like a wise, caring friend — NOT like a therapist.

═══ CRITICAL LANGUAGE RULES ═══
- NEVER use clinical or therapy terms like "codependency", "triangulation", "HALT", "CRAFT", "attachment style", "cognitive distortion", "DBT", "differentiation", "enmeshment", etc.
- Use plain, everyday language that anyone would understand.
- Sound like a supportive friend who's been through tough times, not a textbook.
- Examples of what to do:
  • Say "You're taking on too much of their stuff" NOT "codependent behavior"
  • Say "Tell them how it makes YOU feel" NOT "Use an I-statement"
  • Say "That's more than you should have to handle" NOT "You need to set boundaries"
  • Say "Sometimes the kindest thing is to let them figure it out" NOT "Stop enabling"

═══ INTERNAL CLINICAL REFERENCE (never surface these terms) ═══
(Internal clinical knowledge omitted from prompt; rely on runtime doctrine context above.)

═══ CONTEXT ═══
Coaching: ${profileResult.data?.full_name || "a team member"} (${userRelationship || userRole})
Talking to: ${talkingToDisplay}

═══ FAMILY OBSERVATIONAL DATA ═══
${familyObservations || "No historical data available yet."}

═══ GOAL-DRIVEN COACHING ═══
Your PRIMARY job is to help this conversation support the family's goals, values, and boundaries listed above.

1. **Connect to their goals**: If they're working toward getting someone into treatment, guide the conversation toward that. If they're focused on aftercare, reinforce that.
2. **Reflect their values**: Naturally reference what the family says they care about (honesty, patience, etc.) without making it sound clinical.
3. **Guard their boundaries**: If the conversation is pushing past an agreed boundary, help them hold the line in a loving way.
4. **Know when enough is enough**: If continuing this conversation would set them back — going in circles, getting heated, or undermining their goals — suggest a warm way to wrap up that leaves the door open.

**Response Format (JSON):**
{
  "conversation_summary": "Brief summary of what's happening in plain language",
  "emotional_dynamics": "What's really going on emotionally, described like a friend would",
  "suggested_responses": [
    {
      "response": "Exact text they could send — warm, real, not clinical",
      "approach": "Brief plain-language description (5-10 words)",
      "when_to_use": "When this fits best"
    }
  ],
  "warning_signs": ["Any red flags, described in everyday language"],
  "coaching_tip": "A brief, friendly insight — like advice from a wise friend, connected to their family goals"
}

${buildModeratorEscalationTriggersPrompt()}

If the content reflects an immediate emergency, say exactly "Call 911 first" before anything else and then direct them to moderator/help.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: FIIS_AI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          imageBase64 ? {
            role: "user",
            content: [
              { type: "text", text: `Please analyze this text conversation screenshot and suggest how I should respond.${additionalContext ? `\n\nAdditional context: ${additionalContext}` : ""}` },
              { type: "image_url", image_url: { url: `data:image/png;base64,${imageBase64}` } },
            ],
          } : {
            role: "user",
            content: `Please analyze this conversation and suggest how I should respond.\n\n--- CONVERSATION ---\n${pastedConversation}\n--- END ---${additionalContext ? `\n\nAdditional context: ${additionalContext}` : ""}`,
          },
        ],
        tools: [{
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
        }],
        tool_choice: { type: "function", function: { name: "analyze_text_conversation" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      await persistFIISCoachingTelemetry({
        supabase,
        familyId,
        userId: user.id,
        sessionType: 'screenshot',
        aiModel: FIIS_AI_MODEL,
        startedAt: requestStartedAt,
        aiSummary: parsed?.conversation_summary || null,
        suggestions: parsed?.suggested_responses,
        usage: data?.usage || null,
        telemetry: runtimeTelemetry,
      });
      return new Response(JSON.stringify(parsed),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const content = data.choices?.[0]?.message?.content;
    if (content) {
      try {
        const parsed = JSON.parse(content);
        await persistFIISCoachingTelemetry({
          supabase,
          familyId,
          userId: user.id,
          sessionType: 'screenshot',
          aiModel: FIIS_AI_MODEL,
          startedAt: requestStartedAt,
          aiSummary: parsed?.conversation_summary || null,
          suggestions: parsed?.suggested_responses,
          usage: data?.usage || null,
          telemetry: runtimeTelemetry,
        });
        return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch {
        const fallbackPayload = {
          conversation_summary: "Analysis completed",
          emotional_dynamics: "See suggestions below",
          suggested_responses: [{ response: content, approach: "Friendly suggestion", when_to_use: "General response" }],
          coaching_tip: "Try telling them how you feel instead of what they did wrong.",
        };
        await persistFIISCoachingTelemetry({
          supabase,
          familyId,
          userId: user.id,
          sessionType: 'screenshot',
          aiModel: FIIS_AI_MODEL,
          startedAt: requestStartedAt,
          aiSummary: fallbackPayload.conversation_summary,
          suggestions: fallbackPayload.suggested_responses,
          usage: data?.usage || null,
          telemetry: runtimeTelemetry,
        });
        return new Response(JSON.stringify(fallbackPayload), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    throw new Error("No valid response from AI");
  } catch (error) {
    console.error("Screenshot coaching error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
