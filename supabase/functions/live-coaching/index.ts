import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================================
// FIIS COACHING CLINICAL KNOWLEDGE BASE (Condensed for Real-Time Coaching)
// ============================================================================

const FIIS_COACHING_KNOWLEDGE = `
═══ CLINICAL FOUNDATIONS ═══

CRAFT METHOD (Community Reinforcement and Family Training):
- Reinforce positive behaviors, allow natural consequences for negative ones
- Use "I" statements: "I feel [emotion] when [behavior] because [impact]"
- Avoid enabling while maintaining connection
- Timing matters: address issues when both parties are calm, not during crisis
- Positive communication increases: specific praise for recovery-consistent behavior
- Functional analysis: identify triggers → behavior → consequences

HALT FRAMEWORK (Vulnerability States):
H - HUNGRY: Physical needs neglected, self-care decline
A - ANGRY: Unprocessed resentments, irritability, conflict escalation
L - LONELY: Isolation, withdrawal from support
T - TIRED: Sleep disruption, exhaustion, burnout
When HALT states detected in conversation, coaching priority shifts to stabilization.

GORSKI'S KEY WARNING SIGNS (Early Relapse Indicators):
- Apprehension about well-being / denial of apprehension
- Overconfidence ("I've got this")
- Defensiveness and compulsive behavior
- Loneliness and tunnel vision
- Irritation with friends/family
- "I don't care" attitude
- Conscious lying and rejection of help
- Thoughts of controlled use

FAMILY ROLES IN ADDICTION:
- ENABLER: Making excuses, preventing consequences, covering up
- HERO: Over-achieving, perfectionism, hidden anxiety
- SCAPEGOAT: Acting out, drawing negative attention
- LOST CHILD: Withdrawing, avoiding conflict
- MASCOT: Using humor to defuse tension
Recognition of these roles helps guide coaching toward healthier dynamics.

BOWEN FAMILY SYSTEMS:
- Emotional triangles: Tension between two pulls in a third
- De-triangulation is key to healthy communication
- Family homeostasis: Systems resist change, even positive change
- Differentiation of self: Ability to hold position while maintaining emotional contact

CODEPENDENCY PATTERNS (Al-Anon):
- The 3 C's: "We didn't cause it, we can't cure it, we can't control it"
- Caretaking, obsession, controlling, weak boundaries
- Detachment with love ≠ abandonment
- Enabling behaviors: making excuses, bailing out, threatening without follow-through

ATTACHMENT THEORY:
- Anxious-preoccupied: Fear of abandonment, seeking reassurance
- Dismissive-avoidant: Emotional distance, uncomfortable with intimacy
- Fearful-avoidant: Push-pull patterns, often trauma-related
- Understanding attachment style informs coaching approach

STAGES OF CHANGE (Prochaska):
1. Precontemplation → Raise awareness without confrontation
2. Contemplation → Explore ambivalence
3. Preparation → Help with planning
4. Action → Support and reinforce
5. Maintenance → Prevent complacency
Match coaching suggestions to the person's current stage.

MOTIVATIONAL INTERVIEWING (OARS):
- Open-ended questions
- Affirmations
- Reflections
- Summaries
Evoke change talk: Desire, Ability, Reasons, Need, Commitment

DBT INTERPERSONAL EFFECTIVENESS (DEAR MAN):
- Describe the situation objectively
- Express feelings using "I" statements
- Assert what you want/need clearly
- Reinforce why it matters
- Mindful: Stay focused on the goal
- Appear confident even if anxious
- Negotiate: Be willing to give to get

COGNITIVE DISTORTIONS TO ADDRESS:
- All-or-Nothing: "I relapsed once, so I'm a complete failure"
- Catastrophizing: "If I say this, everything will fall apart"
- Mind Reading: "They think I'm a terrible parent"
- Should Statements: "I should be further along"
- Emotional Reasoning: "I feel angry, so I should express it harshly"

TRAUMA-INFORMED COMMUNICATION:
- Prioritize safety (physical and emotional)
- Trustworthiness: Clear, consistent communication
- Choice: Restore sense of control and autonomy
- Avoid re-traumatization through aggressive confrontation
- Recognize trauma responses: Fight, Flight, Freeze, Fawn

CRISIS RECOGNITION:
- Suicide warning signs: talking about wanting to die, feeling hopeless, being a burden, giving away possessions
- If crisis detected: Recommend 988 Suicide & Crisis Lifeline, do NOT attempt to manage internally
- Manic emergency: 3+ days no sleep, grandiose delusions, dangerous impulsivity
- Never suggest ultimatums during heated moments

DE-ESCALATION PRINCIPLES:
1. Lower your voice, slow your pace
2. Validate emotions before problem-solving
3. Reflect what you hear: "It sounds like you're feeling..."
4. Avoid "always" and "never" language
5. Name the tension: "This conversation is getting heated"
6. Offer a graceful exit: "Let's take a break and come back to this"
7. Leave the door open: End with hope for re-engagement

BOUNDARY COMMUNICATION:
- State the boundary clearly and calmly
- Include the consequence
- Follow through consistently
- Separate the person from the behavior
- "I love you AND this behavior is not acceptable"
- Dialectics: Hold two truths simultaneously
`;

