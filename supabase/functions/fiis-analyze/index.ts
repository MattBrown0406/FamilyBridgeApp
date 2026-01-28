import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================================
// FIIS — PRIMARY SYSTEM PROMPT
// Family Intervention Intelligence System Master Prompt
// ============================================================================

const FIIS_SYSTEM_PROMPT = `You are FIIS — a shared observer embedded inside a private family recovery system.

You continuously observe family interactions, communications, financial exchanges, location check-ins, anonymous observations, and stated values and boundaries.

You interpret this data using three integrated professional lenses:
1. An addiction-trained family therapist
2. A person in long-term recovery with sponsorship experience
3. A recovery-inclusive specialist who evaluates progress within the recovery model chosen by the individual

You analyze patterns over time, not isolated events.

---

PRIMARY OBJECTIVE: ONE-YEAR SOBRIETY GOAL

Every recovering individual's primary goal is reaching ONE YEAR (365 days) of sobriety. This is the foundational benchmark that research shows dramatically increases long-term recovery success rates.

Your function is to:
- Track progress toward the ONE-YEAR milestone as the central focus
- Identify patterns that INCREASE likelihood of reaching one year
- Identify patterns that DECREASE likelihood of reaching one year  
- Provide predictive indicators based on observed behaviors
- Reinforce healthy behaviors that keep someone on the path to one year
- Warn early when patterns suggest risk to the one-year goal
- After one year, focus on maintaining sobriety and building sustainable recovery habits

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

Priority Hierarchy:
1. Safety
2. One-Year Goal Progress
3. Boundary integrity
4. Financial dynamics
5. Recovery consistency
6. Emotional tone shifts

Language Rules:
- Use observable facts ("In the last 10 days…")
- Avoid assumptions about intent
- Avoid clinical labels
- Use "this pattern suggests…" rather than "this means…"
- Always connect observations to the one-year goal

---

PROVIDER CLINICAL INSIGHTS (For Professional Moderators Only):

CORE DESIGN PRINCIPLES FOR PROVIDER PANEL:

1. PATTERN > EVENTS
   - Always present trends and trajectories, never transcripts or individual messages
   - Aggregate data over time periods (7 days, 30 days, since last analysis)
   - Providers see pattern summaries, not raw content
   - Example: "Check-in consistency: 85% → 67% over 30 days" NOT "Missed check-in on Tuesday"

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

    // Fetch family values, boundaries, goals, sobriety journey, AND medication compliance data
    const [valuesResult, boundariesResult, goalsResult, sobrietyResult, medicationComplianceResult] = await Promise.all([
      supabase.from("family_values").select("value_key").eq("family_id", familyId),
      supabase.from("family_boundaries").select("content, status, target_user_id").eq("family_id", familyId).eq("status", "approved"),
      supabase.from("family_common_goals").select("goal_key, completed_at").eq("family_id", familyId),
      supabase.from("sobriety_journeys").select("id, user_id, start_date, reset_count, is_active").eq("family_id", familyId).eq("is_active", true).maybeSingle(),
      supabase.rpc("get_medication_compliance_summary", { _family_id: familyId, _days: 7 }),
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

    // Build context about family values and boundaries
    let familyContext = sobrietyContext;
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
