import { useState, type FormEvent } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { Check, Circle, HeartHandshake } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  AccessUnavailableState,
  FamilyRequiredState,
  LoadingState,
  PageHeader,
  SafetyNotice,
  SignalList,
  useFamilyReadiness,
} from '@/features/readiness/familyReadiness';

const continuityMilestones = [
  { id: 'professional-follow-up', title: 'Professional follow-up confirmed', detail: 'Confirm the next contact with the clinician, intervention professional, treatment provider, or other appropriate support.' },
  { id: 'family-support', title: 'Family support arranged', detail: 'Schedule counseling, a peer support meeting, rest, childcare, or another concrete support for family members.' },
  { id: 'communication-plan', title: 'Communication plan documented', detail: 'Agree who will communicate, through which channel, and what information may be shared with consent.' },
  { id: 'practical-needs', title: 'Practical needs reviewed', detail: 'Review transportation, medication safety, housing, finances, and caregiving with qualified help where needed.' },
  { id: 'next-review', title: 'Next family review scheduled', detail: 'Choose a time to review confirmed events and family wellbeing without setting a deadline for another person’s decision.' },
];

const outcomeLabels: Record<string, string> = {
  'help-accepted': 'Help accepted',
  'help-declined': 'Help declined at this time',
  'conversation-paused': 'Conversation paused',
  'follow-up-scheduled': 'Professional follow-up scheduled',
};

export default function PostInterventionContinuity() {
  const { familyId: routeFamilyId } = useParams<{ familyId?: string }>();
  const [searchParams] = useSearchParams();
  const familyId = routeFamilyId || searchParams.get('familyId');
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const readiness = useFamilyReadiness(familyId, user?.id);
  const [note, setNote] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  if (authLoading) return <LoadingState />;
  if (!user) return <Navigate to="/auth" replace />;
  if (!familyId) return <FamilyRequiredState />;

  const query = `?familyId=${encodeURIComponent(familyId)}`;
  const continuitySignals = readiness.signals.filter((signal) => signal.category_tags.includes('continuity'));
  const completed = new Set(
    readiness.signals.flatMap((signal) => signal.category_tags.filter((tag) => tag.startsWith('continuity:')).map((tag) => tag.slice(11))),
  );
  const latestOutcomeTag = readiness.signals
    .find((signal) => signal.category_tags.includes('outcome'))
    ?.category_tags.find((tag) => tag.startsWith('outcome:'))
    ?.slice(8);

  async function recordMilestone(id: string, title: string) {
    if (completed.has(id)) return;
    setSavingId(id);
    try {
      await readiness.addSignal({
        description: `Continuity milestone completed: ${title}`,
        tags: ['continuity', `continuity:${id}`, 'milestone'],
        sourceType: 'continuity_milestone',
      });
      toast({ title: 'Continuity milestone saved' });
    } catch (error) {
      toast({ title: 'Could not save milestone', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' });
    } finally {
      setSavingId(null);
    }
  }

  async function saveNote(event: FormEvent) {
    event.preventDefault();
    setSavingId('note');
    try {
      await readiness.addSignal({ description: note, tags: ['continuity', 'follow-up-note'], sourceType: 'continuity_note' });
      setNote('');
      toast({ title: 'Continuity note saved' });
    } catch (error) {
      toast({ title: 'Could not save note', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' });
    } finally {
      setSavingId(null);
    }
  }

  return (
    <>
      <SEOHead title="Family Continuity | FamilyBridge" description="Family-scoped support and follow-through after an intervention conversation." />
      <div className="min-h-screen bg-background">
        <PageHeader
          title="Family continuity"
          subtitle={readiness.familyName || 'Support and follow-through'}
          backTo={`/outcome-predictions${query}`}
          actions={latestOutcomeTag ? <Badge variant="secondary">{outcomeLabels[latestOutcomeTag] || 'Outcome recorded'}</Badge> : undefined}
        />
        <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
          {readiness.loading ? <LoadingState /> : readiness.error ? (
            <AccessUnavailableState message={readiness.error} />
          ) : !readiness.profile ? (
            <Card>
              <CardHeader><CardTitle>No readiness profile yet</CardTitle><CardDescription>Create a family readiness profile before recording continuity milestones.</CardDescription></CardHeader>
              <CardContent><Button asChild><a href={`/intervention-readiness${query}`}>Open readiness profile</a></Button></CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><HeartHandshake className="h-5 w-5 text-primary" /> Care continues under every outcome</CardTitle>
                  <CardDescription>
                    Support the family, confirm real next steps, and respect the other person’s autonomy. A recorded outcome is a point-in-time observation—not proof of what comes next.
                  </CardDescription>
                </CardHeader>
                {!latestOutcomeTag && (
                  <CardContent>
                    <p className="mb-3 text-sm text-muted-foreground">No observed outcome has been recorded yet. You can still plan family support, or record the current outcome first.</p>
                    <Button asChild variant="outline"><a href={`/outcome-predictions${query}`}>Record observed outcome</a></Button>
                  </CardContent>
                )}
              </Card>

              <div className="space-y-3">
                {continuityMilestones.map((milestone) => {
                  const isComplete = completed.has(milestone.id);
                  return (
                    <Card key={milestone.id}>
                      <CardContent className="flex items-start gap-4 p-4">
                        <button
                          type="button"
                          onClick={() => void recordMilestone(milestone.id, milestone.title)}
                          disabled={isComplete || savingId === milestone.id}
                          className="mt-0.5 rounded-full text-primary disabled:cursor-default"
                          aria-label={isComplete ? `${milestone.title} completed` : `Mark ${milestone.title} complete`}
                        >
                          {isComplete ? <Check className="h-6 w-6" /> : <Circle className="h-6 w-6" />}
                        </button>
                        <div>
                          <h2 className="font-medium">{milestone.title}</h2>
                          <p className="mt-1 text-sm text-muted-foreground">{milestone.detail}</p>
                          {isComplete && <p className="mt-2 text-xs font-medium text-primary">Recorded for this family</p>}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Card>
                <CardHeader><CardTitle className="text-lg">Continuity note</CardTitle><CardDescription>Record confirmed follow-through, family needs, or questions for a professional.</CardDescription></CardHeader>
                <CardContent>
                  <form className="space-y-3" onSubmit={saveNote}>
                    <Textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={2000} placeholder="What happened since the last check-in, and what support is needed now?" />
                    <div className="flex justify-end"><Button type="submit" disabled={!note.trim() || savingId === 'note'}>{savingId === 'note' ? 'Saving…' : 'Save note'}</Button></div>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-lg">Continuity history</CardTitle><CardDescription>Recorded milestones and notes, newest first.</CardDescription></CardHeader>
                <CardContent><SignalList signals={continuitySignals} emptyText="No continuity entries have been recorded for this family." /></CardContent>
              </Card>
            </>
          )}
          <SafetyNotice />
        </main>
      </div>
    </>
  );
}
