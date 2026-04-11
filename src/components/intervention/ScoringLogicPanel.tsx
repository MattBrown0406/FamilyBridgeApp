import { Calculator } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { SignalCategory } from '@/data/interventionReadinessData';

interface ScoringLogicPanelProps {
  signals: SignalCategory[];
  totalScore: number;
}

export function ScoringLogicPanel({ signals, totalScore }: ScoringLogicPanelProps) {
  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1.5 h-7">
          <Calculator className="h-3.5 w-3.5" />
          View Scoring Formula
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <Card className="mt-2">
          <CardContent className="p-4">
            <div className="space-y-2 font-mono text-xs text-foreground/70">
              {signals.map((s) => (
                <div key={s.name} className="flex justify-between">
                  <span>{s.name}</span>
                  <span>{s.currentScore} × {s.weight} × 10 = <strong>{(s.currentScore * s.weight * 10).toFixed(1)}</strong></span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between font-semibold text-foreground">
                <span>Total Readiness Score</span>
                <span>{totalScore}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}
