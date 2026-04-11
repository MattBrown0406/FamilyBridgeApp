// Stage 2: Adaptive Learning Layer demo data

export type ConfidenceLevel = 'low' | 'moderate' | 'high';
export type ChangeStatus = 'auto_applied' | 'pending_review' | 'approved' | 'rejected';
export type ImpactLevel = 'low' | 'medium' | 'high';

export interface AdaptiveWeight {
  id: string;
  variable: string;
  engine: string;
  previousWeight: number;
  currentWeight: number;
  changePercent: number;
  direction: 'increased' | 'decreased';
  confidence: ConfidenceLevel;
  sampleSufficiency: 'insufficient' | 'moderate' | 'strong';
  reason: string;
  status: ChangeStatus;
  appliedAt: string;
  stablePatternDays: number;
}

export interface ThresholdAdjustment {
  id: string;
  alertType: string;
  engine: string;
  previousThreshold: number;
  currentThreshold: number;
  unit: string;
  direction: 'lowered' | 'raised';
  confidence: ConfidenceLevel;
  reason: string;
  status: ChangeStatus;
  appliedAt: string;
}

export interface VariableInteraction {
  id: string;
  variables: string[];
  interaction: string;
  effect: string;
  strength: 'weak' | 'moderate' | 'strong';
  confidence: ConfidenceLevel;
  affectedOutcome: string;
  discoveredAt: string;
}

export interface RecommendationShift {
  id: string;
  recommendation: string;
  context: string;
  previousPriority: number;
  currentPriority: number;
  reason: string;
  confidence: ConfidenceLevel;
  appliedAt: string;
}

export interface AdminReviewItem {
  id: string;
  type: 'weight' | 'threshold' | 'recommendation';
  title: string;
  description: string;
  impact: ImpactLevel;
  confidence: ConfidenceLevel;
  proposedChange: string;
  currentValue: string;
  proposedValue: string;
  rationale: string;
  status: ChangeStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  engine: string;
  detail: string;
  confidence: ConfidenceLevel;
  status: ChangeStatus;
  appliedBy: string;
}

// --- Demo data ---

export const adaptiveWeights: AdaptiveWeight[] = [
  {
    id: 'aw-1',
    variable: 'Family boundary consistency',
    engine: 'Outcome Prediction',
    previousWeight: 0.15,
    currentWeight: 0.19,
    changePercent: 26.7,
    direction: 'increased',
    confidence: 'high',
    sampleSufficiency: 'strong',
    reason: 'Stable aggregate association between consistent family boundaries and treatment completion observed across a sufficient de-identified comparison set over 90+ days.',
    status: 'auto_applied',
    appliedAt: '2026-04-08',
    stablePatternDays: 94,
  },
  {
    id: 'aw-2',
    variable: 'Provider response delay',
    engine: 'Outcome Prediction',
    previousWeight: 0.10,
    currentWeight: 0.14,
    changePercent: 40,
    direction: 'increased',
    confidence: 'high',
    sampleSufficiency: 'strong',
    reason: 'Provider communication delays showed a consistently stronger relationship with early discharge risk than previously weighted. Pattern stable for 78 days.',
    status: 'approved',
    appliedAt: '2026-04-05',
    stablePatternDays: 78,
  },
  {
    id: 'aw-3',
    variable: 'Readiness trend momentum',
    engine: 'Intervention Readiness',
    previousWeight: 0.20,
    currentWeight: 0.22,
    changePercent: 10,
    direction: 'increased',
    confidence: 'moderate',
    sampleSufficiency: 'moderate',
    reason: 'Aggregated learning suggests readiness momentum direction is a slightly stronger predictor of acceptance timing than the static score alone.',
    status: 'auto_applied',
    appliedAt: '2026-04-03',
    stablePatternDays: 52,
  },
  {
    id: 'aw-4',
    variable: 'Financial rescue frequency',
    engine: 'Accountability',
    previousWeight: 0.12,
    currentWeight: 0.16,
    changePercent: 33.3,
    direction: 'increased',
    confidence: 'high',
    sampleSufficiency: 'strong',
    reason: 'Financial enabling behaviors showed a stronger-than-expected association with readiness collapse. Pattern observed consistently across de-identified aggregate data.',
    status: 'auto_applied',
    appliedAt: '2026-04-01',
    stablePatternDays: 110,
  },
  {
    id: 'aw-5',
    variable: 'Distress elevation magnitude',
    engine: 'Intervention Readiness',
    previousWeight: 0.18,
    currentWeight: 0.16,
    changePercent: -11.1,
    direction: 'decreased',
    confidence: 'moderate',
    sampleSufficiency: 'moderate',
    reason: 'Raw distress level showed a slightly weaker independent association with treatment acceptance when controlled for consequence awareness. Weight adjusted modestly.',
    status: 'auto_applied',
    appliedAt: '2026-03-28',
    stablePatternDays: 45,
  },
  {
    id: 'aw-6',
    variable: 'Continuity follow-through rate',
    engine: 'Outcome Prediction',
    previousWeight: 0.12,
    currentWeight: 0.15,
    changePercent: 25,
    direction: 'increased',
    confidence: 'moderate',
    sampleSufficiency: 'moderate',
    reason: 'Post-treatment continuity actions within 48 hours showed emerging but strengthening association with 30-day retention.',
    status: 'pending_review',
    appliedAt: '',
    stablePatternDays: 38,
  },
];

