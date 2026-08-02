import { useState, type FormEvent } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { ClipboardList, Plus } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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

const observationPrompts = [
  'What was said or done, using neutral and specific language?',
  'What changed from the family’s usual pattern?',
  'Was a qualified professional contacted, and what did they advise?',
  'What support does the family need regardless of the other person’s decision?',
];

export default function InterventionReadiness() {
  const { familyId: routeFamilyId } = useParams<{ familyId?: string }>();
  const [searchParams] = useSearchParams();
  const familyId = routeFamilyId || searchParams.get('familyId');
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const readiness = useFamilyReadiness(familyId, user?.id);
  const [clientName, setClientName] = useState('');
  const [observation, setObservation] = useState('');
  const [saving, setSaving] = useState(false);

  if (authLoading) return <LoadingState />;
  if (!user) return <Navigate to="/auth" replace />;
  if (!familyId) return <FamilyRequiredState />;

  const query = `?familyId=${encodeURIComponent(familyId)}`;

  async function handleCreateProfile(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await readiness.createProfile(clientName);
      setClientName('');
      toast({ title: 'Family readiness profile created', description: 'You can now record direct observations for this family.' });
    } catch (error) {
      toast({
        title: 'Could not create profile',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleAddObservation(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await readiness.addSignal({ description: observation, tags: ['readiness', 'observation'] });
      setObservation('');
      toast({ title: 'Observation saved', description: 'It was added to this family’s record.' });
    } catch (error) {
      toast({
        title: 'Could not save observation',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <SEOHead
        title="Intervention Readiness | FamilyBridge"
        description="Family-scoped observations and compassionate intervention planning guidance."
      />
      <div className="min-h-screen bg-background">
        <PageHeader title="Intervention readiness" subtitle={readiness.familyName || 'Family planning record'} backTo="/dashboard" />
        <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
          {readiness.loading ? (
            <LoadingState />
          ) : readiness.error ? (
            <AccessUnavailableState message={readiness.error} />
          ) : !readiness.profile ? (
            <Card>
              <CardHeader>
                <CardTitle>Create a private planning profile</CardTitle>
                <CardDescription>
                  Name the person or situation your family is planning around. This creates a real record for {readiness.familyName}; it does not generate a readiness score or predict treatment acceptance.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleCreateProfile}>
                  <Input
                    value={clientName}
                    onChange={(event) => setClientName(event.target.value)}
                    placeholder="Profile name"
                    maxLength={120}
                    aria-label="Readiness profile name"
                  />
                  <Button type="submit" disabled={saving || !clientName.trim()}>
                    <Plus className="mr-2 h-4 w-4" /> Create profile
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>{readiness.profile.client_name}</CardTitle>
                  <CardDescription>
                    Record only what family members directly observed. A pattern may help a professional ask better questions, but it cannot establish another person’s intentions or future choices.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-3" onSubmit={handleAddObservation}>
                    <Textarea
                      value={observation}
                      onChange={(event) => setObservation(event.target.value)}
                      placeholder="Example: They asked for the counselor’s phone number during Tuesday’s conversation."
                      maxLength={2000}
                      aria-label="Direct family observation"
                    />
                    <div className="flex justify-end">
                      <Button type="submit" disabled={saving || !observation.trim()}>
                        {saving ? 'Saving…' : 'Save observation'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Observation prompts</CardTitle>
                    <CardDescription>Separate facts from interpretation.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 text-sm">
                      {observationPrompts.map((prompt) => <li key={prompt} className="flex gap-2"><ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{prompt}</li>)}
                    </ul>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Compassionate next steps</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <p>Discuss observations with a licensed clinician or experienced intervention professional who understands the full context.</p>
                    <p>Plan language that is specific, respectful, and free of threats. The person may accept, decline, or ask for time.</p>
                    <p>Prepare support for family members and practical safety steps that remain useful under any outcome.</p>
                    <Button asChild className="mt-2"><a href={`/intervention-execution${query}`}>Open family planning checklist</a></Button>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recorded observations</CardTitle>
                  <CardDescription>Newest first. These entries are descriptive, not predictive.</CardDescription>
                </CardHeader>
                <CardContent><SignalList signals={readiness.signals} /></CardContent>
              </Card>
            </>
          )}
          <SafetyNotice />
        </main>
      </div>
    </>
  );
}
