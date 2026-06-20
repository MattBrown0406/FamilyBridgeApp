import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fetchProfilesByIds } from '@/lib/profileApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';
import { ListTodo, Plus, Loader2, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assigned_to: string | null;
  assigned_name?: string;
  due_date: string | null;
  created_at: string;
}

interface Props {
  caseId: string;
  userId: string;
}

const priorityColors: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
};

export const CaseTasksPanel = ({ caseId, userId }: Props) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadTasks();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  const loadTasks = async () => {
    try {
      const { data } = await supabase
        .from('coordination_tasks')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });

      if (data?.length) {
        const assignedIds = data.filter(t => t.assigned_to).map(t => t.assigned_to!);
        let profileMap = new Map<string, string>();
        if (assignedIds.length) {
          const profiles = await fetchProfilesByIds(assignedIds);
          profileMap = new Map(profiles.map((p: any) => [p.id, p.full_name || 'Unassigned']));
        }

        setTasks(data.map(t => ({
          ...t,
          assigned_name: t.assigned_to ? profileMap.get(t.assigned_to) || 'Unknown' : undefined,
        })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async () => {
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      const { error } = await supabase.from('coordination_tasks').insert({
        case_id: caseId,
        title: newTitle.trim(),
        priority: newPriority,
        created_by: userId,
      });
      if (error) throw error;
      setNewTitle('');
      setShowAdd(false);
      loadTasks();
      toast({ title: 'Task added' });
    } catch (err: any) {
      toast({ title: 'Failed to add task', variant: 'destructive' });
    } finally {
      setAdding(false);
    }
  };

  const toggleTask = async (task: Task) => {
    const newStatus = task.status === 'complete' ? 'pending' : 'complete';
    try {
      await supabase.from('coordination_tasks')
        .update({
          status: newStatus,
          completed_at: newStatus === 'complete' ? new Date().toISOString() : null,
        })
        .eq('id', task.id);
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const pendingTasks = tasks.filter(t => t.status !== 'complete');
  const completedTasks = tasks.filter(t => t.status === 'complete');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListTodo className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Coordination Tasks</CardTitle>
            <Badge variant="outline">{pendingTasks.length} pending</Badge>
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowAdd(!showAdd)} className="gap-1">
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showAdd && (
          <div className="p-3 border rounded-lg space-y-3 bg-muted/30">
            <Input
              placeholder="Task title (e.g., Confirm bed availability)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
            />
            <div className="flex gap-2">
              <Select value={newPriority} onValueChange={setNewPriority}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={addTask} disabled={adding} size="sm">
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
              </Button>
            </div>
          </div>
        )}

        {/* Pending tasks */}
        {pendingTasks.length === 0 && completedTasks.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No tasks yet. Add tasks to coordinate team actions.
          </p>
        )}

        <div className="space-y-2">
          {pendingTasks.map(task => (
            <div key={task.id} className="flex items-start gap-3 p-3 border rounded-lg">
              <Checkbox
                checked={false}
                onCheckedChange={() => toggleTask(task)}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{task.title}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="secondary" className={`text-xs ${priorityColors[task.priority]}`}>
                    {task.priority}
                  </Badge>
                  {task.assigned_name && (
                    <span className="text-xs text-muted-foreground">→ {task.assigned_name}</span>
                  )}
                  {task.due_date && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(task.due_date), 'MMM d')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Completed */}
        {completedTasks.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Completed ({completedTasks.length})
            </p>
            {completedTasks.map(task => (
              <div key={task.id} className="flex items-start gap-3 p-3 border rounded-lg opacity-60">
                <Checkbox
                  checked={true}
                  onCheckedChange={() => toggleTask(task)}
                  className="mt-0.5"
                />
                <p className="text-sm line-through">{task.title}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
