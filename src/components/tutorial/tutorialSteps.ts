import type { TutorialStep } from './TutorialModal';

export const familyDashboardSteps: TutorialStep[] = [
  {
    title: 'Welcome to FamilyBridge',
    description:
      "This is your family dashboard — your home base for supporting your loved one's recovery journey. Here's a quick tour of what's available to you.",
  },
  {
    title: 'Your Family',
    description:
      'Tap your family group to access your shared space — messages, updates, and resources all in one place.',
  },
  {
    title: 'Accountability Engine',
    description:
      'The Accountability Engine helps your family stay aligned on boundaries, commitments, and progress between sessions.',
  },
  {
    title: 'Outcome Predictions',
    description:
      "See data-driven insights on your family's recovery trajectory based on engagement and patterns.",
  },
  {
    title: "You're ready",
    description:
      'That\'s the overview. Explore at your own pace — every section has context to guide you.',
  },
];

export const moderatorDashboardSteps: TutorialStep[] = [
  {
    title: 'Welcome, Moderator',
    description:
      "This dashboard gives you full visibility into the families you support. Here's a quick walkthrough of each tab.",
  },
  {
    title: 'Families tab',
    description:
      'See all families assigned to you. Monitor health status, flag crisis situations, and navigate to individual family spaces.',
    highlightTab: 'families',
  },
  {
    title: 'Notes tab',
    description:
      'Add and review clinical or case notes for each family. Notes are private to moderators and not visible to families.',
    highlightTab: 'notes',
  },
  {
    title: 'Chat tab',
    description:
      'Direct messaging with families you support. Use this for check-ins, encouragement, and real-time support.',
    highlightTab: 'chat',
  },
  {
    title: 'FIIS Chat tab',
    description:
      'A dedicated channel for Family Intervention Intensive Support conversations — higher-acuity communication.',
    highlightTab: 'fiis',
  },
  {
    title: 'Transfers tab',
    description:
      'Request or manage family transfers between moderators or organizations.',
    highlightTab: 'transfers',
  },
  {
    title: 'Co-Mod tab',
    description:
      'Coordinate with co-moderators on shared families — shared notes, handoff context, and team visibility.',
    highlightTab: 'co-mod',
  },
  {
    title: 'Documents tab',
    description:
      'Upload, view, and manage documents for families — consent forms, plans, and resource materials.',
    highlightTab: 'documents',
  },
  {
    title: "You're ready",
    description:
      "You're all set. Reach out to your organization admin if you need help with any feature.",
  },
];

export const providerAdminSteps: TutorialStep[] = [
  {
    title: 'Welcome, Provider Admin',
    description:
      "This is your organization's admin dashboard. You manage families, moderators, settings, and your organization's presence on FamilyBridge.",
  },
  {
    title: 'Families tab',
    description:
      'View and manage all family groups under your organization. Add new families and monitor their status.',
    highlightTab: 'families',
  },
  {
    title: 'Moderators tab',
    description:
      'Manage your moderator team — add moderators, assign families, and track activity.',
    highlightTab: 'moderators',
  },
  {
    title: 'Settings tab',
    description:
      "Configure your organization's profile, intake questions, and onboarding flow for new families.",
    highlightTab: 'settings',
  },
  {
    title: 'Analytics tab',
    description:
      'Track engagement metrics, family outcomes, and moderator activity across your organization.',
    highlightTab: 'analytics',
  },
  {
    title: 'Branding tab',
    description:
      "Customize FamilyBridge with your organization's colors, logo, and messaging.",
    highlightTab: 'branding',
  },
  {
    title: 'Archived tab',
    description: 'View and restore archived family groups and records.',
    highlightTab: 'archived',
  },
  {
    title: 'Team Notes tab',
    description:
      'Organization-wide notes visible to your full moderator team.',
    highlightTab: 'team-notes',
  },
  {
    title: "You're ready",
    description:
      "That's your workspace. Everything you need to support families effectively is right here.",
  },
];

