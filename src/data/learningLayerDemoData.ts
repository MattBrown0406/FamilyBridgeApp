export interface LearningInsight {
  id: string;
  domain: LearningDomain;
  pattern: string;
  detail: string;
  direction: 'positive' | 'negative';
  confidence: 'low' | 'moderate' | 'high';
  sampleStrength: 'limited' | 'moderate' | 'strong';
  variables: string[];
  updatedAt: string;
}

export interface SimilarSituationInsight {
  id: string;
  context: string;
  insight: string;
  confidence: 'low' | 'moderate' | 'high';
  applicability: string;
}

export interface RecommendationEvolution {
  id: string;
  area: string;
  change: string;
  reason: string;
  effectiveDate: string;
}

export interface DomainSummary {
  domain: LearningDomain;
  label: string;
  description: string;
  totalPatterns: number;
  highConfidence: number;
  latestUpdate: string;
  icon: string;
}

export type LearningDomain =
  | 'readiness'
  | 'intervention_strategy'
  | 'family_impact'
  | 'provider_performance'
  | 'continuity';

export const domainSummaries: DomainSummary[] = [
  {
    domain: 'readiness',
    label: 'Readiness Learning',
    description: 'Patterns associated with treatment acceptance and pre-intervention readiness.',
    totalPatterns: 47,
    highConfidence: 18,
    latestUpdate: '2 days ago',
    icon: '🎯',
  },
  {
    domain: 'intervention_strategy',
    label: 'Intervention Strategy Learning',
    description: 'Which intervention approaches appear more effective under various conditions.',
    totalPatterns: 34,
    highConfidence: 12,
    latestUpdate: '1 day ago',
    icon: '⚡',
  },
  {
    domain: 'family_impact',
    label: 'Family Impact Learning',
    description: 'How family behaviors improve or reduce recovery outcomes.',
    totalPatterns: 52,
    highConfidence: 22,
    latestUpdate: '3 hours ago',
    icon: '👨‍👩‍👧‍👦',
  },
  {
    domain: 'provider_performance',
    label: 'Provider Performance Learning',
    description: 'Provider behaviors correlated with stronger continuity and lower risk.',
    totalPatterns: 29,
    highConfidence: 14,
    latestUpdate: '1 day ago',
    icon: '🏥',
  },
  {
    domain: 'continuity',
    label: 'Continuity Learning',
    description: 'Post-intervention actions that improve longer-term stability.',
    totalPatterns: 38,
    highConfidence: 16,
    latestUpdate: '4 hours ago',
    icon: '🔗',
  },
];

