import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Check,
  Clock,
  Loader2,
  Send,
  Shield,
  UserCheck,
  X,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface ProviderHandoffManagerProps {
  familyId: string;
  userId: string;
  currentOrgId?: string;
  isOrgAdmin?: boolean;
}

interface Handoff {
  id: string;
  user_id: string;
  family_id: string;
  from_organization_id: string;
  to_organization_id: string;
  status: string;
  initiated_by: string;
  initiated_at: string;
  accepted_by: string | null;
  accepted_at: string | null;
  completed_at: string | null;
  sobriety_days_at_handoff: number;
  handoff_notes: string | null;
  receiving_provider_notes: string | null;
  from_org_name?: string;
  to_org_name?: string;
}

interface Organization {
  id: string;
  name: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-800 border-amber-200", icon: Clock },
  accepted: { label: "Accepted", color: "bg-blue-100 text-blue-800 border-blue-200", icon: UserCheck },
  declined: { label: "Declined", color: "bg-red-100 text-red-800 border-red-200", icon: X },
  completed: { label: "Completed", color: "bg-green-100 text-green-800 border-green-200", icon: Check },
  cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-800 border-gray-200", icon: X },
};

export function ProviderHandoffManager({ 
  familyId, 
  userId, 
  currentOrgId,
  isOrgAdmin = false 
}: ProviderHandoffManagerProps) {
  const { toast } = useToast();
  const [handoffs, setHandoffs] = useState<Handoff[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInitiateDialog, setShowInitiateDialog] = useState(false);
  
  // Form state
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [handoffNotes, setHandoffNotes] = useState("");

  useEffect(() => {
    fetchData();
  }, [familyId, userId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch handoffs
      const { data: handoffData, error: handoffError } = await supabase
        .from("provider_handoffs")
        .select("*")
        .eq("family_id", familyId)
        .eq("user_id", userId)
        .order("initiated_at", { ascending: false });

      if (handoffError) throw handoffError;

      // Fetch org names for handoffs
      if (handoffData && handoffData.length > 0) {
        const orgIds = [...new Set([
          ...handoffData.map(h => h.from_organization_id),
          ...handoffData.map(h => h.to_organization_id)
        ])];

        const { data: orgsData } = await supabase
          .from("organizations")
          .select("id, name")
          .in("id", orgIds);

        const orgMap = new Map(orgsData?.map(o => [o.id, o.name]) || []);

        setHandoffs(handoffData.map(h => ({
          ...h,
          from_org_name: orgMap.get(h.from_organization_id) || "Unknown",
          to_org_name: orgMap.get(h.to_organization_id) || "Unknown",
        })));
      } else {
        setHandoffs([]);
      }

      // Fetch available organizations for handoff (excluding current)
      const { data: allOrgs } = await supabase
        .from("organizations")
        .select("id, name")
        .neq("id", currentOrgId || "");

      setOrganizations(allOrgs || []);
    } catch (error) {
      console.error("Error fetching handoffs:", error);
      toast({
        title: "Error",
        description: "Failed to load handoff data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitiateHandoff = async () => {
    if (!selectedOrgId || !currentOrgId) return;

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get current sobriety days
      const { data: sobrietyData } = await supabase
        .from("sobriety_journeys")
        .select("start_date")
        .eq("family_id", familyId)
        .eq("user_id", userId)
        .eq("is_active", true)
        .maybeSingle();

      let sobrietyDays = 0;
      if (sobrietyData) {
        const startDate = new Date(sobrietyData.start_date);
        const today = new Date();
        sobrietyDays = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      }

      const { error } = await supabase
        .from("provider_handoffs")
        .insert({
          user_id: userId,
          family_id: familyId,
          from_organization_id: currentOrgId,
          to_organization_id: selectedOrgId,
          initiated_by: user.id,
          sobriety_days_at_handoff: sobrietyDays,
          handoff_notes: handoffNotes || null,
        });

      if (error) throw error;

      toast({
        title: "Handoff Initiated",
        description: "The receiving provider has been notified and can review the handoff request.",
      });

      setShowInitiateDialog(false);
      setSelectedOrgId("");
      setHandoffNotes("");
      fetchData();
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

  const handleUpdateStatus = async (handoffId: string, newStatus: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const updateData: Record<string, unknown> = { status: newStatus };
      
      if (newStatus === "accepted") {
        updateData.accepted_by = user.id;
        updateData.accepted_at = new Date().toISOString();
      } else if (newStatus === "completed") {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("provider_handoffs")
        .update(updateData)
        .eq("id", handoffId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Handoff ${newStatus === "accepted" ? "accepted" : newStatus === "completed" ? "completed" : "updated"}`,
      });

      fetchData();
    } catch (error) {
      console.error("Error updating handoff:", error);
      toast({
        title: "Error",
        description: "Failed to update handoff status",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const pendingHandoffs = handoffs.filter(h => h.status === "pending" || h.status === "accepted");
  const completedHandoffs = handoffs.filter(h => h.status === "completed" || h.status === "declined" || h.status === "cancelled");

  return (
    <div className="space-y-4">
      {/* Initiate Handoff */}
      {isOrgAdmin && currentOrgId && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Send className="h-4 w-4 text-primary" />
                Provider Handoff
              </CardTitle>
              <Dialog open={showInitiateDialog} onOpenChange={setShowInitiateDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <ArrowRight className="h-4 w-4 mr-1" />
                    Initiate Handoff
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Transfer Client to Another Provider</DialogTitle>
                    <DialogDescription>
                      Initiate a secure handoff to transfer this client's care to another provider organization. 
                      They will be able to see sobriety progress but not confidential notes.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Receiving Provider</label>
                      <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select provider organization..." />
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
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Handoff Notes (Optional)</label>
                      <Textarea
                        value={handoffNotes}
                        onChange={(e) => setHandoffNotes(e.target.value)}
                        placeholder="Notes for the receiving provider..."
                        rows={4}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        These notes will be visible to the receiving provider.
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                      <p className="text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                        <Shield className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>
                          The receiving provider will see sobriety progress and milestones, but will not have access 
                          to confidential treatment notes or message history.
                        </span>
                      </p>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="ghost" onClick={() => setShowInitiateDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleInitiateHandoff} disabled={!selectedOrgId || isSubmitting}>
                        {isSubmitting ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4 mr-1" />
                        )}
                        Send Handoff Request
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Transfer this client's care to another provider organization. The receiving provider 
              will be able to track sobriety progress while maintaining confidentiality of treatment details.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Active Handoffs */}
      {pendingHandoffs.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              Active Handoffs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingHandoffs.map((handoff) => {
              const config = STATUS_CONFIG[handoff.status] || STATUS_CONFIG.pending;
              const Icon = config.icon;
              const isReceiver = handoff.to_organization_id === currentOrgId;
              const isSender = handoff.from_organization_id === currentOrgId;

              return (
                <div key={handoff.id} className="p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="font-medium">{handoff.from_org_name}</span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{handoff.to_org_name}</span>
                        <Badge variant="outline" className={config.color}>
                          <Icon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Initiated {formatDistanceToNow(new Date(handoff.initiated_at), { addSuffix: true })}</span>
                        <span>•</span>
                        <span className="font-medium text-primary">{handoff.sobriety_days_at_handoff} days sober</span>
                      </div>
                      {handoff.handoff_notes && (
                        <p className="text-sm mt-2 text-muted-foreground italic">"{handoff.handoff_notes}"</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {isReceiver && handoff.status === "pending" && isOrgAdmin && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleUpdateStatus(handoff.id, "declined")}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Decline
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleUpdateStatus(handoff.id, "accepted")}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                        </>
                      )}
                      {isSender && handoff.status === "accepted" && isOrgAdmin && (
                        <Button 
                          size="sm"
                          onClick={() => handleUpdateStatus(handoff.id, "completed")}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Complete Transfer
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Completed Handoffs */}
      {completedHandoffs.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Handoff History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {completedHandoffs.map((handoff) => {
              const config = STATUS_CONFIG[handoff.status] || STATUS_CONFIG.completed;
              const Icon = config.icon;

              return (
                <div key={handoff.id} className="p-3 rounded-lg border bg-muted/20">
                  <div className="flex items-center gap-2 flex-wrap text-sm">
                    <span>{handoff.from_org_name}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span>{handoff.to_org_name}</span>
                    <Badge variant="outline" className={`text-xs ${config.color}`}>
                      <Icon className="h-3 w-3 mr-1" />
                      {config.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {format(new Date(handoff.initiated_at), "MMM d, yyyy")}
                    </span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {handoffs.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No provider handoffs recorded</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
