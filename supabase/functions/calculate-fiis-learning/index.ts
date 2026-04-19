import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ConfidenceLevel = "low" | "moderate" | "high";
type ProposalStatus = "pending" | "auto_applied";

type ProposalDraft = {
  proposal_type: "sensitivity_adjustment" | "recommendation_priority" | "tone_bias" | "pattern_emphasis" | "context_weight";
  parameter_key: string;
  rationale: string;
  proposed_value: Record<string, unknown>;
  evidence: Record<string, unknown>;
  change_magnitude_pct: number;
  auto_apply_eligible: boolean;
};

const safePct = (value: number | null | undefined) => value === null || value === undefined || Number.isNaN(value)
  ? null
  : Math.round(value * 100) / 100;

const ratioPct = (numerator: number, denominator: number) => {
  if (!denominator) return null;
  return safePct((numerator / denominator) * 100);
};

const confidenceFromEvidence = (sessions: number, feedback: number, outcomes: number): ConfidenceLevel => {
  const weighted = sessions + (feedback * 2) + (outcomes * 3);
  if (weighted >= 40 || outcomes >= 8 || feedback >= 10) return "high";
  if (weighted >= 16 || outcomes >= 3 || feedback >= 4) return "moderate";
  return "low";
};

const determineStatus = (confidence: ConfidenceLevel, autoApplyEligible: boolean): ProposalStatus =>
  autoApplyEligible && (confidence === "moderate" || confidence === "high") ? "auto_applied" : "pending";

