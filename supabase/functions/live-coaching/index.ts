import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Goal and value label maps for human-readable context
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

// ============================================================================
// FIIS COACHING KNOWLEDGE (Internal reference — NOT exposed in suggestions)
// ============================================================================

const FIIS_COACHING_KNOWLEDGE = `
═══ FIIS OPERATIONAL CORE (use to INFORM your advice, but NEVER use clinical terminology in suggestions) ═══

PRIMARY OBJECTIVE: Protect the path to one year of continuous sobriety (strict abstinence — no harm reduction, no partial credit).
SECONDARY OBJECTIVE: Build a resilient, boundary-consistent, emotionally regulated family system.
DECISION LOGIC: Early Phase → Sobriety protection | Mid Phase → Balanced | Late Phase → Sustainability | Confirmed relapse ALWAYS overrides.

SCORING AWARENESS: You inform Recovery Stability Score, Family System Health Score, Boundary Integrity Index, Enabling Risk Index, and Relapse Risk Level.

PHASE-SENSITIVE WEIGHTING:
- 0–90 days: HIGH silence/aftercare/boundary sensitivity, LOW complacency weighting
- 90–180 days: MODERATE drift sensitivity, pattern > event, BEGIN complacency detection
- 6–12 months: Complacency drift HEAVILY weighted, structure erosion detection, family fatigue

COMMUNICATION INTELLIGENCE: Analyze for minimization, deflection, blame-shifting, victim positioning, urgency language, manipulation markers, gaslighting, emotional flooding, withdrawal silence, overconfidence. Use contextual modeling, NOT keyword-only analysis.

BOUNDARY ENGINE: Evaluate boundaries for clarity, measurability, enforceability, consequence definition. Unenforced consequences = Enabling Risk increase.

EMOTIONAL EXHAUSTION: Track hopeless language, cynicism, irritability spikes, withdrawal, boundary fatigue, passive disengagement in ALL family members.

VOICE: Interventionist + Systems Therapist. Tone ladder: gentle → direct → firm. NEVER shame/moralize/catastrophize/minimize.

OPERATING PRINCIPLE: When uncertain → structure > comfort, pattern > event, system > individual, long-term > short-term, safety > analytics.

═══ CLINICAL FOUNDATIONS ═══
CRAFT METHOD: Reinforce positive behaviors, allow natural consequences. Use "I feel... when..." framing. Avoid enabling.
HALT FRAMEWORK: Hungry, Angry, Lonely, Tired — vulnerability states.
GORSKI WARNING SIGNS: Overconfidence, defensiveness, isolation, "I don't care" attitude, thoughts of controlled use.
FAMILY ROLES: Enabler (covering up), Hero (over-achieving), Scapegoat (acting out), Lost Child (withdrawing), Mascot (deflecting with humor).
CODEPENDENCY: "We didn't cause it, can't cure it, can't control it." Detachment with love ≠ abandonment.
STAGES OF CHANGE: Match coaching to readiness level.
DE-ESCALATION: Lower voice, validate emotions first, reflect what you hear, avoid "always/never", offer graceful exits.
BOUNDARY COMMUNICATION: State clearly, include consequence, follow through, separate person from behavior.
DBT INTERPERSONAL EFFECTIVENESS: Describe situation, express feelings, assert needs, reinforce why it matters.
TRAUMA-INFORMED: Prioritize safety, trustworthiness, choice. Recognize fight/flight/freeze/fawn.
ATTACHMENT PATTERNS: Inform approach based on anxious, avoidant, or disorganized patterns.
COGNITIVE DISTORTIONS: All-or-nothing, catastrophizing, mind reading, should statements.
CRISIS: If suicide/self-harm detected → recommend 988 immediately. Never manage crisis internally.
`;

