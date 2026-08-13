import { CheckCircle2, Loader2, RefreshCw, ShieldAlert, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { parseSlipRepair, type ConsequenceEvent, type HoldSlipEventType, type SlipRepair } from '@/hooks/useConsequenceEvents';

interface FamilyMemberOption {
  user_id: string;
  full_name: string;
}

interface BoundaryHoldRitualProps {
  boundaryContent: string;
  lastEvent?: ConsequenceEvent | null;
  saving?: boolean;
  members?: FamilyMemberOption[];
  onLog: (
    eventType: HoldSlipEventType,
    options?: { note?: string; repair?: SlipRepair },
  ) => Promise<boolean> | boolean;
}

export const BoundaryHoldRitual = ({
  boundaryContent,
  lastEvent,
  saving,
  members = [],
  onLog,
}: BoundaryHoldRitualProps) => {
  const [note, setNote] = useState('');
  const [choice, setChoice] = useState<HoldSlipEventType | null>(null);
  const [nextAction, setNextAction] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const lastRepair = parseSlipRepair(lastEvent);

  const reset = () => {
    setNote('');
    setChoice(null);
    setNextAction('');
    setOwnerId('');
  };

  const submitHeld = async () => {
    setChoice('held');
    const ok = await onLog('held', { note });
    if (ok) reset();
  };

  const submitSlip = async () => {
    const owner = members.find((member) => member.user_id === ownerId);
    if (!nextAction.trim() || !owner) return;
    setChoice('slipped');
    const ok = await onLog('slipped', {
      repair: {
        nextAction: nextAction.trim(),
        ownerId: owner.user_id,
        ownerName: owner.full_name,
        note: note.trim() || undefined,
      },
    });
    if (ok) reset();
  };

  return (
    <div className="mt-3 rounded-lg border border-indigo-200/70 bg-indigo-50/60 p-3 dark:border-indigo-900/40 dark:bg-indigo-950/20">
      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-800 dark:text-indigo-200">
        Hold / slip
      </p>
      <p className="mt-1 text-sm text-foreground">
        A boundary without follow-through is a request. Did the family hold this, or slip?
      </p>
      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{boundaryContent}</p>
      {lastEvent && (
        <div className="mt-2 text-xs text-muted-foreground">
          <p>
            Last logged: {lastEvent.event_type === 'held' ? 'held' : 'slipped'}{' '}
            {new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(lastEvent.created_at))}
          </p>
          {lastRepair && (
            <p className="mt-1">
              Repair: {lastRepair.nextAction}
              {lastRepair.ownerName ? ` · Owner: ${lastRepair.ownerName}` : ''}
              {lastRepair.note ? ` · ${lastRepair.note}` : ''}
            </p>
          )}
        </div>
      )}

      {choice !== 'slipped' ? (
        <>
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={2}
            className="mt-2"
            placeholder="Optional note (what happened — not surveillance)"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={saving}
              className="border-emerald-300 text-emerald-800 hover:bg-emerald-50"
              onClick={() => void submitHeld()}
            >
              {saving && choice === 'held' ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-1 h-3.5 w-3.5" />}
              We held it
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={saving}
              className="border-amber-300 text-amber-800 hover:bg-amber-50"
              onClick={() => setChoice('slipped')}
            >
              <XCircle className="mr-1 h-3.5 w-3.5" />
              We slipped
            </Button>
          </div>
        </>
      ) : (
        <div className="mt-3 space-y-2 rounded-md border border-amber-200 bg-background/80 p-3">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <RefreshCw className="h-3.5 w-3.5" />
            Repair / reset — not punishment
          </p>
          <p className="text-xs text-muted-foreground">
            Name what the family will do next time, and who owns that step. This is accountability, not GPS.
          </p>
          <div>
            <Label htmlFor="slip-next" className="text-xs">What we will do next time</Label>
            <Textarea
              id="slip-next"
              value={nextAction}
              onChange={(event) => setNextAction(event.target.value)}
              rows={2}
              className="mt-1"
              placeholder="e.g. Pause 10 minutes, text the group, and do not send money tonight"
              required
            />
          </div>
          <div>
            <Label htmlFor="slip-owner" className="text-xs">Who owns that next step</Label>
            <select
              id="slip-owner"
              value={ownerId}
              onChange={(event) => setOwnerId(event.target.value)}
              required
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Choose a family member</option>
              {members.map((member) => (
                <option key={member.user_id} value={member.user_id}>{member.full_name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="slip-note" className="text-xs">Optional note</Label>
            <Textarea
              id="slip-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={2}
              className="mt-1"
              placeholder="What happened, without shaming anyone"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={saving || !nextAction.trim() || !ownerId}
              onClick={() => void submitSlip()}
            >
              {saving ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-1 h-3.5 w-3.5" />}
              Save repair
            </Button>
            <Button size="sm" variant="ghost" disabled={saving} onClick={() => setChoice(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
      <p className="mt-2 flex items-start gap-1.5 text-[11px] text-muted-foreground">
        <ShieldAlert className="mt-0.5 h-3 w-3 shrink-0" />
        Family accountability — who followed through, and what we do next — not GPS tracking of a loved one.
      </p>
    </div>
  );
};
