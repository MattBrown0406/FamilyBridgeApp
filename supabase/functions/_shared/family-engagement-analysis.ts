export interface FamilyCommunicationAnalysisResult {
  supportive_score: number;
  criticism_score: number;
  enabling_score: number;
  emotional_regulation_score: number;
  boundary_consistency_score: number;
  recovery_alignment_score: number;
  communication_valence: "supportive" | "mixed" | "strained" | "destabilizing";
  signals: string[];
  summary: string;
}

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export async function analyzeFamilyCommunicationBatch(messages: Array<{ content?: string | null }>, apiKey?: string): Promise<FamilyCommunicationAnalysisResult> {
  const joined = messages
    .map((m, index) => `#${index + 1}: ${(m.content || "").trim()}`)
    .filter(Boolean)
    .slice(0, 40)
    .join("\n");

  if (!joined) {
    return {
      supportive_score: 0,
      criticism_score: 0,
      enabling_score: 0,
      emotional_regulation_score: 0,
      boundary_consistency_score: 0,
      recovery_alignment_score: 0,
      communication_valence: "mixed",
      signals: [],
      summary: "No recent family messages available for analysis.",
    };
  }

  if (!apiKey) {
    return heuristicCommunicationAnalysis(joined);
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You analyze family-system communication in addiction recovery contexts. Return JSON only with fields: supportive_score, criticism_score, enabling_score, emotional_regulation_score, boundary_consistency_score, recovery_alignment_score, communication_valence, signals, summary. Communication valence must be one of supportive, mixed, strained, destabilizing. Judge recovery alignment, not generic positivity. Boundary-setting with warmth should score well. Warm enabling should score poorly.`,
          },
          {
            role: "user",
            content: `Analyze this recent family message sample and score the communication quality for recovery support:\n\n${joined}`,
          },
        ],
      }),
    });

    if (!response.ok) throw new Error(`OpenAI error ${response.status}`);
    const json = await response.json();
    const content = json.choices?.[0]?.message?.content;
    if (!content) throw new Error("No model output");
    const parsed = JSON.parse(content);
    return normalizeCommunicationResult(parsed);
  } catch (_error) {
    return heuristicCommunicationAnalysis(joined);
  }
}

function normalizeCommunicationResult(parsed: any): FamilyCommunicationAnalysisResult {
  return {
    supportive_score: clamp(parsed.supportive_score ?? 0),
    criticism_score: clamp(parsed.criticism_score ?? 0),
    enabling_score: clamp(parsed.enabling_score ?? 0),
    emotional_regulation_score: clamp(parsed.emotional_regulation_score ?? 0),
    boundary_consistency_score: clamp(parsed.boundary_consistency_score ?? 0),
    recovery_alignment_score: clamp(parsed.recovery_alignment_score ?? 0),
    communication_valence: ["supportive", "mixed", "strained", "destabilizing"].includes(parsed.communication_valence)
      ? parsed.communication_valence
      : "mixed",
    signals: Array.isArray(parsed.signals) ? parsed.signals.slice(0, 8).map(String) : [],
    summary: typeof parsed.summary === "string" ? parsed.summary.slice(0, 500) : "Communication analysis completed.",
  };
}

function heuristicCommunicationAnalysis(joined: string): FamilyCommunicationAnalysisResult {
  const supportive = countMatches(joined, [/\bproud of you\b/gi, /\bwe love you\b/gi, /\bi love you\b/gi, /\bhere for you\b/gi, /\bkeep going\b/gi, /\bthank you for sharing\b/gi, /\bwe support you\b/gi]);
  const criticism = countMatches(joined, [/\byou always\b/gi, /\byou never\b/gi, /\bwhat is wrong with you\b/gi, /\bpathetic\b/gi, /\bshame on you\b/gi, /\bdisgusting\b/gi]);
  const enabling = countMatches(joined, [/\bjust this once\b/gi, /\bwe'll fix it\b/gi, /\bcome home and we'll take care of it\b/gi, /\bi'll cover for you\b/gi, /\byou don't need treatment\b/gi]);
  const boundary = countMatches(joined, [/\bnot sending money\b/gi, /\bwe are not paying\b/gi, /\bthat is your responsibility\b/gi, /\bboundary\b/gi, /\bconsequence\b/gi, /\baccountab/gi]);
  const dysregulated = countMatches(joined, [/\bfurious\b/gi, /\bangry\b/gi, /\bcan't trust you\b/gi, /\bliar\b/gi, /\blying\b/gi, /\bmanipulat/gi]);

  const supportiveScore = clamp(50 + supportive * 12 + boundary * 8 - criticism * 10 - enabling * 12 - dysregulated * 8);
  const criticismScore = clamp(criticism * 18 + dysregulated * 10);
  const enablingScore = clamp(enabling * 22);
  const emotionalRegulationScore = clamp(75 + supportive * 4 + boundary * 3 - dysregulated * 15 - criticism * 10);
  const boundaryConsistencyScore = clamp(40 + boundary * 18 - enabling * 12);
  const recoveryAlignmentScore = clamp(45 + supportive * 10 + boundary * 14 - enabling * 16 - criticism * 10);

  const communicationValence = enablingScore >= 55 || criticismScore >= 60
    ? "destabilizing"
    : criticismScore >= 35 || emotionalRegulationScore < 45
      ? "strained"
      : recoveryAlignmentScore >= 65
        ? "supportive"
        : "mixed";

  const signals = [
    supportive > 0 ? "supportive language present" : null,
    boundary > 0 ? "boundary-setting language present" : null,
    enabling > 0 ? "possible enabling language detected" : null,
    criticism > 0 ? "critical or shaming language detected" : null,
    dysregulated > 0 ? "emotionally escalated language detected" : null,
  ].filter(Boolean) as string[];

  return {
    supportive_score: supportiveScore,
    criticism_score: criticismScore,
    enabling_score: enablingScore,
    emotional_regulation_score: emotionalRegulationScore,
    boundary_consistency_score: boundaryConsistencyScore,
    recovery_alignment_score: recoveryAlignmentScore,
    communication_valence: communicationValence,
    signals,
    summary: communicationValence === "supportive"
      ? "Recent family communication appears broadly recovery-aligned and supportive."
      : communicationValence === "destabilizing"
        ? "Recent family communication shows destabilizing patterns that may undermine recovery support."
        : communicationValence === "strained"
          ? "Recent family communication shows strain and would benefit from calmer, more boundary-consistent language."
          : "Recent family communication is mixed, with some supportive intent but inconsistent recovery alignment.",
  };
}

function countMatches(text: string, patterns: RegExp[]) {
  return patterns.reduce((sum, pattern) => sum + ((text.match(pattern) || []).length), 0);
}
