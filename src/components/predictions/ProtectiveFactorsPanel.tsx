import { Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ProtectiveFactorsPanel({ factors }: { factors: string[] }) {
  if (!factors.length) return null;
  return (
    <Card className="border-green-200 bg-green-50/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="h-4 w-4 text-green-600" />
          Protective Factors
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {factors.map((f, i) => (
          <div key={i} className="flex items-start gap-2 text-sm">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center mt-0.5">✓</span>
            <span className="text-foreground/80">{f}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
