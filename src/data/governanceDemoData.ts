// AI Governance System – Demo Data

export type StabilityLevel = 'volatile' | 'emerging' | 'stable' | 'strong';
export type AdaptationTier = 'tactical' | 'predictive' | 'structural';
export type GovernanceStatus = 'auto_applied' | 'approved' | 'pending' | 'suppressed' | 'rolled_back';
export type DataTier = 'tier1' | 'tier2' | 'tier3';
export type SystemHealth = 'stable' | 'adjusting' | 'volatile';
export type LearningStatus = 'active' | 'limited' | 'suppressed';

export interface GovernanceAdaptation {
  id: string;
  title: string;
  description: string;
  affectedEngine: string;
  tier: AdaptationTier;
  stability: StabilityLevel;
  confidence: 'low' | 'moderate' | 'high';
  magnitude: string;
  magnitudePercent: number;
  sampleRange: string;
  sampleCount: number;
  status: GovernanceStatus;
  timestamp: string;
  rationale: string;
  canRollback: boolean;
}

export interface SuppressedAdaptation {
  id: string;
  title: string;
  reason: string;
  affectedEngine: string;
  sampleCount: number;
  requiredSamples: number;
  stability: StabilityLevel;
}

export interface GovernanceAuditEntry {
  id: string;
  action: string;
  detail: string;
  actor: string;
  timestamp: string;
  engine: string;
  tier: AdaptationTier;
}

export interface VariableInteractionGov {
  id: string;
  variables: string[];
  effect: string;
  stability: StabilityLevel;
  sampleCount: number;
  adaptationAllowed: boolean;
  reason: string;
}

export const systemOverview = {
  learningStatus: 'active' as LearningStatus,
  systemHealth: 'stable' as SystemHealth,
  totalAdaptations: 47,
  pendingReview: 3,
  suppressedCount: 8,
  rolledBack: 2,
  lastAdaptation: '2 hours ago',
  baselineShiftTotal: 11.4,
  maxAllowedShift: 20,
  adaptationSensitivity: 65,
};

export const dataTiers = [
  {
    tier: 'tier1' as DataTier,
    label: 'Raw Identifiable Data',
    description: 'Names, DOB, addresses, provider identities, facility names, narrative notes',
    usage: 'NEVER used for learning',
    color: 'destructive' as const,
  },
  {
    tier: 'tier2' as DataTier,
    label: 'Structured Signals',
    description: 'Readiness scores, accountability metrics, engagement trends, timing data',
    usage: 'Allowed for internal learning',
    color: 'secondary' as const,
  },
  {
    tier: 'tier3' as DataTier,
    label: 'Aggregated Patterns',
    description: 'De-identified trends, cross-case correlations, generalized outcome associations',
    usage: 'Allowed for user-facing insights',
    color: 'default' as const,
  },
];

