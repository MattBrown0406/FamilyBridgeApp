export type ReadinessStatusLabel = 'Not Ready' | 'Emerging Window' | 'Active Window' | 'Critical Window';

export type WindowStability = 'Low' | 'Moderate' | 'High';

export type SignalCategoryName =
  | 'Distress Elevation'
  | 'Consequence Awareness'
  | 'Resistance Fatigue'
  | 'Instability / System Disruption'
  | 'Help-Proximity Behavior';

export type TrendDirection = 'up' | 'down' | 'stable';

export type SourceType =
  | 'Family-reported event'
  | 'Communication analysis'
  | 'Behavior/compliance tracking'
  | 'Financial event'
  | 'Attendance/check-in pattern'
  | 'Manual clinician note'
  | 'AI pattern detection';

export type ImpactDirection = 'positive' | 'negative' | 'neutral';

export type NoteType =
  | 'Pattern observation'
  | 'Intervention strategy'
  | 'Family coaching'
  | 'Placement planning'
  | 'Risk flag'
  | 'Timing judgment';

export type CaseStatus =
  | 'Monitoring'
  | 'Early Preparation'
  | 'Active Preparation'
  | 'Intervention Recommended'
  | 'Intervention Scheduled'
  | 'Intervention Completed'
  | 'Reassessing';

export interface SignalCategory {
  name: SignalCategoryName;
  currentScore: number;
  weight: number;
  trend: TrendDirection;
  explanation: string;
  recentSignals: string[];
}

export interface ObservedIndicator {
  id: string;
  timestamp: string;
  sourceType: SourceType;
  description: string;
  categoryTags: SignalCategoryName[];
  impactDirection: ImpactDirection;
}

export interface Recommendation {
  summary: string;
  actionNow: string;
  avoidNow: string;
  reassessWhen: string;
}

export interface InterventionAlert {
  id: string;
  threshold: number;
  title: string;
  explanation: string;
  contributingSignals: string[];
  urgency: 'moderate' | 'high' | 'critical';
  timestamp: string;
}

export interface ClinicianNote {
  id: string;
  createdAt: string;
  noteType: NoteType;
  text: string;
  category: SignalCategoryName | 'General';
  followUp: boolean;
}

export interface ReadinessSnapshot {
  date: string;
  totalScore: number;
  distress: number;
  consequence: number;
  resistance: number;
  instability: number;
  helpProximity: number;
}

export interface KeyChange {
  id: string;
  description: string;
  delta: string;
  direction: 'up' | 'down';
  category: SignalCategoryName;
}

export interface TopDriver {
  label: string;
  explanation: string;
  category: SignalCategoryName;
}

export interface MisTimingRisk {
  tooEarly: string;
  tooLate: string;
}

export interface Next72HourStrategy {
  objective: string;
  doActions: string[];
  avoidActions: string[];
  prepareActions: string[];
}

export interface PrepChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}

export interface InterventionistInsight {
  assessment: string;
  tacticalNote: string;
  confidence: string;
}

export interface ClientProfile {
  id: string;
  name: string;
  caseStatus: CaseStatus;
  lastUpdated: string;
  totalScore: number;
  statusLabel: ReadinessStatusLabel;
  windowStability: WindowStability;
  summary: string;
  signals: SignalCategory[];
  indicators: ObservedIndicator[];
  recommendation: Recommendation;
  alerts: InterventionAlert[];
  notes: ClinicianNote[];
  history: ReadinessSnapshot[];
  keyChanges: KeyChange[];
  topDrivers: TopDriver[];
  misTimingRisk: MisTimingRisk;
  next72HourStrategy: Next72HourStrategy;
  prepChecklist: PrepChecklistItem[];
  interventionistInsight: InterventionistInsight;
}

export const SIGNAL_WEIGHTS: Record<SignalCategoryName, number> = {
  'Distress Elevation': 0.20,
  'Consequence Awareness': 0.25,
  'Resistance Fatigue': 0.25,
  'Instability / System Disruption': 0.15,
  'Help-Proximity Behavior': 0.15,
};

