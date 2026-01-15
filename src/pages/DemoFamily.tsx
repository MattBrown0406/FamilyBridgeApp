import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FinancialRequestCard } from '@/components/FinancialRequestCard';
import { DemoFamilyHealthBadge } from '@/components/FamilyHealthBadge';
import { 
  ArrowLeft, 
  Send, 
  Users, 
  DollarSign, 
  MessageCircle, 
  MapPin,
  Shield,
  ShieldCheck,
  Check,
  X,
  ThumbsUp,
  ThumbsDown,
  Clock,
  CheckCircle,
  Target,
  Calendar,
  AlertTriangle,
  Sparkles,
  Paperclip,
  FileText,
  TrendingUp,
  TrendingDown,
  Activity,
  Mail,
  FlaskConical,
  Crown,
  LifeBuoy,
  Brain,
  Eye,
  RefreshCw,
  Minus,
  AlertCircle,
  XCircle,
  ChevronDown,
  Search,
  Wine
} from 'lucide-react';
import familyBridgeLogo from '@/assets/familybridge-logo.png';
import { format } from 'date-fns';
import demoElectricBill from '@/assets/demo-electric-bill.png';
import { toast } from 'sonner';
import demoGasReceipt from '@/assets/demo-gas-receipt.png';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Demo Family 1: The Johnson Family - Positive Recovery Journey (with Professional Moderator)
const JOHNSON_MEMBERS = [
  { id: '0', name: 'Matt Brown', role: 'moderator', relationship: 'Case Manager', initials: 'MB' },
  { id: '1', name: 'Sarah Johnson', role: 'admin', relationship: 'Parent', initials: 'SJ' },
  { 
    id: '2', 
    name: 'Michael Johnson', 
    role: 'recovering', 
    relationship: 'Recovering', 
    initials: 'MJ',
    paymentInfo: {
      paypal: 'michael.johnson@email.com',
      venmo: '@MichaelJ-Recovery',
      cashapp: '$MichaelJohnson47'
    }
  },
  { id: '3', name: 'David Johnson', role: 'member', relationship: 'Sibling', initials: 'DJ' },
  { id: '4', name: 'Emily Johnson', role: 'member', relationship: 'Spouse', initials: 'EJ' },
  { id: '5', name: 'Robert Johnson', role: 'member', relationship: 'Grandparent', initials: 'RJ' },
];

const JOHNSON_MESSAGES = [
  { id: '1', sender: 'Sarah Johnson', senderId: '1', content: 'Good morning everyone! Michael, how did last night go?', time: '9:15 AM' },
  { id: '2', sender: 'Michael Johnson', senderId: '2', content: 'Morning mom. Went to my AA meeting last night. 47 days sober today 🙏', time: '9:22 AM' },
  { id: '3', sender: 'Emily Johnson', senderId: '4', content: 'That\'s amazing Michael! So proud of you!', time: '9:25 AM' },
  { id: '4', sender: 'David Johnson', senderId: '3', content: 'Great job bro! Keep it up!', time: '9:28 AM' },
  { id: '5', sender: 'Robert Johnson', senderId: '5', content: 'Very proud of you, grandson. One day at a time.', time: '9:32 AM' },
  { id: '6', sender: 'Michael Johnson', senderId: '2', content: 'Thanks everyone. I\'m going to check in to my meeting tonight. Will update after.', time: '10:05 AM' },
  { id: '7', sender: 'Michael Johnson', senderId: '2', content: '💰 **Financial Request** from Michael Johnson\n\n**Amount:** $147.23\n**Reason:** Electric bill - City Power & Light (Account #4521-7890-3336)\n\nPlease vote on this request and pledge to help if you can!', time: '2:30 PM' },
  { id: '8', sender: 'Michael Johnson', senderId: '2', content: '🙏 **Checked into Recovery Meeting**\n\nI\'m attending: AA - Evening Serenity Group\n📍 St. Mark\'s Church, 123 Main St\n⏰ Checkout expected at 8:00 PM', time: '6:45 PM' },
];

const JOHNSON_FINANCIAL_REQUESTS = [
  { 
    id: '1', 
    requester: 'Michael Johnson', 
    amount: 147.23, 
    reason: 'Electric bill - City Power & Light (Account #4521-7890-3336)', 
    status: 'pending',
    attachmentUrl: demoElectricBill,
    attachmentCaption: 'Electric bill for Michael Johnson • Account #4521-7890-3336 • Amount: $147.23',
    votes: { approve: 3, deny: 0 },
    pledges: [
      { name: 'Sarah Johnson', amount: 75 },
      { name: 'Robert Johnson', amount: 72.23 },
    ],
    createdAt: 'Yesterday at 2:30 PM'
  },
  { 
    id: '2', 
    requester: 'Michael Johnson', 
    amount: 50, 
    reason: 'Gas for work commute', 
    status: 'completed',
    attachmentUrl: demoGasReceipt,
    attachmentCaption: 'Gas station receipt • Total: $50.00',
    fundsReceived: true,
    fundsReceivedAt: '2 days ago',
    paymentConfirmed: true,
    paymentConfirmedAt: '2 days ago',
    votes: { approve: 4, deny: 0 },
    pledges: [
      { name: 'Emily Johnson', amount: 50 },
    ],
    createdAt: '3 days ago'
  },
];

const JOHNSON_CHECKINS = [
  { 
    id: '1', 
    user: 'Michael Johnson', 
    type: 'AA', 
    name: 'Evening Serenity Group',
    location: 'St. Mark\'s Church, 123 Main St',
    checkinTime: '6:45 PM',
    checkoutDue: '8:00 PM',
    status: 'active'
  },
  { 
    id: '2', 
    user: 'Michael Johnson', 
    type: 'Therapy', 
    name: 'Dr. Smith',
    location: 'Wellness Center, Suite 200',
    checkinTime: '10:00 AM',
    checkoutTime: '11:02 AM',
    status: 'completed'
  },
];

const JOHNSON_BOUNDARIES = [
  {
    id: '1',
    content: 'No financial assistance for anything other than essential bills (rent, utilities, food)',
    createdBy: 'Sarah Johnson',
    status: 'approved',
    acknowledgments: ['Sarah Johnson', 'David Johnson', 'Emily Johnson', 'Robert Johnson', 'Michael Johnson'],
  },
  {
    id: '2',
    content: 'Michael must check in to at least 3 meetings per week',
    createdBy: 'Sarah Johnson',
    targetUser: 'Michael Johnson',
    status: 'approved',
    acknowledgments: ['Sarah Johnson', 'Michael Johnson', 'David Johnson', 'Emily Johnson', 'Robert Johnson'],
  },
];

const JOHNSON_VALUES = [
  { key: 'honesty', name: 'Honesty & Transparency' },
  { key: 'accountability', name: 'Accountability and Repair Without Shame' },
];

const JOHNSON_COMMON_GOALS = [
  { key: 'weekly_meetings', name: 'Attend Weekly Family Meetings', completed: false },
  { key: 'attend_support', name: 'Attend Support Groups (Al-Anon, etc.)', completed: false },
];

// FIIS Analysis for Johnson Family - Positive Recovery at 47 Days
const JOHNSON_FIIS_ANALYSIS = {
  what_seeing: "I'm observing a family system that is showing strong signs of early recovery stability at Day 47. Michael is demonstrating consistent engagement with his recovery program, and the family is maintaining unified support. The presence of a professional moderator (Matt Brown) is helping keep communication healthy and boundaries clear. I see evidence that the family's chosen values of Honesty & Transparency and Accountability Without Shame are being lived out in daily interactions.",
  pattern_signals: [
    {
      signal_type: 'progress',
      description: 'Michael has maintained 47 consecutive days of sobriety with consistent meeting attendance (averaging 4-5 meetings per week). Therapy sessions are being attended regularly. This consistency at the 6-week mark is a positive indicator of emerging stability.',
      confidence: 'high'
    },
    {
      signal_type: 'family_unity',
      description: 'All family members have acknowledged and are honoring the established boundaries. Financial requests align with agreed-upon guidelines (essential bills only). No evidence of secret communications or boundary violations.',
      confidence: 'very_high'
    },
    {
      signal_type: 'healthy_communication',
      description: 'Chat messages show supportive, encouraging language without enabling. Family celebrates milestones while maintaining realistic expectations. No toxic positivity or minimizing of the recovery journey.',
      confidence: 'high'
    },
    {
      signal_type: 'accountability_working',
      description: 'Michael is proactively checking in to meetings and communicating his plans. Financial request for electric bill included proper documentation. The family is practicing accountability without shame, per their stated values.',
      confidence: 'high'
    },
    {
      signal_type: 'attention_needed',
      description: 'Family has not logged a support group meeting (Al-Anon, etc.) this week. The family commitment was that ALL members, including supporters, would attend weekly meetings alongside Michael. This is the first week this has been missed.',
      confidence: 'moderate'
    },
  ],
  contextual_framing: "Day 47 represents a significant milestone. Research shows that the 30-90 day window is critical for establishing new patterns. The Johnson family is doing many things right: unified approach, professional support, clear boundaries, and values-driven decisions. The one area needing attention is the family's own recovery work through Al-Anon or similar support groups - recovery is a family journey, not just Michael's.",
  recommendations: [
    {
      title: "Maintain the Winning Formula",
      description: "Continue the current approach: consistent meeting attendance, transparent financial requests with documentation, and open family communication. What you're doing is working.",
      related_to: "Values: Honesty & Transparency"
    },
    {
      title: "Family Meeting Check-In This Week",
      description: "Your family goal states that supporters will attend weekly Al-Anon or similar meetings. This hasn't happened this week. Sarah, David, Emily, and Robert - your recovery work matters too. Consider scheduling a group Al-Anon meeting together.",
      related_to: "Goal: Attend Support Groups (Al-Anon, etc.)"
    },
    {
      title: "Reinforce Accountability Without Shame",
      description: "When the 3-meeting-per-week boundary is met (as it has been consistently), acknowledge this openly. Positive reinforcement of boundary compliance strengthens the recovery environment.",
      related_to: "Value: Accountability and Repair Without Shame"
    },
    {
      title: "Plan for Day 60 and Day 90 Milestones",
      description: "Begin discussing as a family how you'll celebrate these upcoming milestones in healthy ways. Having something to look forward to supports motivation while maintaining realistic expectations.",
      related_to: "Boundary: Check in to at least 3 meetings per week"
    },
    {
      title: "Document What's Working",
      description: "Consider logging observations about what's going well. This creates a reference point if challenges arise later and reinforces the positive patterns you've established.",
      related_to: "Values: Honesty & Transparency"
    }
  ],
  clarifying_questions: [
    "Has the family discussed what healthy celebration looks like for the upcoming 60-day milestone?",
    "Are family members experiencing any compassion fatigue or feeling like they need additional support?",
    "Has Michael shared what aspects of his recovery program are feeling most helpful right now?",
    "Are there any upcoming stressors (holidays, anniversaries, work changes) that the family should prepare for?"
  ],
  what_to_watch: [
    "Family support group attendance - this week's missed meeting shouldn't become a pattern",
    "Signs of complacency around Day 60-90 - early success can sometimes lead to reduced vigilance",
    "Michael's stress levels as he takes on more responsibilities (work commute, managing bills)",
    "Any changes in meeting attendance frequency or engagement quality"
  ],
  strengths: [
    {
      area: 'Professional Moderation',
      detail: 'Matt Brown provides objective oversight and keeps communication healthy'
    },
    {
      area: 'Unified Family Response',
      detail: 'All family members are aligned on boundaries and values'
    },
    {
      area: 'Transparent Finances',
      detail: 'Financial requests include documentation, votes are thoughtful, pledges are fulfilled'
    },
    {
      area: 'Consistent Recovery Work',
      detail: 'Michael averaging 4-5 meetings per week, attending therapy regularly'
    }
  ]
};

