import { Bell, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { PredictionAlert } from '@/hooks/useOutcomePredictions';

export function PredictionAlerts({ alerts, onDismiss }: { alerts: PredictionAlert[]; onDismiss: (id: string) => void }) {
  if (!alerts.length) return null;
  return (
    <div className="space-y-2">
      {alerts.map(a => (
        <Alert key={a.id} variant={a.severity === 'critical' ? 'destructive' : 'default'} className="relative">
          <Bell className="h-4 w-4" />
          <AlertTitle className="pr-8 text-sm">{a.title}</AlertTitle>
          <AlertDescription className="text-xs">{a.message}</AlertDescription>
          <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => onDismiss(a.id)}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </Alert>
      ))}
    </div>
  );
}