export const recentAdaptations: GovernanceAdaptation[] = [
  {
    id: 'ga-1',
    title: 'Family boundary consistency weight increased',
    description: 'Weight of family boundary consistency in 30-day relapse prediction increased from 0.18 to 0.21.',
    affectedEngine: 'Outcome Prediction',
    tier: 'predictive',
    stability: 'strong',
    confidence: 'high',
    magnitude: '+3%',
    magnitudePercent: 3,
    sampleRange: '300+',
    sampleCount: 412,
    status: 'auto_applied',
    timestamp: '2 hours ago',
    rationale: 'Across 412 de-identified cases, family boundary consistency showed a persistent, strong correlation with reduced 30-day relapse risk. Pattern confirmed over 6 observation periods.',
    canRollback: true,
  },
  {
    id: 'ga-2',
    title: 'Provider delay alert threshold lowered',
    description: 'Early discharge risk alert now triggers at 72-hour provider communication gap (previously 96 hours).',
    affectedEngine: 'Continuity Engine',
    tier: 'predictive',
    stability: 'stable',
    confidence: 'moderate',
    magnitude: '-25% threshold',
    magnitudePercent: 4,
    sampleRange: '100–300',
    sampleCount: 187,
    status: 'approved',
    timestamp: '1 day ago',
    rationale: 'Aggregated learning across 187 cases showed that early discharge events were frequently preceded by provider communication gaps exceeding 72 hours. Lowering the threshold enables earlier detection.',
    canRollback: true,
  },
  {
    id: 'ga-3',
    title: 'Recommendation priority: escalation guidance moved up',
    description: 'In high discharge-risk scenarios, provider escalation recommendations now appear before general continuity advice.',
    affectedEngine: 'Recommendation System',
    tier: 'tactical',
    stability: 'stable',
    confidence: 'high',
    magnitude: 'Priority shift',
    magnitudePercent: 0,
    sampleRange: '300+',
    sampleCount: 345,
    status: 'auto_applied',
    timestamp: '3 days ago',
    rationale: 'De-identified patterns suggest that earlier escalation emphasis in high-risk continuity situations is associated with improved provider responsiveness.',
    canRollback: true,
  },
  {
    id: 'ga-4',
    title: 'Core readiness scoring formula update proposed',
    description: 'Proposed adjustment to the base weighting of help-proximity signals in the Intervention Readiness Engine.',
    affectedEngine: 'Intervention Readiness',
    tier: 'structural',
    stability: 'emerging',
    confidence: 'moderate',
    magnitude: '+2%',
    magnitudePercent: 2,
    sampleRange: '100–300',
    sampleCount: 156,
    status: 'pending',
    timestamp: '5 days ago',
    rationale: 'Early aggregated data suggests help-proximity behaviors may be more predictive of treatment acceptance than currently weighted. Awaiting additional data confirmation and admin review.',
    canRollback: false,
  },
  {
    id: 'ga-5',
    title: 'Disengagement trend weight rolled back',
    description: 'A previous +4% increase to disengagement weighting in relapse prediction was rolled back after accuracy dropped.',
    affectedEngine: 'Outcome Prediction',
    tier: 'predictive',
    stability: 'volatile',
    confidence: 'low',
    magnitude: 'Rolled back',
    magnitudePercent: 0,
    sampleRange: '100–300',
    sampleCount: 134,
    status: 'rolled_back',
    timestamp: '1 week ago',
    rationale: 'After applying the disengagement weight increase, prediction accuracy for 30-day relapse declined by 2.1%. The signal was reclassified as volatile and the change was automatically reverted.',
    canRollback: false,
  },
];

export const pendingChanges: GovernanceAdaptation[] = [
  recentAdaptations[3],
  {
    id: 'ga-6',
    title: 'Accountability Engine: provider communication weight',
    description: 'Proposed increase to provider communication responsiveness weight in system alignment scoring.',
    affectedEngine: 'Accountability Engine',
    tier: 'structural',
    stability: 'stable',
    confidence: 'moderate',
    magnitude: '+5%',
    magnitudePercent: 5,
    sampleRange: '300+',
    sampleCount: 310,
    status: 'pending',
    timestamp: '2 days ago',
    rationale: 'Provider communication delays showed a consistent, repeated association with system alignment degradation across a sufficient aggregate sample.',
    canRollback: false,
  },
  {
    id: 'ga-7',
    title: 'Family accountability emphasis during refusal phase',
    description: 'Proposed increase of family accountability scoring weight specifically during treatment refusal phases.',
    affectedEngine: 'Accountability Engine',
    tier: 'structural',
    stability: 'stable',
    confidence: 'high',
    magnitude: '+4%',
    magnitudePercent: 4,
    sampleRange: '300+',
    sampleCount: 378,
    status: 'pending',
    timestamp: '4 days ago',
    rationale: 'Aggregated learning shows family accountability during refusal phases has a strong, stable association with readiness recovery. Pattern confirmed across multiple observation periods.',
    canRollback: false,
  },
];

export const suppressedAdaptations: SuppressedAdaptation[] = [
  {
    id: 'sa-1',
    title: 'MAT compliance impact on 90-day relapse',
    reason: 'Insufficient sample size (28 cases)',
    affectedEngine: 'Outcome Prediction',
    sampleCount: 28,
    requiredSamples: 100,
    stability: 'emerging',
  },
  {
    id: 'sa-2',
    title: 'Court-mandated treatment acceptance correlation',
    reason: 'Pattern not yet stable — conflicting signals across observation periods',
    affectedEngine: 'Intervention Readiness',
    sampleCount: 67,
    requiredSamples: 100,
    stability: 'volatile',
  },
  {
    id: 'sa-3',
    title: 'Dual-diagnosis impact on continuity follow-through',
    reason: 'Risk of identification — sample too specific for privacy-safe output',
    affectedEngine: 'Continuity Engine',
    sampleCount: 42,
    requiredSamples: 100,
    stability: 'emerging',
  },
  {
    id: 'sa-4',
    title: 'Sibling relapse contagion pattern',
    reason: 'Insufficient sample size (19 cases)',
    affectedEngine: 'Outcome Prediction',
    sampleCount: 19,
    requiredSamples: 100,
    stability: 'volatile',
  },
  {
    id: 'sa-5',
    title: 'Evening check-in timing and engagement quality',
    reason: 'Pattern not yet stable — signal variance too high',
    affectedEngine: 'Accountability Engine',
    sampleCount: 88,
    requiredSamples: 100,
    stability: 'volatile',
  },
];

