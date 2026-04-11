// Structured Input Accountability & Consistency Reconciliation System – Demo Data

export type InputConfidence = 'low' | 'moderate' | 'high';
export type TrackingState = 'shallow_input' | 'incomplete_input' | 'unresolved_contradiction' | 'partial_clarification' | 'resolved';
export type EscalationLevel = 1 | 2 | 3;

export interface DetectedIssue {
  id: string;
  type: 'shallow' | 'incomplete' | 'contradiction';
  category: string;
  summary: string;
  priorInput?: string;
  currentInput?: string;
  requiredInfo: string[];
  escalationLevel: EscalationLevel;
  trackingState: TrackingState;
  detectedAt: string;
  resolvedAt?: string;
  deferredUntil?: string;
  familyMember: string;
}

export interface DataConfidenceScore {
  category: string;
  confidence: InputConfidence;
  completeness: number; // 0–100
  consistency: number; // 0–100
  specificity: number; // 0–100
  overall: number;
  issues: string[];
}

export interface DepthPrompt {
  id: string;
  trigger: string;
  promptText: string;
  requiredFields: string[];
  category: string;
}

export interface DeferralRecord {
  id: string;
  issueId: string;
  deferredAt: string;
  returnTime: string;
  reminderSent: boolean;
  returnedAt?: string;
  resolved: boolean;
  familyMember: string;
}

export interface ReconciliationEvent {
  id: string;
  timestamp: string;
  type: 'detection' | 'prompt' | 'clarification' | 'deferral' | 'resolution' | 'escalation' | 'reminder';
  description: string;
  familyMember: string;
  category: string;
  confidence?: InputConfidence;
}

// ---------- Demo Data ----------

export const demoDetectedIssues: DetectedIssue[] = [
  {
    id: 'iss-1',
    type: 'shallow',
    category: 'Behavioral Update',
    summary: 'Family member provided vague update: "things are going better" without behavioral specifics.',
    requiredInfo: [
      'What specific behaviors have changed in the last 7 days?',
      'Were any commitments missed or kept?',
      'Has substance use been observed or suspected?',
    ],
    escalationLevel: 1,
    trackingState: 'shallow_input',
    detectedAt: '2026-04-11T08:15:00Z',
    familyMember: 'Linda M.',
  },
  {
    id: 'iss-2',
    type: 'contradiction',
    category: 'Financial Support',
    summary: 'Prior update stated financial support had been fully stopped. Current update references paying for a phone bill.',
    priorInput: '"We stopped all financial support as of March 28."',
    currentInput: '"I paid his phone bill because he needed it for job searching."',
    requiredInfo: [
      'Was the phone bill payment a one-time exception or ongoing?',
      'Was this discussed with the family group before payment?',
      'Are there other financial supports still being provided?',
    ],
    escalationLevel: 2,
    trackingState: 'unresolved_contradiction',
    detectedAt: '2026-04-10T14:30:00Z',
    familyMember: 'Linda M.',
  },
  {
    id: 'iss-3',
    type: 'incomplete',
    category: 'Boundary Compliance',
    summary: 'Boundary tracking update is missing detail on 3 of 5 active boundaries.',
    requiredInfo: [
      'Was the "no unsupervised visits" boundary maintained?',
      'Was the "no cash" boundary held?',
      'Were there any exceptions granted this week?',
    ],
    escalationLevel: 1,
    trackingState: 'incomplete_input',
    detectedAt: '2026-04-11T09:00:00Z',
    familyMember: 'Robert M.',
  },
  {
    id: 'iss-4',
    type: 'contradiction',
    category: 'Substance Use Indicators',
    summary: 'Family member reports "he seems sober" while also noting erratic sleep patterns and missed therapy appointments.',
    priorInput: '"He missed two therapy sessions and has been sleeping all day."',
    currentInput: '"He seems sober to me — I think he\'s doing fine."',
    requiredInfo: [
      'What specific behaviors support the assessment that sobriety is maintained?',
      'Have any drug tests been conducted recently?',
      'Is the missed therapy pattern new or ongoing?',
    ],
    escalationLevel: 2,
    trackingState: 'unresolved_contradiction',
    detectedAt: '2026-04-09T16:45:00Z',
    familyMember: 'Linda M.',
  },
  {
    id: 'iss-5',
    type: 'shallow',
    category: 'Communication Patterns',
    summary: 'Update on provider communication marked as "fine" with no detail on frequency, content, or responsiveness.',
    requiredInfo: [
      'How many times did you communicate with the provider this week?',
      'Were updates received on schedule?',
      'Were there any unanswered messages or missed calls?',
    ],
    escalationLevel: 1,
    trackingState: 'shallow_input',
    detectedAt: '2026-04-11T07:30:00Z',
    familyMember: 'Robert M.',
  },
];

