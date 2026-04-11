export async function buildFIISLearningContext(supabase: any, familyId: string) {
  const [snapshotResult, proposalsResult] = await Promise.all([
    supabase
      .from("fiis_learning_snapshots")
      .select("window_days, coaching_sessions_count, feedback_count, outcome_count, false_positive_rate, false_negative_rate, helpful_rate, stabilization_rate, boundary_hold_rate, learning_confidence, proposal_count, evidence_summary, active_adaptations, created_at")
      .eq("family_id", familyId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("fiis_adaptation_proposals")
      .select("parameter_key, proposal_type, proposed_value, rationale, confidence, status, sample_size, change_magnitude_pct, created_at")
      .eq("family_id", familyId)
      .in("status", ["auto_applied", "approved"])
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const snapshot = snapshotResult.data;
  const proposals = proposalsResult.data || [];
  if (!snapshot && proposals.length === 0) return "";

  let context = "\nFIIS LEARNING LAYER:\n";

  if (snapshot) {
    const metrics: string[] = [];
    metrics.push(`Window: last ${snapshot.window_days} days`);
    metrics.push(`Confidence: ${snapshot.learning_confidence}`);
    metrics.push(`Coaching sessions analyzed: ${snapshot.coaching_sessions_count}`);
    metrics.push(`Moderator corrections: ${snapshot.feedback_count}`);
    metrics.push(`Outcome labels: ${snapshot.outcome_count}`);
    if (snapshot.false_positive_rate !== null && snapshot.false_positive_rate !== undefined) {
      metrics.push(`False-positive rate: ${Math.round(Number(snapshot.false_positive_rate))}%`);
    }
    if (snapshot.false_negative_rate !== null && snapshot.false_negative_rate !== undefined) {
      metrics.push(`False-negative rate: ${Math.round(Number(snapshot.false_negative_rate))}%`);
    }
    if (snapshot.helpful_rate !== null && snapshot.helpful_rate !== undefined) {
      metrics.push(`Helpful/stabilizing guidance rate: ${Math.round(Number(snapshot.helpful_rate))}%`);
    }
    if (snapshot.stabilization_rate !== null && snapshot.stabilization_rate !== undefined) {
      metrics.push(`De-escalation/stabilization rate: ${Math.round(Number(snapshot.stabilization_rate))}%`);
    }
    if (snapshot.boundary_hold_rate !== null && snapshot.boundary_hold_rate !== undefined) {
      metrics.push(`Boundary hold rate after coaching: ${Math.round(Number(snapshot.boundary_hold_rate))}%`);
    }
    metrics.push(`Active governed adaptations: ${snapshot.proposal_count}`);

    context += `${metrics.map((line) => `- ${line}`).join("\n")}\n`;

    if (snapshot.evidence_summary?.length) {
      context += `Key learning signals:\n${snapshot.evidence_summary.slice(0, 5).map((item: string) => `- ${item}`).join("\n")}\n`;
    }
  }

  if (proposals.length > 0) {
    context += "Active governed adaptations to apply:\n";
    context += proposals.map((proposal: any, index: number) => {
      const instruction = proposal?.proposed_value?.instruction
        || proposal?.proposed_value?.focus
        || JSON.stringify(proposal?.proposed_value || {});
      return `${index + 1}. [${proposal.parameter_key}] ${instruction} (confidence: ${proposal.confidence}, sample: ${proposal.sample_size}, shift: ${Math.round(Number(proposal.change_magnitude_pct || 0))}%)`;
    }).join("\n");
    context += "\n";
  }

  context += "Apply these governed learning adjustments as bounded nudges, not as a rewrite of FIIS doctrine. If direct safety language, self-harm, overdose risk, or confirmed use appears, safety escalation still overrides learned softening.\n";

  return context;
}