// Demo Family 2: The Davis Family - Active Addiction Crisis (Private Family - No Professional Moderator)
const DAVIS_MEMBERS = [
  { id: '1', name: 'Richard Davis', role: 'admin', relationship: 'Parent (Dad)', initials: 'RD' },
  { id: '2', name: 'Karen Davis', role: 'member', relationship: 'Parent (Mom)', initials: 'KD' },
  { 
    id: '3', 
    name: 'Ashley Davis', 
    role: 'recovering', 
    relationship: 'Recovering (Daughter)', 
    initials: 'AD',
    paymentInfo: {
      paypal: 'ashley.davis@email.com',
      venmo: '@AshleyD-22',
      cashapp: '$AshleyDavis22'
    }
  },
  { id: '4', name: 'Brandon Davis', role: 'member', relationship: 'Sibling (Brother)', initials: 'BD' },
  { id: '5', name: 'Grandma Rose', role: 'member', relationship: 'Grandparent', initials: 'GR' },
];

const DAVIS_MESSAGES = [
  { id: '1', sender: 'Ashley Davis', senderId: '3', content: 'I need $200 for groceries. I haven\'t eaten in 2 days.', time: '8:15 AM' },
  { id: '2', sender: 'Karen Davis', senderId: '2', content: 'Ashley, you said the same thing last week and we found out you spent it at the bar. What happened to the food stamps?', time: '8:22 AM' },
  { id: '3', sender: 'Richard Davis', senderId: '1', content: 'Karen, don\'t be so harsh. She\'s our daughter. Ashley, sweetie, I can help you with groceries.', time: '8:28 AM' },
  { id: '4', sender: 'Brandon Davis', senderId: '4', content: 'Dad, stop! This is exactly what we talked about. You keep bailing her out and nothing changes.', time: '8:32 AM' },
  { id: '5', sender: 'Richard Davis', senderId: '1', content: 'Brandon, you don\'t understand. I can\'t just let her starve. She\'s my little girl.', time: '8:35 AM' },
  { id: '6', sender: 'Ashley Davis', senderId: '3', content: 'See? Dad gets it. Everyone else just wants to punish me. I made ONE mistake.', time: '8:40 AM' },
  { id: '7', sender: 'Karen Davis', senderId: '2', content: 'Ashley, you haven\'t been to a meeting in 3 weeks. You missed therapy twice. You\'ve asked for money 6 times this month.', time: '8:45 AM' },
  { id: '8', sender: 'Richard Davis', senderId: '1', content: 'Maybe if we just help her get stable, she\'ll be able to focus on recovery...', time: '8:50 AM' },
  { id: '9', sender: 'Grandma Rose', senderId: '5', content: 'Richard, honey, I love Ashley too but we agreed as a family to follow the boundaries. When we keep rescuing her, we\'re hurting her recovery.', time: '8:55 AM' },
  { id: '10', sender: 'Brandon Davis', senderId: '4', content: 'Dad, you\'ve given her over $2,000 in the last month. How much of that went to groceries?', time: '9:00 AM' },
  { id: '11', sender: 'Ashley Davis', senderId: '3', content: 'Whatever. None of you understand. I\'ll figure it out myself.', time: '9:05 AM' },
  { id: '12', sender: 'Richard Davis', senderId: '1', content: 'See what you all did? Now she\'s upset. Ashley, wait - I\'ll call you privately.', time: '9:08 AM' },
  { id: '13', sender: 'Karen Davis', senderId: '2', content: 'Richard, NO. We agreed - all communication through the app. No secret conversations. That\'s a boundary.', time: '9:10 AM' },
  { id: '14', sender: 'Ashley Davis', senderId: '3', content: '💰 **Financial Request** from Ashley Davis\n\n**Amount:** $75\n**Reason:** Need cash for bus pass to get to job interview\n\nPlease vote on this request!', time: '11:30 AM' },
  { id: '15', sender: 'Richard Davis', senderId: '1', content: 'I voted to approve. She needs to get to work interviews!', time: '11:45 AM' },
  { id: '16', sender: 'Brandon Davis', senderId: '4', content: 'A bus pass is $30, not $75. And what job interview? Ashley, can you provide details?', time: '11:52 AM' },
];

const DAVIS_FINANCIAL_REQUESTS = [
  { 
    id: '1', 
    requester: 'Ashley Davis', 
    amount: 75, 
    reason: 'Need cash for bus pass to get to job interview', 
    status: 'pending',
    votes: { approve: 1, deny: 3 },
    voterDetails: [
      { name: 'Richard Davis', approved: true },
      { name: 'Karen Davis', approved: false },
      { name: 'Brandon Davis', approved: false },
      { name: 'Grandma Rose', approved: false },
    ],
    pledges: [
      { name: 'Richard Davis', amount: 75 },
    ],
    denialReasons: ['Amount inconsistent with stated need', 'No documentation provided'],
    createdAt: 'Today at 11:30 AM'
  },
  { 
    id: '2', 
    requester: 'Ashley Davis', 
    amount: 200, 
    reason: 'Groceries - haven\'t eaten in 2 days', 
    status: 'denied',
    votes: { approve: 1, deny: 4 },
    voterDetails: [
      { name: 'Richard Davis', approved: true },
      { name: 'Karen Davis', approved: false },
      { name: 'Brandon Davis', approved: false },
      { name: 'Grandma Rose', approved: false },
    ],
    pledges: [],
    denialReasons: ['Similar request last week was misused', 'Food stamps not accounted for', 'Violates boundary: must demonstrate recovery compliance first'],
    createdAt: 'Yesterday at 3:15 PM'
  },
  { 
    id: '3', 
    requester: 'Ashley Davis', 
    amount: 150, 
    reason: 'Phone bill - need phone for job search', 
    status: 'denied',
    votes: { approve: 1, deny: 3 },
    voterDetails: [
      { name: 'Richard Davis', approved: true },
      { name: 'Karen Davis', approved: false },
      { name: 'Brandon Davis', approved: false },
      { name: 'Grandma Rose', approved: false },
    ],
    pledges: [],
    denialReasons: ['Has not attended meetings as required', 'Previous phone was sold - unclear what happened'],
    createdAt: '3 days ago'
  },
  { 
    id: '4', 
    requester: 'Ashley Davis', 
    amount: 300, 
    reason: 'Need to pay friend back who helped me', 
    status: 'denied',
    votes: { approve: 1, deny: 4 },
    voterDetails: [
      { name: 'Richard Davis', approved: true },
      { name: 'Karen Davis', approved: false },
      { name: 'Brandon Davis', approved: false },
      { name: 'Grandma Rose', approved: false },
    ],
    pledges: [],
    denialReasons: ['Not an essential expense', 'Unclear who friend is or what help was provided', 'Does not align with family values: transparency'],
    createdAt: '5 days ago'
  },
  { 
    id: '5', 
    requester: 'Ashley Davis', 
    amount: 85, 
    reason: 'Gas for car', 
    status: 'denied',
    votes: { approve: 1, deny: 3 },
    voterDetails: [
      { name: 'Richard Davis', approved: true },
      { name: 'Karen Davis', approved: false },
      { name: 'Brandon Davis', approved: false },
    ],
    pledges: [],
    denialReasons: ['Car was impounded 2 weeks ago - no longer has vehicle', 'Request not aligned with reality'],
    createdAt: '1 week ago'
  },
];