export const thresholdAdjustments: ThresholdAdjustment[] = [
  {
    id: 'ta-1',
    alertType: 'Provider communication gap warning',
    engine: 'Accountability',
    previousThreshold: 48,
    currentThreshold: 36,
    unit: 'hours',
    direction: 'lowered',
    confidence: 'high',
    reason: 'Repeated early discharge patterns were detected when provider gaps exceeded 36 hours during the first 14 days of treatment, before the prior 48-hour threshold triggered.',
    status: 'approved',
    appliedAt: '2026-04-06',
  },
  {
    id: 'ta-2',
    alertType: 'Early discharge risk alert',
    engine: 'Outcome Prediction',
    previousThreshold: 45,
    currentThreshold: 40,
    unit: '% risk',
    direction: 'lowered',
    confidence: 'moderate',
    reason: 'Aggregated learning identified discharge events occurring at risk levels below the previous threshold. Earlier alerting may improve continuity intervention timing.',
    status: 'auto_applied',
    appliedAt: '2026-04-02',
  },
  {
    id: 'ta-3',
    alertType: 'Family accountability warning',
    engine: 'Accountability',
    previousThreshold: 55,
    currentThreshold: 60,
    unit: 'score',
    direction: 'raised',
    confidence: 'moderate',
    reason: 'Prior threshold generated excessive low-severity alerts. Slight upward adjustment reduces noise while maintaining meaningful detection of genuine accountability decline.',
    status: 'auto_applied',
    appliedAt: '2026-03-30',
  },
  {
    id: 'ta-4',
    alertType: 'Relapse risk 30-day warning',
    engine: 'Outcome Prediction',
    previousThreshold: 40,
    currentThreshold: 35,
    unit: '% risk',
    direction: 'lowered',
    confidence: 'moderate',
    reason: 'Aggregated case learning found relapse indicators appearing at lower risk thresholds than previously expected. Earlier detection recommended.',
    status: 'pending_review',
    appliedAt: '',
  },
];

export const variableInteractions: VariableInteraction[] = [
  {
    id: 'vi-1',
    variables: ['Family inconsistency', 'Provider delay'],
    interaction: 'Combined family boundary inconsistency and provider communication delay were associated with greater system failure risk than either variable alone.',
    effect: 'Multiplicative risk increase for system failure outcomes.',
    strength: 'strong',
    confidence: 'high',
    affectedOutcome: 'System failure / early discharge',
    discoveredAt: '2026-03-25',
  },
  {
    id: 'vi-2',
    variables: ['Rising distress', 'Reduced resistance'],
    interaction: 'When distress rose while resistance simultaneously declined, intervention acceptance probability increased substantially compared to either change in isolation.',
    effect: 'Synergistic readiness window indicator.',
    strength: 'strong',
    confidence: 'high',
    affectedOutcome: 'Treatment acceptance',
    discoveredAt: '2026-03-20',
  },
  {
    id: 'vi-3',
    variables: ['Poor continuity follow-through', 'Unstable family communication'],
    interaction: 'Post-discharge continuity failures combined with inconsistent family communication patterns showed a stronger association with 30-day relapse than either variable independently.',
    effect: 'Amplified relapse risk during transition period.',
    strength: 'moderate',
    confidence: 'moderate',
    affectedOutcome: '30-day relapse risk',
    discoveredAt: '2026-04-01',
  },
  {
    id: 'vi-4',
    variables: ['Disengagement trend', 'Negative family contact pattern'],
    interaction: 'Progressive disengagement from support structures combined with increased negative family contact was associated with steeper readiness decline.',
    effect: 'Accelerated readiness erosion.',
    strength: 'moderate',
    confidence: 'moderate',
    affectedOutcome: 'Readiness trajectory',
    discoveredAt: '2026-04-05',
  },
  {
    id: 'vi-5',
    variables: ['Financial enabling', 'Consequence reversal'],
    interaction: 'Families who both provided financial rescue and reversed stated consequences showed the steepest readiness declines, more than either behavior alone.',
    effect: 'Compounded enabling impact on recovery readiness.',
    strength: 'strong',
    confidence: 'high',
    affectedOutcome: 'Readiness collapse / treatment refusal',
    discoveredAt: '2026-03-15',
  },
];

