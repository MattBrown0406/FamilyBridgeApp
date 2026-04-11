import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function RiskDriversPanel({ drivers }: { drivers: string[] }) {
  if (!drivers.length) return null;
  return (
    <Card className="border-red-200 bg-red-50/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          Top Risk Drivers
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {drivers.map((d, i) => (
          <div key={i} className="flex items-start gap-2 text-sm">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 text-red-700 text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
            <span className="text-foreground/80">{d}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
