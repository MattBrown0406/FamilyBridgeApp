import { CheckCircle2, Loader2, ShieldAlert, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { ConsequenceEvent, HoldSlipEventType } from '@/hooks/useConsequenceEvents';

interface BoundaryHoldRitualProps {
  boundaryContent: string;
  lastEvent?: ConsequenceEvent | null;
  saving?: boolean;
  onLog: (eventType: HoldSlipEventType, note?: string) => Promise<boolean> | boolean;
}

export const BoundaryHoldRitual = ({
  boundaryContent,
  lastEvent,
  saving,
  onLog,
}: BoundaryHoldRitualProps) => {
  const [note, setNote] = useState('');
  const [choice, setChoice] = useState<HoldSlipEventType | null>(null);

  const submit = async (eventType: HoldSlipEventType) => {
    setChoice(eventType);
    const ok = await onLog(eventType, note);
    if (ok) {
      setNote('');
      setChoice(null);
    }
  };

  return (
    <div className="mt-3 rounded-lg border border-indigo-200/70 bg-indigo-50/60 p-3 dark:border-indigo-900/40 dark:bg-indigo-950/20">
      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-800 dark:text-indigo-200">
        10-second hold / slip
      </p>
      <p className="mt-1 text-sm text-foreground">
        A boundary without follow-through is a request. Did the family hold this, or slip?
      </p>
      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{boundaryContent}</p>
      {lastEvent && (
        <p className="mt-2 text-xs text-muted-foreground">
          Last logged: {lastEvent.event_type === 'held' ? 'held' : 'slipped'}{' '}
          {new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(lastEvent.created_at))}
          {lastEvent.notes ? ` — ${lastEvent.notes}` : ''}
        </p>
      )}
      <Textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        rows={2}
        className="mt-2"
        placeholder="Optional note (what happened, not surveillance)"
      />
      <div className="mt-2 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={saving}
          className="border-emerald-300 text-emerald-800 hover:bg-emerald-50"
          onClick={() => void submit('held')}
        >
          {saving && choice === 'held' ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-1 h-3.5 w-3.5" />}
          We held it
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={saving}
          className="border-amber-300 text-amber-800 hover:bg-amber-50"
          onClick={() => void submit('slipped')}
        >
          {saving && choice === 'slipped' ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <XCircle className="mr-1 h-3.5 w-3.5" />}
          We slipped
        </Button>
      </div>
      <p className="mt-2 flex items-start gap-1.5 text-[11px] text-muted-foreground">
        <ShieldAlert className="mt-0.5 h-3 w-3 shrink-0" />
        This is family accountability — who followed through — not GPS tracking of a loved one.
      </p>
    </div>
  );
};
