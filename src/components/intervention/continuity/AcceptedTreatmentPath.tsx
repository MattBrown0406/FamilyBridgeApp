import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle2, ShieldCheck, AlertTriangle, Activity, Brain } from 'lucide-react';
import { useState } from 'react';

const immediateSteps = [
  { id: 'admission', label: 'Confirm admission completed', detail: 'Verify the individual has been formally admitted and intake paperwork is processed.' },
  { id: 'arrival', label: 'Confirm safe arrival', detail: 'Confirm the individual arrived safely and is physically at the facility.' },
  { id: 'intake', label: 'Verify intake process completed', detail: 'Ensure medical screening, psychological evaluation, and initial assessment are done.' },
];

const stabilizationChecklist = [
  { id: 'detox', label: 'Detox / intake completed' },
  { id: 'plan', label: 'Initial treatment plan created by facility' },
  { id: 'comms', label: 'Communication boundaries established with family' },
  { id: 'insurance', label: 'Insurance and billing confirmed with facility' },
  { id: 'contacts', label: 'Emergency contacts provided to facility' },
  { id: 'belongings', label: 'Personal items and medications handed off' },
];

const familyGuidance = [
  { title: 'Do not over-contact', detail: 'Follow the facility\'s communication schedule. Over-contact can enable manipulation and undermine treatment engagement.' },
  { title: 'Do not rescue or interfere', detail: 'If the individual complains about treatment, do not try to fix it. Trust the process. Discomfort is part of recovery.' },
  { title: 'Follow provider communication rules', detail: 'Respect blackout periods, scheduled call times, and family session guidelines set by the treatment team.' },
  { title: 'Focus on your own recovery', detail: 'Attend Al-Anon, therapy, or support groups. Family healing is not optional—it is essential to sustained recovery.' },
];

const riskIndicators = [
  { label: 'Disengagement from treatment activities', severity: 'high' as const },
  { label: 'Escalating complaints about facility or staff', severity: 'medium' as const },
  { label: 'Attempts to negotiate early discharge', severity: 'high' as const },
  { label: 'Manipulation toward family members (guilt, anger, promises)', severity: 'high' as const },
  { label: 'Refusal to participate in group or individual therapy', severity: 'medium' as const },
  { label: 'Isolating from peers in treatment', severity: 'low' as const },
];

const engagementMetrics = [
  { label: 'Treatment attendance', status: 'Consistent', trend: 'stable' },
  { label: 'Participation level', status: 'Active', trend: 'improving' },
  { label: 'Communication tone', status: 'Cooperative', trend: 'stable' },
  { label: 'Compliance with expectations', status: 'Full', trend: 'stable' },
];

export const AcceptedTreatmentPath = () => {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setChecked((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="space-y-6">
      {/* Phase Label */}
      <div className="flex items-center gap-2">
        <Badge className="bg-green-600 text-white border-0 text-sm px-3 py-1">Active Treatment Phase</Badge>
      </div>

      {/* Immediate Next Steps */}
      <Card className="border-green-500/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Immediate Next Steps
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {immediateSteps.map((step) => (
            <div key={step.id} className="flex gap-3">
              <Checkbox checked={!!checked[step.id]} onCheckedChange={() => toggle(step.id)} className="mt-1" />
              <div>
                <p className="text-sm font-medium text-foreground">{step.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{step.detail}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Stabilization Checklist */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Stabilization Checklist</CardTitle>
            <Badge variant="secondary">
              {stabilizationChecklist.filter((i) => checked[i.id]).length}/{stabilizationChecklist.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {stabilizationChecklist.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <Checkbox checked={!!checked[item.id]} onCheckedChange={() => toggle(item.id)} />
              <span className={`text-sm ${checked[item.id] ? 'line-through text-muted-foreground' : ''}`}>{item.label}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Family Alignment */}
      <Card className="border-amber-500/30 bg-amber-50/20 dark:bg-amber-950/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-amber-600" />
            Family Alignment — CRITICAL
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            The intervention is over, but family behavior during treatment is just as important. Missteps now can undermine everything.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {familyGuidance.map((g, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                {i + 1}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{g.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{g.detail}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Engagement Monitoring */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Engagement Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {engagementMetrics.map((m, i) => (
              <div key={i} className="p-3 rounded-lg bg-muted/30 border border-border text-center">
                <p className="text-xs text-muted-foreground">{m.label}</p>
                <p className="text-sm font-semibold text-foreground mt-1">{m.status}</p>
                <Badge variant="outline" className="text-xs mt-1">
                  {m.trend === 'improving' ? '↑' : m.trend === 'declining' ? '↓' : '→'} {m.trend}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Early Risk Indicators */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            Early Risk Indicators
          </CardTitle>
          <p className="text-xs text-muted-foreground">Monitor for these warning signs of disengagement or early discharge risk.</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {riskIndicators.map((r, i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                r.severity === 'high' ? 'bg-destructive' : r.severity === 'medium' ? 'bg-amber-500' : 'bg-blue-400'
              }`} />
              <span className="text-sm text-foreground">{r.label}</span>
              <Badge variant="outline" className="text-xs ml-auto">{r.severity}</Badge>
            </div>
          ))}
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
            Engagement is stable. Attendance is consistent and participation level is active. No current indicators of early discharge risk.
            Communication tone with family has been cooperative. Continue monitoring and maintain family alignment protocols.
          </p>
          <p className="text-xs text-muted-foreground mt-2 italic">
            Note: This assessment is based on available signals and may not capture all dynamics within the treatment environment.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
