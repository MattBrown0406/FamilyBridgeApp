import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import { Plus, Calendar, Clock, User, Phone, Video, ArrowRight, Loader2 } from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay, isToday, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  start_time: string;
  end_time: string | null;
  lead_id: string | null;
  family_id: string | null;
  assigned_to: string | null;
}

interface Lead {
  id: string;
  contact_name: string;
}

interface Family {
  id: string;
  name: string;
}

interface OrgMember {
  user_id: string;
  full_name: string;
}

interface CRMCalendarProps {
  organizationId: string;
  events: CalendarEvent[];
  leads: Lead[];
  families: Family[];
  orgMembers: OrgMember[];
  onRefresh: () => void;
}

const EVENT_COLORS: Record<string, string> = {
  call: 'bg-green-500',
  meeting: 'bg-blue-500',
  intake: 'bg-yellow-500',
  follow_up: 'bg-purple-500',
  other: 'bg-slate-500',
};

const EVENT_ICONS: Record<string, React.ElementType> = {
  call: Phone,
  meeting: Video,
  intake: ArrowRight,
  follow_up: Clock,
  other: Calendar,
};

export function CRMCalendar({ organizationId, events, leads, families, orgMembers, onRefresh }: CRMCalendarProps) {
  const { user } = useAuth();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [newEvent, setNewEvent] = useState({
    title: '', description: '', event_type: 'meeting',
    start_time: '', end_time: '', lead_id: '', family_id: '', assigned_to: '',
  });

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getEventsForDay = (date: Date) =>
    events.filter(e => isSameDay(new Date(e.start_time), date))
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  const handleCreate = async () => {
    if (!newEvent.title || !newEvent.start_time) {
      toast({ title: 'Error', description: 'Title and start time are required', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('crm_calendar_events').insert({
        organization_id: organizationId,
        title: newEvent.title,
        description: newEvent.description || null,
        event_type: newEvent.event_type,
        start_time: newEvent.start_time,
        end_time: newEvent.end_time || null,
        lead_id: newEvent.lead_id || null,
        family_id: newEvent.family_id || null,
        assigned_to: newEvent.assigned_to || null,
        created_by: user?.id,
      });
      if (error) throw error;
      toast({ title: 'Event created' });
      setNewEvent({ title: '', description: '', event_type: 'meeting', start_time: '', end_time: '', lead_id: '', family_id: '', assigned_to: '' });
      setIsAddOpen(false);
      onRefresh();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const todayEvents = getEventsForDay(new Date());

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setSelectedDate(d => addDays(d, -7))}>← Week</Button>
          <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>Today</Button>
          <Button variant="outline" size="sm" onClick={() => setSelectedDate(d => addDays(d, 7))}>Week →</Button>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Event</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Schedule Event</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} placeholder="Intake call with..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={newEvent.event_type} onValueChange={v => setNewEvent({ ...newEvent, event_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="call">Call</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="intake">Intake</SelectItem>
                      <SelectItem value="follow_up">Follow Up</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Assign To</Label>
                  <Select value={newEvent.assigned_to} onValueChange={v => setNewEvent({ ...newEvent, assigned_to: v })}>
                    <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                    <SelectContent>
                      {orgMembers.map(m => <SelectItem key={m.user_id} value={m.user_id}>{m.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start *</Label>
                  <Input type="datetime-local" value={newEvent.start_time} onChange={e => setNewEvent({ ...newEvent, start_time: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>End</Label>
                  <Input type="datetime-local" value={newEvent.end_time} onChange={e => setNewEvent({ ...newEvent, end_time: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Lead</Label>
                  <Select value={newEvent.lead_id || '_none'} onValueChange={v => setNewEvent({ ...newEvent, lead_id: v === '_none' ? '' : v })}>
                    <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">None</SelectItem>
                      {leads.map(l => <SelectItem key={l.id} value={l.id}>{l.contact_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Family</Label>
                  <Select value={newEvent.family_id || '_none'} onValueChange={v => setNewEvent({ ...newEvent, family_id: v === '_none' ? '' : v })}>
                    <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">None</SelectItem>
                      {families.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={newEvent.description} onChange={e => setNewEvent({ ...newEvent, description: e.target.value })} rows={2} />
              </div>
              <Button onClick={handleCreate} disabled={isSubmitting} className="w-full">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Event
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Today's schedule */}
      {todayEvents.length > 0 && (
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Today's Schedule ({todayEvents.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {todayEvents.map(event => {
              const Icon = EVENT_ICONS[event.event_type] || Calendar;
              const lead = leads.find(l => l.id === event.lead_id);
              return (
                <div key={event.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                  <div className={cn('w-1 h-8 rounded-full', EVENT_COLORS[event.event_type] || 'bg-slate-500')} />
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(event.start_time), 'h:mm a')}
                      {lead && ` • ${lead.contact_name}`}
                    </p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Week view */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map(day => {
          const dayEvents = getEventsForDay(day);
          const today = isToday(day);
          return (
            <Card key={day.toISOString()} className={cn('min-h-[120px]', today && 'border-primary')}>
              <CardContent className="p-2">
                <p className={cn('text-xs font-medium mb-1', today ? 'text-primary' : 'text-muted-foreground')}>
                  {format(day, 'EEE d')}
                </p>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map(event => (
                    <div key={event.id} className="flex items-center gap-1">
                      <div className={cn('w-1.5 h-1.5 rounded-full', EVENT_COLORS[event.event_type] || 'bg-slate-500')} />
                      <p className="text-[10px] truncate">{format(new Date(event.start_time), 'h:mma')} {event.title}</p>
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <p className="text-[10px] text-muted-foreground">+{dayEvents.length - 3} more</p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
