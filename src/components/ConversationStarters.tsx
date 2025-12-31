import { useState } from 'react';
import { ChevronDown, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const CONVERSATION_STARTERS = [
  // Feelings-based
  { category: 'Sharing Feelings', prompts: [
    "Today I'm feeling",
    "Right now I'm struggling with",
    "I'm grateful for",
    "Something that's been on my mind is",
  ]},
  // Goals and intentions
  { category: 'Goals & Intentions', prompts: [
    "My goal for the day is",
    "This week I want to focus on",
    "One thing I'm working on is",
    "I'm proud of myself for",
  ]},
  // Needs and support
  { category: 'Needs & Support', prompts: [
    "Today I need",
    "I could use some help with",
    "What would really support me right now is",
    "I'm reaching out because",
  ]},
  // Commitments
  { category: 'Commitments', prompts: [
    "Today I'm willing to",
    "I commit to",
    "I promise to",
    "I'm going to try",
  ]},
  // Recovery-specific
  { category: 'Recovery Journey', prompts: [
    "A win I had today was",
    "A challenge I faced was",
    "I'm celebrating being sober and feeling",
    "My recovery is going well because",
  ]},
  // Family support
  { category: 'For Family Members', prompts: [
    "I want you to know that",
    "I love you and",
    "I'm here to support you by",
    "Something I've learned in this journey is",
  ]},
];

interface ConversationStartersProps {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

export function ConversationStarters({ onSelect, disabled }: ConversationStartersProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (prompt: string) => {
    onSelect(prompt);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs text-muted-foreground hover:text-foreground gap-1 px-2 h-7"
          disabled={disabled}
        >
          <MessageCircle className="h-3 w-3" />
          Conversation Starters
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        className="w-72 max-h-80 overflow-y-auto bg-popover z-50"
        sideOffset={4}
      >
        {CONVERSATION_STARTERS.map((category, idx) => (
          <div key={category.category}>
            {idx > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="text-xs font-semibold text-primary">
              {category.category}
            </DropdownMenuLabel>
            {category.prompts.map((prompt) => (
              <DropdownMenuItem 
                key={prompt}
                onClick={() => handleSelect(prompt)}
                className="text-sm cursor-pointer focus:bg-accent focus:text-accent-foreground"
              >
                {prompt}
              </DropdownMenuItem>
            ))}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
