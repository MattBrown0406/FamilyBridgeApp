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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRightLeft, Loader2, Building2, Users } from "lucide-react";

interface FamilyHandoffDialogProps {
  familyId: string;
  familyName: string;
  currentOrgId: string;
  currentOrgName: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

interface Organization {
  id: string;
  name: string;
}

interface RecoveringMember {
  userId: string;
  fullName: string;
  sobrietyDays: number;
}

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
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [handoffNotes, setHandoffNotes] = useState("");
  const [recoveringMembers, setRecoveringMembers] = useState<RecoveringMember[]>([]);

  useEffect(() => {
    if (open) {
      fetchOrganizations();
      fetchRecoveringMembers();
    }
  }, [open]);

  const fetchOrganizations = async () => {
    setIsLoading(true);
    try {
      // Get all organizations except the current one
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name")
        .neq("id", currentOrgId)
        .order("name");

      if (error) throw error;
      setOrganizations(data || []);
    } catch (error) {
      console.error("Error fetching organizations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecoveringMembers = async () => {
    try {
      // Get recovering members from the family
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

      // Get profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      // Get sobriety journeys
      const { data: journeys, error: journeysError } = await supabase
        .from("sobriety_journeys")
        .select("user_id, start_date")
        .in("user_id", userIds)
        .eq("family_id", familyId)
        .eq("is_active", true);

      if (journeysError) throw journeysError;

      const recoveringList: RecoveringMember[] = members.map((m) => {
        const profile = profiles?.find((p) => p.id === m.user_id);
        const journey = journeys?.find((j) => j.user_id === m.user_id);
        const sobrietyDays = journey
          ? Math.floor(
              (new Date().getTime() - new Date(journey.start_date).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : 0;

        return {
          userId: m.user_id,
          fullName: profile?.full_name || "Unknown",
          sobrietyDays,
        };
      });

      setRecoveringMembers(recoveringList);
      
      // Auto-select if only one recovering member
      if (recoveringList.length === 1) {
        setSelectedUserId(recoveringList[0].userId);
      }
    } catch (error) {
      console.error("Error fetching recovering members:", error);
    }
  };

  const handleInitiateHandoff = async () => {
    if (!selectedOrgId) {
      toast({
        title: "Select Destination",
        description: "Please select the receiving organization",
        variant: "destructive",
      });
      return;
    }

    if (!selectedUserId) {
      toast({
        title: "Select Client",
        description: "Please select the recovering individual to hand off",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const selectedMember = recoveringMembers.find(
        (m) => m.userId === selectedUserId
      );

      const { error } = await supabase.from("provider_handoffs").insert({
        user_id: selectedUserId,
        family_id: familyId,
        from_organization_id: currentOrgId,
        to_organization_id: selectedOrgId,
        initiated_by: user.id,
        sobriety_days_at_handoff: selectedMember?.sobrietyDays || 0,
        handoff_notes: handoffNotes || null,
      });

      if (error) throw error;

      toast({
        title: "Handoff Initiated",
        description: "The receiving provider has been notified and can review the handoff request.",
      });

      setOpen(false);
      setSelectedOrgId("");
      setSelectedUserId("");
      setHandoffNotes("");
      onSuccess?.();
    } catch (error) {
      console.error("Error initiating handoff:", error);
      toast({
        title: "Error",
        description: "Failed to initiate handoff",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-primary"
          >
            <ArrowRightLeft className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-primary" />
            Handoff to Another Provider
          </DialogTitle>
          <DialogDescription>
            Transfer primary care responsibility for "{familyName}" to another organization as the client moves to their next level of care.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Organization */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">From:</span>
              <span className="font-medium">{currentOrgName}</span>
            </div>
          </div>

          {/* Select Recovering Individual */}
          {recoveringMembers.length > 0 && (
            <div className="space-y-2">
              <Label>Client to Hand Off</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select recovering individual" />
                </SelectTrigger>
                <SelectContent>
                  {recoveringMembers.map((member) => (
                    <SelectItem key={member.userId} value={member.userId}>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{member.fullName}</span>
                        <span className="text-xs text-muted-foreground">
                          ({member.sobrietyDays} days)
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {recoveringMembers.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground bg-muted/30 rounded-lg">
              No recovering individuals found in this family group.
            </div>
          )}

          {/* Destination Organization */}
          <div className="space-y-2">
            <Label>Receiving Organization</Label>
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : organizations.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground bg-muted/30 rounded-lg">
                No other organizations available for handoff.
              </div>
            ) : (
              <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select receiving organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {org.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Handoff Notes */}
          <div className="space-y-2">
            <Label htmlFor="handoff-notes">Handoff Notes (Optional)</Label>
            <Textarea
              id="handoff-notes"
              placeholder="Include any relevant context for the receiving provider..."
              value={handoffNotes}
              onChange={(e) => setHandoffNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleInitiateHandoff}
            disabled={isSubmitting || !selectedOrgId || !selectedUserId || organizations.length === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Initiating...
              </>
            ) : (
              <>
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Initiate Handoff
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
