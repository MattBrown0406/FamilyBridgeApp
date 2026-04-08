export const FIIS_GUARDRAIL_COPY = "FIIS offers coaching and pattern-recognition support. It does not diagnose, prescribe treatment, provide legal advice, or replace emergency response.";

export const FIIS_BOUNDARY_DOCTRINE = [
  "A boundary without a consequence is a request.",
  "Emotional escalation is not a consequence.",
  "Consequences should be real, proportionate, repeatable, and best delivered from calm clarity.",
];

export const FIIS_ESCALATION_LEVELS = [
  {
    level: 1,
    label: "Routine coaching",
    description: "Everyday support, communication coaching, and pattern reflection.",
  },
  {
    level: 2,
    label: "Elevated concern",
    description: "Patterns are intensifying; stronger boundary clarity and possible moderator support may help.",
  },
  {
    level: 3,
    label: "Urgent professional support",
    description: "The family may need 24-hour moderator or interventionist involvement rather than more AI-only guidance.",
  },
  {
    level: 4,
    label: "Immediate emergency",
    description: "Call 911 first, then use the moderator/help button for follow-on support.",
  },
] as const;
