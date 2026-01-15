import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Heart, X, Sparkles, Loader2 } from 'lucide-react';

interface DailyEmotionalCheckinProps {
  familyId: string;
  onComplete?: () => void;
}

export function DailyEmotionalCheckin({ familyId, onComplete }: DailyEmotionalCheckinProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [feeling, setFeeling] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasCheckedToday, setHasCheckedToday] = useState<boolean | null>(null);

  useEffect(() => {
    if (user && familyId) {
      checkTodaysCheckin();
    }
  }, [user, familyId]);

  const checkTodaysCheckin = async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('daily_emotional_checkins')
      .select('id')
      .eq('user_id', user.id)
      .eq('family_id', familyId)
      .eq('check_in_date', today)
      .maybeSingle();

    if (error) {
      console.error('Error checking today\'s check-in:', error);
      setHasCheckedToday(true); // Don't show popup on error
      return;
    }

    const alreadyCheckedIn = !!data;
    setHasCheckedToday(alreadyCheckedIn);
    
    // Show the popup if not checked in today
    if (!alreadyCheckedIn) {
      // Small delay so the page loads first
      setTimeout(() => setIsOpen(true), 500);
    }
  };

  const handleSubmit = async () => {
    if (!user || !feeling.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('daily_emotional_checkins')
        .insert({
          user_id: user.id,
          family_id: familyId,
          feeling: feeling.trim(),
          was_bypassed: false,
          check_in_date: new Date().toISOString().split('T')[0],
        });

      if (error) throw error;

      toast({
        title: "Check-in recorded",
        description: "Thank you for sharing how you feel today.",
      });

      setIsOpen(false);
      setHasCheckedToday(true);
      onComplete?.();

      // Trigger AI analysis in the background
      triggerToneAnalysis();
    } catch (error) {
      console.error('Error submitting check-in:', error);
      toast({
        title: "Error",
        description: "Could not save your check-in. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBypass = async () => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('daily_emotional_checkins')
        .insert({
          user_id: user.id,
          family_id: familyId,
          feeling: null,
          was_bypassed: true,
          check_in_date: new Date().toISOString().split('T')[0],
        });

      if (error) throw error;

      setIsOpen(false);
      setHasCheckedToday(true);
      onComplete?.();

      // Trigger AI to infer state from bypass
      triggerBypassAnalysis();
    } catch (error) {
      console.error('Error recording bypass:', error);
      // Silently close - don't block user
      setIsOpen(false);
      setHasCheckedToday(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerToneAnalysis = async () => {
    try {
      await supabase.functions.invoke('analyze-emotional-tone', {
        body: { 
          familyId, 
          userId: user?.id,
          analysisType: 'baseline'
        }
      });
    } catch (error) {
      console.error('Background tone analysis failed:', error);
    }
  };

  const triggerBypassAnalysis = async () => {
    try {
      await supabase.functions.invoke('analyze-emotional-tone', {
        body: { 
          familyId, 
          userId: user?.id,
          analysisType: 'bypass_inference'
        }
      });
    } catch (error) {
      console.error('Background bypass analysis failed:', error);
    }
  };

  // Quick emotion suggestions
  const emotionSuggestions = [
    'hopeful', 'anxious', 'grateful', 'tired', 'motivated', 
    'stressed', 'peaceful', 'frustrated', 'optimistic', 'overwhelmed'
  ];

  const handleSuggestionClick = (emotion: string) => {
    setFeeling(prev => {
      if (prev.trim()) {
        return `${prev}, ${emotion}`;
      }
      return emotion;
    });
  };

  // Don't render anything while checking or if already checked in
  if (hasCheckedToday === null || hasCheckedToday) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Heart className="h-5 w-5 text-rose-500" />
            Daily Check-in
          </DialogTitle>
          <DialogDescription>
            Taking a moment to reflect on how you're feeling helps build awareness and connection.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Today I feel...
            </label>
            <Textarea
              value={feeling}
              onChange={(e) => setFeeling(e.target.value)}
              placeholder="Enter how you're feeling right now..."
              className="min-h-[100px] resize-none"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">Quick suggestions:</p>
            <div className="flex flex-wrap gap-1.5">
              {emotionSuggestions.map((emotion) => (
                <button
                  key={emotion}
                  onClick={() => handleSuggestionClick(emotion)}
                  disabled={isSubmitting}
                  className="px-2.5 py-1 text-xs rounded-full bg-muted hover:bg-muted/80 transition-colors disabled:opacity-50"
                >
                  {emotion}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <p className="text-xs text-muted-foreground">
              AI monitors your emotional patterns throughout the day to help track your journey.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button 
            onClick={handleSubmit} 
            disabled={!feeling.trim() || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Heart className="mr-2 h-4 w-4" />
                Share How I Feel
              </>
            )}
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={handleBypass}
            disabled={isSubmitting}
            className="w-full text-muted-foreground hover:text-foreground"
          >
            <X className="mr-2 h-4 w-4" />
            Skip for now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
