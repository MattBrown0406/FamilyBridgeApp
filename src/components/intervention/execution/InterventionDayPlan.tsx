import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarClock, CheckCircle2, XCircle } from 'lucide-react';

const timeline = [
  {
    phase: 'Pre-Intervention',
    time: '2–4 hours before',
    steps: [
      'All participants arrive at staging location',
      'Review roles and messaging one final time',
      'Confirm treatment facility is expecting the individual',
      'Ensure bags are packed and transportation is ready',
      'Brief emotional check—anyone who cannot maintain composure should be reassigned',
    ],
  },
  {
    phase: 'Arrival Coordination',
    time: '30–60 minutes before',
    steps: [
      'Participants move to intervention location',
      'Arrange seating intentionally (individual near the door if possible)',
      'Remove distractions (phones silent, pets out of room)',
      'Primary speaker confirms readiness with team',
      'Logistics coordinator confirms all transportation and admission details',
    ],
  },
  {
    phase: 'The Intervention',
    time: 'Duration: 30–90 minutes',
    steps: [
      'Primary speaker opens with a calm, structured statement of purpose',
      'Each participant reads their impact statement',
      'Consequences are stated clearly—not as threats, but as commitments',
      'Allow the individual to respond, but redirect deflection and blame',
      'Present treatment as the solution that is already arranged',
    ],
  },
  {
    phase: 'Immediate Transition',
    time: 'Within 30 minutes of acceptance',
    steps: [
      'Do not allow time to "think about it" or "go later"',
      'Transportation lead takes the individual directly to treatment',
      'Logistics coordinator calls facility to confirm arrival ETA',
      'Family members begin follow-through on stated boundaries',
    ],
  },
];

export const InterventionDayPlan = () => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-primary" />
          Intervention Day Plan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Timeline */}
        <div className="space-y-4">
          {timeline.map((block, i) => (
            <div key={i} className="relative pl-6 border-l-2 border-border pb-4 last:pb-0">
              <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary border-2 border-background" />
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-foreground">{block.phase}</span>
                <Badge variant="outline" className="text-xs">{block.time}</Badge>
              </div>
              <ul className="space-y-1.5">
                {block.steps.map((step, j) => (
                  <li key={j} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Outcome Scenarios */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-3 rounded-lg bg-green-50/50 dark:bg-green-950/20 border border-green-200/50 dark:border-green-800/30">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <p className="text-sm font-semibold text-green-800 dark:text-green-300">If They Say Yes</p>
            </div>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>• Leave for treatment immediately—no delays</li>
              <li>• Transportation lead drives directly to facility</li>
              <li>• Logistics coordinator confirms arrival with admissions</li>
              <li>• Family members express support but maintain boundaries</li>
              <li>• Begin post-intervention family support process</li>
            </ul>
          </div>
          <div className="p-3 rounded-lg bg-red-50/50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-800/30">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="h-4 w-4 text-destructive" />
              <p className="text-sm font-semibold text-red-800 dark:text-red-300">If They Resist</p>
            </div>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>• Stay calm—do not escalate or argue</li>
              <li>• Restate consequences without negotiation</li>
              <li>• Each participant confirms their commitment</li>
              <li>• Leave the door open: "When you're ready, we're ready"</li>
              <li>• Activate contingency plan (see below)</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
