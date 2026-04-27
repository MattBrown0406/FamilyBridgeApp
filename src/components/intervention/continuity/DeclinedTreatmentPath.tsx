import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ShieldOff, Eye, TrendingUp, AlertTriangle, Brain, BarChart3 } from 'lucide-react';
import { useState } from 'react';

const immediateActions = [
  { id: 'consequences', label: 'Hold agreed boundaries', detail: 'Keep previously agreed limits clear, calm, and consistent so the family does not send mixed messages.' },
  { id: 'enabling', label: 'Pause non-recovery support', detail: 'Avoid cash or open-ended help that undermines the support plan. Keep any essential support documented and recovery-aligned.' },
  { id: 'communication', label: 'Maintain calm, consistent communication', detail: 'Do not argue, plead, or emotionally escalate. Keep communication brief, clear, and boundary-focused.' },
  { id: 'professional', label: 'Assess whether outside intervention support should be engaged', detail: 'If not already involved, experienced outside support may improve the next attempt through strategic guidance.' },
];

const consistencyTrackers = [
  { label: 'Boundary adherence', status: 'Holding', health: 'good' as const },
  { label: 'Financial behavior', status: 'No enabling detected', health: 'good' as const },
  { label: 'Emotional responses', status: 'Moderate stress', health: 'caution' as const },
  { label: 'Consistency over time', status: '3 days strong', health: 'good' as const },
];

const breakdownFlags = [
  'Family member provided money despite agreed boundary',
  'Emotional rescue attempt detected (e.g., apologizing for intervention)',
  'Consequence partially reversed or softened',
  'Secret communication with the individual undermining group message',
  'Family member expressing guilt and considering backing down',
];

const pressureSignals = [
  { label: 'Consequence escalation', value: 'Active', trend: 'increasing' },
  { label: 'Individual distress signals', value: 'Rising', trend: 'increasing' },
  { label: 'Resistance intensity', value: 'Weakening', trend: 'decreasing' },
  { label: 'Help-proximity behavior', value: 'None yet', trend: 'stable' },
];

const reengagementIndicators = [
  'Help-related questions or comments (even indirect)',
  'Increased emotional fatigue or expressed hopelessness',
  'Reaching out to family members after period of silence',
  'Asking about treatment options or what would happen if they went',
  'Visible support-plan limits being maintained without resistance escalating',
];

export const DeclinedTreatmentPath = () => {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setChecked((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="space-y-6">
      {/* Phase Label */}
      <div className="flex items-center gap-2">
        <Badge className="bg-amber-600 text-white border-0 text-sm px-3 py-1">Post-Intervention Boundary Phase</Badge>
      </div>

      {/* Immediate Actions */}
      <Card className="border-amber-500/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldOff className="h-4 w-4 text-amber-600" />
            Immediate Actions
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Refusal is not failure. It means the individual is not yet ready. The family's job now is to maintain pressure through consistent boundary enforcement.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {immediateActions.map((action) => (
            <div key={action.id} className="flex gap-3">
              <Checkbox checked={!!checked[action.id]} onCheckedChange={() => toggle(action.id)} className="mt-1" />
              <div>
                <p className="text-sm font-medium text-foreground">{action.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{action.detail}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Family Consistency Monitor */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            Family Consistency Monitor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {consistencyTrackers.map((t, i) => (
              <div key={i} className="p-3 rounded-lg bg-muted/30 border border-border text-center">
                <p className="text-xs text-muted-foreground">{t.label}</p>
                <p className="text-sm font-semibold text-foreground mt-1">{t.status}</p>
                <div className={`w-2 h-2 rounded-full mx-auto mt-2 ${
                  t.health === 'good' ? 'bg-green-500' : t.health === 'caution' ? 'bg-amber-500' : 'bg-destructive'
                }`} />
              </div>
            ))}
          </div>

          {/* Breakdown Flags */}
          <div className="border-t pt-4">
            <p className="text-xs font-semibold text-destructive flex items-center gap-1.5 mb-2">
              <AlertTriangle className="h-3 w-3" /> Breakdown Patterns to Watch
            </p>
            <ul className="space-y-1.5">
              {breakdownFlags.map((flag, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="text-destructive mt-0.5">⚠</span> {flag}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Behavioral Pressure Tracking */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Behavioral Pressure Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {pressureSignals.map((s, i) => (
              <div key={i} className="p-3 rounded-lg bg-muted/30 border border-border text-center">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-sm font-semibold text-foreground mt-1">{s.value}</p>
                <Badge variant="outline" className="text-xs mt-1">
                  {s.trend === 'increasing' ? '↑' : s.trend === 'decreasing' ? '↓' : '→'} {s.trend}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Re-Engagement Detection */}
      <Card className="border-green-500/20 bg-green-50/20 dark:bg-green-950/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            Re-Engagement Detection
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Watch for these signals—they may indicate a new readiness window is forming.
          </p>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {reengagementIndicators.map((ind, i) => (
              <li key={i} className="text-sm text-foreground flex items-start gap-2">
                <span className="text-green-600 mt-0.5">◉</span> {ind}
              </li>
            ))}
          </ul>
          <div className="mt-4 p-3 rounded-lg bg-green-100/50 dark:bg-green-900/20 border border-green-200/50 dark:border-green-800/30">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-green-700 dark:text-green-400">Auto-Trigger: </span>
              When re-engagement signals are detected, the system will automatically notify authorized users and link back to the Intervention Readiness Engine for score re-evaluation.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* AI Summary */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            AI Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground">
            Boundary enforcement is active. Family consistency is strong at 3 days post-intervention. Resistance intensity appears to be weakening,
            but no help-proximity behaviors have been observed yet. Maintain current boundaries. The accumulation of natural consequences
            is the most likely path to a new readiness window. Estimated timeline for re-engagement opportunity: 2–4 weeks if consistency holds.
          </p>
          <p className="text-xs text-muted-foreground mt-2 italic">
            Note: This projection is based on behavioral patterns and may shift rapidly with new events.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
