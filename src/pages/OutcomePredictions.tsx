import { useState } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { CalendarCheck, MessageCircle, PauseCircle, Stethoscope } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
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

const outcomeOptions = [
  { id: 'help-accepted', label: 'Help was accepted', icon: Stethoscope, description: 'Record only what was explicitly agreed to; verify actual admission or appointment separately.' },
  { id: 'help-declined', label: 'Help was declined at this time', icon: MessageCircle, description: 'A declined offer is not a forecast. Focus on safety, respectful boundaries, and family support.' },
  { id: 'conversation-paused', label: 'The conversation paused', icon: PauseCircle, description: 'Document why the conversation stopped and any professional guidance about next steps.' },
  { id: 'follow-up-scheduled', label: 'Professional follow-up scheduled', icon: CalendarCheck, description: 'Record the confirmed appointment or contact without assuming what will happen afterward.' },
];

export default function OutcomePredictions() {
  const { familyId: routeFamilyId } = useParams<{ familyId?: string }>();
  const [searchParams] = useSearchParams();
  const familyId = routeFamilyId || searchParams.get('familyId');
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const readiness = useFamilyReadiness(familyId, user?.id);
  const [details, setDetails] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  if (authLoading) return <LoadingState />;
  if (!user) return <Navigate to="/auth" replace />;
  if (!familyId) return <FamilyRequiredState />;

  const query = `?familyId=${encodeURIComponent(familyId)}`;
  const outcomeSignals = readiness.signals.filter((signal) => signal.category_tags.includes('outcome'));

  async function recordOutcome(id: string, label: string) {
    setSavingId(id);
    try {
      const description = details.trim() ? `${label}. ${details.trim()}` : label;
      await readiness.addSignal({
        description,
        tags: ['outcome', `outcome:${id}`, 'observed'],
        sourceType: 'observed_outcome',
      });
      setDetails('');
      toast({ title: 'Observed outcome saved', description: 'No prediction or probability was generated.' });
    } catch (error) {
      toast({ title: 'Could not save outcome', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' });
    } finally {
      setSavingId(null);
    }
  }

  return (
    <>
      <SEOHead title="Observed Outcomes | FamilyBridge" description="Record family-scoped intervention outcomes without predictive claims." />
      <div className="min-h-screen bg-background">
        <PageHeader title="Observed outcomes" subtitle={readiness.familyName || 'Family outcome record'} backTo={`/intervention-execution${query}`} />
        <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
          {readiness.loading ? <LoadingState /> : readiness.error ? (
            <AccessUnavailableState message={readiness.error} />
          ) : !readiness.profile ? (
            <Card>
              <CardHeader><CardTitle>No readiness profile yet</CardTitle><CardDescription>Create a profile for this family before recording outcomes.</CardDescription></CardHeader>
              <CardContent><Button asChild><a href={`/intervention-readiness${query}`}>Open readiness profile</a></Button></CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Record what happened—not what may happen</CardTitle>
                  <CardDescription>
                    FamilyBridge does not calculate treatment-acceptance probability or promise a recovery trajectory. Outcomes can change, and each entry should reflect a direct observation or confirmed event.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={details}
                    onChange={(event) => setDetails(event.target.value)}
                    maxLength={2000}
                    placeholder="Optional factual detail: who confirmed it, when, and what the next agreed step is."
                    aria-label="Observed outcome details"
                  />
                </CardContent>
              </Card>

              <div className="grid gap-4 sm:grid-cols-2">
                {outcomeOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <Card key={option.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg"><Icon className="h-5 w-5 text-primary" />{option.label}</CardTitle>
                        <CardDescription>{option.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => void recordOutcome(option.id, option.label)}
                          disabled={savingId !== null}
                        >
                          {savingId === option.id ? 'Saving…' : 'Record this outcome'}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Card>
                <CardHeader><CardTitle className="text-lg">Outcome history</CardTitle><CardDescription>Confirmed family observations, newest first.</CardDescription></CardHeader>
                <CardContent><SignalList signals={outcomeSignals} emptyText="No outcomes have been recorded for this family." /></CardContent>
              </Card>

              <div className="flex justify-end">
                <Button asChild><a href={`/post-intervention${query}`}>Continue to family continuity</a></Button>
              </div>
            </>
          )}
          <SafetyNotice />
        </main>
      </div>
    </>
  );
}
