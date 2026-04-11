import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, Zap, Timer } from 'lucide-react';
import { useState } from 'react';

const actionItems = [
  { id: 'placement', label: 'Finalize treatment placement', detail: 'Confirm facility, level of care, and admission date. Have backup facility identified.' },
  { id: 'bed', label: 'Confirm bed availability NOW', detail: 'Call the facility directly. Get a hold or reservation. Beds can fill within hours.' },
  { id: 'travel', label: 'Lock in travel logistics', detail: 'Book transportation to treatment. Have bags packed. Remove logistical barriers to same-day departure.' },
  { id: 'team', label: 'Align intervention team immediately', detail: 'Confirm every participant. Share final messaging. Ensure no one will deviate from the plan.' },
  { id: 'time', label: 'Set intervention time (within 24–72 hours)', detail: 'Choose a time when the individual will be sober or least impaired. Morning is often optimal.' },
];

const executionChecklist = [
  { id: 'confirmed', label: 'All participants confirmed and briefed' },
  { id: 'messaging', label: 'Messaging aligned across all participants' },
  { id: 'consequences', label: 'Consequences clearly defined and committed to' },
  { id: 'transport', label: 'Transportation to treatment ready' },
  { id: 'admission', label: 'Admission process confirmed with facility' },
  { id: 'insurance', label: 'Insurance or payment verified' },
  { id: 'bags', label: 'Personal items / bag packed for the individual' },
  { id: 'backup', label: 'Backup facility identified' },
  { id: 'location', label: 'Intervention location secured' },
  { id: 'letters', label: 'All impact letters completed and reviewed' },
];

export const ExecutionWorkflow = () => {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  const completedCount = executionChecklist.filter((i) => checked[i.id]).length;
  const allDone = completedCount === executionChecklist.length;

  return (
    <div className="space-y-6">
      {/* Time Sensitivity */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
        <Timer className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5 animate-pulse" />
        <div>
          <p className="text-sm font-bold text-destructive">Time Sensitivity Warning</p>
          <p className="text-xs text-foreground mt-1">
            This window may close quickly. Resistance can reassert within 24–72 hours. Delays increase the risk of the individual stabilizing emotionally and re-engaging defense mechanisms. Act with urgency—not panic.
          </p>
        </div>
      </div>

      {/* Immediate Action Plan */}
      <Card className="border-destructive/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-destructive" />
            Immediate Action Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {actionItems.map((item) => (
            <div key={item.id} className="flex gap-3">
              <Checkbox
                checked={!!checked[item.id]}
                onCheckedChange={() => toggle(item.id)}
                className="mt-1"
              />
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Execution Checklist */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Execution Checklist</CardTitle>
            <Badge variant={allDone ? 'default' : 'destructive'}>
              {completedCount}/{executionChecklist.length} Complete
            </Badge>
          </div>
          {!allDone && (
            <p className="text-xs text-destructive">
              Incomplete items increase the risk of a disorganized intervention.
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {executionChecklist.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <Checkbox
                checked={!!checked[item.id]}
                onCheckedChange={() => toggle(item.id)}
              />
              <span className={`text-sm ${checked[item.id] ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                {item.label}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
