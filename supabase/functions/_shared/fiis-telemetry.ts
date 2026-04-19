export type FIISTelemetryContext = {
  learningConfidence: "low" | "moderate" | "high" | null;
  activeAdaptations: Array<{ parameter_key?: string; status?: string; confidence?: string; instruction?: string | null }>;
  runtimeFlags: Record<string, unknown>;
  guidanceStyle: string;
  escalationLevel: 1 | 2 | 3 | 4;
};

export async function loadFIISRuntimeTelemetry(supabase: any, familyId: string): Promise<FIISTelemetryContext> {
  const [snapshotResult, proposalsResult] = await Promise.all([
    supabase
      .from("fiis_learning_snapshots")
      .select("learning_confidence, false_positive_rate, false_negative_rate, helpful_rate, stabilization_rate, boundary_hold_rate, created_at")
      .eq("family_id", familyId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("fiis_adaptation_proposals")
      .select("parameter_key, proposed_value, status, confidence")
      .eq("family_id", familyId)
      .in("status", ["auto_applied", "approved"])
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const snapshot = snapshotResult.data;
  const activeAdaptations = (proposalsResult.data || []).map((proposal: any) => ({
    parameter_key: proposal.parameter_key,
    status: proposal.status,
    confidence: proposal.confidence,
    instruction: proposal?.proposed_value?.instruction || proposal?.proposed_value?.focus || null,
  }));

  const runtimeFlags: Record<string, unknown> = {
    high_false_positive_pressure: Boolean(snapshot && (snapshot.false_positive_rate ?? 0) >= 35),
    high_false_negative_pressure: Boolean(snapshot && (snapshot.false_negative_rate ?? 0) >= 25),
    low_helpful_rate: Boolean(snapshot && (snapshot.helpful_rate ?? 100) < 40),
    weak_boundary_followthrough: Boolean(snapshot && (snapshot.boundary_hold_rate ?? 100) < 50),
    active_adaptation_count: activeAdaptations.length,
  };

  const guidanceStyle = runtimeFlags.low_helpful_rate
    ? "brief_concrete"
    : runtimeFlags.weak_boundary_followthrough
      ? "boundary_forward"
      : activeAdaptations.some((item) => item.parameter_key === "deescalation_script_priority")
        ? "deescalation_first"
        : "balanced";

  const escalationLevel = runtimeFlags.high_false_negative_pressure ? 2 : 1;

  return {
    learningConfidence: snapshot?.learning_confidence || null,
    activeAdaptations,
    runtimeFlags,
    guidanceStyle,
    escalationLevel,
  };
}

export async function persistFIISCoachingTelemetry(options: {
  supabase: any;
  familyId: string;
  userId: string;
  sessionType: "live_speakerphone" | "live_text" | "screenshot";
  aiModel: string;
  startedAt: number;
  sessionId?: string | null;
  analysisId?: string | null;
  aiSummary?: string | null;
  suggestions?: unknown;
  usage?: { prompt_tokens?: number; completion_tokens?: number } | null;
  telemetry: FIISTelemetryContext;
}) {
  const {
    supabase,
    familyId,
    userId,
    sessionType,
    aiModel,
    startedAt,
    sessionId,
    analysisId,
    aiSummary,
    suggestions,
    usage,
    telemetry,
  } = options;

  const latencyMs = Math.max(0, Date.now() - startedAt);
  const sessionPayload = {
    family_id: familyId,
    user_id: userId,
    session_type: sessionType,
    ai_model: aiModel,
    runtime_confidence: telemetry.learningConfidence,
    runtime_adaptations: telemetry.activeAdaptations,
    runtime_flags: telemetry.runtimeFlags,
    ai_summary: aiSummary || null,
    guidance_style: telemetry.guidanceStyle,
    escalation_level: telemetry.escalationLevel,
    telemetry: {
      latency_ms: latencyMs,
      tokens_in: usage?.prompt_tokens ?? null,
      tokens_out: usage?.completion_tokens ?? null,
      suggestion_count: Array.isArray(suggestions) ? suggestions.length : null,
    },
    suggestions: Array.isArray(suggestions) ? suggestions : undefined,
    ended_at: new Date().toISOString(),
  } as Record<string, unknown>;

  let persistedSessionId = sessionId || null;
  if (persistedSessionId) {
    const { error } = await supabase
      .from("coaching_sessions")
      .update(sessionPayload)
      .eq("id", persistedSessionId)
      .eq("user_id", userId);
    if (error) throw error;
  } else {
    const { data, error } = await supabase
      .from("coaching_sessions")
      .insert(sessionPayload)
      .select("id")
      .single();
    if (error) throw error;
    persistedSessionId = data.id;
  }

  const { error: outcomeError } = await supabase
    .from("fiis_coaching_outcomes")
    .insert({
      family_id: familyId,
      session_id: persistedSessionId,
      analysis_id: analysisId || null,
      created_by: userId,
      outcome_status: "unknown",
      coaching_session_type: sessionType,
      runtime_confidence: telemetry.learningConfidence,
      guidance_style: telemetry.guidanceStyle,
      escalation_level: telemetry.escalationLevel,
      response_latency_ms: latencyMs,
      tokens_in: usage?.prompt_tokens ?? null,
      tokens_out: usage?.completion_tokens ?? null,
      runtime_flags: telemetry.runtimeFlags,
      adaptation_snapshot: telemetry.activeAdaptations,
      metadata: {
        ai_model: aiModel,
        ai_summary: aiSummary || null,
      },
    });
  if (outcomeError) throw outcomeError;

  return persistedSessionId;
}
