import type { OutcomePrediction, PredictionAlert } from '@/hooks/useOutcomePredictions';

const now = Date.now();
const day = 86400000;

export const demoPredictions: OutcomePrediction[] = [
  {
    id: 'demo-pred-1',
    family_id: 'demo-family',
    prediction_type: 'treatment_completion',
    probability: 68,
    previous_probability: 62,
    trend: 'improving',
    confidence: 'moderate',
    risk_drivers: [
      'Robert\'s inconsistent boundary enforcement undermines treatment structure',
      'Meeting attendance has dropped below recommended threshold',
      'Tyler has missed 2 of last 5 scheduled therapy sessions',
    ],
    protective_factors: [
      'Linda\'s boundary enforcement improved 15% this week',
      'Financial transparency through app voting remains strong',
      'Sarah\'s consistent daily check-ins provide family stability',
      'Provider communication response time averaging 2.1 hours',
    ],
    ai_insight: 'The sample record shows changes in documented follow-through and family boundary consistency. These observations require human review and do not predict treatment completion.',
    ai_recommendation: {
      actions: [
        'Schedule a family-provider alignment meeting within 48 hours to address boundary gaps',
        'Robert should complete the "Understanding Boundaries" module in the app',
        'Increase Tyler\'s meeting attendance to 4+ per week with GPS check-ins enabled',
        'Linda should continue using the financial voting system — this is working well',
      ],
      avoid: [
        'Do not confront Robert about boundary failures in front of Tyler',
        'Avoid reducing check-in frequency — consistency is critical right now',
        'Do not bypass the financial request system for any reason',
      ],
    },
    data_sources: {
      accountability_engine: 85,
      emotional_checkins: 72,
      meeting_attendance: 60,
      financial_behavior: 90,
      provider_coordination: 78,
      boundary_adherence: 55,
    },
    calculated_at: new Date(now - 900000).toISOString(),
  },
  {
    id: 'demo-pred-2',
    family_id: 'demo-family',
    prediction_type: 'relapse_30',
    probability: 35,
    previous_probability: 42,
    trend: 'improving',
    confidence: 'high',
    risk_drivers: [
      'Tyler has shown emotional withdrawal patterns in check-ins',
      'Proximity to known high-risk locations detected 3 times this week',
      'Sleep pattern irregularity reported by sober living staff',
    ],
    protective_factors: [
      'Active engagement with sponsor (3 contacts this week)',
      'Medication compliance at 95% (MAT adherence verified)',
      'No financial enabling detected through official channels',
    ],
    ai_insight: '30-day relapse risk has improved from 42% to 35%, primarily driven by strong medication compliance and sponsor engagement. However, location drift near high-risk areas is concerning. The combination of emotional withdrawal and sleep disruption has preceded relapse in 67% of similar profiles.',
    ai_recommendation: {
      actions: [
        'Enable location drift alerts for Tyler\'s known risk zones',
        'Encourage Tyler to increase sponsor contact to daily check-ins',
        'Request provider assessment of sleep patterns and potential intervention',
      ],
      avoid: [
        'Do not reduce Tyler\'s meeting schedule during this vulnerable period',
        'Avoid confrontational conversations about the location drift — use coaching tools instead',
      ],
    },
    data_sources: {
      emotional_patterns: 70,
      location_data: 45,
      medication_compliance: 95,
      meeting_attendance: 65,
      sponsor_engagement: 80,
    },
    calculated_at: new Date(now - 900000).toISOString(),
  },
  {
    id: 'demo-pred-3',
    family_id: 'demo-family',
    prediction_type: 'early_discharge',
    probability: 22,
    previous_probability: 28,
    trend: 'improving',
    confidence: 'moderate',
    risk_drivers: [
      'Tyler expressed frustration with treatment structure in last 2 check-ins',
      'Conflict with one peer in group therapy reported by provider',
    ],
    protective_factors: [
      'Strong therapeutic alliance with individual counselor',
      'Family financial support structured through app prevents impulsive exits',
      'Tyler acknowledged treatment value in 3 of last 5 emotional check-ins',
    ],
    ai_insight: 'Early discharge risk is low and improving. Tyler\'s frustration is typical for this phase of treatment (weeks 3-5) and is not currently at intervention-level. The family\'s structured financial approach is a key protective factor — Tyler cannot easily arrange transportation or housing for a premature exit.',
    ai_recommendation: {
      actions: [
        'Provider should address group therapy conflict in next individual session',
        'Family should send supportive (not directive) messages this week',
      ],
      avoid: [
        'Do not mention discharge timeline in family communications',
        'Avoid sending Tyler money outside the app system',
      ],
    },
    data_sources: {
      emotional_patterns: 65,
      provider_notes: 80,
      financial_controls: 92,
      treatment_engagement: 75,
    },
    calculated_at: new Date(now - 900000).toISOString(),
  },
  {
    id: 'demo-pred-4',
    family_id: 'demo-family',
    prediction_type: 'system_failure',
    probability: 28,
    previous_probability: 21,
    trend: 'worsening',
    confidence: 'high',
    risk_drivers: [
      'Family-provider alignment score dropped from 74 to 62 this week',
      'Robert\'s boundary enforcement gap creating mixed signals for Tyler',
      'Linda\'s Venmo transfer bypassed the agreed financial transparency system',
    ],
    protective_factors: [
      'Provider communication remains within acceptable thresholds',
      'Sarah and Kevin maintaining consistent engagement',
    ],
    ai_insight: 'System failure risk is rising due to coordination breakdown between family behavior and provider recommendations. The most critical issue is the divergence between what the treatment team recommends and what the family actually enforces. Linda\'s financial bypass and Robert\'s boundary inconsistency are the top two drivers. A system realignment meeting is urgently recommended.',
    ai_recommendation: {
      actions: [
        'Initiate a family-provider sync meeting within 24 hours',
        'Review and recommit to the Brown Family Recovery Support Agreement',
        'Linda should acknowledge the financial bypass and recommit to the system',
        'Robert should meet individually with the family counselor to discuss enforcement barriers',
      ],
      avoid: [
        'Do not blame individual family members — frame as system alignment',
        'Do not postpone the sync meeting — delay compounds the risk',
      ],
    },
    data_sources: {
      accountability_engine: 68,
      provider_coordination: 62,
      boundary_adherence: 48,
      financial_behavior: 70,
      emotional_patterns: 58,
    },
    calculated_at: new Date(now - 900000).toISOString(),
  },
  {
    id: 'demo-pred-5',
    family_id: 'demo-family',
    prediction_type: 'relapse_90',
    probability: 48,
    previous_probability: 52,
    trend: 'improving',
    confidence: 'moderate',
    risk_drivers: [
      'Historical pattern: Tyler has relapsed within 90 days in 2 previous treatment attempts',
      'Aftercare plan only 40% complete',
      'No stable employment or structured daily activity post-treatment',
    ],
    protective_factors: [
      'MAT compliance significantly better than previous attempts',
      'Family engagement level 3x higher than prior episodes',
      'Sober living placement already secured for post-treatment',
    ],
    ai_insight: '90-day relapse risk is elevated but improving compared to Tyler\'s historical baseline. The key differentiator this time is dramatically higher family engagement and MAT compliance. The biggest risk factor is the incomplete aftercare plan — completing this before discharge is critical.',
    ai_recommendation: {
      actions: [
        'Fast-track aftercare plan completion — target 80%+ before discharge',
        'Begin structured daily activity planning (volunteer work, part-time employment)',
        'Ensure sober living placement includes regular drug testing',
      ],
      avoid: [
        'Do not allow discharge without a completed aftercare plan',
        'Avoid comparing this attempt to previous failures in family communications',
      ],
    },
    data_sources: {
      historical_patterns: 40,
      aftercare_completion: 45,
      medication_compliance: 92,
      family_engagement: 85,
      employment_stability: 20,
    },
    calculated_at: new Date(now - 900000).toISOString(),
  },
];

