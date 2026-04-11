import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';
import { useState } from 'react';

interface Role {
  key: string;
  title: string;
  description: string;
  dos: string[];
  donts: string[];
  color: string;
}

const roles: Role[] = [
  {
    key: 'speaker',
    title: 'Primary Speaker',
    description: 'Opens the intervention and sets the tone. Usually the most composed family member or the interventionist.',
    dos: ['Stay calm and measured', 'Use prepared statements', 'Direct the conversation flow', 'Redirect if emotions escalate'],
    donts: ['React emotionally to pushback', 'Deviate from the plan', 'Engage in debate or argument'],
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  },
  {
    key: 'anchor',
    title: 'Emotional Anchor',
    description: 'Provides emotional grounding. Often a parent, spouse, or the person with the strongest emotional bond.',
    dos: ['Express love clearly', 'Stay present and calm', 'Support others if they struggle', 'Read impact letter with sincerity'],
    donts: ['Break down uncontrollably', 'Make promises to "fix" things', 'Soften agreed-upon consequences'],
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  },
  {
    key: 'logistics',
    title: 'Logistics Coordinator',
    description: 'Manages all practical details. Ensures treatment placement, travel, and timing are locked before the intervention begins.',
    dos: ['Confirm bed availability day-of', 'Have bags packed and ready', 'Arrange transportation', 'Have admission paperwork ready'],
    donts: ['Leave logistics to the day of', 'Assume details are handled', 'Share logistics with the individual prematurely'],
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  },
  {
    key: 'boundary',
    title: 'Boundary Enforcer',
    description: 'Ensures consequences are stated clearly and maintained. Often the person with the most leverage (financial, housing, etc.).',
    dos: ['State consequences clearly', 'Maintain firmness with compassion', 'Follow through on every stated consequence', 'Support others in holding the line'],
    donts: ['Make empty threats', 'Negotiate in the moment', 'Back down under pressure', 'Introduce new consequences not previously discussed'],
    color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  },
  {
    key: 'transport',
    title: 'Transportation Lead',
    description: 'Responsible for immediate transport to treatment if the individual accepts.',
    dos: ['Have vehicle ready and fueled', 'Know the route to the facility', 'Have facility contact info accessible', 'Be ready to leave immediately'],
    donts: ['Allow delays after acceptance', 'Stop for unnecessary errands', 'Leave the individual alone between acceptance and departure'],
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  },
];

export const RoleAssignment = () => {
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          Role Assignment
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Every participant needs a clear role. Ambiguity during an intervention creates openings for resistance.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {roles.map((role) => (
          <div
            key={role.key}
            className="border rounded-lg overflow-hidden"
          >
            <div
              className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => setExpanded(expanded === role.key ? null : role.key)}
            >
              <Badge className={`${role.color} border-0 text-xs shrink-0`}>{role.title}</Badge>
              <Input
                placeholder="Assign person..."
                value={assignments[role.key] || ''}
                onChange={(e) => {
                  e.stopPropagation();
                  setAssignments((prev) => ({ ...prev, [role.key]: e.target.value }));
                }}
                onClick={(e) => e.stopPropagation()}
                className="h-8 text-sm"
              />
            </div>
            {expanded === role.key && (
              <div className="px-3 pb-3 border-t bg-muted/20">
                <p className="text-xs text-muted-foreground mt-2 mb-3">{role.description}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">Do</p>
                    <ul className="space-y-1">
                      {role.dos.map((d, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <span className="text-green-600 mt-0.5">✓</span> {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-destructive mb-1">Don't</p>
                    <ul className="space-y-1">
                      {role.donts.map((d, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <span className="text-destructive mt-0.5">✕</span> {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
