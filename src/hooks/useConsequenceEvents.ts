import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type HoldSlipEventType = 'held' | 'slipped';

export interface ConsequenceEvent {
  id: string;
  family_id: string;
  boundary_id: string;
  event_type: string;
  logged_by: string;
  notes: string | null;
  created_at: string;
}

export const useConsequenceEvents = (familyId?: string) => {
  const [events, setEvents] = useState<ConsequenceEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    if (!familyId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('consequence_events')
      .select('id, family_id, boundary_id, event_type, logged_by, notes, created_at')
      .eq('family_id', familyId)
      .order('created_at', { ascending: false });
    if (!error) setEvents((data ?? []) as ConsequenceEvent[]);
    setLoading(false);
  }, [familyId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logHoldOrSlip = useCallback(async (
    boundaryId: string,
    eventType: HoldSlipEventType,
    userId: string,
    notes?: string,
  ) => {
    if (!familyId) return false;
    setSaving(true);
    const { error } = await supabase.from('consequence_events').insert({
      family_id: familyId,
      boundary_id: boundaryId,
      event_type: eventType,
      logged_by: userId,
      notes: notes?.trim() || null,
    });
    setSaving(false);
    if (error) return false;
    await refresh();
    return true;
  }, [familyId, refresh]);

  const latestForBoundary = useCallback((boundaryId: string) => {
    return events.find((event) => event.boundary_id === boundaryId
      && (event.event_type === 'held' || event.event_type === 'slipped')) ?? null;
  }, [events]);

  return { events, loading, saving, refresh, logHoldOrSlip, latestForBoundary };
};