export function getStatusLabel(score: number): ReadinessStatusLabel {
  if (score <= 40) return 'Not Ready';
  if (score <= 65) return 'Emerging Window';
  if (score <= 80) return 'Active Window';
  return 'Critical Window';
}

export function getWindowStability(history: ReadinessSnapshot[]): WindowStability {
  if (history.length < 5) return 'Low';
  const recent = history.slice(-5);
  const scores = recent.map(h => h.totalScore);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);
  if (stdDev > 12) return 'Low';
  if (stdDev > 6) return 'Moderate';
  return 'High';
}

export function calculateReadinessScore(signals: SignalCategory[]): number {
  let total = 0;
  for (const s of signals) {
    total += s.currentScore * s.weight * 10;
  }
  return Math.round(Math.min(100, Math.max(0, total)));
}

export function getRecommendation(score: number): Recommendation {
  const evidenceLabel = score <= 40
    ? 'The family has recorded limited or mixed information.'
    : score <= 65
      ? 'The family has documented increased concern and mixed signs of openness.'
      : score <= 80
        ? 'Several family-recorded concerns are elevated at the same time.'
        : 'The current family record contains many elevated concern signals.';

  return {
    summary: `${evidenceLabel} This score organizes family observations; it does not measure willingness, diagnose a condition, or predict whether treatment will be accepted.`,
    actionNow: 'Review the underlying observations with the family and qualified professionals, confirm safe options, and agree on a compassionate plan based on current facts.',
    avoidNow: 'Avoid secrecy, pressure, emotional coercion, rigid deadlines, or decisions based on the score alone. Preserve room for safety, clinical judgment, and informed choice.',
    reassessWhen: 'Review the record when circumstances materially change or an authorized participant adds relevant information.',
  };
}

function getMisTimingRisk(score: number): MisTimingRisk {
  if (score <= 40) {
    return {
      tooEarly: 'Resistance is fully active. An intervention now will likely be rejected outright and may reinforce the individual\'s belief that they don\'t need help. It can also fracture family unity if the attempt fails.',
      tooLate: 'Not applicable at this stage. Focus on building conditions for a future window.',
    };
  }
  if (score <= 65) {
    return {
      tooEarly: 'The individual is starting to feel pressure, but denial is still partially intact. Moving now risks a defensive reaction that could reset weeks of progress. The cracks need more time to widen.',
      tooLate: 'If family members resume enabling behaviors (financial rescue, emotional rescue, softening boundaries), the emerging pressure dissipates. The individual re-stabilizes and the window closes.',
    };
  }
  if (score <= 80) {
    return {
      tooEarly: 'Resistance is weakening but not gone. A premature push could trigger a last-resort defensive response. Wait for one more confirming signal before full execution.',
      tooLate: 'This window is active but not permanent. If external pressures decrease — a friend lends money, a family member breaks rank — stability returns and readiness drops rapidly.',
    };
  }
  return {
    tooEarly: 'At this score, hesitation is the greater risk. The individual is as reachable as they are likely to be. Delaying is the equivalent of "too late."',
    tooLate: 'Windows at this level typically last 24–72 hours. After that, the individual either adapts to the new level of pain or an enabling event resets the system. Act now.',
  };
}

