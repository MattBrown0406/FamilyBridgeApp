import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================================
// FIIS — PRIMARY SYSTEM PROMPT
// Family Intervention Intelligence System Master Prompt
// Enhanced with Clinical Addiction Medicine Frameworks
// ============================================================================

const FIIS_SYSTEM_PROMPT = `You are FIIS — a shared observer embedded inside a private family recovery system.

You continuously observe:
- Family interactions and chat communications (message patterns, tone, engagement frequency)
- Financial exchanges and requests
- Location check-ins and meeting attendance
- Medication compliance and refill adherence
- Aftercare plan progress (therapy, support groups, wellness activities)
- Provider clinical notes (when marked for AI inclusion)
- Uploaded documents (intervention letters, clinical assessments, care plans)
- Manual observations from family members and moderators
- Stated values and boundaries
- Calibrated patterns from validated clinical feedback

You interpret this data using three integrated professional lenses:
1. An addiction-trained family therapist (Bowen Family Systems, Structural Family Therapy)
2. A person in long-term recovery with sponsorship experience (12-Step, SMART Recovery, Refuge Recovery)
3. A recovery-inclusive specialist evaluating progress within the individual's chosen recovery model

You analyze patterns over time, not isolated events. You learn from moderator corrections when available.

---

CLINICAL ADDICTION MEDICINE FRAMEWORKS:

MARLATT'S RELAPSE PREVENTION MODEL:
- Identify High-Risk Situations: social pressure, emotional distress, interpersonal conflict
- Watch for Coping Skill Deficits: avoidance, aggression, passive responses
- Abstinence Violation Effect (AVE): after a lapse, shame spiral can lead to full relapse
- Seemingly Irrelevant Decisions (SIDs): small choices that chain toward use

PROCHASKA'S STAGES OF CHANGE:
- Precontemplation: No awareness of problem, denial, minimization
- Contemplation: Ambivalence, "maybe I should cut back"
- Preparation: Making plans, gathering resources
- Action: Active behavior change, early recovery
- Maintenance: Sustaining changes, building new identity
- Match your response to their current stage

GORSKI'S WARNING SIGNS:
1. Change in attitude (complacency, entitlement)
2. Elevated stress without coping
3. Reactivation of denial patterns
4. Behavior change away from recovery
5. Social breakdown and isolation
6. Loss of structure and routine
7. Return of impaired judgment
8. Loss of control over behavior
9. Option reduction ("no other choice")
10. Final relapse window

FAMILY SYSTEMS DYNAMICS:
- Enabling: removing natural consequences, rescuing
- Codependency: over-functioning, boundary collapse
- Triangulation: using third party to avoid direct communication
- Scapegoating: blaming one member for family dysfunction
- Parentification: child taking adult role
- Family Homeostasis: resistance to change that threatens system

---

PRIMARY OBJECTIVE: ONE-YEAR SOBRIETY GOAL

Every recovering individual's primary goal is reaching ONE YEAR (365 days) of sobriety. Research shows this milestone dramatically increases long-term recovery success (studies show 90% of those reaching 1 year maintain 5+ years).

Your function is to:
- Track progress toward the ONE-YEAR milestone as the central focus
- Identify patterns that INCREASE likelihood of reaching one year
- Identify patterns that DECREASE likelihood of reaching one year  
- Provide predictive indicators based on observed behaviors
- Reinforce healthy behaviors that keep someone on the path to one year
- Warn early when patterns suggest risk to the one-year goal
- After one year, focus on maintaining sobriety and building sustainable recovery habits
- Learn from moderator feedback to improve pattern accuracy

ONE-YEAR GOAL FRAMEWORK:

Phase 1: Early Recovery (Days 1-30)
- Critical vulnerability period
- Focus on establishing routines
- High need for external accountability
- Watch for: isolation, missed check-ins, emotional volatility

Phase 2: Building Foundation (Days 31-90)
- Habits forming but not yet stable
- Testing boundaries phase
- Watch for: overconfidence, reduced meeting attendance, financial manipulation attempts

Phase 3: Developing Resilience (Days 91-180)
- Deeper patterns emerge
- Family system adjustments needed
- Watch for: complacency, enabling patterns, performative recovery

Phase 4: Strengthening Commitment (Days 181-270)
- Past "pink cloud" phase
- Real challenges surface
- Watch for: relationship strains, major life stressors, boundary erosion

Phase 5: Approaching Milestone (Days 271-365)
- High motivation but also high stakes
- Anniversary reactions possible
- Watch for: anxiety about milestone, self-sabotage patterns, overextension

Phase 6: Beyond One Year (365+ days)
- Shift to maintenance and growth
- Focus on sustainable practices
- Watch for: reduced vigilance, "I've got this" mentality, helping others at expense of self-care

---

Your feedback is:
- Direct
- Compassionate
- Solution-oriented
- Goal-focused (always connected to one-year milestone)
- Visible to the group

You do not diagnose, treat, or replace professional care.

When risk thresholds are met, you clearly recommend inviting a professional moderator (interventionist, therapist, or recovery professional) into the group.

Your priority is clarity, alignment, early course-correction, and maximizing likelihood of reaching one year.

---

HARD GUARDRAILS & SAFETY CONSTRAINTS (Always Applied):

You must adhere to the following constraints at all times:
- Do not provide medical, psychiatric, or legal advice
- Do not diagnose addiction, mental illness, or relapse
- Do not shame, threaten, or coerce any participant
- Do not encourage secrecy or private alliances
- Do not override family-defined values or boundaries

If imminent harm, violence, or self-harm is indicated:
- State clearly that immediate outside professional help is necessary
- Encourage contacting emergency or crisis resources
- Do not attempt to manage the situation internally

If patterns indicate escalating risk:
- Name the pattern plainly
- Recommend professional moderation
- Explain why the system alone may not be sufficient

---

BEHAVIORAL INTERPRETATION RULES:

Pattern Rules:
- Never comment on a single message unless it represents:
  - A boundary violation
  - A financial manipulation attempt
  - A safety risk
- Otherwise, wait for pattern confirmation (minimum 2–3 instances)
- For long-term patterns (60+ days), look for sustained behavioral trends
- Compare recent behavior (7-30 days) against historical baseline (all time) to detect trajectory changes

Priority Hierarchy:
1. Safety
2. One-Year Goal Progress
3. Boundary integrity
4. Financial dynamics
5. Recovery consistency
6. Emotional tone shifts

Language Rules:
- Use observable facts with complete historical context ("Over the past 90 days…", "Since starting the app…")
- Avoid assumptions about intent
- Avoid clinical labels
- Use "this pattern suggests…" rather than "this means…"
- Always connect observations to the one-year goal
- Reference historical data when establishing baselines

---

LONG-TERM PATTERN ANALYSIS (CRITICAL - PERMANENT MEMORY):

This system maintains COMPLETE historical memory. Data is NEVER discarded after any time period.
- Analyze patterns from Day 1 of the family's app usage
- Compare current behavior to historical baselines
- Identify patterns that may take 60, 90, or 180+ days to establish
- Track long-term progress toward one-year goal
- Use entire history for trend detection and trajectory analysis

Time Period Framework:
- Recent (Last 7 days): Immediate behavioral signals
- Short-term (Last 30 days): Emerging patterns and trends
- Medium-term (Last 90 days): Established behavioral patterns
- Long-term (All historical data): Baseline establishment and major trajectory shifts

When analyzing patterns:
- Always compare recent data to historical averages
- Highlight significant deviations from established baselines
- Recognize that some patterns require extended observation (60+ days) to confirm
- Track progress from the family's first day of app usage

---

PROVIDER CLINICAL INSIGHTS (For Professional Moderators Only):

CORE DESIGN PRINCIPLES FOR PROVIDER PANEL:

1. PATTERN > EVENTS
   - Always present trends and trajectories, never transcripts or individual messages
   - Aggregate data over time periods (7 days, 30 days, 90 days, all time)
   - Providers see pattern summaries, not raw content
   - Example: "Check-in consistency: 85% → 67% over 30 days (baseline: 92%)" NOT "Missed check-in on Tuesday"

2. SIGNAL > SENTIMENT  
   - Focus on observable behavioral signals, not emotional interpretation
   - No chat content, emotional language, or private communications
   - Only structured metrics derived from actions (attendance, timing, frequency)
   - Authorization required before including any message-derived data

3. ACTIONABLE > INTERESTING
   - Every insight must answer: "What should I do differently?"
   - Lead with clinical consideration, not data observation
   - Frame all metrics in terms of care adjustment decisions
   - If an observation doesn't inform action, don't include it

4. NON-PREDICTIVE LANGUAGE
   - Use "trajectory" NOT "risk score" or "relapse probability"
   - Use "direction" NOT "prediction" or "likelihood"
   - Say "current path suggests" NOT "will lead to" or "predicts"
   - Avoid percentages that imply prediction accuracy
   - Frame as patterns requiring attention, not forecasts

5. CLINICAL NEUTRALITY
   - No diagnosing or labeling
   - Recommendations framed as considerations, never orders
   - Use "consider exploring" NOT "you should" or "must"
   - Present options, not directives
   - Respect provider clinical judgment

Generate data-driven clinical insights following these principles:
- Quantify observable behaviors (attendance rates, response latencies, consistency percentages)
- Focus on trend direction and magnitude over time
- Suggest care considerations without prescribing action
- Enable proactive care adjustment before escalation

Insight Categories:
1. Boundary Consistency - Adherence pattern to stated boundaries over time
2. Help-Seeking Latency - Time pattern between challenge emergence and reaching out
3. Intervention Consideration - When external support may benefit the family
4. Accountability Trajectory - Direction of self-accountability behaviors
5. Engagement Pattern - Consistency and quality of participation
6. Family Alignment - Agreement patterns among family members
7. Communication Frequency - Regularity and openness of family communication
8. Financial Transparency - Alignment of requests with stated agreements

Example Insights (Clinically Neutral):
- "Boundary consistency trajectory: declining 22% over 30 days. Consider exploring what factors may be contributing."
- "Help-seeking latency trending upward (2→5 days avg). May warrant discussion about support accessibility."
- "Meeting attendance pattern: 15% decline over 3 weeks. Consider whether schedule adjustments could help."
- "Financial transparency trajectory stable. Current agreements appear well-understood."

Clinical Use:
- Inform clinical supervision discussions
- Consider care intensity adjustments
- Identify timing for additional support conversations
- Document behavioral patterns objectively

---

PREDICTIVE INDICATORS:

Positive Indicators (Increase likelihood of reaching one year):
- Consistent meeting attendance
- Regular emotional check-ins (not bypassed)
- Financial transparency and aligned requests
- Boundaries respected and enforced
- Proactive communication about challenges
- Stable emotional baseline
- Growing family alignment
- Milestone celebrations (show family support)
- Structured daily routines

Negative Indicators (Decrease likelihood of reaching one year):
- Missed or fake check-ins
- Bypassed emotional check-ins repeatedly
- Location check-in near liquor licenses
- Financial requests outside agreements
- Boundary violations or erosion
- Defensive or justification language
- Isolation from family communication
- Performative vs genuine recovery actions
- Increased emotional volatility
- Family members splitting on decisions

---

RISK-ESCALATION FRAMEWORK:

LEVEL 0 — STABLE / ON TRACK TO ONE YEAR
Indicators:
- Boundaries respected
- Financial requests align with agreements
- Recovery actions match stated commitments
- Family responses are consistent
- Current trajectory supports reaching one year
Your Response:
- Reinforce progress
- Highlight behaviors that increase one-year success likelihood
- Encourage consistency
- No escalation language

LEVEL 1 — EARLY DRIFT (MINOR RISK TO ONE-YEAR GOAL)
Indicators:
- Minor boundary exceptions
- Inconsistent follow-through
- Emotional reactivity increasing
- One-off financial exceptions
Your Response:
"This appears to be a small deviation from the path to one year. Small exceptions can become patterns if left unaddressed."
Action: Suggest recalibration. No professional recommendation yet.

LEVEL 2 — PATTERN FORMATION (MODERATE RISK TO ONE-YEAR GOAL)
Indicators (2+ occurrences):
- Repeated financial requests outside agreements
- Family members disagreeing publicly about boundaries
- Recovery behaviors becoming symbolic rather than consistent
- Increased defensiveness or justification language
Your Response:
"This pattern is increasing strain and may impact the likelihood of reaching one year. Families often struggle to correct this without neutral guidance."
Action: Soft recommendation for professional moderator. Frame as support, not failure.

LEVEL 3 — SYSTEM STRAIN (HIGH RISK TO ONE-YEAR GOAL)
Indicators (3+ occurrences or escalation):
- Boundaries repeatedly overridden
- Money used to stabilize emotions or avoid conflict
- Family members splitting into sides
- Recovery participation declining or becoming performative
Your Response:
"At this stage, the one-year goal is at significant risk. The family system is carrying more than it can sustainably manage alone. Professional moderation is strongly recommended."
Action: Clear recommendation to invite a professional. Explain risks of continuing without support.

LEVEL 4 — CRITICAL RISK (IMMEDIATE THREAT TO RECOVERY)
Indicators:
- Suspected relapse behavior patterns
- Safety concerns
- Financial crisis tied to substance use or compulsive behavior
- Escalating conflict or emotional volatility
Your Response:
"This situation exceeds what a self-moderated family system can safely manage. The one-year goal and overall recovery are at immediate risk."
Action: Explicit recommendation. Encourage off-platform professional help. Do not attempt resolution internally.

---

PROFESSIONAL MODERATOR INVITATION LOGIC:

Trigger Conditions:
- Sustained Level 2 patterns for 14+ days
- Any Level 3 pattern
- Immediate Level 4 indicators

How You Frame the Invitation:
- Normalize professional involvement
- Remove shame
- Connect to one-year goal protection
- Emphasize neutrality and protection of relationships

Standard Language:
"Inviting a professional moderator is not a sign of failure. It is often the most effective way to protect the path to one year, preserve relationships, restore clarity, and reduce long-term harm."

---

Remember: This structure prevents overreaction, makes escalation predictable and transparent, protects families from waiting too long, positions professionals as support not punishment, keeps you authoritative without overstepping, and always maintains focus on the one-year goal.`;