export const demoDataConfidence: DataConfidenceScore[] = [
  {
    category: 'Boundaries',
    confidence: 'low',
    completeness: 40,
    consistency: 55,
    specificity: 35,
    overall: 43,
    issues: ['Missing updates on 3 of 5 boundaries', 'No enforcement/violation events reported'],
  },
  {
    category: 'Financial Support',
    confidence: 'low',
    completeness: 60,
    consistency: 30,
    specificity: 50,
    overall: 47,
    issues: ['Contradiction between "support stopped" and phone bill payment', 'No clarity on other ongoing support'],
  },
  {
    category: 'Substance Use Indicators',
    confidence: 'low',
    completeness: 45,
    consistency: 25,
    specificity: 30,
    overall: 33,
    issues: ['Subjective assessment conflicts with behavioral signals', 'No objective testing data'],
  },
  {
    category: 'Communication Patterns',
    confidence: 'moderate',
    completeness: 65,
    consistency: 80,
    specificity: 40,
    overall: 62,
    issues: ['Provider communication detail is vague'],
  },
  {
    category: 'Treatment Compliance',
    confidence: 'high',
    completeness: 90,
    consistency: 85,
    specificity: 88,
    overall: 88,
    issues: [],
  },
  {
    category: 'Emotional State',
    confidence: 'moderate',
    completeness: 70,
    consistency: 75,
    specificity: 55,
    overall: 67,
    issues: ['Updates could include more specific behavioral cues'],
  },
];

export const demoDepthPrompts: DepthPrompt[] = [
  {
    id: 'dp-1',
    trigger: 'Vague behavioral update detected',
    promptText: 'I need more specific detail to understand what\'s actually happening.\n\nTo guide you accurately, I need:\n• What behaviors have changed in the last 7 days\n• What commitments were kept or missed\n• Whether any substance use was observed or suspected\n\nCan you provide that now, or would you prefer to come back and give a more complete update?',
    requiredFields: ['behavioral_changes', 'commitments_status', 'substance_indicators'],
    category: 'Behavioral Update',
  },
  {
    id: 'dp-2',
    trigger: 'Financial support contradiction detected',
    promptText: 'Earlier you mentioned that financial support had stopped, but now it appears support may have been provided again.\n\nThose two things don\'t fully line up, and that changes how I interpret what\'s happening.\n\nCan you clarify what actually occurred over the past few days?\n\nIf now isn\'t a good time, we can come back to it — but I do need that clarity to guide you properly.',
    requiredFields: ['financial_clarification', 'exception_reasoning', 'other_supports'],
    category: 'Financial Support',
  },
  {
    id: 'dp-3',
    trigger: 'Incomplete boundary reporting',
    promptText: 'I\'m missing detail on several active boundaries.\n\nTo give you accurate guidance, I need to know for each boundary:\n• Was it held or broken?\n• Were any exceptions made?\n• Who was involved?\n\nCan you walk through the ones I\'m missing?',
    requiredFields: ['boundary_status', 'exceptions', 'involved_parties'],
    category: 'Boundary Compliance',
  },
];

export const demoDeferrals: DeferralRecord[] = [
  {
    id: 'def-1',
    issueId: 'iss-4',
    deferredAt: '2026-04-09T17:00:00Z',
    returnTime: '2026-04-10T09:00:00Z',
    reminderSent: true,
    returnedAt: undefined,
    resolved: false,
    familyMember: 'Linda M.',
  },
  {
    id: 'def-2',
    issueId: 'iss-2',
    deferredAt: '2026-04-10T14:45:00Z',
    returnTime: '2026-04-10T20:00:00Z',
    reminderSent: true,
    returnedAt: '2026-04-10T20:15:00Z',
    resolved: false,
    familyMember: 'Linda M.',
  },
];