export const recommendationShifts: RecommendationShift[] = [
  {
    id: 'rs-1',
    recommendation: 'Emphasize family boundary consistency',
    context: 'Pre-intervention and post-refusal phases',
    previousPriority: 3,
    currentPriority: 1,
    reason: 'Aggregated learning showed family accountability has the strongest single-variable association with treatment acceptance and 30-day retention.',
    confidence: 'high',
    appliedAt: '2026-04-08',
  },
  {
    id: 'rs-2',
    recommendation: 'Escalate provider communication gap warning',
    context: 'Early treatment and stabilization phases',
    previousPriority: 4,
    currentPriority: 2,
    reason: 'Provider response delays now weighted more heavily in discharge risk. Earlier escalation associated with improved continuity outcomes.',
    confidence: 'high',
    appliedAt: '2026-04-05',
  },
  {
    id: 'rs-3',
    recommendation: 'Initiate aftercare planning within 48 hours',
    context: 'Post-acceptance / admission phase',
    previousPriority: 5,
    currentPriority: 3,
    reason: 'Rapid continuity initiation showed emerging but strengthening association with treatment retention. Priority elevated.',
    confidence: 'moderate',
    appliedAt: '2026-04-01',
  },
  {
    id: 'rs-4',
    recommendation: 'Address financial enabling before intervention',
    context: 'Refusal and pre-intervention phases',
    previousPriority: 6,
    currentPriority: 4,
    reason: 'Financial rescue behavior showed stronger-than-expected association with readiness collapse. Earlier attention recommended.',
    confidence: 'high',
    appliedAt: '2026-03-28',
  },
  {
    id: 'rs-5',
    recommendation: 'Prioritize emotional processing guidance',
    context: 'Post-refusal phase',
    previousPriority: 2,
    currentPriority: 5,
    reason: 'Boundary consistency showed a stronger outcome association than emotional processing in post-refusal scenarios. Processing guidance remains important but reprioritized.',
    confidence: 'moderate',
    appliedAt: '2026-03-25',
  },
];

export const adminReviewQueue: AdminReviewItem[] = [
  {
    id: 'ar-1',
    type: 'weight',
    title: 'Increase continuity follow-through weight',
    description: 'Proposed increase to continuity follow-through variable in Outcome Prediction Engine.',
    impact: 'medium',
    confidence: 'moderate',
    proposedChange: 'Weight increase from 0.12 to 0.15',
    currentValue: '0.12',
    proposedValue: '0.15',
    rationale: 'Post-treatment continuity actions within 48 hours showed emerging association with 30-day retention across aggregated data. Pattern stable for 38 days but below the 60-day auto-apply threshold.',
    status: 'pending_review',
    submittedAt: '2026-04-09',
  },
  {
    id: 'ar-2',
    type: 'threshold',
    title: 'Lower 30-day relapse risk warning threshold',
    description: 'Proposed reduction in relapse risk alert trigger from 40% to 35%.',
    impact: 'high',
    confidence: 'moderate',
    proposedChange: 'Threshold reduction from 40% to 35%',
    currentValue: '40%',
    proposedValue: '35%',
    rationale: 'Aggregated patterns suggest relapse indicators appear at lower risk levels than the current threshold captures. Lowering may improve early detection but will increase alert volume by an estimated 15%.',
    status: 'pending_review',
    submittedAt: '2026-04-10',
  },
  {
    id: 'ar-3',
    type: 'weight',
    title: 'Decrease distress magnitude weight in readiness',
    description: 'Proposed modest reduction to raw distress weighting in Intervention Readiness Engine.',
    impact: 'low',
    confidence: 'moderate',
    proposedChange: 'Weight decrease from 0.18 to 0.15',
    currentValue: '0.18',
    proposedValue: '0.15',
    rationale: 'Distress magnitude shows a weaker independent relationship with acceptance when consequence awareness is controlled for. Reduction modest and within bounded limits.',
    status: 'pending_review',
    submittedAt: '2026-04-07',
  },
];