// Fetch comprehensive family context including goals, values, and boundaries
async function fetchFamilyContext(supabase: ReturnType<typeof createClient>, familyId: string) {
  const [
    sobrietyResult, boundariesResult, emotionalCheckinsResult, meetingCheckinsResult,
    messagesResult, financialRequestsResult, coachingSessionsResult, medicationsResult,
    providerNotesResult, aftercarePlansResult, aftercareRecsResult, calibrationPatternsResult,
    goalsResult, valuesResult, commonGoalsResult,
  ] = await Promise.all([
    supabase.from("sobriety_journeys").select("start_date, reset_count, is_active").eq("family_id", familyId).eq("is_active", true).maybeSingle(),
    supabase.from("family_boundaries").select("content, status").eq("family_id", familyId).eq("status", "approved"),
    supabase.from("daily_emotional_checkins").select("feeling, was_bypassed, check_in_date, bypass_inferred_state").eq("family_id", familyId).order("check_in_date", { ascending: false }).limit(30),
    supabase.from("meeting_checkins").select("checked_in_at, checked_out_at, meeting_type, overdue_alert_sent").eq("family_id", familyId).order("checked_in_at", { ascending: false }).limit(50),
    supabase.from("messages").select("content, created_at, sender_id").eq("family_id", familyId).order("created_at", { ascending: false }).limit(200),
    supabase.from("financial_requests").select("amount, reason, status, created_at").eq("family_id", familyId).order("created_at", { ascending: false }).limit(20),
    supabase.from("coaching_sessions").select("session_type, started_at, ended_at, suggestions, talking_to_name, talking_to_user_id").eq("family_id", familyId).order("started_at", { ascending: false }).limit(20),
    supabase.from("medications").select("medication_name, dosage, is_active").eq("family_id", familyId).eq("is_active", true),
    supabase.from("provider_notes").select("note_type, content, confidence_level, created_at").eq("family_id", familyId).eq("include_in_ai_analysis", true).order("created_at", { ascending: false }).limit(10),
    supabase.from("aftercare_plans").select("id, is_active").eq("family_id", familyId).eq("is_active", true),
    supabase.from("aftercare_recommendations").select("plan_id, recommendation_type, title, is_completed, frequency").order("created_at", { ascending: false }).limit(50),
    supabase.from("fiis_calibration_patterns").select("pattern_name, pattern_description, trigger_keywords, trigger_behaviors, suggested_response, fellowship").eq("is_active", true),
    supabase.from("family_goals").select("goal_type, completed_at").eq("family_id", familyId),
    supabase.from("family_values").select("value_key").eq("family_id", familyId),
    supabase.from("family_common_goals").select("goal_key, completed_at").eq("family_id", familyId),
  ]);

  let context = "";

  // Family Goals (most important — drives coaching focus)
  const activeGoals = (commonGoalsResult.data || []).filter(g => !g.completed_at);
  const completedGoals = (commonGoalsResult.data || []).filter(g => g.completed_at);
  if (activeGoals.length > 0 || completedGoals.length > 0) {
    context += `\nFAMILY GOALS (guide ALL coaching around these):\n`;
    if (activeGoals.length > 0) {
      context += `Active goals: ${activeGoals.map(g => GOAL_LABELS[g.goal_key] || g.goal_key.replace(/_/g, ' ')).join(', ')}\n`;
    }
    if (completedGoals.length > 0) {
      context += `Completed: ${completedGoals.map(g => GOAL_LABELS[g.goal_key] || g.goal_key.replace(/_/g, ' ')).join(', ')}\n`;
    }
  }

  // Family Values
  if (valuesResult.data && valuesResult.data.length > 0) {
    context += `\nFAMILY VALUES (reference these when coaching): ${valuesResult.data.map(v => VALUE_LABELS[v.value_key] || v.value_key.replace(/_/g, ' ')).join(', ')}\n`;
  }

  // Approved boundaries
  if (boundariesResult.data && boundariesResult.data.length > 0) {
    context += `\nFAMILY BOUNDARIES:\n${boundariesResult.data.map((b, i) => `${i + 1}. ${b.content}`).join("\n")}\n`;
  }

  // Sobriety journey
  if (sobrietyResult.data) {
    const startDate = new Date(sobrietyResult.data.start_date);
    const today = new Date();
    startDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const currentDays = Math.max(0, Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    let phase = "";
    if (currentDays <= 30) phase = "Early Recovery (high vulnerability)";
    else if (currentDays <= 90) phase = "Building Foundation";
    else if (currentDays <= 180) phase = "Developing Resilience";
    else if (currentDays <= 270) phase = "Strengthening Commitment";
    else if (currentDays <= 365) phase = "Approaching One-Year Milestone";
    else phase = "Beyond One Year (maintenance)";
    const resetInfo = sobrietyResult.data.reset_count > 0 ? ` Recovery attempt #${sobrietyResult.data.reset_count + 1}.` : "";
    context += `\nSOBRIETY: ${currentDays} days sober. Phase: ${phase}.${resetInfo}\n`;
  }

  // Emotional check-in patterns
  if (emotionalCheckinsResult.data && emotionalCheckinsResult.data.length > 0) {
    const checkins = emotionalCheckinsResult.data;
    const bypassedCount = checkins.filter(c => c.was_bypassed).length;
    const feelings: Record<string, number> = {};
    checkins.forEach(c => { if (c.feeling) feelings[c.feeling] = (feelings[c.feeling] || 0) + 1; });
    const negativeFeelings = ['awful', 'struggling', 'anxious', 'sad', 'angry', 'overwhelmed'];
    const negativeCount = checkins.filter(c => negativeFeelings.includes(c.feeling?.toLowerCase() || '')).length;
    context += `\nEMOTIONAL STATE (Last 30 check-ins): ${checkins.length} total. Bypassed: ${bypassedCount}. Negative states: ${negativeCount}. Distribution: ${Object.entries(feelings).map(([f, c]) => `${f}(${c})`).join(', ')}\n`;
  }

  // Meeting attendance
  if (meetingCheckinsResult.data && meetingCheckinsResult.data.length > 0) {
    const checkins = meetingCheckinsResult.data;
    const now = new Date();
    const last7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recent7 = checkins.filter(c => new Date(c.checked_in_at) >= last7).length;
    const recent30 = checkins.filter(c => new Date(c.checked_in_at) >= last30).length;
    context += `\nMEETING ATTENDANCE: Last 7 days: ${recent7}. Last 30 days: ${recent30}.\n`;
  }

  // Chat pattern signals
  if (messagesResult.data && messagesResult.data.length > 0) {
    const keywordCategories: Record<string, string[]> = {
      relapse_warning: ['relapse', 'slip', 'slipped', 'used', 'drank', 'high', 'drunk'],
      isolation: ['alone', 'leave me alone', 'need space', 'fine', 'whatever'],
      halt_states: ['exhausted', 'angry', 'lonely', 'starving', 'frustrated', 'cant sleep', 'overwhelmed', 'stressed'],
      boundary_testing: ['just this once', 'exception', 'emergency', 'promise', 'last time'],
      crisis: ['end it', 'no point', 'better off without me', 'cant go on', 'give up', 'worthless', 'burden'],
      progress: ['proud', 'meeting', 'sponsor', 'therapy', 'progress', 'milestone', 'grateful', 'recovery', 'sober'],
    };
    const categoryMentions: Record<string, number> = {};
    Object.keys(keywordCategories).forEach(cat => categoryMentions[cat] = 0);
    messagesResult.data.forEach(m => {
      const content = (m.content || '').toLowerCase();
      Object.entries(keywordCategories).forEach(([category, keywords]) => {
        keywords.forEach(kw => { if (content.includes(kw)) categoryMentions[category]++; });
      });
    });
    const significant = Object.entries(categoryMentions).filter(([, count]) => count > 0);
    if (significant.length > 0) {
      context += `\nCHAT PATTERN SIGNALS: ${significant.map(([cat, count]) => `${cat.replace(/_/g, ' ')}(${count})`).join(', ')}\n`;
    }
  }

  // Financial patterns
  if (financialRequestsResult.data && financialRequestsResult.data.length > 0) {
    const requests = financialRequestsResult.data;
    const totalAmount = requests.reduce((sum, r) => sum + (r.amount || 0), 0);
    context += `\nFINANCIAL PATTERNS: ${requests.length} recent requests totaling $${totalAmount}.\n`;
  }

  // Prior coaching
  if (coachingSessionsResult.data && coachingSessionsResult.data.length > 0) {
    context += `\nPRIOR COACHING: ${coachingSessionsResult.data.length} sessions.\n`;
  }

  // Medications
  if (medicationsResult.data && medicationsResult.data.length > 0) {
    context += `\nACTIVE MEDICATIONS: ${medicationsResult.data.map(m => `${m.medication_name}${m.dosage ? ` (${m.dosage})` : ''}`).join(', ')}\n`;
  }

  // Provider notes
  if (providerNotesResult.data && providerNotesResult.data.length > 0) {
    context += `\nPROVIDER NOTES:\n${providerNotesResult.data.map((n, i) => `${i + 1}. [${n.note_type}] ${n.content}`).join('\n')}\n`;
  }

  // Aftercare compliance
  if (aftercarePlansResult.data && aftercarePlansResult.data.length > 0) {
    const activePlanIds = aftercarePlansResult.data.map(p => p.id);
    const relevantRecs = (aftercareRecsResult.data || []).filter(r => activePlanIds.includes(r.plan_id));
    if (relevantRecs.length > 0) {
      const completed = relevantRecs.filter(r => r.is_completed).length;
      const rate = Math.round((completed / relevantRecs.length) * 100);
      context += `\nAFTERCARE COMPLIANCE: ${completed}/${relevantRecs.length} recommendations completed (${rate}%).\n`;
    }
  }

  // Calibration patterns
  if (calibrationPatternsResult.data && calibrationPatternsResult.data.length > 0) {
    const patterns = calibrationPatternsResult.data.slice(0, 10);
    context += `\nCALIBRATED WARNING PATTERNS:\n${patterns.map(p => `- ${p.pattern_name}: ${p.pattern_description}${p.suggested_response ? ` → ${p.suggested_response}` : ''}`).join('\n')}\n`;
  }

  return context;
}

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

    const { familyId, transcript, context, chatHistory, talkingToName, talkingToUserId } = await req.json();

    if (!familyId || !transcript) {
      return new Response(
        JSON.stringify({ error: "Missing familyId or transcript" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user is a family member or org member
    const { data: membership } = await supabase
      .from("family_members")
      .select("id, role, relationship_type")
      .eq("family_id", familyId)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      // Check if user is an org member managing this family
      const { data: family } = await supabase.from("families").select("organization_id").eq("id", familyId).single();
      if (family?.organization_id) {
        const { data: orgMember } = await supabase.from("organization_members")
          .select("role").eq("organization_id", family.organization_id).eq("user_id", user.id).single();
        if (!orgMember) {
          return new Response(
            JSON.stringify({ error: "Not authorized for this family" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else {
        return new Response(
          JSON.stringify({ error: "Not authorized for this family" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Fetch context in parallel
    const [familyObservations, familyResult, profileResult, talkingToInfo] = await Promise.all([
      fetchFamilyContext(supabase, familyId),
      supabase.from("families").select("name, description").eq("id", familyId).single(),
      supabase.from("profiles").select("full_name").eq("id", user.id).single(),
      (async () => {
        if (!talkingToUserId) return { display: talkingToName || "their loved one", isMember: false };
        const { data: ttProfile } = await supabase.from("profiles").select("full_name").eq("id", talkingToUserId).single();
        const { data: ttMembership } = await supabase.from("family_members").select("role, relationship_type").eq("family_id", familyId).eq("user_id", talkingToUserId).single();
        let display = ttProfile?.full_name || talkingToName || "their loved one";
        if (ttMembership) display = `${display} (${ttMembership.relationship_type || ttMembership.role})`;
        return { display, isMember: true };
      })(),
    ]);

    const family = familyResult.data;
    const profile = profileResult.data;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a real-time conversation coach helping families navigate difficult conversations during addiction recovery. You speak like a trusted friend — warm, direct, and down-to-earth. The other person CANNOT see your suggestions.

═══ IMPORTANT LANGUAGE RULES ═══
- NEVER use therapy jargon or clinical terms like "codependency", "triangulation", "differentiation", "attachment style", "cognitive distortion", "HALT", "CRAFT", "DBT", etc.
- Instead, use plain everyday language. For example:
  • Instead of "You're showing codependent behavior" → "It sounds like you're carrying more than your share here"
  • Instead of "Use an I-statement" → "Try telling them how YOU feel instead of what THEY did"
  • Instead of "Set a boundary" → "Let them know what you will and won't accept"
  • Instead of "Detach with love" → "You can love someone and still step back from the chaos"
  • Instead of "You're enabling" → "Sometimes helping actually makes things harder for them in the long run"
- Sound like a wise friend, not a therapist. Be warm and real.

═══ YOUR INTERNAL KNOWLEDGE (use to guide your thinking, but translate into plain language) ═══
${FIIS_COACHING_KNOWLEDGE}

═══ FAMILY-SPECIFIC CONTEXT ═══

**Family:** ${family?.name || "Unknown"}
**Coaching:** ${profile?.full_name || "a family member"} (${membership.relationship_type || membership.role})
**Talking to:** ${talkingToInfo.display}
**Conversation type:** ${context === 'phone' ? 'live phone/in-person' : 'text'}
${talkingToInfo.isMember
  ? '**Relationship:** Family group members.'
  : '**Relationship:** Person outside the app.'}

═══ FAMILY OBSERVATIONAL DATA ═══
${familyObservations || "No historical data available yet."}

═══ GOAL-DRIVEN COACHING ═══
Your PRIMARY job is to help this conversation support the family's goals, values, and boundaries listed above.

1. **Stay focused on what matters**: If the family's goal is getting into treatment, steer the conversation toward that. If it's following an aftercare plan, encourage that. Always connect your suggestions back to what this family is working toward.

2. **Reference their values**: When suggesting what to say, naturally weave in the family's chosen values. For example, if they value "Honesty & Transparency," encourage honest but kind communication.

3. **Protect their boundaries**: If the conversation is heading toward a boundary violation, gently remind them of what they agreed to and help them hold firm.

4. **Know when to wrap it up**: If continuing the conversation would hurt their progress — if it's getting heated, going in circles, or pulling them away from their goals — suggest a warm way to end the conversation. Something like:
   - "Hey, I think we've covered a lot. Let's take a breather and come back to this."
   - "I love you and I want to keep talking about this, but I think we both need some time to think."
   - "I appreciate you being open with me. Let's pick this up when we've both had a chance to process."

**Response Format:**
Provide 1-2 short, actionable suggestions — give them exact words they can say RIGHT NOW. Keep it brief and immediately useful. If the conversation should end, suggest a warm closing that leaves room for future connection.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(chatHistory || []).map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: "user", content: `Here's what's happening in the conversation:\n\n${transcript}\n\nWhat should I say or do right now?` },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        stream: true,
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

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Live coaching error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