const summarizeEvidence = (parts: Array<string | null | undefined>) => parts.filter(Boolean) as string[];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authorization required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { family_id, window_days = 90 } = await req.json();
    if (!family_id) {
      return new Response(JSON.stringify({ error: "family_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authed = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: userData, error: userError } = await authed.auth.getUser();
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = userData.user;

    const { data: familyRow } = await supabase
      .from("families")
      .select("organization_id")
      .eq("id", family_id)
      .maybeSingle();

    const [familyMemberRes, orgMemberRes] = await Promise.all([
      supabase.from("family_members").select("role").eq("family_id", family_id).eq("user_id", user.id).maybeSingle(),
      familyRow?.organization_id
        ? supabase.from("organization_members").select("id").eq("organization_id", familyRow.organization_id).eq("user_id", user.id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    if (!familyMemberRes.data && !orgMemberRes.data) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const windowStart = new Date(Date.now() - window_days * 24 * 60 * 60 * 1000).toISOString();

    const [sessionsRes, feedbackRes, outcomesRes, moderatorSessionsRes, latestProposalRes] = await Promise.all([
      supabase
        .from("coaching_sessions")
        .select("id, session_type, started_at, ended_at, suggestions, talking_to_name")
        .eq("family_id", family_id)
        .gte("started_at", windowStart)
        .order("started_at", { ascending: false })
        .limit(200),
      supabase
        .from("fiis_analysis_feedback")
        .select("id, feedback_type, accuracy_rating, created_at")
        .eq("family_id", family_id)
        .gte("created_at", windowStart)
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("fiis_coaching_outcomes")
        .select("id, outcome_status, deescalated, boundary_held, relapse_signal_confirmed, created_at")
        .eq("family_id", family_id)
        .gte("created_at", windowStart)
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("fiis_moderator_sessions")
        .select("id, runtime_confidence, runtime_flags, guidance_style, escalation_level, response_latency_ms, tokens_in, tokens_out, created_at")
        .eq("family_id", family_id)
        .gte("created_at", windowStart)
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("fiis_adaptation_proposals")
        .select("id, parameter_key, proposed_value, status, created_at")
        .eq("family_id", family_id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    const sessions = sessionsRes.data || [];
    const feedback = feedbackRes.data || [];
    const outcomes = outcomesRes.data || [];
    const moderatorSessions = moderatorSessionsRes.data || [];
    const latestProposals = latestProposalRes.data || [];

    const coachingSessionsCount = sessions.length;
    const moderatorSessionCount = moderatorSessions.length;
    const persistedSessionCount = sessions.filter((session: any) => Array.isArray(session.suggestions) && session.suggestions.length > 0).length;
    const liveSessionCount = sessions.filter((session: any) => ["live_speakerphone", "live_text"].includes(session.session_type)).length;
    const screenshotSessionCount = sessions.filter((session: any) => session.session_type === "screenshot").length;

    const feedbackCount = feedback.length;
    const falsePositiveCount = feedback.filter((item: any) => item.feedback_type === "false_positive").length;
    const falseNegativeCount = feedback.filter((item: any) => item.feedback_type === "false_negative").length;
    const wrongSeverityCount = feedback.filter((item: any) => item.feedback_type === "wrong_severity").length;
    const missingContextCount = feedback.filter((item: any) => item.feedback_type === "missing_context").length;
    const misinterpretationCount = feedback.filter((item: any) => item.feedback_type === "misinterpretation").length;
    const reinforcementCount = feedback.filter((item: any) => item.feedback_type === "reinforcement").length;

    const outcomeCount = outcomes.length;
    const helpfulishCount = outcomes.filter((item: any) => ["helpful", "stabilized"].includes(item.outcome_status)).length;
    const stabilizedCount = outcomes.filter((item: any) => item.outcome_status === "stabilized" || item.deescalated === true).length;
    const unhelpfulCount = outcomes.filter((item: any) => ["unhelpful", "escalated"].includes(item.outcome_status)).length;
    const boundaryHoldKnown = outcomes.filter((item: any) => item.boundary_held !== null && item.boundary_held !== undefined);
    const boundaryHeldCount = boundaryHoldKnown.filter((item: any) => item.boundary_held === true).length;
    const relapseKnown = outcomes.filter((item: any) => item.relapse_signal_confirmed !== null && item.relapse_signal_confirmed !== undefined);
    const relapseConfirmedCount = relapseKnown.filter((item: any) => item.relapse_signal_confirmed === true).length;

    const falsePositiveRate = ratioPct(falsePositiveCount, feedbackCount);
    const falseNegativeRate = ratioPct(falseNegativeCount, feedbackCount);
    const helpfulRate = ratioPct(helpfulishCount, outcomeCount);
    const stabilizationRate = ratioPct(stabilizedCount, outcomeCount);
    const boundaryHoldRate = ratioPct(boundaryHeldCount, boundaryHoldKnown.length);
    const relapseSignalConfirmationRate = ratioPct(relapseConfirmedCount, relapseKnown.length);
    const persistenceRate = ratioPct(persistedSessionCount, coachingSessionsCount);
    const briefConcreteSessions = sessions.filter((session: any) => session.guidance_style === "brief_concrete").length;
    const boundaryForwardSessions = sessions.filter((session: any) => session.guidance_style === "boundary_forward").length;
    const deescalationFirstSessions = sessions.filter((session: any) => session.guidance_style === "deescalation_first").length;
    const lowConfidenceSessions = sessions.filter((session: any) => session.runtime_confidence === "low").length;
    const highEscalationSessions = moderatorSessions.filter((session: any) => Number(session.escalation_level || 0) >= 3).length;
    const avgResponseLatency = sessions.length > 0
      ? Math.round(sessions.reduce((sum: number, session: any) => sum + Number(session?.telemetry?.latency_ms || 0), 0) / sessions.length)
      : 0;

    const confidence = confidenceFromEvidence(coachingSessionsCount + Math.round(moderatorSessionCount * 0.5), feedbackCount, outcomeCount);

    const evidenceSummary = summarizeEvidence([
      coachingSessionsCount ? `${coachingSessionsCount} coaching sessions analyzed in the last ${window_days} days (${liveSessionCount} live, ${screenshotSessionCount} screenshot).` : null,
      moderatorSessionCount ? `${moderatorSessionCount} moderator FIIS sessions captured in the same window, with ${highEscalationSessions} at escalation level 3 or 4.` : null,
      feedbackCount ? `${feedbackCount} moderator corrections logged, with ${falsePositiveCount} false positives and ${falseNegativeCount} false negatives.` : null,
      outcomeCount ? `${outcomeCount} coaching outcomes recorded, with ${helpfulishCount} marked helpful/stabilizing and ${unhelpfulCount} marked unhelpful/escalating.` : null,
      boundaryHoldRate !== null ? `Boundary hold rate after FIIS guidance is ${Math.round(boundaryHoldRate)}%.` : null,
      relapseSignalConfirmationRate !== null ? `Relapse-signal confirmation rate is ${Math.round(relapseSignalConfirmationRate)}%.` : null,
      reinforcementCount ? `${reinforcementCount} feedback entries reinforced existing FIIS instincts.` : null,
      avgResponseLatency ? `Average coaching response latency was ${avgResponseLatency} ms.` : null,
      briefConcreteSessions ? `${briefConcreteSessions} coaching sessions ran in brief concrete guidance mode.` : null,
    ]);

    const drafts: ProposalDraft[] = [];

    if (feedbackCount >= 5 && (falsePositiveRate ?? 0) >= 35) {
      drafts.push({
        proposal_type: "sensitivity_adjustment",
        parameter_key: "risk_escalation_threshold",
        rationale: "FIIS has been over-flagging too often for this family. Require stronger multi-signal convergence before escalating to high or critical concern unless there is direct safety language or confirmed use.",
        proposed_value: {
          mode: "slightly_higher_threshold",
          instruction: "Require stronger multi-signal convergence before escalating to high or critical risk unless there is direct safety language, overdose risk, or confirmed use.",
          focus: "Reduce false-positive escalation without muting clear safety concerns.",
        },
        evidence: { false_positive_rate: falsePositiveRate, feedback_count: feedbackCount },
        change_magnitude_pct: 5,
        auto_apply_eligible: true,
      });
    }

    if (feedbackCount >= 5 && (falseNegativeRate ?? 0) >= 25) {
      drafts.push({
        proposal_type: "pattern_emphasis",
        parameter_key: "early_warning_cluster_weight",
        rationale: "FIIS has been missing too many low-grade but meaningful warning clusters. Increase attention to repeated combinations of silence, isolation, minimization, urgency, and missed structure.",
        proposed_value: {
          mode: "slightly_more_sensitive",
          instruction: "Increase weighting on repeated low-intensity warning clusters like silence + isolation, minimization + urgency, or bypassed check-ins + reduced structure.",
          focus: "Catch earlier drift without jumping straight to crisis framing.",
        },
        evidence: { false_negative_rate: falseNegativeRate, feedback_count: feedbackCount },
        change_magnitude_pct: 6,
        auto_apply_eligible: true,
      });
    }

    if (feedbackCount >= 4 && (wrongSeverityCount + missingContextCount + misinterpretationCount) >= 3) {
      drafts.push({
        proposal_type: "context_weight",
        parameter_key: "family_context_weighting",
        rationale: "Recent corrections show FIIS needs to lean harder on family-specific context before drawing conclusions.",
        proposed_value: {
          mode: "context_first",
          instruction: "Before making a strong claim, anchor harder on family-specific boundaries, current recovery phase, provider notes, and recent coaching history.",
          focus: "Reduce decontextualized pattern calls.",
        },
        evidence: {
          wrong_severity_count: wrongSeverityCount,
          missing_context_count: missingContextCount,
          misinterpretation_count: misinterpretationCount,
          feedback_count: feedbackCount,
        },
        change_magnitude_pct: 5,
        auto_apply_eligible: true,
      });
    }

    if (outcomeCount >= 4 && helpfulRate !== null && helpfulRate < 40) {
      drafts.push({
        proposal_type: "tone_bias",
        parameter_key: "response_style_balance",
        rationale: "Recorded outcomes suggest FIIS guidance is not landing cleanly enough. Favor shorter, calmer, more concrete coaching when confidence is only moderate.",
        proposed_value: {
          mode: "more_concrete_and_brief",
          instruction: "Prefer shorter, calmer, more specific coaching. Reduce abstract interpretation and use one clear next step when confidence is moderate.",
          focus: "Improve usability and reduce overwhelm.",
        },
        evidence: { helpful_rate: helpfulRate, outcome_count: outcomeCount },
        change_magnitude_pct: 4,
        auto_apply_eligible: true,
      });
    }

    if (outcomeCount >= 4 && helpfulRate !== null && helpfulRate >= 75 && (stabilizationRate ?? 0) >= 60) {
      drafts.push({
        proposal_type: "recommendation_priority",
        parameter_key: "deescalation_script_priority",
        rationale: "FIIS de-escalation guidance is working well for this family. Surface de-escalation and boundary scripts earlier in similar situations.",
        proposed_value: {
          mode: "promote",
          instruction: "Prioritize de-escalation language and one-line boundary scripts earlier when the situation resembles prior successful calming scenarios.",
          focus: "Lean into what has been working.",
        },
        evidence: { helpful_rate: helpfulRate, stabilization_rate: stabilizationRate, outcome_count: outcomeCount },
        change_magnitude_pct: 4,
        auto_apply_eligible: true,
      });
    }

    if (boundaryHoldRate !== null && boundaryHoldRate < 50 && outcomeCount >= 4) {
      drafts.push({
        proposal_type: "recommendation_priority",
        parameter_key: "boundary_clarity_priority",
        rationale: "Coaching is not translating into firm enough follow-through. Surface clearer one-sentence boundaries and explicit consequence language earlier.",
        proposed_value: {
          mode: "promote",
          instruction: "When requests involve money, transport, rescues, or late-night urgency, move concrete boundary wording and consequence framing earlier in the response.",
          focus: "Support follow-through, not just empathy.",
        },
        evidence: { boundary_hold_rate: boundaryHoldRate, outcome_count: outcomeCount },
        change_magnitude_pct: 5,
        auto_apply_eligible: true,
      });
    }

    if (coachingSessionsCount >= 6 && lowConfidenceSessions >= Math.ceil(coachingSessionsCount * 0.5)) {
      drafts.push({
        proposal_type: "context_weight",
        parameter_key: "confidence_floor_reduction",
        rationale: "FIIS is spending too much time in low-confidence mode. Tighten context assembly and simplify output shape before making strong claims.",
        proposed_value: {
          mode: "simplify_when_uncertain",
          instruction: "When confidence is low, reduce interpretive sprawl, name uncertainty plainly, and prioritize one specific next move over layered analysis.",
          focus: "Improve usefulness when FIIS lacks enough signal density.",
        },
        evidence: { low_confidence_sessions: lowConfidenceSessions, coaching_sessions_count: coachingSessionsCount },
        change_magnitude_pct: 4,
        auto_apply_eligible: true,
      });
    }

    if (moderatorSessionCount >= 5 && highEscalationSessions >= Math.ceil(moderatorSessionCount * 0.4) && (falsePositiveRate ?? 0) < 25) {
      drafts.push({
        proposal_type: "recommendation_priority",
        parameter_key: "moderator_escalation_clarity",
        rationale: "Moderators are repeatedly using high-escalation FIIS paths. Surface clearer professional-support handoff structure and consequence framing sooner in moderator guidance.",
        proposed_value: {
          mode: "promote",
          instruction: "In moderator guidance, move recommended next-step handoff actions, containment moves, and consequence clarity higher in the response when escalation is high.",
          focus: "Support cleaner moderator intervention execution.",
        },
        evidence: { moderator_session_count: moderatorSessionCount, high_escalation_sessions: highEscalationSessions },
        change_magnitude_pct: 5,
        auto_apply_eligible: true,
      });
    }

    const latestByKey = new Map<string, any>();
    for (const proposal of latestProposals) {
      if (!latestByKey.has(proposal.parameter_key)) {
        latestByKey.set(proposal.parameter_key, proposal);
      }
    }

    const inserts = drafts.filter((draft) => {
      const latest = latestByKey.get(draft.parameter_key);
      if (!latest) return true;
      const sameInstruction = JSON.stringify(latest.proposed_value || {}) === JSON.stringify(draft.proposed_value || {});
      const recentAgeMs = Date.now() - new Date(latest.created_at).getTime();
      const isRecent = recentAgeMs < 7 * 24 * 60 * 60 * 1000;
      return !(sameInstruction && isRecent && ["pending", "auto_applied", "approved"].includes(latest.status));
    }).map((draft) => {
      const status = determineStatus(confidence, draft.auto_apply_eligible);
      return {
        family_id,
        scope: "family",
        engine: "fiis",
        proposal_type: draft.proposal_type,
        parameter_key: draft.parameter_key,
        current_value: { mode: "baseline" },
        proposed_value: draft.proposed_value,
        evidence: draft.evidence,
        rationale: draft.rationale,
        confidence,
        change_magnitude_pct: draft.change_magnitude_pct,
        sample_size: coachingSessionsCount + feedbackCount + outcomeCount,
        auto_apply_eligible: draft.auto_apply_eligible,
        status,
        created_by: "system",
      };
    });

    let insertedProposals: any[] = [];
    if (inserts.length > 0) {
      const { data, error } = await supabase
        .from("fiis_adaptation_proposals")
        .insert(inserts)
        .select("id, parameter_key, status, proposed_value, confidence, sample_size, change_magnitude_pct");
      if (error) throw error;
      insertedProposals = data || [];

      if (insertedProposals.length > 0) {
        await supabase.from("fiis_adaptation_audit_log").insert(
          insertedProposals.flatMap((proposal) => ([
            {
              family_id,
              proposal_id: proposal.id,
              action: "proposal_created",
              actor_type: "system",
              detail: `System proposed ${proposal.parameter_key}`,
              metadata: { status: proposal.status, proposed_value: proposal.proposed_value },
            },
            ...(proposal.status === "auto_applied"
              ? [{
                  family_id,
                  proposal_id: proposal.id,
                  action: "auto_applied",
                  actor_type: "system",
                  detail: `System auto-applied ${proposal.parameter_key}`,
                  metadata: { proposed_value: proposal.proposed_value },
                }]
              : []),
          ]))
        );
      }
    }

    const { data: activeProposalData } = await supabase
      .from("fiis_adaptation_proposals")
      .select("id, parameter_key, proposal_type, proposed_value, rationale, confidence, status, sample_size, change_magnitude_pct")
      .eq("family_id", family_id)
      .in("status", ["auto_applied", "approved"])
      .order("created_at", { ascending: false })
      .limit(8);

    const activeAdaptations = activeProposalData || [];

    const snapshotMetrics = {
      window_days,
      live_session_count: liveSessionCount,
      screenshot_session_count: screenshotSessionCount,
      moderator_session_count: moderatorSessionCount,
      persistence_rate: persistenceRate,
      brief_concrete_sessions: briefConcreteSessions,
      boundary_forward_sessions: boundaryForwardSessions,
      deescalation_first_sessions: deescalationFirstSessions,
      low_confidence_sessions: lowConfidenceSessions,
      high_escalation_sessions: highEscalationSessions,
      avg_response_latency_ms: avgResponseLatency,
      false_positive_count: falsePositiveCount,
      false_negative_count: falseNegativeCount,
      wrong_severity_count: wrongSeverityCount,
      missing_context_count: missingContextCount,
      misinterpretation_count: misinterpretationCount,
      reinforcement_count: reinforcementCount,
      relapse_signal_confirmation_rate: relapseSignalConfirmationRate,
    };

    const { data: snapshotRows, error: snapshotError } = await supabase
      .from("fiis_learning_snapshots")
      .insert({
        family_id,
        window_days,
        coaching_sessions_count: coachingSessionsCount,
        feedback_count: feedbackCount,
        outcome_count: outcomeCount,
        false_positive_rate: falsePositiveRate,
        false_negative_rate: falseNegativeRate,
        helpful_rate: helpfulRate,
        stabilization_rate: stabilizationRate,
        boundary_hold_rate: boundaryHoldRate,
        learning_confidence: confidence,
        proposal_count: activeAdaptations.length,
        active_adaptations: activeAdaptations,
        evidence_summary: evidenceSummary,
        metrics: snapshotMetrics,
      })
      .select("id, learning_confidence, proposal_count, created_at")
      .single();

    if (snapshotError) throw snapshotError;

    await supabase.from("fiis_adaptation_audit_log").insert({
      family_id,
      action: "recalculated",
      actor_type: "system",
      detail: `FIIS learning recalculated for ${window_days}-day window`,
      metadata: {
        snapshot_id: snapshotRows.id,
        coaching_sessions_count: coachingSessionsCount,
        moderator_session_count: moderatorSessionCount,
        feedback_count: feedbackCount,
        outcome_count: outcomeCount,
        active_proposals: activeAdaptations.length,
      },
    });

    return new Response(JSON.stringify({
      success: true,
      snapshot: snapshotRows,
      metrics: {
        coaching_sessions_count: coachingSessionsCount,
        moderator_session_count: moderatorSessionCount,
        feedback_count: feedbackCount,
        outcome_count: outcomeCount,
        false_positive_rate: falsePositiveRate,
        false_negative_rate: falseNegativeRate,
        helpful_rate: helpfulRate,
        stabilization_rate: stabilizationRate,
        boundary_hold_rate: boundaryHoldRate,
        relapse_signal_confirmation_rate: relapseSignalConfirmationRate,
      },
      inserted_proposals: insertedProposals.length,
      active_adaptations: activeAdaptations,
      evidence_summary: evidenceSummary,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("calculate-fiis-learning error", error);
    return new Response(JSON.stringify({ error: (error as Error).message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
