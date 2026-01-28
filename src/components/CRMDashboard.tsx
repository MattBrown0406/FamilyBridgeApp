import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { fetchProfilesByIds } from '@/lib/profileApi';
import { formatPhoneNumber } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { 
  Plus, 
  Users, 
  Phone, 
  Mail, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  TrendingUp,
  UserPlus,
  ClipboardList,
  BarChart3,
  Loader2,
  ArrowRight,
  Building2,
  ChevronRight,
  X,
  Edit2,
  Trash2,
  Activity,
  MessageSquare,
  PhoneCall,
  FileText,
  Video,
  LayoutGrid,
  Target
} from 'lucide-react';
import { format, formatDistanceToNow, isAfter, isBefore, addDays } from 'date-fns';
import { CRMKanbanBoard, CRMActivityTimeline, CRMAnalyticsDashboard, CRMLeadScoring, calculateLeadScore } from './crm';

type PipelineStage = 'lead' | 'contacted' | 'intake' | 'active' | 'aftercare' | 'alumni' | 'lost';
type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
type Priority = 'low' | 'medium' | 'high' | 'urgent';

interface Lead {
  id: string;
  organization_id: string;
  created_by: string;
  assigned_to: string | null;
  contact_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  patient_name: string | null;
  patient_age: string | null;
  presenting_issue: string | null;
  stage: PipelineStage;
  stage_entered_at: string;
  referral_source_id: string | null;
  referral_notes: string | null;
  converted_to_family_id: string | null;
  converted_at: string | null;
  lost_reason: string | null;
  notes: string | null;
  priority: Priority;
  estimated_value: number | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

interface Task {
  id: string;
  organization_id: string;
  created_by: string;
  assigned_to: string | null;
  title: string;
  description: string | null;
  task_type: string;
  priority: Priority;
  lead_id: string | null;
  family_id: string | null;
  due_date: string | null;
  completed_at: string | null;
  status: TaskStatus;
  created_at: string;
}

interface CRMActivity {
  id: string;
  activity_type: string;
  title: string;
  description: string | null;
  occurred_at: string;
  user_id: string;
  lead_id: string | null;
  family_id: string | null;
}

interface ReferralSource {
  id: string;
  name: string;
  source_type: string;
  contact_name: string | null;
  contact_email: string | null;
  is_active: boolean;
}

interface Family {
  id: string;
  name: string;
}

interface OrgMember {
  user_id: string;
  full_name: string;
  role: string;
}

interface CRMDashboardProps {
  organizationId: string;
  organizationName: string;
  organizationLogo?: string;
  families: Family[];
  orgMembers: OrgMember[];
}

const PIPELINE_STAGES: { value: PipelineStage; label: string; color: string }[] = [
  { value: 'lead', label: 'New Lead', color: 'bg-slate-500' },
  { value: 'contacted', label: 'Contacted', color: 'bg-blue-500' },
  { value: 'intake', label: 'Intake', color: 'bg-yellow-500' },
  { value: 'active', label: 'Active', color: 'bg-green-500' },
  { value: 'aftercare', label: 'Aftercare', color: 'bg-purple-500' },
  { value: 'alumni', label: 'Alumni', color: 'bg-indigo-500' },
  { value: 'lost', label: 'Lost', color: 'bg-red-500' },
];

const PRIORITY_COLORS: Record<Priority, string> = {
  low: 'bg-slate-100 text-slate-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

export function CRMDashboard({ organizationId, organizationName, organizationLogo, families, orgMembers }: CRMDashboardProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('pipeline');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<CRMActivity[]>([]);
  const [referralSources, setReferralSources] = useState<ReferralSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfiles, setUserProfiles] = useState<Record<string, string>>({});

  // Dialog states
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isLeadDetailOpen, setIsLeadDetailOpen] = useState(false);
  const [isAddReferralSourceOpen, setIsAddReferralSourceOpen] = useState(false);
  const [newReferralSource, setNewReferralSource] = useState({
    name: '',
    source_type: 'other',
  });
  
  // Contact logging state
  const [newContact, setNewContact] = useState({
    contact_type: 'call',
    notes: '',
  });
  const [isLoggingContact, setIsLoggingContact] = useState(false);
  const [leadActivities, setLeadActivities] = useState<CRMActivity[]>([]);