export const providerWorkspaceSteps: TutorialStep[] = [
  {
    title: 'Welcome to your Workspace',
    description:
      'This is where you collaborate with your team on clinical notes and internal messaging — separate from family-facing conversations.',
  },
  {
    title: 'Clinical Notes',
    description:
      'Capture private observations, concerns, hypotheses, and action items. Filter by family to keep context clear.',
    highlightTab: 'notes',
  },
  {
    title: 'Team Messaging',
    description:
      'Private conversations between team members. Families never see these threads.',
    highlightTab: 'messaging',
  },
  {
    title: "You're ready",
    description:
      "That's your workspace. Everything you need to support families effectively is right here.",
  },
];

export const providerOutcomesSteps: TutorialStep[] = [
  {
    title: 'Provider Outcomes Demo',
    description:
      'This demo shows how FamilyBridge tracks and surfaces treatment outcomes across your organization — benchmarked against national data.',
  },
  {
    title: 'Overview tab',
    description:
      'High-level outcome metrics across your families: treatment completion rates, 365-day sobriety, and aftercare adherence.',
    highlightTab: 'overview',
  },
  {
    title: 'Benchmarking tab',
    description:
      "Compare your organization's outcomes against national and category benchmarks. See where you outperform and where there's room to improve.",
    highlightTab: 'benchmarking',
  },
  {
    title: 'Data Collection tab',
    description:
      'Configure how and when outcome data is collected — automated check-ins, provider-submitted milestones, and family-reported progress.',
    highlightTab: 'collection',
  },
  {
    title: 'Provider Demo tab',
    description:
      'A live walkthrough of what your clinical team sees when reviewing outcomes for a specific family.',
    highlightTab: 'provider-demo',
  },
  {
    title: "You're ready",
    description:
      'This is just a preview — your actual outcome data populates automatically as families engage with FamilyBridge.',
  },
];

export const interventionOutcomesSteps: TutorialStep[] = [
  {
    title: 'Intervention Outcomes Demo',
    description:
      'This demo shows how FamilyBridge tracks what happens after an intervention — from immediate treatment entry through long-term recovery milestones.',
  },
  {
    title: 'Overview tab',
    description:
      'See the core intervention outcome metrics: immediate treatment entry rate, 90-day retention, family re-engagement, and crisis recurrence.',
    highlightTab: 'overview',
  },
  {
    title: 'Timing tab',
    description:
      'Understand how intervention timing and family preparation affect outcomes. Earlier, better-prepared interventions consistently produce better results.',
    highlightTab: 'timing',
  },
  {
    title: 'Data Model tab',
    description:
      'See how FamilyBridge structures and stores intervention data — what\'s tracked, when, and how it connects to long-term outcome reporting.',
    highlightTab: 'data',
  },
  {
    title: 'Scorecards tab',
    description:
      'Individual intervention scorecards show family readiness, interventionist effectiveness, and post-intervention follow-through across key milestones.',
    highlightTab: 'scorecards',
  },
  {
    title: "You're ready",
    description:
      'Your real intervention outcomes populate here as cases move through the FamilyBridge workflow.',
  },
];

export const fiisGuidanceSteps: TutorialStep[] = [
  {
    title: 'FIIS Guidance Demo',
    description:
      "FIIS — Family Intervention Intensive Support — is FamilyBridge's AI-assisted guidance layer for high-acuity family situations. This demo walks through how it works.",
  },
  {
    title: 'Provider guidance tab',
    description:
      'AI-generated signals and recommendations for your clinical team — flagging families that need immediate attention based on behavioral and communication patterns.',
    highlightTab: 'provider',
  },
  {
    title: 'Intervention guidance tab',
    description:
      'Real-time guidance for interventionists during active family intervention cases — context, suggested language, and risk flags.',
    highlightTab: 'intervention',
  },
  {
    title: 'Guardrails tab',
    description:
      "See how FamilyBridge keeps AI guidance within safe clinical bounds — what it will and won't recommend, and how escalation works.",
    highlightTab: 'guardrails',
  },
  {
    title: 'Workflow tab',
    description:
      'How FIIS fits into your existing clinical workflow — when guidance is surfaced, who sees it, and how it connects to moderator actions.',
    highlightTab: 'workflow',
  },
  {
    title: "You're ready",
    description:
      'FIIS activates automatically as families engage. The more data in the system, the sharper the guidance becomes.',
  },
];