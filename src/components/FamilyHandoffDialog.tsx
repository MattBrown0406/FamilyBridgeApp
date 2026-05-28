import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowRightLeft,
  Loader2,
  Building2,
  Home,
  UserCheck,
  Info,
} from "lucide-react";
import { OrgSearchCombobox, OrgComboboxValue } from "@/components/OrgSearchCombobox";
import { supabase as supabaseClient } from "@/integrations/supabase/client";

interface FamilyHandoffDialogProps {
  familyId: string;
  familyName: string;
  currentOrgId: string;
  currentOrgName: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

interface RecoveringMember {
  userId: string;
  fullName: string;
  sobrietyDays: number;
}

const TRANSFER_REASONS = [
  { value: "step_up", label: "Step-up to higher level of care" },
  { value: "step_down", label: "Step-down to lower level of care" },
  { value: "relapse_higher_loc", label: "Relapse — higher level of care needed" },
  { value: "aftercare_transition", label: "Aftercare / continuing care transition" },
  { value: "sober_living", label: "Moving to sober living" },
  { value: "provider_change", label: "Provider change (same level of care)" },
  { value: "geographic_move", label: "Geographic relocation" },
  { value: "other", label: "Other" },
];

export const FamilyHandoffDialog = ({
  familyId,
  familyName,
  currentOrgId,
  currentOrgName,
  onSuccess,
  trigger,
}: FamilyHandoffDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [selectedOrg, setSelectedOrg] = useState<OrgComboboxValue>(null);
  const [transferReason, setTransferReason] = useState("");
  const [transferNotes, setTransferNotes] = useState("");
  const [remainAsCoMod, setRemainAsCoMod] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [recoveringMembers, setRecoveringMembers] = useState<RecoveringMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  useEffect(() => {
    if (open) {
      fetchRecoveringMembers();
      // Default co-mod checkbox to true (most referrers want to stay involved)
      setRemainAsCoMod(true);
    }
  }, [open]);

  const fetchRecoveringMembers = async () => {
    setIsLoadingMembers(true);
    try {
      const { data: members, error: membersError } = await supabase
        .from("family_members")
        .select("user_id")
        .eq("family_id", familyId)
        .eq("role", "recovering");

      if (membersError) throw membersError;
      if (!members || members.length === 0) {
        setRecoveringMembers([]);
        return;
      }

      const userIds = members.map((m) => m.user_id);

      const [{ data: profiles }, { data: journeys }] = await Promise.all([
        supabase.from("profiles").select("id, full_name").in("id", userIds),
        supabase
          .from("sobriety_journeys")
          .select("user_id, start_date")
          .in("user_id", userIds)
          .eq("family_id", familyId)
          .eq("is_active", true),
      ]);

      const list: RecoveringMember[] = members.map((m) => {
        const profile = profiles?.find((p) => p.id === m.user_id);
        const journey = journeys?.find((j) => j.user_id === m.user_id);
        const sobrietyDays = journey
          ? Math.floor(
              (new Date().getTime() - new Date(journey.start_date).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : 0;
        return { userId: m.user_id, fullName: profile?.full_name || "Unknown", sobrietyDays };
      });

      setRecoveringMembers(list);
      if (list.length > 0) setSelectedUserId(list[0].userId);
    } catch (error) {
      console.error("Error fetching recovering members:", error);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedOrg) {
      toast({ title: "Select Destination", description: "Please select the receiving organization", variant: "destructive" });
      return;
    }
    if (!transferReason) {
      toast({ title: "Select Reason", description: "Please select the reason for this transfer", variant: "destructive" });
      return;
    }

    const userIdToUse = selectedUserId || recoveringMembers[0]?.userId;

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (selectedOrg.type === "existing") {
        // ---- Two-party handshake: insert into provider_handoffs ----
        const selectedMember = recoveringMembers.find((m) => m.userId === userIdToUse);

        const { error } = await supabase.from("provider_handoffs").insert({
          user_id: userIdToUse || user.id,
          family_id: familyId,
          from_organization_id: currentOrgId,
          to_organization_id: selectedOrg.org.id,
          initiated_by: user.id,
          sobriety_days_at_handoff: selectedMember?.sobrietyDays || 0,
          handoff_notes: transferNotes || null,
          transfer_reason: transferReason as any,
          transfer_reason_notes: transferNotes || null,
          referring_user_remains_co_mod: remainAsCoMod,
        });

        if (error) throw error;

        toast({
          title: "Transfer Request Sent",
          description: `${selectedOrg.org.name} has been notified and can review the handoff request.${remainAsCoMod ? " You'll remain as co-moderator once they accept." : ""}`,
        });
      } else {
        // ---- Org not on FamilyBridge: create invite + send email ----
        const { data: inviteData, error } = await (supabase as any).from("org_transfer_invites").insert({
          family_id: familyId,
          from_organization_id: currentOrgId,
          invited_by: user.id,
          org_name: selectedOrg.orgName,
          contact_name: selectedOrg.contactName || null,
          contact_email: selectedOrg.contactEmail,
          contact_phone: selectedOrg.contactPhone || null,
          invite_message: transferNotes || null,
          transfer_reason: transferReason as any,
          transfer_reason_notes: transferNotes || null,
          referring_user_remains_co_mod: remainAsCoMod,
        }).select("id").single();

        if (error) throw error;

        // Fire the email via edge function (non-blocking — don't fail the whole flow if email errors)
        if (inviteData?.id) {
          supabase.functions.invoke("send-org-transfer-invite", {
            body: { inviteId: inviteData.id },
          }).catch((emailErr) => {
            console.warn("Invite email failed (non-critical):", emailErr);
          });
        }

        toast({
          title: "Invitation Sent",
          description: `An invitation with a FamilyBridge subscription link has been emailed to ${selectedOrg.contactEmail}. The transfer will complete once they register.`,
        });
      }

      // Reset + close
      setOpen(false);
      setSelectedOrg(null);
      setTransferReason("");
      setTransferNotes("");
      setRemainAsCoMod(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error initiating handoff:", error);
      toast({ title: "Error", description: error.message || "Failed to initiate transfer", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit =
    !!selectedOrg &&
    !!transferReason &&
    !isSubmitting;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
            <ArrowRightLeft className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-primary" />
            Transfer Family to Another Provider
          </DialogTitle>
          <DialogDescription>
            Request a handoff to a registered program — or invite one that isn't on FamilyBridge yet.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">

          {/* Family being transferred */}
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Home className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{familyName}</p>
                <p className="text-sm text-muted-foreground">
                  {isLoadingMembers ? (
                    "Loading members..."
                  ) : recoveringMembers.length > 0 ? (
                    `${recoveringMembers.map((m) => m.fullName).join(", ")} · ${recoveringMembers[0]?.sobrietyDays || 0} days sober`
                  ) : (
                    "No recovering individuals assigned"
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* From org */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">From:</span>
              <span className="font-medium">{currentOrgName}</span>
            </div>
          </div>

          {/* Org search — to org */}
          <div className="relative">
            <OrgSearchCombobox
              excludeOrgId={currentOrgId}
              value={selectedOrg}
              onChange={setSelectedOrg}
              label="Receiving Organization"
              placeholder="Search by program name..."
            />
          </div>

          {/* Transfer reason */}
          <div className="space-y-2">
            <Label>Reason for Transfer</Label>
            <Select value={transferReason} onValueChange={setTransferReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason..." />
              </SelectTrigger>
              <SelectContent>
                {TRANSFER_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="transfer-notes">
              Handoff Notes <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="transfer-notes"
              placeholder="Include relevant context for the receiving provider — treatment progress, family dynamics, any immediate concerns..."
              value={transferNotes}
              onChange={(e) => setTransferNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Co-moderator option */}
          <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-lg space-y-2">
            <div className="flex items-start gap-3">
              <Checkbox
                id="remain-co-mod"
                checked={remainAsCoMod}
                onCheckedChange={(v) => setRemainAsCoMod(!!v)}
                className="mt-0.5"
              />
              <div className="space-y-1">
                <label
                  htmlFor="remain-co-mod"
                  className="text-sm font-medium cursor-pointer flex items-center gap-1.5"
                >
                  <UserCheck className="h-4 w-4 text-blue-600" />
                  Stay on as co-moderator after transfer
                </label>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  You'll keep read + participation access to this family group. The receiving 
                  program's branding and primary moderator take over — you stay in the background 
                  as a support resource. Your HIPAA release already covers this.
                </p>
              </div>
            </div>
          </div>

          {/* Two-party handshake note */}
          {selectedOrg?.type === "existing" && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
              <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>
                The receiving program will get a notification to <strong>accept or decline</strong> this 
                transfer. The family group stays under your management until they accept.
              </span>
            </div>
          )}

          {selectedOrg?.type === "invite" && (
            <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-lg">
              <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>
                An email with a <strong>FamilyBridge subscription link</strong> will be sent to{" "}
                <strong>{selectedOrg.contactEmail}</strong>. Once they register and create their 
                organization, this family will be automatically transferred to them.
              </span>
            </div>
          )}

        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {isSubmitting ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...</>
            ) : selectedOrg?.type === "invite" ? (
              "Send Invitation"
            ) : (
              "Request Transfer"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
