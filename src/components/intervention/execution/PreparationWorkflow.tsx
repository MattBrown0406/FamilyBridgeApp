import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, Clock, Eye, ShieldAlert } from 'lucide-react';
import { useState } from 'react';

const immediateItems = [
  { id: 'treatment', label: 'Identify treatment placement options (residential, IOP, PHP)', detail: 'Research at least 2–3 facilities. Match care level to clinical severity.' },
  { id: 'insurance', label: 'Check insurance coverage and payment options', detail: 'Verify in-network status, pre-authorization requirements, and out-of-pocket costs.' },
  { id: 'alignment', label: 'Begin internal family alignment', detail: 'Ensure all key family members understand the plan and agree on approach.' },
  { id: 'participants', label: 'Identify intervention participants', detail: 'Select 4–6 people with meaningful relationships. Exclude anyone who may undermine consistency.' },
];

const doNotItems = [
  'Do NOT confront the individual about their use',
  'Do NOT reveal that intervention planning is underway',
  'Do NOT escalate emotionally or create new conflicts',
  'Do NOT change established routines that could raise suspicion',
  'Do NOT make threats you are not prepared to enforce',
];

const prepChecklist = [
  { id: 'center', label: 'Treatment center selected' },
  { id: 'bed', label: 'Bed availability verified' },
  { id: 'travel', label: 'Travel logistics considered' },
  { id: 'interventionist', label: 'Interventionist secured (if applicable)' },
  { id: 'roles', label: 'Family roles identified and assigned' },
  { id: 'letters', label: 'Intervention letters: Impact letters drafted (or in progress)' },
  { id: 'consequences', label: 'Boundaries and resulting consequences defined and agreed upon' },
  { id: 'timeline', label: 'Target timeline established' },
];

export const PreparationWorkflow = () => {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  const completedCount = prepChecklist.filter((i) => checked[i.id]).length;

  return (
    <div className="space-y-6">
      {/* Immediate Priorities */}
      <Card className="border-amber-500/30 bg-amber-50/30 dark:bg-amber-950/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-600" />
            Immediate Priorities
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {immediateItems.map((item) => (
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

      {/* Do Not Do Yet */}
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-destructive">
            <ShieldAlert className="h-4 w-4" />
            Do Not Do Yet
          </CardTitle>
          <p className="text-xs text-muted-foreground">Premature action can close the window. Maintain calm and routine.</p>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {doNotItems.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-destructive/90">
                <span className="mt-0.5">✕</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Preparation Checklist */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Preparation Checklist</CardTitle>
            <Badge variant={completedCount === prepChecklist.length ? 'default' : 'secondary'}>
              {completedCount}/{prepChecklist.length} Complete
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {prepChecklist.map((item) => (
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

      {/* Timing Watch */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40">
        <Eye className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-foreground">Timing Watch</p>
          <p className="text-xs text-muted-foreground mt-1">
            Readiness is approaching actionable range. Monitor closely for escalation into a critical window.
            Continue quiet preparation. A single consequence event or emotional crisis could push the score into execution range within hours.
          </p>
        </div>
      </div>
    </div>
  );
};
