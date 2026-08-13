import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type HoldSlipEventType = 'held' | 'slipped';

export interface SlipRepair {
  nextAction: string;
  ownerId: string;
  ownerName: string;
  note?: string;
}

export interface ConsequenceEvent {
  id: string;
  family_id: string;
  boundary_id: string;
  event_type: string;
  logged_by: string;
  notes: string | null;
  created_at: string;
}

const encodeSlipNotes = (repair: SlipRepair) => JSON.stringify({
  ritual: 'repair',
  nextAction: repair.nextAction.trim(),
  ownerId: repair.ownerId,
  ownerName: repair.ownerName,
  note: repair.note?.trim() || null,
});

export function parseSlipRepair(event?: ConsequenceEvent | null): SlipRepair | null {
  if (!event || event.event_type !== 'slipped' || !event.notes) return null;
  try {
    const parsed = JSON.parse(event.notes) as {
      ritual?: string;
      nextAction?: string;
      ownerId?: string;
      ownerName?: string;
      note?: string | null;
    };
    if (parsed?.ritual === 'repair' && parsed.nextAction) {
      return {
        nextAction: parsed.nextAction,
        ownerId: parsed.ownerId || '',
        ownerName: parsed.ownerName || 'Family member',
        note: parsed.note || undefined,
      };
    }
  } catch {
    return { nextAction: event.notes, ownerId: '', ownerName: '', note: undefined };
  }
  return { nextAction: event.notes, ownerId: '', ownerName: '', note: undefined };
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
    options?: { note?: string; repair?: SlipRepair },
  ) => {
    if (!familyId) return false;
    if (eventType === 'slipped' && !options?.repair?.nextAction.trim()) return false;
    setSaving(true);
    const notes = eventType === 'slipped' && options?.repair
      ? encodeSlipNotes(options.repair)
      : options?.note?.trim() || null;
    const { error } = await supabase.from('consequence_events').insert({
      family_id: familyId,
      boundary_id: boundaryId,
      event_type: eventType,
      logged_by: userId,
      notes,
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
