import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ShieldOff, RotateCcw } from 'lucide-react';
import { useState } from 'react';

const boundarySteps = [
  { id: 'housing', label: 'Enforce housing boundaries', detail: 'If stated: no longer providing living space without treatment participation.' },
  { id: 'financial', label: 'Cut financial enabling', detail: 'Stop all non-essential financial support. No cash, no bill payments, no bailouts.' },
  { id: 'vehicle', label: 'Remove vehicle access', detail: 'If the vehicle is in your name, reclaim it. Do not enable transportation to use.' },
  { id: 'communication', label: 'Set communication boundaries', detail: 'Limit contact to brief, non-enabling interactions. Do not engage in manipulation or guilt.' },
  { id: 'insurance', label: 'Maintain insurance coverage', detail: 'Keep insurance active—this removes a future barrier to treatment when they are ready.' },
];

const reengagementSteps = [
  'Monitor for renewed readiness signals (this system will continue tracking)',
  'Maintain boundaries consistently—no partial re-enabling',
  'Allow natural consequences to continue building pressure',
  'Keep treatment placement on hold or identify new options',
  'Prepare for a second intervention attempt within 2–6 weeks if signals resurface',
  'Consider a different intervention style on the next attempt',
];

export const ContingencyPlan = () => {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setChecked((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ShieldOff className="h-4 w-4 text-destructive" />
          Contingency Plan: If They Refuse
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Refusal does not mean failure. It means the individual is not yet ready. The family's job shifts to maintaining pressure
          through consistent boundary enforcement until the next window opens.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Boundary Enforcement */}
        <div>
          <p className="text-sm font-semibold text-foreground mb-3">Boundary Enforcement Steps</p>
          <div className="space-y-3">
            {boundarySteps.map((step) => (
              <div key={step.id} className="flex gap-3">
                <Checkbox
                  checked={!!checked[step.id]}
                  onCheckedChange={() => toggle(step.id)}
                  className="mt-1"
                />
                <div>
                  <p className="text-sm font-medium text-foreground">{step.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Re-engagement */}
        <div className="border-t pt-4">
          <div className="flex items-center gap-2 mb-3">
            <RotateCcw className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">Re-Engagement Strategy</p>
          </div>
          <ul className="space-y-2">
            {reengagementSteps.map((step, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                <span className="text-primary font-bold">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