export const positiveInsights: LearningInsight[] = [
  {
    id: 'pos-1',
    domain: 'family_impact',
    pattern: 'Consistent family boundaries were associated with higher treatment acceptance rates.',
    detail: 'Across de-identified patterns, families that maintained stated consequences without reversal for 5–7 consecutive days before intervention showed meaningfully stronger acceptance outcomes.',
    direction: 'positive',
    confidence: 'high',
    sampleStrength: 'strong',
    variables: ['boundary consistency', 'consequence follow-through', 'pre-intervention stability'],
    updatedAt: '2026-04-09',
  },
  {
    id: 'pos-2',
    domain: 'provider_performance',
    pattern: 'Timely provider communication was correlated with reduced early discharge risk.',
    detail: 'Aggregated case learning suggests that when providers responded to family or clinical updates within 4 hours, early discharge rates were noticeably lower compared to delayed response patterns.',
    direction: 'positive',
    confidence: 'high',
    sampleStrength: 'strong',
    variables: ['response time', 'update frequency', 'communication consistency'],
    updatedAt: '2026-04-08',
  },
  {
    id: 'pos-3',
    domain: 'intervention_strategy',
    pattern: 'Treatment placement confirmed before intervention day was associated with higher completion rates.',
    detail: 'The platform has observed that cases where a treatment bed was secured prior to the intervention conversation showed stronger follow-through to admission and completion.',
    direction: 'positive',
    confidence: 'high',
    sampleStrength: 'strong',
    variables: ['pre-placement confirmation', 'logistics readiness', 'transport planning'],
    updatedAt: '2026-04-07',
  },
  {
    id: 'pos-4',
    domain: 'continuity',
    pattern: 'Post-acceptance continuity follow-through within 48 hours was linked to better treatment retention.',
    detail: 'Across a sufficiently large set of similar situations, cases where continuity steps (family check-ins, provider coordination, aftercare planning) began within 48 hours of treatment acceptance showed improved 30-day retention.',
    direction: 'positive',
    confidence: 'moderate',
    sampleStrength: 'moderate',
    variables: ['continuity timing', 'aftercare initiation', 'family engagement post-admission'],
    updatedAt: '2026-04-10',
  },
  {
    id: 'pos-5',
    domain: 'readiness',
    pattern: 'Interventions timed during rising consequence awareness showed better acceptance outcomes.',
    detail: 'The platform has observed that initiating intervention conversations when the individual was actively experiencing natural consequences — rather than during emotional calm or acute crisis — tended to produce stronger acceptance.',
    direction: 'positive',
    confidence: 'moderate',
    sampleStrength: 'moderate',
    variables: ['consequence awareness', 'intervention timing', 'resistance trajectory'],
    updatedAt: '2026-04-06',
  },
  {
    id: 'pos-6',
    domain: 'family_impact',
    pattern: 'Family members who participated in coaching sessions showed improved boundary maintenance.',
    detail: 'Aggregated case learning suggests families who engaged in at least 3 conversation coaching sessions before an intervention were more likely to hold boundaries consistently during and after the process.',
    direction: 'positive',
    confidence: 'moderate',
    sampleStrength: 'moderate',
    variables: ['coaching participation', 'boundary clarity', 'family preparedness'],
    updatedAt: '2026-04-05',
  },
];

export const negativeInsights: LearningInsight[] = [
  {
    id: 'neg-1',
    domain: 'family_impact',
    pattern: 'Family financial rescue after treatment refusal was associated with reduced future readiness.',
    detail: 'Across de-identified patterns, when families provided financial support within 72 hours of a treatment refusal, subsequent readiness scores tended to decline rather than stabilize or improve.',
    direction: 'negative',
    confidence: 'high',
    sampleStrength: 'strong',
    variables: ['financial enabling', 'post-refusal behavior', 'readiness trajectory'],
    updatedAt: '2026-04-09',
  },
  {
    id: 'neg-2',
    domain: 'provider_performance',
    pattern: 'Delayed provider response times were associated with increased early discharge risk.',
    detail: 'The platform has observed that when provider update intervals exceeded 48 hours during the first two weeks of treatment, early discharge events occurred at a higher rate.',
    direction: 'negative',
    confidence: 'high',
    sampleStrength: 'strong',
    variables: ['provider response delay', 'update gaps', 'clinical communication'],
    updatedAt: '2026-04-08',
  },
  {
    id: 'neg-3',
    domain: 'family_impact',
    pattern: 'Inconsistent consequence enforcement often preceded readiness collapse.',
    detail: 'Aggregated case learning suggests that when families alternated between enforcing and rescinding stated consequences, readiness scores showed steeper declines compared to either consistent enforcement or consistent non-enforcement.',
    direction: 'negative',
    confidence: 'high',
    sampleStrength: 'strong',
    variables: ['consequence inconsistency', 'boundary reversal', 'readiness erosion'],
    updatedAt: '2026-04-07',
  },
  {
    id: 'neg-4',
    domain: 'continuity',
    pattern: 'Poor post-discharge coordination was linked to higher 30-day relapse indicators.',
    detail: 'Across a sufficiently large set of similar situations, cases where aftercare steps were not initiated within the first week post-discharge showed elevated early relapse indicators.',
    direction: 'negative',
    confidence: 'moderate',
    sampleStrength: 'moderate',
    variables: ['discharge coordination', 'aftercare gaps', 'follow-up delays'],
    updatedAt: '2026-04-10',
  },
  {
    id: 'neg-5',
    domain: 'intervention_strategy',
    pattern: 'Interventions during acute emotional crisis showed lower acceptance rates.',
    detail: 'The platform has observed that intervention conversations initiated during peak emotional distress — rather than during windows of natural consequence awareness — tended to produce lower initial acceptance.',
    direction: 'negative',
    confidence: 'moderate',
    sampleStrength: 'moderate',
    variables: ['crisis timing', 'emotional escalation', 'acceptance probability'],
    updatedAt: '2026-04-06',
  },
];

