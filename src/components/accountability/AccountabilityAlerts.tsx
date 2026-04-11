import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, X, AlertTriangle, Info, AlertOctagon } from 'lucide-react';
import { AccountabilityAlert } from '@/hooks/useAccountability';
import { format } from 'date-fns';

interface Props {
  alerts: AccountabilityAlert[];
  sourceFilter?: string;
  onDismiss: (id: string) => Promise<any>;
}

export const AccountabilityAlerts = ({ alerts, sourceFilter, onDismiss }: Props) => {
  const filtered = sourceFilter ? alerts.filter(a => a.source_type === sourceFilter) : alerts;

  const severityConfig: Record<string, { icon: React.ReactNode; border: string }> = {
    critical: { icon: <AlertOctagon className="h-4 w-4 text-red-600" />, border: 'border-l-red-600' },
    warning: { icon: <AlertTriangle className="h-4 w-4 text-yellow-600" />, border: 'border-l-yellow-600' },
    info: { icon: <Info className="h-4 w-4 text-blue-600" />, border: 'border-l-blue-600' },
  };

  if (filtered.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Alerts
          <Badge variant="destructive" className="ml-auto">{filtered.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {filtered.map(alert => {
          const cfg = severityConfig[alert.severity] || severityConfig.info;
          return (
            <div key={alert.id} className={`flex items-start gap-3 p-3 border rounded-lg border-l-4 ${cfg.border}`}>
              <div className="mt-0.5">{cfg.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{alert.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{format(new Date(alert.created_at), 'MMM d, h:mm a')}</p>
              </div>
              <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => onDismiss(alert.id)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