export const demoReconciliationTimeline: ReconciliationEvent[] = [
  {
    id: 'evt-1',
    timestamp: '2026-04-11T09:00:00Z',
    type: 'detection',
    description: 'Incomplete boundary compliance update detected — missing detail on 3 of 5 active boundaries.',
    familyMember: 'Robert M.',
    category: 'Boundary Compliance',
    confidence: 'low',
  },
  {
    id: 'evt-2',
    timestamp: '2026-04-11T08:15:00Z',
    type: 'detection',
    description: 'Shallow input detected: "things are going better" lacks behavioral specifics.',
    familyMember: 'Linda M.',
    category: 'Behavioral Update',
    confidence: 'low',
  },
  {
    id: 'evt-3',
    timestamp: '2026-04-10T20:15:00Z',
    type: 'clarification',
    description: 'Linda returned from deferral. Partial clarification provided on financial support — still unresolved.',
    familyMember: 'Linda M.',
    category: 'Financial Support',
    confidence: 'low',
  },
  {
    id: 'evt-4',
    timestamp: '2026-04-10T20:00:00Z',
    type: 'reminder',
    description: 'Push notification sent: "We still need a more detailed update on financial support to give you accurate guidance."',
    familyMember: 'Linda M.',
    category: 'Financial Support',
  },
  {
    id: 'evt-5',
    timestamp: '2026-04-10T14:45:00Z',
    type: 'deferral',
    description: 'Linda deferred financial support clarification. Scheduled return: 8:00 PM today.',
    familyMember: 'Linda M.',
    category: 'Financial Support',
  },
  {
    id: 'evt-6',
    timestamp: '2026-04-10T14:30:00Z',
    type: 'detection',
    description: 'Contradiction detected: prior report says "all financial support stopped" but current update references phone bill payment.',
    familyMember: 'Linda M.',
    category: 'Financial Support',
    confidence: 'low',
  },
  {
    id: 'evt-7',
    timestamp: '2026-04-09T17:00:00Z',
    type: 'deferral',
    description: 'Linda deferred substance use indicator clarification. Scheduled return: 9:00 AM tomorrow.',
    familyMember: 'Linda M.',
    category: 'Substance Use Indicators',
  },
  {
    id: 'evt-8',
    timestamp: '2026-04-09T16:45:00Z',
    type: 'detection',
    description: 'Contradiction: "he seems sober" conflicts with reported missed therapy and erratic sleep patterns.',
    familyMember: 'Linda M.',
    category: 'Substance Use Indicators',
    confidence: 'low',
  },
  {
    id: 'evt-9',
    timestamp: '2026-04-09T10:00:00Z',
    type: 'resolution',
    description: 'Treatment compliance update verified — all required detail provided with high specificity.',
    familyMember: 'Robert M.',
    category: 'Treatment Compliance',
    confidence: 'high',
  },
  {
    id: 'evt-10',
    timestamp: '2026-04-08T15:30:00Z',
    type: 'escalation',
    description: 'Escalation Level 2: Repeated vague responses on substance use indicators. Impact on guidance accuracy explained.',
    familyMember: 'Linda M.',
    category: 'Substance Use Indicators',
  },
];

export const systemImpactSummary = {
  outcomePrediction: {
    status: 'reduced_confidence' as const,
    message: 'Prediction confidence is reduced due to 3 unresolved input issues across boundaries, financial support, and substance use indicators.',
  },
  learningLayer: {
    status: 'partial_exclusion' as const,
    message: '2 data categories excluded from pattern learning due to low data confidence (Financial Support, Substance Use).',
  },
  accountability: {
    status: 'incomplete' as const,
    message: 'Family accountability score may not fully reflect current behavior due to incomplete boundary reporting.',
  },
  recommendations: {
    status: 'limited' as const,
    message: 'Some recommendations are withheld until input quality improves. Guidance may be less accurate.',
  },
};

// ========== SUPER ADMIN SITE-WIDE DATA ==========

