import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HeartPulse, ShieldOff } from 'lucide-react';

interface OutcomeSelectorProps {
  onSelect: (outcome: 'accepted' | 'declined') => void;
}

export const OutcomeSelector = ({ onSelect }: OutcomeSelectorProps) => {
  return (
    <Card className="border-2 border-primary/30">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-lg">Intervention Outcome</CardTitle>
        <p className="text-sm text-muted-foreground">
          Select the outcome to activate the appropriate continuity path. The system adapts all guidance, tracking, and alerts based on this selection.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => onSelect('accepted')}
            className="p-6 rounded-xl border-2 border-green-300 dark:border-green-700/50 bg-green-50/50 dark:bg-green-950/20 hover:bg-green-100/70 dark:hover:bg-green-950/40 transition-colors text-left group cursor-pointer"
          >
            <HeartPulse className="h-8 w-8 text-green-600 mb-3" />
            <p className="text-base font-bold text-foreground">Accepted Treatment</p>
            <p className="text-xs text-muted-foreground mt-1.5">
              The individual agreed to enter treatment. Activate admission tracking, family alignment guidance, and engagement monitoring.
            </p>
          </button>
          <button
            onClick={() => onSelect('declined')}
            className="p-6 rounded-xl border-2 border-amber-300 dark:border-amber-700/50 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100/70 dark:hover:bg-amber-950/40 transition-colors text-left group cursor-pointer"
          >
            <ShieldOff className="h-8 w-8 text-amber-600 mb-3" />
            <p className="text-base font-bold text-foreground">Declined Treatment</p>
            <p className="text-xs text-muted-foreground mt-1.5">
              The individual refused help. Activate boundary enforcement, consequence tracking, and re-engagement monitoring.
            </p>
          </button>
        </div>
      </CardContent>
    </Card>
  );
};