const DAVIS_CHECKINS = [
  { 
    id: '1', 
    user: 'Ashley Davis', 
    type: 'NA', 
    name: 'Daily Hope Group',
    location: 'Community Center',
    checkinTime: '7:00 PM',
    checkoutTime: '7:15 PM',
    status: 'incomplete',
    notes: 'Left after 15 minutes'
  },
];

const DAVIS_BOUNDARIES = [
  {
    id: '1',
    content: 'No financial assistance until 3 consecutive meetings are attended',
    createdBy: 'Karen Davis',
    status: 'approved',
    acknowledgments: ['Karen Davis', 'Brandon Davis', 'Grandma Rose'],
    notAcknowledged: ['Richard Davis', 'Ashley Davis'],
  },
  {
    id: '2',
    content: 'All requests for money must include documentation or receipts',
    createdBy: 'Brandon Davis',
    status: 'approved',
    acknowledgments: ['Karen Davis', 'Brandon Davis', 'Grandma Rose'],
    notAcknowledged: ['Richard Davis'],
  },
  {
    id: '3',
    content: 'No private conversations about finances - all discussions in the app',
    createdBy: 'Karen Davis',
    status: 'approved',
    acknowledgments: ['Karen Davis', 'Brandon Davis', 'Grandma Rose'],
    notAcknowledged: ['Richard Davis'],
  },
];

const DAVIS_VALUES = [
  { key: 'tough_love', name: 'Tough Love & Clear Consequences' },
  { key: 'transparency', name: 'Honesty & Transparency' },
];

const DAVIS_COMMON_GOALS = [
  { key: 'weekly_meetings', name: 'Ashley attends 3+ meetings per week', completed: false },
  { key: 'family_alignment', name: 'All family members follow agreed boundaries', completed: false, warning: 'Dad consistently breaking this' },
];

// FIIS Analysis for Davis Family
const DAVIS_FIIS_ANALYSIS = {
  what_seeing: "I'm observing a family in crisis with significant dysfunction in the support system. The recovering person (Ashley) is showing classic manipulation patterns and the support system is fractured, with one family member (Richard/Dad) consistently undermining agreed-upon boundaries. This creates a dangerous enabling dynamic that is actively working against recovery.",
  pattern_signals: [
    {
      signal_type: 'escalation',
      description: 'Financial requests increasing in frequency (6 in past month) with increasingly creative justifications. Each denial leads to emotional manipulation attempts.',
      confidence: 'high'
    },
    {
      signal_type: 'enabling',
      description: 'Richard (Dad) has voted to approve 100% of requests despite family consensus to deny. Private conversations happening outside the app. Pattern indicates codependency.',
      confidence: 'very_high'
    },
    {
      signal_type: 'manipulation',
      description: 'Ashley uses guilt ("I haven\'t eaten"), victimhood ("everyone is against me"), and triangulation (going to Dad privately) to circumvent boundaries.',
      confidence: 'high'
    },
    {
      signal_type: 'regression',
      description: 'Meeting attendance dropped from 3x/week to 0 in past 3 weeks. Therapy sessions missed. No check-ins completed successfully. Recovery trajectory is negative.',
      confidence: 'very_high'
    },
    {
      signal_type: 'boundary_violation',
      description: 'Multiple approved boundaries being violated: private conversations, financial handouts outside app, no documentation requirements being met.',
      confidence: 'high'
    },
  ],
  contextual_framing: "This family is at a critical juncture. The enabling pattern from Richard is preventing the natural consequences that often motivate change. Without unified family action, Ashley has no incentive to engage in recovery. The other family members are doing the right things but are being undermined.",
  clarifying_questions: [
    "Has Richard attended Al-Anon or received education about codependency and enabling?",
    "Are there secret financial transactions happening between Richard and Ashley outside the app?",
    "What consequences have been discussed if Richard continues to break agreed boundaries?",
    "Has the family considered professional intervention services?"
  ],
  what_to_watch: [
    "Richard's behavior in private - is he giving cash or help outside the app?",
    "Ashley's escalation tactics - when manipulation fails, what comes next?",
    "Family unity - is the enabling causing relationship damage between Richard and Karen?",
    "Signs of crisis - verbal threats, health emergencies, or legal issues"
  ],
  risk_alerts: [
    {
      level: 'critical',
      person: 'Richard Davis',
      issue: 'High Risk for Enabling',
      details: 'Richard has approved 100% of Ashley\'s requests despite family consensus to deny. His chat messages show classic codependent patterns: prioritizing short-term comfort over long-term recovery, rescuing behavior, difficulty tolerating Ashley\'s distress, and undermining other family members\' boundaries. His comment "I can\'t just let her starve" and attempts to call her privately indicate he is unable to hold firm boundaries.'
    },
    {
      level: 'high',
      person: 'Ashley Davis',
      issue: 'Active Addiction Indicators',
      details: 'Multiple red flags: no meeting attendance in 3 weeks, missed therapy, escalating financial requests with inconsistent explanations (bus pass = $75, gas for impounded car), manipulative language patterns, and quick emotional escalation when boundaries are enforced.'
    },
    {
      level: 'moderate',
      person: 'Family System',
      issue: 'Boundary Inconsistency',
      details: 'The family has good boundaries on paper but enforcement is inconsistent due to Richard\'s non-compliance. This sends mixed messages and creates an unstable recovery environment.'
    }
  ]
};

interface DemoBranding {
  primaryColor: string;
  logo: string | null;
  logoNeedsBackground?: boolean;
  name: string;
}

type FamilyType = 'johnson' | 'davis';

