import { Users, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ReadinessStatusLabel } from '@/data/interventionReadinessData';

interface GuidanceItem {
  action: string;
  why: string;
}

const guidanceByStatus: Record<ReadinessStatusLabel, { dos: GuidanceItem[]; donts: GuidanceItem[] }> = {
  'Not Ready': {
    dos: [
      { action: 'Maintain established boundaries consistently.', why: 'Consistency helps the family avoid mixed messages and keeps future support decisions clearer.' },
      { action: 'Focus on your own emotional health and attend your support groups.', why: 'Family burnout is the #1 reason interventions fail. You must be stable when the window opens.' },
      { action: 'Document patterns and behaviors — dates, times, specifics.', why: 'This data will inform intervention timing and letter content when the window arrives.' },
      { action: 'Keep communication simple, brief, and non-reactive.', why: 'Long conversations give the individual opportunities to manipulate or escalate.' },
    ],
    donts: [
      { action: 'Do not provide open-ended cash support.', why: 'Unstructured financial rescue can undermine the support plan and make future decisions harder.' },
      { action: 'Do not engage in emotional confrontation or repeated pleading.', why: 'Pleading often increases defensiveness and makes calm follow-through harder.' },
      { action: 'Do not state boundaries you are unwilling or unable to keep.', why: 'Inconsistent follow-through teaches everyone that the support plan is negotiable.' },
      { action: 'Do not attempt a surprise intervention.', why: 'Without readiness signals, a premature intervention has a high probability of rejection.' },
    ],
  },
  'Emerging Window': {
    dos: [
      { action: 'Hold all boundaries without sudden changes.', why: 'The emerging window may depend on steady, predictable family responses. Sudden changes can reset progress.' },
      { action: 'Begin quietly aligning family members on the intervention plan.', why: 'When the window opens fully, you need to move fast. Preparation now buys you speed later.' },
      { action: 'Research treatment options and verify insurance/availability.', why: 'Treatment bed availability can change in hours. Having options confirmed saves critical time.' },
      { action: 'Keep agreed support limits in place.', why: 'Consistent limits help the individual and family see the real pattern without adding confusion.' },
    ],
    donts: [
      { action: 'Do not reveal intervention planning to anyone outside the team.', why: 'If the individual learns an intervention is coming, they will pre-emptively harden their defenses.' },
      { action: 'Do not soften boundaries because "things seem better."', why: 'Emerging readiness can look like improvement. It is not. It is exhaustion. Softening kills the window.' },
      { action: 'Do not over-communicate concern — let the pressure do the work.', why: 'Constant expressions of worry give the individual something to push against. Silence is more powerful.' },
      { action: 'Do not engage in arguments about substance use.', why: 'Debates reinforce the individual\'s intellectual defenses. You cannot argue someone into recovery.' },
    ],
  },
  'Active Window': {
    dos: [
      { action: 'Confirm treatment placement and bed availability today.', why: 'This window may last 48–72 hours. If you don\'t have a bed when they say yes, you lose the moment.' },
      { action: 'Finalize intervention letters and team roles.', why: 'Every team member must know exactly what they will say and do. Rehearsal prevents chaos.' },
      { action: 'Have bags packed and transportation arranged for immediate departure.', why: 'If they say yes, the answer is "let\'s go now." Every hour of delay is an opportunity for the window to close.' },
      { action: 'Maintain boundaries firmly — this pressure is creating the window.', why: 'The instinct to reward "improvement" with kindness will destroy the conditions that made this window possible.' },
    ],
    donts: [
      { action: 'Do not allow any enabling behavior to re-stabilize the situation.', why: 'One rescue — money, shelter, emotional validation of denial — can close this window immediately.' },
      { action: 'Do not delay to "wait for a better time."', why: 'There is no better time. This is the window. Waiting is choosing to let it close.' },
      { action: 'Do not add emotional pressure beyond established boundaries.', why: 'Boundaries create productive discomfort. Emotional guilt creates defensive rage. Know the difference.' },
      { action: 'Do not give extended time to "think about it."', why: 'Thinking time is planning-to-refuse time. The offer should be immediate: today, now, let\'s go.' },
    ],
  },
  'Critical Window': {
    dos: [
      { action: 'Execute the intervention plan within 24–72 hours.', why: 'This level of readiness rarely sustains. The individual is as reachable as they are likely to be.' },
      { action: 'Keep the offer simple: "We have a place for you. Will you go today?"', why: 'Complexity creates objections. Simplicity forces a yes or no. That\'s all you need.' },
      { action: 'Have transportation and treatment intake ready immediately.', why: 'If they say yes, leave within the hour. Every minute of delay introduces doubt.' },
      { action: 'Stay compassionate but direct — this is the moment.', why: 'Compassion keeps the door open. Directness ensures they walk through it.' },
    ],
    donts: [
      { action: 'Do not wait. This window will close.', why: 'Critical windows typically last 24–72 hours. Hesitation is the most common reason families miss them.' },
      { action: 'Do not allow the family to second-guess timing.', why: 'Fear will tell the family "maybe tomorrow." Tomorrow, the window may be gone.' },
      { action: 'Do not negotiate terms or accommodate conditions.', why: 'Negotiation is the individual\'s last defense. The answer is the program, or no program. Period.' },
      { action: 'Do not pile on emotional appeals if they say yes — just move.', why: 'Once they agree, words become obstacles. Stop talking and start driving to the facility.' },
    ],
  },
};

interface FamilyGuidancePanelProps {
  statusLabel: ReadinessStatusLabel;
}

export function FamilyGuidancePanel({ statusLabel }: FamilyGuidancePanelProps) {
  const guidance = guidanceByStatus[statusLabel];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Family Guidance — {statusLabel}
        </CardTitle>
        <p className="text-xs text-muted-foreground">Tactical instructions for authorized family members</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" /> Do
            </h4>
            <ul className="space-y-3">
              {guidance.dos.map((item, i) => (
                <li key={i} className="text-xs leading-relaxed">
                  <div className="flex gap-2">
                    <span className="text-primary mt-0.5 flex-shrink-0">✓</span>
                    <div>
                      <span className="text-foreground font-medium">{item.action}</span>
                      <p className="text-muted-foreground mt-0.5 italic">{item.why}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/10">
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-destructive" /> Don't
            </h4>
            <ul className="space-y-3">
              {guidance.donts.map((item, i) => (
                <li key={i} className="text-xs leading-relaxed">
                  <div className="flex gap-2">
                    <span className="text-destructive mt-0.5 flex-shrink-0">✗</span>
                    <div>
                      <span className="text-foreground font-medium">{item.action}</span>
                      <p className="text-muted-foreground mt-0.5 italic">{item.why}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
