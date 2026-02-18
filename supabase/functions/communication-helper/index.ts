import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Goal and value label maps
const GOAL_LABELS: Record<string, string> = {
  complete_intervention: "Complete Family Intervention",
  enter_treatment: "Enter Treatment Program",
  complete_treatment: "Complete Treatment Program",
  establish_support_network: "Build a Recovery Support Network",
  family_therapy_sessions: "Complete 8 Family Therapy Sessions",
  "90_meetings_90_days": "Attend 90 Meetings in 90 Days",
  living_amends_plan: "Create Living Amends Plan",
  family_recovery_milestones: "Celebrate 6-Month Family Recovery",
  rebuild_financial_trust: "Restore Financial Accountability",
  one_year_celebration: "Celebrate One Year of Sobriety",
};

const VALUE_LABELS: Record<string, string> = {
  honesty: "Honesty & Transparency",
  accountability: "Accountability Without Shame",
  boundaries: "Healthy Boundaries",
  support_not_enabling: "Support Without Enabling",
  patience: "Patience & Progress",
  forgiveness: "Forgiveness & Moving Forward",
  self_care: "Self-Care for Everyone",
  consistency: "Consistency & Follow-Through",
  communication: "Compassionate Communication",
  hope: "Hope & Faith in Recovery",
};

// Internal clinical reference (never surface terms to user)
const FIIS_COMM_KNOWLEDGE = `
CRAFT: Reinforce positive behaviors, use "I feel... when..." framing, avoid enabling.
DE-ESCALATION: Validate emotions first, reflect what you hear, avoid "always/never", offer graceful exits.
BOUNDARY COMMUNICATION: State clearly, include consequence, follow through.
CODEPENDENCY: Didn't cause it, can't cure it, can't control it. Detachment with love ≠ abandonment.
FAMILY ROLES: Enabler, Hero, Scapegoat, Lost Child, Mascot.
TRAUMA-INFORMED: Prioritize safety, trustworthiness, choice.
`;

// Fetch family context including goals, values, boundaries
async function fetchFamilyContext(supabase: ReturnType<typeof createClient>, familyId: string) {
  const [sobrietyResult, boundariesResult, emotionalCheckinsResult, coachingSessionsResult, valuesResult, commonGoalsResult] = await Promise.all([
    supabase.from("sobriety_journeys").select("start_date, reset_count").eq("family_id", familyId).eq("is_active", true).maybeSingle(),
    supabase.from("family_boundaries").select("content").eq("family_id", familyId).eq("status", "approved"),
    supabase.from("daily_emotional_checkins").select("feeling, was_bypassed").eq("family_id", familyId).order("check_in_date", { ascending: false }).limit(14),
    supabase.from("coaching_sessions").select("session_type, suggestions").eq("family_id", familyId).order("started_at", { ascending: false }).limit(5),
    supabase.from("family_values").select("value_key").eq("family_id", familyId),
    supabase.from("family_common_goals").select("goal_key, completed_at").eq("family_id", familyId),
  ]);

  let ctx = "";

  // Goals first (drives focus)
  const activeGoals = (commonGoalsResult.data || []).filter(g => !g.completed_at);
  if (activeGoals.length > 0) {
    ctx += `Family goals: ${activeGoals.map(g => GOAL_LABELS[g.goal_key] || g.goal_key.replace(/_/g, ' ')).join(', ')}. `;
  }

  // Values
  if (valuesResult.data?.length) {
    ctx += `Family values: ${valuesResult.data.map(v => VALUE_LABELS[v.value_key] || v.value_key.replace(/_/g, ' ')).join(', ')}. `;
  }

  // Boundaries
  if (boundariesResult.data?.length) ctx += `Boundaries: ${boundariesResult.data.map(b => b.content).join('; ')}. `;

  if (sobrietyResult.data) {
    const days = Math.max(0, Math.floor((Date.now() - new Date(sobrietyResult.data.start_date).getTime()) / 86400000));
    ctx += `Sobriety: ${days} days. `;
  }
  if (emotionalCheckinsResult.data?.length) {
    const feelings: Record<string, number> = {};
    emotionalCheckinsResult.data.forEach(c => { if (c.feeling) feelings[c.feeling] = (feelings[c.feeling] || 0) + 1; });
    ctx += `Recent feelings: ${Object.entries(feelings).map(([f, c]) => `${f}(${c})`).join(', ')}. `;
  }
  if (coachingSessionsResult.data?.length) ctx += `Prior coaching: ${coachingSessionsResult.data.length} sessions. `;
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

    const { data: membership, error: membershipError } = await supabase
      .from("family_members").select("id").eq("family_id", familyId).eq("user_id", user.id).single();
    if (membershipError || !membership) {
      return new Response(JSON.stringify({ error: "Not authorized for this family" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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

Match their tone, vocabulary, and style when suggesting alternatives.`;
    }

    const systemPrompt = `You are a caring communication coach helping someone rephrase a message to their family during addiction recovery. You sound like a thoughtful friend — warm, direct, and real.

═══ CRITICAL LANGUAGE RULES ═══
- NEVER use therapy jargon like "I-statement", "boundary", "codependent", "enabling", "CRAFT", "HALT", "DBT", "triangulation", etc.
- Use plain, everyday language.
- Your tip should sound like friendly advice, not a therapy lesson.
- Examples:
  • Say "Try telling them how it makes YOU feel" NOT "Use an I-statement"
  • Say "Sometimes helping too much actually hurts" NOT "You're enabling"
  • Say "You don't have to fix this for them" NOT "Practice detachment with love"

═══ INTERNAL REFERENCE (never surface these terms) ═══
${FIIS_COMM_KNOWLEDGE}

═══ FAMILY CONTEXT ═══
${familyObservations || "No historical data available yet."}

═══ GOAL-DRIVEN REPHRASING ═══
When rephrasing, consider:
1. **Does this message support the family's goals?** If their goal is getting into treatment, help shape the message toward that. If the goal is aftercare compliance, lean into that.
2. **Does it align with their values?** If they value honesty, keep it honest. If they value patience, soften the urgency.
3. **Does it respect their boundaries?** Don't help them say something that violates an agreed-upon boundary.
4. **Would sending this help or hurt?** If the message would make things worse, gently suggest they might want to wait or say something different entirely.

${userWritingStyle}

When the user shares what they want to say, provide 2-3 alternative phrasings that:
1. Keep what they actually mean
2. Sound like THEM (match their style)
3. Take out anything that could start a fight
4. Focus on connecting, not blaming
5. Support what the family is working toward right now

Format as JSON:
{
  "suggestions": [
    {
      "text": "the suggested message — warm and real, not clinical",
      "approach": "brief plain-language description (5-10 words)"
    }
  ],
  "tip": "A brief, friendly insight — like advice from a wise friend, connected to the family's goals"
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
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
          suggestions: [{ text: content, approach: "Friendly suggestion" }],
          tip: "Try focusing on how you feel instead of what they did."
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
