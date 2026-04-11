import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, AlertTriangle } from 'lucide-react';

const rules = [
  {
    title: 'No Last-Minute Rescuing',
    detail: 'Do not soften consequences, offer alternatives, or create "one more chance" scenarios. Every rescue attempt teaches the individual that resistance works.',
  },
  {
    title: 'No Emotional Negotiation',
    detail: 'The individual will use guilt, anger, tears, and promises to change. These are predictable resistance behaviors—not genuine turning points. Stay the course.',
  },
  {
    title: 'No Backing Out of Consequences',
    detail: 'If you stated a consequence, you must follow through. Failing to enforce even one consequence undermines the entire intervention.',
  },
  {
    title: 'No Side Conversations',
    detail: 'Do not have private conversations with the individual that contradict the group message. The individual will exploit any inconsistency.',
  },
  {
    title: 'No Timeline Extensions',
    detail: '"I\'ll go next week" or "Let me get my affairs in order" are delay tactics. Treatment is available now. The window is open now.',
  },
];

interface FamilyBehaviorLockInProps {
  isExecutionMode: boolean;
}

export const FamilyBehaviorLockIn = ({ isExecutionMode }: FamilyBehaviorLockInProps) => {
  return (
    <Card className={isExecutionMode ? 'border-destructive/40 bg-destructive/5' : 'border-amber-500/30 bg-amber-50/20 dark:bg-amber-950/10'}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Lock className={`h-4 w-4 ${isExecutionMode ? 'text-destructive' : 'text-amber-600'}`} />
          {isExecutionMode ? 'CRITICAL: Family Consistency Required' : 'Family Behavior Guidelines'}
        </CardTitle>
        {isExecutionMode && (
          <div className="flex items-start gap-2 mt-1">
            <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-xs text-destructive font-medium">
              The intervention window is active. Any deviation from agreed-upon consequences or messaging will be exploited.
              Family unity is the single most important factor in a successful outcome.
            </p>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {rules.map((rule, i) => (
          <div key={i} className="flex gap-3">
            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              isExecutionMode
                ? 'bg-destructive/20 text-destructive'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
            }`}>
              {i + 1}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{rule.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{rule.detail}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
