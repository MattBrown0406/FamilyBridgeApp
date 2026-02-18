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

// Internal clinical knowledge (never exposed in suggestions)
const FIIS_COACHING_KNOWLEDGE = `
═══ FIIS OPERATIONAL CORE (use to INFORM your advice, but NEVER use clinical terminology in suggestions) ═══

PRIMARY OBJECTIVE: Protect the path to one year of continuous sobriety (strict abstinence — no harm reduction, no partial credit).
DECISION LOGIC: Early Phase → Sobriety protection | Mid Phase → Balanced | Late Phase → Sustainability | Confirmed relapse ALWAYS overrides.
SCORING AWARENESS: Recovery Stability Score, Family System Health Score, Boundary Integrity Index, Enabling Risk Index, Relapse Risk Level.
PHASE-SENSITIVE: 0–90d HIGH sensitivity | 90–180d MODERATE, pattern > event | 6–12m complacency drift HEAVY weight.
COMMUNICATION INTELLIGENCE: Analyze for minimization, deflection, blame-shifting, victim positioning, manipulation, gaslighting, emotional flooding, withdrawal silence, overconfidence.
BOUNDARY ENGINE: Evaluate clarity, measurability, enforceability, consequence definition. Unenforced consequences = Enabling Risk increase.
EMOTIONAL EXHAUSTION: Track hopeless language, cynicism, irritability, withdrawal, boundary fatigue across ALL family members.
VOICE: Interventionist + Systems Therapist. NEVER shame/moralize/catastrophize/minimize. Always pattern-based, data-supported, recovery-focused.
OPERATING PRINCIPLE: Structure > comfort | Pattern > event | System > individual | Long-term > short-term | Safety > analytics.

═══ CLINICAL FOUNDATIONS ═══
CRAFT: Reinforce positive behaviors, allow natural consequences. "I feel... when..." framing. Avoid enabling.
HALT: Hungry, Angry, Lonely, Tired — vulnerability states.
GORSKI: Overconfidence, defensiveness, isolation, "I don't care" attitude, thoughts of controlled use.
FAMILY ROLES: Enabler, Hero, Scapegoat, Lost Child, Mascot.
CODEPENDENCY: "Didn't cause it, can't cure it, can't control it." Detachment with love ≠ abandonment.
DE-ESCALATION: Validate emotions first, reflect what you hear, avoid "always/never", offer graceful exits.
BOUNDARY COMMUNICATION: State clearly, include consequence, follow through, separate person from behavior.
TRAUMA-INFORMED: Prioritize safety, trustworthiness, choice. Recognize fight/flight/freeze/fawn.
CRISIS: If suicide/self-harm detected → recommend 988 immediately.
`;

// Fetch family observational data including goals, values, boundaries
async function fetchFamilyContext(supabase: ReturnType<typeof createClient>, familyId: string) {
  const [
    sobrietyResult, boundariesResult, emotionalCheckinsResult, meetingCheckinsResult,
    messagesResult, financialRequestsResult, coachingSessionsResult, medicationsResult,
    providerNotesResult, aftercarePlansResult, aftercareRecsResult,
    goalsResult, valuesResult, commonGoalsResult,
  ] = await Promise.all([
    supabase.from("sobriety_journeys").select("start_date, reset_count").eq("family_id", familyId).eq("is_active", true).maybeSingle(),
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
    supabase.from("family_goals").select("goal_type, completed_at").eq("family_id", familyId),
    supabase.from("family_values").select("value_key").eq("family_id", familyId),
    supabase.from("family_common_goals").select("goal_key, completed_at").eq("family_id", familyId),
  ]);

  let ctx = "";

  // Goals (most important)
  const activeGoals = (commonGoalsResult.data || []).filter(g => !g.completed_at);
  const completedGoals = (commonGoalsResult.data || []).filter(g => g.completed_at);
  if (activeGoals.length > 0 || completedGoals.length > 0) {
    ctx += `FAMILY GOALS (guide ALL coaching around these):\n`;
    if (activeGoals.length > 0) ctx += `Active: ${activeGoals.map(g => GOAL_LABELS[g.goal_key] || g.goal_key.replace(/_/g, ' ')).join(', ')}\n`;
    if (completedGoals.length > 0) ctx += `Completed: ${completedGoals.map(g => GOAL_LABELS[g.goal_key] || g.goal_key.replace(/_/g, ' ')).join(', ')}\n`;
  }

  // Values
  if (valuesResult.data?.length) {
    ctx += `FAMILY VALUES: ${valuesResult.data.map(v => VALUE_LABELS[v.value_key] || v.value_key.replace(/_/g, ' ')).join(', ')}\n`;
  }

  // Boundaries
  if (boundariesResult.data?.length) ctx += `BOUNDARIES: ${boundariesResult.data.map((b, i) => `${i + 1}. ${b.content}`).join('; ')}\n`;

  if (sobrietyResult.data) {
    const days = Math.max(0, Math.floor((Date.now() - new Date(sobrietyResult.data.start_date).getTime()) / 86400000));
    let phase = days <= 30 ? "Early Recovery" : days <= 90 ? "Building Foundation" : days <= 180 ? "Developing Resilience" : days <= 365 ? "Strengthening" : "Maintenance";
    ctx += `SOBRIETY: ${days} days. Phase: ${phase}. ${sobrietyResult.data.reset_count > 0 ? `Attempt #${sobrietyResult.data.reset_count + 1}.` : ''}\n`;
  }
  if (emotionalCheckinsResult.data?.length) {
    const feelings: Record<string, number> = {};
    emotionalCheckinsResult.data.forEach(c => { if (c.feeling) feelings[c.feeling] = (feelings[c.feeling] || 0) + 1; });
    ctx += `EMOTIONAL STATE: ${Object.entries(feelings).map(([f, c]) => `${f}(${c})`).join(', ')}\n`;
  }
  if (meetingCheckinsResult.data?.length) {
    const now = Date.now();
    const recent7 = meetingCheckinsResult.data.filter(c => new Date(c.checked_in_at).getTime() >= now - 604800000).length;
    ctx += `MEETINGS: ${recent7} in last 7 days.\n`;
  }
  if (messagesResult.data?.length) {
    const keywords: Record<string, string[]> = {
      relapse_warning: ['relapse', 'slip', 'used', 'drank', 'high'],
      isolation: ['alone', 'leave me alone', 'need space', 'fine'],
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
  if (coachingSessionsResult.data?.length) ctx += `PRIOR COACHING: ${coachingSessionsResult.data.length} sessions.\n`;
  if (medicationsResult.data?.length) ctx += `MEDICATIONS: ${medicationsResult.data.map(m => m.medication_name).join(', ')}\n`;
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

    const systemPrompt = `You are a text conversation coach helping families navigate difficult conversations during addiction recovery. You speak like a wise, caring friend — NOT like a therapist.

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
${FIIS_COACHING_KNOWLEDGE}

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
          suggested_responses: [{ response: content, approach: "Friendly suggestion", when_to_use: "General response" }],
          coaching_tip: "Try telling them how you feel instead of what they did wrong.",
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