export const interactionGovernance: VariableInteractionGov[] = [
  {
    id: 'ig-1',
    variables: ['Family Inconsistency', 'Provider Delay'],
    effect: 'Combined effect is 2.3x stronger than either alone for system failure risk',
    stability: 'strong',
    sampleCount: 289,
    adaptationAllowed: true,
    reason: 'Sufficient sample, stable pattern, moderate+ confidence',
  },
  {
    id: 'ig-2',
    variables: ['Rising Distress', 'Reduced Resistance'],
    effect: 'This combination precedes treatment acceptance windows more reliably than distress alone',
    stability: 'stable',
    sampleCount: 214,
    adaptationAllowed: true,
    reason: 'Pattern confirmed across 4 observation periods',
  },
  {
    id: 'ig-3',
    variables: ['Poor Continuity', 'Communication Breakdown'],
    effect: 'Associated with 40% higher early discharge risk vs. either alone',
    stability: 'emerging',
    sampleCount: 78,
    adaptationAllowed: false,
    reason: 'Sample below 100 threshold — suppressed',
  },
  {
    id: 'ig-4',
    variables: ['Disengagement', 'Negative Family Contact'],
    effect: 'May amplify relapse risk during first 30 days post-treatment',
    stability: 'volatile',
    sampleCount: 45,
    adaptationAllowed: false,
    reason: 'Volatile signal — conflicting results across periods',
  },
];

export const auditLog: GovernanceAuditEntry[] = [
  { id: 'al-1', action: 'Adaptation Applied', detail: 'Family boundary consistency weight +3% in relapse prediction', actor: 'System (auto)', timestamp: '2 hours ago', engine: 'Outcome Prediction', tier: 'predictive' },
  { id: 'al-2', action: 'Admin Approved', detail: 'Provider delay alert threshold lowered to 72 hours', actor: 'Admin: M. Torres', timestamp: '1 day ago', engine: 'Continuity Engine', tier: 'predictive' },
  { id: 'al-3', action: 'Adaptation Applied', detail: 'Escalation recommendation priority raised in discharge-risk scenarios', actor: 'System (auto)', timestamp: '3 days ago', engine: 'Recommendation System', tier: 'tactical' },
  { id: 'al-4', action: 'Change Submitted', detail: 'Help-proximity weight adjustment proposed for readiness scoring', actor: 'System (auto)', timestamp: '5 days ago', engine: 'Intervention Readiness', tier: 'structural' },
  { id: 'al-5', action: 'Rollback Executed', detail: 'Disengagement weight reverted after accuracy decline detected', actor: 'System (auto)', timestamp: '1 week ago', engine: 'Outcome Prediction', tier: 'predictive' },
  { id: 'al-6', action: 'Suppression Applied', detail: 'MAT compliance learning suppressed — sample size 28', actor: 'System (auto)', timestamp: '1 week ago', engine: 'Outcome Prediction', tier: 'predictive' },
  { id: 'al-7', action: 'Sensitivity Adjusted', detail: 'Admin lowered adaptation sensitivity from 70% to 65%', actor: 'Admin: M. Torres', timestamp: '2 weeks ago', engine: 'All Engines', tier: 'structural' },
  { id: 'al-8', action: 'Change Submitted', detail: 'Provider communication weight increase proposed for accountability', actor: 'System (auto)', timestamp: '2 days ago', engine: 'Accountability Engine', tier: 'structural' },
];

export const sampleThresholds = [
  { range: '< 30 cases', label: 'Suppressed', description: 'Learning suppressed entirely', allowed: false },
  { range: '30 – 100', label: 'Low Confidence', description: 'No adaptation applied', allowed: false },
  { range: '100 – 300', label: 'Limited', description: 'Small adaptations allowed', allowed: true },
  { range: '300+', label: 'Full', description: 'Full adaptation permitted', allowed: true },
];

export const changeSizeLimits = [
  { stability: 'Emerging' as const, maxChange: '±1–2%', description: 'Early pattern, minimal adjustment' },
  { stability: 'Stable' as const, maxChange: '±3–5%', description: 'Confirmed pattern, moderate adjustment' },
  { stability: 'Strong' as const, maxChange: '±5–8%', description: 'Persistent pattern, larger adjustment' },
];
