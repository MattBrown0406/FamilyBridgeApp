import { useEffect, useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { RotateCcw, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const PREF_KEY = 'fb_tutorials_enabled';

function readEnabled() {
  try {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem(PREF_KEY) !== 'false';
  } catch {
    return true;
  }
}

interface TutorialControlsProps {
  storageKey: string;
  onReplay: () => void;
  className?: string;
}

export function TutorialControls({ storageKey, onReplay, className }: TutorialControlsProps) {
  const [enabled, setEnabled] = useState<boolean>(true);

  useEffect(() => {
    setEnabled(readEnabled());
    const handler = () => setEnabled(readEnabled());
    window.addEventListener('fb:tutorial-preference-changed', handler);
    return () => window.removeEventListener('fb:tutorial-preference-changed', handler);
  }, []);

  const setPref = (next: boolean) => {
    try {
      window.localStorage.setItem(PREF_KEY, next ? 'true' : 'false');
    } catch {
      // ignore
    }
    setEnabled(next);
    window.dispatchEvent(new Event('fb:tutorial-preference-changed'));
    toast(next ? 'Tutorials turned on' : 'Tutorials turned off');
  };

  const handleReplay = () => {
    try {
      window.localStorage.setItem(PREF_KEY, 'true');
      window.localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
    setEnabled(true);
    window.dispatchEvent(new Event('fb:tutorial-preference-changed'));
    onReplay();
    toast('Replaying tour');
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border bg-card px-2.5 py-1.5 shadow-sm',
        className,
      )}
    >
      <Sparkles className="h-3.5 w-3.5 text-primary" />
      <span className="text-xs font-medium text-foreground">Tutorials</span>
      <Switch
        checked={enabled}
        onCheckedChange={setPref}
        aria-label="Toggle tutorials"
        className="scale-90"
      />
      <span className="text-[11px] text-muted-foreground w-6">{enabled ? 'On' : 'Off'}</span>
      <div className="h-4 w-px bg-border" />
      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={handleReplay}>
        <RotateCcw className="h-3.5 w-3.5 mr-1" />
        Replay tour
      </Button>
    </div>
  );
}

export default TutorialControls;