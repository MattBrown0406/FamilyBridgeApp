import { ExternalLink, HeartHandshake, LifeBuoy, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface FamilyResourceRailProps {
  onOpenMeetings: (fellowship: 'Al-Anon' | 'Nar-Anon' | 'CRAFT') => void;
  compact?: boolean;
}

const RESOURCES = [
  {
    id: 'Al-Anon' as const,
    title: 'Al-Anon / Alateen',
    body: 'For families and friends of people with a drinking problem. You do not have to go to AA to get support.',
  },
  {
    id: 'Nar-Anon' as const,
    title: 'Nar-Anon',
    body: 'For families affected by someone else’s drug use. Parallel to how a loved one uses NA or AA.',
  },
  {
    id: 'CRAFT' as const,
    title: 'CRAFT',
    body: 'Community Reinforcement and Family Training — skills for inviting change without rescuing or arguing.',
  },
];

export const FamilyResourceRail = ({ onOpenMeetings, compact }: FamilyResourceRailProps) => {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className={compact ? 'p-3 space-y-2' : 'p-4 space-y-3'}>
        <div className="flex items-start gap-2">
          <HeartHandshake className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-semibold">Family support, as clearly as AA</p>
            <p className="text-xs text-muted-foreground">
              These are free fellowships and a public method — not a treatment-center directory.
            </p>
          </div>
        </div>
        <div className={compact ? 'space-y-2' : 'grid gap-2 sm:grid-cols-3'}>
          {RESOURCES.map((resource) => (
            <div key={resource.id} className="rounded-lg border bg-background/80 p-3">
              <p className="text-sm font-medium flex items-center gap-1.5">
                {resource.id === 'CRAFT' ? <LifeBuoy className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />}
                {resource.title}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{resource.body}</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-2 h-8 w-full"
                onClick={() => onOpenMeetings(resource.id)}
              >
                <ExternalLink className="mr-1 h-3.5 w-3.5" />
                Open
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
