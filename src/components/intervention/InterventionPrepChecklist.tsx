import { useState } from 'react';
import { ClipboardCheck, Check, Circle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { PrepChecklistItem } from '@/data/interventionReadinessData';

interface InterventionPrepChecklistProps {
  items: PrepChecklistItem[];
  score: number;
}

export function InterventionPrepChecklist({ items: initialItems, score }: InterventionPrepChecklistProps) {
  const [items, setItems] = useState(initialItems);

  if (score < 65) return null;

  const completed = items.filter((i) => i.completed).length;
  const progress = Math.round((completed / items.length) * 100);

  const toggle = (id: string) => {
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            Intervention Preparation Checklist
          </CardTitle>
          <span className="text-sm font-medium text-muted-foreground">{completed}/{items.length}</span>
        </div>
        <Progress value={progress} className="h-2 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => toggle(item.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                item.completed
                  ? 'bg-primary/5 border-primary/15'
                  : 'bg-card border-border hover:bg-muted/30'
              }`}
            >
              {item.completed ? (
                <Check className="h-4 w-4 text-primary flex-shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
              <span className={`text-sm ${item.completed ? 'text-foreground/60 line-through' : 'text-foreground'}`}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