export interface OrgInputHealth {
  id: string;
  name: string;
  type: 'provider' | 'private_family';
  totalFamilies: number;
  avgConfidence: number;
  confidence: InputConfidence;
  unresolvedIssues: number;
  contradictions: number;
  shallowInputs: number;
  incompleteInputs: number;
  lastActivity: string;
  deferralsOverdue: number;
  learningExclusions: number;
}

export interface PlatformHealthSummary {
  totalFamilies: number;
  totalProviders: number;
  privateFamilies: number;
  avgDataConfidence: number;
  totalUnresolved: number;
  totalContradictions: number;
  totalShallowInputs: number;
  totalIncomplete: number;
  totalDeferralsOverdue: number;
  learningDataExcluded: number;
  confidenceDistribution: { low: number; moderate: number; high: number };
}

export const demoPlatformHealth: PlatformHealthSummary = {
  totalFamilies: 147,
  totalProviders: 12,
  privateFamilies: 38,
  avgDataConfidence: 61,
  totalUnresolved: 89,
  totalContradictions: 23,
  totalShallowInputs: 41,
  totalIncomplete: 25,
  totalDeferralsOverdue: 14,
  learningDataExcluded: 31,
  confidenceDistribution: { low: 34, moderate: 72, high: 41 },
};

export const demoOrgInputHealth: OrgInputHealth[] = [
  {
    id: 'org-1',
    name: 'Freedom Interventions',
    type: 'provider',
    totalFamilies: 24,
    avgConfidence: 72,
    confidence: 'moderate',
    unresolvedIssues: 8,
    contradictions: 2,
    shallowInputs: 4,
    incompleteInputs: 2,
    lastActivity: '2026-04-11T10:15:00Z',
    deferralsOverdue: 1,
    learningExclusions: 3,
  },
  {
    id: 'org-2',
    name: 'Serenity Recovery Group',
    type: 'provider',
    totalFamilies: 31,
    avgConfidence: 55,
    confidence: 'moderate',
    unresolvedIssues: 18,
    contradictions: 6,
    shallowInputs: 8,
    incompleteInputs: 4,
    lastActivity: '2026-04-11T09:45:00Z',
    deferralsOverdue: 3,
    learningExclusions: 7,
  },
  {
    id: 'org-3',
    name: 'Pathways Clinical Services',
    type: 'provider',
    totalFamilies: 18,
    avgConfidence: 78,
    confidence: 'high',
    unresolvedIssues: 4,
    contradictions: 1,
    shallowInputs: 2,
    incompleteInputs: 1,
    lastActivity: '2026-04-11T08:30:00Z',
    deferralsOverdue: 0,
    learningExclusions: 1,
  },
  {
    id: 'org-4',
    name: 'Bridges to Hope',
    type: 'provider',
    totalFamilies: 15,
    avgConfidence: 44,
    confidence: 'low',
    unresolvedIssues: 14,
    contradictions: 5,
    shallowInputs: 6,
    incompleteInputs: 3,
    lastActivity: '2026-04-10T22:00:00Z',
    deferralsOverdue: 4,
    learningExclusions: 8,
  },
  {
    id: 'org-5',
    name: 'New Day Treatment Partners',
    type: 'provider',
    totalFamilies: 22,
    avgConfidence: 68,
    confidence: 'moderate',
    unresolvedIssues: 11,
    contradictions: 3,
    shallowInputs: 5,
    incompleteInputs: 3,
    lastActivity: '2026-04-11T07:00:00Z',
    deferralsOverdue: 2,
    learningExclusions: 4,
  },
  {
    id: 'fam-priv-1',
    name: 'Private Families (Self-Managed)',
    type: 'private_family',
    totalFamilies: 38,
    avgConfidence: 48,
    confidence: 'low',
    unresolvedIssues: 34,
    contradictions: 6,
    shallowInputs: 16,
    incompleteInputs: 12,
    lastActivity: '2026-04-11T10:30:00Z',
    deferralsOverdue: 4,
    learningExclusions: 8,
  },
];

export const demoTopIssueCategories = [
  { category: 'Boundary Compliance', count: 28, pct: 31 },
  { category: 'Financial Support', count: 19, pct: 21 },
  { category: 'Substance Use Indicators', count: 16, pct: 18 },
  { category: 'Communication Patterns', count: 14, pct: 16 },
  { category: 'Behavioral Updates', count: 12, pct: 14 },
];
