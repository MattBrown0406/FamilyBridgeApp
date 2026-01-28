import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  FunnelChart,
  Funnel,
  LabelList,
  Area,
  AreaChart
} from 'recharts';
import { TrendingUp, TrendingDown, Users, Target, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { differenceInDays, subDays, format, startOfDay, eachDayOfInterval } from 'date-fns';
import { cn } from '@/lib/utils';

type PipelineStage = 'lead' | 'contacted' | 'intake' | 'active' | 'aftercare' | 'alumni' | 'lost';

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
  priority: string;
  estimated_value: number | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

interface Task {
  id: string;
  status: string;
  due_date: string | null;
  completed_at: string | null;
}

interface ReferralSource {
  id: string;
  name: string;
  source_type: string;
}

interface CRMAnalyticsDashboardProps {
  leads: Lead[];
  tasks: Task[];
  referralSources: ReferralSource[];
  familyCount: number;
}

const PIPELINE_STAGES: { value: PipelineStage; label: string; color: string }[] = [
  { value: 'lead', label: 'New Lead', color: '#64748b' },
  { value: 'contacted', label: 'Contacted', color: '#3b82f6' },
  { value: 'intake', label: 'Intake', color: '#eab308' },
  { value: 'active', label: 'Active', color: '#22c55e' },
  { value: 'aftercare', label: 'Aftercare', color: '#a855f7' },
  { value: 'alumni', label: 'Alumni', color: '#6366f1' },
  { value: 'lost', label: 'Lost', color: '#ef4444' },
];

const PIE_COLORS = ['#3b82f6', '#22c55e', '#eab308', '#a855f7', '#f97316', '#ec4899', '#14b8a6'];

export function CRMAnalyticsDashboard({ leads, tasks, referralSources, familyCount }: CRMAnalyticsDashboardProps) {
  // Calculate funnel data
  const funnelData = PIPELINE_STAGES.filter(s => !['lost', 'alumni'].includes(s.value)).map(stage => ({
    name: stage.label,
    value: leads.filter(l => l.stage === stage.value).length,
    fill: stage.color,
  }));

  // Calculate conversion rate
  const totalLeads = leads.length;
  const convertedLeads = leads.filter(l => l.converted_to_family_id).length;
  const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100) : 0;
  const lostLeads = leads.filter(l => l.stage === 'lost').length;
  const lostRate = totalLeads > 0 ? ((lostLeads / totalLeads) * 100) : 0;

  // Calculate average time in each stage
  const stageTimeData = PIPELINE_STAGES.slice(0, 4).map(stage => {
    const stageLeads = leads.filter(l => l.stage === stage.value);
    const avgDays = stageLeads.length > 0
      ? stageLeads.reduce((sum, l) => sum + differenceInDays(new Date(), new Date(l.stage_entered_at)), 0) / stageLeads.length
      : 0;
    return {
      name: stage.label,
      days: Math.round(avgDays * 10) / 10,
      fill: stage.color,
    };
  });

  // Calculate leads over time (last 30 days)
  const last30Days = eachDayOfInterval({
    start: subDays(new Date(), 29),
    end: new Date()
  });

  const leadsOverTime = last30Days.map(date => {
    const dayStart = startOfDay(date);
    const newLeads = leads.filter(l => {
      const created = startOfDay(new Date(l.created_at));
      return created.getTime() === dayStart.getTime();
    }).length;
    
    const conversions = leads.filter(l => {
      if (!l.converted_at) return false;
      const converted = startOfDay(new Date(l.converted_at));
      return converted.getTime() === dayStart.getTime();
    }).length;

    return {
      date: format(date, 'MMM d'),
      leads: newLeads,
      conversions,
    };
  });

  // Referral source breakdown
  const referralData = referralSources.map(source => {
    const sourceLeads = leads.filter(l => l.referral_source_id === source.id);
    const converted = sourceLeads.filter(l => l.converted_to_family_id).length;
    return {
      name: source.name,
      type: source.source_type,
      leads: sourceLeads.length,
      converted,
      rate: sourceLeads.length > 0 ? Math.round((converted / sourceLeads.length) * 100) : 0,
    };
  }).filter(s => s.leads > 0).sort((a, b) => b.leads - a.leads);

  // Priority distribution
  const priorityData = [
    { name: 'Urgent', value: leads.filter(l => l.priority === 'urgent').length, fill: '#ef4444' },
    { name: 'High', value: leads.filter(l => l.priority === 'high').length, fill: '#f97316' },
    { name: 'Medium', value: leads.filter(l => l.priority === 'medium').length, fill: '#3b82f6' },
    { name: 'Low', value: leads.filter(l => l.priority === 'low').length, fill: '#64748b' },
  ].filter(p => p.value > 0);

  // Task metrics
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const overdueTasks = pendingTasks.filter(t => t.due_date && new Date(t.due_date) < new Date());
  const completedTasks = tasks.filter(t => t.status === 'completed');

  // Stale leads (in early stages for > 7 days)
  const staleLeads = leads.filter(l => {
    if (['active', 'alumni', 'lost'].includes(l.stage)) return false;
    return differenceInDays(new Date(), new Date(l.stage_entered_at)) > 7;
  });

  return (
    <div className="space-y-6">
      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold">{conversionRate.toFixed(1)}%</p>
              </div>
              <div className={cn(
                'p-2 rounded-full',
                conversionRate >= 20 ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
              )}>
                <Target className="h-5 w-5" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-green-600">{convertedLeads} converted</span>
              <span className="text-muted-foreground">of {totalLeads}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Pipeline</p>
                <p className="text-2xl font-bold">
                  {leads.filter(l => !['alumni', 'lost'].includes(l.stage)).length}
                </p>
              </div>
              <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs">
              <span className="text-muted-foreground">{staleLeads.length} stale leads need attention</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tasks Pending</p>
                <p className="text-2xl font-bold">{pendingTasks.length}</p>
              </div>
              <div className={cn(
                'p-2 rounded-full',
                overdueTasks.length > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
              )}>
                <Clock className="h-5 w-5" />
              </div>
            </div>
            {overdueTasks.length > 0 && (
              <div className="flex items-center gap-1 mt-2 text-xs text-red-600">
                <AlertTriangle className="h-3 w-3" />
                <span>{overdueTasks.length} overdue</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lost Rate</p>
                <p className="text-2xl font-bold">{lostRate.toFixed(1)}%</p>
              </div>
              <div className={cn(
                'p-2 rounded-full',
                lostRate <= 20 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
              )}>
                <TrendingDown className="h-5 w-5" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <span>{lostLeads} leads marked lost</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pipeline Funnel</CardTitle>
            <CardDescription>Lead progression through stages</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={funnelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: number) => [`${value} leads`, 'Count']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Leads Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Activity Trend</CardTitle>
            <CardDescription>New leads and conversions (30 days)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={leadsOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="leads" 
                  stackId="1"
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.3}
                  name="New Leads"
                />
                <Area 
                  type="monotone" 
                  dataKey="conversions" 
                  stackId="2"
                  stroke="#22c55e" 
                  fill="#22c55e" 
                  fillOpacity={0.3}
                  name="Conversions"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Average Time in Stage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Stage Duration</CardTitle>
            <CardDescription>Average days in each stage</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stageTimeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: number) => [`${value} days`, 'Avg Duration']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="days" radius={[4, 4, 0, 0]}>
                  {stageTimeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Priority Mix</CardTitle>
            <CardDescription>Current lead priority distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number, name: string) => [`${value} leads`, name]}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {priorityData.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Referral Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Referral Sources</CardTitle>
            <CardDescription>Best performing lead sources</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {referralData.slice(0, 5).map((source, index) => (
                <div key={source.name} className="flex items-center gap-3">
                  <div 
                    className="w-2 h-8 rounded-full"
                    style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{source.name}</p>
                    <p className="text-xs text-muted-foreground">{source.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{source.leads}</p>
                    <p className="text-xs text-muted-foreground">{source.rate}% conv.</p>
                  </div>
                </div>
              ))}
              {referralData.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No referral source data yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
