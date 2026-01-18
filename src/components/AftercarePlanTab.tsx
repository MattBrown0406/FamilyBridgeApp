import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  Plus, Home, Brain, Heart, Users, Calendar, 
  CheckCircle2, ChevronDown, Trash2, Edit, Clock,
  Building, Stethoscope
} from 'lucide-react';
import { format } from 'date-fns';

interface AftercarePlan {
  id: string;
  family_id: string;
  target_user_id: string;
  target_user_name?: string;
  created_by: string;
  creator_name?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  notes: string | null;
  recommendations: AfterCareRecommendation[];
}

interface AfterCareRecommendation {
  id: string;
  plan_id: string;
  recommendation_type: string;
  title: string;
  description: string | null;
  facility_name: string | null;
  recommended_duration: string | null;
  frequency: string | null;
  therapy_type: string | null;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
}

interface Member {
  id: string;
  user_id: string;
  role: string;
  full_name: string;
}

interface AftercarePlanTabProps {
  familyId: string;
  members: Member[];
  isModerator: boolean;
}

const RECOMMENDATION_TYPES = [
  { value: 'sober_living', label: 'Sober Living', icon: Home, description: 'Transitional housing with structure and support' },
  { value: 'iop', label: 'IOP (Intensive Outpatient)', icon: Building, description: 'Structured outpatient treatment program' },
  
  { value: 'meeting_attendance', label: 'Meeting Attendance', icon: Users, description: 'AA, NA, or other recovery meetings' },
  
  { value: 'individual_therapy', label: 'Individual Therapy', icon: Stethoscope, description: 'One-on-one therapy for family members' },
  { value: 'couples_therapy', label: 'Couples Therapy', icon: Heart, description: 'Relationship-focused therapy' },
  { value: 'family_therapy', label: 'Family Therapy', icon: Users, description: 'Whole family therapy sessions' },
  { value: 'medication_compliance', label: 'Medication Compliance', icon: Stethoscope, description: 'Adherence to prescribed medication regimen' },
  { value: 'other', label: 'Other', icon: Calendar, description: 'Custom recommendation' },
] as const;

const DURATION_OPTIONS = [
  '30 days', '60 days', '90 days', '6 months', '1 year', 'Ongoing', 'As needed'
];

const FREQUENCY_OPTIONS = [
  'Daily', '3x per week', '2x per week', 'Weekly', 'Bi-weekly', 'Monthly', 'As needed'
];

const THERAPY_MODALITIES = [
  'CBT (Cognitive Behavioral Therapy)',
  'DBT (Dialectical Behavior Therapy)',
  'EMDR (Eye Movement Desensitization)',
  'IFS (Internal Family Systems)',
  'Psychodynamic Therapy',
  'Trauma-Focused Therapy',
  'Motivational Interviewing',
  'Solution-Focused Brief Therapy',
  'Acceptance and Commitment Therapy (ACT)',
  'Gottman Method (Couples)',
  'Emotionally Focused Therapy (EFT)',
  'Structural Family Therapy',
  'Narrative Therapy',
  'Art/Music Therapy',
  'Somatic Therapy',
  'Other'
];

