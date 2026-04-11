import { format } from 'date-fns';
import { Bell, AlertTriangle, AlertOctagon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { InterventionAlert } from '@/data/interventionReadinessData';

const urgencyConfig = {
  moderate: { icon: <Bell className="h-4 w-4" />, color: 'bg-warning/10 border-warning/20 text-warning-foreground', badge: 'bg-warning/15 text-warning-foreground' },
  high: { icon: <AlertTriangle className="h-4 w-4" />, color: 'bg-primary/10 border-primary/20', badge: 'bg-primary/15 text-primary' },
  critical: { icon: <AlertOctagon className="h-4 w-4" />, color: 'bg-destructive/10 border-destructive/20', badge: 'bg-destructive/15 text-destructive' },
};

interface InterventionAlertsProps {
  alerts: InterventionAlert[];
}

export function InterventionAlerts({ alerts }: InterventionAlertsProps) {
  if (!alerts.length) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Bell className="h-5 w-5 text-warning" />
          Intervention Window Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => {
          const config = urgencyConfig[alert.urgency];
          return (
            <div key={alert.id} className={`p-4 rounded-lg border ${config.color}`}>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">{config.icon}</div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-foreground">{alert.title}</h4>
                    <Badge className={`${config.badge} text-xs capitalize`}>{alert.urgency}</Badge>
                  </div>
                  <p className="text-xs text-foreground/70 mb-2">{alert.explanation}</p>
                  <div className="space-y-1">
                    {alert.contributingSignals.map((sig, i) => (
                      <p key={i} className="text-xs text-muted-foreground">• {sig}</p>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {format(new Date(alert.timestamp), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
