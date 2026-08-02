/* eslint-disable react-refresh/only-export-components */
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { AlertTriangle, ArrowLeft, Loader2, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export type ReadinessProfile = {
  id: string;
  family_id: string;
  client_name: string;
  case_status: string;
  summary: string | null;
  updated_at: string;
};

export type ReadinessSignal = {
  id: string;
  description: string;
  category_tags: string[];
  source_type: string;
  created_at: string;
  created_by: string;
};

type AddSignalInput = {
  description: string;
  tags?: string[];
  sourceType?: string;
};

export function useFamilyReadiness(familyId: string | null, userId?: string) {
  const [familyName, setFamilyName] = useState('');
  const [profile, setProfile] = useState<ReadinessProfile | null>(null);
  const [signals, setSignals] = useState<ReadinessSignal[]>([]);
  const [loading, setLoading] = useState(Boolean(familyId && userId));
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!familyId || !userId) {
      setFamilyName('');
      setProfile(null);
      setSignals([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const [familyResult, profileResult] = await Promise.all([
      supabase.from('families').select('name').eq('id', familyId).maybeSingle(),
      supabase
        .from('intervention_readiness_profiles')
        .select('id, family_id, client_name, case_status, summary, updated_at')
        .eq('family_id', familyId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (familyResult.error || profileResult.error || !familyResult.data) {
      setFamilyName('');
      setProfile(null);
      setSignals([]);
      setError('This family planning record is unavailable. Return to the dashboard and choose a family you can access.');
      setLoading(false);
      return;
    }

    setFamilyName(familyResult.data.name);
    const nextProfile = profileResult.data as ReadinessProfile | null;
    setProfile(nextProfile);

    if (!nextProfile) {
      setSignals([]);
      setLoading(false);
      return;
    }

    const signalResult = await supabase
      .from('intervention_signals')
      .select('id, description, category_tags, source_type, created_at, created_by')
      .eq('family_id', familyId)
      .eq('profile_id', nextProfile.id)
      .order('created_at', { ascending: false });

    if (signalResult.error) {
      setSignals([]);
      setError('The family profile loaded, but its observations could not be loaded. Please try again.');
    } else {
      setSignals((signalResult.data || []) as ReadinessSignal[]);
    }
    setLoading(false);
  }, [familyId, userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createProfile = useCallback(
    async (clientName: string) => {
      if (!familyId || !userId) throw new Error('Choose a family before creating a profile.');
      const name = clientName.trim();
      if (!name) throw new Error('Enter the name your family uses for this planning profile.');

      const { data, error: insertError } = await supabase
        .from('intervention_readiness_profiles')
        .insert({ family_id: familyId, client_name: name, created_by: userId })
        .select('id, family_id, client_name, case_status, summary, updated_at')
        .single();

      if (insertError) throw insertError;
      const nextProfile = data as ReadinessProfile;
      setProfile(nextProfile);
      setSignals([]);
      return nextProfile;
    },
    [familyId, userId],
  );

  const addSignal = useCallback(
    async ({ description, tags = [], sourceType = 'family_observation' }: AddSignalInput) => {
      if (!familyId || !userId || !profile) throw new Error('Create the family readiness profile first.');
      const text = description.trim();
      if (!text) throw new Error('Describe what was directly observed.');

      const { data, error: insertError } = await supabase
        .from('intervention_signals')
        .insert({
          family_id: familyId,
          profile_id: profile.id,
          created_by: userId,
          description: text,
          category_tags: tags,
          impact_direction: 'neutral',
          source_type: sourceType,
        })
        .select('id, description, category_tags, source_type, created_at, created_by')
        .single();

      if (insertError) throw insertError;
      const nextSignal = data as ReadinessSignal;
      setSignals((current) => [nextSignal, ...current]);
      return nextSignal;
    },
    [familyId, profile, userId],
  );

  return { familyName, profile, signals, loading, error, refresh, createProfile, addSignal };
}

export function FamilyRequiredState() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-xl">Choose a family first</CardTitle>
          <CardDescription>
            This page only shows records for a family you explicitly select. No sample or demo family data is displayed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link to="/dashboard">Return to dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function AccessUnavailableState({ message }: { message: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Family record unavailable</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      <CardContent className="flex gap-2">
        <Button asChild><Link to="/dashboard">Return to dashboard</Link></Button>
      </CardContent>
    </Card>
  );
}

export function LoadingState() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <Loader2 className="h-7 w-7 animate-spin text-primary" aria-label="Loading family record" />
    </div>
  );
}

export function SafetyNotice() {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
        <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
        <p>
          If there is immediate danger or a suspected overdose, call <strong>911</strong>. For crisis support, call or text <strong>988</strong>.
        </p>
      </div>
      <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-4 text-xs text-muted-foreground">
        <Shield className="h-4 w-4 shrink-0" />
        <p>
          These pages organize family observations and follow-through. They do not diagnose, predict a person’s choices, or replace clinical, legal, or emergency judgment. Respect autonomy and involve qualified local professionals.
        </p>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, backTo, actions }: { title: string; subtitle: string; backTo: string; actions?: ReactNode }) {
  return (
    <div className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Button asChild variant="ghost" size="icon" aria-label="Go back">
            <Link to={backTo}><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold">{title}</h1>
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        {actions}
      </div>
    </div>
  );
}

export function SignalList({ signals, emptyText = 'No observations have been recorded yet.' }: { signals: ReadinessSignal[]; emptyText?: string }) {
  if (!signals.length) return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  return (
    <div className="space-y-3">
      {signals.map((signal) => (
        <div key={signal.id} className="rounded-lg border p-3">
          <p className="text-sm whitespace-pre-wrap">{signal.description}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {new Date(signal.created_at).toLocaleString()} {signal.category_tags.length ? `• ${signal.category_tags.join(' · ')}` : ''}
          </p>
        </div>
      ))}
    </div>
  );
}
