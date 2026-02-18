import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Condensed FIIS clinical knowledge for communication coaching
const FIIS_COMM_KNOWLEDGE = `
CRAFT METHOD: Reinforce positive behaviors, use "I" statements, avoid enabling while maintaining connection.
DE-ESCALATION: Validate emotions first, reflect what you hear, avoid "always/never", offer graceful exits.
BOUNDARY COMMUNICATION: State clearly, include consequence, follow through. "I love you AND this behavior is not acceptable."
DBT DEAR MAN: Describe, Express, Assert, Reinforce, Mindful, Appear confident, Negotiate.
CODEPENDENCY: The 3 C's — didn't cause it, can't cure it, can't control it. Detachment with love ≠ abandonment.
COGNITIVE DISTORTIONS: All-or-nothing, catastrophizing, mind reading, should statements, emotional reasoning.
FAMILY ROLES: Enabler, Hero, Scapegoat, Lost Child, Mascot — identify and guide away from dysfunctional roles.
TRAUMA-INFORMED: Prioritize safety, trustworthiness, choice. Recognize fight/flight/freeze/fawn responses.
`;

// Fetch family observational context
async function fetchFamilyContext(supabase: ReturnType<typeof createClient>, familyId: string) {
  const [sobrietyResult, boundariesResult, emotionalCheckinsResult, coachingSessionsResult] = await Promise.all([
    supabase.from("sobriety_journeys").select("start_date, reset_count").eq("family_id", familyId).eq("is_active", true).maybeSingle(),
    supabase.from("family_boundaries").select("content").eq("family_id", familyId).eq("status", "approved"),
    supabase.from("daily_emotional_checkins").select("feeling, was_bypassed").eq("family_id", familyId).order("check_in_date", { ascending: false }).limit(14),
    supabase.from("coaching_sessions").select("session_type, suggestions").eq("family_id", familyId).order("started_at", { ascending: false }).limit(5),
  ]);

  let ctx = "";
  if (sobrietyResult.data) {
    const days = Math.max(0, Math.floor((Date.now() - new Date(sobrietyResult.data.start_date).getTime()) / 86400000));
    ctx += `Sobriety: ${days} days. `;
  }
  if (boundariesResult.data?.length) ctx += `Boundaries: ${boundariesResult.data.map(b => b.content).join('; ')}. `;
  if (emotionalCheckinsResult.data?.length) {
    const feelings: Record<string, number> = {};
    emotionalCheckinsResult.data.forEach(c => { if (c.feeling) feelings[c.feeling] = (feelings[c.feeling] || 0) + 1; });
    ctx += `Recent emotional state: ${Object.entries(feelings).map(([f, c]) => `${f}(${c})`).join(', ')}. `;
  }
  if (coachingSessionsResult.data?.length) ctx += `Prior coaching sessions: ${coachingSessionsResult.data.length}. `;
  return ctx;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const { rawMessage, familyId } = await req.json();
    if (!rawMessage || !familyId) {
      return new Response(JSON.stringify({ error: "Missing rawMessage or familyId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Verify membership
    const { data: membership, error: membershipError } = await supabase
      .from("family_members").select("id").eq("family_id", familyId).eq("user_id", user.id).single();
    if (membershipError || !membership) {
      return new Response(JSON.stringify({ error: "Not authorized for this family" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch writing style and family context in parallel
    const [recentMessagesResult, familyObservations] = await Promise.all([
      supabase.from("messages").select("content").eq("family_id", familyId).eq("sender_id", user.id)
        .order("created_at", { ascending: false }).limit(10),
      fetchFamilyContext(supabase, familyId),
    ]);

    let userWritingStyle = "";
    if (recentMessagesResult.data && recentMessagesResult.data.length > 0) {
      userWritingStyle = `
Here are examples of how this person typically writes:
${recentMessagesResult.data.map((m, i) => `${i + 1}. "${m.content}"`).join("\n")}

Try to match their tone, vocabulary level, and communication style when suggesting alternatives.`;
    }

    const systemPrompt = `You are a compassionate communication coach powered by the Family Intervention Intelligence System (FIIS), specializing in family recovery dynamics.

${FIIS_COMM_KNOWLEDGE}

═══ FAMILY CONTEXT ═══
${familyObservations || "No historical data available yet."}

Your role is to help users express difficult emotions and concerns in ways that are:
- Non-confrontational and non-judgmental
- Using "I" statements instead of "you" accusations
- Focused on feelings and needs rather than blame
- Supportive of recovery while maintaining healthy boundaries
- Honest but kind
- Informed by the family's recovery journey and emotional patterns

${userWritingStyle}

When the user shares what they want to say, provide 2-3 alternative phrasings that:
1. Preserve their core message and intent
2. Match their natural writing style (casual, formal, etc.)
3. Remove potentially triggering or accusatory language
4. Focus on connection rather than conflict
5. Factor in the family's current recovery phase and dynamics

Format your response as a JSON object with this structure:
{
  "suggestions": [
    {
      "text": "the suggested message",
      "approach": "brief 5-10 word description of the approach"
    }
  ],
  "tip": "A brief tip about the communication principle used, informed by recovery context"
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
        tools: [{
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
                      text: { type: "string" },
                      approach: { type: "string" }
                    },
                    required: ["text", "approach"]
                  }
                },
                tip: { type: "string" }
              },
              required: ["suggestions", "tip"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "suggest_phrasings" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Please try again later." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      return new Response(JSON.stringify(JSON.parse(toolCall.function.arguments)),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const content = data.choices?.[0]?.message?.content;
    if (content) {
      try {
        return new Response(JSON.stringify(JSON.parse(content)), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch {
        return new Response(JSON.stringify({
          suggestions: [{ text: content, approach: "AI suggestion" }],
          tip: "Consider using 'I' statements to express your feelings."
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    throw new Error("No valid response from AI");
  } catch (error) {
    console.error("Communication helper error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
