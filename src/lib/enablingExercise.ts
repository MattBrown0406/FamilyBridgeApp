export interface EnablingQuestionOption {
  value: string;
  label: string;
  isEnabling: boolean;
  explanation: string;
}

export interface EnablingQuestion {
  id: number;
  question: string;
  context: string;
  options: EnablingQuestionOption[];
}

export type EnablingResultType = 'warning' | 'caution' | 'okay';

export type EnablingTriggerType = 'financial_request' | 'boundary' | 'full_exercise';

export const ENABLING_QUESTIONS: EnablingQuestion[] = [
  {
    id: 1,
    question: 'Is this a true emergency or crisis?',
    context: 'A true emergency involves immediate danger to life, safety, or health. Chaos is often repeated patterns of self-inflicted problems.',
    options: [
      {
        value: 'emergency',
        label: 'Yes - there is immediate danger to life or safety',
        isEnabling: false,
        explanation: "This is a genuine emergency. It's appropriate to help ensure immediate safety.",
      },
      {
        value: 'chaos',
        label: 'No - this is a repeated pattern or self-created problem',
        isEnabling: true,
        explanation: 'This may be chaos rather than crisis. Helping resolve self-inflicted chaos can enable the pattern to continue.',
      },
      {
        value: 'unsure',
        label: "I'm not sure",
        isEnabling: false,
        explanation: 'When unsure, it is okay to pause and assess. Consider: Has this exact situation happened before? Could it have been prevented?',
      },
    ],
  },
  {
    id: 2,
    question: 'Did I create this problem or is it their responsibility?',
    context: "Taking ownership of consequences is essential for recovery. When we solve problems for others, we rob them of growth opportunities.",
    options: [
      {
        value: 'theirs',
        label: 'This is entirely their problem from their choices',
        isEnabling: true,
        explanation: 'If this is their problem from their choices, allowing them to solve it supports their growth and accountability.',
      },
      {
        value: 'shared',
        label: 'We both contributed to this situation',
        isEnabling: false,
        explanation: 'Shared problems may need collaborative solutions. Focus on your part while letting them handle theirs.',
      },
      {
        value: 'mine',
        label: 'I contributed significantly to this situation',
        isEnabling: false,
        explanation: "If you contributed, it's appropriate to help resolve what you created.",
      },
    ],
  },
  {
    id: 3,
    question: 'Am I helping because of fear, guilt, or genuine love?',
    context: 'Fear and guilt often drive enabling behavior. Genuine love sometimes means allowing consequences.',
    options: [
      {
        value: 'fear',
        label: "I'm afraid of what will happen if I don't help",
        isEnabling: true,
        explanation: "Acting from fear often enables. Fear of their reaction, of them being uncomfortable, or of being the 'bad guy' can trap you in enabling patterns.",
      },
      {
        value: 'guilt',
        label: 'I feel guilty or obligated to fix this',
        isEnabling: true,
        explanation: "Guilt-driven help often enables. You are not responsible for another adult's choices or their consequences.",
      },
      {
        value: 'love',
        label: 'I genuinely believe this help supports their recovery',
        isEnabling: false,
        explanation: 'Help that supports recovery is valuable. Consider: Does this move them toward independence or dependence?',
      },
    ],
  },
  {
    id: 4,
    question: 'Have I done this before? What was the result?',
    context: "Repeating the same help with the same results is a sign of enabling. If helping hasn't helped, it may be hurting.",
    options: [
      {
        value: 'repeated',
        label: 'Yes, and the same problems keep happening',
        isEnabling: true,
        explanation: "Doing the same thing and expecting different results isn't working. Breaking this pattern, while painful, may be necessary for change.",
      },
      {
        value: 'improved',
        label: 'Yes, and things improved afterwards',
        isEnabling: false,
        explanation: 'If past help led to genuine improvement, similar help may be appropriate. Look for sustained positive change.',
      },
      {
        value: 'first_time',
        label: 'No, this is the first time',
        isEnabling: false,
        explanation: 'First-time situations deserve assessment. Consider setting clear expectations about future occurrences.',
      },
    ],
  },
  {
    id: 5,
    question: 'Am I preventing them from experiencing natural consequences?',
    context: 'Natural consequences are powerful teachers. Shielding someone from consequences prevents learning and growth.',
    options: [
      {
        value: 'preventing',
        label: 'Yes, I would be saving them from consequences',
        isEnabling: true,
        explanation: 'Preventing consequences enables continued behavior. As painful as it is, experiencing consequences often motivates change.',
      },
      {
        value: 'softening',
        label: "I'm softening the blow but not eliminating consequences",
        isEnabling: false,
        explanation: "There's a balance between support and rescue. Ensure they still feel the weight of their choices.",
      },
      {
        value: 'no',
        label: 'No, they will still face the consequences regardless',
        isEnabling: false,
        explanation: 'If consequences remain intact, your help may be appropriate support rather than enabling.',
      },
    ],
  },
  {
    id: 6,
    question: 'Is this help being requested or am I volunteering?',
    context: "Unsolicited help can undermine autonomy and create dependence. Being asked shows they're taking initiative.",
    options: [
      {
        value: 'volunteering',
        label: "I'm jumping in without being asked",
        isEnabling: true,
        explanation: "Unsolicited rescuing sends the message that you don't believe they can handle their own life. Step back and wait to be asked.",
      },
      {
        value: 'hinted',
        label: "They're hinting but haven't directly asked",
        isEnabling: true,
        explanation: 'Responding to hints can enable passive communication. Encourage direct requests and honest conversation.',
      },
      {
        value: 'asked',
        label: 'They directly asked for specific help',
        isEnabling: false,
        explanation: 'Direct requests show initiative. You can still evaluate whether the help is appropriate.',
      },
    ],
  },
  {
    id: 7,
    question: 'Will this help move them toward independence or dependence?',
    context: 'The goal of healthy help is to become unnecessary. Each act of support should build capability, not reliance.',
    options: [
      {
        value: 'dependence',
        label: 'They will likely need this help again',
        isEnabling: true,
        explanation: 'Help that needs repeating creates dependence. Consider helping them build skills instead of providing solutions.',
      },
      {
        value: 'independence',
        label: 'This will help them help themselves in the future',
        isEnabling: false,
        explanation: 'Teaching skills and building capability is healthy support. The goal is their growing independence.',
      },
      {
        value: 'neutral',
        label: "It's a one-time situation that won't affect their capability",
        isEnabling: false,
        explanation: 'Some situations are genuinely isolated. Trust your assessment but remain aware of patterns.',
      },
    ],
  },
  {
    id: 8,
    question: 'Am I sacrificing my own wellbeing to provide this help?',
    context: 'You cannot pour from an empty cup. Sacrificing your health, finances, or relationships to help often signals enabling.',
    options: [
      {
        value: 'sacrificing',
        label: 'Yes, this will harm my finances, health, or relationships',
        isEnabling: true,
        explanation: 'Self-sacrifice to rescue others is unsustainable and often enables. You deserve to protect your own wellbeing.',
      },
      {
        value: 'stretching',
        label: "It's a stretch but manageable",
        isEnabling: false,
        explanation: "Be honest about what 'manageable' means. Small stretches can add up to burnout over time.",
      },
      {
        value: 'comfortable',
        label: 'No, I can comfortably provide this help',
        isEnabling: false,
        explanation: 'Help given from a place of abundance is healthier for everyone involved.',
      },
    ],
  },
];

