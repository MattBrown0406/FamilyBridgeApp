import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangle, 
  Bell, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Phone,
  Mail,
  Calendar,
  ChevronRight,
  Flame,
  Snowflake
} from 'lucide-react';
import { differenceInDays, differenceInHours, format, addDays, isBefore } from 'date-fns';
import { cn } from '@/lib/utils';

type PipelineStage = 'lead' | 'contacted' | 'intake' | 'active' | 'aftercare' | 'alumni' | 'lost';
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
  title: string;
  lead_id: string | null;
  due_date: string | null;
  status: string;
}

interface CRMActivity {
  id: string;
  activity_type: string;
  lead_id: string | null;
  occurred_at: string;
}

interface CRMLeadScoringProps {
  leads: Lead[];
  tasks: Task[];
  activities: CRMActivity[];
  onLeadClick: (lead: Lead) => void;
  onQuickAction: (leadId: string, action: 'call' | 'email' | 'task') => void;
}

interface ScoredLead extends Lead {
  score: number;
  scoreBreakdown: {
    priority: number;
    recency: number;
    engagement: number;
    stage: number;
  };
  lastActivity: Date | null;
  daysSinceActivity: number;
  isHot: boolean;
  isCold: boolean;
  needsAttention: boolean;
  nextTask: Task | null;
}

export function calculateLeadScore(
  lead: Lead, 
  activities: CRMActivity[], 
  tasks: Task[]
): { score: number; breakdown: { priority: number; recency: number; engagement: number; stage: number } } {
  let score = 0;
  const breakdown = { priority: 0, recency: 0, engagement: 0, stage: 0 };

  // Priority score (0-25)
  const priorityScores: Record<Priority, number> = {
    urgent: 25,
    high: 20,
    medium: 12,
    low: 5,
  };
  breakdown.priority = priorityScores[lead.priority];
  score += breakdown.priority;

  // Recency score (0-25) - how recently was the lead created/updated
  const daysSinceCreation = differenceInDays(new Date(), new Date(lead.created_at));
  if (daysSinceCreation <= 1) breakdown.recency = 25;
  else if (daysSinceCreation <= 3) breakdown.recency = 20;
  else if (daysSinceCreation <= 7) breakdown.recency = 15;
  else if (daysSinceCreation <= 14) breakdown.recency = 10;
  else if (daysSinceCreation <= 30) breakdown.recency = 5;
  else breakdown.recency = 0;
  score += breakdown.recency;

  // Engagement score (0-25) - based on activity count
  const leadActivities = activities.filter(a => a.lead_id === lead.id);
  const activityCount = leadActivities.length;
  if (activityCount >= 10) breakdown.engagement = 25;
  else if (activityCount >= 5) breakdown.engagement = 20;
  else if (activityCount >= 3) breakdown.engagement = 15;
  else if (activityCount >= 1) breakdown.engagement = 10;
  else breakdown.engagement = 0;
  score += breakdown.engagement;

  // Stage score (0-25) - further along = higher score
  const stageScores: Record<PipelineStage, number> = {
    lead: 5,
    contacted: 10,
    intake: 20,
    active: 25,
    aftercare: 20,
    alumni: 15,
    lost: 0,
  };
  breakdown.stage = stageScores[lead.stage];
  score += breakdown.stage;

  return { score, breakdown };
}