export const demoPredictionAlerts: PredictionAlert[] = [
  {
    id: 'demo-pa-1',
    family_id: 'demo-family',
    prediction_type: 'system_failure',
    alert_type: 'threshold_crossed',
    severity: 'high',
    title: 'System Failure Risk Rising — Alignment Meeting Recommended',
    message: 'System failure risk has increased from 21% to 28% in the past week due to family-provider coordination breakdown. A realignment meeting should be scheduled within 24 hours to address boundary enforcement gaps and financial transparency concerns.',
    is_dismissed: false,
    created_at: new Date(now - 2 * 3600000).toISOString(),
  },
  {
    id: 'demo-pa-2',
    family_id: 'demo-family',
    prediction_type: 'relapse_30',
    alert_type: 'pattern_detected',
    severity: 'medium',
    title: 'Location Drift Near High-Risk Areas',
    message: 'Tyler has been detected near known high-risk locations 3 times this week. Combined with emotional withdrawal patterns, this matches a pre-relapse behavioral profile. Recommend enabling location drift alerts and increasing sponsor contact.',
    is_dismissed: false,
    created_at: new Date(now - 6 * 3600000).toISOString(),
  },
  {
    id: 'demo-pa-3',
    family_id: 'demo-family',
    prediction_type: 'treatment_completion',
    alert_type: 'positive_shift',
    severity: 'low',
    title: 'Documented Follow-Through Changed',
    message: 'The sample record contains more completed commitments and clearer financial documentation over the past two weeks. Review the underlying entries with the family rather than inferring an individual outcome.',
    is_dismissed: false,
    created_at: new Date(now - day).toISOString(),
  },
];

// Demo historical data for trajectory chart
export const demoHistoricalData: Record<string, { probability: number; calculated_at: string }[]> = {
  treatment_completion: Array.from({ length: 14 }, (_, i) => ({
    probability: 50 + Math.round(i * 1.3 + Math.sin(i * 0.7) * 4),
    calculated_at: new Date(now - (13 - i) * day).toISOString(),
  })),
  early_discharge: Array.from({ length: 14 }, (_, i) => ({
    probability: 38 - Math.round(i * 1.1 + Math.cos(i * 0.5) * 3),
    calculated_at: new Date(now - (13 - i) * day).toISOString(),
  })),
  relapse_30: Array.from({ length: 14 }, (_, i) => ({
    probability: 52 - Math.round(i * 1.2 + Math.sin(i * 0.8) * 5),
    calculated_at: new Date(now - (13 - i) * day).toISOString(),
  })),
  system_failure: Array.from({ length: 14 }, (_, i) => ({
    probability: 15 + Math.round(i * 0.9 + Math.cos(i * 0.6) * 3),
    calculated_at: new Date(now - (13 - i) * day).toISOString(),
  })),
};
