import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Condensed FIIS clinical knowledge for screenshot coaching context
const FIIS_COACHING_KNOWLEDGE = `
CRAFT METHOD: Reinforce positive behaviors, allow natural consequences. Use "I" statements. Avoid enabling while maintaining connection.
HALT FRAMEWORK: Hungry, Angry, Lonely, Tired — vulnerability states that increase risk.
GORSKI WARNING SIGNS: Overconfidence, defensiveness, isolation, "I don't care" attitude, thoughts of controlled use.
FAMILY ROLES: Enabler (covering up), Hero (over-achieving), Scapegoat (acting out), Lost Child (withdrawing), Mascot (deflecting with humor).
CODEPENDENCY: The 3 C's — "We didn't cause it, we can't cure it, we can't control it." Detachment with love ≠ abandonment.
STAGES OF CHANGE: Match response to person's readiness (precontemplation → maintenance).
DE-ESCALATION: Lower voice, validate emotions first, reflect what you hear, avoid "always/never", offer graceful exits, leave the door open.
BOUNDARY COMMUNICATION: State clearly, include consequence, follow through, separate person from behavior. "I love you AND this behavior is not acceptable."
DBT DEAR MAN: Describe, Express, Assert, Reinforce, Mindful, Appear confident, Negotiate.
TRAUMA-INFORMED: Prioritize safety, trustworthiness, choice, avoid re-traumatization. Recognize fight/flight/freeze/fawn responses.
ATTACHMENT: Anxious (fear of abandonment), Avoidant (emotional distance), Disorganized (push-pull). Inform coaching approach accordingly.
COGNITIVE DISTORTIONS: All-or-nothing thinking, catastrophizing, mind reading, should statements, emotional reasoning.
CRISIS: If suicide/self-harm indicators detected, recommend 988 immediately. Never manage crisis internally.
`;