  // Form states
  const [newLead, setNewLead] = useState({
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    patient_name: '',
    presenting_issue: '',
    referral_source_id: '',
    priority: 'medium' as Priority,
    notes: '',
  });

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    task_type: 'follow_up',
    priority: 'medium' as Priority,
    assigned_to: '',
    due_date: '',
    lead_id: '',
    family_id: '',
  });

  useEffect(() => {
    if (organizationId) {
      fetchAllData();
    }
  }, [organizationId]);

  const fetchAllData = async () => {
    setIsLoading(true);
    await Promise.all([
      fetchLeads(),
      fetchTasks(),
      fetchActivities(),
      fetchReferralSources(),
    ]);
    setIsLoading(false);
  };

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('crm_leads')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads((data as Lead[]) || []);

      // Fetch user profiles for assigned_to
      const userIds = [...new Set((data || []).map(l => l.assigned_to).filter(Boolean))];
      if (userIds.length > 0) {
        const profiles = await fetchProfilesByIds(userIds as string[]);
        const profileMap: Record<string, string> = {};
        profiles.forEach(p => {
          profileMap[p.id] = p.full_name;
        });
        setUserProfiles(prev => ({ ...prev, ...profileMap }));
      }
    } catch (err) {
      console.error('Error fetching leads:', err);
    }
  };

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('crm_tasks')
        .select('*')
        .eq('organization_id', organizationId)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setTasks((data as Task[]) || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    }
  };

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('crm_activities')
        .select('*')
        .eq('organization_id', organizationId)
        .order('occurred_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setActivities((data as CRMActivity[]) || []);
    } catch (err) {
      console.error('Error fetching activities:', err);
    }
  };

  const fetchReferralSources = async () => {
    try {
      const { data, error } = await supabase
        .from('crm_referral_sources')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true);

      if (error) throw error;
      setReferralSources((data as ReferralSource[]) || []);
    } catch (err) {
      console.error('Error fetching referral sources:', err);
    }
  };

  const handleCreateLead = async () => {
    if (!newLead.contact_name.trim()) {
      toast({ title: 'Error', description: 'Contact name is required', variant: 'destructive' });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('crm_leads')
        .insert({
          organization_id: organizationId,
          created_by: user?.id,
          contact_name: newLead.contact_name,
          contact_email: newLead.contact_email || null,
          contact_phone: newLead.contact_phone || null,
          patient_name: newLead.patient_name || null,
          presenting_issue: newLead.presenting_issue || null,
          referral_source_id: newLead.referral_source_id || null,
          priority: newLead.priority,
          notes: newLead.notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await supabase.from('crm_activities').insert({
        organization_id: organizationId,
        user_id: user?.id,
        activity_type: 'note',
        title: 'Lead created',
        lead_id: data.id,
      });

      toast({ title: 'Success', description: 'Lead created successfully' });
      setNewLead({
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        patient_name: '',
        presenting_issue: '',
        referral_source_id: '',
        priority: 'medium',
        notes: '',
      });
      setIsAddLeadOpen(false);
      fetchLeads();
      fetchActivities();
    } catch (err: any) {
      console.error('Error creating lead:', err);
      toast({ title: 'Error', description: err.message || 'Failed to create lead', variant: 'destructive' });
    }
  };

  const handleCreateReferralSource = async () => {
    if (!newReferralSource.name.trim()) {
      toast({ title: 'Error', description: 'Source name is required', variant: 'destructive' });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('crm_referral_sources')
        .insert({
          organization_id: organizationId,
          name: newReferralSource.name,
          source_type: newReferralSource.source_type,
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: 'Success', description: 'Referral source created' });
      
      // Refresh referral sources and auto-select the new one
      await fetchReferralSources();
      setNewLead({ ...newLead, referral_source_id: data.id });
      setNewReferralSource({ name: '', source_type: 'other' });
      setIsAddReferralSourceOpen(false);
    } catch (err: any) {
      console.error('Error creating referral source:', err);
      toast({ title: 'Error', description: err.message || 'Failed to create referral source', variant: 'destructive' });
    }
  };

  const handleUpdateLeadStage = async (leadId: string, newStage: PipelineStage) => {
    const lead = leads.find(l => l.id === leadId);
    
    // If moving to "active" and lead hasn't been converted yet, trigger conversion
    if (newStage === 'active' && lead && !lead.converted_to_family_id) {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session?.access_token) {
          toast({ title: 'Error', description: 'Not authenticated', variant: 'destructive' });
          return;
        }

        const response = await supabase.functions.invoke('convert-lead-to-family', {
          body: {
            leadId,
            organizationId,
            organizationName,
            organizationLogo,
            creatorName: user?.user_metadata?.full_name || undefined,
          },
        });

        if (response.error) {
          throw new Error(response.error.message || 'Failed to convert lead');
        }

        const result = response.data;
        toast({ 
          title: 'Lead Converted', 
          description: result.message || 'Family created and onboarding email sent' 
        });
        
        // Close the lead detail dialog if open
        setIsLeadDetailOpen(false);
        setSelectedLead(null);
        
        fetchLeads();
        fetchActivities();
        return;
      } catch (err: any) {
        console.error('Error converting lead:', err);
        toast({ title: 'Error', description: err.message || 'Failed to convert lead to family', variant: 'destructive' });
        return;
      }
    }
    
    // Standard stage update for non-active stages or already converted leads
    try {
      const { error } = await supabase
        .from('crm_leads')
        .update({ 
          stage: newStage, 
          stage_entered_at: new Date().toISOString() 
        })
        .eq('id', leadId);

      if (error) throw error;

      // Log activity
      await supabase.from('crm_activities').insert({
        organization_id: organizationId,
        user_id: user?.id,
        activity_type: 'stage_change',
        title: `Stage changed to ${PIPELINE_STAGES.find(s => s.value === newStage)?.label}`,
        lead_id: leadId,
      });

      toast({ title: 'Success', description: 'Stage updated' });
      fetchLeads();
      fetchActivities();
    } catch (err: any) {
      console.error('Error updating stage:', err);
      toast({ title: 'Error', description: 'Failed to update stage', variant: 'destructive' });
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) {
      toast({ title: 'Error', description: 'Task title is required', variant: 'destructive' });
      return;
    }

    try {
      const { error } = await supabase
        .from('crm_tasks')
        .insert({
          organization_id: organizationId,
          created_by: user?.id,
          title: newTask.title,
          description: newTask.description || null,
          task_type: newTask.task_type,
          priority: newTask.priority,
          assigned_to: newTask.assigned_to || null,
          due_date: newTask.due_date || null,
          lead_id: newTask.lead_id || null,
          family_id: newTask.family_id || null,
        });

      if (error) throw error;

      toast({ title: 'Success', description: 'Task created successfully' });
      setNewTask({
        title: '',
        description: '',
        task_type: 'follow_up',
        priority: 'medium',
        assigned_to: '',
        due_date: '',
        lead_id: '',
        family_id: '',
      });
      setIsAddTaskOpen(false);
      fetchTasks();
    } catch (err: any) {
      console.error('Error creating task:', err);
      toast({ title: 'Error', description: err.message || 'Failed to create task', variant: 'destructive' });
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      const { error } = await supabase
        .from('crm_tasks')
        .update({ 
          status: 'completed', 
          completed_at: new Date().toISOString() 
        })
        .eq('id', taskId);

      if (error) throw error;

      // Log activity if task is linked to a lead
      if (task?.lead_id) {
        await supabase.from('crm_activities').insert({
          organization_id: organizationId,
          user_id: user?.id,
          activity_type: 'task_completed',
          title: `Task completed: ${task.title}`,
          lead_id: task.lead_id,
          task_id: taskId,
        });
        fetchActivities();
      }

      toast({ title: 'Success', description: 'Task completed' });
      fetchTasks();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to complete task', variant: 'destructive' });
    }
  };

  const fetchLeadActivities = async (leadId: string) => {
    try {
      const { data, error } = await supabase
        .from('crm_activities')
        .select('*')
        .eq('lead_id', leadId)
        .order('occurred_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setLeadActivities((data as CRMActivity[]) || []);
    } catch (err) {
      console.error('Error fetching lead activities:', err);
    }
  };

  const handleLogContact = async () => {
    if (!selectedLead || !newContact.contact_type) return;

    setIsLoggingContact(true);
    try {
      const contactTypeLabels: Record<string, string> = {
        call: 'Phone call',
        text: 'Text message',
        email: 'Email sent',
        meeting: 'Meeting',
        voicemail: 'Left voicemail',
        note: 'Note added',
      };

      const { error } = await supabase.from('crm_activities').insert({
        organization_id: organizationId,
        user_id: user?.id,
        activity_type: newContact.contact_type,
        title: contactTypeLabels[newContact.contact_type] || 'Contact logged',
        description: newContact.notes || null,
        lead_id: selectedLead.id,
      });

      if (error) throw error;

      toast({ title: 'Success', description: 'Contact logged successfully' });
      setNewContact({ contact_type: 'call', notes: '' });
      fetchLeadActivities(selectedLead.id);
      fetchActivities();
    } catch (err: any) {
      console.error('Error logging contact:', err);
      toast({ title: 'Error', description: err.message || 'Failed to log contact', variant: 'destructive' });
    } finally {
      setIsLoggingContact(false);
    }
  };

  // Effect to fetch lead activities when a lead is selected
  useEffect(() => {
    if (selectedLead && isLeadDetailOpen) {
      fetchLeadActivities(selectedLead.id);
    } else {
      setLeadActivities([]);
    }
  }, [selectedLead, isLeadDetailOpen]);

  // Calculate analytics
  const pipelineStats = PIPELINE_STAGES.map(stage => ({
    ...stage,
    count: leads.filter(l => l.stage === stage.value).length,
  }));

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const overdueTasks = pendingTasks.filter(t => t.due_date && isBefore(new Date(t.due_date), new Date()));
  const upcomingTasks = pendingTasks.filter(t => t.due_date && isAfter(new Date(t.due_date), new Date()) && isBefore(new Date(t.due_date), addDays(new Date(), 7)));

  const conversionRate = leads.length > 0 
    ? ((leads.filter(l => l.converted_to_family_id).length / leads.length) * 100).toFixed(1)
    : '0';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <UserPlus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{leads.filter(l => l.stage === 'lead').length}</p>
                <p className="text-xs text-muted-foreground">New Leads</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{leads.filter(l => l.stage === 'active').length}</p>
                <p className="text-xs text-muted-foreground">Active Families</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <ClipboardList className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overdueTasks.length}</p>
                <p className="text-xs text-muted-foreground">Overdue Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-100">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{conversionRate}%</p>
                <p className="text-xs text-muted-foreground">Conversion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="stage-view" className="gap-2">
              <LayoutGrid className="h-4 w-4" />
              Stage View
            </TabsTrigger>
            <TabsTrigger value="pipeline" className="gap-2">
              <ArrowRight className="h-4 w-4" />
              List
            </TabsTrigger>
            <TabsTrigger value="scoring" className="gap-2">
              <Target className="h-4 w-4" />
              Scoring
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              Tasks
              {overdueTasks.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 justify-center">
                  {overdueTasks.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <Activity className="h-4 w-4" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Task
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Task</DialogTitle>
                  <DialogDescription>Add a new task or follow-up</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Title *</Label>
                    <Input
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      placeholder="Follow up with lead..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select value={newTask.task_type} onValueChange={(v) => setNewTask({ ...newTask, task_type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="follow_up">Follow Up</SelectItem>
                          <SelectItem value="call">Call</SelectItem>
                          <SelectItem value="meeting">Meeting</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="document">Document</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Select value={newTask.priority} onValueChange={(v: Priority) => setNewTask({ ...newTask, priority: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input
                      type="datetime-local"
                      value={newTask.due_date}
                      onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Assign To</Label>
                    <Select value={newTask.assigned_to} onValueChange={(v) => setNewTask({ ...newTask, assigned_to: v })}>
                      <SelectTrigger><SelectValue placeholder="Select team member..." /></SelectTrigger>
                      <SelectContent>
                        {orgMembers.map((member) => (
                          <SelectItem key={member.user_id} value={member.user_id}>
                            {member.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Related Lead</Label>
                      <Select value={newTask.lead_id || '_none'} onValueChange={(v) => setNewTask({ ...newTask, lead_id: v === '_none' ? '' : v, family_id: '' })}>
                        <SelectTrigger><SelectValue placeholder="Optional..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_none">None</SelectItem>
                          {leads.map((lead) => (
                            <SelectItem key={lead.id} value={lead.id}>
                              {lead.contact_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Related Family</Label>
                      <Select value={newTask.family_id || '_none'} onValueChange={(v) => setNewTask({ ...newTask, family_id: v === '_none' ? '' : v, lead_id: '' })}>
                        <SelectTrigger><SelectValue placeholder="Optional..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_none">None</SelectItem>
                          {families.map((family) => (
                            <SelectItem key={family.id} value={family.id}>
                              {family.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                      placeholder="Additional details..."
                      rows={2}
                    />
                  </div>
                  <Button onClick={handleCreateTask} className="w-full">Create Task</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddLeadOpen} onOpenChange={setIsAddLeadOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Lead
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add New Lead</DialogTitle>
                  <DialogDescription>Create a new prospect or inquiry</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                  <div className="space-y-2">
                    <Label>Contact Name *</Label>
                    <Input
                      value={newLead.contact_name}
                      onChange={(e) => setNewLead({ ...newLead, contact_name: e.target.value })}
                      placeholder="John Smith"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={newLead.contact_email}
                        onChange={(e) => setNewLead({ ...newLead, contact_email: e.target.value })}
                        placeholder="john@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={newLead.contact_phone}
                        onChange={(e) => setNewLead({ ...newLead, contact_phone: e.target.value })}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Patient/Loved One Name</Label>
                      <Input
                        value={newLead.patient_name}
                        onChange={(e) => setNewLead({ ...newLead, patient_name: e.target.value })}
                        placeholder="Name of person in recovery"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Select value={newLead.priority} onValueChange={(v: Priority) => setNewLead({ ...newLead, priority: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Presenting Issue</Label>
                    <Textarea
                      value={newLead.presenting_issue}
                      onChange={(e) => setNewLead({ ...newLead, presenting_issue: e.target.value })}
                      placeholder="Brief description of the situation..."
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Referral Source</Label>
                    <Select 
                      value={newLead.referral_source_id || '_none'} 
                      onValueChange={(v) => {
                        if (v === '_add_new') {
                          setIsAddReferralSourceOpen(true);
                        } else {
                          setNewLead({ ...newLead, referral_source_id: v === '_none' ? '' : v });
                        }
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder="How did they find us?" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none">Unknown</SelectItem>
                        {referralSources.map((source) => (
                          <SelectItem key={source.id} value={source.id}>
                            {source.name} ({source.source_type})
                          </SelectItem>
                        ))}
                        <SelectItem value="_add_new" className="text-primary font-medium">
                          <span className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Add New Source...
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      value={newLead.notes}
                      onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                      placeholder="Additional notes..."
                      rows={2}
                    />
                  </div>
                  <Button onClick={handleCreateLead} className="w-full">Add Lead</Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Add Referral Source Dialog */}
            <Dialog open={isAddReferralSourceOpen} onOpenChange={setIsAddReferralSourceOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Referral Source</DialogTitle>
                  <DialogDescription>
                    Create a new referral source to track where leads come from.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Source Name *</Label>
                    <Input
                      value={newReferralSource.name}
                      onChange={(e) => setNewReferralSource({ ...newReferralSource, name: e.target.value })}
                      placeholder="e.g., Dr. Smith, Google Ads, Hospital..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Source Type</Label>
                    <Select 
                      value={newReferralSource.source_type} 
                      onValueChange={(v) => setNewReferralSource({ ...newReferralSource, source_type: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hospital">Hospital</SelectItem>
                        <SelectItem value="therapist">Therapist</SelectItem>
                        <SelectItem value="physician">Physician</SelectItem>
                        <SelectItem value="insurance">Insurance</SelectItem>
                        <SelectItem value="website">Website</SelectItem>
                        <SelectItem value="social_media">Social Media</SelectItem>
                        <SelectItem value="referral">Referral</SelectItem>
                        <SelectItem value="alumni">Alumni</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" onClick={() => setIsAddReferralSourceOpen(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button onClick={handleCreateReferralSource} className="flex-1">
                      Add Source
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stage View */}
        <TabsContent value="stage-view" className="mt-4">
          <CRMKanbanBoard
            leads={leads}
            onLeadClick={(lead) => {
              setSelectedLead(lead);
              setIsLeadDetailOpen(true);
            }}
            onStageChange={handleUpdateLeadStage}
            calculateLeadScore={(lead) => calculateLeadScore(lead, activities, tasks).score}
          />
        </TabsContent>

        {/* Pipeline List View */}
        <TabsContent value="pipeline" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            {PIPELINE_STAGES.map((stage) => {
              const stageLeads = leads.filter(l => l.stage === stage.value);
              return (
                <Card key={stage.value} className="min-h-[400px]">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${stage.color}`} />
                        {stage.label}
                      </CardTitle>
                      <Badge variant="secondary">{stageLeads.length}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {stageLeads.map((lead) => (
                      <Card 
                        key={lead.id} 
                        className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => {
                          setSelectedLead(lead);
                          setIsLeadDetailOpen(true);
                        }}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <p className="font-medium text-sm">{lead.contact_name}</p>
                            <Badge className={PRIORITY_COLORS[lead.priority]} variant="secondary">
                              {lead.priority}
                            </Badge>
                          </div>
                          {lead.patient_name && (
                            <p className="text-xs text-muted-foreground">
                              Patient: {lead.patient_name}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(lead.stage_entered_at), { addSuffix: true })}
                          </div>
                        </div>
                      </Card>
                    ))}
                    {stageLeads.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        No leads in this stage
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Lead Scoring View - NEW */}
        <TabsContent value="scoring" className="mt-4">
          <CRMLeadScoring
            leads={leads}
            tasks={tasks}
            activities={activities}
            onLeadClick={(lead) => {
              setSelectedLead(lead);
              setIsLeadDetailOpen(true);
            }}
            onQuickAction={(leadId, action) => {
              const lead = leads.find(l => l.id === leadId);
              if (!lead) return;
              
              if (action === 'call' && lead.contact_phone) {
                window.open(`tel:${lead.contact_phone}`, '_blank');
              } else if (action === 'email' && lead.contact_email) {
                window.open(`mailto:${lead.contact_email}`, '_blank');
              } else if (action === 'task') {
                setNewTask({ ...newTask, lead_id: leadId });
                setIsAddTaskOpen(true);
              }
            }}
          />
        </TabsContent>

        {/* Tasks View */}
        <TabsContent value="tasks" className="mt-4 space-y-4">
          {overdueTasks.length > 0 && (
            <Card className="border-destructive/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Overdue Tasks ({overdueTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {overdueTasks.map((task) => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    leads={leads}
                    families={families}
                    orgMembers={orgMembers}
                    onComplete={handleCompleteTask}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {upcomingTasks.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Due This Week ({upcomingTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {upcomingTasks.map((task) => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    leads={leads}
                    families={families}
                    orgMembers={orgMembers}
                    onComplete={handleCompleteTask}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                All Pending Tasks ({pendingTasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {pendingTasks.map((task) => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  leads={leads}
                  families={families}
                  orgMembers={orgMembers}
                  onComplete={handleCompleteTask}
                />
              ))}
              {pendingTasks.length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  No pending tasks
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Feed - Enhanced */}
        <TabsContent value="activity" className="mt-4">
          <CRMActivityTimeline
            activities={activities}
            leads={leads}
            families={families}
            userProfiles={userProfiles}
          />
        </TabsContent>

        {/* Analytics - Enhanced */}
        <TabsContent value="analytics" className="mt-4">
          <CRMAnalyticsDashboard
            leads={leads}
            tasks={tasks}
            referralSources={referralSources}
            familyCount={families.length}
          />
        </TabsContent>
      </Tabs>

      {/* Lead Detail Dialog */}
      <Dialog open={isLeadDetailOpen} onOpenChange={setIsLeadDetailOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedLead && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedLead.contact_name}
                  <Badge className={PRIORITY_COLORS[selectedLead.priority]}>
                    {selectedLead.priority}
                  </Badge>
                </DialogTitle>
                <DialogDescription>Lead details and stage management</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {selectedLead.contact_email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${selectedLead.contact_email}`} className="text-primary hover:underline">
                        {selectedLead.contact_email}
                      </a>
                    </div>
                  )}
                  {selectedLead.contact_phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${selectedLead.contact_phone}`} className="text-primary hover:underline">
                        {formatPhoneNumber(selectedLead.contact_phone)}
                      </a>
                    </div>
                  )}
                </div>

                {selectedLead.patient_name && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Patient/Loved One</Label>
                    <p className="text-sm">{selectedLead.patient_name}</p>
                  </div>
                )}

                {selectedLead.presenting_issue && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Presenting Issue</Label>
                    <p className="text-sm">{selectedLead.presenting_issue}</p>
                  </div>
                )}

                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Current Stage</Label>
                  <Select 
                    value={selectedLead.stage} 
                    onValueChange={(v: PipelineStage) => handleUpdateLeadStage(selectedLead.id, v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PIPELINE_STAGES.map((stage) => (
                        <SelectItem key={stage.value} value={stage.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${stage.color}`} />
                            {stage.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedLead.notes && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Notes</Label>
                    <p className="text-sm">{selectedLead.notes}</p>
                  </div>
                )}

                {/* Log Contact Section */}
                <div className="border-t pt-4">
                  <Label className="text-sm font-medium mb-3 block">Log a Contact</Label>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: 'call', label: 'Call', icon: PhoneCall },
                        { value: 'text', label: 'Text', icon: MessageSquare },
                        { value: 'email', label: 'Email', icon: Mail },
                        { value: 'meeting', label: 'Meeting', icon: Video },
                        { value: 'voicemail', label: 'Voicemail', icon: Phone },
                        { value: 'note', label: 'Note', icon: FileText },
                      ].map(({ value, label, icon: Icon }) => (
                        <Button
                          key={value}
                          type="button"
                          variant={newContact.contact_type === value ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setNewContact({ ...newContact, contact_type: value })}
                          className="gap-1"
                        >
                          <Icon className="h-3 w-3" />
                          {label}
                        </Button>
                      ))}
                    </div>
                    <Textarea
                      placeholder="Add notes about this contact..."
                      value={newContact.notes}
                      onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                      rows={2}
                    />
                    <Button 
                      onClick={handleLogContact} 
                      disabled={isLoggingContact}
                      size="sm"
                      className="w-full"
                    >
                      {isLoggingContact ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      Log Contact
                    </Button>
                  </div>
                </div>

                {/* Contact History */}
                {leadActivities.length > 0 && (
                  <div className="border-t pt-4">
                    <Label className="text-sm font-medium mb-3 block">Recent Activity</Label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {leadActivities.map((activity) => {
                        const activityIcons: Record<string, React.ReactNode> = {
                          call: <PhoneCall className="h-3 w-3" />,
                          text: <MessageSquare className="h-3 w-3" />,
                          email: <Mail className="h-3 w-3" />,
                          meeting: <Video className="h-3 w-3" />,
                          voicemail: <Phone className="h-3 w-3" />,
                          note: <FileText className="h-3 w-3" />,
                          stage_change: <ArrowRight className="h-3 w-3" />,
                          task_completed: <CheckCircle2 className="h-3 w-3" />,
                        };
                        return (
                          <div key={activity.id} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 text-sm">
                            <div className="p-1 rounded bg-background">
                              {activityIcons[activity.activity_type] || <Activity className="h-3 w-3" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-xs">{activity.title}</p>
                              {activity.description && (
                                <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                              )}
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {formatDistanceToNow(new Date(activity.occurred_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  Created {format(new Date(selectedLead.created_at), 'PPp')}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Task Card Component
function TaskCard({ 
  task, 
  leads, 
  families, 
  orgMembers,
  onComplete 
}: { 
  task: Task; 
  leads: Lead[];
  families: Family[];
  orgMembers: OrgMember[];
  onComplete: (id: string) => void;
}) {
  const lead = leads.find(l => l.id === task.lead_id);
  const family = families.find(f => f.id === task.family_id);
  const assignee = orgMembers.find(m => m.user_id === task.assigned_to);
  const isOverdue = task.due_date && isBefore(new Date(task.due_date), new Date());

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${isOverdue ? 'border-destructive/50 bg-destructive/5' : ''}`}>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0"
        onClick={() => onComplete(task.id)}
      >
        <CheckCircle2 className={`h-4 w-4 ${task.status === 'completed' ? 'text-green-500' : 'text-muted-foreground'}`} />
      </Button>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{task.title}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {task.due_date && (
            <span className={isOverdue ? 'text-destructive' : ''}>
              Due {format(new Date(task.due_date), 'MMM d, h:mm a')}
            </span>
          )}
          {assignee && <span>• {assignee.full_name}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {lead && <Badge variant="outline" className="text-xs">{lead.contact_name}</Badge>}
        {family && <Badge variant="outline" className="text-xs">{family.name}</Badge>}
        <Badge className={PRIORITY_COLORS[task.priority]} variant="secondary">
          {task.priority}
        </Badge>
      </div>
    </div>
  );
}

export default CRMDashboard;