/** 3-question subset used at the moment of a financial rescue (rent / gas / cash). */
export const FINANCIAL_IN_FLOW_QUESTION_IDS = [1, 4, 5] as const;

/** 3-question subset used when a boundary is written with no consequence. */
export const BOUNDARY_IN_FLOW_QUESTION_IDS = [3, 5, 8] as const;

export const RESCUE_FINANCIAL_REASONS = ['Rent', 'Gas', 'Food', 'Other'] as const;

export function isRescueFinancialReason(reason: string): boolean {
  const normalized = reason.trim().toLowerCase();
  if (normalized.startsWith('other')) return true;
  return (RESCUE_FINANCIAL_REASONS as readonly string[]).some(
    (item) => item.toLowerCase() === normalized,
  );
}

export function questionsByIds(ids: readonly number[]): EnablingQuestion[] {
  return ids
    .map((id) => ENABLING_QUESTIONS.find((question) => question.id === id))
    .filter((question): question is EnablingQuestion => Boolean(question));
}

export function countEnablingAnswers(
  answers: Record<number, string>,
  questionSet: EnablingQuestion[] = ENABLING_QUESTIONS,
): number {
  return Object.entries(answers).filter(([id, value]) => {
    const question = questionSet.find((item) => item.id === parseInt(id, 10));
    const option = question?.options.find((item) => item.value === value);
    return option?.isEnabling;
  }).length;
}

export function getEnablingResult(
  answers: Record<number, string>,
  questionSet: EnablingQuestion[] = ENABLING_QUESTIONS,
): { type: EnablingResultType; title: string; message: string } {
  const enablingCount = countEnablingAnswers(answers, questionSet);
  const total = Object.keys(answers).length || 1;
  const percentage = (enablingCount / total) * 100;

  if (percentage >= 60) {
    return {
      type: 'warning',
      title: 'This May Be Enabling',
      message:
        "Based on your answers, this situation shows several signs of enabling behavior. While it's natural to want to help, stepping back may actually be the most loving thing you can do. Consider an Al-Anon, Nar-Anon, or CRAFT meeting for family support.",
    };
  }
  if (percentage >= 30) {
    return {
      type: 'caution',
      title: 'Proceed with Caution',
      message:
        'Your answers show a mix of enabling and healthy helping patterns. Before acting, clearly define boundaries and expectations. Consider if there are ways to support without rescuing.',
    };
  }
  return {
    type: 'okay',
    title: 'This Appears to Be Healthy Helping',
    message:
      'Based on your answers, this situation appears to be genuine support rather than enabling. Remember to maintain boundaries and continue evaluating as situations evolve.',
  };
}
