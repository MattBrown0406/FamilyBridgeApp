export interface BoundaryQualityCheck {
  key: "clarity" | "measurability" | "enforceability" | "consequence_realism";
  label: string;
  passed: boolean;
  feedback: string;
}

export interface BoundaryQualityReport {
  score: number;
  checks: BoundaryQualityCheck[];
  summary: string;
  isStrong: boolean;
}

const TIME_WORDS = /(day|days|week|weeks|month|months|hour|hours|tonight|today|tomorrow|within\s+\d+)/i;
const NUMBER_WORDS = /\b\d+\b/;
const CONSEQUENCE_VERBS = /(will|won't|cannot|can't|must|pause|suspend|leave|end|stop|require|limit|report|block)/i;
const VAGUE_WORDS = /(better|respectful|appropriate|soon|sometimes|more often|less|try harder|be nicer|act right)/i;
const ENFORCEABLE_SELF_REFERENCE = /\b(i|we)\s+(will|won't|cannot|can't|are going to|intend to)\b/i;
const REALISM_FLAGS = /(forever|never again|immediately fix|prove you changed|make everyone happy|until trust is restored)$/i;

export function evaluateBoundaryQuality(content: string, consequence?: string): BoundaryQualityReport {
  const boundary = content.trim();
  const result = (consequence || "").trim();
  const combined = `${boundary} ${result}`.trim();

  const clarity = boundary.length >= 20 && !VAGUE_WORDS.test(boundary);
  const measurability = TIME_WORDS.test(combined) || NUMBER_WORDS.test(combined) || /if\b/i.test(boundary);
  const enforceability = ENFORCEABLE_SELF_REFERENCE.test(boundary) || ENFORCEABLE_SELF_REFERENCE.test(result);
  const consequenceRealism = result.length > 0 && CONSEQUENCE_VERBS.test(result) && !REALISM_FLAGS.test(result);

  const checks: BoundaryQualityCheck[] = [
    {
      key: "clarity",
      label: "Clarity",
      passed: clarity,
      feedback: clarity
        ? "The boundary is specific enough to understand."
        : "Make the boundary more concrete. Name the exact behavior or condition, not a vague hope.",
    },
    {
      key: "measurability",
      label: "Measurability",
      passed: measurability,
      feedback: measurability
        ? "Someone could reasonably tell whether the boundary was followed."
        : "Add a measurable trigger or timeframe so everyone can tell when it was met or violated.",
    },
    {
      key: "enforceability",
      label: "Enforceability",
      passed: enforceability,
      feedback: enforceability
        ? "The consequence depends on your actions, not forcing someone else to change."
        : "Write the boundary around what you or the family will do, not what you hope another person will do.",
    },
    {
      key: "consequence_realism",
      label: "Consequence realism",
      passed: consequenceRealism,
      feedback: consequenceRealism
        ? "The consequence sounds practical and repeatable."
        : "Use a realistic consequence you can actually follow through on consistently.",
    },
  ];

  const score = checks.filter((check) => check.passed).length;
  const isStrong = score >= 3;
  const summary = isStrong
    ? "This boundary is reasonably solid. Tighten any weak spots before submitting."
    : "This boundary needs more structure before it will hold up under stress.";

  return { score, checks, summary, isStrong };
}
