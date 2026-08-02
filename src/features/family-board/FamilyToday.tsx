import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  Clock3,
  Loader2,
  MessageSquareText,
  PhoneCall,
  Plus,
  RefreshCw,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ProfessionalAccessPanel } from '@/features/professional-access/ProfessionalAccessPanel';
import { HandoffAuthorizationPanel } from '@/features/professional-access/HandoffAuthorizationPanel';
import { useFamilyBoard } from './useFamilyBoard';
import type { DecisionResponse, FamilyBoardMember } from './types';

interface FamilyTodayProps {
  familyId: string;
  familyName?: string;
  journeyStage?: string | null;
  members: FamilyBoardMember[];
  currentUserId?: string;
  canManageAccess?: boolean;
  canManageWork?: boolean;
  canCreateActions?: boolean;
  canCreateDecisions?: boolean;
  canRespondToDecisions?: boolean;
}

const localDate = (value: string | null | undefined) => {
  if (!value) return 'No date set';
  const dateOnly = value.match(/^\d{4}-\d{2}-\d{2}$/);
  const parsed = dateOnly ? new Date(`${value}T12:00:00`) : new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: parsed.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  }).format(parsed);
};

const meetingDate = (value: string) => new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
}).format(new Date(value));

const isOverdue = (dueDate: string | null | undefined) => {
  if (!dueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dueDate).getTime() < today.getTime();
};

