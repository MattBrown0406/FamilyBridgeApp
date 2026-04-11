import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp } from 'lucide-react';
import type { ReadinessSnapshot } from '@/data/interventionReadinessData';

interface ReadinessTrendsProps {
  history: ReadinessSnapshot[];
}

const ranges = [
  { label: '7 Days', days: 7 },
  { label: '14 Days', days: 14 },
  { label: '30 Days', days: 30 },
];

export function ReadinessTrends({ history }: ReadinessTrendsProps) {
  const [days, setDays] = useState(14);
  const data = history.slice(-days).map((h) => ({
    ...h,
    date: new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Readiness Trends
          </CardTitle>
          <div className="flex gap-1">
            {ranges.map((r) => (
              <Button
                key={r.days}
                size="sm"
                variant={days === r.days ? 'default' : 'outline'}
                className="h-7 text-xs px-3"
                onClick={() => setDays(r.days)}
              >
                {r.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="totalScore" name="Overall Score" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="distress" name="Distress" stroke="#e67e22" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
              <Line type="monotone" dataKey="consequence" name="Consequence" stroke="#2980b9" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
              <Line type="monotone" dataKey="resistance" name="Resistance" stroke="#8e44ad" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
              <Line type="monotone" dataKey="instability" name="Instability" stroke="#c0392b" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
              <Line type="monotone" dataKey="helpProximity" name="Help-Proximity" stroke="#27ae60" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
