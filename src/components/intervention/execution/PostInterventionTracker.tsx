import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HeartPulse, ShieldAlert, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const acceptedSteps = [
  { id: 'admitted', label: 'Confirmed admission at treatment facility' },
  { id: 'intake', label: 'Intake process completed' },
  { id: 'contact', label: 'Family contact protocols established with facility' },
  { id: 'insurance', label: 'Insurance and billing finalized' },
  { id: 'support', label: 'Family support plan initiated (therapy, Al-Anon, etc.)' },
  { id: 'boundaries', label: 'Post-treatment boundaries discussed and documented' },
  { id: 'aftercare', label: 'Aftercare planning timeline confirmed' },
];

const declinedSteps = [
  { id: 'consequences', label: 'All stated consequences enforced immediately' },
  { id: 'enabling', label: 'Enabling behaviors identified and halted' },
  { id: 'communication', label: 'Communication boundaries set with the individual' },
  { id: 'monitoring', label: 'Readiness monitoring resumed (system will continue tracking)' },
  { id: 'selfcare', label: 'Family self-care plan activated' },
  { id: 'next', label: 'Next intervention attempt timeline discussed (typically 2–6 weeks)' },
  { id: 'style', label: 'Alternative intervention approach considered for next attempt' },
  { id: 'professional', label: 'Would outside intervention support help if it has not been engaged already?' },
];

export const PostInterventionTracker = () => {
  const navigate = useNavigate();
  const [acceptedChecked, setAcceptedChecked] = useState<Record<string, boolean>>({});
  const [declinedChecked, setDeclinedChecked] = useState<Record<string, boolean>>({});

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Post-Intervention Tracking</CardTitle>
        <p className="text-xs text-muted-foreground">
          What happens after the intervention is as important as the intervention itself. Select the outcome and follow through.
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="accepted">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="accepted" className="gap-1.5 text-xs">
              <HeartPulse className="h-3 w-3" /> Accepted Treatment
            </TabsTrigger>
            <TabsTrigger value="declined" className="gap-1.5 text-xs">
              <ShieldAlert className="h-3 w-3" /> Declined / Resisted
            </TabsTrigger>
          </TabsList>
          <TabsContent value="accepted" className="mt-4 space-y-3">
            {acceptedSteps.map((step) => (
              <div key={step.id} className="flex items-center gap-3">
                <Checkbox
                  checked={!!acceptedChecked[step.id]}
                  onCheckedChange={() => setAcceptedChecked((p) => ({ ...p, [step.id]: !p[step.id] }))}
                />
                <span className={`text-sm ${acceptedChecked[step.id] ? 'line-through text-muted-foreground' : ''}`}>
                  {step.label}
                </span>
              </div>
            ))}
            <div className="p-3 rounded-lg bg-green-50/50 dark:bg-green-950/20 border border-green-200/50 dark:border-green-800/30 mt-4">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-green-700 dark:text-green-400">Transition to Treatment Monitoring: </span>
                Once admitted, shift to the Recovery Trajectory and Care Transitions tools for ongoing tracking.
              </p>
            </div>
          </TabsContent>
          <TabsContent value="declined" className="mt-4 space-y-3">
            {declinedSteps.map((step) => (
              <div key={step.id} className="flex items-center gap-3">
                <Checkbox
                  checked={!!declinedChecked[step.id]}
                  onCheckedChange={() => setDeclinedChecked((p) => ({ ...p, [step.id]: !p[step.id] }))}
                />
                <span className={`text-sm ${declinedChecked[step.id] ? 'line-through text-muted-foreground' : ''}`}>
                  {step.label}
                </span>
              </div>
            ))}
            <div className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 mt-4">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-amber-700 dark:text-amber-400">Revert to Readiness Monitoring: </span>
                The Intervention Readiness Engine will continue tracking behavioral signals. Consistent boundary enforcement
                is the most effective way to accelerate the next readiness window.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Link to full Continuity Engine */}
        <div className="mt-4 pt-4 border-t">
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => navigate('/post-intervention')}
          >
            Open Full Post-Intervention Continuity Engine <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