export const FamilyToday = ({
  familyId, familyName, journeyStage, members, currentUserId,
  canManageAccess = false, canManageWork = false, canCreateActions = true,
  canCreateDecisions = true, canRespondToDecisions = true,
}: FamilyTodayProps) => {
  const board = useFamilyBoard(familyId, currentUserId);
  const [actionFormOpen, setActionFormOpen] = useState(false);
  const [decisionFormOpen, setDecisionFormOpen] = useState(false);
  const [actionTitle, setActionTitle] = useState('');
  const [actionDetails, setActionDetails] = useState('');
  const [actionOwner, setActionOwner] = useState('');
  const [actionDueDate, setActionDueDate] = useState('');
  const [actionUrgent, setActionUrgent] = useState(false);
  const [decisionTitle, setDecisionTitle] = useState('');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [decisionConcerns, setDecisionConcerns] = useState('');
  const [decisionTargetDate, setDecisionTargetDate] = useState('');
  const [concernDecisionId, setConcernDecisionId] = useState<string | null>(null);
  const [concernNote, setConcernNote] = useState('');

  const ownerName = (ownerId: string | null) => ownerId
    ? members.find((member) => member.user_id === ownerId)?.full_name || 'Assigned family member'
    : 'Unassigned';
  const orderedActions = useMemo(() => [...board.openActions].sort((left, right) => {
    const leftRank = isOverdue(left.due_at) ? 0 : left.priority === 'high' ? 1 : 2;
    const rightRank = isOverdue(right.due_at) ? 0 : right.priority === 'high' ? 1 : 2;
    return leftRank - rightRank || (left.due_at || '9999').localeCompare(right.due_at || '9999');
  }), [board.openActions]);
  const nextAction = orderedActions[0];
  const canCompleteAction = (createdBy: string, assignedTo: string | null) => Boolean(
    currentUserId && (canManageWork || createdBy === currentUserId || assignedTo === currentUserId),
  );

  const submitAction = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!actionTitle.trim() || !actionOwner || !actionDueDate) return;
    const saved = await board.createAction({
      title: actionTitle,
      details: actionDetails,
      ownerId: actionOwner,
      dueDate: actionDueDate,
      priority: actionUrgent ? 'high' : 'medium',
    });
    if (saved) {
      setActionTitle('');
      setActionDetails('');
      setActionOwner('');
      setActionDueDate('');
      setActionUrgent(false);
      setActionFormOpen(false);
    }
  };

  const submitDecision = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!decisionTitle.trim()) return;
    const saved = await board.createDecision({
      title: decisionTitle,
      notes: decisionNotes,
      concerns: decisionConcerns,
      targetDate: decisionTargetDate,
    });
    if (saved) {
      setDecisionTitle('');
      setDecisionNotes('');
      setDecisionConcerns('');
      setDecisionTargetDate('');
      setDecisionFormOpen(false);
    }
  };

  const respond = async (decisionId: string, response: DecisionResponse, note?: string) => {
    const saved = await board.respondToDecision(decisionId, response, note);
    if (saved) {
      setConcernDecisionId(null);
      setConcernNote('');
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-3 overflow-y-auto pb-8 sm:space-y-4">
      <section className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Family Today</p>
            <h2 className="mt-1 text-xl font-semibold sm:text-2xl">{familyName || 'Your family command center'}</h2>
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Journey stage:</span>
              <Badge variant="secondary">{journeyStage || 'Getting started'}</Badge>
            </div>
          </div>
          {board.nextMeeting && (
            <div className="rounded-xl border bg-background/80 px-3 py-2 text-sm sm:max-w-xs">
              <p className="flex items-center gap-1.5 font-medium"><CalendarDays className="h-4 w-4 text-primary" /> Next meeting</p>
              <p className="mt-1 truncate">{board.nextMeeting.title}</p>
              <p className="text-xs text-muted-foreground">{meetingDate(board.nextMeeting.start_time)}</p>
            </div>
          )}
        </div>
      </section>

      {board.error && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div className="flex-1">
            <p className="font-medium">The shared board is unavailable</p>
            <p className="text-muted-foreground">{board.error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void board.refresh()}><RefreshCw className="mr-1 h-3.5 w-3.5" />Retry</Button>
        </div>
      )}

      {board.loading ? (
        <div className="flex min-h-40 items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading today’s family plan…
        </div>
      ) : (
        <>
          <Card className="border-primary/30 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base"><ClipboardCheck className="h-5 w-5 text-primary" /> One clear next action</CardTitle>
            </CardHeader>
            <CardContent>
              {nextAction ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{nextAction.title}</p>
                      {isOverdue(nextAction.due_at) && <Badge variant="destructive">Overdue</Badge>}
                      {!isOverdue(nextAction.due_at) && nextAction.priority === 'high' && <Badge className="bg-amber-500 text-white">Urgent</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">Owner: {ownerName(nextAction.assigned_to)} · Due {localDate(nextAction.due_at)}</p>
                    {nextAction.description && <p className="mt-2 text-sm">{nextAction.description}</p>}
                  </div>
                  {canCompleteAction(nextAction.created_by, nextAction.assigned_to) && (
                    <Button disabled={board.saving} onClick={() => void board.completeAction(nextAction.id)}>
                      <Check className="mr-2 h-4 w-4" /> Mark complete
                    </Button>
                  )}
                </div>
              ) : (
                <div className="py-2 text-sm text-muted-foreground">No open action yet. Add the single next step your family can move forward today.</div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-3 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-base"><Clock3 className="h-5 w-5 text-primary" /> Action board <Badge variant="secondary">{orderedActions.length} open</Badge></CardTitle>
                  {canCreateActions && <Button size="sm" variant="outline" onClick={() => setActionFormOpen((open) => !open)}><Plus className="mr-1 h-4 w-4" />Action</Button>}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Collapsible open={actionFormOpen} onOpenChange={setActionFormOpen}>
                  <CollapsibleContent>
                    <form onSubmit={submitAction} className="mb-4 space-y-3 rounded-xl border bg-muted/30 p-3">
                      <div><Label htmlFor="action-title">Action</Label><Input id="action-title" value={actionTitle} onChange={(event) => setActionTitle(event.target.value)} placeholder="What needs to happen?" required /></div>
                      <div><Label htmlFor="action-details">Details (optional)</Label><Textarea id="action-details" value={actionDetails} onChange={(event) => setActionDetails(event.target.value)} rows={2} /></div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div><Label htmlFor="action-owner">Owner</Label><select id="action-owner" value={actionOwner} onChange={(event) => setActionOwner(event.target.value)} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="">Choose owner</option>{members.map((member) => <option key={member.user_id} value={member.user_id}>{member.full_name}</option>)}</select></div>
                        <div><Label htmlFor="action-due">Due date</Label><Input id="action-due" type="date" value={actionDueDate} onChange={(event) => setActionDueDate(event.target.value)} required /></div>
                      </div>
                      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={actionUrgent} onChange={(event) => setActionUrgent(event.target.checked)} className="h-4 w-4" /> Mark urgent</label>
                      <Button type="submit" disabled={board.saving || !actionTitle.trim() || !actionOwner || !actionDueDate}>{board.saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save action</Button>
                    </form>
                  </CollapsibleContent>
                </Collapsible>
                {orderedActions.length === 0 ? <p className="py-5 text-center text-sm text-muted-foreground">No open actions.</p> : orderedActions.map((action) => (
                  <div key={action.id} className="rounded-xl border p-3">
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5"><p className="font-medium">{action.title}</p>{isOverdue(action.due_at) && <Badge variant="destructive" className="text-[10px]">Overdue</Badge>}{!isOverdue(action.due_at) && action.priority === 'high' && <Badge className="bg-amber-500 text-[10px] text-white">Urgent</Badge>}</div>
                        <p className="mt-1 text-xs text-muted-foreground">{ownerName(action.assigned_to)} · {localDate(action.due_at)}</p>
                      </div>
                      {canCompleteAction(action.created_by, action.assigned_to) && (
                        <Button aria-label={`Complete ${action.title}`} size="icon" variant="ghost" disabled={board.saving} onClick={() => void board.completeAction(action.id)}><CheckCircle2 className="h-5 w-5 text-emerald-600" /></Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-base"><MessageSquareText className="h-5 w-5 text-primary" /> Next decisions <Badge variant="secondary">{board.openDecisions.length}</Badge></CardTitle>
                  {canCreateDecisions && <Button size="sm" variant="outline" onClick={() => setDecisionFormOpen((open) => !open)}><Plus className="mr-1 h-4 w-4" />Decision</Button>}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Collapsible open={decisionFormOpen} onOpenChange={setDecisionFormOpen}>
                  <CollapsibleContent>
                    <form onSubmit={submitDecision} className="mb-4 space-y-3 rounded-xl border bg-muted/30 p-3">
                      <div><Label htmlFor="decision-title">Decision needed</Label><Input id="decision-title" value={decisionTitle} onChange={(event) => setDecisionTitle(event.target.value)} placeholder="What does the family need to decide?" required /></div>
                      <div><Label htmlFor="decision-notes">Notes</Label><Textarea id="decision-notes" value={decisionNotes} onChange={(event) => setDecisionNotes(event.target.value)} rows={2} /></div>
                      <div><Label htmlFor="decision-concerns">Known concerns</Label><Textarea id="decision-concerns" value={decisionConcerns} onChange={(event) => setDecisionConcerns(event.target.value)} rows={2} /></div>
                      <div><Label htmlFor="decision-target">Target date (optional)</Label><Input id="decision-target" type="date" value={decisionTargetDate} onChange={(event) => setDecisionTargetDate(event.target.value)} /></div>
                      <Button type="submit" disabled={board.saving || !decisionTitle.trim()}>{board.saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save decision</Button>
                    </form>
                  </CollapsibleContent>
                </Collapsible>
                {board.openDecisions.length === 0 ? <p className="py-5 text-center text-sm text-muted-foreground">No decisions waiting for the family.</p> : board.openDecisions.map((decision) => {
                  const myResponse = board.acknowledgements.find((item) => item.decision_id === decision.id && item.user_id === currentUserId);
                  return (
                    <div key={decision.id} className="rounded-xl border p-3">
                      <div className="flex items-start justify-between gap-2"><p className="font-medium">{decision.title}</p>{decision.target_at && <Badge variant="outline">By {localDate(decision.target_at)}</Badge>}</div>
                      {decision.context && <p className="mt-2 text-sm text-muted-foreground">{decision.context}</p>}
                      {decision.concerns && <p className="mt-2 flex items-start gap-1.5 text-sm text-amber-700 dark:text-amber-400"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{decision.concerns}</p>}
                      {myResponse && <p className="mt-2 text-xs font-medium text-primary">Your response: {myResponse.acknowledgement.replace(/_/g, ' ')}</p>}
                      {canRespondToDecisions && <div className="mt-3 flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" disabled={board.saving} onClick={() => void respond(decision.id, 'acknowledged')}>Acknowledge</Button>
                        <Button size="sm" variant="outline" disabled={board.saving} onClick={() => void respond(decision.id, 'agree')}><Check className="mr-1 h-3.5 w-3.5" />Agree</Button>
                        <Button size="sm" variant="outline" disabled={board.saving} onClick={() => setConcernDecisionId(concernDecisionId === decision.id ? null : decision.id)}><AlertTriangle className="mr-1 h-3.5 w-3.5" />Concern</Button>
                      </div>}
                      {canRespondToDecisions && concernDecisionId === decision.id && <div className="mt-3 space-y-2"><Label htmlFor={`concern-${decision.id}`}>Share your concern</Label><Textarea id={`concern-${decision.id}`} value={concernNote} onChange={(event) => setConcernNote(event.target.value)} rows={2} /><Button size="sm" disabled={board.saving || !concernNote.trim()} onClick={() => void respond(decision.id, 'needs_discussion', concernNote)}>Save concern</Button></div>}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <HandoffAuthorizationPanel
        currentUserId={currentUserId}
        fullName={members.find((member) => member.user_id === currentUserId)?.full_name}
      />

      {canManageAccess && <ProfessionalAccessPanel familyId={familyId} />}

      <aside className="sticky bottom-2 z-10 rounded-xl border border-red-300 bg-red-50 p-3 text-red-950 shadow-lg dark:border-red-900 dark:bg-red-950 dark:text-red-50" aria-label="Crisis help">
        <div className="flex items-start gap-3">
          <PhoneCall className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold">Immediate crisis or overdose?</p>
            <p>Call <a className="font-bold underline" href="tel:911">911</a> now for immediate danger or a suspected overdose. Give naloxone if available and follow the dispatcher’s instructions. For suicide or mental health crisis support, call or text <a className="font-bold underline" href="tel:988">988</a>.</p>
          </div>
        </div>
      </aside>
    </div>
  );
};
