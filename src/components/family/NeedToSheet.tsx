import {
  BookOpen,
  ClipboardList,
  DollarSign,
  FolderOpen,
  HeartHandshake,
  MapPin,
  MessageCircle,
  PhoneCall,
  Pill,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  FlaskConical,
  Brain,
  HelpCircle,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

export type FamilyNeedTab =
  | 'messages'
  | 'values'
  | 'fiis'
  | 'boundaries'
  | 'financial'
  | 'checkin'
  | 'coaching'
  | 'aftercare'
  | 'test-results'
  | 'medications'
  | 'docs'
  | 'meetings'
  | 'enabling';

interface NeedItem {
  tab: FamilyNeedTab;
  label: string;
  description: string;
  icon: typeof MessageCircle;
  familyOnly?: boolean;
  lovedOneOnly?: boolean;
}

const ITEMS: NeedItem[] = [
  { tab: 'messages', label: 'Open family chat', description: 'Talk in the shared thread', icon: MessageCircle },
  { tab: 'checkin', label: 'Check in or find a meeting', description: 'Location, meetings, and attendance', icon: MapPin },
  { tab: 'meetings', label: 'Find Al-Anon, Nar-Anon, AA, or CRAFT', description: 'Family and recovery meetings', icon: Search },
  { tab: 'coaching', label: 'Ask the response coach', description: 'Help with what to say next', icon: PhoneCall },
  { tab: 'boundaries', label: 'Review boundaries', description: 'What we asked, and whether we held it', icon: ShieldCheck },
  { tab: 'financial', label: 'Money request or vote', description: 'Bills, rent, gas, and family votes', icon: DollarSign, familyOnly: true },
  { tab: 'financial', label: 'Ask for help with a bill', description: 'Submit a request the family can review', icon: DollarSign, lovedOneOnly: true },
  { tab: 'docs', label: 'Open documents', description: 'Letters, plans, and uploads', icon: FolderOpen },
  { tab: 'medications', label: 'Medications', description: 'Schedules and reminders', icon: Pill },
  { tab: 'aftercare', label: 'Aftercare plan', description: 'What happens after treatment', icon: ClipboardList },
  { tab: 'test-results', label: 'Drug & alcohol tests', description: 'Documented results', icon: FlaskConical },
  { tab: 'fiis', label: 'Family insights (FIIS)', description: 'Pattern review for the family', icon: Brain, familyOnly: true },
  { tab: 'values', label: 'Family plan & goals', description: 'Shared values and milestones', icon: Target, familyOnly: true },
  { tab: 'enabling', label: 'Am I enabling?', description: 'Full 8-question exercise', icon: HelpCircle, familyOnly: true },
];

interface NeedToSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLovedOne: boolean;
  onSelect: (tab: FamilyNeedTab) => void;
}

export const NeedToSheet = ({ open, onOpenChange, isLovedOne, onSelect }: NeedToSheetProps) => {
  const items = ITEMS.filter((item) => {
    if (item.familyOnly && isLovedOne) return false;
    if (item.lovedOneOnly && !isLovedOne) return false;
    return true;
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            I need to…
          </SheetTitle>
          <SheetDescription>
            Chat, check-ins, documents, meds, and the rest of the family tools live here so Today stays calm.
            Crisis help is still 911 and 988 — above any coaching or paid door.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4 grid gap-2 pb-6">
          {items.map((item) => (
            <button
              key={`${item.tab}-${item.label}`}
              type="button"
              onClick={() => {
                onSelect(item.tab);
                onOpenChange(false);
              }}
              className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:bg-muted/60"
            >
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <item.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            </button>
          ))}
          <p className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
            <HeartHandshake className="h-3.5 w-3.5" />
            <BookOpen className="h-3.5 w-3.5" />
            Family meetings (Al-Anon / Nar-Anon / CRAFT) are listed as clearly as AA is for a loved one.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};
