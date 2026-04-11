import { CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CaseStatus } from '@/data/interventionReadinessData';

const STATUSES: CaseStatus[] = [
  'Monitoring', 'Early Preparation', 'Active Preparation',
  'Intervention Recommended', 'Intervention Scheduled',
  'Intervention Completed', 'Reassessing',
];

interface CaseWorkflowProps {
  currentStatus: CaseStatus;
  suggestedStatus: CaseStatus;
  onStatusChange: (status: CaseStatus) => void;
}

function getSuggestedStatus(score: number): CaseStatus {
  if (score <= 40) return 'Monitoring';
  if (score <= 55) return 'Early Preparation';
  if (score <= 70) return 'Active Preparation';
  if (score <= 85) return 'Intervention Recommended';
  return 'Intervention Recommended';
}

export { getSuggestedStatus };

export function CaseWorkflow({ currentStatus, suggestedStatus, onStatusChange }: CaseWorkflowProps) {
  const currentIndex = STATUSES.indexOf(currentStatus);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Case Workflow</CardTitle>
        {suggestedStatus !== currentStatus && (
          <p className="text-xs text-muted-foreground">
            AI suggests: <span className="font-medium text-primary">{suggestedStatus}</span>
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((status, i) => {
            const isActive = status === currentStatus;
            const isPast = i < currentIndex;
            const isSuggested = status === suggestedStatus && !isActive;

            return (
              <button
                key={status}
                onClick={() => onStatusChange(status)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary'
                    : isPast
                    ? 'bg-primary/10 text-primary border-primary/20'
                    : isSuggested
                    ? 'bg-warning/10 text-warning-foreground border-warning/30 ring-1 ring-warning/30'
                    : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                }`}
              >
                {isPast && <CheckCircle2 className="h-3 w-3" />}
                {status}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