export const similarSituationInsights: SimilarSituationInsight[] = [
  {
    id: 'sim-1',
    context: 'Moderate readiness with inconsistent family boundaries',
    insight: 'In similar situations, treatment acceptance improved when boundaries were held consistently for 5–7 days before the intervention conversation was initiated.',
    confidence: 'high',
    applicability: 'Readiness & Family Impact',
  },
  {
    id: 'sim-2',
    context: 'Post-refusal family financial behavior',
    insight: 'In similar situations, families that redirected financial support to recovery-aligned resources rather than direct aid saw readiness scores stabilize within 2–3 weeks.',
    confidence: 'moderate',
    applicability: 'Family Impact & Readiness',
  },
  {
    id: 'sim-3',
    context: 'Provider communication gaps during early treatment',
    insight: 'In similar situations, discharge risk was higher when provider updates became inconsistent during the first 14 days of treatment.',
    confidence: 'high',
    applicability: 'Provider Performance & Continuity',
  },
  {
    id: 'sim-4',
    context: 'Rising consequence awareness before intervention',
    insight: 'In similar situations, interventions scheduled 3–5 days after a significant natural consequence event showed the strongest acceptance outcomes.',
    confidence: 'moderate',
    applicability: 'Intervention Strategy',
  },
  {
    id: 'sim-5',
    context: 'Post-treatment aftercare engagement',
    insight: 'In similar situations, cases where the family initiated at least one structured aftercare activity within 48 hours of discharge showed stronger 90-day stability.',
    confidence: 'moderate',
    applicability: 'Continuity Learning',
  },
];

export const recommendationEvolutions: RecommendationEvolution[] = [
  {
    id: 'evo-1',
    area: 'Family Accountability',
    change: 'Family accountability now receives higher emphasis in relapse prevention guidance.',
    reason: 'Repeated association between consistent family boundary behavior and improved outcome stability across aggregated case learning.',
    effectiveDate: '2026-04-01',
  },
  {
    id: 'evo-2',
    area: 'Provider Communication',
    change: 'Provider communication delays are now flagged earlier in continuity planning.',
    reason: 'Aggregated patterns showed that provider response gaps exceeding 24 hours during early treatment correlated with elevated discharge risk.',
    effectiveDate: '2026-03-28',
  },
  {
    id: 'evo-3',
    area: 'Intervention Timing',
    change: 'Intervention timing recommendations now factor in consequence-awareness windows more heavily.',
    reason: 'The platform observed stronger acceptance outcomes when interventions aligned with natural consequence awareness periods rather than emotional peaks.',
    effectiveDate: '2026-03-20',
  },
  {
    id: 'evo-4',
    area: 'Transport & Logistics',
    change: 'Pre-intervention transport planning is now emphasized as a critical readiness factor.',
    reason: 'Cases with confirmed treatment placement and transport arrangements before intervention day showed meaningfully higher completion rates.',
    effectiveDate: '2026-03-15',
  },
  {
    id: 'evo-5',
    area: 'Post-Discharge Continuity',
    change: 'Aftercare initiation within 48 hours is now a priority recommendation after treatment acceptance.',
    reason: 'Aggregated learning indicated that rapid continuity follow-through was associated with improved 30-day retention.',
    effectiveDate: '2026-03-10',
  },
];

export const aggregateStats = {
  totalPatternsIdentified: 200,
  highConfidencePatterns: 82,
  domainsActive: 5,
  lastUpdated: '3 hours ago',
  recommendationsRefined: 14,
  privacyComplianceStatus: 'Active — all outputs aggregated and de-identified',
};
