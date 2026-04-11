import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, CheckCircle2, AlertCircle, MinusCircle, Circle } from 'lucide-react';
import { AccountabilityCommitment } from '@/hooks/useAccountability';
import { format } from 'date-fns';
import { toast } from '@/components/ui/use-toast';

interface Props {
  commitments: AccountabilityCommitment[];
  commitmentType: 'family' | 'provider';
  onAdd: (data: { title: string; description?: string; commitment_type: string; due_date?: string }) => Promise<any>;
  onUpdateStatus: (id: string, status: string, notes?: string) => Promise<any>;
  canManage: boolean;
}

export const CommitmentTracker = ({ commitments, commitmentType, onAdd, onUpdateStatus, canManage }: Props) => {
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filtered = commitments.filter(c => c.commitment_type === commitmentType);

  const handleAdd = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    const err = await onAdd({ title: title.trim(), description: description.trim() || undefined, commitment_type: commitmentType });
    if (!err) {
      setTitle('');
      setDescription('');
      setShowAdd(false);
      toast({ title: 'Commitment added' });
    }
    setSubmitting(false);
  };

  const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    active: { icon: <Circle className="h-4 w-4" />, color: 'bg-blue-100 text-blue-800', label: 'Active' },
    adhered: { icon: <CheckCircle2 className="h-4 w-4" />, color: 'bg-green-100 text-green-800', label: 'Adhered' },
    partial: { icon: <MinusCircle className="h-4 w-4" />, color: 'bg-yellow-100 text-yellow-800', label: 'Partial' },
    broken: { icon: <AlertCircle className="h-4 w-4" />, color: 'bg-red-100 text-red-800', label: 'Broken' },
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {commitmentType === 'family' ? 'Family Commitments' : 'Provider Benchmarks'}
          </CardTitle>
          {canManage && (
            <Button size="sm" variant="outline" onClick={() => setShowAdd(!showAdd)} className="gap-1">
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {showAdd && (
          <div className="space-y-2 p-3 border rounded-lg bg-muted/30">
            <Input placeholder="e.g. No financial support for 7 days" value={title} onChange={e => setTitle(e.target.value)} />
            <Textarea placeholder="Details (optional)" value={description} onChange={e => setDescription(e.target.value)} rows={2} />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} disabled={submitting || !title.trim()}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {filtered.length === 0 && !showAdd && (
          <p className="text-sm text-muted-foreground text-center py-4">No commitments tracked yet.</p>
        )}

        {filtered.map(c => {
          const cfg = statusConfig[c.status] || statusConfig.active;
          return (
            <div key={c.id} className="flex items-start gap-3 p-3 border rounded-lg">
              <div className="mt-0.5">{cfg.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-sm">{c.title}</p>
                  <Badge variant="secondary" className={cfg.color}>{cfg.label}</Badge>
                </div>
                {c.description && <p className="text-xs text-muted-foreground mt-1">{c.description}</p>}
                <p className="text-xs text-muted-foreground mt-1">Added {format(new Date(c.created_at), 'MMM d, yyyy')}</p>
                {c.review_notes && <p className="text-xs italic text-muted-foreground mt-1">"{c.review_notes}"</p>}
              </div>
              {canManage && c.status === 'active' && (
                <Select onValueChange={(val) => onUpdateStatus(c.id, val)}>
                  <SelectTrigger className="w-[100px] h-8 text-xs">
                    <SelectValue placeholder="Review" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="adhered">Adhered</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="broken">Broken</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
