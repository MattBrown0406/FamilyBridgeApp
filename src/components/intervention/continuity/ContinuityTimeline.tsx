import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

interface TimelineEvent {
  date: string;
  title: string;
  detail: string;
  type: 'intervention' | 'outcome' | 'milestone' | 'risk' | 'behavior';
}

const acceptedTimeline: TimelineEvent[] = [
  { date: 'Day 0', title: 'Intervention conducted', detail: 'Johnson model intervention with 5 participants.', type: 'intervention' },
  { date: 'Day 0', title: 'Treatment accepted', detail: 'Individual agreed to enter residential treatment.', type: 'outcome' },
  { date: 'Day 0', title: 'Admission completed', detail: 'Safe arrival and intake at facility confirmed.', type: 'milestone' },
  { date: 'Day 1', title: 'Detox initiated', detail: 'Medical detox protocol started under supervision.', type: 'milestone' },
  { date: 'Day 3', title: 'Initial treatment plan created', detail: 'Facility provided preliminary care plan.', type: 'milestone' },
  { date: 'Day 5', title: 'First family call scheduled', detail: 'Communication boundaries established.', type: 'behavior' },
  { date: 'Day 7', title: 'Engagement stable', detail: 'Attendance consistent, participation active.', type: 'milestone' },
];

const declinedTimeline: TimelineEvent[] = [
  { date: 'Day 0', title: 'Intervention conducted', detail: 'Johnson model intervention with 5 participants.', type: 'intervention' },
  { date: 'Day 0', title: 'Treatment declined', detail: 'Individual refused to enter treatment.', type: 'outcome' },
  { date: 'Day 0', title: 'Consequences activated', detail: 'All pre-stated boundaries enforced immediately.', type: 'behavior' },
  { date: 'Day 1', title: 'Enabling behaviors halted', detail: 'Financial and logistical support removed.', type: 'behavior' },
  { date: 'Day 2', title: 'Emotional rescue attempt', detail: 'One family member wavered—redirected by team.', type: 'risk' },
  { date: 'Day 3', title: 'Family consistency restored', detail: 'All members re-aligned on boundary enforcement.', type: 'milestone' },
  { date: 'Day 5', title: 'Increased individual distress', detail: 'Natural consequences building. Resistance weakening.', type: 'risk' },
];

const typeStyles: Record<TimelineEvent['type'], { dot: string; badge: string }> = {
  intervention: { dot: 'bg-primary', badge: 'default' },
  outcome: { dot: 'bg-blue-500', badge: 'secondary' },
  milestone: { dot: 'bg-green-500', badge: 'outline' },
  risk: { dot: 'bg-destructive', badge: 'destructive' },
  behavior: { dot: 'bg-amber-500', badge: 'outline' },
};

interface ContinuityTimelineProps {
  outcome: 'accepted' | 'declined';
}

export const ContinuityTimeline = ({ outcome }: ContinuityTimelineProps) => {
  const events = outcome === 'accepted' ? acceptedTimeline : declinedTimeline;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          Progress Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-0">
          {events.map((event, i) => {
            const styles = typeStyles[event.type];
            return (
              <div key={i} className="relative pl-6 pb-5 last:pb-0 border-l-2 border-border ml-2">
                <div className={`absolute -left-[9px] top-0.5 h-4 w-4 rounded-full ${styles.dot} border-2 border-background`} />
                <div className="flex items-center gap-2 mb-0.5">
                  <Badge variant="outline" className="text-xs">{event.date}</Badge>
                  <Badge variant={styles.badge as any} className="text-xs">{event.type}</Badge>
                </div>
                <p className="text-sm font-medium text-foreground">{event.title}</p>
                <p className="text-xs text-muted-foreground">{event.detail}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
