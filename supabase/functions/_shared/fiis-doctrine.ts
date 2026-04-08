export type FIISAudience = "family" | "moderator" | "mixed";
export type FIISMode = "analysis" | "coaching" | "moderator_chat" | "communication_helper";

export type DoctrineLensId =
  | "boundary_enabling"
  | "pattern_detection_systems"
  | "recovery_relapse_support"
  | "communication_deescalation"
  | "resistance_change_readiness"
  | "attachment_emotional_bond";

export interface SelectedLens {
  id: DoctrineLensId;
  label: string;
  why: string;
}

export interface EscalationAssessment {
  level: 1 | 2 | 3 | 4;
  label: string;
  rationale: string[];
  immediateActions: string[];
  requiresModerator: boolean;
  requiresProfessionalSupport: boolean;
  emergencyOverride: boolean;
}

const CORE_ANCHORS = [
  "Claudia Black",
  "Murray Bowen",
  "Harriet Lerner",
  "Edwin Friedman",
  "Pia Mellody",
  "Carl Rogers",
];

const BACKGROUND_PHILOSOPHY = [
  "John Bradshaw",
  "Johann Hari",
  "Don Miguel Ruiz",
  "Gabor Maté-style trauma/context insight where useful",
  "Jung-like meaning/pattern reflection where useful",
  "Big Book context when denial or lack of insight needs explanation",
];

const LENS_LIBRARY: Record<DoctrineLensId, { label: string; triggers: string[]; why: string }> = {
  boundary_enabling: {
    label: "Boundary / Enabling Lens",
    triggers: ["boundary", "money", "ride", "cover", "bail", "rescue", "consequence", "enable", "loan", "request"],
    why: "Use when the family needs clarity about limits, follow-through, or rescuing patterns.",
  },
  pattern_detection_systems: {
    label: "Pattern Detection / Systems Lens",
    triggers: ["always", "cycle", "pattern", "system", "everyone", "repeated", "loop", "again", "same fight"],
    why: "Use when repeated family roles, feedback loops, or anti-chaos adaptation matter more than a single event.",
  },
  recovery_relapse_support: {
    label: "Recovery / Relapse Support Lens",
    triggers: ["relapse", "used", "drink", "drug", "meeting", "sponsor", "treatment", "recovery", "slip", "sobriety"],
    why: "Use when sobriety protection, relapse signals, or recovery structure are active concerns.",
  },
  communication_deescalation: {
    label: "Communication / De-escalation Lens",
    triggers: ["fight", "text", "call", "scream", "argue", "calm", "talk", "respond", "conversation", "de-escalate"],
    why: "Use when wording, pacing, reflective listening, and emotional temperature need guidance.",
  },
  resistance_change_readiness: {
    label: "Resistance / Change-Readiness Lens",
    triggers: ["won't", "refuse", "denial", "not ready", "resist", "excuse", "blame", "deflect"],
    why: "Use when the issue is not insight alone but readiness, denial, or resistance to change.",
  },
  attachment_emotional_bond: {
    label: "Attachment / Emotional Bond Lens",
    triggers: ["abandon", "leave", "love", "connection", "rejected", "scared", "cling", "pull away", "trust"],
    why: "Use when fear of disconnection, loyalty binds, or pain around closeness is shaping behavior.",
  },
};

export function selectAdaptiveLenses(input: string, max = 3): SelectedLens[] {
  const haystack = input.toLowerCase();

  const scored = Object.entries(LENS_LIBRARY)
    .map(([id, lens]) => {
      const score = lens.triggers.reduce((total, trigger) => total + (haystack.includes(trigger) ? 1 : 0), 0);
      return { id: id as DoctrineLensId, ...lens, score };
    })
    .filter((lens) => lens.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, max);

  if (scored.length === 0) {
    return [
      {
        id: "boundary_enabling",
        label: LENS_LIBRARY.boundary_enabling.label,
        why: LENS_LIBRARY.boundary_enabling.why,
      },
      {
        id: "pattern_detection_systems",
        label: LENS_LIBRARY.pattern_detection_systems.label,
        why: LENS_LIBRARY.pattern_detection_systems.why,
      },
    ];
  }

  return scored.map(({ id, label, why }) => ({ id, label, why }));
}

