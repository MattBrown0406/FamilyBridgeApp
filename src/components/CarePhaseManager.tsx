import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  AlertTriangle,
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  Home,
  Loader2,
  Plus,
  Stethoscope,
  TrendingUp,
  Users,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface CarePhaseManagerProps {
  familyId: string;
  userId: string;
  isModerator?: boolean;
  isOrgAdmin?: boolean;
}

interface CarePhase {
  id: string;
  user_id: string;
  family_id: string;
  phase_type: string;
  organization_id: string | null;
  started_at: string;
  ended_at: string | null;
  is_current: boolean;
  facility_name: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
}

const PHASE_CONFIG: Record<string, { label: string; icon: typeof Stethoscope; color: string; order: number }> = {
  detox: { 
    label: "Detox", 
    icon: AlertTriangle, 
    color: "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800",
    order: 1
  },
  residential_treatment: { 
    label: "Residential Treatment", 
    icon: Building2, 
    color: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800",
    order: 2
  },
  partial_hospitalization: { 
    label: "Partial Hospitalization (PHP)", 
    icon: Stethoscope, 
    color: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
    order: 3
  },
  intensive_outpatient: { 
    label: "Intensive Outpatient (IOP)", 
    icon: Users, 
    color: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950/50 dark:text-yellow-300 dark:border-yellow-800",
    order: 4
  },
  outpatient: { 
    label: "Outpatient", 
    icon: Calendar, 
    color: "bg-lime-100 text-lime-800 border-lime-200 dark:bg-lime-950/50 dark:text-lime-300 dark:border-lime-800",
    order: 5
  },
  sober_living: { 
    label: "Sober Living", 
    icon: Home, 
    color: "bg-green-100 text-green-800 border-green-200 dark:bg-green-950/50 dark:text-green-300 dark:border-green-800",
    order: 6
  },
  independent: { 
    label: "Independent Living", 
    icon: CheckCircle, 
    color: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
    order: 7
  },
};

