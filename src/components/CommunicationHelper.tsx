import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { MessageSquareHeart, Sparkles, Loader2, ChevronDown, Copy, Check, Lightbulb, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Suggestion {
  text: string;
  approach: string;
}

interface CommunicationHelperProps {
  familyId: string;
  onUseSuggestion?: (text: string) => void;
}

export const CommunicationHelper: React.FC<CommunicationHelperProps> = ({
  familyId,
  onUseSuggestion,
}) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [rawMessage, setRawMessage] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [tip, setTip] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleGetSuggestions = async () => {
    if (!rawMessage.trim()) {
      toast({
        title: "Please enter a message",
        description: "Type what you want to say and I'll help you phrase it better.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setSuggestions([]);
    setTip(null);

    try {
      const { data, error } = await supabase.functions.invoke('communication-helper', {
        body: { rawMessage: rawMessage.trim(), familyId },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setSuggestions(data.suggestions || []);
      setTip(data.tip || null);
    } catch (error: any) {
      console.error('Communication helper error:', error);
      toast({
        title: "Couldn't get suggestions",
        description: error.message || "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast({
      title: "Copied!",
      description: "Message copied to clipboard.",
    });
  };

  const handleUseSuggestion = (text: string) => {
    if (onUseSuggestion) {
      onUseSuggestion(text);
      setIsOpen(false);
      setRawMessage('');
      setSuggestions([]);
      setTip(null);
      toast({
        title: "Message ready",
        description: "The suggestion has been added to your message input.",
      });
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-0 shadow-md bg-gradient-to-br from-violet-50/50 to-fuchsia-50/50 dark:from-violet-950/20 dark:to-fuchsia-950/20">
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-2 cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg">
            <CardTitle className="flex items-center justify-between text-sm font-medium">
              <div className="flex items-center gap-2 text-violet-700 dark:text-violet-300">
                <MessageSquareHeart className="h-4 w-4" />
                <span>Need help saying something?</span>
              </div>
              <ChevronDown className={cn(
                "h-4 w-4 text-muted-foreground transition-transform duration-200",
                isOpen && "rotate-180"
              )} />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            <p className="text-xs text-muted-foreground">
              Type what you're thinking or how you'd normally say it. I'll suggest more constructive ways to express yourself while keeping your authentic voice.
            </p>
            
            <div className="space-y-2">
              <Textarea
                placeholder="I'm frustrated because they never listen to me..."
                value={rawMessage}
                onChange={(e) => setRawMessage(e.target.value)}
                className="min-h-[80px] resize-none bg-background/80"
                disabled={isLoading}
              />
              
              <Button
                onClick={handleGetSuggestions}
                disabled={isLoading || !rawMessage.trim()}
                className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Thinking...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Get Suggestions
                  </>
                )}
              </Button>
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-violet-500" />
                  Try saying it like this:
                </h4>
                
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg bg-background/80 border border-border/50 space-y-2"
                  >
                    <p className="text-sm">{suggestion.text}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground italic">
                        {suggestion.approach}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleCopy(suggestion.text, index)}
                        >
                          {copiedIndex === index ? (
                            <Check className="h-3 w-3 mr-1 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3 mr-1" />
                          )}
                          Copy
                        </Button>
                        {onUseSuggestion && (
                          <Button
                            variant="default"
                            size="sm"
                            className="h-7 text-xs bg-violet-600 hover:bg-violet-700"
                            onClick={() => handleUseSuggestion(suggestion.text)}
                          >
                            <Send className="h-3 w-3 mr-1" />
                            Use This
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Tip */}
                {tip && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30">
                    <Lightbulb className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-800 dark:text-amber-200">{tip}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