export function assessEscalationLevel(input: string): EscalationAssessment {
  const haystack = input.toLowerCase();

  const level4 = [
    "suicide", "kill myself", "kill him", "kill her", "overdose", "gun", "knife", "not breathing",
    "unconscious", "seizure", "call 911", "heart attack", "house fire", "immediate danger",
  ];
  const level3 = [
    "violent", "threat", "missing", "domestic", "self-harm", "can't stay safe", "psychosis",
    "dangerous", "assault", "strangling", "child alone",
  ];
  const level2 = [
    "relapse", "used", "drank", "dealer", "homeless", "withdrawing", "panic", "spiral", "bender",
    "won't come home", "needs treatment", "crash", "manic", "not sleeping", "severe fight",
  ];

  const hits = (terms: string[]) => terms.filter((term) => haystack.includes(term));
  const level4Hits = hits(level4);
  if (level4Hits.length) {
    return {
      level: 4,
      label: "Immediate emergency",
      rationale: level4Hits,
      immediateActions: [
        'Call 911 first.',
        'After emergency services are contacted, use the moderator/help button for follow-on support.',
        'Do not keep the AI conversation going as a substitute for emergency response.',
      ],
      requiresModerator: true,
      requiresProfessionalSupport: true,
      emergencyOverride: true,
    };
  }

  const level3Hits = hits(level3);
  if (level3Hits.length) {
    return {
      level: 3,
      label: "High-risk urgent escalation",
      rationale: level3Hits,
      immediateActions: [
        'Recommend immediate human support and urgent moderator/interventionist review.',
        'Move from coaching into containment, safety planning, and professional escalation.',
      ],
      requiresModerator: true,
      requiresProfessionalSupport: true,
      emergencyOverride: false,
    };
  }

  const level2Hits = hits(level2);
  if (level2Hits.length) {
    return {
      level: 2,
      label: "Elevated concern",
      rationale: level2Hits,
      immediateActions: [
        'Offer practical coaching, boundary clarity, and recommendation to involve moderator support if patterns persist or intensify.',
      ],
      requiresModerator: false,
      requiresProfessionalSupport: false,
      emergencyOverride: false,
    };
  }

  return {
    level: 1,
    label: "Routine coaching",
    rationale: ["No urgent crisis markers detected in the provided text."],
    immediateActions: ['Stay in coaching mode, keep boundaries concrete, and focus on patterns over one-off reactions.'],
    requiresModerator: false,
    requiresProfessionalSupport: false,
    emergencyOverride: false,
  };
}

export function buildFIISDoctrinePrompt(options: {
  audience: FIISAudience;
  mode: FIISMode;
  plainLanguageSurface?: boolean;
  contextText?: string;
}): string {
  const lenses = selectAdaptiveLenses(options.contextText || "");
  const escalation = assessEscalationLevel(options.contextText || "");
  const plainLanguage = options.plainLanguageSurface !== false;

  return `
═══ FAMILYBRIDGE / FIIS DOCTRINE ═══
IDENTITY:
- FIIS is a coaching and pattern-recognition tool inside FamilyBridge.
- FamilyBridge philosophy is hybrid but boundary-first.
- Your major secondary role is pattern detection across the family system.
- You are anti-enabling, anti-chaos adaptation, and pro-clear communication.
- You must treat family systems realistically: people adapt to instability, pain-avoidance, secrecy, and repeated rescues.

TONE DOCTRINE:
- Speak with compassionate authority.
- Be a leader, not a boss.
- Warm, steady, clear, and strong on boundaries.
- Understand enabling and codependency as pain-avoidance, not stupidity.
- Use reflective listening before correction when possible.
- Never shame, moralize, grandstand, or perform superiority.

KNOWLEDGE ARCHITECTURE:
- Core anchors: ${CORE_ANCHORS.join(", ")}.
- Adaptive lenses available: boundary/enabling; pattern detection/systems; recovery/relapse support; communication/de-escalation; resistance/change-readiness; attachment/emotional bond.
- Background philosophy: ${BACKGROUND_PHILOSOPHY.join("; ")}.

ACTIVE LENSES FOR THIS REQUEST:
${lenses.map((lens, index) => `${index + 1}. ${lens.label} — ${lens.why}`).join("\n")}

GUARDRAILS:
- FIIS is NOT a clinician, lawyer, diagnostician, prescriber, or emergency responder.
- Do NOT diagnose, prescribe treatment, give legal advice, or replace crisis response.
- Boundary doctrine: a boundary without a consequence is a request.
- Emotional escalation is NOT a consequence.
- Consequences must be real, proportionate, repeatable, and ideally communicated from calm clarity.
- Support should reduce chaos, not absorb or reorganize around it.
- When families ask how to help, prefer support that preserves accountability over support that removes natural consequences.

ESCALATION MODEL:
- Level 1: routine coaching.
- Level 2: elevated concern; coaching stays active, moderator support may be suggested.
- Level 3: urgent/high-risk; recommend moderator or interventionist escalation for the 24-hour professional support.
- Level 4: immediate emergency. You MUST say "Call 911 first" immediately, then direct them to the moderator/help button.
- Current detected level for this request: Level ${escalation.level} (${escalation.label}).
- Current next actions: ${escalation.immediateActions.join(" ")}

SURFACE STYLE:
${plainLanguage
  ? "- Surface plain language whenever possible. Translate theory into direct, usable words."
  : "- You may use precise professional language because the audience is trained, but stay concrete and pattern-based."}
- If a request is ambiguous, clarify the pattern, the boundary, the consequence, and the safest next human step.
- If the best move is to pause a conversation, say so clearly.
`;
}

export function buildModeratorEscalationTriggersPrompt(): string {
  return `
MODERATOR / INTERVENTIONIST ESCALATION TRIGGERS:
Escalate to the 24-hour professional support when you see one or more of the following:
- Repeated boundary collapse or family inability to follow through
- High-conflict communication loops that the family cannot de-escalate
- Credible relapse indicators, disappearance, unsafe intoxication, or severe instability
- Threats, coercion, intimidation, or vulnerable people potentially at risk
- Requests for diagnosis, legal advice, or emergency-response substitution
- Cases where the family needs structured intervention planning beyond coaching
`;
}

export function buildSurfaceGuardrailCopy(): string {
  return "FIIS offers coaching and pattern-recognition support. It does not diagnose, prescribe treatment, provide legal advice, or replace emergency response. In an immediate emergency, call 911 first, then use the moderator/help button.";
}
