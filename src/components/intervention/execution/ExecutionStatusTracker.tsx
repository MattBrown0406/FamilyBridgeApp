import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, CheckCircle2, Circle, Loader2, Clock } from 'lucide-react';
import { useState } from 'react';

type Stage = 'preparing' | 'ready' | 'in_progress' | 'completed' | 'outcome_pending' | 'declined';

interface StageInfo {
  key: Stage;
  label: string;
  description: string;
}

const stages: StageInfo[] = [
  { key: 'preparing', label: 'Preparing', description: 'Gathering resources, aligning family, securing treatment placement.' },
  { key: 'ready', label: 'Ready to Execute', description: 'All checklist items complete. Team aligned. Awaiting go signal.' },
  { key: 'in_progress', label: 'Intervention In Progress', description: 'The intervention conversation is happening now.' },
  { key: 'completed', label: 'Completed', description: 'The intervention has concluded.' },
  { key: 'outcome_pending', label: 'Outcome Pending', description: 'Awaiting confirmation of treatment admission or next steps.' },
];

interface ExecutionStatusTrackerProps {
  score: number;
}

export const ExecutionStatusTracker = ({ score }: ExecutionStatusTrackerProps) => {
  const getInitialStage = (): Stage => {
    if (score >= 80) return 'ready';
    return 'preparing';
  };

  const [currentStage, setCurrentStage] = useState<Stage>(getInitialStage());

  const getStageIndex = (stage: Stage) => stages.findIndex((s) => s.key === stage);
  const currentIndex = getStageIndex(currentStage);

  const getStageColor = (stage: StageInfo, index: number) => {
    if (index < currentIndex) return 'text-green-600';
    if (index === currentIndex) return 'text-primary';
    return 'text-muted-foreground/40';
  };

  const getIcon = (index: number) => {
    if (index < currentIndex) return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    if (index === currentIndex) return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
    return <Circle className="h-5 w-5 text-muted-foreground/30" />;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Status Tracker
          </CardTitle>
          <Badge variant={currentStage === 'in_progress' ? 'destructive' : 'secondary'} className="text-xs">
            {stages.find((s) => s.key === currentStage)?.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-0">
          {stages.map((stage, i) => (
            <div
              key={stage.key}
              className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                i === currentIndex ? 'bg-primary/5 border border-primary/20' : 'hover:bg-muted/30'
              }`}
              onClick={() => setCurrentStage(stage.key)}
            >
              {getIcon(i)}
              <div>
                <p className={`text-sm font-medium ${getStageColor(stage, i)}`}>{stage.label}</p>
                <p className="text-xs text-muted-foreground">{stage.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
