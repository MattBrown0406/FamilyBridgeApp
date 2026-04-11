import { Calendar, CheckCircle2, XCircle, Wrench } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Next72HourStrategy } from '@/data/interventionReadinessData';

interface Next72HourStrategyPanelProps {
  strategy: Next72HourStrategy;
}

export function Next72HourStrategyPanel({ strategy }: Next72HourStrategyPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Next 72-Hour Strategy
        </CardTitle>
        <p className="text-sm text-foreground/80 font-medium">{strategy.objective}</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Do</span>
            </div>
            <ul className="space-y-1.5">
              {strategy.doActions.map((action, i) => (
                <li key={i} className="text-xs text-foreground/70 leading-relaxed flex gap-1.5">
                  <span className="text-primary mt-0.5 flex-shrink-0">✓</span>
                  {action}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/10">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-semibold text-foreground">Avoid</span>
            </div>
            <ul className="space-y-1.5">
              {strategy.avoidActions.map((action, i) => (
                <li key={i} className="text-xs text-foreground/70 leading-relaxed flex gap-1.5">
                  <span className="text-destructive mt-0.5 flex-shrink-0">✗</span>
                  {action}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Prepare</span>
            </div>
            <ul className="space-y-1.5">
              {strategy.prepareActions.map((action, i) => (
                <li key={i} className="text-xs text-foreground/70 leading-relaxed flex gap-1.5">
                  <span className="text-muted-foreground mt-0.5 flex-shrink-0">→</span>
                  {action}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
