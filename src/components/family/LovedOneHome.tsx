import { CalendarDays, MapPin, Pill, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SobrietyCounter } from '@/components/SobrietyCounter';
import { FamilyResourceRail } from './FamilyResourceRail';

export interface LovedOneBoundary {
  id: string;
  content: string;
  consequence: string | null;
}

interface LovedOneHomeProps {
  familyId: string;
  familyName?: string;
  currentUserId?: string;
  canEditSobriety?: boolean;
  boundaries: LovedOneBoundary[];
  onOpenCheckin: () => void;
  onOpenMeetings: (fellowship?: 'AA' | 'Al-Anon' | 'Nar-Anon' | 'CRAFT') => void;
  onOpenMeds: () => void;
  onOpenNeedTo: () => void;
}

export const LovedOneHome = ({
  familyId,
  familyName,
  canEditSobriety = false,
  boundaries,
  onOpenCheckin,
  onOpenMeetings,
  onOpenMeds,
  onOpenNeedTo,
}: LovedOneHomeProps) => {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-3 overflow-y-auto pb-8 sm:space-y-4">
      <section className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4 shadow-sm sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Your home</p>
        <h2 className="mt-1 text-xl font-semibold sm:text-2xl">{familyName || 'Your recovery space'}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Check in, find a meeting, take meds, and see what your family asked of you.
          Money votes and family strategy tools stay with the family — not on this door.
        </p>
      </section>

      <aside className="rounded-xl border border-red-300 bg-red-50 p-3 text-red-950 dark:border-red-900 dark:bg-red-950 dark:text-red-50" aria-label="Crisis help">
        <p className="text-sm font-semibold">Immediate crisis or overdose?</p>
        <p className="text-sm">
          Call <a className="font-bold underline" href="tel:911">911</a>. For suicide or mental health crisis, call or text{' '}
          <a className="font-bold underline" href="tel:988">988</a>.
        </p>
      </aside>

      {familyId && (
        <SobrietyCounter
          familyId={familyId}
          isRecoveringMember
          canEdit={canEditSobriety}
        />
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Button className="h-auto flex-col items-start gap-1 py-3" onClick={onOpenCheckin}>
          <span className="flex items-center gap-2 font-semibold"><MapPin className="h-4 w-4" /> Check in</span>
          <span className="text-xs font-normal opacity-90">Meeting or location check-in</span>
        </Button>
        <Button variant="outline" className="h-auto flex-col items-start gap-1 py-3" onClick={() => onOpenMeetings('AA')}>
          <span className="flex items-center gap-2 font-semibold"><CalendarDays className="h-4 w-4" /> Meetings</span>
          <span className="text-xs font-normal text-muted-foreground">AA and other recovery meetings</span>
        </Button>
        <Button variant="outline" className="h-auto flex-col items-start gap-1 py-3" onClick={onOpenMeds}>
          <span className="flex items-center gap-2 font-semibold"><Pill className="h-4 w-4" /> Meds</span>
          <span className="text-xs font-normal text-muted-foreground">Your medication list</span>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-5 w-5 text-primary" />
            What my family asked of me
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {boundaries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active commitments yet. Your family can add them in their space.</p>
          ) : (
            boundaries.map((boundary) => (
              <div key={boundary.id} className="rounded-xl border p-3">
                <p className="text-sm font-medium">{boundary.content}</p>
                {boundary.consequence && (
                  <p className="mt-1 text-xs text-muted-foreground">If this is not held: {boundary.consequence}</p>
                )}
                <Badge variant="secondary" className="mt-2">Active</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <FamilyResourceRail onOpenMeetings={onOpenMeetings} compact />

      <Button variant="outline" className="w-full" onClick={onOpenNeedTo}>
        I need to…
      </Button>
    </div>
  );
};
