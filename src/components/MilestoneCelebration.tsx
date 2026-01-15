import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Trophy, Star, Heart, Sparkles, PartyPopper } from 'lucide-react';
import { MILESTONE_NAMES } from '@/hooks/useSobrietyJourney';
import { cn } from '@/lib/utils';

interface MilestoneCelebrationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  milestoneDays: number;
  totalDays: number;
  onAddNote?: (note: string) => void;
}

const celebrationMessages: Record<number, string> = {
  1: "The journey of a thousand miles begins with a single step. You've taken it!",
  7: "One week down! You're building something beautiful.",
  14: "Two weeks of courage. You're proving you can do this!",
  30: "A whole month! Your strength is inspiring.",
  60: "Two months of incredible progress. Keep shining!",
  90: "Three months! This is a major milestone in recovery. You're amazing!",
  180: "Half a year of transformation. Look how far you've come!",
  365: "ONE YEAR! You've done something truly extraordinary.",
  730: "Two years of living your best life. You're an inspiration!",
  1095: "Three incredible years! Your journey is a testament to human resilience.",
};

export const MilestoneCelebration: React.FC<MilestoneCelebrationProps> = ({
  open,
  onOpenChange,
  milestoneDays,
  totalDays,
  onAddNote,
}) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (open) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleSaveNote = () => {
    if (onAddNote && note.trim()) {
      onAddNote(note.trim());
    }
    onOpenChange(false);
  };

  const milestoneName = MILESTONE_NAMES[milestoneDays] || `${milestoneDays} Days`;
  const message = celebrationMessages[milestoneDays] || "You've reached an incredible milestone!";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md overflow-hidden">
        {/* Confetti Animation */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "absolute w-2 h-2 rounded-full animate-bounce",
                  i % 5 === 0 && "bg-amber-400",
                  i % 5 === 1 && "bg-primary",
                  i % 5 === 2 && "bg-rose-400",
                  i % 5 === 3 && "bg-emerald-400",
                  i % 5 === 4 && "bg-violet-400"
                )}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `-10px`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                  transform: `rotate(${Math.random() * 360}deg)`,
                }}
              />
            ))}
          </div>
        )}

        <DialogHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-400/30 blur-2xl rounded-full animate-pulse" />
              <div className="relative bg-gradient-to-br from-amber-400 to-amber-600 p-4 rounded-full">
                <Trophy className="h-10 w-10 text-white" />
              </div>
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            <PartyPopper className="h-6 w-6 text-amber-500" />
            {milestoneName}!
            <PartyPopper className="h-6 w-6 text-amber-500" />
          </DialogTitle>
        </DialogHeader>

        <div className="text-center space-y-4 py-4">
          <div className="flex items-center justify-center gap-1 text-amber-500">
            <Star className="h-4 w-4 fill-current" />
            <Star className="h-5 w-5 fill-current" />
            <Sparkles className="h-6 w-6" />
            <Star className="h-5 w-5 fill-current" />
            <Star className="h-4 w-4 fill-current" />
          </div>

          <p className="text-lg text-muted-foreground">{message}</p>

          <div className="bg-primary/10 rounded-lg p-4 inline-block">
            <div className="text-4xl font-bold text-primary">{totalDays}</div>
            <div className="text-sm text-muted-foreground">Days Strong</div>
          </div>

          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Heart className="h-4 w-4 text-rose-500 fill-rose-500" />
            <span className="text-sm">Your family is proud of you!</span>
            <Heart className="h-4 w-4 text-rose-500 fill-rose-500" />
          </div>
        </div>

        {/* Optional Reflection */}
        <div className="space-y-3 pt-2">
          <label className="text-sm font-medium">
            Add a personal reflection (optional)
          </label>
          <Textarea
            placeholder="How do you feel about reaching this milestone?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="resize-none"
            rows={3}
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Button
            className="flex-1"
            onClick={handleSaveNote}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Celebrate!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
