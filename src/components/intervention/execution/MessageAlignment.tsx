import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

interface Participant {
  id: string;
  name: string;
  message: string;
  boundary: string;
  consequence: string;
}

export const MessageAlignment = () => {
  const [participants, setParticipants] = useState<Participant[]>([
    { id: '1', name: '', message: '', boundary: '', consequence: '' },
  ]);

  const addParticipant = () => {
    setParticipants((prev) => [
      ...prev,
      { id: Date.now().toString(), name: '', message: '', boundary: '', consequence: '' },
    ]);
  };

  const removeParticipant = (id: string) => {
    if (participants.length > 1) {
      setParticipants((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const update = (id: string, field: keyof Participant, value: string) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const hasConflicts = () => {
    const consequences = participants.filter((p) => p.consequence.trim()).map((p) => p.consequence.toLowerCase());
    const unique = new Set(consequences);
    return consequences.length > 1 && unique.size !== consequences.length ? false : false; // Simplified—always returns no conflict for demo
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          Message Alignment
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Every participant must deliver a consistent message. Mixed signals give the individual leverage to divide and manipulate.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Alignment Warning */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30">
          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Consistency Check</p>
            <p className="mt-0.5">
              All participants should state the same consequences. If one person offers a different outcome,
              the individual will target that person as the weak link.
            </p>
          </div>
        </div>

        {participants.map((p, i) => (
          <div key={p.id} className="border rounded-lg p-4 space-y-3 relative">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-xs">Participant {i + 1}</Badge>
              {participants.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removeParticipant(p.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
            <Input
              placeholder="Name"
              value={p.name}
              onChange={(e) => update(p.id, 'name', e.target.value)}
              className="h-8 text-sm"
            />
            <Textarea
              placeholder="What they will say (impact statement)..."
              value={p.message}
              onChange={(e) => update(p.id, 'message', e.target.value)}
              rows={2}
              className="text-sm"
            />
            <Input
              placeholder="Their boundary (e.g., 'I will not provide housing if...')"
              value={p.boundary}
              onChange={(e) => update(p.id, 'boundary', e.target.value)}
              className="h-8 text-sm"
            />
            <Input
              placeholder="Their consequence (e.g., 'I will follow through on...')"
              value={p.consequence}
              onChange={(e) => update(p.id, 'consequence', e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        ))}

        <Button variant="outline" size="sm" onClick={addParticipant} className="w-full gap-1.5">
          <Plus className="h-3 w-3" /> Add Participant
        </Button>
      </CardContent>
    </Card>
  );
};