export const auditLog: AuditLogEntry[] = [
  {
    id: 'al-1',
    timestamp: '2026-04-10 14:32',
    action: 'Threshold adjustment proposed',
    engine: 'Outcome Prediction',
    detail: '30-day relapse risk warning threshold: proposed reduction from 40% to 35%. Submitted for admin review.',
    confidence: 'moderate',
    status: 'pending_review',
    appliedBy: 'System (automated)',
  },
  {
    id: 'al-2',
    timestamp: '2026-04-09 09:15',
    action: 'Weight adjustment proposed',
    engine: 'Outcome Prediction',
    detail: 'Continuity follow-through rate weight: proposed increase from 0.12 to 0.15. Submitted for admin review due to pattern stability below 60-day auto-apply threshold.',
    confidence: 'moderate',
    status: 'pending_review',
    appliedBy: 'System (automated)',
  },
  {
    id: 'al-3',
    timestamp: '2026-04-08 11:20',
    action: 'Weight auto-applied',
    engine: 'Outcome Prediction',
    detail: 'Family boundary consistency weight increased from 0.15 to 0.19. High confidence, strong sample, 94-day stable pattern exceeds auto-apply threshold.',
    confidence: 'high',
    status: 'auto_applied',
    appliedBy: 'System (automated)',
  },
  {
    id: 'al-4',
    timestamp: '2026-04-06 16:45',
    action: 'Threshold approved',
    engine: 'Accountability',
    detail: 'Provider communication gap warning threshold lowered from 48h to 36h. Approved by platform admin after review.',
    confidence: 'high',
    status: 'approved',
    appliedBy: 'Admin (reviewed)',
  },
  {
    id: 'al-5',
    timestamp: '2026-04-05 10:30',
    action: 'Weight approved',
    engine: 'Outcome Prediction',
    detail: 'Provider response delay weight increased from 0.10 to 0.14. Approved after admin review. Pattern stable for 78 days.',
    confidence: 'high',
    status: 'approved',
    appliedBy: 'Admin (reviewed)',
  },
  {
    id: 'al-6',
    timestamp: '2026-04-03 08:00',
    action: 'Weight auto-applied',
    engine: 'Intervention Readiness',
    detail: 'Readiness trend momentum weight increased from 0.20 to 0.22. Low-impact change with moderate confidence; auto-applied per bounded rules.',
    confidence: 'moderate',
    status: 'auto_applied',
    appliedBy: 'System (automated)',
  },
  {
    id: 'al-7',
    timestamp: '2026-04-02 13:15',
    action: 'Threshold auto-applied',
    engine: 'Outcome Prediction',
    detail: 'Early discharge risk alert threshold lowered from 45% to 40%. Pattern detected with moderate confidence and sufficient sample.',
    confidence: 'moderate',
    status: 'auto_applied',
    appliedBy: 'System (automated)',
  },
  {
    id: 'al-8',
    timestamp: '2026-04-01 09:45',
    action: 'Weight auto-applied',
    engine: 'Accountability',
    detail: 'Financial rescue frequency weight increased from 0.12 to 0.16. High confidence, 110-day stable pattern.',
    confidence: 'high',
    status: 'auto_applied',
    appliedBy: 'System (automated)',
  },
  {
    id: 'al-9',
    timestamp: '2026-03-30 15:20',
    action: 'Threshold auto-applied',
    engine: 'Accountability',
    detail: 'Family accountability warning threshold raised from 55 to 60 to reduce noise. Moderate confidence; bounded adjustment.',
    confidence: 'moderate',
    status: 'auto_applied',
    appliedBy: 'System (automated)',
  },
  {
    id: 'al-10',
    timestamp: '2026-03-25 11:00',
    action: 'Interaction pattern discovered',
    engine: 'Cross-engine',
    detail: 'Variable interaction identified: family inconsistency + provider delay produces multiplicative system failure risk. High confidence, strong sample.',
    confidence: 'high',
    status: 'auto_applied',
    appliedBy: 'System (automated)',
  },
];

export const stage2Stats = {
  totalAdaptations: 18,
  autoApplied: 11,
  adminApproved: 4,
  pendingReview: 3,
  interactionsDiscovered: 5,
  averageConfidence: 'Moderate–High',
  privacyStatus: 'Active — all adaptations based on aggregated, de-identified learning',
};
