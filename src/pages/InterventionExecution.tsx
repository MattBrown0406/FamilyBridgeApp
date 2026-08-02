import { useState, type FormEvent } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { Check, Circle, Users } from 'lucide-react';
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
  useFamilyReadiness,
} from '@/features/readiness/familyReadiness';

const milestones = [
  { id: 'professional-consulted', title: 'Qualified professional consulted', detail: 'Confirm who is advising the family and how to reach them. Follow their clinical and safety guidance.' },
  { id: 'supportive-language', title: 'Respectful language agreed', detail: 'Use first-person statements, specific observations, and a clear offer of help. Avoid humiliation, threats, or guarantees.' },
  { id: 'roles-confirmed', title: 'Family roles confirmed', detail: 'Choose a facilitator, a practical logistics contact, and someone focused on family emotional support.' },
  { id: 'options-verified', title: 'Care options verified', detail: 'Verify availability, cost, admission requirements, transportation, and what consent is required before making promises.' },
  { id: 'safety-reviewed', title: 'Safety plan reviewed', detail: 'Identify when to pause, leave, or call emergency services. Do not ask family members to manage unsafe behavior alone.' },
  { id: 'follow-up-planned', title: 'Follow-up planned for every response', detail: 'Prepare compassionate next steps if help is accepted, declined, or the conversation needs to pause.' },
];

export default function InterventionExecution() {
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
  const completed = new Set(
    readiness.signals.flatMap((signal) => signal.category_tags.filter((tag) => tag.startsWith('execution:')).map((tag) => tag.slice(10))),
  );

  async function recordMilestone(id: string, title: string) {
    if (completed.has(id)) return;
    setSavingId(id);
    try {
      await readiness.addSignal({
        description: `Planning milestone completed: ${title}`,
        tags: ['execution', `execution:${id}`, 'milestone'],
        sourceType: 'family_milestone',
      });
      toast({ title: 'Milestone saved', description: 'This completion is now part of the selected family’s record.' });
    } catch (error) {
      toast({ title: 'Could not save milestone', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' });
    } finally {
      setSavingId(null);
    }
  }

  async function savePlanningNote(event: FormEvent) {
    event.preventDefault();
    setSavingId('note');
    try {
      await readiness.addSignal({ description: note, tags: ['execution', 'planning-note'], sourceType: 'family_planning_note' });
      setNote('');
      toast({ title: 'Planning note saved' });
    } catch (error) {
      toast({ title: 'Could not save note', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' });
    } finally {
      setSavingId(null);
    }
  }

  return (
    <>
      <SEOHead title="Intervention Planning | FamilyBridge" description="A family-scoped, non-coercive intervention planning checklist." />
      <div className="min-h-screen bg-background">
        <PageHeader
          title="Intervention planning"
          subtitle={readiness.familyName || 'Family planning checklist'}
          backTo={`/intervention-readiness${query}`}
          actions={readiness.profile ? <Badge variant="secondary">{completed.size}/{milestones.length} recorded</Badge> : undefined}
        />
        <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
          {readiness.loading ? <LoadingState /> : readiness.error ? (
            <AccessUnavailableState message={readiness.error} />
          ) : !readiness.profile ? (
            <Card>
              <CardHeader>
                <CardTitle>Start with the family readiness profile</CardTitle>
                <CardDescription>This checklist stores milestones in the selected family’s real readiness record. Create that record before planning here.</CardDescription>
              </CardHeader>
              <CardContent><Button asChild><a href={`/intervention-readiness${query}`}>Open readiness profile</a></Button></CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Plan for conversation, not compliance</CardTitle>
                  <CardDescription>
                    This checklist does not indicate whether a person will accept help or when they may decide. Coordinate with a qualified professional, protect everyone’s safety, and leave room for autonomy.
                  </CardDescription>
                </CardHeader>
              </Card>

              <div className="space-y-3">
                {milestones.map((milestone) => {
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
                        <div className="min-w-0">
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
                <CardHeader><CardTitle className="text-lg">Family planning note</CardTitle><CardDescription>Record decisions, open questions, or professional guidance without speculating about another person’s motives.</CardDescription></CardHeader>
                <CardContent>
                  <form className="space-y-3" onSubmit={savePlanningNote}>
                    <Textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={2000} placeholder="What was decided, by whom, and what still needs confirmation?" />
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button type="submit" variant="outline" disabled={!note.trim() || savingId === 'note'}>{savingId === 'note' ? 'Saving…' : 'Save note'}</Button>
                      <Button asChild><a href={`/outcome-predictions${query}`}>Record an observed outcome</a></Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </>
          )}
          <SafetyNotice />
        </main>
      </div>
    </>
  );
}