const DemoFamily = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const branding = (location.state as { branding?: DemoBranding })?.branding;
  const [activeTab, setActiveTab] = useState('messages');
  const [newMessage, setNewMessage] = useState('');
  const [selectedMember, setSelectedMember] = useState<typeof JOHNSON_MEMBERS[0] | null>(null);
  const [showMembersList, setShowMembersList] = useState(false);
  const [showModeratorDialog, setShowModeratorDialog] = useState(false);
  
  // Family selection state
  const [selectedFamily, setSelectedFamily] = useState<FamilyType>('johnson');
  
  // Get current family data based on selection
  const currentFamily = selectedFamily === 'johnson' ? {
    name: 'The Johnson Family',
    description: 'Professional Moderator • Positive Recovery',
    members: JOHNSON_MEMBERS,
    messages: JOHNSON_MESSAGES,
    financialRequests: JOHNSON_FINANCIAL_REQUESTS,
    checkins: JOHNSON_CHECKINS,
    boundaries: JOHNSON_BOUNDARIES,
    values: JOHNSON_VALUES,
    commonGoals: JOHNSON_COMMON_GOALS,
    hasOrganization: true,
    fiisAnalysis: JOHNSON_FIIS_ANALYSIS,
  } : {
    name: 'The Davis Family',
    description: 'Private Family • Crisis Mode',
    members: DAVIS_MEMBERS,
    messages: DAVIS_MESSAGES,
    financialRequests: DAVIS_FINANCIAL_REQUESTS,
    checkins: DAVIS_CHECKINS,
    boundaries: DAVIS_BOUNDARIES,
    values: DAVIS_VALUES,
    commonGoals: DAVIS_COMMON_GOALS,
    hasOrganization: false,
    fiisAnalysis: DAVIS_FIIS_ANALYSIS,
  };
  
  const [messages, setMessages] = useState(currentFamily.messages);
  
  // Update messages when family changes
  const handleFamilyChange = (family: FamilyType) => {
    setSelectedFamily(family);
    const familyData = family === 'johnson' ? JOHNSON_MESSAGES : DAVIS_MESSAGES;
    setMessages(familyData);
    setActiveTab('messages');
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    const newMsg = {
      id: String(messages.length + 1),
      sender: 'You (Demo User)',
      senderId: 'demo',
      content: newMessage,
      time: format(new Date(), 'h:mm a'),
    };
    
    setMessages([...messages, newMsg]);
    setNewMessage('');
  };

  const getMemberById = (id: string) => currentFamily.members.find(m => m.id === id);
  const recoveringMember = currentFamily.members.find(m => m.role === 'recovering');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header 
        className="border-b backdrop-blur-md bg-background/80 sticky top-0 z-50 shadow-sm"
        style={branding ? { backgroundColor: `${branding.primaryColor}08` } : undefined}
      >
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
          {/* Mobile: Stack layout, Desktop: Flex row */}
          <div className="flex items-center justify-between gap-2">
            {/* Left side - Back button and family info */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <Button variant="ghost" size="sm" onClick={() => navigate('/demo')} className="hover-lift shrink-0 px-2 sm:px-3">
                <ArrowLeft className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Back to Demo</span>
              </Button>
              <div className="h-6 w-px bg-border/50 hidden sm:block" />
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <button 
                  onClick={() => setShowMembersList(true)}
                  className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 relative shrink-0"
                  style={{ 
                    background: branding 
                      ? `linear-gradient(135deg, ${branding.primaryColor}, ${branding.primaryColor}cc)` 
                      : selectedFamily === 'davis' 
                        ? 'linear-gradient(135deg, hsl(var(--destructive)), hsl(var(--destructive) / 0.8))'
                        : 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))'
                  }}
                  title="View family members"
                >
                  <img src={familyBridgeLogo} alt="FamilyBridge" className="h-4 w-4 sm:h-5 sm:w-5 object-contain" />
                  <span className="absolute -bottom-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-white shadow-md flex items-center justify-center text-[8px] sm:text-[10px] font-bold text-primary border border-primary/20">
                    {currentFamily.members.length}
                  </span>
                </button>
                <div className="flex flex-col min-w-0">
                  {/* Family Selector Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-1 font-semibold text-foreground hover:text-primary transition-colors text-sm sm:text-base truncate">
                        <span className="truncate">{currentFamily.name}</span>
                        <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-64">
                      <DropdownMenuItem onClick={() => handleFamilyChange('johnson')} className="cursor-pointer">
                        <div className="flex items-center gap-3 py-1">
                          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                            <Users className="h-4 w-4 text-primary-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">The Johnson Family</p>
                            <p className="text-xs text-muted-foreground">Professional Moderator • Positive Recovery</p>
                          </div>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleFamilyChange('davis')} className="cursor-pointer">
                        <div className="flex items-center gap-3 py-1">
                          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-destructive to-destructive/80 flex items-center justify-center">
                            <AlertTriangle className="h-4 w-4 text-destructive-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">The Davis Family</p>
                            <p className="text-xs text-muted-foreground">Private Family • Crisis Mode</p>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <div className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full ${selectedFamily === 'davis' ? 'bg-destructive' : 'bg-green-500'} animate-pulse`} />
                    <span className="text-[10px] sm:text-xs text-muted-foreground truncate">{currentFamily.description}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right side - Badges and actions */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {selectedFamily === 'davis' && (
                <Badge variant="destructive" className="bg-destructive/20 text-destructive border-destructive/30 text-[10px] sm:text-xs px-1.5 sm:px-2">
                  <AlertTriangle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                  <span className="hidden sm:inline">Crisis</span>
                </Badge>
              )}
              <Badge variant="secondary" className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20 text-[10px] sm:text-xs px-1.5 sm:px-2">
                <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                <span className="hidden sm:inline">Demo Mode</span>
                <span className="sm:hidden">Demo</span>
              </Badge>
              
              {/* Request Temporary Moderator Button (for Davis family only) */}
              {selectedFamily === 'davis' && !currentFamily.hasOrganization && (
                <AlertDialog open={showModeratorDialog} onOpenChange={setShowModeratorDialog}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 sm:gap-2 border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground text-xs sm:text-sm px-2 sm:px-3"
                    >
                      <LifeBuoy className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden md:inline">Request 24hr Moderator</span>
                      <span className="md:hidden">Help</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-md mx-4">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-warning" />
                        Request 24-Hour Crisis Support
                      </AlertDialogTitle>
                      <AlertDialogDescription asChild>
                        <div className="space-y-4 text-left">
                          <p>
                            You are about to request temporary supervision from a professional 
                            interventionist to help your family during a crisis.
                          </p>
                          
                          <div className="bg-muted p-4 rounded-lg space-y-2">
                            <p className="font-medium text-foreground">What happens next:</p>
                            <ul className="list-disc list-inside text-sm space-y-1">
                              <li>A professional interventionist will be assigned immediately</li>
                              <li>They will have moderator access to your family group for 24 hours</li>
                              <li>They will monitor conversations and provide guidance</li>
                            </ul>
                          </div>

                          <div className="bg-primary/10 p-4 rounded-lg">
                            <p className="text-sm">
                              <strong className="text-foreground">Your membership includes:</strong>
                              {' '}One free 24-hour crisis supervision per 30-day period.
                            </p>
                          </div>
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          toast.success('Demo: Crisis support would be activated for 24 hours');
                          setShowModeratorDialog(false);
                        }}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Yes, Request Crisis Support
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <Button 
                onClick={() => navigate('/family-purchase')}
                size="sm"
                className="hover-lift shadow-lg text-xs sm:text-sm px-2 sm:px-4"
                style={branding ? { backgroundColor: branding.primaryColor } : undefined}
              >
                <span className="hidden sm:inline">Get Started</span>
                <span className="sm:hidden">Start</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Demo Banner */}
      <div 
        className={`border-b py-2 sm:py-3 px-2 sm:px-4 text-center ${
          selectedFamily === 'davis' 
            ? 'bg-gradient-to-r from-destructive/5 via-destructive/10 to-destructive/5' 
            : 'bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5'
        }`}
      >
        <p className="text-xs sm:text-sm flex items-center justify-center gap-1 sm:gap-2 animate-fade-in">
          {selectedFamily === 'davis' ? (
            <>
              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-destructive animate-pulse shrink-0" />
              <span className="text-destructive font-medium">
                <span className="hidden sm:inline">Crisis Demo: This family is struggling with active addiction and enabling patterns.</span>
                <span className="sm:hidden">Crisis Demo: Active addiction & enabling patterns</span>
              </span>
              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-destructive animate-pulse shrink-0 hidden sm:block" />
            </>
          ) : (
            <>
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 animate-pulse shrink-0" />
              <span>
                <span className="hidden sm:inline">Positive Recovery Demo: This family has professional support and is making progress.</span>
                <span className="sm:hidden">Positive Recovery: Professional support & progress</span>
              </span>
              <Activity className="h-3 w-3 sm:h-4 sm:w-4 animate-pulse shrink-0 hidden sm:block" />
            </>
          )}
        </p>
      </div>

      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
        <div className="max-w-5xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {/* Mobile: Use grid for better spacing, Desktop: flex row */}
            <TabsList className="grid grid-cols-7 h-auto gap-0.5 sm:gap-1 w-full mb-2 sm:mb-4 shrink-0 bg-card/50 backdrop-blur-sm border border-border/50 p-1 sm:p-1.5 rounded-lg sm:rounded-xl shadow-soft">
              <TabsTrigger 
                value="messages" 
                className="flex items-center justify-center gap-0.5 sm:gap-1 px-1 sm:px-2 py-1.5 sm:py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-md sm:rounded-lg transition-all duration-200"
              >
                <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-xs">Messages</span>
              </TabsTrigger>
              <TabsTrigger 
                value="checkin" 
                className="flex items-center justify-center gap-0.5 sm:gap-1 px-1 sm:px-2 py-1.5 sm:py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-md sm:rounded-lg transition-all duration-200"
              >
                <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-xs">Check-in</span>
              </TabsTrigger>
              <TabsTrigger 
                value="financial"
                className="relative flex items-center justify-center gap-0.5 sm:gap-1 px-1 sm:px-2 py-1.5 sm:py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-md sm:rounded-lg transition-all duration-200"
              >
                <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-xs">Financial</span>
                {selectedFamily === 'davis' && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-3.5 w-3.5 sm:h-4 sm:w-4 p-0 flex items-center justify-center text-[7px] sm:text-[8px]">5</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="values"
                className="flex items-center justify-center gap-0.5 sm:gap-1 px-1 sm:px-2 py-1.5 sm:py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-md sm:rounded-lg transition-all duration-200"
              >
                <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-xs">Goals</span>
              </TabsTrigger>
              <TabsTrigger 
                value="boundaries"
                className="flex items-center justify-center gap-0.5 sm:gap-1 px-1 sm:px-2 py-1.5 sm:py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-md sm:rounded-lg transition-all duration-200"
              >
                <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-xs">Boundaries</span>
              </TabsTrigger>
              <TabsTrigger 
                value="test-results"
                className="flex items-center justify-center gap-0.5 sm:gap-1 px-1 sm:px-2 py-1.5 sm:py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-md sm:rounded-lg transition-all duration-200"
              >
                <FlaskConical className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-xs">Tests</span>
              </TabsTrigger>
              <TabsTrigger 
                value="fiis"
                className="relative flex items-center justify-center gap-0.5 sm:gap-1 px-1 sm:px-2 py-1.5 sm:py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-md sm:rounded-lg transition-all duration-200"
              >
                <Brain className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-xs">FIIS</span>
                {selectedFamily === 'davis' && (
                  <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 h-2.5 w-2.5 sm:h-3 sm:w-3 bg-red-500 rounded-full animate-pulse border-2 border-card" />
                )}
              </TabsTrigger>
            </TabsList>

            {/* Messages Tab */}
            <TabsContent value="messages" className="animate-fade-in">
              <Card className="card-interactive border-0 shadow-lg bg-gradient-to-br from-card to-card/95 overflow-hidden">
                <div className={`h-1 ${selectedFamily === 'davis' ? 'bg-gradient-to-r from-destructive via-destructive/80 to-destructive/60' : 'bg-gradient-to-r from-primary via-primary/80 to-primary/60'}`} />
                <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
                  <CardTitle className="text-base sm:text-lg flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <div className={`h-6 w-6 sm:h-8 sm:w-8 rounded-lg ${selectedFamily === 'davis' ? 'bg-gradient-to-br from-destructive to-destructive/80' : 'bg-gradient-to-br from-primary to-primary/80'} flex items-center justify-center shrink-0`}>
                      <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 text-primary-foreground" />
                    </div>
                    <span>Messages</span>
                    <DemoFamilyHealthBadge 
                      status={selectedFamily === 'davis' ? 'tension' : 'improving'}
                      reason={selectedFamily === 'davis' 
                        ? 'Voting disagreements, communication friction detected'
                        : 'High check-in rate, goals progressing, family engagement strong'
                      }
                    />
                    <Badge variant="secondary" className="ml-auto bg-green-100 text-green-700 border-green-200 text-[10px] sm:text-xs">
                      <Activity className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                      Live
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 sm:px-6">
                  <ScrollArea className="h-[350px] sm:h-[500px] pr-2 sm:pr-4">
                    <div className="space-y-3 sm:space-y-4">
                      {messages.map((msg, index) => {
                        const member = getMemberById(msg.senderId);
                        const isRecovering = member?.role === 'recovering';
                        const isDad = selectedFamily === 'davis' && msg.senderId === '1';
                        const isSystemMessage = msg.content.includes('**Financial Request**') || msg.content.includes('**Checked into');
                        
                        return (
                          <div 
                            key={msg.id} 
                            className="flex gap-2 sm:gap-3 animate-fade-in"
                            style={{ animationDelay: `${index * 30}ms` }}
                          >
                            <Avatar 
                              className={`h-7 w-7 sm:h-9 sm:w-9 ring-2 ring-offset-1 sm:ring-offset-2 shrink-0 ${
                                isRecovering ? 'ring-primary' : 
                                isDad && selectedFamily === 'davis' ? 'ring-amber-500' :
                                'ring-muted'
                              }`}
                            >
                              <AvatarFallback 
                                className={`text-[10px] sm:text-xs font-medium ${
                                  isRecovering ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground' :
                                  isDad && selectedFamily === 'davis' ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white' :
                                  'bg-muted'
                                }`}
                              >
                                {msg.sender.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                                <span className={`font-semibold text-xs sm:text-sm ${isRecovering ? 'text-primary' : 'text-foreground'} truncate`}>
                                  {msg.sender}
                                </span>
                                {isRecovering && (
                                  <Badge variant="outline" className="text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0 border-primary/30 text-primary">
                                    Recovering
                                  </Badge>
                                )}
                                {isDad && selectedFamily === 'davis' && (
                                  <Badge variant="outline" className="text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0 border-amber-500/30 text-amber-600 bg-amber-50 hidden sm:flex">
                                    <AlertTriangle className="h-2 w-2 mr-0.5" />
                                    Enabling Risk
                                  </Badge>
                                )}
                                <span className="text-[10px] sm:text-xs text-muted-foreground">{msg.time}</span>
                              </div>
                              <div 
                                className={`mt-1 sm:mt-1.5 rounded-2xl rounded-tl-sm px-2.5 sm:px-4 py-1.5 sm:py-2.5 inline-block max-w-full sm:max-w-[90%] ${
                                  isSystemMessage 
                                    ? 'border shadow-sm bg-primary/10 border-primary/20' 
                                    : isRecovering 
                                      ? 'bg-gradient-to-br from-primary to-primary/90 text-white shadow-md'
                                      : isDad && selectedFamily === 'davis'
                                        ? 'bg-amber-50 border border-amber-200'
                                        : 'bg-muted/70'
                                }`}
                              >
                                <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                  
                  <div className="flex gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border/50">
                    <Input 
                      placeholder="Type a message..." 
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="border-muted-foreground/20 focus:border-primary focus:ring-primary/20 text-sm"
                    />
                    <Button 
                      onClick={handleSendMessage}
                      size="sm"
                      className="shadow-md hover-lift bg-gradient-to-r from-primary to-primary/90 px-3 sm:px-4"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Financial Tab */}
            <TabsContent value="financial" className="animate-fade-in">
              {/* Financial Summary */}
              <Card className="mb-4 sm:mb-6 border-0 shadow-lg overflow-hidden">
                <div className={`h-1 ${selectedFamily === 'davis' ? 'bg-gradient-to-r from-red-500 via-orange-500 to-amber-500' : 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500'}`} />
                <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
                    <div className="text-center p-2 sm:p-4 bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl border border-border/50">
                      <p className="text-[10px] sm:text-sm text-muted-foreground mb-0.5 sm:mb-1">Total Requested</p>
                      <p className="text-lg sm:text-2xl font-bold text-foreground">
                        ${currentFamily.financialRequests.reduce((sum, r) => sum + r.amount, 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="text-center p-2 sm:p-4 bg-gradient-to-br from-green-50 to-emerald-50/50 rounded-xl border border-green-200">
                      <p className="text-[10px] sm:text-sm text-green-700 mb-0.5 sm:mb-1">Total Funded</p>
                      <p className="text-lg sm:text-2xl font-bold text-green-600">
                        ${currentFamily.financialRequests.filter(r => r.status === 'approved' || r.status === 'completed').reduce((sum, r) => sum + r.amount, 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="text-center p-2 sm:p-4 bg-gradient-to-br from-amber-50 to-yellow-50/50 rounded-xl border border-amber-200">
                      <p className="text-[10px] sm:text-sm text-amber-700 mb-0.5 sm:mb-1">Pending</p>
                      <p className="text-lg sm:text-2xl font-bold text-amber-600">
                        {currentFamily.financialRequests.filter(r => r.status === 'pending').length}
                      </p>
                      <p className="text-[10px] sm:text-xs text-amber-600">requests</p>
                    </div>
                    <div className="text-center p-2 sm:p-4 bg-gradient-to-br from-red-50 to-orange-50/50 rounded-xl border border-red-200">
                      <p className="text-[10px] sm:text-sm text-red-700 mb-0.5 sm:mb-1">Denied</p>
                      <p className="text-lg sm:text-2xl font-bold text-red-600">
                        {currentFamily.financialRequests.filter(r => r.status === 'denied').length}
                      </p>
                      <p className="text-[10px] sm:text-xs text-red-600">requests</p>
                    </div>
                  </div>
                </CardContent>
              </Card>


              <div className="space-y-2">
                {currentFamily.financialRequests.map((request, index) => {
                  const isCompleted = request.status === 'approved' || request.status === 'completed';
                  
                  const RequestContent = () => (
                    <>
                      <p className="mt-3 text-sm bg-muted/50 p-3 rounded-lg">{request.reason}</p>

                      {/* Bill/Receipt Attachment */}
                      {request.attachmentUrl && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                            <Paperclip className="h-3 w-3" />
                            Attached Bill/Receipt
                          </p>
                          <Dialog>
                            <DialogTrigger asChild>
                              <button className="group relative overflow-hidden rounded-lg border border-border hover:border-primary/50 transition-all">
                                <img 
                                  src={request.attachmentUrl} 
                                  alt={request.attachmentCaption || 'Bill attachment'} 
                                  className="w-full max-w-[200px] h-auto object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                  <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                                </div>
                              </button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <FileText className="h-5 w-5" />
                                  Bill/Receipt for ${request.amount.toFixed(2)}
                                </DialogTitle>
                              </DialogHeader>
                              <div className="mt-4">
                                <img 
                                  src={request.attachmentUrl} 
                                  alt={request.attachmentCaption || 'Bill attachment'} 
                                  className="w-full h-auto rounded-lg border border-border"
                                />
                                {request.attachmentCaption && (
                                  <p className="text-sm text-muted-foreground mt-3 text-center">
                                    {request.attachmentCaption}
                                  </p>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                      
                      {/* Votes */}
                      <div className="mt-3 flex items-center gap-4">
                        <div className="flex items-center gap-1 text-sm">
                          <ThumbsUp className="h-4 w-4 text-green-600" />
                          <span className="text-green-600 font-medium">{request.votes.approve}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <ThumbsDown className="h-4 w-4 text-red-600" />
                          <span className="text-red-600 font-medium">{request.votes.deny}</span>
                        </div>
                        {request.voterDetails && (
                          <div className="flex items-center gap-1 ml-auto">
                            {request.voterDetails.map((voter, i) => (
                              <Badge 
                                key={i}
                                variant="outline" 
                                className={`text-[10px] ${
                                  voter.approved 
                                    ? 'bg-green-50 border-green-200 text-green-700' 
                                    : 'bg-red-50 border-red-200 text-red-700'
                                }`}
                              >
                                {voter.approved ? <ThumbsUp className="h-2 w-2 mr-1" /> : <ThumbsDown className="h-2 w-2 mr-1" />}
                                {voter.name.split(' ')[0]}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Denial Reasons */}
                      {request.denialReasons && request.denialReasons.length > 0 && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-xs font-medium text-red-700 mb-2">Denial Reasons:</p>
                          <ul className="space-y-1">
                            {request.denialReasons.map((reason, i) => (
                              <li key={i} className="text-xs text-red-600 flex items-start gap-2">
                                <X className="h-3 w-3 mt-0.5 shrink-0" />
                                {reason}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Pledges */}
                      {request.pledges && request.pledges.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {request.pledges.map((pledge, i) => (
                            <Badge key={i} variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                              <DollarSign className="h-3 w-3 mr-1" />
                              {pledge.name}: ${pledge.amount}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </>
                  );
                  
                  return (
                    <div 
                      key={request.id} 
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {isCompleted ? (
                        <Collapsible>
                          <Card className="overflow-hidden border-green-200 bg-green-50/30">
                            <CollapsibleTrigger asChild>
                              <CardContent className="p-4 cursor-pointer hover:bg-green-50/50 transition-colors">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10 ring-2 ring-green-300">
                                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                        {recoveringMember?.initials || 'U'}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-medium">{request.requester}</p>
                                      <p className="text-sm text-muted-foreground">{request.createdAt}</p>
                                    </div>
                                  </div>
                                  <div className="text-right flex items-center gap-2">
                                    <div>
                                      <p className="text-xl font-bold">${request.amount.toFixed(2)}</p>
                                      <Badge className="bg-green-100 text-green-700 border-green-200">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        {request.status}
                                      </Badge>
                                    </div>
                                    <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                                  </div>
                                </div>
                              </CardContent>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <CardContent className="pt-0 pb-4 px-4 border-t border-green-200">
                                <RequestContent />
                              </CardContent>
                            </CollapsibleContent>
                          </Card>
                        </Collapsible>
                      ) : (
                        <Card className={`overflow-hidden ${
                          request.status === 'denied' ? 'border-red-200 bg-red-50/30' : ''
                        }`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <Avatar className={`h-10 w-10 ring-2 ${request.status === 'denied' ? 'ring-red-300' : 'ring-primary/30'}`}>
                                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                    {recoveringMember?.initials || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{request.requester}</p>
                                  <p className="text-sm text-muted-foreground">{request.createdAt}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-bold">${request.amount.toFixed(2)}</p>
                                <Badge 
                                  variant={request.status === 'denied' ? 'destructive' : 'secondary'}
                                  className={
                                    request.status === 'denied' ? 'bg-red-100 text-red-700 border-red-200' : ''
                                  }
                                >
                                  {request.status === 'denied' && <XCircle className="h-3 w-3 mr-1" />}
                                  {request.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                                  {request.status}
                                </Badge>
                              </div>
                            </div>
                            <RequestContent />
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            {/* Check-in Tab */}
            <TabsContent value="checkin" className="animate-fade-in">
              <div className="space-y-4">
                {selectedFamily === 'davis' && (
                  <Card className="border-red-200 bg-red-50/50">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                          <XCircle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-red-800">Check-in Compliance: Critical</h4>
                          <p className="text-sm text-red-700 mt-1">
                            Ashley has not completed a full meeting check-in in <strong>3 weeks</strong>. 
                            Last attempt showed departure after 15 minutes. This violates the boundary requiring 3+ meetings per week.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Location Capture Card */}
                <Card className="border-0 shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300">
                  <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
                  <CardHeader className="pb-3 bg-gradient-to-b from-muted/30 to-transparent">
                    <CardTitle className="flex items-center gap-2 font-display text-lg">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                        <MapPin className="h-4 w-4 text-emerald-600" />
                      </div>
                      Capture My Location
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Capture your current location to use for meeting check-ins or location requests.
                    </p>
                    <Button variant="outline" className="w-full" disabled>
                      <MapPin className="h-4 w-4 mr-2" />
                      Get Current Location
                    </Button>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      (Demo mode - location capture disabled)
                    </p>
                  </CardContent>
                </Card>

                {/* Meeting Finder - Collapsible */}
                <Collapsible>
                  <Card className="border-0 shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300">
                    <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                    <CollapsibleTrigger asChild>
                      <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
                        <CardTitle className="flex items-center justify-between font-display text-lg">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                              <Search className="h-4 w-4 text-blue-500" />
                            </div>
                            Find a Meeting
                          </div>
                          <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Search for AA, Al-Anon, and other recovery meetings near you.
                        </p>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          <Input placeholder="Enter your zip code or city" disabled />
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled>AA</Button>
                            <Button variant="outline" size="sm" disabled>Al-Anon</Button>
                            <Button variant="outline" size="sm" disabled>NA</Button>
                            <Button variant="outline" size="sm" disabled>Other</Button>
                          </div>
                          <p className="text-xs text-muted-foreground text-center">
                            (Demo mode - meeting search disabled)
                          </p>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* Location Check-in Request Card (for family members) */}
                <Card className="border-0 shadow-lg overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 font-display text-lg">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                        <MapPin className="h-4 w-4 text-amber-600" />
                      </div>
                      Request Location Check-in
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Request a family member to share their current location.
                    </p>
                    <div className="space-y-2">
                      <Select disabled>
                        <SelectTrigger>
                          <SelectValue placeholder="Select family member" />
                        </SelectTrigger>
                      </Select>
                      <Button className="w-full" disabled>
                        Send Location Request
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">
                        (Demo mode - requests disabled)
                      </p>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Check-In - Collapsible */}
                <Collapsible defaultOpen>
                  <Card className="border-0 shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300">
                    <div className="h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />
                    <CollapsibleTrigger asChild>
                      <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors bg-gradient-to-b from-muted/30 to-transparent">
                        <CardTitle className="flex items-center justify-between font-display text-lg">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
                              <CheckCircle className="h-4 w-4 text-violet-600" />
                            </div>
                            Check-In
                          </div>
                          <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Check in at your meeting or appointment to let your family know where you are.
                        </p>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        {/* Tabbed Check-in Demo */}
                        <Tabs defaultValue="meeting" className="w-full">
                          <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="meeting">Meeting</TabsTrigger>
                            <TabsTrigger value="appointment">Appointment</TabsTrigger>
                          </TabsList>
                          <TabsContent value="meeting" className="space-y-3">
                            <Select disabled>
                              <SelectTrigger>
                                <SelectValue placeholder="Select meeting type (AA, NA, Al-Anon...)" />
                              </SelectTrigger>
                            </Select>
                            <Input placeholder="Meeting name (optional)" disabled />
                            <Button className="w-full" disabled>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Check In to Meeting
                            </Button>
                          </TabsContent>
                          <TabsContent value="appointment" className="space-y-3">
                            <Select disabled>
                              <SelectTrigger>
                                <SelectValue placeholder="Select appointment type" />
                              </SelectTrigger>
                            </Select>
                            <Input placeholder="Appointment details (optional)" disabled />
                            <Button className="w-full" disabled>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Check In to Appointment
                            </Button>
                          </TabsContent>
                        </Tabs>
                        <p className="text-xs text-muted-foreground text-center mt-3">
                          (Demo mode - check-ins disabled)
                        </p>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* Meeting Checkout Card (shows when there's a pending checkout) */}
                {currentFamily.checkins.some(c => c.status === 'active') && (
                  <Card className="border-0 shadow-lg overflow-hidden border-l-4 border-l-amber-500">
                    <div className="h-1 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600" />
                    <CardHeader className="pb-3 bg-gradient-to-b from-amber-50/50 to-transparent dark:from-amber-950/20">
                      <CardTitle className="flex items-center gap-2 font-display text-lg">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center">
                          <Clock className="h-4 w-4 text-amber-600" />
                        </div>
                        Pending Checkout
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 mb-3">
                        <p className="text-sm font-medium">AA Meeting - Downtown Community Center</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Checked in at 7:00 PM • Due by 9:00 PM
                        </p>
                      </div>
                      <Button className="w-full" variant="outline" disabled>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Check Out Now
                      </Button>
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        (Demo mode - checkout disabled)
                      </p>
                    </CardContent>
                  </Card>
                )}
                
                {/* Check-in History */}
                <Card className="border-0 shadow-lg overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-slate-400 via-gray-500 to-slate-600" />
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-display">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      Recent Check-ins
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {currentFamily.checkins.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No check-ins recorded</p>
                    ) : (
                      <div className="space-y-3">
                        {currentFamily.checkins.map((checkin) => (
                          <div key={checkin.id} className={`p-4 rounded-lg border ${
                            checkin.status === 'incomplete' 
                              ? 'bg-red-50 border-red-200' 
                              : checkin.status === 'active'
                                ? 'bg-blue-50 border-blue-200'
                                : 'bg-green-50 border-green-200'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Badge variant={checkin.status === 'incomplete' ? 'destructive' : 'secondary'}>
                                  {checkin.type}
                                </Badge>
                                <span className="font-medium">{checkin.name}</span>
                              </div>
                              <Badge 
                                variant={
                                  checkin.status === 'incomplete' ? 'destructive' :
                                  checkin.status === 'active' ? 'default' : 'secondary'
                                }
                              >
                                {checkin.status === 'incomplete' && <AlertTriangle className="h-3 w-3 mr-1" />}
                                {checkin.status}
                              </Badge>
                            </div>
                            <div className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
                              <MapPin className="h-3 w-3" />
                              {checkin.location}
                            </div>
                            <div className="mt-1 text-sm text-muted-foreground flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              Check-in: {checkin.checkinTime}
                              {checkin.checkoutTime && ` • Check-out: ${checkin.checkoutTime}`}
                              {checkin.checkoutDue && ` • Due: ${checkin.checkoutDue}`}
                            </div>
                            {checkin.notes && (
                              <p className="mt-2 text-sm text-red-600 font-medium">
                                Note: {checkin.notes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Values Tab */}
            <TabsContent value="values" className="animate-fade-in">
              <Card className="border-0 shadow-lg overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-pink-500 via-rose-500 to-red-500" />
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-md">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    Family Values & Goals
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Instructional Text for Goals */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30 border border-pink-200/50 dark:border-pink-800/50">
                    <p className="text-sm text-muted-foreground">
                      Select two of the goals from the list below or create custom goals for your family. Make sure the goals you create are measurable and have a path to achievement. If you need help, consult your moderator.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-medium">Guiding Values</h3>
                    <div className="flex flex-wrap gap-2">
                      {currentFamily.values.map((value) => (
                        <Badge key={value.key} className="bg-pink-100 text-pink-700 border-pink-200 px-3 py-1.5">
                          <Sparkles className="h-3 w-3 mr-1" />
                          {value.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="font-medium">Common Goals</h3>
                    {currentFamily.commonGoals.map((goal) => (
                      <div 
                        key={goal.key}
                        className={`p-3 rounded-lg border flex items-center justify-between ${
                          goal.warning ? 'bg-amber-50 border-amber-200' : 'bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Target className={`h-4 w-4 ${goal.warning ? 'text-amber-600' : 'text-primary'}`} />
                          <span className="font-medium text-sm">{goal.name}</span>
                        </div>
                        {goal.warning ? (
                          <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-700">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {goal.warning}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">In Progress</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Boundaries Tab */}
            <TabsContent value="boundaries" className="animate-fade-in">
              <Card className="border-0 shadow-lg overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500" />
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center shadow-md">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    Family Boundaries
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Instructional Text */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-200/50 dark:border-indigo-800/50 space-y-3">
                    <p className="text-sm text-foreground">
                      <strong>Boundaries are essential</strong> to the health and stability of your family system. They should be rooted in the values that your family and each individual holds dear—never created out of anger.
                    </p>
                    <p className="text-sm text-foreground">
                      When considering a boundary, ask yourself two fundamental questions:
                    </p>
                    <ol className="text-sm text-foreground list-decimal list-inside space-y-1 pl-2">
                      <li><strong>Have I enabled my loved one's addiction in any way?</strong> (Financially, Emotionally, or Silently)</li>
                      <li><strong>Has my loved one's addiction caused me harm in any way?</strong></li>
                    </ol>
                    <p className="text-sm text-foreground">
                      If the answer to either (or both) of these questions is yes, consider what changes <em>you</em> need to make in YOUR behavior to avoid enabling going forward and to eliminate the harm you've experienced because of the addiction.
                    </p>
                    <p className="text-sm text-muted-foreground italic">
                      All boundaries will be reviewed by the moderator or family admin before they need to be acknowledged by the group.
                    </p>
                  </div>

                  {currentFamily.boundaries.map((boundary) => (
                    <div 
                      key={boundary.id}
                      className={`p-4 rounded-lg border ${
                        boundary.status === 'approved' 
                          ? boundary.notAcknowledged?.length 
                            ? 'bg-amber-50/50 border-amber-200' 
                            : 'bg-green-50/50 border-green-200'
                          : 'bg-muted/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-sm font-medium">{boundary.content}</p>
                        <Badge variant={boundary.status === 'approved' ? 'default' : 'secondary'}>
                          {boundary.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Created by {boundary.createdBy}</p>
                      
                      {boundary.acknowledgments.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-muted-foreground mb-1">Acknowledged:</p>
                          <div className="flex flex-wrap gap-1">
                            {boundary.acknowledgments.map((name, i) => (
                              <Badge key={i} variant="outline" className="text-[10px] bg-green-50 border-green-200 text-green-700">
                                <Check className="h-2 w-2 mr-0.5" />
                                {name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {boundary.notAcknowledged && boundary.notAcknowledged.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-amber-600 mb-1">Not Acknowledged:</p>
                          <div className="flex flex-wrap gap-1">
                            {boundary.notAcknowledged.map((name, i) => (
                              <Badge key={i} variant="outline" className="text-[10px] bg-amber-50 border-amber-200 text-amber-700">
                                <AlertTriangle className="h-2 w-2 mr-0.5" />
                                {name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* FIIS Tab */}
            <TabsContent value="fiis" className="animate-fade-in">
              <div className="space-y-4">
                {/* Header Card */}
                <Card className="overflow-hidden">
                  <div className={`h-1 bg-gradient-to-r ${selectedFamily === 'johnson' ? 'from-green-500 via-emerald-500 to-teal-500' : 'from-violet-500 via-purple-500 to-fuchsia-500'}`} />
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <CardTitle className="flex flex-wrap items-center gap-2 text-base sm:text-lg">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${selectedFamily === 'johnson' ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20' : 'bg-gradient-to-br from-violet-500/20 to-purple-500/20'}`}>
                          <Brain className={`h-4 w-4 ${selectedFamily === 'johnson' ? 'text-green-600' : 'text-violet-600'}`} />
                        </div>
                        <span className="hidden sm:inline">Family Intervention Intelligence System</span>
                        <span className="sm:hidden">FIIS</span>
                        {selectedFamily === 'johnson' ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200 text-[10px] sm:text-xs">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Day 47
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-[10px] sm:text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Critical
                          </Badge>
                        )}
                      </CardTitle>
                      <Button
                        size="sm"
                        className={`w-full sm:w-auto ${selectedFamily === 'johnson' 
                          ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                          : "bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
                        }`}
                        onClick={() => toast.success('Demo: AI analysis would run here')}
                      >
                        <Sparkles className="h-4 w-4 mr-1" />
                        Analyze Patterns
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Log what you observe—wins and worries alike—in everyday language. FIIS combines your notes with check-ins, financial requests, and family activity to spot patterns and surface early warning signs.
                    </p>
                  </CardContent>
                </Card>

                {currentFamily.fiisAnalysis && (
                  <>
                    {/* Johnson Family: Positive Summary Header */}
                    {selectedFamily === 'johnson' && (
                      <Card className="border-green-200 bg-gradient-to-r from-green-50/50 to-emerald-50/50">
                        <CardContent className="pt-4 sm:pt-6">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                            <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                              <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                            </div>
                            <div>
                              <h3 className="text-base sm:text-lg font-semibold text-green-800">Recovery Stability Emerging</h3>
                              <p className="text-xs sm:text-sm text-green-700 mt-1">
                                Michael has reached <strong>47 days sober</strong> with consistent meeting attendance and family support. 
                                The 30-90 day window is critical for establishing lasting patterns - the Johnson family is navigating it well.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Davis Family: Risk Alerts */}
                    {selectedFamily === 'davis' && 'risk_alerts' in currentFamily.fiisAnalysis && (
                      <div className="space-y-3">
                        {(currentFamily.fiisAnalysis as typeof DAVIS_FIIS_ANALYSIS).risk_alerts.map((alert, i) => (
                          <Card 
                            key={i}
                            className={`border-2 ${
                              alert.level === 'critical' ? 'border-red-300 bg-red-50' :
                              alert.level === 'high' ? 'border-orange-300 bg-orange-50' :
                              'border-amber-300 bg-amber-50'
                            }`}
                          >
                            <CardContent className="pt-4">
                              <div className="flex items-start gap-4">
                                <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
                                  alert.level === 'critical' ? 'bg-red-200' :
                                  alert.level === 'high' ? 'bg-orange-200' :
                                  'bg-amber-200'
                                }`}>
                                  <AlertTriangle className={`h-6 w-6 ${
                                    alert.level === 'critical' ? 'text-red-600' :
                                    alert.level === 'high' ? 'text-orange-600' :
                                    'text-amber-600'
                                  }`} />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant={alert.level === 'critical' ? 'destructive' : 'secondary'} className={
                                      alert.level === 'critical' ? '' :
                                      alert.level === 'high' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                      'bg-amber-100 text-amber-700 border-amber-200'
                                    }>
                                      {alert.level.toUpperCase()}
                                    </Badge>
                                    <span className="font-semibold text-foreground">{alert.person}</span>
                                  </div>
                                  <h4 className={`font-medium ${
                                    alert.level === 'critical' ? 'text-red-800' :
                                    alert.level === 'high' ? 'text-orange-800' :
                                    'text-amber-800'
                                  }`}>{alert.issue}</h4>
                                  <p className={`text-sm mt-2 ${
                                    alert.level === 'critical' ? 'text-red-700' :
                                    alert.level === 'high' ? 'text-orange-700' :
                                    'text-amber-700'
                                  }`}>{alert.details}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}

                    {/* Johnson Family: Strengths */}
                    {selectedFamily === 'johnson' && 'strengths' in currentFamily.fiisAnalysis && (
                      <Card className="border-green-200">
                        <CardHeader className="pb-2 sm:pb-4">
                          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            What's Working Well
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                            {(currentFamily.fiisAnalysis as typeof JOHNSON_FIIS_ANALYSIS).strengths.map((strength, i) => (
                              <div key={i} className="p-2 sm:p-3 rounded-lg border border-green-200 bg-green-50/50">
                                <div className="flex items-center gap-2 mb-1">
                                  <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 shrink-0" />
                                  <span className="font-medium text-xs sm:text-sm text-green-800">{strength.area}</span>
                                </div>
                                <p className="text-xs sm:text-sm text-green-700">{strength.detail}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* What I'm Seeing */}
                    <Card>
                      <CardHeader className="pb-2 sm:pb-4">
                        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                          <Eye className={`h-4 w-4 ${selectedFamily === 'johnson' ? 'text-green-600' : 'text-violet-600'}`} />
                          What I'm Seeing
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs sm:text-sm">{currentFamily.fiisAnalysis.what_seeing}</p>
                      </CardContent>
                    </Card>

                    {/* Pattern Signals */}
                    <Card>
                      <CardHeader className="pb-2 sm:pb-4">
                        <CardTitle className="text-sm sm:text-base">Pattern Signals</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 sm:space-y-3">
                          {currentFamily.fiisAnalysis.pattern_signals.map((signal, i) => {
                            const colors: Record<string, string> = {
                              escalation: 'bg-red-100 text-red-700 border-red-200',
                              enabling: 'bg-amber-100 text-amber-700 border-amber-200',
                              manipulation: 'bg-purple-100 text-purple-700 border-purple-200',
                              regression: 'bg-red-100 text-red-700 border-red-200',
                              boundary_violation: 'bg-orange-100 text-orange-700 border-orange-200',
                              progress: 'bg-green-100 text-green-700 border-green-200',
                              family_unity: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                              healthy_communication: 'bg-teal-100 text-teal-700 border-teal-200',
                              accountability_working: 'bg-blue-100 text-blue-700 border-blue-200',
                              attention_needed: 'bg-amber-100 text-amber-700 border-amber-200',
                            };
                            const icons: Record<string, typeof TrendingUp> = {
                              escalation: TrendingUp,
                              enabling: AlertTriangle,
                              manipulation: AlertCircle,
                              regression: TrendingDown,
                              boundary_violation: Shield,
                              progress: TrendingUp,
                              family_unity: Users,
                              healthy_communication: MessageCircle,
                              accountability_working: CheckCircle,
                              attention_needed: AlertCircle,
                            };
                            const Icon = icons[signal.signal_type] || Activity;
                            
                            return (
                              <div key={i} className={`p-2 sm:p-3 rounded-lg border ${colors[signal.signal_type] || 'bg-muted'}`}>
                                <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1">
                                  <Icon className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                                  <span className="font-medium text-xs sm:text-sm capitalize">{signal.signal_type.replace(/_/g, ' ')}</span>
                                  <Badge variant="outline" className="text-[8px] sm:text-[10px] ml-auto">{signal.confidence}</Badge>
                                </div>
                                <p className="text-xs sm:text-sm">{signal.description}</p>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Johnson Family: Recommendations with Values/Goals/Boundaries Integration */}
                    {selectedFamily === 'johnson' && 'recommendations' in currentFamily.fiisAnalysis && (
                      <Card className="border-blue-200">
                        <CardHeader className="pb-2 sm:pb-4">
                          <CardTitle className="text-sm sm:text-base flex flex-wrap items-center gap-2">
                            <Target className="h-4 w-4 text-blue-600 shrink-0" />
                            <span>Recommendations</span>
                            <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-blue-200 text-[8px] sm:text-[10px]">
                              Aligned with Your Values & Goals
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3 sm:space-y-4">
                            {(currentFamily.fiisAnalysis as typeof JOHNSON_FIIS_ANALYSIS).recommendations.map((rec, i) => (
                              <div key={i} className={`p-3 sm:p-4 rounded-lg border ${
                                rec.title.includes('Meeting Check-In') 
                                  ? 'border-amber-300 bg-amber-50' 
                                  : 'border-blue-200 bg-blue-50/50'
                              }`}>
                                <div className="flex items-start gap-2 sm:gap-3">
                                  {rec.title.includes('Meeting Check-In') ? (
                                    <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-lg bg-amber-200 flex items-center justify-center shrink-0">
                                      <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-amber-700" />
                                    </div>
                                  ) : (
                                    <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-lg bg-blue-200 flex items-center justify-center shrink-0">
                                      <Target className="h-3 w-3 sm:h-4 sm:w-4 text-blue-700" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <h4 className={`font-medium text-xs sm:text-sm ${rec.title.includes('Meeting Check-In') ? 'text-amber-800' : 'text-blue-800'}`}>
                                      {rec.title}
                                    </h4>
                                    <p className={`text-xs sm:text-sm mt-1 ${rec.title.includes('Meeting Check-In') ? 'text-amber-700' : 'text-blue-700'}`}>
                                      {rec.description}
                                    </p>
                                    <Badge variant="outline" className={`mt-2 text-[8px] sm:text-[10px] ${
                                      rec.title.includes('Meeting Check-In') 
                                        ? 'bg-amber-100 border-amber-300 text-amber-700' 
                                        : 'bg-blue-100 border-blue-300 text-blue-700'
                                    }`}>
                                      {rec.related_to}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Context */}
                    <Card>
                      <CardHeader className="pb-2 sm:pb-4">
                        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                          <RefreshCw className={`h-4 w-4 ${selectedFamily === 'johnson' ? 'text-green-600' : 'text-violet-600'}`} />
                          Context & Framing
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs sm:text-sm">{currentFamily.fiisAnalysis.contextual_framing}</p>
                      </CardContent>
                    </Card>

                    {/* Questions & Watch Items */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      <Card>
                        <CardHeader className="pb-2 sm:pb-4">
                          <CardTitle className="text-sm sm:text-base">Questions to Consider</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {currentFamily.fiisAnalysis.clarifying_questions.map((q, i) => (
                              <li key={i} className="text-xs sm:text-sm flex items-start gap-2">
                                <span className={`font-bold shrink-0 ${selectedFamily === 'johnson' ? 'text-green-600' : 'text-violet-600'}`}>?</span>
                                <span>{q}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2 sm:pb-4">
                          <CardTitle className="text-sm sm:text-base">What to Watch</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {currentFamily.fiisAnalysis.what_to_watch.map((w, i) => (
                              <li key={i} className="text-xs sm:text-sm flex items-start gap-2">
                                <Eye className={`h-3 w-3 sm:h-4 sm:w-4 shrink-0 mt-0.5 ${selectedFamily === 'johnson' ? 'text-emerald-600' : 'text-amber-600'}`} />
                                <span>{w}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>

            {/* Tests Tab */}
            <TabsContent value="test-results" className="animate-fade-in">
              <Card className="border-0 shadow-lg overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md">
                      <FlaskConical className="h-5 w-5 text-white" />
                    </div>
                    Drug & Alcohol Testing
                    <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-700">Coming Soon</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <FlaskConical className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Lab-Verified Testing Coming Soon</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Random testing schedules, instant notifications, and lab-verified results will be available to families.
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => toast.info("Thanks for your interest! We'll notify you when testing launches.")}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Notify Me When Available
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        </div>
      </div>

      {/* Member Profile Dialog */}
      <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
        <DialogContent className="sm:max-w-md border-0 shadow-2xl">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/60 rounded-t-lg" />
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Member Profile
            </DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary/5 to-transparent rounded-xl">
                <Avatar className="h-16 w-16 ring-4 ring-primary/20 ring-offset-2">
                  <AvatarFallback className="text-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                    {selectedMember.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-bold text-foreground">{selectedMember.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedMember.relationship}</p>
                  <Badge variant="secondary" className="mt-2 bg-primary/10 text-primary border-primary/20">
                    {selectedMember.role}
                  </Badge>
                </div>
              </div>

              {selectedMember.paymentInfo && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Payment Methods
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded bg-blue-600 flex items-center justify-center text-white text-xs font-bold">PP</div>
                        <div>
                          <p className="text-sm font-medium">PayPal</p>
                          <p className="text-xs text-muted-foreground">{selectedMember.paymentInfo.paypal}</p>
                        </div>
                      </div>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        <Send className="h-3 w-3 mr-1" />
                        Send
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-sky-50 rounded-lg border border-sky-200">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded bg-sky-500 flex items-center justify-center text-white text-xs font-bold">V</div>
                        <div>
                          <p className="text-sm font-medium">Venmo</p>
                          <p className="text-xs text-muted-foreground">{selectedMember.paymentInfo.venmo}</p>
                        </div>
                      </div>
                      <Button size="sm" className="bg-sky-500 hover:bg-sky-600">
                        <Send className="h-3 w-3 mr-1" />
                        Send
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded bg-green-600 flex items-center justify-center text-white text-xs font-bold">$</div>
                        <div>
                          <p className="text-sm font-medium">Cash App</p>
                          <p className="text-xs text-muted-foreground">{selectedMember.paymentInfo.cashapp}</p>
                        </div>
                      </div>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        <Send className="h-3 w-3 mr-1" />
                        Send
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Members List Dialog */}
      <Dialog open={showMembersList} onOpenChange={setShowMembersList}>
        <DialogContent className="sm:max-w-md border-0 shadow-2xl max-h-[80vh] overflow-auto">
          <div className={`absolute inset-x-0 top-0 h-1 ${selectedFamily === 'davis' ? 'bg-gradient-to-r from-destructive via-destructive/80 to-destructive/60' : 'bg-gradient-to-r from-primary via-primary/80 to-primary/60'} rounded-t-lg`} />
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <img src={familyBridgeLogo} alt="FamilyBridge" className="h-5 w-5 object-contain" />
              Family Members
              <Badge variant="secondary" className="ml-auto bg-primary/10 text-primary">
                {currentFamily.members.length} Members
              </Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {currentFamily.members.map((member, index) => {
              const isEnabling = selectedFamily === 'davis' && member.id === '1';
              
              return (
                <div 
                  key={member.id}
                  className={`flex items-center justify-between p-3 rounded-xl border border-border/50 transition-all duration-300 animate-fade-in ${
                    member.paymentInfo 
                      ? 'cursor-pointer hover:shadow-md hover:border-primary/30 hover:bg-primary/5' 
                      : isEnabling 
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-muted/30'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => {
                    if (member.paymentInfo) {
                      setShowMembersList(false);
                      setSelectedMember(member);
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className={`h-10 w-10 ring-2 ring-offset-1 ${
                      member.role === 'recovering' ? 'ring-primary' : 
                      member.role === 'moderator' ? 'ring-orange-500' : 
                      isEnabling ? 'ring-amber-500' :
                      'ring-muted'
                    }`}>
                      <AvatarFallback className={`text-xs font-medium ${
                        member.role === 'recovering' ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground' :
                        member.role === 'moderator' ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white' :
                        isEnabling ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white' :
                        'bg-muted'
                      }`}>
                        {member.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm text-foreground">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.relationship}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {isEnabling && (
                      <Badge variant="outline" className="text-[10px] bg-amber-50 border-amber-200 text-amber-700">
                        <AlertTriangle className="h-2 w-2 mr-0.5" />
                        Enabling
                      </Badge>
                    )}
                    <Badge 
                      variant={
                        member.role === 'moderator' ? 'default' : 
                        member.role === 'recovering' ? 'secondary' : 
                        'outline'
                      }
                      className={`text-xs ${
                        member.role === 'moderator' ? 'bg-gradient-to-r from-orange-500 to-amber-500 border-0' :
                        member.role === 'recovering' ? 'bg-primary/10 text-primary border-primary/20' :
                        ''
                      }`}
                    >
                      {member.role}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DemoFamily;
