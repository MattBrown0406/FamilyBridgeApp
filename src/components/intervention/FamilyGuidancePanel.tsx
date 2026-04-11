import { Users, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ReadinessStatusLabel } from '@/data/interventionReadinessData';

const guidanceByStatus: Record<ReadinessStatusLabel, { dos: string[]; donts: string[] }> = {
  'Not Ready': {
    dos: [
      'Maintain calm and consistent consequences.',
      'Focus on your own emotional health and stability.',
      'Continue documenting patterns and behaviors.',
      'Attend your own support groups and therapy.',
      'Keep communication simple and non-reactive.',
    ],
    donts: [
      'Do not rescue financially during this period.',
      'Avoid emotional confrontation or repeated pleading.',
      'Do not over-explain or negotiate boundaries.',
      'Do not threaten consequences you are unwilling to enforce.',
      'Avoid gathering family for a surprise intervention.',
    ],
  },
  'Emerging Window': {
    dos: [
      'Maintain calm and consistent consequences.',
      'Begin quietly aligning family members on the intervention plan.',
      'Research treatment options and verify insurance/availability.',
      'Keep communication brief, warm, and non-pressuring.',
      'Let natural consequences continue without interference.',
    ],
    donts: [
      'Do not rescue financially during this period.',
      'Avoid emotional confrontation or repeated pleading.',
      'Do not reveal intervention planning to the individual.',
      'Do not soften boundaries because things seem to be improving.',
      'Avoid over-communicating concern — let the pressure work.',
    ],
  },
  'Active Window': {
    dos: [
      'Finalize treatment placement and confirm bed availability.',
      'Complete intervention team preparation and letter writing.',
      'Have bags packed and logistics ready for immediate departure.',
      'Maintain boundaries firmly — this pressure is working.',
      'If treatment is offered, keep the offer simple and immediate.',
    ],
    donts: [
      'Do not allow enabling behaviors to re-stabilize the situation.',
      'Avoid delays that could allow the window to close.',
      'Do not add emotional guilt or pressure beyond boundaries.',
      'Do not give the person too much time to "think about it."',
      'Avoid arguments — stay calm, clear, and compassionate.',
    ],
  },
  'Critical Window': {
    dos: [
      'Execute the intervention plan now.',
      'Keep the offer simple: "We have a place for you. Will you go today?"',
      'Have transportation and treatment intake ready immediately.',
      'Stay compassionate but firm — this is the moment.',
      'Support immediate transition to care without delays.',
    ],
    donts: [
      'Do not wait. Delays risk the window closing.',
      'Do not allow family to second-guess timing.',
      'Avoid negotiation — the answer is yes or no.',
      'Do not pile on emotional appeals if they say yes — just go.',
      'Do not threaten — offer help with love and clarity.',
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
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" /> Do
            </h4>
            <ul className="space-y-2">
              {guidance.dos.map((item, i) => (
                <li key={i} className="text-xs text-foreground/70 leading-relaxed flex gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/10">
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-destructive" /> Don't
            </h4>
            <ul className="space-y-2">
              {guidance.donts.map((item, i) => (
                <li key={i} className="text-xs text-foreground/70 leading-relaxed flex gap-2">
                  <span className="text-destructive mt-0.5">✗</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
