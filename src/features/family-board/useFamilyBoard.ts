import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type {
  DecisionResponse,
  FamilyAction,
  FamilyActionPriority,
  FamilyDecision,
  FamilyDecisionAcknowledgement,
  FamilyMeeting,
} from './types';

const boardClient = supabase;

interface CreateActionInput {
  title: string;
  details?: string;
  ownerId: string;
  dueDate: string;
  priority: FamilyActionPriority;
}

interface CreateDecisionInput {
  title: string;
  notes?: string;
  concerns?: string;
  targetDate?: string;
}

export const useFamilyBoard = (familyId: string, userId?: string) => {
  const [actions, setActions] = useState<FamilyAction[]>([]);
  const [decisions, setDecisions] = useState<FamilyDecision[]>([]);
  const [acknowledgements, setAcknowledgements] = useState<FamilyDecisionAcknowledgement[]>([]);
  const [nextMeeting, setNextMeeting] = useState<FamilyMeeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!familyId) return;
    setLoading(true);
    setError(null);

    const [actionsResult, decisionsResult, meetingResult] = await Promise.all([
      boardClient
        .from('family_actions')
        .select('*')
        .eq('family_id', familyId)
        .order('status', { ascending: true })
        .order('due_at', { ascending: true, nullsFirst: false }),
      boardClient
        .from('family_decisions')
        .select('*')
        .eq('family_id', familyId)
        .order('target_at', { ascending: true, nullsFirst: false }),
      supabase
        .from('crm_calendar_events')
        .select('id, title, start_time, end_time')
        .eq('family_id', familyId)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(1)
        .maybeSingle(),
    ]);

    const boardError = actionsResult.error || decisionsResult.error;
    if (boardError) {
      setError(boardError.message || 'The family board could not be loaded.');
    } else {
      const loadedDecisions = (decisionsResult.data ?? []) as FamilyDecision[];
      setActions((actionsResult.data ?? []) as FamilyAction[]);
      setDecisions(loadedDecisions);

      const decisionIds = loadedDecisions.map((decision) => decision.id);
      if (decisionIds.length > 0) {
        const acknowledgementResult = await boardClient
          .from('family_decision_acknowledgements')
          .select('*')
          .in('decision_id', decisionIds);
        if (acknowledgementResult.error) setError(acknowledgementResult.error.message);
        else setAcknowledgements((acknowledgementResult.data ?? []) as FamilyDecisionAcknowledgement[]);
      } else {
        setAcknowledgements([]);
      }
    }

    setNextMeeting(!meetingResult.error && meetingResult.data ? meetingResult.data : null);
    setLoading(false);
  }, [familyId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const runMutation = useCallback(async (operation: () => PromiseLike<{ error: { message: string } | null }>) => {
    setSaving(true);
    setError(null);
    const result = await operation();
    if (result.error) {
      setError(result.error.message || 'The change could not be saved.');
      setSaving(false);
      return false;
    }
    await refresh();
    setSaving(false);
    return true;
  }, [refresh]);

  const createAction = useCallback((input: CreateActionInput) => {
    if (!userId) return Promise.resolve(false);
    return runMutation(() => boardClient.from('family_actions').insert({
      family_id: familyId,
      title: input.title.trim(),
      description: input.details?.trim() || null,
      assigned_to: input.ownerId,
      due_at: new Date(`${input.dueDate}T12:00:00`).toISOString(),
      priority: input.priority,
      created_by: userId,
    }));
  }, [familyId, runMutation, userId]);

  const completeAction = useCallback((actionId: string) => runMutation(() => boardClient
    .from('family_actions')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('family_id', familyId)
    .eq('id', actionId)), [familyId, runMutation]);

  const createDecision = useCallback((input: CreateDecisionInput) => {
    if (!userId) return Promise.resolve(false);
    return runMutation(() => boardClient.from('family_decisions').insert({
      family_id: familyId,
      title: input.title.trim(),
      context: input.notes?.trim() || null,
      concerns: input.concerns?.trim() || null,
      target_at: input.targetDate ? new Date(`${input.targetDate}T12:00:00`).toISOString() : null,
      options: [],
      created_by: userId,
    }));
  }, [familyId, runMutation, userId]);

  const respondToDecision = useCallback((decisionId: string, response: DecisionResponse, note?: string) => {
    if (!userId) return Promise.resolve(false);
    return runMutation(() => boardClient.from('family_decision_acknowledgements').upsert({
      decision_id: decisionId,
      user_id: userId,
      acknowledgement: response,
      comment: note?.trim() || null,
    }, { onConflict: 'decision_id,user_id' }));
  }, [runMutation, userId]);

  const openActions = useMemo(() => actions.filter((action) => !['completed', 'cancelled'].includes(action.status)), [actions]);
  const openDecisions = useMemo(
    () => decisions.filter((decision) => decision.status === 'proposed'),
    [decisions],
  );

  return {
    actions,
    openActions,
    decisions,
    openDecisions,
    acknowledgements,
    nextMeeting,
    loading,
    saving,
    error,
    refresh,
    createAction,
    completeAction,
    createDecision,
    respondToDecision,
  };
};
