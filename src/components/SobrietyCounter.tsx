import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Flame, Trophy, Star, CalendarDays, RefreshCw, Sparkles, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSobrietyJourney, MILESTONE_NAMES } from '@/hooks/useSobrietyJourney';
import { format } from 'date-fns';
import { MilestoneCelebration } from './MilestoneCelebration';

interface SobrietyCounterProps {
  familyId: string;
  isRecoveringMember?: boolean;
  canEdit?: boolean; // Allow moderators/admins to edit
  compact?: boolean;
}

const encouragingMessages = [
  "Every day is a victory!",
  "You're stronger than you know.",
  "One day at a time.",
  "Your courage inspires others.",
  "Keep going, you've got this!",
  "Progress, not perfection.",
  "You are not alone.",
  "Believe in yourself.",
];

export const SobrietyCounter: React.FC<SobrietyCounterProps> = ({
  familyId,
  isRecoveringMember = true,
  canEdit = false,
  compact = false,
}) => {
  const {
    journey,
    milestones,
    loading,
    daysCount,
    nextMilestone,
    daysUntilNextMilestone,
    startJourney,
    resetJourney,
    updateStartDate,
  } = useSobrietyJourney(familyId);

  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [editDate, setEditDate] = useState<Date | undefined>(undefined);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showEditCalendar, setShowEditCalendar] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebratingMilestone, setCelebratingMilestone] = useState<number | null>(null);

  const getMessage = () => {
    return encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];
  };

  const handleStartJourney = async () => {
    if (startDate) {
      await startJourney(startDate);
      setShowCalendar(false);
    }
  };

  const handleReset = async () => {
    await resetJourney(new Date());
  };

  const handleEditDate = async () => {
    if (editDate) {
      await updateStartDate(editDate);
      setShowEditCalendar(false);
    }
  };

  // Initialize edit date when journey loads
  React.useEffect(() => {
    if (journey) {
      setEditDate(new Date(journey.start_date));
    }
  }, [journey]);

  const progressToNextMilestone = nextMilestone
    ? ((daysCount / nextMilestone) * 100)
    : 100;

  // Check for uncelebrated milestones
  React.useEffect(() => {
    const latestMilestone = milestones[milestones.length - 1];
    if (latestMilestone && !latestMilestone.celebrated_by_family) {
      const achievedRecently = new Date().getTime() - new Date(latestMilestone.achieved_at).getTime() < 60000;
      if (achievedRecently) {
        setCelebratingMilestone(latestMilestone.milestone_days);
        setShowCelebration(true);
      }
    }
  }, [milestones]);

  if (loading) {
    return (
      <Card className={cn("animate-pulse", compact && "p-2")}>
        <CardContent className="p-4">
          <div className="h-20 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  // If no journey exists and this is the recovering member, show setup
  if (!journey && isRecoveringMember) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Flame className="h-5 w-5 text-primary" />
            Start Your Sobriety Journey
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Track your progress and celebrate your milestones. Your journey matters.
          </p>
          <Popover open={showCalendar} onOpenChange={setShowCalendar}>
            <PopoverTrigger asChild>
              <Button className="w-full">
                <CalendarDays className="mr-2 h-4 w-4" />
                Set Your Start Date
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                disabled={(date) => date > new Date()}
                initialFocus
              />
              <div className="p-3 border-t">
                <Button onClick={handleStartJourney} className="w-full" disabled={!startDate}>
                  Start Journey
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </CardContent>
      </Card>
    );
  }

  // If no journey exists and this is a family member, don't show anything
  if (!journey) {
    return null;
  }

  // Compact view for family members
  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg">
        <Flame className="h-4 w-4 text-primary" />
        <span className="font-semibold text-primary">{daysCount}</span>
        <span className="text-xs text-muted-foreground">days</span>
      </div>
    );
  }

  return (
    <>
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-secondary/5 overflow-hidden">
        <CardContent className="p-6">
          {/* Main Counter */}
          <div className="text-center mb-6">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
              <div className="relative">
                <Flame className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-6xl font-bold text-primary tracking-tight">
                  {daysCount}
                </div>
                <div className="text-lg text-muted-foreground font-medium">
                  {daysCount === 1 ? 'Day' : 'Days'} Strong
                </div>
              </div>
            </div>
          </div>

          {/* Encouraging Message */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <p className="text-sm text-muted-foreground italic">{getMessage()}</p>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </div>

          {/* Progress to Next Milestone */}
          {nextMilestone && (
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Next Milestone</span>
                <span className="font-medium flex items-center gap-1">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  {MILESTONE_NAMES[nextMilestone]} ({nextMilestone} days)
                </span>
              </div>
              <Progress value={progressToNextMilestone} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                {daysUntilNextMilestone} {daysUntilNextMilestone === 1 ? 'day' : 'days'} to go!
              </p>
            </div>
          )}

          {/* Achieved Milestones */}
          {milestones.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500" />
                Milestones Achieved
              </h4>
              <div className="flex flex-wrap gap-2">
                {milestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className="px-3 py-1 bg-amber-500/10 text-amber-700 dark:text-amber-300 rounded-full text-xs font-medium flex items-center gap-1"
                  >
                    <Trophy className="h-3 w-3" />
                    {MILESTONE_NAMES[milestone.milestone_days]}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Start Date & Controls (for recovering member or authorized editors) */}
          {(isRecoveringMember || canEdit) && (
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t">
              <div className="flex items-center gap-2">
                <span>Started: {format(new Date(journey.start_date), 'MMMM d, yyyy')}</span>
                {/* Edit Date Popover */}
                <Popover open={showEditCalendar} onOpenChange={setShowEditCalendar}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-xs opacity-60 hover:opacity-100 h-6 px-2">
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={editDate}
                      onSelect={setEditDate}
                      disabled={(date) => date > new Date()}
                      initialFocus
                    />
                    <div className="p-3 border-t">
                      <Button onClick={handleEditDate} className="w-full" size="sm" disabled={!editDate}>
                        Update Date
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              {isRecoveringMember && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-xs opacity-60 hover:opacity-100">
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Reset
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Start Fresh?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Starting fresh is a sign of strength. Every day is a new opportunity to grow.
                        Your previous journey will be saved privately.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep Going</AlertDialogCancel>
                      <AlertDialogAction onClick={(e) => {
                        e.preventDefault();
                        handleReset();
                      }}>
                        Start Fresh
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Celebration Modal */}
      {celebratingMilestone && (
        <MilestoneCelebration
          open={showCelebration}
          onOpenChange={setShowCelebration}
          milestoneDays={celebratingMilestone}
          totalDays={daysCount}
        />
      )}
    </>
  );
};