// Fetch family observational data for contextual coaching
async function fetchFamilyContext(supabase: ReturnType<typeof createClient>, familyId: string) {
  const [
    sobrietyResult, boundariesResult, emotionalCheckinsResult, meetingCheckinsResult,
    messagesResult, financialRequestsResult, coachingSessionsResult, medicationsResult,
    providerNotesResult, aftercarePlansResult, aftercareRecsResult,
  ] = await Promise.all([
    supabase.from("sobriety_journeys").select("start_date, reset_count, is_active").eq("family_id", familyId).eq("is_active", true).maybeSingle(),
    supabase.from("family_boundaries").select("content").eq("family_id", familyId).eq("status", "approved"),
    supabase.from("daily_emotional_checkins").select("feeling, was_bypassed").eq("family_id", familyId).order("check_in_date", { ascending: false }).limit(30),
    supabase.from("meeting_checkins").select("checked_in_at, meeting_type, overdue_alert_sent").eq("family_id", familyId).order("checked_in_at", { ascending: false }).limit(50),
    supabase.from("messages").select("content, created_at").eq("family_id", familyId).order("created_at", { ascending: false }).limit(200),
    supabase.from("financial_requests").select("amount, status, created_at").eq("family_id", familyId).order("created_at", { ascending: false }).limit(20),
    supabase.from("coaching_sessions").select("session_type, started_at, suggestions, talking_to_name").eq("family_id", familyId).order("started_at", { ascending: false }).limit(10),
    supabase.from("medications").select("medication_name, dosage").eq("family_id", familyId).eq("is_active", true),
    supabase.from("provider_notes").select("note_type, content").eq("family_id", familyId).eq("include_in_ai_analysis", true).order("created_at", { ascending: false }).limit(10),
    supabase.from("aftercare_plans").select("id, is_active").eq("family_id", familyId).eq("is_active", true),
    supabase.from("aftercare_recommendations").select("plan_id, recommendation_type, title, is_completed").order("created_at", { ascending: false }).limit(50),
  ]);

  let ctx = "";

  if (sobrietyResult.data) {
    const days = Math.max(0, Math.floor((Date.now() - new Date(sobrietyResult.data.start_date).getTime()) / 86400000));
    let phase = days <= 30 ? "Early Recovery" : days <= 90 ? "Building Foundation" : days <= 180 ? "Developing Resilience" : days <= 365 ? "Strengthening" : "Maintenance";
    ctx += `SOBRIETY: ${days} days. Phase: ${phase}. ${sobrietyResult.data.reset_count > 0 ? `Attempt #${sobrietyResult.data.reset_count + 1}.` : ''}\n`;
  }
  if (boundariesResult.data?.length) ctx += `BOUNDARIES: ${boundariesResult.data.map((b, i) => `${i + 1}. ${b.content}`).join('; ')}\n`;
  if (emotionalCheckinsResult.data?.length) {
    const checkins = emotionalCheckinsResult.data;
    const bypassed = checkins.filter(c => c.was_bypassed).length;
    const feelings: Record<string, number> = {};
    checkins.forEach(c => { if (c.feeling) feelings[c.feeling] = (feelings[c.feeling] || 0) + 1; });
    ctx += `EMOTIONAL STATE: ${checkins.length} check-ins. Bypassed: ${bypassed}. Feelings: ${Object.entries(feelings).map(([f, c]) => `${f}(${c})`).join(', ')}\n`;
  }
  if (meetingCheckinsResult.data?.length) {
    const now = Date.now();
    const recent7 = meetingCheckinsResult.data.filter(c => new Date(c.checked_in_at).getTime() >= now - 604800000).length;
    const recent30 = meetingCheckinsResult.data.filter(c => new Date(c.checked_in_at).getTime() >= now - 2592000000).length;
    ctx += `MEETINGS: Last 7 days: ${recent7}. Last 30 days: ${recent30}.\n`;
  }
  if (messagesResult.data?.length) {
    const keywords: Record<string, string[]> = {
      relapse_warning: ['relapse', 'slip', 'used', 'drank', 'high'],
      isolation: ['alone', 'leave me alone', 'need space', 'fine'],
      halt_states: ['exhausted', 'angry', 'lonely', 'overwhelmed', 'stressed'],
      crisis: ['end it', 'no point', 'better off without me', 'give up', 'worthless'],
      progress: ['proud', 'meeting', 'sponsor', 'therapy', 'grateful', 'sober'],
    };
    const counts: Record<string, number> = {};
    Object.keys(keywords).forEach(k => counts[k] = 0);
    messagesResult.data.forEach(m => {
      const content = (m.content || '').toLowerCase();
      Object.entries(keywords).forEach(([cat, kws]) => kws.forEach(kw => { if (content.includes(kw)) counts[cat]++; }));
    });
    const sig = Object.entries(counts).filter(([, c]) => c > 0);
    if (sig.length) ctx += `CHAT SIGNALS: ${sig.map(([k, v]) => `${k.replace(/_/g, ' ')}(${v})`).join(', ')}\n`;
  }
  if (financialRequestsResult.data?.length) {
    const total = financialRequestsResult.data.reduce((s, r) => s + (r.amount || 0), 0);
    ctx += `FINANCIAL: ${financialRequestsResult.data.length} requests totaling $${total}.\n`;
  }
  if (coachingSessionsResult.data?.length) {
    ctx += `PRIOR COACHING: ${coachingSessionsResult.data.length} sessions.\n`;
  }
  if (medicationsResult.data?.length) {
    ctx += `MEDICATIONS: ${medicationsResult.data.map(m => m.medication_name).join(', ')}\n`;
  }
  if (providerNotesResult.data?.length) {
    ctx += `PROVIDER NOTES:\n${providerNotesResult.data.map((n, i) => `${i + 1}. [${n.note_type}] ${n.content}`).join('\n')}\n`;
  }
  if (aftercarePlansResult.data?.length) {
    const planIds = aftercarePlansResult.data.map(p => p.id);
    const recs = (aftercareRecsResult.data || []).filter(r => planIds.includes(r.plan_id));
    if (recs.length) {
      const done = recs.filter(r => r.is_completed).length;
      ctx += `AFTERCARE: ${done}/${recs.length} completed (${Math.round((done / recs.length) * 100)}%).\n`;
    }
  }

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

    const { familyId, imageBase64, additionalContext, talkingToName, talkingToUserId } = await req.json();
    if (!familyId || !imageBase64) {
      return new Response(JSON.stringify({ error: "Missing familyId or image" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Verify membership
    const { data: membership } = await supabase.from("family_members").select("id, role, relationship_type")
      .eq("family_id", familyId).eq("user_id", user.id).single();
    if (!membership) {
      return new Response(JSON.stringify({ error: "Not authorized for this family" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch all context in parallel
    const [familyObservations, profileResult, talkingToDisplay] = await Promise.all([
      fetchFamilyContext(supabase, familyId),
      supabase.from("profiles").select("full_name").eq("id", user.id).single(),
      (async () => {
        let display = talkingToName || "their loved one";
        if (talkingToUserId) {
          const { data: ttProfile } = await supabase.from("profiles").select("full_name").eq("id", talkingToUserId).single();
          if (ttProfile) display = ttProfile.full_name;
        }
        return display;
      })(),
    ]);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are FIIS Text Coaching — an expert communication coach powered by the Family Intervention Intelligence System for families dealing with addiction and recovery.

${FIIS_COACHING_KNOWLEDGE}

═══ FAMILY-SPECIFIC CONTEXT ═══
Coaching: ${profileResult.data?.full_name || "a family member"} (${membership.relationship_type || membership.role})
Talking to: ${talkingToDisplay}

═══ FAMILY OBSERVATIONAL DATA ═══
${familyObservations || "No historical data available yet."}

Use your clinical knowledge AND the family's observational history to provide contextually aware analysis. Factor in sobriety phase, emotional patterns, boundary history, meeting attendance trends, and prior coaching sessions when crafting suggestions.

**Your Task:**
1. Read and understand the text conversation in the screenshot
2. Identify emotional dynamics using your clinical knowledge (HALT, Gorski, attachment patterns, family roles)
3. Provide specific response suggestions informed by the family's recovery journey
4. Flag any concerning patterns connected to observational data

**Response Format (JSON):**
{
  "conversation_summary": "Brief summary of what's happening in the text exchange",
  "emotional_dynamics": "What emotions and clinical patterns you see at play",
  "suggested_responses": [
    {
      "response": "The exact text they could send",
      "approach": "Brief description of this approach (5-10 words)",
      "when_to_use": "When this response is most appropriate"
    }
  ],
  "warning_signs": ["Any concerning patterns you notice, connected to observational data"],
  "coaching_tip": "A broader coaching insight for the family member, informed by their recovery context"
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
              { type: "text", text: `Please analyze this text conversation screenshot and suggest how I should respond.${additionalContext ? `\n\nAdditional context: ${additionalContext}` : ""}` },
              { type: "image_url", image_url: { url: `data:image/png;base64,${imageBase64}` } },
            ],
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
          conversation_summary: "Analysis completed",
          emotional_dynamics: "See suggestions below",
          suggested_responses: [{ response: content, approach: "AI suggestion", when_to_use: "General response" }],
          coaching_tip: "Consider using 'I' statements to express your feelings.",
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    throw new Error("No valid response from AI");
  } catch (error) {
    console.error("Screenshot coaching error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