export function CarePhaseManager({ familyId, userId, isModerator = false, isOrgAdmin = false }: CarePhaseManagerProps) {
  const { toast } = useToast();
  const [phases, setPhases] = useState<CarePhase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  // Form state
  const [newPhaseType, setNewPhaseType] = useState<string>("");
  const [facilityName, setFacilityName] = useState("");
  const [notes, setNotes] = useState("");

  const canManage = isModerator || isOrgAdmin;

  useEffect(() => {
    fetchPhases();
  }, [familyId, userId]);

  const fetchPhases = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("care_phases")
        .select("*")
        .eq("family_id", familyId)
        .eq("user_id", userId)
        .order("started_at", { ascending: false });

      if (error) throw error;
      setPhases(data || []);
    } catch (error) {
      console.error("Error fetching care phases:", error);
      toast({
        title: "Error",
        description: "Failed to load care phases",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPhase = async () => {
    if (!newPhaseType) return;

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // End current phase if exists
      const currentPhase = phases.find(p => p.is_current);
      if (currentPhase) {
        await supabase
          .from("care_phases")
          .update({ is_current: false, ended_at: new Date().toISOString() })
          .eq("id", currentPhase.id);
      }

      // Create new phase
      const { error } = await supabase
        .from("care_phases")
        .insert({
          user_id: userId,
          family_id: familyId,
          phase_type: newPhaseType as "detox" | "residential_treatment" | "partial_hospitalization" | "intensive_outpatient" | "outpatient" | "sober_living" | "independent",
          facility_name: facilityName || null,
          notes: notes || null,
          created_by: user.id,
          is_current: true,
        });

      if (error) throw error;

      toast({
        title: "Phase Added",
        description: `Transitioned to ${PHASE_CONFIG[newPhaseType]?.label || newPhaseType}`,
      });

      setShowAddDialog(false);
      setNewPhaseType("");
      setFacilityName("");
      setNotes("");
      fetchPhases();
    } catch (error) {
      console.error("Error adding phase:", error);
      toast({
        title: "Error",
        description: "Failed to add care phase",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentPhase = phases.find(p => p.is_current);
  const pastPhases = phases.filter(p => !p.is_current);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current Phase Card */}
      <Card className="border-primary/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Current Care Phase
            </CardTitle>
            {canManage && (
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Transition Phase
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Transition to New Care Phase</DialogTitle>
                    <DialogDescription>
                      Record a transition to a new level of care. The current phase will be marked as completed.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">New Phase</label>
                      <Select value={newPhaseType} onValueChange={setNewPhaseType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select care phase..." />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(PHASE_CONFIG)
                            .sort((a, b) => a[1].order - b[1].order)
                            .map(([key, config]) => {
                              const Icon = config.icon;
                              return (
                                <SelectItem key={key} value={key}>
                                  <div className="flex items-center gap-2">
                                    <Icon className="h-4 w-4" />
                                    {config.label}
                                  </div>
                                </SelectItem>
                              );
                            })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Facility Name (Optional)</label>
                      <Input
                        value={facilityName}
                        onChange={(e) => setFacilityName(e.target.value)}
                        placeholder="e.g., Serenity Recovery Center"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Notes (Optional)</label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Additional notes about this transition..."
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="ghost" onClick={() => setShowAddDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddPhase} disabled={!newPhaseType || isSubmitting}>
                        {isSubmitting ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <ArrowRight className="h-4 w-4 mr-1" />
                        )}
                        Complete Transition
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {currentPhase ? (
            <div className={`p-4 rounded-lg border ${PHASE_CONFIG[currentPhase.phase_type]?.color || "bg-muted"}`}>
              <div className="flex items-start gap-3">
                {(() => {
                  const config = PHASE_CONFIG[currentPhase.phase_type];
                  const Icon = config?.icon || TrendingUp;
                  return <Icon className="h-5 w-5 mt-0.5" />;
                })()}
                <div className="flex-1">
                  <h4 className="font-semibold">
                    {PHASE_CONFIG[currentPhase.phase_type]?.label || currentPhase.phase_type}
                  </h4>
                  {currentPhase.facility_name && (
                    <p className="text-sm opacity-80">{currentPhase.facility_name}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
                    <Clock className="h-3 w-3" />
                    Started {formatDistanceToNow(new Date(currentPhase.started_at), { addSuffix: true })}
                  </div>
                  {currentPhase.notes && (
                    <p className="text-sm mt-2 opacity-80">{currentPhase.notes}</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No care phase has been set yet</p>
              {canManage && (
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={() => setShowAddDialog(true)}
                  className="mt-2"
                >
                  Set initial care phase
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Phase Timeline */}
      {pastPhases.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Care Journey Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative space-y-4">
              {/* Timeline line */}
              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />
              
              {pastPhases.map((phase, index) => {
                const config = PHASE_CONFIG[phase.phase_type];
                const Icon = config?.icon || TrendingUp;
                const duration = phase.ended_at
                  ? formatDistanceToNow(new Date(phase.started_at), { addSuffix: false })
                  : "ongoing";
                  
                return (
                  <div key={phase.id} className="relative flex gap-3 pl-8">
                    {/* Timeline dot */}
                    <div className="absolute left-0 w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                    </div>
                    
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={config?.color}>
                          <Icon className="h-3 w-3 mr-1" />
                          {config?.label || phase.phase_type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(phase.started_at), "MMM d, yyyy")}
                          {phase.ended_at && ` → ${format(new Date(phase.ended_at), "MMM d, yyyy")}`}
                        </span>
                      </div>
                      {phase.facility_name && (
                        <p className="text-sm text-muted-foreground mt-1">{phase.facility_name}</p>
                      )}
                      {phase.notes && (
                        <p className="text-xs text-muted-foreground mt-1 italic">{phase.notes}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