function getNext72Strategy(score: number): Next72HourStrategy {
  if (score <= 40) {
    return {
      objective: 'Maintain containment. Create conditions for future readiness without premature action.',
      doActions: [
        'Hold all established boundaries consistently',
        'Continue documenting behavioral patterns and incidents',
        'Attend your own support groups and therapy sessions',
        'Keep communication simple, brief, and non-reactive',
      ],
      avoidActions: [
        'Emotional confrontation or repeated pleading',
        'Financial rescue of any kind',
        'Threatening consequences you are unwilling to enforce',
        'Gathering family for an unplanned intervention attempt',
      ],
      prepareActions: [
        'Research treatment facilities and verify insurance coverage',
        'Identify potential intervention team members',
        'Begin pre-reading intervention team letters (do not share)',
      ],
    };
  }
  if (score <= 65) {
    return {
      objective: 'Sustain building pressure without escalation. Prepare intervention logistics quietly.',
      doActions: [
        'Maintain all financial and behavioral boundaries without exception',
        'Begin aligning family members privately on intervention plan',
        'Verify treatment placement options and bed availability',
        'Let natural consequences continue uninterrupted',
      ],
      avoidActions: [
        'Revealing intervention planning to anyone outside the team',
        'Softening boundaries because the individual seems to be improving',
        'Over-communicating concern — let the pressure do the work',
        'Engaging in arguments or debates about substance use',
      ],
      prepareActions: [
        'Confirm insurance authorization and treatment bed hold',
        'Draft or finalize intervention letters',
        'Arrange travel/transportation logistics',
        'Schedule intervention team rehearsal call',
      ],
    };
  }
  return {
    objective: 'Move to execution posture. All preparation should be finalized and the team ready to act.',
    doActions: [
      'Confirm treatment bed is held and intake is expecting the call',
      'Finalize intervention team roles and rehearse the process',
      'Have bags packed and transportation arranged',
      'Maintain boundaries firmly — this pressure is creating the window',
    ],
    avoidActions: [
      'Allowing any enabling behavior to re-stabilize the individual',
      'Delaying execution to "wait for a better time"',
      'Adding emotional guilt beyond what is already in letters',
      'Giving the individual extended time to "think about it"',
    ],
    prepareActions: [
      'Verify bed availability one final time',
      'Confirm all team members are available within 24 hours',
      'Prepare post-intervention family support plan',
      'Have a backup treatment option identified',
    ],
  };
}

// Generate realistic 30-day history with messy, imperfect data
function generateHistory(): ReadinessSnapshot[] {
  const history: ReadinessSnapshot[] = [];
  const now = new Date();

  // Realistic trajectory: low start, false hope around day 10, crisis spike day 18, gradual climb with volatility
  const trajectoryPoints = [
    // Days 0-7: Low baseline with minor fluctuation
    { d: 3.0, c: 2.5, r: 2.0, i: 3.5, h: 1.0 },
    { d: 2.8, c: 2.2, r: 2.3, i: 3.0, h: 0.8 },
    { d: 3.2, c: 2.8, r: 1.8, i: 3.2, h: 1.2 },
    { d: 3.5, c: 2.5, r: 2.5, i: 2.8, h: 1.0 },
    { d: 3.0, c: 3.0, r: 2.0, i: 3.5, h: 0.5 },
    { d: 3.8, c: 2.8, r: 2.2, i: 3.0, h: 1.5 },
    { d: 4.0, c: 3.2, r: 2.5, i: 3.2, h: 1.0 },
    { d: 3.5, c: 3.0, r: 2.8, i: 2.5, h: 1.2 },
    // Days 8-12: False improvement (family softened boundaries)
    { d: 2.5, c: 2.0, r: 3.5, i: 2.0, h: 0.5 },
    { d: 2.0, c: 1.8, r: 4.0, i: 1.5, h: 0.3 },
    { d: 2.2, c: 2.0, r: 3.8, i: 2.0, h: 0.5 },
    { d: 2.5, c: 2.2, r: 3.5, i: 2.2, h: 0.8 },
    { d: 3.0, c: 2.5, r: 3.0, i: 2.5, h: 0.5 },
    // Days 13-17: Boundaries re-established, slow climb
    { d: 3.5, c: 3.5, r: 2.8, i: 3.0, h: 1.0 },
    { d: 4.0, c: 4.0, r: 3.0, i: 3.5, h: 1.5 },
    { d: 4.2, c: 4.5, r: 3.2, i: 3.8, h: 1.8 },
    { d: 4.5, c: 4.8, r: 3.5, i: 4.0, h: 2.0 },
    { d: 5.0, c: 5.0, r: 3.8, i: 4.2, h: 2.2 },
    // Day 18: Crisis spike (DUI arrest)
    { d: 7.5, c: 7.0, r: 4.0, i: 7.5, h: 3.5 },
    // Days 19-22: Post-crisis elevated but volatile
    { d: 7.0, c: 7.5, r: 4.5, i: 6.0, h: 3.0 },
    { d: 6.0, c: 6.5, r: 5.0, i: 5.5, h: 3.5 },
    { d: 5.5, c: 6.0, r: 5.5, i: 5.0, h: 3.0 },
    { d: 6.0, c: 6.5, r: 5.0, i: 5.5, h: 4.0 },
    // Days 23-26: Steady climbing — boundaries holding
    { d: 6.5, c: 7.0, r: 5.5, i: 5.5, h: 4.0 },
    { d: 6.8, c: 7.2, r: 6.0, i: 5.8, h: 4.5 },
    { d: 7.0, c: 7.5, r: 6.0, i: 5.5, h: 4.8 },
    { d: 7.0, c: 7.8, r: 6.2, i: 6.0, h: 5.0 },
    // Days 27-29: Current — active window
    { d: 7.2, c: 8.0, r: 6.5, i: 6.0, h: 5.2 },
    { d: 7.5, c: 8.0, r: 6.5, i: 5.8, h: 5.5 },
    { d: 7.5, c: 8.2, r: 6.8, i: 6.0, h: 5.5 },
  ];

  for (let i = 0; i < 30; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - (29 - i));
    const p = trajectoryPoints[i];
    const noise = () => (Math.random() - 0.5) * 0.6;
    const d = Math.min(10, Math.max(0, Math.round((p.d + noise()) * 10) / 10));
    const c = Math.min(10, Math.max(0, Math.round((p.c + noise()) * 10) / 10));
    const r = Math.min(10, Math.max(0, Math.round((p.r + noise()) * 10) / 10));
    const inst = Math.min(10, Math.max(0, Math.round((p.i + noise()) * 10) / 10));
    const h = Math.min(10, Math.max(0, Math.round((p.h + noise()) * 10) / 10));
    const total = Math.round(
      d * 0.20 * 10 + c * 0.25 * 10 + r * 0.25 * 10 + inst * 0.15 * 10 + h * 0.15 * 10
    );
    history.push({
      date: date.toISOString().split('T')[0],
      totalScore: Math.min(100, Math.max(0, total)),
      distress: d,
      consequence: c,
      resistance: r,
      instability: inst,
      helpProximity: h,
    });
  }
  return history;
}

