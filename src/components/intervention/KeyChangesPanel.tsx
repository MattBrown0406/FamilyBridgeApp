import { TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { KeyChange } from '@/data/interventionReadinessData';

interface KeyChangesPanelProps {
  changes: KeyChange[];
}

export function KeyChangesPanel({ changes }: KeyChangesPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Key Changes — Last 72 Hours
        </CardTitle>
        <p className="text-xs text-muted-foreground">Why the readiness score moved</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {changes.map((change) => (
            <div key={change.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
              <div className="flex-shrink-0 mt-0.5">
                {change.direction === 'up' ? (
                  <TrendingUp className="h-4 w-4 text-primary" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{change.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">{change.delta}</span>
                  <Badge variant="secondary" className="text-xs px-1.5 py-0">{change.category}</Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