export function CRMLeadScoring({ leads, tasks, activities, onLeadClick, onQuickAction }: CRMLeadScoringProps) {
  const scoredLeads = useMemo<ScoredLead[]>(() => {
    return leads
      .filter(lead => !['alumni', 'lost'].includes(lead.stage))
      .map(lead => {
        const { score, breakdown } = calculateLeadScore(lead, activities, tasks);
        
        const leadActivities = activities.filter(a => a.lead_id === lead.id);
        const lastActivity = leadActivities.length > 0
          ? new Date(Math.max(...leadActivities.map(a => new Date(a.occurred_at).getTime())))
          : null;
        
        const daysSinceActivity = lastActivity 
          ? differenceInDays(new Date(), lastActivity)
          : differenceInDays(new Date(), new Date(lead.created_at));
        
        const pendingTasks = tasks.filter(t => t.lead_id === lead.id && t.status === 'pending');
        const nextTask = pendingTasks.sort((a, b) => {
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        })[0] || null;

        return {
          ...lead,
          score,
          scoreBreakdown: breakdown,
          lastActivity,
          daysSinceActivity,
          isHot: score >= 70 && daysSinceActivity <= 2,
          isCold: daysSinceActivity >= 7 && !['active', 'aftercare'].includes(lead.stage),
          needsAttention: daysSinceActivity >= 3 && !['active', 'aftercare'].includes(lead.stage),
          nextTask,
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [leads, tasks, activities]);

  const hotLeads = scoredLeads.filter(l => l.isHot);
  const coldLeads = scoredLeads.filter(l => l.isCold);
  const needsFollowUp = scoredLeads.filter(l => l.needsAttention && !l.isCold);

  // Get upcoming reminders (tasks due soon)
  const upcomingReminders = tasks
    .filter(t => t.status === 'pending' && t.due_date && t.lead_id)
    .filter(t => {
      const dueDate = new Date(t.due_date!);
      return isBefore(dueDate, addDays(new Date(), 3));
    })
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Alert Sections */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Hot Leads */}
        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-orange-600">
              <Flame className="h-4 w-4" />
              Hot Leads ({hotLeads.length})
            </CardTitle>
            <CardDescription className="text-xs">High score, recent activity</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[150px]">
              <div className="space-y-2">
                {hotLeads.slice(0, 5).map(lead => (
                  <div 
                    key={lead.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-orange-50 dark:bg-orange-950/30 cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-950/50"
                    onClick={() => onLeadClick(lead)}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{lead.contact_name}</p>
                      <p className="text-xs text-muted-foreground">{lead.stage}</p>
                    </div>
                    <Badge className="bg-orange-500 text-white">{lead.score}</Badge>
                  </div>
                ))}
                {hotLeads.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">No hot leads right now</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Needs Follow-up */}
        <Card className="border-yellow-200 dark:border-yellow-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-yellow-600">
              <Clock className="h-4 w-4" />
              Needs Follow-up ({needsFollowUp.length})
            </CardTitle>
            <CardDescription className="text-xs">No activity in 3+ days</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[150px]">
              <div className="space-y-2">
                {needsFollowUp.slice(0, 5).map(lead => (
                  <div 
                    key={lead.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-950/50"
                    onClick={() => onLeadClick(lead)}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{lead.contact_name}</p>
                      <p className="text-xs text-muted-foreground">{lead.daysSinceActivity}d ago</p>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6"
                        onClick={(e) => { e.stopPropagation(); onQuickAction(lead.id, 'call'); }}
                      >
                        <Phone className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6"
                        onClick={(e) => { e.stopPropagation(); onQuickAction(lead.id, 'email'); }}
                      >
                        <Mail className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                {needsFollowUp.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">All leads have recent activity</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Cold Leads */}
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-blue-600">
              <Snowflake className="h-4 w-4" />
              Going Cold ({coldLeads.length})
            </CardTitle>
            <CardDescription className="text-xs">No activity in 7+ days</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[150px]">
              <div className="space-y-2">
                {coldLeads.slice(0, 5).map(lead => (
                  <div 
                    key={lead.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-950/50"
                    onClick={() => onLeadClick(lead)}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{lead.contact_name}</p>
                      <p className="text-xs text-muted-foreground">{lead.daysSinceActivity}d since contact</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      <TrendingDown className="h-3 w-3 mr-1" />
                      {lead.score}
                    </Badge>
                  </div>
                ))}
                {coldLeads.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">No cold leads</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Reminders */}
      {upcomingReminders.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              Upcoming Reminders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {upcomingReminders.map(task => {
                const lead = leads.find(l => l.id === task.lead_id);
                const dueDate = new Date(task.due_date!);
                const hoursUntilDue = differenceInHours(dueDate, new Date());
                const isOverdue = hoursUntilDue < 0;
                
                return (
                  <div 
                    key={task.id}
                    className={cn(
                      'flex-shrink-0 p-3 rounded-lg border min-w-[200px]',
                      isOverdue ? 'border-red-300 bg-red-50 dark:bg-red-950/30' : 'bg-muted/50'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        {lead && (
                          <p className="text-xs text-muted-foreground truncate">{lead.contact_name}</p>
                        )}
                      </div>
                      <Calendar className={cn(
                        'h-4 w-4 flex-shrink-0',
                        isOverdue ? 'text-red-500' : 'text-muted-foreground'
                      )} />
                    </div>
                    <p className={cn(
                      'text-xs mt-2',
                      isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'
                    )}>
                      {isOverdue ? 'Overdue: ' : 'Due: '}
                      {format(dueDate, 'MMM d, h:mm a')}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lead Score Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Lead Score Breakdown</CardTitle>
          <CardDescription>Top leads ranked by engagement potential</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {scoredLeads.slice(0, 10).map((lead, index) => (
              <div 
                key={lead.id}
                className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => onLeadClick(lead)}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                  {index + 1}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{lead.contact_name}</p>
                    {lead.isHot && <Flame className="h-4 w-4 text-orange-500" />}
                    {lead.isCold && <Snowflake className="h-4 w-4 text-blue-500" />}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {lead.stage} • Last activity: {lead.daysSinceActivity}d ago
                  </p>
                </div>

                <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                  <div className="text-right mr-4">
                    <div className="flex gap-1 text-xs text-muted-foreground">
                      <span title="Priority">P:{lead.scoreBreakdown.priority}</span>
                      <span title="Recency">R:{lead.scoreBreakdown.recency}</span>
                      <span title="Engagement">E:{lead.scoreBreakdown.engagement}</span>
                      <span title="Stage">S:{lead.scoreBreakdown.stage}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-24">
                    <Progress value={lead.score} className="h-2" />
                  </div>
                  <span className={cn(
                    'font-bold text-sm w-8 text-right',
                    lead.score >= 70 ? 'text-green-600' : lead.score >= 40 ? 'text-yellow-600' : 'text-red-600'
                  )}>
                    {lead.score}
                  </span>
                </div>

                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
