import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { EnablingResultType, EnablingTriggerType } from '@/lib/enablingExercise';
import { countEnablingAnswers, getEnablingResult } from '@/lib/enablingExercise';

export interface EnablingCheckRow {
  id: string;
  family_id: string;
  user_id: string;
  trigger_type: EnablingTriggerType;
  related_request_id: string | null;
  related_boundary_id: string | null;
  answers: Record<string, string>;
  enabling_count: number;
  total_questions: number;
  result_type: EnablingResultType;
  created_at: string;
}

interface SaveEnablingCheckInput {
  familyId: string;
  userId: string;
  triggerType: EnablingTriggerType;
  answers: Record<number, string>;
  relatedRequestId?: string | null;
  relatedBoundaryId?: string | null;
}

export async function saveEnablingCheck(input: SaveEnablingCheckInput) {
  const numericAnswers = input.answers;
  const enablingCount = countEnablingAnswers(numericAnswers);
  const total = Object.keys(numericAnswers).length;
  const result = getEnablingResult(numericAnswers);
  const { data, error } = await supabase
    .from('enabling_checks')
    .insert({
      family_id: input.familyId,
      user_id: input.userId,
      trigger_type: input.triggerType,
      related_request_id: input.relatedRequestId ?? null,
      related_boundary_id: input.relatedBoundaryId ?? null,
      answers: numericAnswers,
      enabling_count: enablingCount,
      total_questions: total,
      result_type: result.type,
    })
    .select('id')
    .maybeSingle();
  if (error) throw error;
  return { id: data?.id as string | undefined, result };
}

export const useEnablingChecks = (familyId?: string) => {
  const [checks, setChecks] = useState<EnablingCheckRow[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!familyId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('enabling_checks')
      .select('*')
      .eq('family_id', familyId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (!error) setChecks((data ?? []) as EnablingCheckRow[]);
    setLoading(false);
  }, [familyId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { checks, loading, refresh };
};
