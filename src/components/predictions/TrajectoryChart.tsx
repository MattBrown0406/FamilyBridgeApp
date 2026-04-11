import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

const TYPES = [
  { value: 'treatment_completion', label: 'Treatment Completion' },
  { value: 'early_discharge', label: 'Early Discharge Risk' },
  { value: 'relapse_30', label: '30-Day Relapse Risk' },
  { value: 'system_failure', label: 'System Failure Risk' },
];

interface Props {
  getHistorical: (type: string) => Promise<{ probability: number; calculated_at: string }[]>;
}

export function TrajectoryChart({ getHistorical }: Props) {
  const [type, setType] = useState('treatment_completion');
  const [data, setData] = useState<{ date: string; value: number }[]>([]);

  useEffect(() => {
    getHistorical(type).then(d =>
      setData(d.map(p => ({
        date: format(new Date(p.calculated_at), 'MM/dd'),
        value: Math.round(p.probability),
      })))
    );
  }, [type, getHistorical]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Trajectory
          </CardTitle>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {data.length < 2 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Not enough data points for trajectory visualization yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: number) => [`${v}%`, TYPES.find(t => t.value === type)?.label]} />
              <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