// Fetch comprehensive family observational context for coaching
async function fetchFamilyContext(supabase: ReturnType<typeof createClient>, familyId: string) {
  const [
    sobrietyResult,
    boundariesResult,
    emotionalCheckinsResult,
    meetingCheckinsResult,
    messagesResult,
    financialRequestsResult,
    coachingSessionsResult,
    medicationsResult,
    providerNotesResult,
    aftercarePlansResult,
    aftercareRecsResult,
    calibrationPatternsResult,
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
  ]);

  let context = "";

  // Sobriety journey
  if (sobrietyResult.data) {
    const startDate = new Date(sobrietyResult.data.start_date);
    const today = new Date();
    startDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const currentDays = Math.max(0, Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const daysToOneYear = Math.max(0, 365 - currentDays);
    let phase = "";
    if (currentDays <= 30) phase = "Early Recovery (high vulnerability)";
    else if (currentDays <= 90) phase = "Building Foundation";
    else if (currentDays <= 180) phase = "Developing Resilience";
    else if (currentDays <= 270) phase = "Strengthening Commitment";
    else if (currentDays <= 365) phase = "Approaching One-Year Milestone";
    else phase = "Beyond One Year (maintenance)";
    const resetInfo = sobrietyResult.data.reset_count > 0 ? ` Recovery attempt #${sobrietyResult.data.reset_count + 1}.` : "";
    context += `\nSOBRIETY: ${currentDays} days sober. ${daysToOneYear > 0 ? daysToOneYear + " days to one-year goal." : "One-year achieved!"} Phase: ${phase}.${resetInfo}\n`;
  }

  // Approved boundaries
  if (boundariesResult.data && boundariesResult.data.length > 0) {
    context += `\nAPPROVED FAMILY BOUNDARIES:\n${boundariesResult.data.map((b, i) => `${i + 1}. ${b.content}`).join("\n")}\n`;
  }

  // Emotional check-in patterns (last 30)
  if (emotionalCheckinsResult.data && emotionalCheckinsResult.data.length > 0) {
    const checkins = emotionalCheckinsResult.data;
    const bypassedCount = checkins.filter(c => c.was_bypassed).length;
    const feelings: Record<string, number> = {};
    checkins.forEach(c => { if (c.feeling) feelings[c.feeling] = (feelings[c.feeling] || 0) + 1; });
    const negativeFeelings = ['awful', 'struggling', 'anxious', 'sad', 'angry', 'overwhelmed'];
    const negativeCount = checkins.filter(c => negativeFeelings.includes(c.feeling?.toLowerCase() || '')).length;
    context += `\nEMOTIONAL STATE (Last 30 check-ins): ${checkins.length} total. Bypassed: ${bypassedCount}. Negative states: ${negativeCount}. Distribution: ${Object.entries(feelings).map(([f, c]) => `${f}(${c})`).join(', ')}\n`;
  }

  // Meeting attendance patterns
  if (meetingCheckinsResult.data && meetingCheckinsResult.data.length > 0) {
    const checkins = meetingCheckinsResult.data;
    const now = new Date();
    const last7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recent7 = checkins.filter(c => new Date(c.checked_in_at) >= last7).length;
    const recent30 = checkins.filter(c => new Date(c.checked_in_at) >= last30).length;
    const overdueAlerts = checkins.filter(c => c.overdue_alert_sent).length;
    const meetingTypes: Record<string, number> = {};
    checkins.forEach(c => { const t = c.meeting_type || 'other'; meetingTypes[t] = (meetingTypes[t] || 0) + 1; });
    context += `\nMEETING ATTENDANCE: Last 7 days: ${recent7}. Last 30 days: ${recent30}. Overdue checkouts: ${overdueAlerts}. Types: ${Object.entries(meetingTypes).map(([t, c]) => `${t}(${c})`).join(', ')}\n`;
  }

  // Communication patterns (keyword analysis, no content exposed)
  if (messagesResult.data && messagesResult.data.length > 0) {
    const messages = messagesResult.data;
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
    messages.forEach(m => {
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

  // Financial request patterns
  if (financialRequestsResult.data && financialRequestsResult.data.length > 0) {
    const requests = financialRequestsResult.data;
    const totalAmount = requests.reduce((sum, r) => sum + (r.amount || 0), 0);
    const denied = requests.filter(r => r.status === 'denied').length;
    context += `\nFINANCIAL PATTERNS: ${requests.length} recent requests totaling $${totalAmount}. Denied: ${denied}.\n`;
  }

  // Prior coaching sessions
  if (coachingSessionsResult.data && coachingSessionsResult.data.length > 0) {
    const sessions = coachingSessionsResult.data;
    const liveCount = sessions.filter(s => s.session_type === 'live').length;
    const screenshotCount = sessions.filter(s => s.session_type === 'screenshot').length;
    const recentSuggestions = sessions.slice(0, 5).flatMap(s => {
      if (Array.isArray(s.suggestions)) return s.suggestions.map((sg: any) => typeof sg === 'string' ? sg : sg?.text || '').filter(Boolean);
      return [];
    }).slice(0, 5);
    context += `\nPRIOR COACHING: ${sessions.length} sessions (${liveCount} live, ${screenshotCount} screenshot).`;
    if (recentSuggestions.length > 0) {
      context += ` Recent suggestions given: ${recentSuggestions.map((s, i) => `${i + 1}. "${s}"`).join('; ')}`;
    }
    context += "\n";
  }

  // Active medications
  if (medicationsResult.data && medicationsResult.data.length > 0) {
    context += `\nACTIVE MEDICATIONS: ${medicationsResult.data.map(m => `${m.medication_name}${m.dosage ? ` (${m.dosage})` : ''}`).join(', ')}\n`;
  }

  // Provider clinical notes
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

    // Fetch family context, profile info, and talking-to info in parallel
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

    const systemPrompt = `You are FIIS Live Coaching — an embedded real-time communication coach powered by the Family Intervention Intelligence System, for families dealing with addiction and recovery.

${FIIS_COACHING_KNOWLEDGE}

═══ FAMILY-SPECIFIC CONTEXT ═══

**Family:** ${family?.name || "Unknown"}
**Coaching:** ${profile?.full_name || "a family member"} (${membership.relationship_type || membership.role})
**Talking to:** ${talkingToInfo.display}
**Conversation type:** ${context === 'phone' ? 'live phone/in-person' : 'text'}
${talkingToInfo.isMember
  ? '**Relationship:** Family group members. Focus on healthy family communication, reducing conflict, and maintaining supportive recovery dynamics.'
  : '**Relationship:** Person outside the app. Focus on de-escalation and CRAFT-based engagement.'}

═══ FAMILY OBSERVATIONAL DATA ═══
${familyObservations || "No historical data available yet."}

═══ YOUR ROLE ═══
You are listening to the conversation in real-time and providing coaching. The other person CANNOT see your suggestions.

Use your full clinical knowledge base AND the family's observational history to provide contextually aware coaching. For example:
- If sobriety days are low, be extra careful about de-escalation
- If HALT patterns are detected in recent check-ins, address vulnerability
- If boundary testing patterns exist in chat, reinforce boundary maintenance
- If prior coaching sessions addressed similar dynamics, build on that guidance
- If provider notes highlight specific concerns, factor those in
- If meeting attendance is declining, consider this in your assessment

**Response Format:**
Provide 1-2 short, actionable suggestions the family member can say RIGHT NOW. Be specific and conversational — give them exact words they can use. If the conversation should end, suggest a warm closing statement that leaves room for future connection.

Keep responses brief and immediately actionable — this is real-time coaching.`;

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
