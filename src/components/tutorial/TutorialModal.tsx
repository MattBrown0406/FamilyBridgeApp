import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sparkles } from 'lucide-react';

export interface TutorialStep {
  title: string;
  description: string;
  highlightTab?: string;
}

interface TutorialModalProps {
  steps: TutorialStep[];
  storageKey: string;
  onComplete?: () => void;
  autoOpen?: boolean;
  forceOpenSignal?: number;
  onOpenChange?: (open: boolean) => void;
}

const TUTORIALS_ENABLED_KEY = 'fb_tutorials_enabled';

function tutorialsEnabled() {
  try {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem(TUTORIALS_ENABLED_KEY) !== 'false';
  } catch {
    return true;
  }
}

export function TutorialModal({
  steps,
  storageKey,
  onComplete,
  autoOpen = true,
  forceOpenSignal,
  onOpenChange,
}: TutorialModalProps) {
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const updateOpen = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
  };

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      if (!steps.length) return;
      if (!autoOpen) return;
      if (!tutorialsEnabled()) return;
      const seen = window.localStorage.getItem(storageKey);
      if (!seen) updateOpen(true);
    } catch {
      // ignore storage errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, autoOpen]);

  // Replay trigger. A replay counter starts at 0 on every page mount, so
  // only positive values represent an intentional click on "Replay tour".
  useEffect(() => {
    if (forceOpenSignal === undefined || forceOpenSignal <= 0) return;
    if (!steps.length) return;
    setStepIndex(0);
    updateOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceOpenSignal]);

  // Respond to global preference toggling
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = () => {
      if (!tutorialsEnabled()) {
        updateOpen(false);
        return;
      }
      if (!steps.length) return;
      try {
        const seen = window.localStorage.getItem(storageKey);
        if (!seen) updateOpen(true);
      } catch {
        // ignore
      }
    };
    window.addEventListener('fb:tutorial-preference-changed', handler);
    return () => window.removeEventListener('fb:tutorial-preference-changed', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const finish = () => {
    try {
      window.localStorage.setItem(storageKey, 'seen');
    } catch {
      // ignore
    }
    updateOpen(false);
    onComplete?.();
  };

  if (!steps.length) return null;
  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;
  const progress = ((stepIndex + 1) / steps.length) * 100;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Prevent closing by clicking outside / Esc — only Skip/Finish should close
        if (next) updateOpen(true);
      }}
    >
      <DialogContent
        className="sm:max-w-md border-primary/20 [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground mb-1">
          <span className="inline-flex items-center gap-1.5 text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Quick tour
          </span>
          <span>Step {stepIndex + 1} of {steps.length}</span>
        </div>
        <Progress value={progress} className="h-1.5" />
        <DialogHeader className="mt-3">
          <DialogTitle className="text-xl font-display">{step.title}</DialogTitle>
          <DialogDescription className="text-base text-foreground/80 leading-relaxed pt-2">
            {step.description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between gap-2 pt-4">
          <Button variant="ghost" size="sm" onClick={finish}>
            Skip tour
          </Button>
          <div className="flex items-center gap-2">
            {stepIndex > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
              >
                Back
              </Button>
            )}
            {isLast ? (
              <Button size="sm" onClick={finish}>
                Finish
              </Button>
            ) : (
              <Button size="sm" onClick={() => setStepIndex((i) => i + 1)}>
                Next
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default TutorialModal;