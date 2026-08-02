import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowRight, CalendarClock, CheckCircle2, ClipboardList, Loader2, RefreshCw, Users } from "lucide-react";

export interface ProfessionalHubFamily {
  id: string;
  name: string;
  journey_stage?: string | null;
}

interface ProfessionalCommandCenterProps {
  organizationId: string;
  families: ProfessionalHubFamily[];
}

interface FamilyActionRow {
  id: string;
  family_id: string;
  title: string;
  status: string;
  priority: string;
  due_at: string | null;
  assigned_to: string | null;
}

interface CoordinationCaseRow {
  id: string;
  family_id: string;
  status: string;
  updated_at: string;
}

interface HandoffRow {
  id: string;
  family_id: string;
  status: string;
  initiated_at: string;
}

const stageLabel = (stage?: string | null) => {
  if (!stage) return "Getting organized";
  return stage.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const ProfessionalCommandCenter = ({ organizationId, families }: ProfessionalCommandCenterProps) => {
  const navigate = useNavigate();
  const [actions, setActions] = useState<FamilyActionRow[]>([]);
  const [cases, setCases] = useState<CoordinationCaseRow[]>([]);
  const [handoffs, setHandoffs] = useState<HandoffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const familyIds = families.map((family) => family.id);
    if (familyIds.length === 0) {
      setActions([]);
      setCases([]);
      setHandoffs([]);
      setLoading(false);
      return;
    }

    const [actionResult, caseResult, handoffResult] = await Promise.all([
      supabase
        .from("family_actions")
        .select("id, family_id, title, status, priority, due_at, assigned_to")
        .in("family_id", familyIds)
        .in("status", ["open", "in_progress"])
        .order("due_at", { ascending: true, nullsFirst: false }),
      supabase
        .from("coordination_cases")
        .select("id, family_id, status, updated_at")
        .in("family_id", familyIds)
        .neq("status", "closed"),
      supabase
        .from("provider_handoffs")
        .select("id, family_id, status, initiated_at")
        .in("family_id", familyIds)
        .in("status", ["pending", "accepted"]),
    ]);

    const firstError = actionResult.error || caseResult.error || handoffResult.error;
    if (firstError) {
      console.error("Unable to load professional command center", firstError);
      setError("The caseload summary could not be loaded. Your notes and messages remain available.");
    } else {
      setActions((actionResult.data || []) as FamilyActionRow[]);
      setCases((caseResult.data || []) as CoordinationCaseRow[]);
      setHandoffs((handoffResult.data || []) as HandoffRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // organizationId intentionally refreshes the command center when the selected workspace changes.
  }, [organizationId, families.map((family) => family.id).join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  const now = Date.now();
  const overdueCount = actions.filter((action) => action.due_at && new Date(action.due_at).getTime() < now).length;
  const unassignedCount = actions.filter((action) => !action.assigned_to).length;
  const pendingHandoffCount = handoffs.filter((handoff) => handoff.status === "pending").length;

  const rows = useMemo(() => families.map((family) => {
    const familyActions = actions.filter((action) => action.family_id === family.id);
    const nextAction = familyActions[0] || null;
    const familyCase = cases.find((coordinationCase) => coordinationCase.family_id === family.id) || null;
    const familyHandoff = handoffs.find((handoff) => handoff.family_id === family.id) || null;
    const needsAttention = Boolean(
      nextAction?.due_at && new Date(nextAction.due_at).getTime() < now
      || familyHandoff?.status === "pending"
      || familyActions.some((action) => !action.assigned_to),
    );
    return { family, familyActions, nextAction, familyCase, familyHandoff, needsAttention };
  }).sort((a, b) => Number(b.needsAttention) - Number(a.needsAttention)), [actions, cases, families, handoffs, now]);

  if (loading) return <Card><CardContent className="flex min-h-48 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></CardContent></Card>;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Today’s caseload</h2>
          <p className="text-sm text-muted-foreground">One shared plan for families and the professionals supporting them.</p>
        </div>
        <Button variant="outline" onClick={() => void load()}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
      </div>

      {error && <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>}

      <div className="grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="flex items-center gap-3 p-4"><AlertCircle className="h-7 w-7 text-amber-600" /><div><p className="text-2xl font-semibold">{overdueCount}</p><p className="text-xs text-muted-foreground">Overdue actions</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-4"><ClipboardList className="h-7 w-7 text-blue-600" /><div><p className="text-2xl font-semibold">{unassignedCount}</p><p className="text-xs text-muted-foreground">Actions needing an owner</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-4"><Users className="h-7 w-7 text-teal-600" /><div><p className="text-2xl font-semibold">{pendingHandoffCount}</p><p className="text-xs text-muted-foreground">Handoffs awaiting response</p></div></CardContent></Card>
      </div>

      {rows.length === 0 ? (
        <Card><CardHeader><CardTitle>No assigned families yet</CardTitle><CardDescription>Families will appear here when they are connected to this organization with consent.</CardDescription></CardHeader></Card>
      ) : (
        <div className="space-y-3">
          {rows.map(({ family, familyActions, nextAction, familyCase, familyHandoff, needsAttention }) => (
            <Card key={family.id} className={needsAttention ? "border-amber-300/70" : undefined}>
              <CardContent className="p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{family.name}</h3>
                      <Badge variant="outline">{stageLabel(family.journey_stage)}</Badge>
                      {needsAttention ? <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Needs attention</Badge> : <Badge variant="secondary"><CheckCircle2 className="mr-1 h-3 w-3" />On track</Badge>}
                    </div>
                    {nextAction ? (
                      <div>
                        <p className="text-sm font-medium">Next: {nextAction.title}</p>
                        <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>{nextAction.assigned_to ? "Owner assigned" : "Owner needed"}</span>
                          {nextAction.due_at && <span className="flex items-center gap-1"><CalendarClock className="h-3 w-3" />Due {new Date(nextAction.due_at).toLocaleDateString()}</span>}
                          <span>{familyActions.length} open action{familyActions.length === 1 ? "" : "s"}</span>
                        </p>
                      </div>
                    ) : <p className="text-sm text-muted-foreground">No next action has been assigned.</p>}
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>{familyCase ? "Active coordination case" : "No coordination case"}</span>
                      {familyHandoff && <span>· Handoff {familyHandoff.status}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button variant="outline" onClick={() => navigate(`/family/${family.id}`)}>Open family plan</Button>
                    {familyCase && <Button onClick={() => navigate(`/provider-coordination?case=${familyCase.id}`)}>Coordinate <ArrowRight className="ml-2 h-4 w-4" /></Button>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfessionalCommandCenter;