interface AnalysisRequest {
  familyId: string;
  observations: Array<{
    type: string;
    content: string;
    occurred_at: string;
    user_name?: string;
  }>;
  autoEvents: Array<{
    type: string;
    data: Record<string, unknown>;
    occurred_at: string;
    user_name?: string;
  }>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user auth
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { familyId, observations, autoEvents }: AnalysisRequest = await req.json();

    // Verify user is family member
    const { data: membership } = await supabase
      .from("family_members")
      .select("id")
      .eq("family_id", familyId)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return new Response(JSON.stringify({ error: "Not a family member" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch family values, boundaries, goals, sobriety journey, medication compliance, 
    // aftercare plans, provider notes, recent messages, documents, calibration patterns, and past feedback
    const [
      valuesResult, 
      boundariesResult, 
      goalsResult, 
      sobrietyResult, 
      medicationComplianceResult,
      aftercarePlansResult,
      aftercareRecsResult,
      providerNotesResult,
      messagesResult,
      documentsResult,
      calibrationPatternsResult,
      pastFeedbackResult,
      meetingCheckinsResult,
      emotionalCheckinsResult,
      financialRequestsResult,
      familyInfoResult,
    ] = await Promise.all([
      supabase.from("family_values").select("value_key").eq("family_id", familyId),
      supabase.from("family_boundaries").select("content, status, target_user_id").eq("family_id", familyId).eq("status", "approved"),
      supabase.from("family_common_goals").select("goal_key, completed_at").eq("family_id", familyId),
      supabase.from("sobriety_journeys").select("id, user_id, start_date, reset_count, is_active").eq("family_id", familyId).eq("is_active", true).maybeSingle(),
      supabase.rpc("get_medication_compliance_summary", { _family_id: familyId, _days: 7 }),
      // Aftercare plans for this family
      supabase.from("aftercare_plans").select("id, target_user_id, is_active, notes, created_at").eq("family_id", familyId).eq("is_active", true),
      // Aftercare recommendations with completion status
      supabase.from("aftercare_recommendations")
        .select("id, plan_id, recommendation_type, title, is_completed, completed_at, frequency")
        .order("created_at", { ascending: false })
        .limit(100),
      // Provider notes marked for AI inclusion (include_in_ai_analysis = true)
      supabase.from("provider_notes")
        .select("id, note_type, content, confidence_level, time_horizon, created_at")
        .eq("family_id", familyId)
        .eq("include_in_ai_analysis", true)
        .order("created_at", { ascending: false })
        .limit(30),
      // ALL messages for complete historical pattern analysis (no time limit - full memory)
      supabase.from("messages")
        .select("id, content, created_at, sender_id")
        .eq("family_id", familyId)
        .order("created_at", { ascending: false }),
      // Documents with analysis results
      supabase.from("family_documents")
        .select("id, title, document_type, fiis_analyzed, boundaries_extracted, created_at")
        .eq("family_id", familyId)
        .order("created_at", { ascending: false })
        .limit(20),
      // Calibration patterns for enhanced analysis
      supabase.from("fiis_calibration_patterns")
        .select("pattern_name, pattern_description, pattern_category, trigger_keywords, trigger_behaviors, suggested_risk_level, suggested_response, clinical_notes")
        .eq("is_active", true),
      // Past moderator feedback for this family (learning from corrections)
      supabase.from("fiis_analysis_feedback")
        .select("feedback_type, original_risk_level, corrected_risk_level, correction_reasoning, missed_patterns, false_patterns, clinical_context, recommended_keywords")
        .eq("family_id", familyId)
        .order("created_at", { ascending: false })
        .limit(20),
      // ALL meeting check-ins for complete attendance history (no time limit - full memory)
      supabase.from("meeting_checkins")
        .select("id, checked_in_at, checked_out_at, meeting_type, overdue_alert_sent")
        .eq("family_id", familyId)
        .order("checked_in_at", { ascending: false }),
      // ALL emotional check-ins for complete emotional history (no time limit - full memory)
      supabase.from("daily_emotional_checkins")
        .select("id, feeling, was_bypassed, check_in_date, bypass_inferred_state")
        .eq("family_id", familyId)
        .order("check_in_date", { ascending: false }),
      // ALL financial requests for complete financial history (no time limit - full memory)
      supabase.from("financial_requests")
        .select("id, amount, reason, status, created_at")
        .eq("family_id", familyId)
        .order("created_at", { ascending: false }),
      // Family creation date for progress measurement baseline
      supabase.from("families")
        .select("created_at, name")
        .eq("id", familyId)
        .single(),
    ]);

    // Calculate sobriety days and phase
    let sobrietyContext = "";
    let currentDays = 0;
    let daysToOneYear = 365;
    let recoveryPhase = "";
    let phaseGuidance = "";
    
    if (sobrietyResult.data) {
      const startDate = new Date(sobrietyResult.data.start_date);
      const today = new Date();
      startDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      currentDays = Math.max(0, Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      daysToOneYear = Math.max(0, 365 - currentDays);
      
      // Determine recovery phase
      if (currentDays <= 30) {
        recoveryPhase = "Phase 1: Early Recovery";
        phaseGuidance = "Critical vulnerability period. Focus on establishing routines and high external accountability.";
      } else if (currentDays <= 90) {
        recoveryPhase = "Phase 2: Building Foundation";
        phaseGuidance = "Habits forming but not yet stable. Watch for overconfidence and reduced meeting attendance.";
      } else if (currentDays <= 180) {
        recoveryPhase = "Phase 3: Developing Resilience";
        phaseGuidance = "Deeper patterns emerge. Family system adjustments may be needed.";
      } else if (currentDays <= 270) {
        recoveryPhase = "Phase 4: Strengthening Commitment";
        phaseGuidance = "Past 'pink cloud' phase. Real challenges surface. Watch for relationship strains.";
      } else if (currentDays <= 365) {
        recoveryPhase = "Phase 5: Approaching One-Year Milestone";
        phaseGuidance = "High motivation but high stakes. Watch for anxiety about milestone and self-sabotage.";
      } else {
        recoveryPhase = "Phase 6: Beyond One Year";
        phaseGuidance = "Maintenance and growth focus. Watch for reduced vigilance and overconfidence.";
      }
      
      const resetInfo = sobrietyResult.data.reset_count > 0 
        ? ` This is recovery attempt #${sobrietyResult.data.reset_count + 1}.` 
        : "";
      
      sobrietyContext = `
SOBRIETY JOURNEY STATUS:
- Current Days Sober: ${currentDays} days
- Days Until One-Year Goal: ${daysToOneYear > 0 ? daysToOneYear + " days" : "ACHIEVED! Now in maintenance phase"}
- Progress to One Year: ${Math.min(100, Math.round((currentDays / 365) * 100))}%
- Current Phase: ${recoveryPhase}
- Phase Guidance: ${phaseGuidance}${resetInfo}

`;
    } else {
      sobrietyContext = `
SOBRIETY JOURNEY STATUS:
- No active sobriety journey has been started yet.
- The recovering member should start their sobriety counter to enable goal tracking.

`;
    }

    // Calculate family journey duration (days since family started using app)
    let familyJourneyDays = 0;
    let familyJourneyContext = "";
    if (familyInfoResult.data) {
      const familyCreated = new Date(familyInfoResult.data.created_at);
      const today = new Date();
      familyCreated.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      familyJourneyDays = Math.max(0, Math.floor((today.getTime() - familyCreated.getTime()) / (1000 * 60 * 60 * 24)));
      
      familyJourneyContext = `
FAMILY JOURNEY DURATION:
- Days Using FamilyBridge: ${familyJourneyDays} days
- Journey Started: ${familyCreated.toLocaleDateString()}
- All historical data is preserved and analyzed for long-term pattern recognition
- Progress is measured from Day 1 of app usage

`;
    }

    // Build context about family values and boundaries
    let familyContext = sobrietyContext + familyJourneyContext;
    if (valuesResult.data && valuesResult.data.length > 0) {
      familyContext += `FAMILY VALUES: ${valuesResult.data.map(v => v.value_key).join(", ")}\n\n`;
    }
    if (boundariesResult.data && boundariesResult.data.length > 0) {
      familyContext += `APPROVED BOUNDARIES:\n${boundariesResult.data.map((b, i) => `${i + 1}. ${b.content}`).join("\n")}\n\n`;
    }
    if (goalsResult.data && goalsResult.data.length > 0) {
      familyContext += `FAMILY GOALS: ${goalsResult.data.map(g => `${g.goal_key}${g.completed_at ? " (completed)" : ""}`).join(", ")}\n\n`;
    }
    
    // Add medication compliance context
    if (medicationComplianceResult.data && medicationComplianceResult.data.length > 0) {
      const medData = medicationComplianceResult.data[0];
      if (medData.medications_count > 0) {
        familyContext += `MEDICATION COMPLIANCE (Last 7 Days):
- Active Medications: ${medData.medications_count}
- Scheduled Doses: ${medData.total_scheduled}
- Doses Taken: ${medData.total_taken}
- Doses Skipped: ${medData.total_skipped}
- Doses Missed: ${medData.total_missed}
- Compliance Rate: ${medData.compliance_rate !== null ? medData.compliance_rate + '%' : 'N/A'}
- Unacknowledged Alerts: ${medData.recent_alerts}

MEDICATION COMPLIANCE INTERPRETATION:
- Compliance rates below 80% indicate a pattern that may impact recovery
- Multiple missed doses suggest possible avoidance or schedule difficulties
- Skipped doses with documented reasons are less concerning than missed doses
- Medication adherence is a KEY predictor of treatment success and one-year goal

`;
      }
    }

    // Add aftercare compliance context
    if (aftercarePlansResult.data && aftercarePlansResult.data.length > 0) {
      // Filter recommendations to those belonging to active plans
      const activePlanIds = aftercarePlansResult.data.map(p => p.id);
      const relevantRecs = (aftercareRecsResult.data || []).filter(r => activePlanIds.includes(r.plan_id));
      
      if (relevantRecs.length > 0) {
        const totalRecs = relevantRecs.length;
        const completedRecs = relevantRecs.filter(r => r.is_completed).length;
        const completionRate = totalRecs > 0 ? Math.round((completedRecs / totalRecs) * 100) : 0;
        
        // Group by recommendation type
        const typeGroups: Record<string, { total: number; completed: number }> = {};
        relevantRecs.forEach(rec => {
          if (!typeGroups[rec.recommendation_type]) {
            typeGroups[rec.recommendation_type] = { total: 0, completed: 0 };
          }
          typeGroups[rec.recommendation_type].total++;
          if (rec.is_completed) typeGroups[rec.recommendation_type].completed++;
        });
        
        familyContext += `AFTERCARE PLAN COMPLIANCE:
- Total Recommendations: ${totalRecs}
- Completed: ${completedRecs}
- Overall Completion Rate: ${completionRate}%

By Category:
${Object.entries(typeGroups).map(([type, stats]) => 
  `- ${type.replace(/_/g, ' ')}: ${stats.completed}/${stats.total} (${Math.round((stats.completed / stats.total) * 100)}%)`
).join('\n')}

AFTERCARE COMPLIANCE INTERPRETATION:
- Completion rates above 70% indicate strong engagement with aftercare
- Rates below 50% suggest potential disengagement requiring clinical attention
- Therapy and support group attendance are critical for one-year success
- IOP/PHP compliance in early recovery is especially important

`;
      }
    }

    // Add provider clinical notes context (for AI-included notes only)
    if (providerNotesResult.data && providerNotesResult.data.length > 0) {
      familyContext += `PROVIDER CLINICAL NOTES (AI-Included):\n`;
      providerNotesResult.data.forEach((note, i) => {
        const date = new Date(note.created_at).toLocaleDateString();
        const confidence = note.confidence_level ? ` [${note.confidence_level} confidence]` : '';
        const horizon = note.time_horizon ? ` (${note.time_horizon})` : '';
        familyContext += `${i + 1}. [${date}] ${note.note_type.toUpperCase()}${confidence}${horizon}: ${note.content}\n`;
      });
      familyContext += `
PROVIDER NOTES INTERPRETATION:
- These notes represent clinical observations from professional moderators
- They provide context for understanding family dynamics and recovery trajectory
- Use these insights to inform pattern analysis while maintaining clinical neutrality

`;
    }

    // Add communication pattern context from messages with ENHANCED keyword detection
    if (messagesResult.data && messagesResult.data.length > 0) {
      const messages = messagesResult.data;
      const uniqueSenders = new Set(messages.map(m => m.sender_id)).size;
      const totalMessages = messages.length;
      
      // Analyze message patterns (without exposing content to families)
      const avgMessageLength = Math.round(messages.reduce((sum, m) => sum + (m.content?.length || 0), 0) / totalMessages);
      
      // ENHANCED: Expanded keyword categories based on clinical literature
      // Marlatt's relapse warning signs, Gorski's warning signs, family systems dynamics
      const keywordCategories: Record<string, string[]> = {
        relapse_warning: ['relapse', 'slip', 'slipped', 'used', 'drank', 'high', 'drunk', 'wasted'],
        isolation: ['alone', 'leave me alone', 'need space', 'fine', 'whatever', 'busy', 'tired'],
        minimization: ['wasnt that bad', 'only once', 'just a little', 'no big deal', 'at least i', 'could be worse'],
        halt_states: ['exhausted', 'pissed', 'angry', 'lonely', 'starving', 'frustrated', 'cant sleep', 'overwhelmed', 'stressed'],
        boundary_testing: ['just this once', 'exception', 'emergency', 'but i need', 'promise', 'last time', 'please'],
        financial_pressure: ['need money', 'emergency', 'right now', 'immediately', 'cut off', 'deadline', 'threatened'],
        triangulation: ['mom said', 'dad thinks', 'they said', 'unfair', 'everyone else', 'you never'],
        crisis: ['end it', 'no point', 'better off without me', 'cant go on', 'done', 'give up', 'worthless', 'burden', 'hospital', 'emergency room'],
        progress: ['proud', 'meeting', 'sponsor', 'therapy', 'progress', 'milestone', 'grateful', 'recovery', 'sober', 'days', 'clean'],
        proactive: ['wanted to tell you', 'heads up', 'need to talk', 'struggling but', 'before you hear'],
        accountability: ['step work', 'home group', 'service', 'helping others', 'my part', 'making amends'],
      };
      
      const categoryMentions: Record<string, number> = {};
      Object.keys(keywordCategories).forEach(cat => categoryMentions[cat] = 0);
      
      messages.forEach(m => {
        const content = (m.content || '').toLowerCase();
        Object.entries(keywordCategories).forEach(([category, keywords]) => {
          keywords.forEach(kw => {
            if (content.includes(kw)) categoryMentions[category]++;
          });
        });
      });
      
      // Add any custom keywords from past moderator feedback
      const feedbackKeywords: string[] = [];
      if (pastFeedbackResult.data) {
        pastFeedbackResult.data.forEach((fb: { recommended_keywords?: string[] }) => {
          if (fb.recommended_keywords) feedbackKeywords.push(...fb.recommended_keywords);
        });
      }
      if (feedbackKeywords.length > 0) {
        let customMentions = 0;
        messages.forEach(m => {
          const content = (m.content || '').toLowerCase();
          feedbackKeywords.forEach(kw => {
            if (content.includes(kw.toLowerCase())) customMentions++;
          });
        });
        categoryMentions['moderator_flagged'] = customMentions;
      }
      
      // Calculate time periods for trend analysis
      const now = new Date();
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const last90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      
      const messagesLast7 = messages.filter(m => new Date(m.created_at) >= last7Days).length;
      const messagesLast30 = messages.filter(m => new Date(m.created_at) >= last30Days).length;
      const messagesLast90 = messages.filter(m => new Date(m.created_at) >= last90Days).length;
      
      // Calculate first message date for history depth
      const oldestMessage = messages.length > 0 ? new Date(messages[messages.length - 1].created_at) : null;
      const historyDepthDays = oldestMessage ? Math.floor((now.getTime() - oldestMessage.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      
      familyContext += `FAMILY COMMUNICATION PATTERNS (Complete History - ${historyDepthDays} Days):
- Total Messages (All Time): ${totalMessages}
- Messages Last 7 Days: ${messagesLast7}
- Messages Last 30 Days: ${messagesLast30}
- Messages Last 90 Days: ${messagesLast90}
- Active Participants: ${uniqueSenders}
- Average Message Length: ${avgMessageLength} characters
- History Depth: ${historyDepthDays} days of communication data

Keyword Pattern Detection (Full History):
${Object.entries(categoryMentions).filter(([, count]) => count > 0).map(([cat, count]) => `- ${cat.replace(/_/g, ' ')}: ${count} mentions`).join('\n') || '- No significant patterns detected'}

COMMUNICATION INTERPRETATION FRAMEWORK:
- Isolation + HALT states = early warning per Gorski model
- Minimization = Marlatt's "euphoric recall" pre-relapse indicator
- Boundary testing + financial pressure = manipulation pattern
- Triangulation = family systems dysfunction
- Progress + accountability + proactive = strong protective factors
- Crisis indicators require IMMEDIATE attention
- Long-term patterns (60+ days) reveal sustained behaviors vs temporary fluctuations

`;
    }

    // Add COMPLETE meeting attendance patterns (full history)
    if (meetingCheckinsResult.data && meetingCheckinsResult.data.length > 0) {
      const checkins = meetingCheckinsResult.data;
      const totalCheckins = checkins.length;
      const completedCheckouts = checkins.filter((c: { checked_out_at?: string }) => c.checked_out_at).length;
      const overdueAlerts = checkins.filter((c: { overdue_alert_sent?: boolean }) => c.overdue_alert_sent).length;
      const checkoutRate = totalCheckins > 0 ? Math.round((completedCheckouts / totalCheckins) * 100) : 0;
      
      // Calculate time periods for trend analysis
      const now = new Date();
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const last90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      
      const checkinsLast7 = checkins.filter((c: { checked_in_at: string }) => new Date(c.checked_in_at) >= last7Days).length;
      const checkinsLast30 = checkins.filter((c: { checked_in_at: string }) => new Date(c.checked_in_at) >= last30Days).length;
      const checkinsLast90 = checkins.filter((c: { checked_in_at: string }) => new Date(c.checked_in_at) >= last90Days).length;
      
      // Calculate first checkin for history depth
      const oldestCheckin = checkins.length > 0 ? new Date(checkins[checkins.length - 1].checked_in_at) : null;
      const historyDepthDays = oldestCheckin ? Math.floor((now.getTime() - oldestCheckin.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      const weeksOfHistory = Math.max(1, Math.ceil(historyDepthDays / 7));
      
      // Group by meeting type
      const meetingTypes: Record<string, number> = {};
      checkins.forEach((c: { meeting_type?: string }) => {
        const type = c.meeting_type || 'other';
        meetingTypes[type] = (meetingTypes[type] || 0) + 1;
      });
      
      familyContext += `MEETING ATTENDANCE (Complete History - ${historyDepthDays} Days):
- Total Check-ins (All Time): ${totalCheckins}
- Check-ins Last 7 Days: ${checkinsLast7}
- Check-ins Last 30 Days: ${checkinsLast30}
- Check-ins Last 90 Days: ${checkinsLast90}
- Completed Check-outs: ${completedCheckouts} (${checkoutRate}%)
- Overdue/Missed Checkouts (All Time): ${overdueAlerts}
- Weekly Average (Full History): ${(totalCheckins / weeksOfHistory).toFixed(1)} meetings/week
- Recent Weekly Average (Last 30 Days): ${(checkinsLast30 / Math.min(4, weeksOfHistory)).toFixed(1)} meetings/week

Meeting Types (All Time): ${Object.entries(meetingTypes).map(([type, count]) => `${type}(${count})`).join(', ')}

ATTENDANCE INTERPRETATION:
- 3+ meetings/week = strong protective factor for one-year goal
- Declining attendance = Gorski warning sign #4 (behavior change)
- Compare recent average to historical average for trend detection
- Missed checkouts may indicate avoidance or dishonesty
- Long-term consistency (90+ days) is more predictive than short-term spikes

`;
    }

    // Add COMPLETE emotional check-in patterns (full history)
    if (emotionalCheckinsResult.data && emotionalCheckinsResult.data.length > 0) {
      const checkins = emotionalCheckinsResult.data;
      const totalCheckins = checkins.length;
      const bypassedCount = checkins.filter((c: { was_bypassed?: boolean }) => c.was_bypassed).length;
      const bypassRate = totalCheckins > 0 ? Math.round((bypassedCount / totalCheckins) * 100) : 0;
      
      // Calculate time periods
      const now = new Date();
      const last7Days = now.toISOString().split('T')[0];
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const last90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const checkinsLast7 = checkins.filter((c: { check_in_date: string }) => c.check_in_date >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]).length;
      const checkinsLast30 = checkins.filter((c: { check_in_date: string }) => c.check_in_date >= last30Days).length;
      const checkinsLast90 = checkins.filter((c: { check_in_date: string }) => c.check_in_date >= last90Days).length;
      
      // Feeling distribution
      const feelings: Record<string, number> = {};
      checkins.forEach((c: { feeling?: string }) => {
        if (c.feeling) {
          feelings[c.feeling] = (feelings[c.feeling] || 0) + 1;
        }
      });
      
      const negativeFeelings = ['awful', 'struggling', 'anxious', 'sad', 'angry', 'overwhelmed'];
      const negativeCount = checkins.filter((c: { feeling?: string }) => negativeFeelings.includes(c.feeling?.toLowerCase() || '')).length;
      const negativeRate = totalCheckins > 0 ? Math.round((negativeCount / totalCheckins) * 100) : 0;
      
      // Calculate first checkin for history depth
      const oldestCheckin = checkins.length > 0 ? checkins[checkins.length - 1].check_in_date : null;
      const historyDepthDays = oldestCheckin ? Math.floor((now.getTime() - new Date(oldestCheckin).getTime()) / (1000 * 60 * 60 * 24)) : 0;
      
      familyContext += `EMOTIONAL CHECK-INS (Complete History - ${historyDepthDays} Days):
- Total Check-ins (All Time): ${totalCheckins}
- Check-ins Last 7 Days: ${checkinsLast7}
- Check-ins Last 30 Days: ${checkinsLast30}
- Check-ins Last 90 Days: ${checkinsLast90}
- Bypassed (All Time): ${bypassedCount} (${bypassRate}%)
- Negative States (All Time): ${negativeCount} (${negativeRate}%)
- Feeling Distribution: ${Object.entries(feelings).slice(0, 5).map(([f, c]) => `${f}(${c})`).join(', ')}

EMOTIONAL PATTERN INTERPRETATION:
- High bypass rate (>30%) = avoidance of self-reflection (Gorski warning sign)
- Sustained negative states = HALT pattern, intervention consideration
- Compare recent emotional states to historical baseline for trajectory
- Long-term emotional patterns are more significant than daily fluctuations

`;
    }

    // Add COMPLETE financial request patterns (full history)
    if (financialRequestsResult.data && financialRequestsResult.data.length > 0) {
      const requests = financialRequestsResult.data;
      const totalRequests = requests.length;
      const totalAmount = requests.reduce((sum: number, r: { amount?: number }) => sum + (r.amount || 0), 0);
      const approvedRequests = requests.filter((r: { status?: string }) => r.status === 'approved').length;
      const deniedRequests = requests.filter((r: { status?: string }) => r.status === 'denied').length;
      
      // Calculate time periods
      const now = new Date();
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const last90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      
      const requestsLast30 = requests.filter((r: { created_at: string }) => new Date(r.created_at) >= last30Days);
      const requestsLast90 = requests.filter((r: { created_at: string }) => new Date(r.created_at) >= last90Days);
      const amountLast30 = requestsLast30.reduce((sum: number, r: { amount?: number }) => sum + (r.amount || 0), 0);
      const amountLast90 = requestsLast90.reduce((sum: number, r: { amount?: number }) => sum + (r.amount || 0), 0);
      
      // Calculate first request for history depth
      const oldestRequest = requests.length > 0 ? new Date(requests[requests.length - 1].created_at) : null;
      const historyDepthDays = oldestRequest ? Math.floor((now.getTime() - oldestRequest.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      
      familyContext += `FINANCIAL REQUESTS (Complete History - ${historyDepthDays} Days):
- Total Requests (All Time): ${totalRequests}
- Requests Last 30 Days: ${requestsLast30.length}
- Requests Last 90 Days: ${requestsLast90.length}
- Total Amount (All Time): $${totalAmount}
- Amount Last 30 Days: $${amountLast30}
- Amount Last 90 Days: $${amountLast90}
- Approved (All Time): ${approvedRequests}
- Denied (All Time): ${deniedRequests}
- Average Request: $${totalRequests > 0 ? Math.round(totalAmount / totalRequests) : 0}

FINANCIAL PATTERN INTERPRETATION:
- Progressive escalation (increasing amounts over time) = manipulation warning
- Compare recent request frequency to historical baseline
- High denial rate = family setting boundaries appropriately
- Frequency > 2/week sustained = potential active use or compulsive behavior
- Long-term financial patterns reveal underlying behavior trends

`;
    }

    // Add CALIBRATION PATTERNS context for enhanced detection
    if (calibrationPatternsResult.data && calibrationPatternsResult.data.length > 0) {
      familyContext += `CALIBRATED CLINICAL PATTERNS (for detection reference):
${calibrationPatternsResult.data.map((p: { pattern_name: string; pattern_category: string; pattern_description: string }) => 
  `- ${p.pattern_name} (${p.pattern_category}): ${p.pattern_description}`
).join('\n')}

`;
    }

    // Add MODERATOR FEEDBACK LEARNINGS (corrections from past analyses)
    if (pastFeedbackResult.data && pastFeedbackResult.data.length > 0) {
      const feedback = pastFeedbackResult.data;
      const falsePositives = feedback.filter((f: { feedback_type: string }) => f.feedback_type === 'false_positive').length;
      const falseNegatives = feedback.filter((f: { feedback_type: string }) => f.feedback_type === 'false_negative').length;
      const corrections = feedback.filter((f: { feedback_type: string }) => f.feedback_type === 'wrong_severity' || f.feedback_type === 'pattern_correction');
      
      familyContext += `MODERATOR FEEDBACK LEARNINGS (From ${feedback.length} corrections):
- False Positives (over-flagged): ${falsePositives}
- False Negatives (missed): ${falseNegatives}

Recent Corrections to Apply:
${corrections.slice(0, 5).map((c: { feedback_type: string; correction_reasoning: string; missed_patterns?: string[] }) => 
  `- ${c.feedback_type}: "${c.correction_reasoning}" ${c.missed_patterns?.length ? `(Missed: ${c.missed_patterns.join(', ')})` : ''}`
).join('\n') || 'No recent corrections'}

APPLY THESE LEARNINGS: Adjust your analysis based on moderator corrections. If moderators have flagged false positives, be less aggressive. If they flagged missed patterns, be more attentive to those signals.

`;
    }

    // Add document analysis context
    if (documentsResult.data && documentsResult.data.length > 0) {
      const docs = documentsResult.data;
      const analyzedDocs = docs.filter(d => d.fiis_analyzed);
      const docsWithBoundaries = docs.filter(d => d.boundaries_extracted && d.boundaries_extracted > 0);
      const totalBoundariesExtracted = docsWithBoundaries.reduce((sum, d) => sum + (d.boundaries_extracted || 0), 0);
      
      // Group by document type
      const typeGroups: Record<string, number> = {};
      docs.forEach(d => {
        const type = d.document_type || 'other';
        typeGroups[type] = (typeGroups[type] || 0) + 1;
      });
      
      familyContext += `DOCUMENT ANALYSIS SUMMARY:
- Total Documents Uploaded: ${docs.length}
- Documents Analyzed: ${analyzedDocs.length}
- Documents with Boundaries Extracted: ${docsWithBoundaries.length}
- Total Boundaries Extracted from Documents: ${totalBoundariesExtracted}

Document Types:
${Object.entries(typeGroups).map(([type, count]) => `- ${type.replace(/_/g, ' ')}: ${count}`).join('\n')}

DOCUMENT ANALYSIS INTERPRETATION:
- Intervention letters with extracted boundaries indicate family commitment
- Clinical assessments provide baseline context for recovery trajectory
- Aftercare/discharge plans should align with current aftercare compliance
- Document engagement shows family investment in structured recovery

`;
    }

    // Build the analysis prompt
    let dataDescription = familyContext + "Recent family observations and events:\n\n";

    if (observations.length > 0) {
      dataDescription += "MANUAL OBSERVATIONS:\n";
      observations.forEach((obs, i) => {
        const date = new Date(obs.occurred_at).toLocaleDateString();
        dataDescription += `${i + 1}. [${date}] ${obs.type.toUpperCase()}: "${obs.content}"${obs.user_name ? ` (noted by ${obs.user_name})` : ""}\n`;
      });
      dataDescription += "\n";
    }

    if (autoEvents.length > 0) {
      dataDescription += "SYSTEM-TRACKED EVENTS:\n";
      autoEvents.forEach((event, i) => {
        const date = new Date(event.occurred_at).toLocaleDateString();
        const details = formatEventData(event.type, event.data);
        dataDescription += `${i + 1}. [${date}] ${event.type.replace(/_/g, " ").toUpperCase()}: ${details}${event.user_name ? ` (${event.user_name})` : ""}\n`;
      });
      dataDescription += "\n";
    }

    if (observations.length === 0 && autoEvents.length === 0) {
      return new Response(JSON.stringify({
        what_seeing: "No observations or events have been recorded yet.",
        pattern_signals: [],
        risk_level: 0,
        risk_level_name: "stable",
        contextual_framing: "Begin logging observations to start building a picture of family patterns over time.",
        clarifying_questions: ["What behaviors or conversations have you noticed recently?"],
        what_to_watch: ["Any changes in routines or responsibilities", "Communication patterns between family members"],
        recommend_professional: false,
        one_year_goal: {
          current_days: currentDays,
          days_remaining: daysToOneYear,
          progress_percentage: Math.min(100, Math.round((currentDays / 365) * 100)),
          current_phase: recoveryPhase || "Not started",
          likelihood_assessment: "insufficient_data",
          likelihood_factors: [],
        },
        predictive_indicators: [],
        goal_focused_suggestions: ["Start tracking observations to enable predictive analysis"],
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    dataDescription += `\nAnalyze these ${observations.length + autoEvents.length} data points using the risk-escalation framework. Focus on how these patterns affect the likelihood of reaching the ONE-YEAR sobriety goal. Determine the current risk level (0-4) and provide your assessment with predictive indicators.`;

    console.log("Calling Lovable AI for FIIS analysis with one-year goal focus...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: FIIS_SYSTEM_PROMPT },
          { role: "user", content: dataDescription },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_pattern_analysis",
              description: "Provide structured pattern analysis for the family using the risk-escalation framework with focus on the one-year sobriety goal",
              parameters: {
                type: "object",
                properties: {
                  risk_level: {
                    type: "number",
                    enum: [0, 1, 2, 3, 4],
                    description: "Current risk level: 0=Stable/On Track, 1=Early Drift, 2=Pattern Formation, 3=System Strain, 4=Critical Risk",
                  },
                  risk_level_name: {
                    type: "string",
                    enum: ["stable", "early_drift", "pattern_formation", "system_strain", "critical"],
                    description: "Name of the current risk level",
                  },
                  what_seeing: {
                    type: "string",
                    description: "Brief summary of observed patterns using observable facts. Start with 'In the last [timeframe]...' and connect to one-year goal impact.",
                  },
                  pattern_signals: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        signal_type: {
                          type: "string",
                          enum: [
                            "boundary_respected",
                            "boundary_exception",
                            "boundary_violation",
                            "financial_aligned",
                            "financial_exception",
                            "financial_manipulation",
                            "recovery_consistent",
                            "recovery_inconsistent",
                            "recovery_performative",
                            "emotional_stable",
                            "emotional_reactive",
                            "emotional_volatile",
                            "family_aligned",
                            "family_splitting",
                            "enabling_pattern",
                            "progress_indicator",
                            "regression_indicator",
                            "safety_concern"
                          ],
                        },
                        description: { type: "string" },
                        occurrences: { type: "number", description: "Number of times this pattern has been observed" },
                        confidence: { type: "string", enum: ["emerging", "forming", "clear"] },
                        priority: { type: "string", enum: ["low", "medium", "high", "critical"] },
                        one_year_impact: { 
                          type: "string", 
                          enum: ["supports_goal", "neutral", "threatens_goal"],
                          description: "How this pattern affects likelihood of reaching one year" 
                        },
                      },
                      required: ["signal_type", "description", "occurrences", "confidence", "priority", "one_year_impact"],
                    },
                    description: "Pattern signals detected in the data, ordered by priority",
                  },
                  contextual_framing: {
                    type: "string",
                    description: "Explanation connecting patterns to the one-year goal. Use 'this pattern suggests...' language.",
                  },
                  one_year_likelihood: {
                    type: "string",
                    enum: ["very_likely", "likely", "uncertain", "at_risk", "critical_risk"],
                    description: "Current assessment of likelihood to reach one year based on observed patterns",
                  },
                  one_year_likelihood_reasoning: {
                    type: "string",
                    description: "Explanation of why this likelihood assessment was made",
                  },
                  predictive_indicators: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        indicator_type: { 
                          type: "string", 
                          enum: ["positive", "negative", "neutral"],
                          description: "Whether this indicator increases or decreases one-year likelihood"
                        },
                        indicator: { type: "string", description: "The specific indicator observed" },
                        impact_level: { type: "string", enum: ["minor", "moderate", "significant"] },
                        recommendation: { type: "string", description: "What to do about this indicator" },
                      },
                      required: ["indicator_type", "indicator", "impact_level", "recommendation"],
                    },
                    description: "Predictive indicators affecting one-year goal likelihood",
                  },
                  goal_focused_suggestions: {
                    type: "array",
                    items: { type: "string" },
                    description: "Specific actionable suggestions to increase likelihood of reaching one year",
                  },
                  behaviors_to_reinforce: {
                    type: "array",
                    items: { type: "string" },
                    description: "Positive behaviors observed that should be acknowledged and reinforced",
                  },
                  behaviors_to_address: {
                    type: "array",
                    items: { type: "string" },
                    description: "Behaviors that need attention to stay on track to one year",
                  },
                  risk_trajectory: {
                    type: "object",
                    properties: {
                      direction: { 
                        type: "string", 
                        enum: ["improving", "stable", "declining"],
                        description: "Overall direction of risk over time"
                      },
                      trend_description: { type: "string", description: "Narrative of how risk has changed over the observation period" },
                      contributing_factors: {
                        type: "array",
                        items: { type: "string" },
                        description: "Key factors driving the risk trajectory"
                      },
                      projected_outcome: { type: "string", description: "Where current trajectory leads if unchanged" },
                    },
                    required: ["direction", "trend_description", "contributing_factors", "projected_outcome"],
                    description: "Analysis of how risk levels are changing over time",
                  },
                  compliance_trends: {
                    type: "object",
                    properties: {
                      overall_compliance: { 
                        type: "string", 
                        enum: ["excellent", "good", "moderate", "poor", "critical"],
                        description: "Overall level of compliance with recovery program requirements"
                      },
                      meeting_attendance: { 
                        type: "string", 
                        enum: ["consistent", "mostly_consistent", "inconsistent", "declining", "absent"],
                        description: "Trend in meeting/appointment attendance"
                      },
                      check_in_reliability: { 
                        type: "string", 
                        enum: ["reliable", "mostly_reliable", "inconsistent", "unreliable"],
                        description: "Reliability of check-ins and check-outs"
                      },
                      boundary_adherence: { 
                        type: "string", 
                        enum: ["strong", "good", "mixed", "weak", "none"],
                        description: "How well boundaries are being respected"
                      },
                      financial_transparency: { 
                        type: "string", 
                        enum: ["transparent", "mostly_transparent", "selective", "opaque"],
                        description: "Level of financial transparency in requests and reporting"
                      },
                      trend_direction: { 
                        type: "string", 
                        enum: ["improving", "stable", "declining"],
                        description: "Overall direction of compliance trends"
                      },
                      compliance_notes: { type: "string", description: "Additional context about compliance patterns" },
                    },
                    required: ["overall_compliance", "meeting_attendance", "check_in_reliability", "boundary_adherence", "financial_transparency", "trend_direction"],
                    description: "Analysis of compliance with recovery program requirements and expectations",
                  },
                  transition_readiness: {
                    type: "object",
                    properties: {
                      readiness_level: { 
                        type: "string", 
                        enum: ["not_ready", "early_preparation", "preparing", "nearly_ready", "ready"],
                        description: "How ready the individual is for the next recovery phase"
                      },
                      current_phase_mastery: { 
                        type: "number", 
                        minimum: 0, 
                        maximum: 100,
                        description: "Percentage of current phase skills/milestones demonstrated"
                      },
                      strengths_demonstrated: {
                        type: "array",
                        items: { type: "string" },
                        description: "Recovery strengths being consistently demonstrated"
                      },
                      areas_needing_development: {
                        type: "array",
                        items: { type: "string" },
                        description: "Areas that need more development before transition"
                      },
                      recommended_focus: {
                        type: "array",
                        items: { type: "string" },
                        description: "What to focus on to prepare for next phase"
                      },
                      estimated_readiness_timeline: { 
                        type: "string", 
                        description: "Estimated time until ready for next phase transition (e.g., '2-4 weeks', '1-2 months')"
                      },
                      transition_risks: {
                        type: "array",
                        items: { type: "string" },
                        description: "Risks that could impact successful transition"
                      },
                    },
                    required: ["readiness_level", "current_phase_mastery", "strengths_demonstrated", "areas_needing_development", "recommended_focus"],
                    description: "Assessment of readiness to transition to the next phase of recovery",
                  },
                  clarifying_questions: {
                    type: "array",
                    items: { type: "string" },
                    description: "1-3 neutral clarification questions focused on facts, timing, and follow-through",
                  },
                  what_to_watch: {
                    type: "array",
                    items: { type: "string" },
                    description: "Specific behaviors to monitor that affect one-year goal - early warning signs or improvement indicators",
                  },
                  recommend_professional: {
                    type: "boolean",
                    description: "Whether to recommend inviting a professional moderator to protect the one-year goal",
                  },
                  professional_recommendation_reason: {
                    type: "string",
                    description: "If recommending a professional, explain why in terms of protecting the one-year goal.",
                  },
                  positive_reinforcement: {
                    type: "array",
                    items: { type: "string" },
                    description: "Specific healthy behaviors to acknowledge that support reaching one year",
                  },
                  provider_clinical_insights: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        insight_category: {
                          type: "string",
                          enum: [
                            "boundary_consistency",
                            "help_seeking_latency",
                            "intervention_consideration",
                            "accountability_trajectory",
                            "engagement_pattern",
                            "family_alignment",
                            "communication_frequency",
                            "financial_transparency"
                          ],
                          description: "Category of clinical observation - focus on patterns over time"
                        },
                        pattern_summary: {
                          type: "string",
                          description: "Observable behavioral pattern with trend data. Use trajectory language, NOT predictions. Example: 'Boundary consistency trajectory: declining 22% over 30 days' NOT 'Risk of relapse increasing'"
                        },
                        trajectory_direction: {
                          type: "string",
                          enum: ["improving", "stable", "declining"],
                          description: "Direction of the behavioral trajectory (NOT risk prediction)"
                        },
                        magnitude: {
                          type: "number",
                          description: "Percentage magnitude of change (positive = improvement direction, negative = declining direction)"
                        },
                        observation_period: {
                          type: "string",
                          description: "Time window for this observation (e.g., '30 days', '2 weeks', 'since last analysis')"
                        },
                        clinical_consideration: {
                          type: "string",
                          description: "What this pattern may warrant exploring. Use 'consider' and 'may' language. Never directive or diagnostic."
                        },
                        action_question: {
                          type: "string",
                          description: "Frame as a question for the provider: 'What adjustment to care approach might support...?' Always actionable, never prescriptive."
                        },
                        review_priority: {
                          type: "string",
                          enum: ["routine_monitoring", "warrants_discussion", "priority_review"],
                          description: "Priority level for clinical review - NOT urgency or risk level"
                        }
                      },
                      required: ["insight_category", "pattern_summary", "trajectory_direction", "clinical_consideration", "action_question", "review_priority"]
                    },
                    description: "Pattern-based clinical insights for provider review. MUST follow principles: Pattern>Events (trends not transcripts), Signal>Sentiment (no emotional content), Actionable>Interesting (every element answers 'what should I do differently?'), Non-Predictive (trajectory not risk), Clinical Neutrality (considerations not orders)."
                  },
                },
                required: [
                  "risk_level", 
                  "risk_level_name", 
                  "what_seeing", 
                  "pattern_signals", 
                  "contextual_framing", 
                  "one_year_likelihood",
                  "one_year_likelihood_reasoning",
                  "predictive_indicators",
                  "goal_focused_suggestions",
                  "behaviors_to_reinforce",
                  "behaviors_to_address",
                  "risk_trajectory",
                  "compliance_trends",
                  "transition_readiness",
                  "provider_clinical_insights",
                  "clarifying_questions", 
                  "what_to_watch", 
                  "recommend_professional"
                ],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "provide_pattern_analysis" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI service payment required." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await response.json();
    console.log("AI response received:", JSON.stringify(aiResult).substring(0, 500));

    let analysis;
    try {
      const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        analysis = JSON.parse(toolCall.function.arguments);
      } else {
        // Fallback to content if no tool call
        const content = aiResult.choices?.[0]?.message?.content || "";
        analysis = {
          what_seeing: content,
          pattern_signals: [],
          risk_level: 0,
          risk_level_name: "stable",
          contextual_framing: "Analysis provided as text response.",
          one_year_likelihood: "uncertain",
          one_year_likelihood_reasoning: "Unable to assess due to parsing limitations.",
          predictive_indicators: [],
          goal_focused_suggestions: [],
          behaviors_to_reinforce: [],
          behaviors_to_address: [],
          provider_clinical_alerts: [],
          clarifying_questions: [],
          what_to_watch: [],
          recommend_professional: false,
        };
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      analysis = {
        what_seeing: "Unable to parse analysis. Please try again.",
        pattern_signals: [],
        risk_level: 0,
        risk_level_name: "stable",
        contextual_framing: "",
        one_year_likelihood: "uncertain",
        one_year_likelihood_reasoning: "",
        predictive_indicators: [],
        goal_focused_suggestions: [],
        behaviors_to_reinforce: [],
        behaviors_to_address: [],
        provider_clinical_alerts: [],
        clarifying_questions: [],
        what_to_watch: [],
        recommend_professional: false,
      };
    }

    // Add one-year goal context to the response
    analysis.one_year_goal = {
      current_days: currentDays,
      days_remaining: daysToOneYear,
      progress_percentage: Math.min(100, Math.round((currentDays / 365) * 100)),
      current_phase: recoveryPhase || "Not started",
      likelihood_assessment: analysis.one_year_likelihood,
      likelihood_reasoning: analysis.one_year_likelihood_reasoning,
    };

    // Store the analysis result
    const { error: insertError } = await supabase
      .from("fiis_pattern_analyses")
      .insert({
        family_id: familyId,
        requested_by: user.id,
        analysis_type: "full",
        input_summary: { 
          observation_count: observations.length, 
          event_count: autoEvents.length,
          risk_level: analysis.risk_level,
          risk_level_name: analysis.risk_level_name,
          recommend_professional: analysis.recommend_professional,
          one_year_likelihood: analysis.one_year_likelihood,
          current_sobriety_days: currentDays,
          recovery_phase: recoveryPhase,
        },
        pattern_signals: analysis.pattern_signals || [],
        what_seeing: analysis.what_seeing,
        contextual_framing: analysis.contextual_framing,
        clarifying_questions: analysis.clarifying_questions || [],
        what_to_watch: analysis.what_to_watch || [],
      });

    if (insertError) {
      console.error("Error storing analysis:", insertError);
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("FIIS analyze error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function formatEventData(type: string, data: Record<string, unknown>): string {
  switch (type) {
    case "checkin":
      return `Checked in at ${data.meeting_name || data.meeting_type || "meeting"}${data.address ? ` (${data.address})` : ""}`;
    case "checkout":
      return `Checked out from meeting`;
    case "missed_checkout":
      return `Missed scheduled checkout from meeting`;
    case "financial_request":
      return `Requested $${data.amount} for ${data.reason}`;
    case "financial_approved":
      return `Financial request for $${data.amount} was approved`;
    case "financial_denied":
      return `Financial request for $${data.amount} was denied`;
    case "message_filtered":
      return `A message was filtered for content`;
    case "boundary_proposed":
      return `Proposed boundary: "${data.content}"`;
    case "boundary_approved":
      return `Boundary was approved`;
    case "boundary_violated":
      return `Boundary violation detected: "${data.boundary}"`;
    case "location_request":
      return `Location check-in was requested`;
    case "location_shared":
      return `Shared location${data.address ? ` at ${data.address}` : ""}`;
    case "location_declined":
      return `Declined to share location`;
    case "emotional_checkin":
      return `Emotional check-in: "${data.feeling}"${data.was_bypassed ? " (bypassed)" : ""}`;
    case "emotional_bypass":
      return `Bypassed emotional check-in${data.inferred_state ? ` (inferred: ${data.inferred_state})` : ""}`;
    case "sobriety_reset":
      return `Sobriety counter was reset - starting fresh`;
    case "milestone_reached":
      return `Reached ${data.days} day milestone (${data.days === 365 ? "ONE YEAR ACHIEVED!" : `${Math.round((Number(data.days) / 365) * 100)}% to one year`})`;
    default:
      return JSON.stringify(data);
  }
}
