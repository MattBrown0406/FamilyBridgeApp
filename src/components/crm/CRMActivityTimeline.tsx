import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Phone, 
  Mail, 
  MessageSquare, 
  Video, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  Activity,
  Clock,
  User
} from 'lucide-react';
import { format, formatDistanceToNow, isToday, isYesterday, isThisWeek } from 'date-fns';
import { cn } from '@/lib/utils';

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

interface Lead {
  id: string;
  contact_name: string;
}

interface Family {
  id: string;
  name: string;
}

interface CRMActivityTimelineProps {
  activities: CRMActivity[];
  leads: Lead[];
  families: Family[];
  userProfiles: Record<string, string>;
  maxHeight?: string;
  showHeader?: boolean;
  leadId?: string; // Filter to specific lead
}

const ACTIVITY_CONFIG: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  call: { icon: Phone, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/50' },
  text: { icon: MessageSquare, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/50' },
  email: { icon: Mail, color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/50' },
  meeting: { icon: Video, color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/50' },
  voicemail: { icon: Phone, color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/50' },
  note: { icon: FileText, color: 'text-slate-600', bgColor: 'bg-slate-100 dark:bg-slate-800' },
  stage_change: { icon: ArrowRight, color: 'text-indigo-600', bgColor: 'bg-indigo-100 dark:bg-indigo-900/50' },
  task_completed: { icon: CheckCircle2, color: 'text-emerald-600', bgColor: 'bg-emerald-100 dark:bg-emerald-900/50' },
  default: { icon: Activity, color: 'text-muted-foreground', bgColor: 'bg-muted' },
};

const getDateLabel = (date: Date): string => {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  if (isThisWeek(date)) return format(date, 'EEEE');
  return format(date, 'MMM d, yyyy');
};

export function CRMActivityTimeline({ 
  activities, 
  leads, 
  families, 
  userProfiles,
  maxHeight = '500px',
  showHeader = true,
  leadId
}: CRMActivityTimelineProps) {
  const filteredActivities = leadId 
    ? activities.filter(a => a.lead_id === leadId)
    : activities;

  // Group activities by date
  const groupedActivities = filteredActivities.reduce((groups, activity) => {
    const date = new Date(activity.occurred_at);
    const label = getDateLabel(date);
    if (!groups[label]) {
      groups[label] = [];
    }
    groups[label].push(activity);
    return groups;
  }, {} as Record<string, CRMActivity[]>);

  const sortedGroups = Object.entries(groupedActivities).sort(([, a], [, b]) => {
    const dateA = new Date(a[0].occurred_at);
    const dateB = new Date(b[0].occurred_at);
    return dateB.getTime() - dateA.getTime();
  });

  if (filteredActivities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Activity className="h-12 w-12 mb-4 opacity-20" />
        <p className="text-sm">No activity recorded yet</p>
      </div>
    );
  }

  const content = (
    <ScrollArea className="pr-4" style={{ maxHeight }}>
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

        {sortedGroups.map(([dateLabel, dateActivities]) => (
          <div key={dateLabel} className="mb-6">
            {/* Date header */}
            <div className="flex items-center gap-3 mb-4 sticky top-0 bg-background/95 backdrop-blur-sm py-2 z-10">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center relative z-10">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-semibold text-primary">{dateLabel}</span>
            </div>

            {/* Activities for this date */}
            <div className="space-y-3 pl-1">
              {dateActivities.map((activity) => {
                const config = ACTIVITY_CONFIG[activity.activity_type] || ACTIVITY_CONFIG.default;
                const Icon = config.icon;
                const lead = leads.find(l => l.id === activity.lead_id);
                const family = families.find(f => f.id === activity.family_id);
                const userName = userProfiles[activity.user_id] || 'Team member';

                return (
                  <div key={activity.id} className="flex gap-3 ml-2 group">
                    <div className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 relative z-10 transition-transform group-hover:scale-110',
                      config.bgColor
                    )}>
                      <Icon className={cn('h-3 w-3', config.color)} />
                    </div>

                    <div className="flex-1 min-w-0 pb-3 border-b border-border/50 last:border-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{activity.title}</p>
                          {activity.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {activity.description}
                            </p>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {format(new Date(activity.occurred_at), 'h:mm a')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>{userName}</span>
                        </div>

                        {lead && !leadId && (
                          <Badge variant="outline" className="text-[10px] px-1.5 h-5">
                            {lead.contact_name}
                          </Badge>
                        )}
                        {family && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 h-5">
                            {family.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );

  if (!showHeader) {
    return content;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Activity Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