const history = generateHistory();

export const demoClient: ClientProfile = {
  id: 'demo-client-001',
  name: 'Michael R.',
  caseStatus: 'Active Preparation',
  lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  totalScore: 72,
  statusLabel: 'Active Window',
  windowStability: getWindowStability(history),
  summary: 'Distress has increased steadily over the last 72 hours while defensive language has decreased by roughly 40%. This combination — rising pain with falling resistance — is one of the most reliable precursors to a short window of receptivity. Financial boundary enforcement 48 hours ago created a consequence spike that has not been rescued. Help-proximity behaviors appeared for the first time in three weeks. This window is real but may be unstable.',

  keyChanges: [
    { id: 'kc-1', description: 'Defensive language decreased', delta: '~40% reduction over 5 days', direction: 'down', category: 'Resistance Fatigue' },
    { id: 'kc-2', description: 'First treatment-related question in 3 weeks', delta: 'New signal', direction: 'up', category: 'Help-Proximity Behavior' },
    { id: 'kc-3', description: 'Financial boundary enforced — no rescue', delta: '48 hrs holding', direction: 'up', category: 'Consequence Awareness' },
    { id: 'kc-4', description: 'Missed two scheduled commitments', delta: '2 missed in 5 days', direction: 'up', category: 'Instability / System Disruption' },
    { id: 'kc-5', description: 'Emotional exhaustion language elevated', delta: 'Multiple expressions', direction: 'up', category: 'Distress Elevation' },
  ],

  topDrivers: [
    { label: 'Consequence awareness rising after financial boundary', explanation: 'Family enforced a clear financial boundary 48 hours ago. The individual has not been rescued. This sustained discomfort is the primary driver of current score elevation.', category: 'Consequence Awareness' },
    { label: 'Resistance intensity declining', explanation: 'Combative pushback has been replaced by quiet withdrawal over the last 5 days. This pattern — fighting less, isolating more — often indicates exhaustion with denial maintenance.', category: 'Resistance Fatigue' },
    { label: 'First help-proximity behavior in weeks', explanation: 'Asked a family member how long inpatient treatment lasts. This was unprompted and marks the first treatment-related inquiry in 3 weeks. Not a commitment — but a significant shift from prior total refusal.', category: 'Help-Proximity Behavior' },
  ],

  misTimingRisk: getMisTimingRisk(72),

  next72HourStrategy: getNext72Strategy(72),

  prepChecklist: [
    { id: 'pc-1', label: 'Treatment placement identified', completed: true },
    { id: 'pc-2', label: 'Bed availability confirmed (within 48 hrs)', completed: true },
    { id: 'pc-3', label: 'Insurance verification completed', completed: true },
    { id: 'pc-4', label: 'Travel/transportation logistics arranged', completed: false },
    { id: 'pc-5', label: 'Intervention team aligned and rehearsed', completed: false },
    { id: 'pc-6', label: 'All letters finalized', completed: false },
    { id: 'pc-7', label: 'Bags packed and ready for immediate departure', completed: false },
    { id: 'pc-8', label: 'Timing window identified and communicated', completed: false },
  ],

  interventionistInsight: {
    assessment: 'The family has recorded fatigue, conflict, and one treatment-related question. These observations should be reviewed with a qualified intervention professional and should not be treated as proof of willingness or refusal.',
    tacticalNote: 'Prioritize safety and a calm setting. Avoid initiating a difficult conversation during active conflict, intoxication, withdrawal, or another unsafe circumstance.',
    confidence: 'No acceptance probability is provided. Individual decisions cannot be inferred reliably from family observations or demo data.',
  },

  signals: [
    {
      name: 'Distress Elevation',
      currentScore: 7.5,
      weight: 0.20,
      trend: 'up',
      explanation: 'Emotional exhaustion is escalating. Multiple expressions of fatigue, hopelessness, and frustration in the last 72 hours. Sleep disruption and irritability reported by family. This is not performance distress — the pattern is sustained.',
      recentSignals: [
        '"I\'m exhausted. I can\'t keep doing this." — said to mother unprompted',
        'Sleep disruption — up until 3–4 AM for three consecutive nights',
        'Visible emotional volatility: anger followed by tears within same conversation',
      ],
    },
    {
      name: 'Consequence Awareness',
      currentScore: 8.2,
      weight: 0.25,
      trend: 'up',
      explanation: 'Growing acknowledgment that actions are producing real consequences. First mention of potential job loss. Acknowledged relationship damage to spouse directly. Financial boundary enforcement is forcing awareness that was previously avoidable.',
      recentSignals: [
        'Acknowledged marriage strain: "She\'s not going to put up with this much longer"',
        'Mentioned potential job consequences for first time in two weeks',
        'Visibly frustrated when financial request was denied — but did not escalate',
      ],
    },
    {
      name: 'Resistance Fatigue',
      currentScore: 6.8,
      weight: 0.25,
      trend: 'up',
      explanation: 'The most important signal right now. Defensive language frequency has decreased roughly 40% over 5 days. He is fighting less — not because he agrees, but because maintaining denial is becoming exhausting. Quiet withdrawal is replacing combative responses.',
      recentSignals: [
        'Defensive language frequency down ~40% over 5-day rolling window',
        'Replaced combative responses with quiet withdrawal',
        'Did not argue when sister mentioned treatment options — just left the room',
      ],
    },
    {
      name: 'Instability / System Disruption',
      currentScore: 6.0,
      weight: 0.15,
      trend: 'stable',
      explanation: 'Daily structure is deteriorating. Missed commitments, social isolation increasing, and conflict spikes after boundary enforcement. The system that was holding his life together is fraying — this instability feeds readiness.',
      recentSignals: [
        'Missed second scheduled check-in this week',
        'Skipped regular social commitment — second time in 10 days',
        'Conflict spike after financial boundary enforcement (did not result in rescue)',
      ],
    },
    {
      name: 'Help-Proximity Behavior',
      currentScore: 5.5,
      weight: 0.15,
      trend: 'up',
      explanation: 'First indirect treatment inquiries in three weeks. Asking questions without committing — testing the idea without owning it. This is how openness starts. He would deny any interest if asked directly, but the questions are significant.',
      recentSignals: [
        'Asked mother: "How long does inpatient treatment usually last?"',
        'Referenced a friend who went to rehab: "It seemed like it helped him"',
        'Did not shut down or leave when family mentioned therapy options',
      ],
    },
  ],

  indicators: [
    {
      id: 'ind-001',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      sourceType: 'Communication analysis',
      description: '"I\'m exhausted and I can\'t keep doing this." Said to mother unprompted during a calm moment. Not during conflict. This is significant — distress expressed outside of arguments carries more weight.',
      categoryTags: ['Distress Elevation'],
      impactDirection: 'positive',
    },
    {
      id: 'ind-002',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      sourceType: 'AI pattern detection',
      description: 'Defensive language frequency decreased approximately 40% over 5-day rolling window. Combative responses declining, replaced by silence and withdrawal. Pattern consistent with resistance exhaustion.',
      categoryTags: ['Resistance Fatigue'],
      impactDirection: 'positive',
    },
    {
      id: 'ind-003',
      timestamp: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
      sourceType: 'Family-reported event',
      description: 'Asked mother how long inpatient treatment usually lasts. First treatment-related inquiry in three weeks. Did not follow up, but the question was unprompted.',
      categoryTags: ['Help-Proximity Behavior'],
      impactDirection: 'positive',
    },
    {
      id: 'ind-004',
      timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
      sourceType: 'Financial event',
      description: 'Requested $200 from mother for "car repair." Mother held financial boundary. Client expressed frustration but did not escalate to anger or threats. Previous pattern was aggressive escalation when denied.',
      categoryTags: ['Consequence Awareness', 'Resistance Fatigue'],
      impactDirection: 'positive',
    },
    {
      id: 'ind-005',
      timestamp: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(),
      sourceType: 'Attendance/check-in pattern',
      description: 'Missed second scheduled check-in this week. Pattern of disengagement from previously maintained commitments. Structure breakdown accelerating.',
      categoryTags: ['Instability / System Disruption'],
      impactDirection: 'positive',
    },
    {
      id: 'ind-006',
      timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
      sourceType: 'Family-reported event',
      description: 'Household conflict spike after financial boundary enforcement. Lasted approximately 20 minutes, then client went silent and isolated in room. Previous pattern was extended escalation (1+ hours).',
      categoryTags: ['Consequence Awareness', 'Instability / System Disruption'],
      impactDirection: 'positive',
    },
    {
      id: 'ind-007',
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      sourceType: 'Behavior/compliance tracking',
      description: 'Referenced a friend who completed treatment: "It seemed like it helped him." Unsolicited. Said during casual conversation, not during a confrontation. Context matters — this was not coerced.',
      categoryTags: ['Help-Proximity Behavior'],
      impactDirection: 'positive',
    },
    {
      id: 'ind-008',
      timestamp: new Date(Date.now() - 54 * 60 * 60 * 1000).toISOString(),
      sourceType: 'Communication analysis',
      description: '"She\'s not going to put up with this much longer." First direct acknowledgment that marriage consequences are real. Previously dismissed spouse\'s concerns as "overreacting."',
      categoryTags: ['Consequence Awareness'],
      impactDirection: 'positive',
    },
    {
      id: 'ind-009',
      timestamp: new Date(Date.now() - 60 * 60 * 60 * 1000).toISOString(),
      sourceType: 'Family-reported event',
      description: 'Sister mentioned therapy options during family dinner. Client did not shut down, argue, or leave the table — sat quietly and changed the subject after 30 seconds. Previous response was immediate anger.',
      categoryTags: ['Resistance Fatigue', 'Help-Proximity Behavior'],
      impactDirection: 'positive',
    },
    {
      id: 'ind-010',
      timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
      sourceType: 'Manual clinician note',
      description: 'Clinical observation: client appears more emotionally fatigued than in previous sessions. Less guarded. Eye contact improved. Speech less rehearsed. Impression: denial structure is weakening but not collapsed.',
      categoryTags: ['Distress Elevation', 'Resistance Fatigue'],
      impactDirection: 'positive',
    },
    {
      id: 'ind-011',
      timestamp: new Date(Date.now() - 80 * 60 * 60 * 1000).toISOString(),
      sourceType: 'Attendance/check-in pattern',
      description: 'Skipped regular social commitment for second time in 10 days. Previously maintained this commitment consistently. Increasing isolation from non-using social network.',
      categoryTags: ['Instability / System Disruption'],
      impactDirection: 'positive',
    },
    {
      id: 'ind-012',
      timestamp: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
      sourceType: 'Family-reported event',
      description: 'Father reported that client called him "just to talk" for the first time in months. Conversation was brief (8 minutes) and did not include any requests for money. Father described tone as "tired, not angry."',
      categoryTags: ['Distress Elevation', 'Help-Proximity Behavior'],
      impactDirection: 'positive',
    },
    {
      id: 'ind-n01',
      timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      sourceType: 'Family-reported event',
      description: 'Mother gave client $150 after emotional plea. Boundary violation. Consequence pressure temporarily relieved. Score dropped as a result.',
      categoryTags: ['Consequence Awareness'],
      impactDirection: 'negative',
    },
  ],

  recommendation: getRecommendation(72),

  alerts: [
    {
      id: 'alert-001',
      threshold: 65,
      title: 'Active Intervention Window Detected',
      explanation: 'Readiness score has crossed into the Active Window range (66–80). Multiple signal categories are converging. Resistance fatigue and consequence awareness are both elevated simultaneously — this convergence is the key indicator.',
      contributingSignals: [
        'Consequence awareness elevated to 8.2 — highest observed',
        'Resistance fatigue trending up for 5 consecutive days',
        'First help-proximity behavior in 3 weeks',
        'Financial boundary held for 48 hours without family rescue',
      ],
      urgency: 'high',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'alert-002',
      threshold: 65,
      title: 'Emerging Window — Preparation Phase',
      explanation: 'Score moved from "Not Ready" to "Emerging Window" 4 days ago. This alert was the signal to begin quiet preparation. Preparation has been initiated.',
      contributingSignals: [
        'Distress elevation increased 2 points in 48 hours following DUI',
        'Financial boundary enforcement creating sustained consequence pressure',
      ],
      urgency: 'moderate',
      timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],

  notes: [
    {
      id: 'note-001',
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      noteType: 'Timing judgment',
      text: 'Window is real but potentially unstable. The rapid escalation post-DUI created conditions, but sustained readiness requires family to hold boundaries without faltering. Mother is the weak link — she came close to sending money yesterday. If she holds for 48 more hours, probability of successful intervention increases significantly. Team alignment call scheduled for tomorrow.',
      category: 'General',
      followUp: true,
    },
    {
      id: 'note-002',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      noteType: 'Pattern observation',
      text: 'Notable shift in resistance pattern: combative responses → quiet withdrawal. This is textbook pre-acceptance behavior. He is not ready to say yes, but he has stopped fighting as hard to say no. The energy required to maintain denial is depleting. Watch for the "quiet moment" — that is when he is most reachable.',
      category: 'Resistance Fatigue',
      followUp: false,
    },
    {
      id: 'note-003',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      noteType: 'Family coaching',
      text: 'Reinforced with family: the financial boundary is working. Do not cave. Mother is struggling — she interprets his distress as evidence she should help. Reframed: his distress is evidence that the boundary is effective. Provided additional support resources and scheduled a check-in call with mother specifically.',
      category: 'Consequence Awareness',
      followUp: true,
    },
    {
      id: 'note-004',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      noteType: 'Placement planning',
      text: 'Pre-screened two residential programs. Both have beds available within 48 hours. Insurance verification completed — 30-day residential covered with $500 deductible. Family has agreed to cover. Backup option identified in case primary facility has an intake delay.',
      category: 'General',
      followUp: false,
    },
    {
      id: 'note-005',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      noteType: 'Risk flag',
      text: 'CAUTION: Family boundary breach on Day 10 (mother sent $150) caused a 15-point score drop that took 5 days to recover. The system is fragile. One more enabling event could reset the entire trajectory. Mother has been briefed but remains emotionally volatile.',
      category: 'Consequence Awareness',
      followUp: true,
    },
  ],

  history,
};
