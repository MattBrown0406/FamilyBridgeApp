import { useState } from 'react';
import { format } from 'date-fns';
import { Plus, Filter, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { ObservedIndicator, SignalCategoryName, SourceType, ImpactDirection } from '@/data/interventionReadinessData';

const impactIcons: Record<ImpactDirection, React.ReactNode> = {
  positive: <ArrowUpRight className="h-3.5 w-3.5 text-primary" />,
  negative: <ArrowDownRight className="h-3.5 w-3.5 text-destructive" />,
  neutral: <Minus className="h-3.5 w-3.5 text-muted-foreground" />,
};

const SOURCE_TYPES: SourceType[] = [
  'Family-reported event', 'Communication analysis', 'Behavior/compliance tracking',
  'Financial event', 'Attendance/check-in pattern', 'Manual clinician note', 'AI pattern detection',
];

const CATEGORIES: SignalCategoryName[] = [
  'Distress Elevation', 'Consequence Awareness', 'Resistance Fatigue',
  'Instability / System Disruption', 'Help-Proximity Behavior',
];

interface SignalFeedProps {
  indicators: ObservedIndicator[];
  onAddIndicator: (indicator: ObservedIndicator) => void;
}

export function SignalFeed({ indicators, onAddIndicator }: SignalFeedProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newDesc, setNewDesc] = useState('');
  const [newSource, setNewSource] = useState<SourceType>('Manual clinician note');
  const [newCategory, setNewCategory] = useState<SignalCategoryName>('Distress Elevation');
  const [newImpact, setNewImpact] = useState<ImpactDirection>('positive');

  const filtered = categoryFilter === 'all'
    ? indicators
    : indicators.filter((ind) => ind.categoryTags.includes(categoryFilter as SignalCategoryName));

  const handleAdd = () => {
    if (!newDesc.trim()) return;
    onAddIndicator({
      id: `ind-${Date.now()}`,
      timestamp: new Date().toISOString(),
      sourceType: newSource,
      description: newDesc.trim(),
      categoryTags: [newCategory],
      impactDirection: newImpact,
    });
    setNewDesc('');
    setDialogOpen(false);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-lg">Observed Indicators</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px] h-8 text-xs">
                <Filter className="h-3 w-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-8 text-xs">
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Observation</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Description</Label>
                    <Textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Describe the observed behavior or event..." />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Source</Label>
                      <Select value={newSource} onValueChange={(v) => setNewSource(v as SourceType)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {SOURCE_TYPES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Select value={newCategory} onValueChange={(v) => setNewCategory(v as SignalCategoryName)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Score Impact</Label>
                    <Select value={newImpact} onValueChange={(v) => setNewImpact(v as ImpactDirection)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="positive">Increases readiness</SelectItem>
                        <SelectItem value="negative">Decreases readiness</SelectItem>
                        <SelectItem value="neutral">Neutral</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAdd} className="w-full">Add Observation</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
          {filtered.map((ind) => (
            <div key={ind.id} className="flex gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
              <div className="flex-shrink-0 mt-0.5">{impactIcons[ind.impactDirection]}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground leading-relaxed">{ind.description}</p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(ind.timestamp), 'MMM d, h:mm a')}
                  </span>
                  <Badge variant="outline" className="text-xs px-1.5 py-0">{ind.sourceType}</Badge>
                  {ind.categoryTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">{tag}</Badge>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
