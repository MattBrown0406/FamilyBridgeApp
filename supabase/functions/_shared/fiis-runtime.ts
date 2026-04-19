import { buildFIISDoctrinePrompt, type FIISAudience, type FIISMode } from "./fiis-doctrine.ts";
import { buildFIISLearningContext } from "./fiis-learning.ts";

export async function buildFIISRuntimeContext(options: {
  supabase: any;
  familyId: string;
  audience: FIISAudience;
  mode: FIISMode;
  plainLanguageSurface?: boolean;
  contextText?: string;
  extraContext?: string[];
}) {
  const { supabase, familyId, audience, mode, plainLanguageSurface, contextText, extraContext = [] } = options;

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
      .select("parameter_key, proposed_value, status, confidence, created_at")
      .eq("family_id", familyId)
      .in("status", ["auto_applied", "approved"])
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const snapshot = snapshotResult.data;
  const activeAdaptations = proposalsResult.data || [];
  const learningContext = await buildFIISLearningContext(supabase, familyId);
  const doctrinePrompt = buildFIISDoctrinePrompt({
    audience,
    mode,
    plainLanguageSurface,
    contextText,
  });

  const runtimeGuardrails: string[] = [];

  if (snapshot) {
    if ((snapshot.false_positive_rate ?? 0) >= 35) {
      runtimeGuardrails.push("Recent FIIS learning shows elevated false positives. Do not escalate on thin evidence. Require pattern convergence unless direct safety language, overdose risk, or confirmed use is present.");
    }
    if ((snapshot.false_negative_rate ?? 0) >= 25) {
      runtimeGuardrails.push("Recent FIIS learning shows missed warning clusters. Pay closer attention to repeated low-grade drift signals, especially silence + isolation, minimization + urgency, or structure collapse over time.");
    }
    if ((snapshot.helpful_rate ?? 100) < 40) {
      runtimeGuardrails.push("Recent guidance has not landed well enough. Favor briefer, calmer, more concrete responses with one clear next step over layered interpretation.");
    }
    if ((snapshot.boundary_hold_rate ?? 100) < 50) {
      runtimeGuardrails.push("Boundary follow-through is weak. Surface one-sentence boundary wording and concrete consequence framing earlier when money, rides, rescues, or late-night urgency are involved.");
    }
  }

  activeAdaptations.forEach((adaptation: any) => {
    const instruction = adaptation?.proposed_value?.instruction || adaptation?.proposed_value?.focus;
    if (instruction) runtimeGuardrails.push(instruction);
  });

  const dedupedGuardrails = [...new Set(runtimeGuardrails)];

  return `${doctrinePrompt}

FIIS RUNTIME ADAPTATION LAYER:
- Treat family-specific learning as bounded tuning, not permission to rewrite doctrine.
- Safety overrides learned softening whenever direct danger, self-harm, overdose risk, violence, or confirmed use is present.
${snapshot ? `- Current learning confidence: ${snapshot.learning_confidence}.
` : ""}${dedupedGuardrails.length ? dedupedGuardrails.map((item) => `- ${item}`).join("\n") : "- No active runtime adaptations. Use doctrine and direct context."}
${learningContext}${extraContext.length ? `\nADDITIONAL FAMILY-SPECIFIC CONTEXT:\n${extraContext.filter(Boolean).join("\n")}` : ""}`;
}
