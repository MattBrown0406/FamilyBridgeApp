export type ReadinessStatusLabel = 'Not Ready' | 'Emerging Window' | 'Active Window' | 'Critical Window';

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

export interface ClientProfile {
  id: string;
  name: string;
  caseStatus: CaseStatus;
  lastUpdated: string;
  totalScore: number;
  statusLabel: ReadinessStatusLabel;
  summary: string;
  signals: SignalCategory[];
  indicators: ObservedIndicator[];
  recommendation: Recommendation;
  alerts: InterventionAlert[];
  notes: ClinicianNote[];
  history: ReadinessSnapshot[];
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

export function calculateReadinessScore(signals: SignalCategory[]): number {
  let total = 0;
  for (const s of signals) {
    total += s.currentScore * s.weight * 10;
  }
  return Math.round(Math.min(100, Math.max(0, total)));
}

export function getRecommendation(score: number): Recommendation {
  if (score <= 40) {
    return {
      summary: 'Intervention risk remains high due to active resistance and low help-proximity. The individual is not currently in a receptive window.',
      actionNow: 'Focus on consistent boundaries and continued observation. Support the family in maintaining their own stability. Document patterns and prepare for future windows.',
      avoidNow: 'Avoid premature confrontation, emotional appeals, or ultimatums. Do not attempt a formal intervention during this period.',
      reassessWhen: 'Reassess in 5–7 days or sooner if a significant life event occurs (legal issue, health crisis, relationship break).',
    };
  }
  if (score <= 65) {
    return {
      summary: 'Readiness is emerging. Cracks in denial and resistance may be forming. This is a preparation window, not an action window.',
      actionNow: 'Continue consequence clarity and begin quiet intervention preparation. Identify treatment placement options. Ensure the family team is aligned and ready.',
      avoidNow: 'Avoid direct pressure, lectures, or emotional confrontation. Do not tip the individual off to intervention planning.',
      reassessWhen: 'Reassess in 48–72 hours. Monitor for acceleration in distress or help-proximity signals.',
    };
  }
  if (score <= 80) {
    return {
      summary: 'Readiness is elevated. Multiple signals indicate weakening resistance and increasing consequence awareness. This is an active intervention preparation window.',
      actionNow: 'Begin active intervention coordination. Confirm treatment placement availability. Finalize intervention team roles. Prepare letters and logistics.',
      avoidNow: 'Avoid delays that could allow the window to close. Do not allow enabling behaviors to re-stabilize the individual prematurely.',
      reassessWhen: 'Reassess daily. Be prepared to act within 24–48 hours if signals continue to strengthen.',
    };
  }
  return {
    summary: 'A high-probability intervention window is open. Resistance is at its lowest observed level and multiple readiness signals are converging.',
    actionNow: 'Immediate intervention action is recommended within the next 24–72 hours. Confirm treatment bed availability. Brief the intervention team. Execute the plan.',
    avoidNow: 'Do not wait. Do not allow the family to second-guess timing. Avoid re-negotiation or wavering on consequences.',
    reassessWhen: 'Continuous monitoring. If intervention is not executed within 72 hours, reassess whether the window is closing.',
  };
}

// Generate realistic 30-day history
function generateHistory(): ReadinessSnapshot[] {
  const history: ReadinessSnapshot[] = [];
  const now = new Date();
  // Start low and trend upward with realistic variation
  const baseScores = {
    distress: 3, consequence: 2, resistance: 2, instability: 3, helpProximity: 1,
  };
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const progress = (29 - i) / 29;
    const noise = () => (Math.random() - 0.5) * 1.5;
    const d = Math.min(10, Math.max(0, Math.round((baseScores.distress + progress * 4.5 + noise()) * 10) / 10));
    const c = Math.min(10, Math.max(0, Math.round((baseScores.consequence + progress * 5 + noise()) * 10) / 10));
    const r = Math.min(10, Math.max(0, Math.round((baseScores.resistance + progress * 4 + noise()) * 10) / 10));
    const inst = Math.min(10, Math.max(0, Math.round((baseScores.instability + progress * 3 + noise()) * 10) / 10));
    const h = Math.min(10, Math.max(0, Math.round((baseScores.helpProximity + progress * 3.5 + noise()) * 10) / 10));
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

export const demoClient: ClientProfile = {
  id: 'demo-client-001',
  name: 'Michael R.',
  caseStatus: 'Active Preparation',
  lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  totalScore: 72,
  statusLabel: 'Active Window',
  summary: 'Readiness is elevated due to increased distress, reduced resistance language, and rising consequence awareness over the last 72 hours. Financial consequences and relationship strain are creating sustained pressure. Help-proximity behaviors are emerging for the first time in two weeks.',
  signals: [
    {
      name: 'Distress Elevation',
      currentScore: 7.5,
      weight: 0.20,
      trend: 'up',
      explanation: 'Emotional exhaustion language has increased significantly. Multiple expressions of fatigue and hopelessness noted in the last 72 hours.',
      recentSignals: [
        '"I\'m tired of this. Nothing is working."',
        'Increased emotional volatility reported by family',
        'Sleep disruption and irritability noted',
      ],
    },
    {
      name: 'Consequence Awareness',
      currentScore: 8.0,
      weight: 0.25,
      trend: 'up',
      explanation: 'Growing acknowledgment of relationship damage and financial instability. First mention of potential job loss in two weeks.',
      recentSignals: [
        'Acknowledged relationship strain with spouse',
        'Mentioned potential job consequences for first time',
        'Expressed concern about finances after boundary enforcement',
      ],
    },
    {
      name: 'Resistance Fatigue',
      currentScore: 6.5,
      weight: 0.25,
      trend: 'up',
      explanation: 'Defensive language frequency has decreased over the past 5 days. Less argumentative pushback when boundaries are mentioned.',
      recentSignals: [
        'Defensive language frequency decreased over 5 days',
        'Less aggressive refusal of family conversations',
        'Quiet withdrawal replacing combative responses',
      ],
    },
    {
      name: 'Instability / System Disruption',
      currentScore: 6.0,
      weight: 0.15,
      trend: 'stable',
      explanation: 'Daily structure showing signs of breakdown. Missed commitments and increasing isolation from support network.',
      recentSignals: [
        'Missed second scheduled check-in this week',
        'Skipped regular social commitment',
        'Conflict spike after financial boundary enforcement',
      ],
    },
    {
      name: 'Help-Proximity Behavior',
      currentScore: 5.5,
      weight: 0.15,
      trend: 'up',
      explanation: 'First indirect inquiries about treatment observed. Asking questions without committing — a significant shift from prior complete refusal.',
      recentSignals: [
        'Asked how long inpatient treatment usually lasts',
        'Mentioned a friend who went to rehab "and it helped"',
        'Did not shut down when family mentioned therapy options',
      ],
    },
  ],
  indicators: [
    {
      id: 'ind-001',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      sourceType: 'Communication analysis',
      description: 'Client stated: "I\'m exhausted and can\'t keep doing this." Distress language elevated.',
      categoryTags: ['Distress Elevation'],
      impactDirection: 'positive',
    },
    {
      id: 'ind-002',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      sourceType: 'Attendance/check-in pattern',
      description: 'Missed second scheduled check-in this week. Pattern of disengagement from commitments.',
      categoryTags: ['Instability / System Disruption'],
      impactDirection: 'positive',
    },
    {
      id: 'ind-003',
      timestamp: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
      sourceType: 'Family-reported event',
      description: 'Asked family member how long inpatient treatment usually lasts. First treatment-related inquiry.',
      categoryTags: ['Help-Proximity Behavior'],
      impactDirection: 'positive',
    },
    {
      id: 'ind-004',
      timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
      sourceType: 'Financial event',
      description: 'Family enforced financial boundary. Client expressed frustration but did not escalate.',
      categoryTags: ['Consequence Awareness', 'Resistance Fatigue'],
      impactDirection: 'positive',
    },
    {
      id: 'ind-005',
      timestamp: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
      sourceType: 'AI pattern detection',
      description: 'Defensive language frequency decreased 35% over 5-day rolling window.',
      categoryTags: ['Resistance Fatigue'],
      impactDirection: 'positive',
    },
    {
      id: 'ind-006',
      timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
      sourceType: 'Family-reported event',
      description: 'Family conflict escalated after financial boundary was enforced. Increased household tension.',
      categoryTags: ['Consequence Awareness', 'Instability / System Disruption'],
      impactDirection: 'positive',
    },
    {
      id: 'ind-007',
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      sourceType: 'Behavior/compliance tracking',
      description: 'Mentioned a friend who went to rehab "and it seems like it helped them."',
      categoryTags: ['Help-Proximity Behavior'],
      impactDirection: 'positive',
    },
    {
      id: 'ind-008',
      timestamp: new Date(Date.now() - 60 * 60 * 60 * 1000).toISOString(),
      sourceType: 'Communication analysis',
      description: 'Acknowledged relationship strain with spouse. First direct admission of impact on marriage.',
      categoryTags: ['Consequence Awareness'],
      impactDirection: 'positive',
    },
    {
      id: 'ind-009',
      timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
      sourceType: 'Manual clinician note',
      description: 'Clinical observation: client appears more emotionally fatigued than previous sessions. Less guarded.',
      categoryTags: ['Distress Elevation', 'Resistance Fatigue'],
      impactDirection: 'positive',
    },
    {
      id: 'ind-010',
      timestamp: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
      sourceType: 'Attendance/check-in pattern',
      description: 'Skipped regular social commitment for second time in a week.',
      categoryTags: ['Instability / System Disruption'],
      impactDirection: 'positive',
    },
  ],
  recommendation: getRecommendation(72),
  alerts: [
    {
      id: 'alert-001',
      threshold: 65,
      title: 'Readiness nearing viable intervention window',
      explanation: 'Readiness score has crossed the 65-point threshold, indicating an emerging intervention window. Multiple signals are converging.',
      contributingSignals: [
        'Consequence awareness elevated to 8.0',
        'Resistance fatigue trending upward',
        'First help-proximity behaviors observed',
      ],
      urgency: 'high',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'alert-002',
      threshold: 65,
      title: 'Emerging readiness window detected',
      explanation: 'Score moved from "Not Ready" to "Emerging Window" range. Distress and consequence awareness are primary drivers.',
      contributingSignals: [
        'Distress elevation increased 2 points in 48 hours',
        'Financial boundary enforcement creating consequence pressure',
      ],
      urgency: 'moderate',
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    },
  ],
  notes: [
    {
      id: 'note-001',
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      noteType: 'Timing judgment',
      text: 'Window is strengthening. Recommend moving to active preparation within 48 hours if trajectory continues. Family team alignment call scheduled for tomorrow.',
      category: 'General',
      followUp: true,
    },
    {
      id: 'note-002',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      noteType: 'Pattern observation',
      text: 'Notable shift in resistance patterns. Client is replacing combative responses with quiet withdrawal — a common pre-acceptance behavior. This aligns with increasing distress fatigue.',
      category: 'Resistance Fatigue',
      followUp: false,
    },
    {
      id: 'note-003',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      noteType: 'Family coaching',
      text: 'Reinforced with family: maintain financial boundaries without emotional escalation. Mother is struggling — provided additional support resources.',
      category: 'Consequence Awareness',
      followUp: true,
    },
    {
      id: 'note-004',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      noteType: 'Placement planning',
      text: 'Pre-screened two residential programs in the region. Both have availability within 48 hours. Insurance verification initiated.',
      category: 'General',
      followUp: false,
    },
  ],
  history: generateHistory(),
};