export function AftercarePlanTab({ familyId, members, isModerator }: AftercarePlanTabProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [plans, setPlans] = useState<AftercarePlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAddRecommendationOpen, setIsAddRecommendationOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set());
  
  // Form state for new plan
  const [newPlanTarget, setNewPlanTarget] = useState('');
  const [newPlanNotes, setNewPlanNotes] = useState('');
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  
  // Form state for new recommendation
  const [newRecType, setNewRecType] = useState('');
  const [newRecTitle, setNewRecTitle] = useState('');
  const [newRecDescription, setNewRecDescription] = useState('');
  const [newRecFacility, setNewRecFacility] = useState('');
  const [newRecDuration, setNewRecDuration] = useState('');
  const [newRecFrequency, setNewRecFrequency] = useState('');
  const [newRecTherapyType, setNewRecTherapyType] = useState('');
  const [isAddingRec, setIsAddingRec] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, [familyId]);

  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const { data: plansData, error: plansError } = await supabase
        .from('aftercare_plans')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at', { ascending: false });

      if (plansError) throw plansError;

      // Fetch recommendations for all plans
      const planIds = plansData?.map(p => p.id) || [];
      let recommendations: AfterCareRecommendation[] = [];
      
      if (planIds.length > 0) {
        const { data: recsData, error: recsError } = await supabase
          .from('aftercare_recommendations')
          .select('*')
          .in('plan_id', planIds)
          .order('created_at', { ascending: true });
        
        if (recsError) throw recsError;
        recommendations = recsData || [];
      }

      // Get user names
      const userIds = [...new Set([
        ...(plansData?.map(p => p.target_user_id) || []),
        ...(plansData?.map(p => p.created_by) || [])
      ])];

      let userNames: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);
        
        userNames = (profilesData || []).reduce((acc, p) => {
          acc[p.id] = p.full_name;
          return acc;
        }, {} as Record<string, string>);
      }

      // Combine data
      const enrichedPlans: AftercarePlan[] = (plansData || []).map(plan => ({
        ...plan,
        target_user_name: userNames[plan.target_user_id] || 'Unknown',
        creator_name: userNames[plan.created_by] || 'Unknown',
        recommendations: recommendations.filter(r => r.plan_id === plan.id)
      }));

      setPlans(enrichedPlans);
      
      // Auto-expand active plans
      const activePlanIds = enrichedPlans.filter(p => p.is_active).map(p => p.id);
      setExpandedPlans(new Set(activePlanIds));
    } catch (error) {
      console.error('Error fetching aftercare plans:', error);
      toast({
        title: 'Error',
        description: 'Failed to load aftercare plans',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createPlan = async () => {
    if (!newPlanTarget || !user) return;
    
    setIsCreatingPlan(true);
    try {
      const { data, error } = await supabase
        .from('aftercare_plans')
        .insert({
          family_id: familyId,
          target_user_id: newPlanTarget,
          created_by: user.id,
          notes: newPlanNotes || null
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Plan Created',
        description: 'Aftercare plan has been created successfully'
      });

      setIsCreateDialogOpen(false);
      setNewPlanTarget('');
      setNewPlanNotes('');
      fetchPlans();
    } catch (error) {
      console.error('Error creating plan:', error);
      toast({
        title: 'Error',
        description: 'Failed to create aftercare plan',
        variant: 'destructive'
      });
    } finally {
      setIsCreatingPlan(false);
    }
  };

  const addRecommendation = async () => {
    if (!selectedPlanId || !newRecType || !newRecTitle) return;
    
    setIsAddingRec(true);
    try {
      const { error } = await supabase
        .from('aftercare_recommendations')
        .insert({
          plan_id: selectedPlanId,
          recommendation_type: newRecType,
          title: newRecTitle,
          description: newRecDescription || null,
          facility_name: newRecFacility || null,
          recommended_duration: newRecDuration || null,
          frequency: newRecFrequency || null,
          therapy_type: newRecTherapyType || null
        });

      if (error) throw error;

      toast({
        title: 'Recommendation Added',
        description: 'The recommendation has been added to the plan'
      });

      resetRecommendationForm();
      setIsAddRecommendationOpen(false);
      fetchPlans();
    } catch (error) {
      console.error('Error adding recommendation:', error);
      toast({
        title: 'Error',
        description: 'Failed to add recommendation',
        variant: 'destructive'
      });
    } finally {
      setIsAddingRec(false);
    }
  };

  const toggleRecommendationComplete = async (recId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('aftercare_recommendations')
        .update({
          is_completed: !currentStatus,
          completed_at: !currentStatus ? new Date().toISOString() : null
        })
        .eq('id', recId);

      if (error) throw error;
      fetchPlans();
    } catch (error) {
      console.error('Error updating recommendation:', error);
      toast({
        title: 'Error',
        description: 'Failed to update recommendation',
        variant: 'destructive'
      });
    }
  };

  const deleteRecommendation = async (recId: string) => {
    try {
      const { error } = await supabase
        .from('aftercare_recommendations')
        .delete()
        .eq('id', recId);

      if (error) throw error;

      toast({
        title: 'Deleted',
        description: 'Recommendation has been removed'
      });
      fetchPlans();
    } catch (error) {
      console.error('Error deleting recommendation:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete recommendation',
        variant: 'destructive'
      });
    }
  };

  const deletePlan = async (planId: string) => {
    try {
      const { error } = await supabase
        .from('aftercare_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;

      toast({
        title: 'Plan Deleted',
        description: 'Aftercare plan has been removed'
      });
      fetchPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete plan',
        variant: 'destructive'
      });
    }
  };

  const resetRecommendationForm = () => {
    setNewRecType('');
    setNewRecTitle('');
    setNewRecDescription('');
    setNewRecFacility('');
    setNewRecDuration('');
    setNewRecFrequency('');
    setNewRecTherapyType('');
  };

  const getRecTypeInfo = (type: string) => {
    return RECOMMENDATION_TYPES.find(t => t.value === type) || RECOMMENDATION_TYPES[7];
  };

  const togglePlanExpanded = (planId: string) => {
    setExpandedPlans(prev => {
      const newSet = new Set(prev);
      if (newSet.has(planId)) {
        newSet.delete(planId);
      } else {
        newSet.add(planId);
      }
      return newSet;
    });
  };

  const recoveringMembers = members.filter(m => m.role === 'recovering');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Aftercare Plans</h3>
          <p className="text-sm text-muted-foreground">
            Treatment discharge recommendations and ongoing care plans
          </p>
        </div>
        {isModerator && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Plan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Aftercare Plan</DialogTitle>
                <DialogDescription>
                  Create a new aftercare plan for a recovering family member
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Select Member</Label>
                  <Select value={newPlanTarget} onValueChange={setNewPlanTarget}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a recovering member" />
                    </SelectTrigger>
                    <SelectContent>
                      {recoveringMembers.map(member => (
                        <SelectItem key={member.user_id} value={member.user_id}>
                          {member.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Notes (Optional)</Label>
                  <Textarea
                    placeholder="General notes about this aftercare plan..."
                    value={newPlanNotes}
                    onChange={(e) => setNewPlanNotes(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={createPlan} 
                  disabled={!newPlanTarget || isCreatingPlan}
                  className="w-full"
                >
                  {isCreatingPlan ? 'Creating...' : 'Create Plan'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Plans List */}
      <ScrollArea className="h-[calc(100vh-300px)]">
        {plans.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Home className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                No aftercare plans yet.
                {isModerator && ' Create one to get started.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {plans.map(plan => (
              <Card key={plan.id} className="overflow-hidden">
                <Collapsible 
                  open={expandedPlans.has(plan.id)}
                  onOpenChange={() => togglePlanExpanded(plan.id)}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Home className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-base flex items-center gap-2">
                              {plan.target_user_name}'s Aftercare Plan
                              {plan.is_active ? (
                                <Badge variant="default" className="text-xs">Active</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">Inactive</Badge>
                              )}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-1">
                              <Clock className="h-3 w-3" />
                              Created {format(new Date(plan.created_at), 'MMM d, yyyy')} by {plan.creator_name}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {plan.recommendations.length} recommendations
                          </Badge>
                          <ChevronDown className={`h-5 w-5 transition-transform ${expandedPlans.has(plan.id) ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      {plan.notes && (
                        <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground">{plan.notes}</p>
                        </div>
                      )}

                      {/* Recommendations */}
                      <div className="space-y-3">
                        {plan.recommendations.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No recommendations added yet
                          </p>
                        ) : (
                          plan.recommendations.map(rec => {
                            const typeInfo = getRecTypeInfo(rec.recommendation_type);
                            const IconComponent = typeInfo.icon;
                            
                            return (
                              <div 
                                key={rec.id} 
                                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                                  rec.is_completed ? 'bg-success/5 border-success/20' : 'bg-card'
                                }`}
                              >
                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                                  rec.is_completed ? 'bg-success/20' : 'bg-primary/10'
                                }`}>
                                  <IconComponent className={`h-4 w-4 ${rec.is_completed ? 'text-success' : 'text-primary'}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <p className={`font-medium ${rec.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                                        {rec.title}
                                      </p>
                                      <Badge variant="outline" className="text-xs mt-1">
                                        {typeInfo.label}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      {isModerator && (
                                        <>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={() => toggleRecommendationComplete(rec.id, rec.is_completed)}
                                          >
                                            <CheckCircle2 className={`h-4 w-4 ${rec.is_completed ? 'text-success' : 'text-muted-foreground'}`} />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-destructive hover:text-destructive"
                                            onClick={() => deleteRecommendation(rec.id)}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  {rec.description && (
                                    <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                                  )}
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {rec.facility_name && (
                                      <Badge variant="secondary" className="text-xs">
                                        <Building className="h-3 w-3 mr-1" />
                                        {rec.facility_name}
                                      </Badge>
                                    )}
                                    {rec.recommended_duration && (
                                      <Badge variant="secondary" className="text-xs">
                                        <Clock className="h-3 w-3 mr-1" />
                                        {rec.recommended_duration}
                                      </Badge>
                                    )}
                                    {rec.frequency && (
                                      <Badge variant="secondary" className="text-xs">
                                        <Calendar className="h-3 w-3 mr-1" />
                                        {rec.frequency}
                                      </Badge>
                                    )}
                                    {rec.therapy_type && (
                                      <Badge variant="secondary" className="text-xs">
                                        {rec.therapy_type}
                                      </Badge>
                                    )}
                                  </div>
                                  {rec.is_completed && rec.completed_at && (
                                    <p className="text-xs text-success mt-2">
                                      Completed {format(new Date(rec.completed_at), 'MMM d, yyyy')}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Actions */}
                      {isModerator && (
                        <div className="flex gap-2 mt-4 pt-4 border-t">
                          <Dialog 
                            open={isAddRecommendationOpen && selectedPlanId === plan.id} 
                            onOpenChange={(open) => {
                              setIsAddRecommendationOpen(open);
                              if (open) setSelectedPlanId(plan.id);
                              else resetRecommendationForm();
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="gap-1">
                                <Plus className="h-4 w-4" />
                                Add Recommendation
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Add Recommendation</DialogTitle>
                                <DialogDescription>
                                  Add a specific aftercare recommendation to this plan
                                </DialogDescription>
                              </DialogHeader>
                              <ScrollArea className="max-h-[60vh]">
                                <div className="space-y-4 pt-4 pr-4">
                                  <div className="space-y-2">
                                    <Label>Type *</Label>
                                    <Select value={newRecType} onValueChange={setNewRecType}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {RECOMMENDATION_TYPES.map(type => (
                                          <SelectItem key={type.value} value={type.value}>
                                            <div className="flex items-center gap-2">
                                              <type.icon className="h-4 w-4" />
                                              {type.label}
                                            </div>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label>Title *</Label>
                                    <Input
                                      placeholder="e.g., Attend AA meetings"
                                      value={newRecTitle}
                                      onChange={(e) => setNewRecTitle(e.target.value)}
                                    />
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Textarea
                                      placeholder="Additional details..."
                                      value={newRecDescription}
                                      onChange={(e) => setNewRecDescription(e.target.value)}
                                    />
                                  </div>
                                  
                                  {(newRecType === 'sober_living' || newRecType === 'iop') && (
                                    <div className="space-y-2">
                                      <Label>Facility Name</Label>
                                      <Input
                                        placeholder="Name of facility"
                                        value={newRecFacility}
                                        onChange={(e) => setNewRecFacility(e.target.value)}
                                      />
                                    </div>
                                  )}
                                  
                                  <div className="space-y-2">
                                    <Label>Recommended Duration</Label>
                                    <Select value={newRecDuration} onValueChange={setNewRecDuration}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select duration" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {DURATION_OPTIONS.map(opt => (
                                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  
                                  {(newRecType === 'meeting_attendance' || newRecType === 'individual_therapy' ||
                                    newRecType === 'couples_therapy' || newRecType === 'family_therapy') && (
                                    <div className="space-y-2">
                                      <Label>Frequency</Label>
                                      <Select value={newRecFrequency} onValueChange={setNewRecFrequency}>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select frequency" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {FREQUENCY_OPTIONS.map(opt => (
                                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  )}
                                  
                                  {(newRecType === 'individual_therapy' || newRecType === 'couples_therapy' || 
                                    newRecType === 'family_therapy') && (
                                    <div className="space-y-2">
                                      <Label>Therapeutic Modality</Label>
                                      <Select value={newRecTherapyType} onValueChange={setNewRecTherapyType}>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select modality" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {THERAPY_MODALITIES.map(opt => (
                                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  )}
                                  
                                  <Button 
                                    onClick={addRecommendation}
                                    disabled={!newRecType || !newRecTitle || isAddingRec}
                                    className="w-full"
                                  >
                                    {isAddingRec ? 'Adding...' : 'Add Recommendation'}
                                  </Button>
                                </div>
                              </ScrollArea>
                            </DialogContent>
                          </Dialog>
                          
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive hover:text-destructive gap-1"
                            onClick={() => deletePlan(plan.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete Plan
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}