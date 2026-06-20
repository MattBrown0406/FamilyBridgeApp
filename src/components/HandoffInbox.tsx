import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowRightLeft,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  Home,
  UserCheck,
  Loader2,
  Calendar,
  FileText,
} from "lucide-react";

interface PendingHandoff {
  id: string;
  family_id: string;
  family_name: string;
  from_org_name: string;
  initiator_name: string;
  sobriety_days_at_handoff: number;
  handoff_notes: string | null;
  transfer_reason: string | null;
  transfer_reason_notes: string | null;
  referring_user_remains_co_mod: boolean;
  initiated_at: string;
}

const REASON_LABELS: Record<string, string> = {
  step_up: "Step-up to higher level of care",
  step_down: "Step-down to lower level of care",
  relapse_higher_loc: "Relapse — higher level of care needed",
  aftercare_transition: "Aftercare / continuing care transition",
  sober_living: "Moving to sober living",
  provider_change: "Provider change (same level of care)",
  geographic_move: "Geographic relocation",
  other: "Other",
};

interface HandoffInboxProps {
  organizationId: string;
}

export function HandoffInbox({ organizationId }: HandoffInboxProps) {
  const { toast } = useToast();
  const [handoffs, setHandoffs] = useState<PendingHandoff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedHandoff, setSelectedHandoff] = useState<PendingHandoff | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [dialogMode, setDialogMode] = useState<"accept" | "decline" | null>(null);

  useEffect(() => {
    fetchPendingHandoffs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId]);

  const fetchPendingHandoffs = async () => {
    setIsLoading(true);
    try {
      // Get pending handoffs to this org
      const { data: rawHandoffs, error } = await supabase
        .from("provider_handoffs")
        .select(`
          id,
          family_id,
          sobriety_days_at_handoff,
          handoff_notes,
          transfer_reason,
          transfer_reason_notes,
          referring_user_remains_co_mod,
          initiated_at,
          initiated_by,
          families!family_id(name),
          organizations!from_organization_id(name)
        `)
        .eq("to_organization_id", organizationId)
        .eq("status", "pending")
        .order("initiated_at", { ascending: false });

      if (error) throw error;

      if (!rawHandoffs || rawHandoffs.length === 0) {
        setHandoffs([]);
        return;
      }

      // Get initiator profiles
      const initiatorIds = rawHandoffs.map((h) => h.initiated_by);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", initiatorIds);

      const mapped: PendingHandoff[] = rawHandoffs.map((h) => ({
        id: h.id,
        family_id: h.family_id,
        family_name: (h.families as any)?.name || "Unknown Family",
        from_org_name: (h.organizations as any)?.name || "Unknown Organization",
        initiator_name:
          profiles?.find((p) => p.id === h.initiated_by)?.full_name || "Unknown",
        sobriety_days_at_handoff: h.sobriety_days_at_handoff,
        handoff_notes: h.handoff_notes,
        transfer_reason: h.transfer_reason,
        transfer_reason_notes: h.transfer_reason_notes,
        referring_user_remains_co_mod: h.referring_user_remains_co_mod,
        initiated_at: h.initiated_at,
      }));

      setHandoffs(mapped);
    } catch (err) {
      console.error("Error fetching handoffs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const openAccept = (h: PendingHandoff) => {
    setSelectedHandoff(h);
    setDialogMode("accept");
  };

  const openDecline = (h: PendingHandoff) => {
    setSelectedHandoff(h);
    setDeclineReason("");
    setDialogMode("decline");
  };

  const handleAccept = async () => {
    if (!selectedHandoff) return;
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("provider_handoffs")
        .update({
          status: "accepted",
          accepted_by: user.id,
          accepted_at: new Date().toISOString(),
        })
        .eq("id", selectedHandoff.id);

      if (error) throw error;

      toast({
        title: "Transfer Accepted",
        description: `${selectedHandoff.family_name} has been transferred to your organization.${selectedHandoff.referring_user_remains_co_mod ? ` ${selectedHandoff.initiator_name} will remain as co-moderator.` : ""}`,
      });

      setDialogMode(null);
      setSelectedHandoff(null);
      fetchPendingHandoffs();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to accept transfer", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!selectedHandoff) return;
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("provider_handoffs")
        .update({
          status: "declined",
          declined_reason: declineReason || null,
          declined_at: new Date().toISOString(),
        })
        .eq("id", selectedHandoff.id);

      if (error) throw error;

      toast({
        title: "Transfer Declined",
        description: "The sending provider has been notified.",
      });

      setDialogMode(null);
      setSelectedHandoff(null);
      setDeclineReason("");
      fetchPendingHandoffs();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to decline transfer", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (handoffs.length === 0) {
    return (
      <div className="text-center p-8 text-sm text-muted-foreground">
        <ArrowRightLeft className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
        No pending transfer requests
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {handoffs.map((h) => (
          <Card key={h.id} className="border-l-4 border-l-amber-400">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Home className="h-4 w-4 text-primary" />
                    {h.family_name}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    From <strong>{h.from_org_name}</strong> · Sent by {h.initiator_name}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-amber-600 border-amber-300 whitespace-nowrap">
                  <Clock className="h-3 w-3 mr-1" />
                  Pending
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Transfer reason */}
              {h.transfer_reason && (
                <div className="flex items-center gap-2 text-sm">
                  <ArrowRightLeft className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Reason:</span>
                  <span className="font-medium">{REASON_LABELS[h.transfer_reason] || h.transfer_reason}</span>
                </div>
              )}

              {/* Sobriety snapshot */}
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Sobriety at transfer:</span>
                <span className="font-medium">{h.sobriety_days_at_handoff} days</span>
              </div>

              {/* Handoff notes */}
              {h.handoff_notes && (
                <div className="p-3 bg-muted/30 rounded-lg text-sm">
                  <div className="flex items-center gap-1.5 mb-1 text-muted-foreground text-xs font-medium uppercase tracking-wide">
                    <FileText className="h-3 w-3" />
                    Handoff Notes
                  </div>
                  <p className="leading-relaxed">{h.handoff_notes}</p>
                </div>
              )}

              {/* Co-mod flag */}
              {h.referring_user_remains_co_mod && (
                <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                  <UserCheck className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    <strong>{h.initiator_name}</strong> wants to remain as co-moderator after transfer.
                  </span>
                </div>
              )}

              {/* Sent date */}
              <p className="text-xs text-muted-foreground">
                Requested {new Date(h.initiated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => openAccept(h)}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  Accept Transfer
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-destructive hover:text-destructive"
                  onClick={() => openDecline(h)}
                >
                  <XCircle className="h-4 w-4 mr-1.5" />
                  Decline
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Accept confirmation dialog */}
      <Dialog open={dialogMode === "accept"} onOpenChange={() => setDialogMode(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Accept Transfer
            </DialogTitle>
            <DialogDescription>
              You're accepting responsibility for <strong>{selectedHandoff?.family_name}</strong> from{" "}
              <strong>{selectedHandoff?.from_org_name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="p-4 bg-muted/40 rounded-lg text-sm space-y-2">
              <p>
                <span className="text-muted-foreground">Transfer reason:</span>{" "}
                <strong>{selectedHandoff?.transfer_reason ? REASON_LABELS[selectedHandoff.transfer_reason] : "—"}</strong>
              </p>
              <p>
                <span className="text-muted-foreground">Sobriety days:</span>{" "}
                <strong>{selectedHandoff?.sobriety_days_at_handoff}</strong>
              </p>
            </div>

            {selectedHandoff?.referring_user_remains_co_mod && (
              <div className="flex items-start gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                <UserCheck className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  <strong>{selectedHandoff?.initiator_name}</strong> will be added as a 
                  co-moderator to this family group. They'll have view + participation access 
                  but you remain primary moderator.
                </span>
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              The family will be moved to your organization immediately. Your branding will 
              appear for all family members.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogMode(null)}>Cancel</Button>
            <Button onClick={handleAccept} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Accept Transfer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Decline dialog */}
      <Dialog open={dialogMode === "decline"} onOpenChange={() => setDialogMode(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Decline Transfer
            </DialogTitle>
            <DialogDescription>
              Declining will notify <strong>{selectedHandoff?.from_org_name}</strong> that this 
              transfer was not accepted. The family remains under their management.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <Label htmlFor="decline-reason">
                Reason for Declining <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Textarea
                id="decline-reason"
                placeholder="e.g. Not accepting new clients at this time, level of care mismatch..."
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                rows={3}
                className="mt-2"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogMode(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDecline} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Decline Transfer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
