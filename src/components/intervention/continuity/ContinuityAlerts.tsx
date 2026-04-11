import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, AlertTriangle, TrendingUp, ShieldAlert, Activity } from 'lucide-react';

interface Alert {
  id: string;
  title: string;
  detail: string;
  urgency: 'critical' | 'high' | 'medium' | 'info';
  timestamp: string;
}

const acceptedAlerts: Alert[] = [
  { id: '1', title: 'Engagement stable', detail: 'Attendance and participation remain consistent through Day 7.', urgency: 'info', timestamp: '2 hours ago' },
  { id: '2', title: 'Family communication boundary respected', detail: 'No over-contact attempts detected. Following facility schedule.', urgency: 'info', timestamp: '1 day ago' },
];

const declinedAlerts: Alert[] = [
  { id: '1', title: 'Family boundary breakdown risk', detail: 'Emotional regulation score declining. Monitor for rescue attempts.', urgency: 'high', timestamp: '3 hours ago' },
  { id: '2', title: 'Resistance intensity weakening', detail: 'Individual distress increasing while defensive language has decreased.', urgency: 'medium', timestamp: '1 day ago' },
  { id: '3', title: 'Consequences holding', detail: 'All family members maintaining stated boundaries. Consistency strong.', urgency: 'info', timestamp: '2 days ago' },
];

const urgencyConfig = {
  critical: { icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/30', badge: 'destructive' as const },
  high: { icon: ShieldAlert, color: 'text-amber-600', bg: 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300/50 dark:border-amber-700/30', badge: 'secondary' as const },
  medium: { icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-300/50 dark:border-blue-700/30', badge: 'outline' as const },
  info: { icon: Activity, color: 'text-green-600', bg: 'bg-green-50/50 dark:bg-green-950/20 border-green-300/50 dark:border-green-700/30', badge: 'outline' as const },
};

interface ContinuityAlertsProps {
  outcome: 'accepted' | 'declined';
}

export const ContinuityAlerts = ({ outcome }: ContinuityAlertsProps) => {
  const alerts = outcome === 'accepted' ? acceptedAlerts : declinedAlerts;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            Active Alerts
          </CardTitle>
          <Badge variant="secondary" className="text-xs">{alerts.length} active</Badge>
        </div>
        <p className="text-xs text-muted-foreground">Alerts are sent only to authorized family members and professionals.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => {
          const config = urgencyConfig[alert.urgency];
          const Icon = config.icon;
          return (
            <div key={alert.id} className={`p-3 rounded-lg border ${config.bg}`}>
              <div className="flex items-start gap-3">
                <Icon className={`h-4 w-4 flex-shrink-0 mt-0.5 ${config.color}`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">{alert.title}</p>
                    <span className="text-xs text-muted-foreground">{alert.timestamp}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{alert.detail}</p>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
