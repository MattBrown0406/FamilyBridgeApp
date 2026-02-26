import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { supabase } from '@/integrations/supabase/client';
import { fetchProfilesByIds } from '@/lib/profileApi';
import { filterContent } from '@/lib/contentFilter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, Send, Loader2, Users, DollarSign, 
  MessageCircle, AlertTriangle, Check, X, Shield, MapPin,
  ExternalLink, CreditCard, CheckCircle2, Paperclip, Image, HandCoins, Trash2, Pencil,
  Target, ShieldCheck, Plus, CheckCircle, MessageSquare, FlaskConical, ChevronDown, Sparkles,
  Brain, Search, Calendar, ChevronLeft, ChevronRight, Archive, Heart, Clock, TrendingUp, Camera, Upload,
  Flame, ClipboardList, Stethoscope, Copy, Mail, UserPlus, Pill, FolderOpen, PhoneCall
} from 'lucide-react';
import familyBridgeLogo from '@/assets/familybridge-logo.png';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ModeratorDisclaimer } from '@/components/ModeratorDisclaimer';
import { HIPAAReleasesViewer } from '@/components/HIPAAReleasesViewer';
import { Label } from '@/components/ui/label';
import { format, startOfWeek, endOfWeek, subWeeks, isWithinInterval, isSameWeek, formatDistanceToNow, startOfMonth, endOfMonth, subMonths, isSameMonth } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { NotificationBell } from '@/components/NotificationBell';
import { TabbedCheckin } from '@/components/TabbedCheckin';
import { MeetingCheckout } from '@/components/MeetingCheckout';
import { CheckinHistory } from '@/components/CheckinHistory';
import { LocationCheckinRequest } from '@/components/LocationCheckinRequest';
import { LocationCheckinResponse } from '@/components/LocationCheckinResponse';
import { LocationCapture, LocationData } from '@/components/LocationCapture';
import { PrivateMessagingV2 } from '@/components/PrivateMessagingV2';
import { ConversationStarters } from '@/components/ConversationStarters';
import { TemporaryModeratorRequest } from '@/components/TemporaryModeratorRequest';
import { FIISTab } from '@/components/FIISTab';
import { MeetingFinder } from '@/components/MeetingFinder';
import { BillReceiptCapture } from '@/components/BillReceiptCapture';
import { useFIISNotifications } from '@/hooks/useFIISNotifications';
import { FamilyHealthBadge } from '@/components/FamilyHealthBadge';
import { LiquorLicenseWarnings } from '@/components/LiquorLicenseWarnings';
import { SobrietyCounter } from '@/components/SobrietyCounter';
import { useFamilyMemberJourney } from '@/hooks/useSobrietyJourney';
import { CommunicationHelper } from '@/components/CommunicationHelper';
import { DailyEmotionalCheckin } from '@/components/DailyEmotionalCheckin';
import { EmotionalToneIndicator } from '@/components/EmotionalToneIndicator';
import { AdminBreadcrumbs } from '@/components/AdminBreadcrumbs';
import { AftercarePlanTab } from '@/components/AftercarePlanTab';
import { MedicationTab } from '@/components/MedicationTab';
import { FamilyDocumentsTab } from '@/components/FamilyDocumentsTab';
import { CoachingTab } from '@/components/CoachingTab';

const REQUEST_REASONS = [
  'Electric',
  'Water',
  'Garbage',
  'Natural Gas',
  'Internet',
  'Phone',
  'Gas',
  'Food',
  'Rent',
  'Medical',
  'Other',
] as const;

interface Message {
  id: string;
  content: string;
  sender_id: string;
  was_filtered: boolean;
  created_at: string;
  sender_name?: string;
}

interface Member {
  id: string;
  user_id: string;
  role: string;
  full_name: string;
  paypal_username?: string | null;
  venmo_username?: string | null;
  cashapp_username?: string | null;
  private_messaging_enabled?: boolean;
}

interface FinancialPledge {
  id: string;
  user_id: string;
  amount: number;
  payment_method?: string | null;
  created_at: string;
  user_name?: string;
}

interface FinancialRequest {
  id: string;
  amount: number;
  reason: string;
  status: string;
  requester_id: string;
  requester_name?: string;
  created_at: string;
  votes: { approved: boolean; voter_id: string }[];
  pledges: FinancialPledge[];
  paid_at?: string | null;
  paid_by_user_id?: string | null;
  payment_method?: string | null;
  payment_confirmed_at?: string | null;
  payment_confirmed_by_user_id?: string | null;
  attachment_url?: string | null;
  resolved_at?: string | null;
}

interface PaymentLinks {
  paypal_link: string | null;
  venmo_link: string | null;
  cashapp_link: string | null;
  token_used?: boolean; // Track if this was fetched via one-time token
}

interface Family {
  id: string;
  name: string;
  description: string | null;
  organization_id: string | null;
  avatar_url: string | null;
}


interface FamilyBoundary {
  id: string;
  family_id: string;
  created_by: string;
  creator_name?: string;
  target_user_id: string | null;
  target_name?: string;
  content: string;
  consequence: string | null;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  rejected_reason: string | null;
  created_at: string;
  acknowledgments: { user_id: string; user_name?: string; acknowledged_at: string }[];
}

interface FamilyValue {
  id: string;
  family_id: string;
  value_key: string;
  created_at: string;
  selected_by: string;
}

interface FamilyCommonGoal {
  id: string;
  family_id: string;
  goal_key: string;
  completed_at: string | null;
  created_at: string;
  selected_by: string;
}

const COMMON_GOALS_OPTIONS = [
  { 
    key: 'complete_intervention', 
    name: 'Complete Family Intervention', 
    description: 'Successfully hold an intervention with professional guidance and express love and concern.',
    phase: 'Pre-Treatment',
    milestone: '0 days'
  },
  { 
    key: 'enter_treatment', 
    name: 'Enter Treatment Program', 
    description: 'Recovering member enters an appropriate treatment program (inpatient, outpatient, or IOP).',
    phase: 'Pre-Treatment',
    milestone: '1-7 days'
  },
  { 
    key: 'complete_treatment', 
    name: 'Complete Treatment Program', 
    description: 'Successfully complete the initial treatment program and receive discharge recommendations.',
    phase: 'Early Recovery',
    milestone: '30-90 days'
  },
  { 
    key: 'establish_support_network', 
    name: 'Establish Recovery Support Network', 
    description: 'Build a support system: sponsor, home group, therapist, and sober connections.',
    phase: 'Early Recovery',
    milestone: '30 days'
  },
  { 
    key: 'family_therapy_sessions', 
    name: 'Complete 8 Family Therapy Sessions', 
    description: 'Attend and complete at least 8 family therapy sessions to address dynamics and healing.',
    phase: 'Early Recovery',
    milestone: '60 days'
  },
  { 
    key: '90_meetings_90_days', 
    name: 'Attend 90 Meetings in 90 Days', 
    description: 'Recovering member commits to attending 90 recovery meetings in the first 90 days.',
    phase: 'Early Recovery',
    milestone: '90 days'
  },
  { 
    key: 'living_amends_plan', 
    name: 'Create Living Amends Plan', 
    description: 'Develop and begin implementing a plan for making amends through changed behavior.',
    phase: 'Sustained Recovery',
    milestone: '6 months'
  },
  { 
    key: 'family_recovery_milestones', 
    name: 'Celebrate 6-Month Family Recovery', 
    description: 'Mark 6 months of family recovery journey with acknowledgment of progress and growth.',
    phase: 'Sustained Recovery',
    milestone: '6 months'
  },
  { 
    key: 'rebuild_financial_trust', 
    name: 'Restore Financial Accountability', 
    description: 'Re-establish financial trust through transparent budgeting and consistent responsibility.',
    phase: 'Sustained Recovery',
    milestone: '9 months'
  },
  { 
    key: 'one_year_celebration', 
    name: 'Celebrate One Year of Sobriety', 
    description: 'Reach the one-year sobriety milestone as a family, celebrating growth and renewed relationships.',
    phase: 'Long-Term Recovery',
    milestone: '1 year'
  },
] as const;


const FAMILY_VALUES_OPTIONS = [
  { 
    key: 'honesty', 
    name: 'Honesty & Transparency', 
    description: 'We commit to open, truthful communication—even when it\'s difficult.',
    icon: 'Sparkles'
  },
  { 
    key: 'accountability', 
    name: 'Accountability and Repair Without Shame', 
    description: 'We hold each other responsible with love, not judgment.',
    icon: 'Target'
  },
  { 
    key: 'boundaries', 
    name: 'Healthy Boundaries', 
    description: 'We respect each other\'s limits while maintaining connection.',
    icon: 'Shield'
  },
  { 
    key: 'support_not_enabling', 
    name: 'Support Without Enabling', 
    description: 'We help each other grow without removing natural consequences.',
    icon: 'Users'
  },
  { 
    key: 'patience', 
    name: 'Patience & Progress', 
    description: 'We focus on progress, not perfection, and allow time for healing.',
    icon: 'Sparkles'
  },
  { 
    key: 'forgiveness', 
    name: 'Forgiveness & Moving Forward', 
    description: 'We release resentment and focus on building a better future together.',
    icon: 'Sparkles'
  },
  { 
    key: 'self_care', 
    name: 'Self-Care for Everyone', 
    description: 'We prioritize each person\'s wellbeing—recovery affects the whole family.',
    icon: 'Sparkles'
  },
  { 
    key: 'consistency', 
    name: 'Consistency & Follow-Through', 
    description: 'We do what we say we\'ll do and maintain reliable expectations.',
    icon: 'Target'
  },
  { 
    key: 'communication', 
    name: 'Compassionate Communication', 
    description: 'We speak with kindness and listen to understand, not to react.',
    icon: 'MessageCircle'
  },
  { 
    key: 'hope', 
    name: 'Hope & Faith in Recovery', 
    description: 'We believe that lasting recovery is possible and work toward it together.',
    icon: 'Sparkles'
  },
] as const;

const FamilyChat = () => {
  const { familyId } = useParams();
  const { user, loading } = useAuth();
  const { organization, setOrganizationById, clearFamilyOrganization } = useOrganization();
  const navigate = useNavigate();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [family, setFamily] = useState<Family | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [financialRequests, setFinancialRequests] = useState<FinancialRequest[]>([]);
  const [lifetimeTotals, setLifetimeTotals] = useState<{ requested: number; given: number }>({ requested: 0, given: 0 });
  const [newMessage, setNewMessage] = useState('');
  const [requestAmount, setRequestAmount] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [requestOtherDescription, setRequestOtherDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string>('member');
  const [isAdminOrModerator, setIsAdminOrModerator] = useState(false);
  const [isFamilyCreator, setIsFamilyCreator] = useState(false);
  const [checkinRefreshKey, setCheckinRefreshKey] = useState(0);
  const [capturedLocation, setCapturedLocation] = useState<LocationData | null>(null);
  
  // Payment handles
  const [paypalUsername, setPaypalUsername] = useState('');
  const [venmoUsername, setVenmoUsername] = useState('');
  const [cashappUsername, setCashappUsername] = useState('');
  const [isSavingPayment, setIsSavingPayment] = useState(false);
  
  // Bill attachment
  const [billAttachment, setBillAttachment] = useState<File | null>(null);
  const [billPreview, setBillPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Pledge state
  const [pledgeAmounts, setPledgeAmounts] = useState<Record<string, string>>({});
  const [pledgeMethods, setPledgeMethods] = useState<Record<string, string>>({});
  const [isPledging, setIsPledging] = useState<string | null>(null);
  
  // Secure payment links (fetched via RPC, only available after marking as payer)
  const [paymentLinksCache, setPaymentLinksCache] = useState<Record<string, PaymentLinks>>({});
  
  // Track which completed requests are expanded
  const [expandedRequests, setExpandedRequests] = useState<Set<string>>(new Set());
  
  // Edit member profile state (for moderators)
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editPaypal, setEditPaypal] = useState('');
  const [editVenmo, setEditVenmo] = useState('');
  const [editCashapp, setEditCashapp] = useState('');
  const [editRole, setEditRole] = useState<string>('');
  const [isSavingMember, setIsSavingMember] = useState(false);
  
  // Content warning cooldown state
  const [warningCount, setWarningCount] = useState(0);
  const [cooldownEndTime, setCooldownEndTime] = useState<number | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [membersSheetOpen, setMembersSheetOpen] = useState(false);
  const [familyInviteCode, setFamilyInviteCode] = useState<string | null>(null);
  const [copiedInviteCode, setCopiedInviteCode] = useState(false);
  
  // Send invite state
  const [showSendInviteDialog, setShowSendInviteDialog] = useState(false);
  const [inviteRecipients, setInviteRecipients] = useState<{ id: string; name: string; email: string; phone: string; contactMethod: 'email' | 'sms'; role: string }[]>([
    { id: crypto.randomUUID(), name: '', email: '', phone: '', contactMethod: 'email', role: 'member' }
  ]);
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  // Weekly archive state - week starts Sunday at midnight
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(() => 
    startOfWeek(new Date(), { weekStartsOn: 0 }) // 0 = Sunday
  );
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  
  // Monthly archive state for financial requests
  const [selectedFinancialMonth, setSelectedFinancialMonth] = useState<Date>(() => 
    startOfMonth(new Date())
  );
  const [allFinancialRequests, setAllFinancialRequests] = useState<FinancialRequest[]>([]);

  // Family Values state
  const [familyValues, setFamilyValues] = useState<FamilyValue[]>([]);
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [isSavingValues, setIsSavingValues] = useState(false);
  const [isEditingValues, setIsEditingValues] = useState(false);
  const [customValueInput, setCustomValueInput] = useState('');
  const [isAddingCustomValue, setIsAddingCustomValue] = useState(false);
  
  // Common Goals state
  const [familyCommonGoals, setFamilyCommonGoals] = useState<FamilyCommonGoal[]>([]);
  const [selectedCommonGoals, setSelectedCommonGoals] = useState<string[]>([]);
  const [isSavingCommonGoals, setIsSavingCommonGoals] = useState(false);
  const [isEditingCommonGoals, setIsEditingCommonGoals] = useState(false);
  const [customGoalInput, setCustomGoalInput] = useState('');
  const [isAddingCustomGoal, setIsAddingCustomGoal] = useState(false);
  
  // Boundaries state
  const [familyBoundaries, setFamilyBoundaries] = useState<FamilyBoundary[]>([]);
  const [newBoundaryContent, setNewBoundaryContent] = useState('');
  const [newBoundaryConsequence, setNewBoundaryConsequence] = useState('');
  const [newBoundaryTarget, setNewBoundaryTarget] = useState<string>('all');
  const [isAddingBoundary, setIsAddingBoundary] = useState(false);
  const [showBoundaryForm, setShowBoundaryForm] = useState(false);
  const [showBoundaryTemplates, setShowBoundaryTemplates] = useState(false);
  const [boundaryToAcknowledge, setBoundaryToAcknowledge] = useState<FamilyBoundary | null>(null);
  const [editingBoundary, setEditingBoundary] = useState<FamilyBoundary | null>(null);
  const [editBoundaryContent, setEditBoundaryContent] = useState('');
  const [editBoundaryConsequence, setEditBoundaryConsequence] = useState('');
  
  // Private messaging state
  const [privateMessagingOpen, setPrivateMessagingOpen] = useState(false);
  const [unreadPrivateMessages, setUnreadPrivateMessages] = useState(0);
  const [hasProfessionalModerator, setHasProfessionalModerator] = useState(false);
  const [isCurrentUserProfessionalModerator, setIsCurrentUserProfessionalModerator] = useState(false);
  const [professionalModeratorIds, setProfessionalModeratorIds] = useState<string[]>([]);
  
  // Online presence state
  const [onlineMembers, setOnlineMembers] = useState<string[]>([]);
  
  // Member activity tracking
  const [memberLastActivity, setMemberLastActivity] = useState<Record<string, { date: string; type: string }>>({});
  
  // FIIS notifications
  const { hasNewAnalysis, markAsViewed: markFIISViewed } = useFIISNotifications({ familyId });
  
  // Moderator disclaimer state (for self-created families with requested moderators)
  const [moderatorDisclaimer, setModeratorDisclaimer] = useState<{ shown: boolean; moderatorName?: string } | null>(null);
  
  // Family avatar upload state
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  
  // Sobriety journey for header display
  const { journey: headerJourney, daysCount: headerDaysCount } = useFamilyMemberJourney(familyId || '');
  
  // Progressive tab disclosure state
  const [showMoreTabs, setShowMoreTabs] = useState(false);
  const [activeTab, setActiveTab] = useState('messages');
  
  // First-time onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  
  // Contextual coaching nudge state
  const [showCoachingNudge, setShowCoachingNudge] = useState(false);
  
  // Check for heated conversation and trigger coaching nudge
  const checkForHeatedConversation = (messagesArray: Message[]) => {
    if (showCoachingNudge || activeTab !== 'messages') return;
    
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    // Get recent messages (last 5 minutes)
    const recentMessages = messagesArray.filter(msg => 
      new Date(msg.created_at) >= fiveMinutesAgo
    );
    
    // Check if there are 3+ messages from different users in the last 5 minutes
    const uniqueSenders = new Set(recentMessages.map(msg => msg.sender_id));
    
    if (recentMessages.length >= 3 && uniqueSenders.size >= 2) {
      setShowCoachingNudge(true);
      // Auto-hide after 30 seconds if not manually dismissed
      setTimeout(() => setShowCoachingNudge(false), 30000);
    }
  };
  
  // Check for FIIS analysis and trigger coaching nudge
  const checkForFIISAnalysis = async () => {
    if (!familyId || showCoachingNudge || activeTab !== 'messages') return;
    
    try {
      const { data } = await supabase
        .from('fiis_analysis')
        .select('id')
        .eq('family_id', familyId)
        .eq('needs_attention', true)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (data && data.length > 0) {
        setShowCoachingNudge(true);
        // Auto-hide after 45 seconds if not manually dismissed
        setTimeout(() => setShowCoachingNudge(false), 45000);
      }
    } catch (error) {
      console.error('Error checking FIIS analysis:', error);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && familyId) {
      fetchFamilyData();
      subscribeToMessages();
      fetchPaymentHandles();
      // Note: Private message unread counts are now handled by PrivateMessagingV2 component
    }
  }, [user, familyId]);

  // Check for FIIS analysis every 2 minutes when on messages tab
  useEffect(() => {
    if (!user || !familyId || activeTab !== 'messages') return;
    
    checkForFIISAnalysis();
    const interval = setInterval(checkForFIISAnalysis, 2 * 60 * 1000); // 2 minutes
    
    return () => clearInterval(interval);
  }, [user, familyId, activeTab]);

  // Online presence tracking
  useEffect(() => {
    if (!user || !familyId) return;

    const presenceChannel = supabase.channel(`family-presence-${familyId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const onlineUserIds = Object.values(state)
          .flat()
          .map((p: any) => p.user_id)
          .filter((id): id is string => !!id);
        setOnlineMembers([...new Set(onlineUserIds)]);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        const newIds = newPresences.map((p: any) => p.user_id).filter(Boolean);
        setOnlineMembers(prev => [...new Set([...prev, ...newIds])]);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        const leftIds = leftPresences.map((p: any) => p.user_id);
        setOnlineMembers(prev => prev.filter(id => !leftIds.includes(id)));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [user, familyId]);

  // Clear organization branding when leaving the family page
  useEffect(() => {
    return () => {
      clearFamilyOrganization();
    };
  }, [clearFamilyOrganization]);

  // Fetch member last activity when sheet opens
  const fetchMemberActivity = async () => {
    if (!familyId || members.length === 0) return;
    
    const activityMap: Record<string, { date: string; type: string }> = {};
    
    for (const member of members) {
      const userId = member.user_id;
      let latestActivity: { date: string; type: string } | null = null;
      
      // Check messages
      const { data: messageData } = await supabase
        .from('messages')
        .select('created_at')
        .eq('family_id', familyId)
        .eq('sender_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (messageData?.[0]) {
        latestActivity = { date: messageData[0].created_at, type: 'message' };
      }
      
      // Check meeting checkins
      const { data: checkinData } = await supabase
        .from('meeting_checkins')
        .select('checked_in_at')
        .eq('family_id', familyId)
        .eq('user_id', userId)
        .order('checked_in_at', { ascending: false })
        .limit(1);
      
      if (checkinData?.[0]) {
        const checkinDate = checkinData[0].checked_in_at;
        if (!latestActivity || new Date(checkinDate) > new Date(latestActivity.date)) {
          latestActivity = { date: checkinDate, type: 'check-in' };
        }
      }
      
      // Check financial requests
      const { data: requestData } = await supabase
        .from('financial_requests')
        .select('created_at')
        .eq('family_id', familyId)
        .eq('requester_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (requestData?.[0]) {
        const requestDate = requestData[0].created_at;
        if (!latestActivity || new Date(requestDate) > new Date(latestActivity.date)) {
          latestActivity = { date: requestDate, type: 'financial request' };
        }
      }
      
      // Check financial votes
      const { data: voteData } = await supabase
        .from('financial_votes')
        .select('created_at, request_id')
        .eq('voter_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (voteData?.[0]) {
        const voteDate = voteData[0].created_at;
        if (!latestActivity || new Date(voteDate) > new Date(latestActivity.date)) {
          latestActivity = { date: voteDate, type: 'vote' };
        }
      }
      
      // Check FIIS observations
      const { data: observationData } = await supabase
        .from('fiis_observations')
        .select('created_at')
        .eq('family_id', familyId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (observationData?.[0]) {
        const obsDate = observationData[0].created_at;
        if (!latestActivity || new Date(obsDate) > new Date(latestActivity.date)) {
          latestActivity = { date: obsDate, type: 'observation' };
        }
      }
      
      if (latestActivity) {
        activityMap[userId] = latestActivity;
      }
    }
    
    setMemberLastActivity(activityMap);
  };

  // Fetch activity when members sheet opens
  useEffect(() => {
    if (membersSheetOpen && members.length > 0) {
      fetchMemberActivity();
    }
  }, [membersSheetOpen, members.length]);

  // Note: Private message functions moved to PrivateMessagingV2 component

  const fetchPaymentHandles = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('payment_info')
      .select('paypal_username, venmo_username, cashapp_username')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (data) {
      setPaypalUsername(data.paypal_username || '');
      setVenmoUsername(data.venmo_username || '');
      setCashappUsername(data.cashapp_username || '');
    }
  };

  const savePaymentHandles = async () => {
    if (!user) return;
    setIsSavingPayment(true);
    try {
      // Check if payment_info exists for user
      const { data: existing } = await supabase
        .from('payment_info')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('payment_info')
          .update({
            paypal_username: paypalUsername.trim() || null,
            venmo_username: venmoUsername.trim() || null,
            cashapp_username: cashappUsername.trim() || null,
          })
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('payment_info')
          .insert({
            user_id: user.id,
            paypal_username: paypalUsername.trim() || null,
            venmo_username: venmoUsername.trim() || null,
            cashapp_username: cashappUsername.trim() || null,
          });
        if (error) throw error;
      }

      toast({
        title: 'Saved',
        description: 'Your payment handles have been updated.',
      });
    } catch (error) {
      console.error('Error saving payment handles:', error);
      toast({
        title: 'Error',
        description: 'Failed to save payment handles.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingPayment(false);
    }
  };

  const openEditMember = (member: Member) => {
    setEditingMember(member);
    setEditFullName(member.full_name);
    setEditPaypal(member.paypal_username || '');
    setEditVenmo(member.venmo_username || '');
    setEditCashapp(member.cashapp_username || '');
    setEditRole(member.role);
  };

  const handleSaveMemberProfile = async () => {
    if (!editingMember) return;
    if (!editFullName.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a full name.',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingMember(true);
    try {
      // Update profile name
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: editFullName.trim() })
        .eq('id', editingMember.user_id);

      if (profileError) throw profileError;

      // Update payment info (upsert)
      const { data: existingPayment } = await supabase
        .from('payment_info')
        .select('id')
        .eq('user_id', editingMember.user_id)
        .maybeSingle();

      if (existingPayment) {
        const { error: paymentError } = await supabase
          .from('payment_info')
          .update({
            paypal_username: editPaypal.trim() || null,
            venmo_username: editVenmo.trim() || null,
            cashapp_username: editCashapp.trim() || null,
          })
          .eq('user_id', editingMember.user_id);
        if (paymentError) throw paymentError;
      } else if (editPaypal.trim() || editVenmo.trim() || editCashapp.trim()) {
        const { error: paymentError } = await supabase
          .from('payment_info')
          .insert({
            user_id: editingMember.user_id,
            paypal_username: editPaypal.trim() || null,
            venmo_username: editVenmo.trim() || null,
            cashapp_username: editCashapp.trim() || null,
          });
        if (paymentError) throw paymentError;
      }

      // Update role if changed and user is the family creator
      if (editRole !== editingMember.role && isFamilyCreator) {
        // Only family creator can assign/change admin role
        const { error: roleError } = await supabase
          .from('family_members')
          .update({ role: editRole as 'member' | 'recovering' | 'moderator' | 'admin' })
          .eq('id', editingMember.id);
        if (roleError) throw roleError;
      }

      toast({
        title: 'Profile updated',
        description: `${editFullName.trim()}'s profile has been updated.`,
      });

      // Refresh members list
      setMembers((prev) =>
        prev.map((m) =>
          m.user_id === editingMember.user_id
            ? {
                ...m,
                full_name: editFullName.trim(),
                paypal_username: editPaypal.trim() || null,
                venmo_username: editVenmo.trim() || null,
                cashapp_username: editCashapp.trim() || null,
                role: isFamilyCreator ? editRole : m.role,
              }
            : m
        )
      );
      setEditingMember(null);
    } catch (error) {
      console.error('Error updating member profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingMember(false);
    }
  };

  const togglePrivateMessaging = async (memberId: string, userId: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('family_members')
        .update({ private_messaging_enabled: enabled })
        .eq('id', memberId);

      if (error) throw error;

      setMembers(prev => 
        prev.map(m => 
          m.id === memberId 
            ? { ...m, private_messaging_enabled: enabled }
            : m
        )
      );

      toast({
        title: enabled ? 'Private messaging enabled' : 'Private messaging disabled',
        description: `Updated private messaging permissions.`,
      });
    } catch (error) {
      console.error('Error toggling private messaging:', error);
      toast({
        title: 'Error',
        description: 'Failed to update private messaging permissions.',
        variant: 'destructive',
      });
    }
  };

  const addInviteRecipient = () => {
    setInviteRecipients(prev => [...prev, { id: crypto.randomUUID(), name: '', email: '', phone: '', contactMethod: 'email', role: 'member' }]);
  };

  const removeInviteRecipient = (id: string) => {
    if (inviteRecipients.length > 1) {
      setInviteRecipients(prev => prev.filter(r => r.id !== id));
    }
  };

  const updateInviteRecipient = (id: string, field: 'name' | 'email' | 'phone' | 'contactMethod' | 'role', value: string) => {
    setInviteRecipients(prev => prev.map(r => 
      r.id === id ? { ...r, [field]: value } : r
    ));
  };

  const INVITE_ROLE_OPTIONS = [
    { value: 'member', label: 'Family Member' },
    { value: 'recovering', label: 'Person in Recovery' },
    { value: 'dad', label: 'Dad' },
    { value: 'mom', label: 'Mom' },
    { value: 'husband', label: 'Husband' },
    { value: 'wife', label: 'Wife' },
    { value: 'brother', label: 'Brother' },
    { value: 'sister', label: 'Sister' },
    { value: 'friend', label: 'Friend' },
    { value: 'employer', label: 'Employer' },
    { value: 'moderator', label: 'Moderator' },
    { value: 'admin', label: 'Admin' },
    // Provider roles
    { value: 'therapist', label: 'Therapist' },
    { value: 'case_manager', label: 'Case Manager' },
    { value: 'sober_living_manager', label: 'Sober Living Manager' },
    { value: 'interventionist', label: 'Interventionist' },
    { value: 'program_admin', label: 'Program Admin' },
  ];

  const sendInvites = async () => {
    // Validate recipients based on their contact method
    const validRecipients = inviteRecipients.filter(r => {
      if (!r.name.trim()) return false;
      if (r.contactMethod === 'email') return r.email.trim();
      if (r.contactMethod === 'sms') return r.phone.trim();
      return false;
    });
    
    if (validRecipients.length === 0 || !familyInviteCode || !family) {
      toast({
        title: 'Missing information',
        description: 'Please enter at least one name and contact info.',
        variant: 'destructive',
      });
      return;
    }

    // Validate emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emailRecipients = validRecipients.filter(r => r.contactMethod === 'email');
    const invalidEmails = emailRecipients.filter(r => !emailRegex.test(r.email.trim()));
    if (invalidEmails.length > 0) {
      toast({
        title: 'Invalid email',
        description: `Please check the email for: ${invalidEmails.map(r => r.name || 'unnamed').join(', ')}`,
        variant: 'destructive',
      });
      return;
    }

    // Validate phone numbers (basic check for at least 10 digits)
    const phoneRegex = /^\+?[\d\s\-().]{10,}$/;
    const smsRecipients = validRecipients.filter(r => r.contactMethod === 'sms');
    const invalidPhones = smsRecipients.filter(r => !phoneRegex.test(r.phone.trim()));
    if (invalidPhones.length > 0) {
      toast({
        title: 'Invalid phone number',
        description: `Please check the phone number for: ${invalidPhones.map(r => r.name || 'unnamed').join(', ')}`,
        variant: 'destructive',
      });
      return;
    }

    setIsSendingInvite(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const recipient of validRecipients) {
        try {
          if (recipient.contactMethod === 'email') {
            const { error } = await supabase.functions.invoke('send-family-invite', {
              body: {
                recipientEmail: recipient.email.trim(),
                recipientName: recipient.name.trim(),
                familyName: family.name,
                inviteCode: familyInviteCode,
                organizationName: organization?.name || 'FamilyBridge',
                organizationLogo: organization?.logo_url || null,
                intendedRole: recipient.role,
                familyId: family.id,
              },
            });

            if (error) {
              failCount++;
            } else {
              successCount++;
            }
          } else if (recipient.contactMethod === 'sms') {
            const { error } = await supabase.functions.invoke('send-family-invite-sms', {
              body: {
                recipientPhone: recipient.phone.trim(),
                recipientName: recipient.name.trim(),
                familyName: family.name,
                inviteCode: familyInviteCode,
                organizationName: organization?.name || 'FamilyBridge',
                intendedRole: recipient.role,
                familyId: family.id,
              },
            });

            if (error) {
              failCount++;
            } else {
              successCount++;
            }
          }
        } catch {
          failCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: 'Invitations sent!',
          description: `${successCount} invitation${successCount > 1 ? 's' : ''} sent successfully.${failCount > 0 ? ` ${failCount} failed.` : ''}`,
        });
      } else {
        toast({
          title: 'Failed to send invites',
          description: 'Please try again or share the invite code manually.',
          variant: 'destructive',
        });
      }
      
      // Reset form
      setInviteRecipients([{ id: crypto.randomUUID(), name: '', email: '', phone: '', contactMethod: 'email', role: 'member' }]);
      setShowSendInviteDialog(false);
    } catch (error) {
      console.error('Error sending invites:', error);
      toast({
        title: 'Failed to send invites',
        description: 'Please try again or share the invite code manually.',
        variant: 'destructive',
      });
    } finally {
      setIsSendingInvite(false);
    }
  };

  const checkProfessionalModerator = async () => {
    if (!familyId || !user) return;
    
    // Check temporary moderator requests - also check if current user is assigned
    const { data: tempMod } = await supabase
      .from('temporary_moderator_requests')
      .select('id, assigned_moderator_id')
      .eq('family_id', familyId)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString());

    // Check paid moderator requests - also check if current user is assigned
    const { data: paidMod } = await supabase
      .from('paid_moderator_requests')
      .select('id, assigned_moderator_id')
      .eq('family_id', familyId)
      .eq('status', 'active');

    const hasAnyProfessionalMod = (tempMod && tempMod.length > 0) || (paidMod && paidMod.length > 0);
    setHasProfessionalModerator(hasAnyProfessionalMod);
    
    // Collect all professional moderator IDs for exclusion from FIIS analysis
    const profModIds: string[] = [];
    tempMod?.forEach(m => {
      if (m.assigned_moderator_id) profModIds.push(m.assigned_moderator_id);
    });
    paidMod?.forEach(m => {
      if (m.assigned_moderator_id) profModIds.push(m.assigned_moderator_id);
    });
    setProfessionalModeratorIds([...new Set(profModIds)]);
    
    // Check if current user is the assigned professional moderator
    const isCurrentUserTemp = tempMod?.some(m => m.assigned_moderator_id === user.id) || false;
    const isCurrentUserPaid = paidMod?.some(m => m.assigned_moderator_id === user.id) || false;
    const isCurrentUserProfMod = isCurrentUserTemp || isCurrentUserPaid;
    setIsCurrentUserProfessionalModerator(isCurrentUserProfMod);
    
    // If current user is a professional moderator but not in family_members, set their role
    if (isCurrentUserProfMod) {
      setCurrentUserRole('moderator');
      setIsAdminOrModerator(true);
    }
  };

  // Check for moderator disclaimer for self-created families
  const checkModeratorDisclaimer = async () => {
    if (!familyId) return;
    
    const { data: disclaimer } = await supabase
      .from('moderator_disclaimers')
      .select('id, moderator_id')
      .eq('family_id', familyId)
      .maybeSingle();

    if (disclaimer) {
      // Get moderator name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', disclaimer.moderator_id)
        .maybeSingle();
      
      setModeratorDisclaimer({
        shown: true,
        moderatorName: profile?.full_name || undefined,
      });
    }
  };

  useEffect(() => {
    if (familyId) {
      checkProfessionalModerator();
      checkModeratorDisclaimer();
    }
  }, [familyId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchFamilyData = async () => {
    try {
      if (!familyId) {
        throw new Error('Missing family id');
      }

      // Fetch family info (RLS-protected: only members can see it)
      // Note: invite_code is not fetched here - only moderators can access it via get_family_invite_code()
      const { data: familyData, error: familyError } = await supabase
        .from('families')
        .select('id, name, description, organization_id, created_by, avatar_url')
        .eq('id', familyId)
        .maybeSingle();

      if (familyError) throw familyError;
      if (!familyData) {
        toast({
          title: 'Not found',
          description: 'That family group does not exist or you no longer have access.',
          variant: 'destructive',
        });
        navigate('/dashboard');
        return;
      }
      setFamily(familyData);
      
      // Apply organization branding if family belongs to an organization
      if (familyData.organization_id) {
        setOrganizationById(familyData.organization_id);
      }

      // Fetch members (cannot embed profiles here because there is no FK relationship)
      const { data: membersData, error: membersError } = await supabase
        .from('family_members')
        .select('id, user_id, role, private_messaging_enabled')
        .eq('family_id', familyId);

      if (membersError) throw membersError;

      const memberRows = membersData || [];
      const memberUserIds = Array.from(new Set(memberRows.map((m) => m.user_id)));

      const profilesById = new Map<string, { full_name: string }>();
      const paymentInfoById = new Map<string, { paypal_username?: string | null; venmo_username?: string | null; cashapp_username?: string | null }>();

      if (memberUserIds.length > 0) {
        // Fetch profiles (names only) via rate-limited backend function
        const profilesData = await fetchProfilesByIds(memberUserIds);

        for (const p of profilesData || []) {
          profilesById.set(p.id, { full_name: p.full_name });
        }

        // Fetch payment info separately (moderators only see their own unless they're managing)
        const { data: paymentData } = await supabase
          .from('payment_info')
          .select('user_id, paypal_username, venmo_username, cashapp_username')
          .in('user_id', memberUserIds);

        for (const pi of paymentData || []) {
          paymentInfoById.set(pi.user_id, {
            paypal_username: pi.paypal_username,
            venmo_username: pi.venmo_username,
            cashapp_username: pi.cashapp_username,
          });
        }
      }

      const formattedMembers: Member[] = memberRows.map((m) => {
        const profile = profilesById.get(m.user_id);
        const paymentInfo = paymentInfoById.get(m.user_id);
        return {
          id: m.id,
          user_id: m.user_id,
          role: m.role,
          full_name: profile?.full_name || 'Unknown',
          paypal_username: paymentInfo?.paypal_username,
          venmo_username: paymentInfo?.venmo_username,
          cashapp_username: paymentInfo?.cashapp_username,
          private_messaging_enabled: m.private_messaging_enabled,
        };
      });

      setMembers(formattedMembers);

      // Set current user role and admin status
      const currentMember = formattedMembers.find((m) => m.user_id === user?.id);
      if (currentMember) {
        setCurrentUserRole(currentMember.role);
        const hasModeratorAccess = currentMember.role === 'admin' || currentMember.role === 'moderator';
        setIsAdminOrModerator(hasModeratorAccess);
        
        // Fetch invite code for admins/moderators
        if (hasModeratorAccess && familyId) {
          const { data: inviteCode } = await supabase.rpc('get_family_invite_code', { _family_id: familyId });
          setFamilyInviteCode(inviteCode);
        }
      }
      
      // Check if user is the family creator
      if (familyData.created_by === user?.id) {
        setIsFamilyCreator(true);
      }
      
      // Check if this is the user's first visit for onboarding
      if (user?.id && familyId) {
        const onboardingKey = `familybridge_onboarding_${familyId}_complete`;
        const hasCompletedOnboarding = localStorage.getItem(onboardingKey) === 'true';
        
        if (!hasCompletedOnboarding) {
          setShowOnboarding(true);
          setOnboardingStep(1);
        } else {
          setHasSeenOnboarding(true);
        }
      }

      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(
          `
          id,
          content,
          sender_id,
          was_filtered,
          created_at
        `
        )
        .eq('family_id', familyId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      const messagesWithNames = (messagesData || []).map((msg) => {
        const sender = formattedMembers.find((m) => m.user_id === msg.sender_id);
        return {
          ...msg,
          sender_name: sender?.full_name || 'Unknown',
        };
      });
      setAllMessages(messagesWithNames);
      // Filter messages to current week initially
      const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
      const currentWeekEnd = endOfWeek(new Date(), { weekStartsOn: 0 });
      const currentWeekMessages = messagesWithNames.filter(msg => {
        const msgDate = new Date(msg.created_at);
        return isWithinInterval(msgDate, { start: currentWeekStart, end: currentWeekEnd });
      });
      setMessages(currentWeekMessages);

      // Fetch financial requests
      await fetchFinancialRequests(formattedMembers);
      
      
      // Fetch family values
      await fetchFamilyValues();
      
      // Fetch common goals
      await fetchFamilyCommonGoals();
      
      // Fetch family boundaries
      await fetchFamilyBoundaries();
    } catch (error) {
      console.error('Error fetching family data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load family data.',
        variant: 'destructive',
      });
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };


  const fetchFamilyValues = async () => {
    const { data, error } = await supabase
      .from('family_values')
      .select('*')
      .eq('family_id', familyId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching family values:', error);
      return;
    }

    const values = data || [];
    setFamilyValues(values);
    setSelectedValues(values.map(v => v.value_key));
  };

  const fetchFamilyCommonGoals = async () => {
    const { data, error } = await supabase
      .from('family_common_goals')
      .select('*')
      .eq('family_id', familyId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching common goals:', error);
      return;
    }

    const goals = (data || []) as FamilyCommonGoal[];
    setFamilyCommonGoals(goals);
    setSelectedCommonGoals(goals.map(g => g.goal_key));
  };

  const handleToggleValue = (valueKey: string) => {
    setSelectedValues(prev => {
      if (prev.includes(valueKey)) {
        return prev.filter(v => v !== valueKey);
      } else if (prev.length < 2) {
        return [...prev, valueKey];
      } else {
        return [prev[1], valueKey];
      }
    });
  };

  const handleAddCustomValue = () => {
    if (!customValueInput.trim()) return;
    const customKey = `custom_${customValueInput.trim().toLowerCase().replace(/\s+/g, '_')}`;
    if (selectedValues.length < 2 && !selectedValues.includes(customKey)) {
      setSelectedValues(prev => [...prev, customKey]);
    } else if (selectedValues.length >= 2) {
      setSelectedValues(prev => [prev[1], customKey]);
    }
    setCustomValueInput('');
    setIsAddingCustomValue(false);
  };

  const handleToggleCommonGoal = (goalKey: string) => {
    setSelectedCommonGoals(prev => {
      if (prev.includes(goalKey)) {
        return prev.filter(g => g !== goalKey);
      } else if (prev.length < 2) {
        return [...prev, goalKey];
      } else {
        return [prev[1], goalKey];
      }
    });
  };

  const handleAddCustomGoal = () => {
    if (!customGoalInput.trim()) return;
    const customKey = `custom_${customGoalInput.trim().toLowerCase().replace(/\s+/g, '_')}`;
    if (selectedCommonGoals.length < 2 && !selectedCommonGoals.includes(customKey)) {
      setSelectedCommonGoals(prev => [...prev, customKey]);
    } else if (selectedCommonGoals.length >= 2) {
      setSelectedCommonGoals(prev => [prev[1], customKey]);
    }
    setCustomGoalInput('');
    setIsAddingCustomGoal(false);
  };

  const handleSaveValues = async () => {
    if (!user || !familyId) return;

    setIsSavingValues(true);
    try {
      await supabase
        .from('family_values')
        .delete()
        .eq('family_id', familyId);

      if (selectedValues.length > 0) {
        const { error } = await supabase
          .from('family_values')
          .insert(
            selectedValues.map(valueKey => ({
              family_id: familyId,
              value_key: valueKey,
              selected_by: user.id,
            }))
          );

        if (error) throw error;
      }

      toast({
        title: 'Values saved',
        description: "Your family's guiding values have been updated.",
      });

      setIsEditingValues(false);
      await fetchFamilyValues();
    } catch (error) {
      console.error('Error saving values:', error);
      toast({
        title: 'Error',
        description: 'Failed to save family values.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingValues(false);
    }
  };

  const handleSaveCommonGoals = async () => {
    if (!user || !familyId) return;

    setIsSavingCommonGoals(true);
    try {
      await supabase
        .from('family_common_goals')
        .delete()
        .eq('family_id', familyId);

      if (selectedCommonGoals.length > 0) {
        const { error } = await supabase
          .from('family_common_goals')
          .insert(
            selectedCommonGoals.map(goalKey => ({
              family_id: familyId,
              goal_key: goalKey,
              selected_by: user.id,
            }))
          );

        if (error) throw error;
      }

      toast({
        title: 'Goals saved',
        description: "Your family's common goals have been updated.",
      });

      setIsEditingCommonGoals(false);
      await fetchFamilyCommonGoals();
    } catch (error) {
      console.error('Error saving common goals:', error);
      toast({
        title: 'Error',
        description: 'Failed to save common goals.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingCommonGoals(false);
    }
  };

  const handleToggleCommonGoalComplete = async (goalId: string, isCompleted: boolean) => {
    try {
      const { error } = await supabase
        .from('family_common_goals')
        .update({
          completed_at: isCompleted ? null : new Date().toISOString(),
        })
        .eq('id', goalId);

      if (error) throw error;

      await fetchFamilyCommonGoals();
    } catch (error) {
      console.error('Error updating common goal:', error);
      toast({
        title: 'Error',
        description: 'Failed to update goal.',
        variant: 'destructive',
      });
    }
  };


  const fetchFamilyBoundaries = async () => {
    const { data: boundariesData, error } = await supabase
      .from('family_boundaries')
      .select('*')
      .eq('family_id', familyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching boundaries:', error);
      return;
    }

    // Fetch acknowledgments for each boundary
    const boundaryIds = boundariesData?.map(b => b.id) || [];
    let acknowledgmentsData: any[] = [];
    
    if (boundaryIds.length > 0) {
      const { data: acks } = await supabase
        .from('boundary_acknowledgments')
        .select('*')
        .in('boundary_id', boundaryIds);
      acknowledgmentsData = acks || [];
    }

    // Build boundaries with acknowledgments and names
    const profilesById = new Map<string, string>();
    for (const m of members) {
      profilesById.set(m.user_id, m.full_name);
    }

    const formattedBoundaries: FamilyBoundary[] = (boundariesData || []).map(b => ({
      ...b,
      creator_name: profilesById.get(b.created_by) || 'Unknown',
      target_name: b.target_user_id ? profilesById.get(b.target_user_id) || 'Unknown' : null,
      acknowledgments: acknowledgmentsData
        .filter(a => a.boundary_id === b.id)
        .map(a => ({
          user_id: a.user_id,
          user_name: profilesById.get(a.user_id) || 'Unknown',
          acknowledged_at: a.acknowledged_at,
        })),
    }));

    setFamilyBoundaries(formattedBoundaries);
  };

  const handleCreateBoundary = async () => {
    if (!newBoundaryContent.trim() || !user || !familyId) return;

    setIsAddingBoundary(true);
    try {
      const { error } = await supabase
        .from('family_boundaries')
        .insert({
          family_id: familyId,
          created_by: user.id,
          target_user_id: newBoundaryTarget === 'all' ? null : newBoundaryTarget,
          content: newBoundaryContent.trim(),
          consequence: newBoundaryConsequence.trim() || null,
        });

      if (error) throw error;

      toast({
        title: 'Boundary proposed',
        description: 'Your boundary has been submitted for moderator approval.',
      });

      setNewBoundaryContent('');
      setNewBoundaryConsequence('');
      setNewBoundaryTarget('all');
      setShowBoundaryForm(false);
      await fetchFamilyBoundaries();
    } catch (error) {
      console.error('Error creating boundary:', error);
      toast({
        title: 'Error',
        description: 'Failed to create boundary.',
        variant: 'destructive',
      });
    } finally {
      setIsAddingBoundary(false);
    }
  };

  const handleApproveBoundary = async (boundaryId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('family_boundaries')
        .update({
          status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', boundaryId);

      if (error) throw error;

      toast({
        title: 'Boundary approved',
        description: 'The boundary has been approved and family members will be notified.',
      });

      await fetchFamilyBoundaries();
    } catch (error) {
      console.error('Error approving boundary:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve boundary.',
        variant: 'destructive',
      });
    }
  };

  const handleRejectBoundary = async (boundaryId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('family_boundaries')
        .update({
          status: 'rejected',
        })
        .eq('id', boundaryId);

      if (error) throw error;

      toast({
        title: 'Boundary rejected',
        description: 'The boundary request has been rejected.',
      });

      await fetchFamilyBoundaries();
    } catch (error) {
      console.error('Error rejecting boundary:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject boundary.',
        variant: 'destructive',
      });
    }
  };

  const handleAcknowledgeBoundary = async (boundaryId: string) => {
    // Find the boundary to show in confirmation dialog
    const boundary = familyBoundaries.find(b => b.id === boundaryId);
    if (boundary) {
      setBoundaryToAcknowledge(boundary);
    }
  };

  const confirmAcknowledgeBoundary = async () => {
    if (!user || !boundaryToAcknowledge) return;
    try {
      const { error } = await supabase
        .from('boundary_acknowledgments')
        .insert({
          boundary_id: boundaryToAcknowledge.id,
          user_id: user.id,
        });

      if (error) throw error;

      toast({
        title: 'Boundary acknowledged',
        description: 'You have acknowledged this boundary and its consequence.',
      });

      setBoundaryToAcknowledge(null);
      await fetchFamilyBoundaries();
    } catch (error) {
      console.error('Error acknowledging boundary:', error);
      toast({
        title: 'Error',
        description: 'Failed to acknowledge boundary.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteBoundary = async (boundaryId: string) => {
    try {
      const { error } = await supabase
        .from('family_boundaries')
        .delete()
        .eq('id', boundaryId);

      if (error) throw error;

      toast({
        title: 'Boundary removed',
        description: 'The boundary has been removed.',
      });

      await fetchFamilyBoundaries();
    } catch (error) {
      console.error('Error deleting boundary:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove boundary.',
        variant: 'destructive',
      });
    }
  };

  const handleRescindBoundary = async (boundaryId: string) => {
    if (!confirm('Are you sure you want to rescind this boundary? This will remove it for all family members.')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('family_boundaries')
        .delete()
        .eq('id', boundaryId);

      if (error) throw error;

      toast({
        title: 'Boundary rescinded',
        description: 'Your boundary has been removed.',
      });

      await fetchFamilyBoundaries();
    } catch (error) {
      console.error('Error rescinding boundary:', error);
      toast({
        title: 'Error',
        description: 'Failed to rescind boundary.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateBoundary = async () => {
    if (!editingBoundary || !editBoundaryContent.trim()) {
      toast({
        title: 'Content required',
        description: 'Please enter the boundary content.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('family_boundaries')
        .update({
          content: editBoundaryContent.trim(),
          consequence: editBoundaryConsequence.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingBoundary.id);

      if (error) throw error;

      toast({
        title: 'Boundary updated',
        description: 'Your boundary has been updated successfully.',
      });

      setEditingBoundary(null);
      setEditBoundaryContent('');
      setEditBoundaryConsequence('');
      await fetchFamilyBoundaries();
    } catch (error) {
      console.error('Error updating boundary:', error);
      toast({
        title: 'Error',
        description: 'Failed to update boundary.',
        variant: 'destructive',
      });
    }
  };

  
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !familyId || !user) return;
    
    // Check if user is admin/moderator
    if (!isAdminOrModerator) {
      toast({
        title: 'Permission denied',
        description: 'Only family admins can update the family avatar.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsUploadingAvatar(true);
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${familyId}/${Date.now()}.${fileExt}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('family-avatars')
        .upload(fileName, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('family-avatars')
        .getPublicUrl(fileName);
      
      // Update family record
      const { error: updateError } = await supabase
        .from('families')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', familyId);
      
      if (updateError) throw updateError;
      
      // Update local state
      setFamily(prev => prev ? { ...prev, avatar_url: urlData.publicUrl } : null);
      
      toast({
        title: 'Avatar updated',
        description: 'Family avatar has been updated successfully.',
      });
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload avatar.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingAvatar(false);
      // Reset input
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  const hasUserAcknowledged = (boundary: FamilyBoundary) => {
    return boundary.acknowledgments.some(a => a.user_id === user?.id);
  };

  const shouldUserAcknowledge = (boundary: FamilyBoundary) => {
    if (boundary.status !== 'approved') return false;
    if (hasUserAcknowledged(boundary)) return false;
    // If target is null, all members should acknowledge
    // If target is set, only that user should acknowledge
    if (boundary.target_user_id === null) return true;
    return boundary.target_user_id === user?.id || boundary.created_by === user?.id;
  };

  const fetchFinancialRequests = async (membersList: Member[]) => {
    const { data: requestsData, error: requestsError } = await supabase
      .from('financial_requests')
      .select(`
        id,
        amount,
        reason,
        status,
        requester_id,
        created_at,
        paid_at,
        paid_by_user_id,
        payment_method,
        payment_confirmed_at,
        payment_confirmed_by_user_id,
        attachment_url,
        resolved_at,
        financial_votes (
          approved,
          voter_id
        )
      `)
      .eq('family_id', familyId)
      .order('created_at', { ascending: false });

    if (requestsError) {
      console.error('Error fetching requests:', requestsError);
      return;
    }

    // Get request IDs to fetch pledges
    const requestIds = (requestsData || []).map(r => r.id);
    
    // Fetch pledges for all requests
    const { data: pledgesData } = await supabase
      .from('financial_pledges')
      .select('id, request_id, user_id, amount, payment_method, created_at')
      .in('request_id', requestIds.length > 0 ? requestIds : ['00000000-0000-0000-0000-000000000000']);

    // Get all user IDs from pledges to fetch names
    const pledgeUserIds = Array.from(new Set((pledgesData || []).map(p => p.user_id)));
    
    // Get requester user IDs to fetch their payment handles
    const requesterIds = Array.from(new Set((requestsData || []).map(r => r.requester_id)));
    const allUserIds = Array.from(new Set([...requesterIds, ...pledgeUserIds]));
    
    // Fetch profiles (names only)
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', allUserIds.length > 0 ? allUserIds : ['00000000-0000-0000-0000-000000000000']);

    const profilesById = new Map<string, { id: string; full_name: string }>(
      (profilesData || []).map(p => [p.id, p] as const)
    );

    // Note: Payment info is no longer fetched directly here for security
    // Payment links are fetched securely via RPC only when user clicks to pay

    // Group pledges by request_id
    const pledgesByRequestId = new Map<string, FinancialPledge[]>();
    for (const pledge of pledgesData || []) {
      const profile = profilesById.get(pledge.user_id);
      const member = membersList.find(m => m.user_id === pledge.user_id);
      const pledgeWithName: FinancialPledge = {
        id: pledge.id,
        user_id: pledge.user_id,
        amount: pledge.amount,
        payment_method: pledge.payment_method,
        created_at: pledge.created_at,
        user_name: member?.full_name || profile?.full_name || 'Unknown',
      };
      
      if (!pledgesByRequestId.has(pledge.request_id)) {
        pledgesByRequestId.set(pledge.request_id, []);
      }
      pledgesByRequestId.get(pledge.request_id)!.push(pledgeWithName);
    }

    const requestsWithNames = (requestsData || []).map(req => {
      const requester = membersList.find(m => m.user_id === req.requester_id);
      const profile = profilesById.get(req.requester_id);
      return {
        id: req.id,
        amount: req.amount,
        reason: req.reason,
        status: req.status,
        requester_id: req.requester_id,
        requester_name: requester?.full_name || profile?.full_name || 'Unknown',
        created_at: req.created_at,
        votes: req.financial_votes || [],
        pledges: pledgesByRequestId.get(req.id) || [],
        paid_at: req.paid_at,
        paid_by_user_id: req.paid_by_user_id,
        payment_method: req.payment_method,
        payment_confirmed_at: req.payment_confirmed_at,
        payment_confirmed_by_user_id: req.payment_confirmed_by_user_id,
        attachment_url: req.attachment_url,
        resolved_at: req.resolved_at,
      };
    });
    
    // Store all requests for archive navigation
    setAllFinancialRequests(requestsWithNames);
    
    // Filter for current month display - show active (not completed) requests + completed from current month
    const currentMonthStart = startOfMonth(new Date());
    const currentMonthEnd = endOfMonth(new Date());
    const filteredRequests = requestsWithNames.filter(req => {
      // Always show active (non-completed) requests
      if (!req.resolved_at) return true;
      // Show completed requests from current month
      const resolvedDate = new Date(req.resolved_at);
      return isWithinInterval(resolvedDate, { start: currentMonthStart, end: currentMonthEnd });
    });
    setFinancialRequests(filteredRequests);
    
    // Calculate lifetime totals from all requests (this already includes all history)
    const totalRequested = requestsWithNames.reduce((sum, r) => sum + r.amount, 0);
    const totalGiven = requestsWithNames
      .filter(r => r.payment_confirmed_at || r.status === 'approved')
      .reduce((sum, r) => r.pledges.reduce((pSum, p) => pSum + p.amount, 0) + sum, 0);
    
    setLifetimeTotals({ requested: totalRequested, given: totalGiven });
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('messages-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `family_id=eq.${familyId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          const sender = members.find(m => m.user_id === newMsg.sender_id);
          const msgWithName = {
            ...newMsg,
            sender_name: sender?.full_name || 'Unknown',
          };
          // Add to all messages
          setAllMessages(prev => {
            const updated = [...prev, msgWithName];
            // Check for heated conversation (3+ messages in last 5 minutes from different users)
            checkForHeatedConversation(updated);
            return updated;
          });
          // Only add to visible messages if it's in the current week
          const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
          const currentWeekEnd = endOfWeek(new Date(), { weekStartsOn: 0 });
          const msgDate = new Date(newMsg.created_at);
          if (isWithinInterval(msgDate, { start: currentWeekStart, end: currentWeekEnd })) {
            // Check if we're viewing the current week
            if (isSameWeek(selectedWeekStart, new Date(), { weekStartsOn: 0 })) {
              setMessages(prev => {
                const updated = [...prev, msgWithName];
                // Check for heated conversation in visible messages too
                checkForHeatedConversation(updated);
                return updated;
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  // Week navigation helper
  const isCurrentWeek = isSameWeek(selectedWeekStart, new Date(), { weekStartsOn: 0 });
  
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeekStart = direction === 'prev' 
      ? subWeeks(selectedWeekStart, 1)
      : startOfWeek(
          new Date(selectedWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000), 
          { weekStartsOn: 0 }
        );
    
    // Don't navigate to future weeks
    if (direction === 'next' && newWeekStart > startOfWeek(new Date(), { weekStartsOn: 0 })) {
      return;
    }
    
    setSelectedWeekStart(newWeekStart);
    
    // Filter messages for the selected week
    const weekEnd = endOfWeek(newWeekStart, { weekStartsOn: 0 });
    const filteredMessages = allMessages.filter(msg => {
      const msgDate = new Date(msg.created_at);
      return isWithinInterval(msgDate, { start: newWeekStart, end: weekEnd });
    });
    setMessages(filteredMessages);
  };
  
  const goToCurrentWeek = () => {
    const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
    setSelectedWeekStart(currentWeekStart);
    
    const currentWeekEnd = endOfWeek(new Date(), { weekStartsOn: 0 });
    const filteredMessages = allMessages.filter(msg => {
      const msgDate = new Date(msg.created_at);
      return isWithinInterval(msgDate, { start: currentWeekStart, end: currentWeekEnd });
    });
    setMessages(filteredMessages);
  };
  
  const getWeekLabel = () => {
    const weekEnd = endOfWeek(selectedWeekStart, { weekStartsOn: 0 });
    return `${format(selectedWeekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
  };

  // Month navigation for financial requests
  const isCurrentMonth = isSameMonth(selectedFinancialMonth, new Date());
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonthStart = direction === 'prev' 
      ? subMonths(selectedFinancialMonth, 1)
      : startOfMonth(new Date(selectedFinancialMonth.getTime() + 32 * 24 * 60 * 60 * 1000));
    
    // Don't go beyond current month
    if (direction === 'next' && newMonthStart > new Date()) {
      return;
    }
    
    setSelectedFinancialMonth(newMonthStart);
    
    // Filter requests for the selected month
    const monthEnd = endOfMonth(newMonthStart);
    
    if (isSameMonth(newMonthStart, new Date())) {
      // Current month: show active requests + completed from this month
      const filteredRequests = allFinancialRequests.filter(req => {
        if (!req.resolved_at) return true;
        const resolvedDate = new Date(req.resolved_at);
        return isWithinInterval(resolvedDate, { start: newMonthStart, end: monthEnd });
      });
      setFinancialRequests(filteredRequests);
    } else {
      // Past months: show only completed requests from that month
      const filteredRequests = allFinancialRequests.filter(req => {
        if (!req.resolved_at) return false;
        const resolvedDate = new Date(req.resolved_at);
        return isWithinInterval(resolvedDate, { start: newMonthStart, end: monthEnd });
      });
      setFinancialRequests(filteredRequests);
    }
  };
  
  const goToCurrentMonth = () => {
    const currentMonthStart = startOfMonth(new Date());
    setSelectedFinancialMonth(currentMonthStart);
    
    const currentMonthEnd = endOfMonth(new Date());
    const filteredRequests = allFinancialRequests.filter(req => {
      if (!req.resolved_at) return true;
      const resolvedDate = new Date(req.resolved_at);
      return isWithinInterval(resolvedDate, { start: currentMonthStart, end: currentMonthEnd });
    });
    setFinancialRequests(filteredRequests);
  };
  
  const getMonthLabel = () => {
    return format(selectedFinancialMonth, 'MMMM yyyy');
  };

  // Cooldown timer effect
  useEffect(() => {
    if (!cooldownEndTime) return;
    
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((cooldownEndTime - Date.now()) / 1000));
      setCooldownRemaining(remaining);
      
      if (remaining <= 0) {
        setCooldownEndTime(null);
        setCooldownRemaining(0);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [cooldownEndTime]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    // Check if user is in cooldown
    if (cooldownEndTime && Date.now() < cooldownEndTime) {
      toast({
        title: 'Please wait',
        description: `You can send a message in ${cooldownRemaining} seconds. It seems like emotions are running high - when you're ready, our Coaching tool can help you find the right words.`,
        variant: 'destructive',
        action: {
          altText: "Go to Coaching",
          label: "Open Coaching",
          onClick: () => {
            // Switch to coaching tab
            const coachingTab = document.querySelector('[data-value="coaching"]') as HTMLElement;
            if (coachingTab) {
              coachingTab.click();
            }
          }
        }
      });
      return;
    }

    // Check for inappropriate content before sending
    const filterResult = filterContent(newMessage);
    
    if (!filterResult.isClean) {
      const newWarningCount = warningCount + 1;
      setWarningCount(newWarningCount);
      
      let warningMessage = 'Your message contains content that is not allowed in this family space.';
      
      if (filterResult.wasAbusive) {
        warningMessage = 'Your message contains abusive or harmful language. Please communicate respectfully with your family members.';
      } else if (filterResult.flaggedWords.length > 0) {
        warningMessage = 'Your message contains profanity. Please edit your message and try again.';
      }
      
      // Apply 60-second cooldown on second warning
      if (newWarningCount >= 2) {
        const endTime = Date.now() + 60000;
        setCooldownEndTime(endTime);
        setCooldownRemaining(60);
        setWarningCount(0); // Reset warning count after cooldown applied
        
        toast({
          title: 'Cooldown activated',
          description: 'You must wait 60 seconds before sending another message. It seems like emotions are running high. Take a moment, and when you\'re ready, our Coaching tool can help you find the right words.',
          variant: 'destructive',
          action: {
            altText: "Go to Coaching",
            label: "Open Coaching",
            onClick: () => {
              // Switch to coaching tab
              const coachingTab = document.querySelector('[data-value="coaching"]') as HTMLElement;
              if (coachingTab) {
                coachingTab.click();
              }
            }
          }
        });
      } else {
        toast({
          title: 'Message not sent (Warning 1 of 2)',
          description: warningMessage,
          variant: 'destructive',
        });
      }
      return;
    }

    setIsSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          family_id: familyId,
          sender_id: user?.id,
          content: newMessage.trim(),
          was_filtered: false,
        });

      if (error) throw error;

      // Send push notifications to other family members
      const otherMemberIds = members
        .filter(m => m.user_id !== user?.id)
        .map(m => m.user_id);
      
      if (otherMemberIds.length > 0) {
        const currentMember = members.find(m => m.user_id === user?.id);
        const senderName = currentMember?.full_name || 'A family member';
        supabase.functions.invoke('send-push-notification', {
          body: {
            user_ids: otherMemberIds,
            title: `New message from ${senderName}`,
            body: newMessage.trim().substring(0, 100),
            type: 'message',
            data: { family_id: familyId }
          }
        }).catch(err => console.error('Push notification error:', err));
      }

      setNewMessage('');
      setWarningCount(0); // Reset warnings on successful send
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(requestAmount);
    if (isNaN(amount) || amount <= 0 || !requestReason) {
      toast({
        title: 'Invalid request',
        description: 'Please enter a valid amount and select a reason.',
        variant: 'destructive',
      });
      return;
    }

    // Require description for "Other"
    if (requestReason === 'Other' && !requestOtherDescription.trim()) {
      toast({
        title: 'Description required',
        description: 'Please provide a description for your request.',
        variant: 'destructive',
      });
      return;
    }

    // Check if there's an approved but not completed request
    const pendingApproved = financialRequests.find(
      r => r.status === 'approved' && !r.resolved_at
    );
    if (pendingApproved) {
      toast({
        title: 'Outstanding request',
        description: 'You have an approved request that hasn\'t been marked as completed yet. Please wait for a moderator to complete it before submitting a new request.',
        variant: 'destructive',
      });
      return;
    }

    setIsRequesting(true);
    try {
      let attachmentUrl: string | null = null;

      // Upload bill attachment if provided
      if (billAttachment && user) {
        const fileExt = billAttachment.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('bill-attachments')
          .upload(fileName, billAttachment);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error('Failed to upload bill attachment');
        }

        const { data: urlData } = supabase.storage
          .from('bill-attachments')
          .getPublicUrl(fileName);
        
        attachmentUrl = urlData.publicUrl;
      }

      const { error } = await supabase
        .from('financial_requests')
        .insert({
          family_id: familyId,
          requester_id: user?.id,
          amount,
          reason: requestReason === 'Other' 
            ? `Other: ${requestOtherDescription.trim()}` 
            : requestReason,
          attachment_url: attachmentUrl,
        });

      if (error) throw error;

      toast({
        title: 'Request submitted',
        description: 'Your financial request has been submitted for approval.',
      });

      setRequestAmount('');
      setRequestReason('');
      setRequestOtherDescription('');
      setBillAttachment(null);
      setBillPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      fetchFinancialRequests(members);
    } catch (error) {
      console.error('Error creating request:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit request.',
        variant: 'destructive',
      });
    } finally {
      setIsRequesting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file',
          description: 'Please select an image file (JPG, PNG, etc.)',
          variant: 'destructive',
        });
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please select an image under 5MB.',
          variant: 'destructive',
        });
        return;
      }
      setBillAttachment(file);
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setBillPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearAttachment = () => {
    setBillAttachment(null);
    setBillPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleVote = async (requestId: string, approved: boolean) => {
    try {
      const { error } = await supabase
        .from('financial_votes')
        .insert({
          request_id: requestId,
          voter_id: user?.id,
          approved,
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Already voted',
            description: 'You have already voted on this request.',
            variant: 'destructive',
          });
          return;
        }
        throw error;
      }

      toast({
        title: 'Vote recorded',
        description: `You voted to ${approved ? 'approve' : 'deny'} the request.`,
      });

      fetchFinancialRequests(members);
    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: 'Error',
        description: 'Failed to record vote.',
        variant: 'destructive',
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Fetch secure payment links via one-time token (only available once per payment action)
  const fetchPaymentLinksWithToken = async (requestId: string, token: string): Promise<PaymentLinks | null> => {
    try {
      const { data, error } = await supabase.rpc('get_payment_links_with_token', {
        _token: token,
      });
      
      if (error || !data || data.length === 0) {
        console.error('Error fetching payment links:', error);
        toast({
          title: 'Unable to retrieve payment links',
          description: 'The one-time access token may have expired. Please try marking as paid again.',
          variant: 'destructive',
        });
        return null;
      }
      
      const links: PaymentLinks = {
        paypal_link: data[0].paypal_link,
        venmo_link: data[0].venmo_link,
        cashapp_link: data[0].cashapp_link,
        token_used: true,
      };
      
      // Cache the links (they're single-use, but we can display them from cache)
      setPaymentLinksCache(prev => ({ ...prev, [requestId]: links }));
      return links;
    } catch (err) {
      console.error('Error fetching payment links:', err);
      return null;
    }
  };

  const handleMarkAsPaid = async (requestId: string, method: string) => {
    try {
      // First, generate a one-time access token for payment links
      const { data: tokenData, error: tokenError } = await supabase.rpc('generate_payment_access_token', {
        _request_id: requestId,
      });

      if (tokenError) {
        console.error('Error generating payment token:', tokenError);
        throw tokenError;
      }

      const accessToken = tokenData as string;

      // Mark the request as paid
      const { error } = await supabase
        .from('financial_requests')
        .update({
          paid_at: new Date().toISOString(),
          paid_by_user_id: user?.id,
          payment_method: method,
        })
        .eq('id', requestId);

      if (error) throw error;

      // Immediately fetch payment links using the one-time token
      if (accessToken) {
        await fetchPaymentLinksWithToken(requestId, accessToken);
      }

      toast({
        title: 'Marked as paid',
        description: 'Payment links shown below. The requester will need to confirm receipt.',
      });

      fetchFinancialRequests(members);
    } catch (error) {
      console.error('Error marking as paid:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark as paid.',
        variant: 'destructive',
      });
    }
  };

  const handleConfirmReceipt = async (requestId: string, hasAttachment: boolean) => {
    if (!hasAttachment) {
      toast({
        title: 'Receipt required',
        description: 'A bill or receipt must be attached before confirming payment.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('financial_requests')
        .update({
          payment_confirmed_at: new Date().toISOString(),
          payment_confirmed_by_user_id: user?.id,
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: 'Payment confirmed',
        description: 'Thank you for confirming the payment.',
      });

      fetchFinancialRequests(members);
    } catch (error) {
      console.error('Error confirming receipt:', error);
      toast({
        title: 'Error',
        description: 'Failed to confirm payment.',
        variant: 'destructive',
      });
    }
  };

  const handleCreatePledge = async (requestId: string, totalAmount: number) => {
    const pledgeAmount = parseFloat(pledgeAmounts[requestId] || '0');
    const pledgeMethod = pledgeMethods[requestId] || '';
    
    if (isNaN(pledgeAmount) || pledgeAmount <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid pledge amount.',
        variant: 'destructive',
      });
      return;
    }

    if (pledgeAmount > totalAmount) {
      toast({
        title: 'Amount too high',
        description: 'Pledge amount cannot exceed the request amount.',
        variant: 'destructive',
      });
      return;
    }

    setIsPledging(requestId);
    try {
      const { error } = await supabase
        .from('financial_pledges')
        .insert({
          request_id: requestId,
          user_id: user?.id,
          amount: pledgeAmount,
          payment_method: pledgeMethod || null,
        });

      if (error) throw error;

      toast({
        title: 'Pledge created',
        description: `You pledged $${pledgeAmount.toFixed(2)} to help with this request.`,
      });

      // Clear the inputs
      setPledgeAmounts(prev => ({ ...prev, [requestId]: '' }));
      setPledgeMethods(prev => ({ ...prev, [requestId]: '' }));
      fetchFinancialRequests(members);
    } catch (error) {
      console.error('Error creating pledge:', error);
      toast({
        title: 'Error',
        description: 'Failed to create pledge.',
        variant: 'destructive',
      });
    } finally {
      setIsPledging(null);
    }
  };

  const handleDeletePledge = async (pledgeId: string) => {
    try {
      const { error } = await supabase
        .from('financial_pledges')
        .delete()
        .eq('id', pledgeId);

      if (error) throw error;

      toast({
        title: 'Pledge removed',
        description: 'Your pledge has been removed.',
      });

      fetchFinancialRequests(members);
    } catch (error) {
      console.error('Error deleting pledge:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove pledge.',
        variant: 'destructive',
      });
    }
  };

  const handleRescindRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('financial_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: 'Request rescinded',
        description: 'Your financial request has been removed.',
      });

      fetchFinancialRequests(members);
    } catch (error) {
      console.error('Error rescinding request:', error);
      toast({
        title: 'Error',
        description: 'Failed to rescind request.',
        variant: 'destructive',
      });
    }
  };

  const handleMarkAsCompleted = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('financial_requests')
        .update({ resolved_at: new Date().toISOString() })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: 'Request completed',
        description: 'The financial request has been marked as completed.',
      });

      fetchFinancialRequests(members);
    } catch (error) {
      console.error('Error completing request:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark request as completed.',
        variant: 'destructive',
      });
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-secondary/20">
        <div className="relative">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg animate-pulse-soft overflow-hidden">
            <img src={familyBridgeLogo} alt="FamilyBridge" className="h-10 w-10 object-contain" />
          </div>
          <div className="absolute -inset-2 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl animate-ping opacity-50" />
        </div>
        <p className="mt-6 text-muted-foreground font-medium animate-fade-in">Loading your family...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20 flex flex-col">
      {/* Admin Breadcrumbs for super admins and provider admins */}
      <AdminBreadcrumbs />
      {/* Header with glass effect */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md shrink-0 sticky top-0 z-50 shadow-soft">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/dashboard')}
              className="hover:bg-primary/10 hover:text-primary transition-colors h-8 w-8 sm:h-10 sm:w-10"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              {/* Family Avatar with upload capability for admins */}
              <div className="relative shrink-0 group/avatar">
                {/* Hidden file input for gallery selection */}
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  id="family-avatar-upload"
                />
                {/* Hidden file input with capture attribute for iOS/iPadOS camera - prevents crashes */}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  id="family-avatar-camera-upload"
                />
                <button 
                  className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg hover:shadow-xl transition-all overflow-hidden relative"
                  onClick={(e) => {
                    if (isAdminOrModerator) {
                      e.stopPropagation();
                      // On iOS/iPadOS, use the native file picker with capture attribute to avoid crashes
                      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                                    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
                      if (isIOS) {
                        // Use native camera picker which is more reliable on iOS/iPadOS
                        const cameraInput = document.getElementById('family-avatar-camera-upload') as HTMLInputElement;
                        cameraInput?.click();
                      } else {
                        avatarInputRef.current?.click();
                      }
                    } else {
                      setMembersSheetOpen(true);
                    }
                  }}
                  title={isAdminOrModerator ? "Click to change family avatar" : family?.name || "Family"}
                >
                  {isUploadingAvatar ? (
                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                  ) : family?.avatar_url ? (
                    <img src={family.avatar_url} alt={family.name} className="h-full w-full object-cover" />
                  ) : organization?.logo_url ? (
                    <img src={organization.logo_url} alt={organization.name || 'Organization'} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-lg sm:text-xl font-bold text-white">
                      {family?.name?.charAt(0)?.toUpperCase() || 'F'}
                    </span>
                  )}
                  {isAdminOrModerator && !isUploadingAvatar && (
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                  )}
                </button>
                <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 h-3.5 w-3.5 sm:h-4 sm:w-4 bg-success rounded-full border-2 border-card flex items-center justify-center">
                  <span className="text-[6px] sm:text-[8px] text-white font-bold">{members.length}</span>
                </div>
              </div>
              
              {/* Family name and info */}
              <button 
                className="text-left min-w-0 hover:opacity-80 transition-all"
                onClick={() => setMembersSheetOpen(true)}
              >
                <div className="flex items-center gap-1 sm:gap-2">
                  <h1 className="font-display font-semibold text-foreground text-sm sm:text-lg hover:text-primary transition-colors truncate max-w-[120px] sm:max-w-none">
                    {family?.name}
                  </h1>
                  {familyId && <FamilyHealthBadge familyId={familyId} />}
                </div>
                {organization && family?.organization_id ? (
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate max-w-[120px] sm:max-w-none">
                    {organization.name}
                  </p>
                ) : null}
              </button>
            </div>
            <div className="ml-auto flex items-center gap-1 sm:gap-3">
              {/* Sobriety Counter Badge in Header */}
              {headerJourney && (
                <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-primary/10 rounded-full border border-primary/20">
                  <Flame className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                  <span className="font-bold text-primary text-xs sm:text-sm">{headerDaysCount}</span>
                  <span className="text-[10px] sm:text-xs text-muted-foreground">days sober</span>
                </div>
              )}
              
              <div className="hidden sm:block">
                {familyId && (
                  <TemporaryModeratorRequest 
                    familyId={familyId} 
                    hasOrganization={!!family?.organization_id} 
                  />
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPrivateMessagingOpen(true)}
                title="Private Messages"
                className="relative hover:bg-primary/10 hover:text-primary transition-colors h-8 w-8 sm:h-10 sm:w-10"
              >
                <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
                {unreadPrivateMessages > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] sm:text-xs font-medium notification-pulse">
                    {unreadPrivateMessages > 9 ? '9+' : unreadPrivateMessages}
                  </span>
                )}
              </Button>
              {isAdminOrModerator && (
                <Badge className="bg-gradient-to-r from-primary to-accent text-white border-0 shadow-md text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
                  <Shield className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                  <span className="hidden sm:inline">{currentUserRole === 'moderator' ? 'Moderator' : 'Admin'}</span>
                  <span className="sm:hidden">{currentUserRole === 'moderator' ? 'Mod' : 'Adm'}</span>
                </Badge>
              )}
              <NotificationBell />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-1.5 sm:px-4 py-1.5 sm:py-4 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="mb-2 sm:mb-4 shrink-0 bg-card/50 backdrop-blur-sm border border-border/50 p-1.5 sm:p-2 rounded-lg sm:rounded-xl shadow-soft">
            {/* Primary tabs (always visible) */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Chat Tab */}
              <button 
                onClick={() => setActiveTab('messages')}
                className={`relative flex items-center justify-center gap-1 px-3 py-2.5 rounded-md sm:rounded-lg transition-all duration-200 ${
                  activeTab === 'messages' 
                    ? 'bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20' 
                    : 'hover:bg-muted'
                }`}
              >
                <MessageCircle className="h-4 w-4" />
                <span className="text-xs">Chat</span>
                {showOnboarding && onboardingStep === 1 && (
                  <div className="absolute -top-1 -right-1 h-3 w-3 bg-accent rounded-full animate-bounce border-2 border-card" />
                )}
              </button>
              
              {/* Check-in Tab */}
              <button 
                onClick={() => setActiveTab('checkin')}
                className={`flex items-center justify-center gap-1 px-3 py-2.5 rounded-md sm:rounded-lg transition-all duration-200 ${
                  activeTab === 'checkin' 
                    ? 'bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20' 
                    : 'hover:bg-muted'
                }`}
              >
                <MapPin className="h-4 w-4" />
                <span className="text-xs">Check-in</span>
              </button>
              
              {/* Boundaries Tab */}
              <button 
                onClick={() => setActiveTab('boundaries')}
                className={`relative flex items-center justify-center gap-1 px-3 py-2.5 rounded-md sm:rounded-lg transition-all duration-200 ${
                  activeTab === 'boundaries' 
                    ? 'bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20' 
                    : 'hover:bg-muted'
                }`}
              >
                <ShieldCheck className="h-4 w-4" />
                <span className="text-xs">Boundaries</span>
                {showOnboarding && onboardingStep === 3 && (
                  <div className="absolute -top-1 -right-1 h-3 w-3 bg-accent rounded-full animate-bounce border-2 border-card" />
                )}
              </button>
              
              {/* Goals Tab */}
              <button 
                onClick={() => setActiveTab('values')}
                className={`relative flex items-center justify-center gap-1 px-3 py-2.5 rounded-md sm:rounded-lg transition-all duration-200 ${
                  activeTab === 'values' 
                    ? 'bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20' 
                    : 'hover:bg-muted'
                }`}
              >
                <Target className="h-4 w-4" />
                <span className="text-xs">Goals</span>
                {showOnboarding && onboardingStep === 2 && (
                  <div className="absolute -top-1 -right-1 h-3 w-3 bg-accent rounded-full animate-bounce border-2 border-card" />
                )}
              </button>
              
              {/* Coaching Tab */}
              <button 
                onClick={() => setActiveTab('coaching')}
                className={`flex items-center justify-center gap-1 px-3 py-2.5 rounded-md sm:rounded-lg transition-all duration-200 ${
                  activeTab === 'coaching' 
                    ? 'bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20' 
                    : 'hover:bg-muted'
                }`}
              >
                <PhoneCall className="h-4 w-4" />
                <span className="text-xs">Coaching</span>
              </button>
              
              {/* More... Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center justify-center gap-1 px-3 py-2.5 rounded-md sm:rounded-lg transition-all duration-200 hover:bg-muted text-muted-foreground hover:text-foreground">
                    <span className="text-xs">More...</span>
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setActiveTab('financial')} className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Financial
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveTab('aftercare')} className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" />
                    Aftercare
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveTab('test-results')} className="flex items-center gap-2">
                    <FlaskConical className="h-4 w-4" />
                    Tests
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveTab('medications')} className="flex items-center gap-2">
                    <Pill className="h-4 w-4" />
                    Medications
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveTab('docs')} className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4" />
                    Documents
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* FIIS Tab - kept as is, only visible to non-recovering members */}
              {currentUserRole !== 'recovering' && (
                <button 
                  onClick={() => setActiveTab('fiis')}
                  className={`relative flex items-center justify-center gap-1 px-3 py-2.5 rounded-md sm:rounded-lg transition-all duration-200 ${
                    activeTab === 'fiis' 
                      ? 'bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20' 
                      : 'hover:bg-muted'
                  }`}
                >
                  <Brain className="h-4 w-4" />
                  <span className="text-xs">FIIS</span>
                  {hasNewAnalysis && (
                    <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 h-2.5 w-2.5 sm:h-3 sm:w-3 bg-destructive rounded-full animate-pulse border-2 border-card" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Messages Tab */}
          <TabsContent value="messages" className="flex-1 flex flex-col overflow-hidden mt-0">
            {/* Contextual Coaching Nudge */}
            {showCoachingNudge && (
              <div className="mb-4 p-3 bg-gradient-to-r from-accent/10 to-primary/10 border border-accent/20 rounded-xl flex items-center gap-3 animate-slide-down">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center shrink-0">
                  <PhoneCall className="h-4 w-4 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Need help with what to say?</p>
                  <p className="text-xs text-muted-foreground">Our coaching tools can help you communicate more effectively.</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button 
                    size="sm" 
                    className="bg-gradient-to-r from-accent to-primary text-white"
                    onClick={() => setActiveTab('coaching')}
                  >
                    Try Coaching →
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => setShowCoachingNudge(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            
            {/* Stats Cards for Messages */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-3 mb-2 sm:mb-4 shrink-0">
              <Card className="relative overflow-hidden border-0 shadow-md group hover:shadow-lg transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-success/5 via-transparent to-success/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-2 sm:pt-4 sm:pb-4 sm:px-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-success/20 to-emerald-300/30 flex items-center justify-center shrink-0">
                      <Users className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
                      <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 h-2 w-2 sm:h-3 sm:w-3 bg-success rounded-full animate-pulse border-2 border-card" />
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">Online</p>
                      <p className="text-lg sm:text-xl font-bold text-success">{onlineMembers.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 shadow-md group hover:shadow-lg transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-success/5 via-transparent to-success/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-2 sm:pt-4 sm:pb-4 sm:px-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-success/20 to-success/30 flex items-center justify-center shrink-0">
                      <Users className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">Members</p>
                      <p className="text-lg sm:text-xl font-bold text-success">{members.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="relative overflow-hidden border-0 shadow-md group hover:shadow-lg transition-all duration-300 cursor-pointer"
                onClick={() => setPrivateMessagingOpen(true)}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-2 sm:pt-4 sm:pb-4 sm:px-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-accent/20 to-accent/30 flex items-center justify-center shrink-0">
                      <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">Private</p>
                      {unreadPrivateMessages > 0 ? (
                        <p className="text-lg sm:text-xl font-bold text-accent">{unreadPrivateMessages}</p>
                      ) : (
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">No unread</p>
                      )}
                    </div>
                  </div>
                  {unreadPrivateMessages > 0 && (
                    <Badge className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-destructive text-destructive-foreground text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 notification-pulse">
                      {unreadPrivateMessages > 9 ? '9+' : unreadPrivateMessages}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="flex-1 flex flex-col overflow-hidden border-0 shadow-lg card-enter">
              <div className="h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500" />
              {/* Week Navigation Bar */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-muted/30">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigateWeek('prev')}
                  className="h-8 px-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">Previous</span>
                </Button>
                
                <div className="flex items-center gap-2">
                  {!isCurrentWeek && (
                    <Badge variant="secondary" className="text-xs">
                      <Archive className="h-3 w-3 mr-1" />
                      Archive
                    </Badge>
                  )}
                  <span className="text-sm font-medium text-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {getWeekLabel()}
                  </span>
                  {!isCurrentWeek && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={goToCurrentWeek}
                      className="h-7 text-xs"
                    >
                      Current Week
                    </Button>
                  )}
                </div>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigateWeek('next')}
                  disabled={isCurrentWeek}
                  className="h-8 px-2"
                >
                  <span className="hidden sm:inline mr-1">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {/* Show moderator disclaimer for self-created families with professional moderators */}
                  {moderatorDisclaimer?.shown && !family?.organization_id && (
                    <ModeratorDisclaimer moderatorName={moderatorDisclaimer.moderatorName} />
                  )}
                  
                  {/* Show liquor license warnings */}
                  {familyId && (
                    <LiquorLicenseWarnings 
                      familyId={familyId}
                      members={members.map(m => ({ user_id: m.user_id, full_name: m.full_name }))}
                      isAdminOrModerator={isAdminOrModerator}
                    />
                  )}
                  
                  {messages.length === 0 ? (
                    <div className="text-center py-12 animate-fade-in">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        {isCurrentWeek ? (
                          <MessageCircle className="h-8 w-8 text-primary animate-pulse-soft" />
                        ) : (
                          <Archive className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <h3 className="font-display font-semibold text-foreground mb-1">
                        {isCurrentWeek ? 'No messages yet' : 'No messages this week'}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {isCurrentWeek 
                          ? 'Start the conversation with your family!' 
                          : 'There were no messages during this week.'}
                      </p>
                    </div>
                  ) : (
                    messages.map((msg, index) => (
                      <div
                        key={msg.id}
                        className={`flex gap-3 message-bubble ${msg.sender_id === user?.id ? 'flex-row-reverse' : ''}`}
                        style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s` }}
                      >
                        <Avatar className="h-9 w-9 shrink-0 shadow-md ring-2 ring-background">
                          <AvatarFallback 
                            className="text-xs text-white font-medium"
                            style={
                              organization?.primary_color
                                ? { background: `linear-gradient(135deg, hsl(${organization.primary_color}), hsl(${organization.primary_color} / 0.8))` }
                                : { background: 'linear-gradient(135deg, hsl(var(--primary) / 0.8), hsl(var(--accent) / 0.8))' }
                            }
                          >
                            {getInitials(msg.sender_name || '')}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`max-w-[70%] ${msg.sender_id === user?.id ? 'items-end' : ''}`}>
                          <div className={`flex items-center gap-2 mb-1 ${msg.sender_id === user?.id ? 'justify-end' : ''}`}>
                            <span className="text-xs font-medium text-foreground">
                              {msg.sender_name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(msg.created_at), 'h:mm a')}
                            </span>
                            {msg.was_filtered && (
                              <AlertTriangle className="h-3 w-3 text-warning" />
                            )}
                          </div>
                          <div
                            className={`rounded-2xl px-4 py-2.5 shadow-sm ${
                              msg.sender_id === user?.id
                                ? 'text-white rounded-tr-sm'
                                : 'bg-card border border-border/50 text-card-foreground rounded-tl-sm'
                            }`}
                            style={
                              msg.sender_id === user?.id
                                ? organization?.primary_color
                                  ? { background: `linear-gradient(135deg, hsl(${organization.primary_color}), hsl(${organization.primary_color} / 0.85))` }
                                  : { background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.9))' }
                                : undefined
                            }
                          >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              {/* Message Input - only show for current week */}
              {isCurrentWeek ? (
                <form onSubmit={handleSendMessage} className="p-4 border-t-2 border-border shrink-0 bg-card shadow-lg">
                  {cooldownRemaining > 0 && (
                    <div className="mb-3 p-3 bg-destructive/10 border border-destructive/20 rounded-xl animate-scale-in">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        <span className="text-sm text-destructive">
                          Cooldown active: {cooldownRemaining} seconds remaining
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        It seems like emotions are running high. Take a moment, and when you're ready, our Coaching tool can help you find the right words.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          const coachingTab = document.querySelector('[data-value="coaching"]') as HTMLElement;
                          if (coachingTab) {
                            coachingTab.click();
                          }
                        }}
                      >
                        Open Coaching Tool
                      </Button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={cooldownRemaining > 0 ? "Please wait..." : "Type a message..."}
                      className="flex-1 bg-background border-2 border-border focus:border-primary transition-colors shadow-sm"
                      disabled={cooldownRemaining > 0}
                    />
                    <Button 
                      type="submit" 
                      disabled={isSending || !newMessage.trim() || cooldownRemaining > 0}
                      className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      {isSending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : cooldownRemaining > 0 ? (
                        <span className="text-xs">{cooldownRemaining}s</span>
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <ConversationStarters 
                      onSelect={(prompt) => setNewMessage(prompt)}
                      disabled={cooldownRemaining > 0}
                    />
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Messages are permanent
                    </p>
                  </div>
                  
                  {/* AI Communication Helper */}
                  <div className="mt-3">
                    <CommunicationHelper 
                      familyId={familyId!}
                      onUseSuggestion={(text) => setNewMessage(text)}
                    />
                  </div>
                </form>
              ) : (
                <div className="p-4 border-t border-border/50 shrink-0 bg-muted/30">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Archive className="h-4 w-4" />
                    <span className="text-sm">Viewing archived messages. Return to current week to send messages.</span>
                    <Button 
                      variant="link" 
                      size="sm" 
                      onClick={goToCurrentWeek}
                      className="text-primary p-0 h-auto"
                    >
                      Go to current week
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Check-in Tab */}
          <TabsContent value="checkin" className="flex-1 overflow-auto mt-0">
            <div className="space-y-4">

              {/* Sobriety Day Counter - prominent for recovering members */}
              {familyId && (
                <SobrietyCounter 
                  familyId={familyId}
                  isRecoveringMember={currentUserRole === 'recovering'}
                  canEdit={isAdminOrModerator}
                />
              )}

              {/* Location Check-in Response (for recovering members) */}
              <LocationCheckinResponse 
                familyId={familyId!}
                userRole={currentUserRole}
              />
              
              {/* Shared Location Capture Card */}
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
                  <LocationCapture 
                    onLocationCaptured={setCapturedLocation}
                  />
                </CardContent>
              </Card>
              
              {/* Location Check-in Request (for family members) */}
              <LocationCheckinRequest 
                familyId={familyId!}
                userRole={currentUserRole}
                isProfessionalModerator={isCurrentUserProfessionalModerator}
                excludeUserIds={professionalModeratorIds}
              />
              
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
                      <MeetingFinder />
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
              
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
                      <TabbedCheckin 
                        familyId={familyId!} 
                        onCheckinComplete={() => {
                          setCheckinRefreshKey(k => k + 1);
                          setCapturedLocation(null);
                        }}
                        capturedLocation={capturedLocation}
                        hideCard
                      />
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
              
              {/* Meeting Checkout - appears when user has pending checkout */}
              <MeetingCheckout 
                familyId={familyId!}
                onCheckoutComplete={() => {
                  setCheckinRefreshKey(k => k + 1);
                }}
              />
              
              <CheckinHistory 
                familyId={familyId!} 
                members={members.map(m => ({ user_id: m.user_id, full_name: m.full_name }))}
                refreshKey={checkinRefreshKey}
                currentUserId={user?.id}
                isModerator={isAdminOrModerator}
              />
            </div>
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial" className="flex-1 overflow-auto mt-0">
            <div className="space-y-4">
              {/* Create Request - Enhanced (hidden from professional moderators) */}
              {!isCurrentUserProfessionalModerator && (
              <Card className="card-interactive overflow-hidden border-0 shadow-lg group">
                <div className="h-1.5 bg-gradient-to-r from-success via-primary to-accent" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-success/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <CardHeader className="pb-3 relative">
                  <CardTitle className="flex items-center gap-3 text-xl font-display">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-success/20 via-primary/20 to-accent/20 flex items-center justify-center shadow-inner">
                      <DollarSign className="h-6 w-6 text-success" />
                    </div>
                    <div>
                      <span className="bg-gradient-to-r from-success via-primary to-accent bg-clip-text text-transparent">
                        Request Financial Support
                      </span>
                      <p className="text-sm font-normal text-muted-foreground mt-0.5">
                        Submit a request for family review
                      </p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  {/* Warning for outstanding approved request */}
                  {financialRequests.some(r => r.status === 'approved' && !r.resolved_at) && (
                    <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-warning/10 to-orange-100/50 dark:from-warning/20 dark:to-orange-900/20 border border-warning/30 flex items-start gap-3">
                      <div className="h-10 w-10 rounded-xl bg-warning/20 flex items-center justify-center shrink-0">
                        <AlertTriangle className="h-5 w-5 text-warning" />
                      </div>
                      <div className="text-sm">
                        <p className="font-semibold text-warning">Outstanding Request Pending</p>
                        <p className="text-muted-foreground mt-0.5">
                          There's an approved request awaiting completion. New requests are paused until it's resolved.
                        </p>
                      </div>
                    </div>
                  )}
                  <form onSubmit={handleCreateRequest} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                          <DollarSign className="h-3 w-3" /> Amount
                        </Label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={requestAmount}
                          onChange={(e) => setRequestAmount(e.target.value)}
                          min="0"
                          step="0.01"
                          className="bg-background/80 h-11 text-lg font-semibold"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground">Reason</Label>
                        <Select value={requestReason} onValueChange={setRequestReason}>
                          <SelectTrigger className="bg-background/80 h-11">
                            <SelectValue placeholder="Select a reason" />
                          </SelectTrigger>
                          <SelectContent className="bg-background z-50">
                            {REQUEST_REASONS.map((reason) => (
                              <SelectItem key={reason} value={reason}>
                                {reason}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Other description field */}
                    {requestReason === 'Other' && (
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground">
                          Description (required)
                        </Label>
                        <Textarea
                          placeholder="Please describe what this request is for..."
                          value={requestOtherDescription}
                          onChange={(e) => setRequestOtherDescription(e.target.value)}
                          className="min-h-[80px] bg-background/80"
                        />
                      </div>
                    )}
                    
                    {/* Bill Attachment with Camera and AI Clarity Check */}
                    <BillReceiptCapture
                      onImageCapture={(file, preview) => {
                        setBillAttachment(file);
                        setBillPreview(preview);
                      }}
                      onClear={clearAttachment}
                      preview={billPreview}
                      requestCategory={requestReason || undefined}
                    />

                    <Button 
                      type="submit" 
                      disabled={isRequesting} 
                      className="w-full h-12 text-base font-semibold bg-gradient-to-r from-success via-primary to-accent hover:opacity-90 transition-opacity shadow-lg"
                    >
                      {isRequesting ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="h-5 w-5 mr-2" />
                          Submit Request for Approval
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
              )}

              {/* Financial Summary - Lifetime Totals */}
              <div className="grid grid-cols-2 gap-3">
                {/* Total Requested - Lifetime */}
                <Card className="relative overflow-hidden border-0 shadow-md group hover:shadow-lg transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
                        <DollarSign className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Total Requested</p>
                        <p className="text-xl font-bold text-foreground">
                          ${lifetimeTotals.requested.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Lifetime history</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Total Given - Lifetime */}
                <Card className="relative overflow-hidden border-0 shadow-md group hover:shadow-lg transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-success/5 via-transparent to-success/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute top-0 right-0 w-20 h-20 bg-success/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-success/20 to-success/30 flex items-center justify-center shrink-0">
                        <Heart className="h-5 w-5 text-success" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Total Given</p>
                        <p className="text-xl font-bold text-success">
                          ${lifetimeTotals.given.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Lifetime history</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* True Link Financial - Only for admins and recovering members */}
              {(currentUserRole === 'admin' || currentUserRole === 'recovering') && (
                <Card className="relative overflow-hidden border-0 shadow-lg group">
                  <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                  <CardHeader className="pb-3 relative">
                    <CardTitle className="flex items-center gap-3 text-lg font-display">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/20 via-indigo-500/20 to-purple-500/20 flex items-center justify-center shadow-inner">
                        <Shield className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                          True Link Financial
                        </span>
                        <p className="text-xs font-normal text-muted-foreground mt-0.5">
                          Protected payment cards for recovery
                        </p>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative space-y-4">
                    <p className="text-sm text-muted-foreground">
                      True Link offers prepaid Visa cards with customizable spending controls, 
                      designed to protect individuals in recovery while building financial independence.
                    </p>
                    <div className="grid gap-2 text-xs text-muted-foreground">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                        <span>Block purchases at liquor stores, casinos, and other risky merchants</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                        <span>Set daily, weekly, or monthly spending limits</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                        <span>Family members can fund the card directly</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                        <span>Real-time transaction notifications for transparency</span>
                      </div>
                    </div>
                    <a 
                      href="https://www.truelinkfinancial.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Button 
                        className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-90 transition-opacity"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Learn More & Set Up True Link
                      </Button>
                    </a>
                    <p className="text-[10px] text-muted-foreground text-center">
                      External service • Not affiliated with FamilyBridge
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Requests List with Month Navigation */}
              <Card className="border-0 shadow-lg overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-primary via-accent to-success" />
                <CardHeader className="pb-3 bg-gradient-to-b from-muted/30 to-transparent">
                  <CardTitle className="flex flex-col gap-3">
                    <div className="flex items-center justify-between text-lg font-display">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                          <TrendingUp className="h-4 w-4 text-primary" />
                        </div>
                        {isCurrentMonth ? 'Active Requests' : 'Archived Requests'}
                      </div>
                      <Badge variant="secondary" className="text-xs font-normal">
                        {financialRequests.length} {isCurrentMonth ? 'active' : 'archived'}
                      </Badge>
                    </div>
                    
                    {/* Month Navigation */}
                    <div className="flex items-center justify-between bg-muted/50 rounded-lg p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigateMonth('prev')}
                        className="h-8 px-2"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Previous</span>
                      </Button>
                      
                      <div className="flex items-center gap-2">
                        <Archive className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{getMonthLabel()}</span>
                        {!isCurrentMonth && (
                          <Button
                            variant="link"
                            size="sm"
                            onClick={goToCurrentMonth}
                            className="text-xs text-primary h-auto p-0 ml-2"
                          >
                            Back to Current
                          </Button>
                        )}
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigateMonth('next')}
                        disabled={isCurrentMonth}
                        className="h-8 px-2"
                      >
                        <span className="hidden sm:inline">Next</span>
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {financialRequests.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                        {isCurrentMonth ? (
                          <DollarSign className="h-8 w-8 opacity-40" />
                        ) : (
                          <Archive className="h-8 w-8 opacity-40" />
                        )}
                      </div>
                      <p className="font-medium">
                        {isCurrentMonth ? 'No financial requests yet' : 'No archived requests for this month'}
                      </p>
                      <p className="text-sm mt-1">
                        {isCurrentMonth ? 'Create a request above to get started' : 'Try navigating to a different month'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {financialRequests.map((req) => {
                        const hasVoted = req.votes.some(v => v.voter_id === user?.id);
                        const approvalCount = req.votes.filter(v => v.approved).length;
                        const denialCount = req.votes.filter(v => !v.approved).length;
                        const isApproved = req.status === 'approved';
                        const isPaid = !!req.paid_at;
                        const isConfirmed = !!req.payment_confirmed_at;
                        const isCompleted = !!req.resolved_at;
                        const isRequester = req.requester_id === user?.id;
                        const isPayer = req.paid_by_user_id === user?.id;
                        const cachedLinks = paymentLinksCache[req.id];
                        const isClosed = isCompleted || req.status === 'denied';
                        const isExpanded = expandedRequests.has(req.id);

                        const toggleExpanded = () => {
                          setExpandedRequests(prev => {
                            const next = new Set(prev);
                            if (next.has(req.id)) {
                              next.delete(req.id);
                            } else {
                              next.add(req.id);
                            }
                            return next;
                          });
                        };

                        const statusColor = isCompleted 
                          ? 'from-blue-500 to-indigo-500' 
                          : req.status === 'approved' 
                            ? 'from-success to-emerald-500' 
                            : req.status === 'denied'
                              ? 'from-destructive to-rose-500'
                              : 'from-warning to-orange-400';
                        
                        const statusBgColor = isCompleted 
                          ? 'bg-blue-50 dark:bg-blue-950/30' 
                          : req.status === 'approved' 
                            ? 'bg-green-50 dark:bg-green-950/30' 
                            : req.status === 'denied'
                              ? 'bg-red-50 dark:bg-red-950/30'
                              : 'bg-amber-50 dark:bg-amber-950/30';

                        // Calculate funding progress
                        const totalPledged = req.pledges.reduce((sum, p) => sum + Number(p.amount), 0);
                        const fundingProgress = Math.min(100, (totalPledged / req.amount) * 100);

                        const CompactHeader = () => (
                          <div className="flex items-center justify-between w-full py-3">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <Avatar className="h-9 w-9 shrink-0 ring-2 ring-primary/10">
                                <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-semibold">
                                  {req.requester_name?.split(' ').map(n => n[0]).join('').slice(0,2) || '??'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-semibold truncate">{req.requester_name}</span>
                                  <Badge
                                    variant={req.status === 'approved' ? 'default' : req.status === 'denied' ? 'destructive' : 'secondary'}
                                    className={`text-[10px] px-2 py-0.5 shrink-0 ${
                                      isCompleted ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0' :
                                      req.status === 'approved' ? 'bg-gradient-to-r from-success to-emerald-500 text-white border-0' :
                                      req.status === 'denied' ? '' : 'bg-gradient-to-r from-warning/80 to-orange-400 text-white border-0'
                                    }`}
                                  >
                                    {isCompleted ? '✓ Completed' : req.status === 'approved' ? '✓ Approved' : req.status === 'denied' ? '✗ Denied' : '⏳ Pending'}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                  <span className="truncate">{req.reason}</span>
                                  {isCompleted && req.resolved_at && (
                                    <span className="shrink-0">• Completed {format(new Date(req.resolved_at), 'MMM d')}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <div className="text-right">
                                <span className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">${req.amount.toFixed(0)}</span>
                                {req.status === 'pending' && totalPledged > 0 && (
                                  <p className="text-[10px] text-muted-foreground">${totalPledged.toFixed(0)} pledged</p>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs">
                                <div className="flex items-center gap-0.5 text-success">
                                  <Check className="h-3.5 w-3.5" />
                                  <span className="font-medium">{approvalCount}</span>
                                </div>
                                <div className="flex items-center gap-0.5 text-destructive">
                                  <X className="h-3.5 w-3.5" />
                                  <span className="font-medium">{denialCount}</span>
                                </div>
                              </div>
                              {isClosed && (
                                <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                              )}
                            </div>
                          </div>
                        );

                        const FullContent = () => (
                          <div className="space-y-2">
                            {/* Rescind button for requester on pending requests with no votes */}
                            {isRequester && req.status === 'pending' && req.votes.length === 0 && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => handleRescindRequest(req.id)}
                              >
                                <X className="h-3 w-3 mr-1" />
                                Rescind
                              </Button>
                            )}
                            {isRequester && req.status === 'pending' && req.votes.length > 0 && (
                              <p className="text-[10px] text-muted-foreground">
                                Voting begun — cannot rescind
                              </p>
                            )}
                            {req.attachment_url && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <button className="flex items-center gap-1 text-xs text-primary hover:underline">
                                    <Image className="h-3 w-3" />
                                    View Bill/Receipt
                                  </button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Bill/Receipt</DialogTitle>
                                    <DialogDescription>
                                      Attached documentation for this request
                                    </DialogDescription>
                                  </DialogHeader>
                                  <img
                                    src={req.attachment_url}
                                    alt="Bill attachment"
                                    className="w-full max-h-[70vh] object-contain rounded-lg"
                                  />
                                </DialogContent>
                              </Dialog>
                            )}
                            
                            {/* Status badges */}
                            <div className="flex flex-wrap gap-1">
                              {isConfirmed && !isCompleted && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-green-600 border-green-600">
                                  <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                                  Paid
                                </Badge>
                              )}
                              {isPaid && !isConfirmed && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-yellow-600 border-yellow-600">
                                  <CreditCard className="h-2.5 w-2.5 mr-0.5" />
                                  Awaiting Confirm
                                </Badge>
                              )}
                              {req.payment_method && (
                                <span className="text-[10px] text-muted-foreground">via {req.payment_method}</span>
                              )}
                            </div>

                            {/* Voting buttons for pending requests (hidden from professional moderators) */}
                            {req.status === 'pending' && !isRequester && !hasVoted && !isCurrentUserProfessionalModerator && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="success"
                                  className="h-7 text-xs"
                                  onClick={() => handleVote(req.id, true)}
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-7 text-xs"
                                  onClick={() => handleVote(req.id, false)}
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Deny
                                </Button>
                              </div>
                            )}
                            {hasVoted && req.status === 'pending' && !isCurrentUserProfessionalModerator && (
                              <p className="text-[10px] text-muted-foreground">You've voted</p>
                            )}

                            {/* Pledges section */}
                            {req.status === 'pending' && (
                              <div className="border-t border-border pt-2 mt-2">
                                {/* Existing pledges */}
                                {req.pledges.length > 0 && (
                                  <div className="mb-2">
                                    <p className="text-xs font-medium text-foreground mb-1 flex items-center gap-1">
                                      <HandCoins className="h-3 w-3 text-primary" />
                                      Pledges (${req.pledges.reduce((sum, p) => sum + Number(p.amount), 0).toFixed(2)})
                                    </p>
                                    <div className="space-y-0.5">
                                      {req.pledges.map((pledge) => (
                                        <div key={pledge.id} className="flex items-center justify-between text-xs bg-secondary/50 px-2 py-0.5 rounded">
                                          <span className="truncate">
                                            {pledge.user_name}: ${Number(pledge.amount).toFixed(2)}
                                          </span>
                                          {pledge.user_id === user?.id && (
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                                              onClick={() => handleDeletePledge(pledge.id)}
                                            >
                                              <Trash2 className="h-2.5 w-2.5" />
                                            </Button>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Add pledge form (for non-requesters, excluding professional moderators) */}
                                {!isRequester && !isCurrentUserProfessionalModerator && (
                                  <div className="space-y-1">
                                    <p className="text-xs font-medium text-foreground">Pledge:</p>
                                    <div className="flex gap-1">
                                      <Input
                                        type="number"
                                        placeholder="$"
                                        value={pledgeAmounts[req.id] || ''}
                                        onChange={(e) => setPledgeAmounts(prev => ({ ...prev, [req.id]: e.target.value }))}
                                        min="0"
                                        step="0.01"
                                        className="w-16 h-7 text-xs"
                                      />
                                      <Select 
                                        value={pledgeMethods[req.id] || ''} 
                                        onValueChange={(value) => setPledgeMethods(prev => ({ ...prev, [req.id]: value }))}
                                      >
                                        <SelectTrigger className="w-24 h-7 text-xs bg-background">
                                          <SelectValue placeholder="Method" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-background z-50">
                                          <SelectItem value="PayPal">PayPal</SelectItem>
                                          <SelectItem value="Venmo">Venmo</SelectItem>
                                          <SelectItem value="Cash App">Cash App</SelectItem>
                                          <SelectItem value="Cash">Cash</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <Button
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() => handleCreatePledge(req.id, req.amount)}
                                        disabled={isPledging === req.id}
                                      >
                                        {isPledging === req.id ? (
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                          'Add'
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Payment section for approved requests */}
                            {isApproved && !isConfirmed && (
                              <div className="border-t border-border pt-2 mt-2">
                                {/* If not paid yet - show payment options to non-requesters (excluding professional moderators) */}
                                {!isPaid && !isRequester && !isCurrentUserProfessionalModerator && (
                                  <div className="space-y-1">
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button size="sm" variant="secondary" className="h-7 text-xs">
                                          <CreditCard className="h-3 w-3 mr-1" />
                                          Mark as Paid
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>Mark as Paid</DialogTitle>
                                          <DialogDescription>
                                            Select the payment method you used:
                                          </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid grid-cols-2 gap-2 mt-4">
                                          {['PayPal', 'Venmo', 'Cash App', 'Apple Cash', 'Zelle', 'Cash', 'Other'].map((method) => (
                                            <Button
                                              key={method}
                                              variant="outline"
                                              onClick={() => handleMarkAsPaid(req.id, method)}
                                            >
                                              {method}
                                            </Button>
                                          ))}
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  </div>
                                )}

                                {/* If paid by current user - show payment links fetched securely */}
                                {isPaid && isPayer && !isConfirmed && (
                                  <div className="space-y-1">
                                    <p className="text-xs font-medium">Complete Payment:</p>
                                    {cachedLinks ? (
                                      <div className="flex flex-wrap gap-1">
                                        {cachedLinks.paypal_link && (
                                          <a href={cachedLinks.paypal_link} target="_blank" rel="noopener noreferrer">
                                            <Button size="sm" variant="outline" className="h-6 text-[10px]">
                                              <ExternalLink className="h-2.5 w-2.5 mr-0.5" />PayPal
                                            </Button>
                                          </a>
                                        )}
                                        {cachedLinks.venmo_link && (
                                          <a href={cachedLinks.venmo_link} target="_blank" rel="noopener noreferrer">
                                            <Button size="sm" variant="outline" className="h-6 text-[10px]">
                                              <ExternalLink className="h-2.5 w-2.5 mr-0.5" />Venmo
                                            </Button>
                                          </a>
                                        )}
                                        {cachedLinks.cashapp_link && (
                                          <a href={cachedLinks.cashapp_link} target="_blank" rel="noopener noreferrer">
                                            <Button size="sm" variant="outline" className="h-6 text-[10px]">
                                              <ExternalLink className="h-2.5 w-2.5 mr-0.5" />CashApp
                                            </Button>
                                          </a>
                                        )}
                                      </div>
                                    ) : (
                                      <p className="text-[10px] text-muted-foreground italic">
                                        Payment links shown once when marked as paid
                                      </p>
                                    )}
                                  </div>
                                )}

                                {/* If paid - show confirm button to requester */}
                                {isPaid && isRequester && (
                                  <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">
                                      Payment via {req.payment_method}. Received?
                                    </p>
                                    {req.attachment_url ? (
                                      <Button
                                        size="sm"
                                        variant="success"
                                        className="h-7 text-xs"
                                        onClick={() => handleConfirmReceipt(req.id, !!req.attachment_url)}
                                      >
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        Confirm Receipt
                                      </Button>
                                    ) : (
                                      <p className="text-[10px] text-destructive">
                                        Attach bill first
                                      </p>
                                    )}
                                  </div>
                                )}

                                {/* Waiting messages */}
                                {isPaid && !isRequester && !isPayer && (
                                  <p className="text-[10px] text-muted-foreground">
                                    Awaiting confirmation
                                  </p>
                                )}
                                {!isPaid && isRequester && (
                                  <p className="text-[10px] text-muted-foreground">
                                    Awaiting payment
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Mark as Completed button for moderators on confirmed requests */}
                            {isApproved && isConfirmed && !isCompleted && isAdminOrModerator && (
                              <div className="border-t border-border pt-2 mt-2">
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="w-full h-7 text-xs"
                                  onClick={() => handleMarkAsCompleted(req.id)}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Mark Completed
                                </Button>
                              </div>
                            )}
                          </div>
                        );

                        if (isClosed) {
                          return (
                            <Collapsible key={req.id} open={isExpanded} onOpenChange={toggleExpanded}>
                              <div className={`rounded-xl border-0 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md ${statusBgColor}`}>
                                <div className={`h-1 bg-gradient-to-r ${statusColor}`} />
                                <CollapsibleTrigger className="w-full px-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                  <CompactHeader />
                                </CollapsibleTrigger>
                                <CollapsibleContent className="animate-accordion-down">
                                  <div className="px-4 pb-4 pt-1">
                                    <FullContent />
                                  </div>
                                </CollapsibleContent>
                              </div>
                            </Collapsible>
                          );
                        }

                        return (
                          <div
                            key={req.id}
                            className={`rounded-xl border-0 shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg animate-fade-in ${statusBgColor}`}
                          >
                            <div className={`h-1.5 bg-gradient-to-r ${statusColor}`} />
                            {/* Progress bar for pending requests */}
                            {req.status === 'pending' && totalPledged > 0 && (
                              <div className="px-4 pt-3">
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="text-muted-foreground">Funding Progress</span>
                                  <span className="font-medium text-primary">{fundingProgress.toFixed(0)}%</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out rounded-full"
                                    style={{ width: `${fundingProgress}%` }}
                                  />
                                </div>
                              </div>
                            )}
                            <div className="px-4 pb-4">
                              <CompactHeader />
                              <FullContent />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Values/Goals Tab */}
          <TabsContent value="values" className="mt-0 space-y-4 overflow-auto">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3">

              <Card className="relative overflow-hidden border-0 shadow-md group hover:shadow-lg transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-0 right-0 w-20 h-20 bg-accent/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-accent/20 to-accent/30 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Goals Achieved</p>
                      <p className="text-xl font-bold text-accent">{familyCommonGoals.filter(g => g.completed_at).length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-primary via-accent to-success" />
              <CardHeader className="pb-3 bg-gradient-to-b from-muted/30 to-transparent">
                <CardTitle className="flex items-center justify-between text-lg font-display">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <Target className="h-4 w-4 text-primary" />
                    </div>
                    Family Values & Goals
                  </div>
                  <Badge variant="secondary" className="text-xs font-normal">
                    {familyValues.length + familyCommonGoals.length} items
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Guiding Values Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-foreground">Guiding Values</h3>
                      {isAdminOrModerator && familyValues.length > 0 && !isEditingValues && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditingValues(true)}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Update Values
                        </Button>
                      )}
                    </div>
                    
                    {/* Intro message */}
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                      <p className="text-sm text-foreground">
                        <strong>Your family's guiding values</strong> are the foundation for every goal you set and every boundary you create. 
                        Choose <strong>two values</strong> that best represent where your family should focus right now. 
                        These can be revisited and updated as your family's needs evolve.
                      </p>
                    </div>

                    {/* Show current values if set and not editing */}
                    {familyValues.length > 0 && !isEditingValues ? (
                      <div className="flex flex-wrap gap-2">
                        {familyValues.map(fv => {
                          const valueOption = FAMILY_VALUES_OPTIONS.find(v => v.key === fv.value_key);
                          const isCustom = fv.value_key.startsWith('custom_');
                          const displayName = valueOption ? valueOption.name : (isCustom ? fv.value_key.replace('custom_', '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : fv.value_key);
                          return (
                            <div
                              key={fv.id}
                              className="px-3 py-2 rounded-lg bg-primary/10 border border-primary flex items-center gap-2"
                            >
                              <Sparkles className="h-4 w-4 text-primary shrink-0" />
                              <span className="font-medium text-sm text-foreground">{displayName}</span>
                              {isCustom && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">Custom</Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* Selection mode */
                      isAdminOrModerator || isEditingValues || familyValues.length === 0 ? (
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground">
                            {isAdminOrModerator 
                              ? `Select 2 values (${selectedValues.length}/2 selected):`
                              : 'A family admin or moderator will select the guiding values for your family.'}
                          </p>
                          
                          {isAdminOrModerator && (
                            <>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {FAMILY_VALUES_OPTIONS.map(option => {
                                  const isSelected = selectedValues.includes(option.key);
                                  return (
                                    <button
                                      key={option.key}
                                      onClick={() => handleToggleValue(option.key)}
                                      className={`px-3 py-2 rounded-lg border text-left transition-all text-sm ${
                                        isSelected 
                                          ? 'bg-primary/10 border-primary' 
                                          : 'bg-secondary/50 border-border hover:border-primary/50'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <Sparkles className={`h-3 w-3 shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                                        <span className={`font-medium ${isSelected ? 'text-foreground' : 'text-foreground/80'}`}>
                                          {option.name}
                                        </span>
                                        {isSelected && (
                                          <CheckCircle className="h-3 w-3 text-primary ml-auto shrink-0" />
                                        )}
                                      </div>
                                    </button>
                                  );
                                })}
                                {/* Show selected custom values */}
                                {selectedValues.filter(v => v.startsWith('custom_')).map(customKey => (
                                  <button
                                    key={customKey}
                                    onClick={() => handleToggleValue(customKey)}
                                    className="px-3 py-2 rounded-lg border text-left transition-all text-sm bg-primary/10 border-primary"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Sparkles className="h-3 w-3 shrink-0 text-primary" />
                                      <span className="font-medium text-foreground">
                                        {customKey.replace('custom_', '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                      </span>
                                      <Badge variant="outline" className="text-[10px] px-1">Custom</Badge>
                                      <CheckCircle className="h-3 w-3 text-primary ml-auto shrink-0" />
                                    </div>
                                  </button>
                                ))}
                              </div>
                              
                              {/* Custom Value Input */}
                              {isAddingCustomValue ? (
                                <div className="flex gap-2 items-center p-3 rounded-lg border border-dashed border-primary/50 bg-primary/5">
                                  <Input
                                    value={customValueInput}
                                    onChange={(e) => setCustomValueInput(e.target.value)}
                                    placeholder="Enter your custom value..."
                                    className="flex-1"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustomValue()}
                                  />
                                  <Button size="sm" onClick={handleAddCustomValue} disabled={!customValueInput.trim()}>
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => { setIsAddingCustomValue(false); setCustomValueInput(''); }}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => setIsAddingCustomValue(true)}
                                  className="w-full border-dashed"
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Add Custom Value
                                </Button>
                              )}
                              
                              <div className="flex gap-2">
                                <Button
                                  onClick={handleSaveValues}
                                  disabled={selectedValues.length !== 2 || isSavingValues}
                                  size="sm"
                                  className="flex-1"
                                >
                                  {isSavingValues ? (
                                    <>
                                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                      Saving...
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Save Values
                                    </>
                                  )}
                                </Button>
                                {isEditingValues && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setIsEditingValues(false);
                                      setSelectedValues(familyValues.map(v => v.value_key));
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      ) : null
                    )}
                  </div>

                  {/* Common Goals Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-foreground">Common Goals</h3>
                      {isAdminOrModerator && familyCommonGoals.length > 0 && !isEditingCommonGoals && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditingCommonGoals(true)}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Update Goals
                        </Button>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      Select two of the goals from the list below or create custom goals for your family. Make sure the goals you create are measurable and have a path to achievement. If you need help, consult your moderator.
                    </p>

                    {/* Show current common goals if set and not editing */}
                    {familyCommonGoals.length > 0 && !isEditingCommonGoals ? (
                      <div className="grid gap-3">
                        {familyCommonGoals.map(fg => {
                          const goalOption = COMMON_GOALS_OPTIONS.find(g => g.key === fg.goal_key);
                          const isCustom = fg.goal_key.startsWith('custom_');
                          const displayName = goalOption ? goalOption.name : (isCustom ? fg.goal_key.replace('custom_', '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : fg.goal_key);
                          return (
                            <div
                              key={fg.id}
                              className={`px-4 py-3 rounded-xl border transition-all ${
                                fg.completed_at 
                                  ? 'bg-success/10 border-success/30' 
                                  : 'bg-secondary/50 border-border hover:border-primary/30'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                {isAdminOrModerator ? (
                                  <button
                                    onClick={() => handleToggleCommonGoalComplete(fg.id, !!fg.completed_at)}
                                    className={`shrink-0 h-5 w-5 mt-0.5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                      fg.completed_at
                                        ? 'bg-success border-success text-success-foreground'
                                        : 'border-muted-foreground hover:border-primary'
                                    }`}
                                  >
                                    {fg.completed_at && <Check className="h-3 w-3" />}
                                  </button>
                                ) : (
                                  <div
                                    className={`shrink-0 h-5 w-5 mt-0.5 rounded-full border-2 flex items-center justify-center ${
                                      fg.completed_at
                                        ? 'bg-success border-success text-success-foreground'
                                        : 'border-muted-foreground'
                                    }`}
                                  >
                                    {fg.completed_at && <Check className="h-3 w-3" />}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`text-sm font-semibold ${fg.completed_at ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                      {displayName}
                                    </span>
                                    {isCustom && (
                                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">Custom</Badge>
                                    )}
                                  </div>
                                  {goalOption && (
                                    <p className="text-xs text-muted-foreground mt-1">{goalOption.description}</p>
                                  )}
                                  {goalOption && (
                                    <div className="flex items-center gap-2 mt-2">
                                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                        {goalOption.phase}
                                      </Badge>
                                      <span className="text-[10px] text-muted-foreground">
                                        Target: {goalOption.milestone}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                {fg.completed_at && (
                                  <Badge className="bg-success text-success-foreground shrink-0 text-xs">
                                    ✓ Achieved
                                  </Badge>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* Selection mode */
                      isAdminOrModerator || isEditingCommonGoals || familyCommonGoals.length === 0 ? (
                        <div className="space-y-3">
                          {isAdminOrModerator ? (
                            <>
                              <p className="text-sm text-muted-foreground">
                                Select 2 goals ({selectedCommonGoals.length}/2 selected):
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {COMMON_GOALS_OPTIONS.map(option => {
                                  const isSelected = selectedCommonGoals.includes(option.key);
                                  return (
                                    <button
                                      key={option.key}
                                      onClick={() => handleToggleCommonGoal(option.key)}
                                      className={`p-3 rounded-xl border text-left transition-all ${
                                        isSelected 
                                          ? 'bg-primary/10 border-primary' 
                                          : 'bg-secondary/50 border-border hover:border-primary/50'
                                      }`}
                                    >
                                      <div className="flex items-start gap-2">
                                        <Target className={`h-4 w-4 shrink-0 mt-0.5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                            <span className={`font-medium text-sm ${isSelected ? 'text-foreground' : 'text-foreground/80'}`}>
                                              {option.name}
                                            </span>
                                            {isSelected && (
                                              <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                                            )}
                                          </div>
                                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{option.description}</p>
                                          <div className="flex items-center gap-2 mt-2">
                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                              {option.phase}
                                            </Badge>
                                            <span className="text-[10px] text-muted-foreground">
                                              {option.milestone}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </button>
                                  );
                                })}
                                {/* Show selected custom goals */}
                                {selectedCommonGoals.filter(g => g.startsWith('custom_')).map(customKey => (
                                  <button
                                    key={customKey}
                                    onClick={() => handleToggleCommonGoal(customKey)}
                                    className="p-3 rounded-xl border text-left transition-all bg-primary/10 border-primary"
                                  >
                                    <div className="flex items-start gap-2">
                                      <Target className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium text-sm text-foreground">
                                            {customKey.replace('custom_', '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                          </span>
                                          <Badge variant="outline" className="text-[10px] px-1">Custom</Badge>
                                          <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                                        </div>
                                      </div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                              
                              {/* Custom Goal Input */}
                              {isAddingCustomGoal ? (
                                <div className="flex gap-2 items-center p-3 rounded-lg border border-dashed border-primary/50 bg-primary/5">
                                  <Input
                                    value={customGoalInput}
                                    onChange={(e) => setCustomGoalInput(e.target.value)}
                                    placeholder="Enter your custom goal..."
                                    className="flex-1"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustomGoal()}
                                  />
                                  <Button size="sm" onClick={handleAddCustomGoal} disabled={!customGoalInput.trim()}>
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => { setIsAddingCustomGoal(false); setCustomGoalInput(''); }}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => setIsAddingCustomGoal(true)}
                                  className="w-full border-dashed"
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Add Custom Goal
                                </Button>
                              )}
                              
                              <div className="flex gap-2">
                                <Button
                                  onClick={handleSaveCommonGoals}
                                  disabled={selectedCommonGoals.length !== 2 || isSavingCommonGoals}
                                  size="sm"
                                  className="flex-1"
                                >
                                  {isSavingCommonGoals ? (
                                    <>
                                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                      Saving...
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Save Goals
                                    </>
                                  )}
                                </Button>
                                {isEditingCommonGoals && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setIsEditingCommonGoals(false);
                                      setSelectedCommonGoals(familyCommonGoals.map(g => g.goal_key));
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                )}
                              </div>
                            </>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              A family moderator will select the common goals for your family.
                            </p>
                          )}
                        </div>
                      ) : null
                    )}

                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Boundaries Tab */}
          <TabsContent value="boundaries" className="mt-0 space-y-4 overflow-auto">
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
              <CardHeader className="flex flex-row items-center justify-between pb-3 bg-gradient-to-b from-muted/30 to-transparent">
                <CardTitle className="flex items-center gap-2 text-lg font-display">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                    <ShieldCheck className="h-4 w-4 text-indigo-600" />
                  </div>
                  Family Boundaries
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBoundaryForm(!showBoundaryForm)}
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0 hover:opacity-90"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Propose Boundary
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="boundaries-education" className="border rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-indigo-200/50 dark:border-indigo-800/50">
                      <AccordionTrigger className="px-4 py-3 text-sm font-semibold text-foreground hover:no-underline">
                        Understanding Boundaries
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 space-y-3">
                        <p className="text-sm text-foreground">
                          <strong>Boundaries are essential</strong> to the health and stability of your family system. They should be rooted in the values that your family and each individual holds dear—never created out of anger.
                        </p>
                        <p className="text-sm text-foreground">
                          When considering a boundary, ask yourself two fundamental questions:
                        </p>
                        <ol className="text-sm text-foreground list-decimal list-inside space-y-1 pl-2">
                          <li><strong>Have I enabled my loved one's addiction in any way?</strong> (Financially, Emotionally, or Silently)</li>
                          <li><strong>Has my loved one's addiction caused me harm in any way?</strong> (Financially, Emotionally or Physically)</li>
                        </ol>
                        <p className="text-sm text-foreground">
                          If the answer to either (or both) of these questions is yes, consider what changes <em>you</em> need to make in YOUR behavior to avoid enabling going forward and to eliminate the harm you've experienced because of the addiction.
                        </p>
                        <p className="text-sm text-foreground font-medium mt-3">
                          <strong>Important:</strong> Every boundary must have a consequence attached to it—both positive and negative. If a boundary doesn't have a consequence, it's not a boundary, it's a request. When family members violate a boundary, the stated consequence must be enforced for the boundary to have meaning.
                        </p>
                        <p className="text-sm text-muted-foreground italic">
                          All boundaries will be reviewed by the moderator or family admin before they need to be acknowledged by the group.
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  {/* New Boundary Form */}
                  {showBoundaryForm && (
                    <div className="p-4 rounded-lg bg-secondary/30 border border-border space-y-4">
                      <h3 className="font-medium text-foreground">Propose a New Boundary</h3>
                      <div className="space-y-2">
                        <Label htmlFor="boundaryTarget">Who does this boundary apply to?</Label>
                        <Select value={newBoundaryTarget} onValueChange={setNewBoundaryTarget}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select member..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Family Members</SelectItem>
                            {members.filter(m => m.user_id !== user?.id).map(member => (
                              <SelectItem key={member.user_id} value={member.user_id}>
                                {member.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="boundaryContent">Boundary Description</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowBoundaryTemplates(!showBoundaryTemplates)}
                            className="text-xs"
                          >
                            Use a Template
                          </Button>
                        </div>
                        
                        {showBoundaryTemplates && (
                          <div className="p-3 rounded-md bg-muted/50 border space-y-2">
                            <p className="text-xs text-muted-foreground mb-2">
                              These are starting points — customize them for your family's situation.
                            </p>
                            <div className="space-y-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-2 text-left justify-start whitespace-normal text-xs"
                                onClick={() => {
                                  setNewBoundaryContent("If [loved one] uses drugs or alcohol, then the following consequence will occur:");
                                  setNewBoundaryConsequence("I will not provide financial support until they complete 30 days of documented sobriety");
                                  setShowBoundaryTemplates(false);
                                }}
                              >
                                "If [loved one] uses drugs or alcohol, then [consequence for substance use]"
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-2 text-left justify-start whitespace-normal text-xs"
                                onClick={() => {
                                  setNewBoundaryContent("If [loved one] misses a recovery meeting without a valid reason, then we will address this concern:");
                                  setNewBoundaryConsequence("We will have a family discussion about their commitment to recovery within 24 hours");
                                  setShowBoundaryTemplates(false);
                                }}
                              >
                                "If [loved one] misses a recovery meeting without a valid reason, then [consequence for missed meetings]"
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-2 text-left justify-start whitespace-normal text-xs"
                                onClick={() => {
                                  setNewBoundaryContent("If [loved one] becomes verbally abusive, then I will protect my emotional wellbeing:");
                                  setNewBoundaryConsequence("I will leave the room/conversation immediately and we will revisit the discussion when everyone is calm");
                                  setShowBoundaryTemplates(false);
                                }}
                              >
                                "If [loved one] becomes verbally abusive, then [consequence for verbal abuse]"
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-2 text-left justify-start whitespace-normal text-xs"
                                onClick={() => {
                                  setNewBoundaryContent("If [loved one] asks for money without accountability, then financial decisions will be handled systematically:");
                                  setNewBoundaryConsequence("The request will go through our family financial voting process before any decision is made");
                                  setShowBoundaryTemplates(false);
                                }}
                              >
                                "If [loved one] asks for money without accountability, then [consequence for unaccountable requests]"
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-2 text-left justify-start whitespace-normal text-xs"
                                onClick={() => {
                                  setNewBoundaryContent("I will attend my own support group meetings to maintain my wellbeing:");
                                  setNewBoundaryConsequence("If I miss more than one meeting per month without valid reason, I will recommit to my own recovery support");
                                  setShowBoundaryTemplates(false);
                                }}
                              >
                                "I will attend my own support group meetings at least [X] times per week"
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        <Textarea
                          id="boundaryContent"
                          placeholder="Describe the boundary clearly and specifically..."
                          value={newBoundaryContent}
                          onChange={(e) => setNewBoundaryContent(e.target.value)}
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="boundaryConsequence">Result if Violated</Label>
                        <Textarea
                          id="boundaryConsequence"
                          placeholder="What will happen if this boundary is violated? (e.g., 'Financial support will be suspended for 30 days')"
                          value={newBoundaryConsequence}
                          onChange={(e) => setNewBoundaryConsequence(e.target.value)}
                          rows={2}
                        />
                        <p className="text-xs text-muted-foreground">
                          A boundary without a consequence is just a request. Be specific about what will happen.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleCreateBoundary}
                          disabled={!newBoundaryContent.trim() || !newBoundaryConsequence.trim() || isAddingBoundary}
                        >
                          {isAddingBoundary ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Submitting...
                            </>
                          ) : (
                            'Submit for Approval'
                          )}
                        </Button>
                        <Button variant="ghost" onClick={() => setShowBoundaryForm(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Pending Boundaries (Moderator View) */}
                  {isAdminOrModerator && familyBoundaries.filter(b => b.status === 'pending').length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-medium text-foreground flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-warning" />
                        Pending Approval
                      </h3>
                      <div className="grid gap-3">
                        {familyBoundaries.filter(b => b.status === 'pending').map(boundary => (
                          <div key={boundary.id} className="p-4 rounded-lg bg-warning/10 border border-warning/30">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <p className="text-sm font-medium mb-1">
                                  Proposed by {boundary.creator_name}
                                  {boundary.target_name && ` for ${boundary.target_name}`}
                                </p>
                                <p className="text-sm">{boundary.content}</p>
                                {boundary.consequence && (
                                  <p className="text-sm text-destructive/80 mt-2">
                                    <strong>Consequence:</strong> {boundary.consequence}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-2 shrink-0">
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleApproveBoundary(boundary.id)}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleRejectBoundary(boundary.id)}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* My Proposed Boundaries (for non-moderators to see their pending proposals) */}
                  {!isAdminOrModerator && familyBoundaries.filter(b => b.status === 'pending' && b.created_by === user?.id).length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-medium text-foreground flex items-center gap-2">
                        <Loader2 className="h-4 w-4 text-muted-foreground" />
                        Your Proposed Boundaries (Pending Approval)
                      </h3>
                      <div className="grid gap-3">
                        {familyBoundaries.filter(b => b.status === 'pending' && b.created_by === user?.id).map(boundary => (
                          <div key={boundary.id} className="p-4 rounded-lg bg-muted/50 border border-border">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <p className="text-sm font-medium mb-1">
                                  {boundary.target_name ? `For ${boundary.target_name}` : 'For All Members'}
                                </p>
                                <p className="text-sm">{boundary.content}</p>
                                {boundary.consequence && (
                                  <p className="text-sm text-destructive/80 mt-2">
                                    <strong>Consequence:</strong> {boundary.consequence}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground mt-2">
                                  Awaiting approval from a moderator or family admin...
                                </p>
                              </div>
                              <Badge variant="outline" className="shrink-0">Pending</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Approved Boundaries */}
                  <div className="space-y-3">
                    <h3 className="font-medium text-foreground">Active Boundaries</h3>
                    <div className="grid gap-3">
                      {familyBoundaries.filter(b => b.status === 'approved').length === 0 ? (
                        <div className="p-4 rounded-lg bg-secondary/30 border border-border text-center">
                          <p className="text-sm text-muted-foreground">
                            No approved boundaries yet. Propose one above!
                          </p>
                        </div>
                      ) : (
                        familyBoundaries.filter(b => b.status === 'approved').map(boundary => (
                          <div key={boundary.id} className="p-4 rounded-lg bg-secondary/50 border border-border">
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex-1">
                                <p className="text-sm font-medium mb-1">
                                  {boundary.target_name ? `For ${boundary.target_name}` : 'For All Members'}
                                  <span className="text-muted-foreground ml-2 font-normal">
                                    • Proposed by {boundary.creator_name}
                                  </span>
                                </p>
                                <p className="text-sm">{boundary.content}</p>
                                {boundary.consequence && (
                                  <p className="text-sm text-destructive/80 mt-2">
                                    <strong>Result if violated:</strong> {boundary.consequence}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {boundary.created_by === user?.id && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                      onClick={() => {
                                        setEditingBoundary(boundary);
                                        setEditBoundaryContent(boundary.content);
                                        setEditBoundaryConsequence(boundary.consequence || '');
                                      }}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                      onClick={() => handleRescindBoundary(boundary.id)}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                                {isAdminOrModerator && boundary.created_by !== user?.id && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    onClick={() => handleDeleteBoundary(boundary.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                            {/* Acknowledgment section */}
                            <div className="pt-3 border-t border-border">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs text-muted-foreground">Acknowledged by:</span>
                                  {boundary.acknowledgments.length === 0 ? (
                                    <span className="text-xs text-muted-foreground italic">No one yet</span>
                                  ) : (
                                    boundary.acknowledgments.map(ack => (
                                      <Badge key={ack.user_id} variant="secondary" className="text-xs">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        {ack.user_name}
                                      </Badge>
                                    ))
                                  )}
                                </div>
                                {shouldUserAcknowledge(boundary) && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleAcknowledgeBoundary(boundary.id)}
                                  >
                                    <Check className="h-4 w-4 mr-1" />
                                    Acknowledge
                                  </Button>
                                )}
                                {hasUserAcknowledged(boundary) && (
                                  <Badge variant="default" className="bg-primary/80">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    You acknowledged
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Universal Boundaries */}
                  <div className="space-y-3">
                    <h3 className="font-medium text-foreground flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      Universal Boundaries
                    </h3>
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                      <p className="text-sm text-muted-foreground mb-3">
                        These boundaries apply to all families using this platform:
                      </p>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>No financial support will be provided for substances or activities that enable addiction.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>All financial support must go through the approval process on this app. No cash.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>All family members commit to honest, respectful communication.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>Recovery progress must be demonstrated through treatment completion, aftercare compliance, meeting and therapy attendance, medication compliance where needed.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>Immediate response is required for all location check-in requests. Failure to respond may result in the loss of cell phone service, vehicle privileges, financial support or other natural consequences.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>Any relapse must be disclosed to the family within 24 hours.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>Support system members must be involved in their own recovery process and document their involvement in recovery meetings, support groups, therapy appointments or other activities that support family recovery.</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                    <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      Consequences
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Violation of the boundaries listed on this page could result in the reduction or elimination of financial support, access to transportation or phone service or other consequences agreed upon by the family group. Consequences apply to family group members who continue to enable the addiction or ignore their own recovery process.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Test Results Tab */}
          <TabsContent value="test-results" className="mt-0 space-y-4 overflow-auto">
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />
              <CardHeader>
                <CardTitle className="text-lg font-display flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md">
                    <FlaskConical className="h-5 w-5 text-white" />
                  </div>
                  Drug & Alcohol Testing
                  <Badge className="ml-auto bg-gradient-to-r from-amber-500 to-orange-500 border-0 text-white">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Premium
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Coming Soon Banner */}
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-2 border-dashed border-amber-300 p-8">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-200/40 to-orange-200/40 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                  <div className="relative text-center space-y-4">
                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg mx-auto">
                      <FlaskConical className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-2">Coming Soon</h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        Drug and alcohol testing features are currently in development. When ready, they will be offered as part of a premium upgrade.
                      </p>
                    </div>
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">
                      In Development
                    </Badge>
                  </div>
                </div>

                {/* Planned Features */}
                <div className="space-y-3">
                  <h3 className="font-medium text-foreground flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    Planned Features
                  </h3>
                  <div className="grid gap-3">
                    {[
                      { title: 'At-Home Testing Kits', description: 'Order FDA-approved drug and alcohol testing kits delivered to your door' },
                      { title: 'Lab-Verified Results', description: 'Results verified by certified laboratories for accuracy and reliability' },
                      { title: 'Family Dashboard', description: 'View test history and results in a secure, shared family dashboard' },
                      { title: 'Random Testing Schedule', description: 'Set up randomized testing schedules to support accountability' },
                      { title: 'Instant Notifications', description: 'Family members receive notifications when tests are completed' },
                    ].map((feature, index) => (
                      <div
                        key={feature.title}
                        className="p-4 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors animate-fade-in"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="h-6 w-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="h-3 w-3 text-amber-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-sm text-foreground">{feature.title}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">{feature.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA to Subscription */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md shrink-0">
                      <Sparkles className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <h4 className="font-semibold text-foreground">Interested in Premium Features?</h4>
                      <p className="text-sm text-muted-foreground">Join our waitlist to be notified when testing and other premium features launch.</p>
                    </div>
                    <Button 
                      onClick={() => navigate('/subscription')}
                      className="shrink-0"
                    >
                      Learn More
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Medications Tab */}
          <TabsContent value="medications" className="mt-0 space-y-4 overflow-auto">
            <MedicationTab
              familyId={familyId!}
              currentUserId={user?.id || ''}
              isAdminOrModerator={isAdminOrModerator}
              recoveringMemberId={members.find(m => m.role === 'recovering')?.user_id}
              members={members.map(m => ({ user_id: m.user_id, full_name: m.full_name, role: m.role }))}
            />
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="docs" className="mt-0 space-y-4 overflow-auto">
            <FamilyDocumentsTab
              familyId={familyId!}
              userRole={currentUserRole}
            />
          </TabsContent>

          <TabsContent value="aftercare" className="mt-0 space-y-4 overflow-auto">
            <AftercarePlanTab
              familyId={familyId!}
              members={members.map(m => ({ 
                id: m.id, 
                user_id: m.user_id, 
                role: m.role, 
                full_name: m.full_name 
              }))}
              isModerator={isAdminOrModerator}
            />
          </TabsContent>

          {/* FIIS Tab - Hidden from recovering individuals */}
          {/* Coaching Tab */}
          <TabsContent value="coaching" className="mt-0 space-y-4 overflow-auto">
            <CoachingTab familyId={familyId!} members={members.map(m => ({ user_id: m.user_id, full_name: m.full_name }))} />
          </TabsContent>

          {currentUserRole !== 'recovering' && (
            <TabsContent 
              value="fiis" 
              className="mt-0 space-y-4 overflow-auto"
              onFocus={() => markFIISViewed()}
            >
              <FIISTab 
                familyId={familyId!} 
                members={members
                  .filter(m => !professionalModeratorIds.includes(m.user_id))
                  .map(m => ({ user_id: m.user_id, full_name: m.full_name }))}
                excludeUserIds={professionalModeratorIds}
                onView={markFIISViewed}
                isModerator={isAdminOrModerator}
              />
            </TabsContent>
          )}

        </Tabs>
      </main>

      {/* Members Sheet */}
      <Sheet open={membersSheetOpen} onOpenChange={setMembersSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-display flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              {family?.name}
            </SheetTitle>
            <SheetDescription className="flex flex-col gap-1">
              <span>{members.length} family members • sorted by activity</span>
              <span className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-success" /> Active</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" /> This week</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-warning" /> This month</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-destructive" /> Inactive</span>
              </span>
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Payment Handles Card - Only for recovering members */}
            {currentUserRole === 'recovering' && (
              <div className="space-y-3">
                <h3 className="font-medium text-foreground">Your Payment Handles</h3>
                <p className="text-sm text-muted-foreground">
                  Add your payment usernames so family members can send you money when requests are approved.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium w-24 shrink-0">PayPal.me/</span>
                    <Input
                      placeholder="username"
                      value={paypalUsername}
                      onChange={(e) => setPaypalUsername(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium w-24 shrink-0">Venmo @</span>
                    <Input
                      placeholder="username"
                      value={venmoUsername}
                      onChange={(e) => setVenmoUsername(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium w-24 shrink-0">Cash App $</span>
                    <Input
                      placeholder="username"
                      value={cashappUsername}
                      onChange={(e) => setCashappUsername(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  <Button
                    onClick={savePaymentHandles}
                    disabled={isSavingPayment}
                    className="w-full mt-2"
                  >
                    {isSavingPayment ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      'Save Payment Handles'
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* HIPAA Releases Section - Only for organization-owned families and moderators */}
            {isAdminOrModerator && family?.organization_id && familyId && (
              <div className="space-y-3">
                <h3 className="font-medium text-foreground">HIPAA Releases</h3>
                <HIPAAReleasesViewer familyId={familyId} />
              </div>
            )}

            {/* Invite Members Section - For moderators and admins */}
            {isAdminOrModerator && familyInviteCode && (
              <div className="space-y-3">
                <h3 className="font-medium text-foreground flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-primary" />
                  Invite New Members
                </h3>
                <p className="text-sm text-muted-foreground">
                  Add family members, therapists, or case managers to your group.
                </p>
                
                {/* Send Invite by Email */}
                <Dialog open={showSendInviteDialog} onOpenChange={setShowSendInviteDialog}>
                  <DialogTrigger asChild>
                    <Button className="w-full gap-2" variant="default">
                      <UserPlus className="h-4 w-4" />
                      Invite New Group Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Send Family Invitations</DialogTitle>
                      <DialogDescription>
                        Add as many people as you'd like to invite to {family?.name}. Assign their role to determine their permissions.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <ScrollArea className="max-h-[400px] pr-4">
                        <div className="space-y-3">
                          {inviteRecipients.map((recipient, index) => (
                            <div key={recipient.id} className="p-4 bg-secondary/30 rounded-lg border border-border/50">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium text-foreground">
                                  Person {index + 1}
                                </span>
                                {inviteRecipients.length > 1 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeInviteRecipient(recipient.id)}
                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                <div className="space-y-1.5">
                                  <Label className="text-xs font-medium">Name</Label>
                                  <Input
                                    placeholder="John Smith"
                                    value={recipient.name}
                                    onChange={(e) => updateInviteRecipient(recipient.id, 'name', e.target.value)}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs font-medium">Invite Via</Label>
                                  <Select
                                    value={recipient.contactMethod}
                                    onValueChange={(value) => updateInviteRecipient(recipient.id, 'contactMethod', value)}
                                  >
                                    <SelectTrigger className="w-full bg-background">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-background border z-50">
                                      <SelectItem value="email">
                                        <span className="flex items-center gap-2">
                                          <Mail className="h-3 w-3" />
                                          Email
                                        </span>
                                      </SelectItem>
                                      <SelectItem value="sms">
                                        <span className="flex items-center gap-2">
                                          <MessageSquare className="h-3 w-3" />
                                          Text Message
                                        </span>
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                {recipient.contactMethod === 'email' ? (
                                  <div className="space-y-1.5">
                                    <Label className="text-xs font-medium">Email</Label>
                                    <Input
                                      type="email"
                                      placeholder="john@example.com"
                                      value={recipient.email}
                                      onChange={(e) => updateInviteRecipient(recipient.id, 'email', e.target.value)}
                                    />
                                  </div>
                                ) : (
                                  <div className="space-y-1.5">
                                    <Label className="text-xs font-medium">Phone Number</Label>
                                    <Input
                                      type="tel"
                                      placeholder="+1 (555) 123-4567"
                                      value={recipient.phone}
                                      onChange={(e) => updateInviteRecipient(recipient.id, 'phone', e.target.value)}
                                    />
                                  </div>
                                )}
                                <div className="space-y-1.5">
                                  <Label className="text-xs font-medium">Role</Label>
                                  <Select
                                    value={recipient.role}
                                    onValueChange={(value) => updateInviteRecipient(recipient.id, 'role', value)}
                                  >
                                    <SelectTrigger className="w-full bg-background">
                                      <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-background border z-50">
                                      {INVITE_ROLE_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                          {option.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addInviteRecipient}
                        className="w-full gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Another Person
                      </Button>
                    </div>
                    <div className="flex justify-end gap-3 pt-2 border-t">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowSendInviteDialog(false);
                          setInviteRecipients([{ id: crypto.randomUUID(), name: '', email: '', phone: '', contactMethod: 'email', role: 'member' }]);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={sendInvites} 
                        disabled={isSendingInvite || !inviteRecipients.some(r => r.name.trim() && (r.contactMethod === 'email' ? r.email.trim() : r.phone.trim()))}
                        className="gap-2"
                      >
                        {isSendingInvite ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            Send {inviteRecipients.filter(r => r.name.trim() && r.email.trim()).length > 1 
                              ? `${inviteRecipients.filter(r => r.name.trim() && r.email.trim()).length} Invitations` 
                              : 'Invitation'}
                          </>
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Manual Invite Code */}
                <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Or share code manually</p>
                      <code className="text-sm font-mono bg-background px-2 py-1 rounded inline-block">
                        {familyInviteCode}
                      </code>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(familyInviteCode);
                        setCopiedInviteCode(true);
                        setTimeout(() => setCopiedInviteCode(false), 2000);
                        toast({
                          title: 'Copied!',
                          description: 'Invite code copied to clipboard.',
                        });
                      }}
                      className="gap-1"
                    >
                      {copiedInviteCode ? (
                        <>
                          <Check className="h-4 w-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Family Members List */}
            <div className="space-y-3">
              <h3 className="font-medium text-foreground">Family Members</h3>
              <div className="space-y-3">
                {members
                  .map((member) => ({
                    ...member,
                    lastActivity: memberLastActivity[member.user_id],
                  }))
                  .sort((a, b) => {
                    // Sort by last activity date (most recent first), members without activity at the end
                    if (!a.lastActivity && !b.lastActivity) return 0;
                    if (!a.lastActivity) return 1;
                    if (!b.lastActivity) return -1;
                    return new Date(b.lastActivity.date).getTime() - new Date(a.lastActivity.date).getTime();
                  })
                  .map((member) => {
                    const activity = member.lastActivity;
                    const isOnline = onlineMembers.includes(member.user_id);
                    const daysSinceActivity = activity 
                      ? Math.floor((Date.now() - new Date(activity.date).getTime()) / (1000 * 60 * 60 * 24))
                      : null;
                    const activityColor = daysSinceActivity === null 
                      ? 'text-muted-foreground' 
                      : daysSinceActivity <= 1 
                        ? 'text-success' 
                        : daysSinceActivity <= 7 
                          ? 'text-primary' 
                          : daysSinceActivity <= 30 
                            ? 'text-warning' 
                            : 'text-destructive';
                    
                    return (
                      <div
                        key={member.id}
                        className="flex flex-col p-3 rounded-lg bg-secondary/50 gap-2 hover:bg-secondary/70 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Avatar>
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {getInitials(member.full_name)}
                                </AvatarFallback>
                              </Avatar>
                              {isOnline && (
                                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-success rounded-full border-2 border-card animate-pulse" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">
                                {member.full_name}
                                {member.user_id === user?.id && (
                                  <span className="text-muted-foreground ml-2">(You)</span>
                                )}
                              </p>
                              {/* Last Activity Display */}
                              <div className={`flex items-center gap-1 text-xs ${activityColor}`}>
                                <Clock className="h-3 w-3" />
                                {activity ? (
                                  <span>
                                    {formatDistanceToNow(new Date(activity.date), { addSuffix: true })} • {activity.type}
                                  </span>
                                ) : (
                                  <span>No activity yet</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isAdminOrModerator && member.user_id !== user?.id && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditMember(member)}
                                title="Edit profile"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            <Badge
                              variant={
                                member.role === 'moderator' || member.role === 'admin'
                                  ? 'default'
                                  : member.role === 'therapist' || member.role === 'case_manager'
                                  ? 'default'
                                  : member.role === 'recovering'
                                  ? 'outline'
                                  : 'secondary'
                              }
                              className={
                                member.role === 'therapist' 
                                  ? 'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200'
                                  : member.role === 'case_manager'
                                  ? 'bg-teal-100 text-teal-700 border-teal-200 hover:bg-teal-200'
                                  : ''
                              }
                            >
                              {member.role === 'admin' ? 'Admin' : 
                               member.role === 'therapist' ? 'Therapist' : 
                               member.role === 'case_manager' ? 'Case Manager' : 
                               member.role}
                            </Badge>
                          </div>
                        </div>
                        {/* Private messaging toggle for recovering members - only shown to moderators */}
                        {isAdminOrModerator && 
                         member.role === 'recovering' && 
                         member.user_id !== user?.id && (
                          <div className="flex items-center justify-between pl-12 pt-1 border-t border-border/50 mt-1">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">Private messaging</span>
                            </div>
                            <Switch
                              checked={member.private_messaging_enabled ?? false}
                              onCheckedChange={(checked) => togglePrivateMessaging(member.id, member.user_id, checked)}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Member Profile Dialog */}
      <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Edit Member Profile</DialogTitle>
            <DialogDescription>
              Update {editingMember?.full_name}'s profile information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="editFullName">Full Name</Label>
              <Input
                id="editFullName"
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editPaypal">PayPal Username</Label>
              <Input
                id="editPaypal"
                placeholder="username"
                value={editPaypal}
                onChange={(e) => setEditPaypal(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editVenmo">Venmo Username</Label>
              <Input
                id="editVenmo"
                placeholder="username"
                value={editVenmo}
                onChange={(e) => setEditVenmo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editCashapp">Cash App Username</Label>
              <Input
                id="editCashapp"
                placeholder="username"
                value={editCashapp}
                onChange={(e) => setEditCashapp(e.target.value)}
              />
            </div>
            
            {/* True Link Financial recommendation */}
            {editingMember && (editingMember.role === 'recovering' || editRole === 'recovering') && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <Label className="font-medium text-sm">True Link Financial</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  For enhanced financial protection, consider setting up a True Link prepaid card. 
                  It provides spending controls and oversight for those in recovery.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  asChild
                >
                  <a 
                    href="https://www.truelinkfinancial.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3 w-3 mr-2" />
                    Learn About True Link
                  </a>
                </Button>
              </div>
            )}
            
            {/* Role selector - for family creator or moderators */}
            {(isFamilyCreator || isAdminOrModerator) && editingMember && editingMember.role !== 'moderator' && (
              <div className="space-y-2">
                <Label htmlFor="editRole">Member Role</Label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="recovering">Recovering</SelectItem>
                    {isFamilyCreator && <SelectItem value="admin">Admin</SelectItem>}
                    <SelectItem value="therapist">Therapist</SelectItem>
                    <SelectItem value="case_manager">Case Manager</SelectItem>
                    <SelectItem value="sober_living_manager">Sober Living Manager</SelectItem>
                    <SelectItem value="interventionist">Interventionist</SelectItem>
                    <SelectItem value="program_admin">Program Admin</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {['therapist', 'case_manager', 'sober_living_manager', 'interventionist', 'program_admin'].includes(editRole)
                    ? 'Provider roles can view family communications and participate in care coordination.'
                    : 'Admins can approve boundaries, manage values & goals, and help moderate the family.'}
                </p>
              </div>
            )}
            <Button
              className="w-full"
              onClick={handleSaveMemberProfile}
              disabled={isSavingMember}
            >
              {isSavingMember ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Save Profile'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Private Messaging V2 - iMessage Style */}
      {user && familyId && (
        <PrivateMessagingV2
          familyId={familyId}
          currentUserId={user.id}
          currentUserRole={currentUserRole}
          currentUserMessagingEnabled={members.find(m => m.user_id === user.id)?.private_messaging_enabled ?? false}
          hasProfessionalModerator={hasProfessionalModerator}
          members={members}
          isOpen={privateMessagingOpen}
          onClose={() => setPrivateMessagingOpen(false)}
          onUnreadCountChange={setUnreadPrivateMessages}
        />
      )}

      {/* Boundary Acknowledgment Confirmation Dialog */}
      <Dialog open={!!boundaryToAcknowledge} onOpenChange={(open) => !open && setBoundaryToAcknowledge(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Acknowledge Boundary
            </DialogTitle>
            <DialogDescription>
              Please review this boundary and its consequence before acknowledging.
            </DialogDescription>
          </DialogHeader>
          {boundaryToAcknowledge && (
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                <p className="text-sm font-medium mb-2">Boundary:</p>
                <p className="text-sm">{boundaryToAcknowledge.content}</p>
              </div>
              {boundaryToAcknowledge.consequence && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                  <p className="text-sm font-medium mb-2 text-destructive">Result if Violated:</p>
                  <p className="text-sm">{boundaryToAcknowledge.consequence}</p>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                By acknowledging this boundary, you confirm that you understand both the boundary and its consequence.
              </p>
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setBoundaryToAcknowledge(null)}>
              Cancel
            </Button>
            <Button onClick={confirmAcknowledgeBoundary}>
              <Check className="h-4 w-4 mr-2" />
              I Understand & Acknowledge
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Boundary Dialog */}
      <Dialog open={!!editingBoundary} onOpenChange={(open) => !open && setEditingBoundary(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-primary" />
              Edit Boundary
            </DialogTitle>
            <DialogDescription>
              Update your boundary content and consequence.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Boundary</Label>
              <Textarea
                placeholder="Describe the boundary..."
                value={editBoundaryContent}
                onChange={(e) => setEditBoundaryContent(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Result if Violated</Label>
              <Textarea
                placeholder="What will happen if this boundary is violated?"
                value={editBoundaryConsequence}
                onChange={(e) => setEditBoundaryConsequence(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setEditingBoundary(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateBoundary}>
              <Check className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {user && familyId && (
        <DailyEmotionalCheckin familyId={familyId} />
      )}

      {/* First-Time Onboarding Overlay */}
      {showOnboarding && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-scale-in border border-border/50">
            <div className="h-2 bg-gradient-to-r from-primary via-accent to-success rounded-t-2xl" />
            
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="h-16 w-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 via-accent/20 to-success/20 flex items-center justify-center shadow-inner">
                  <Heart className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-display font-semibold text-foreground mb-2">
                  Welcome to your family group!
                </h2>
                <p className="text-sm text-muted-foreground">
                  Here's how to get started and connect with your family:
                </p>
              </div>

              <div className="space-y-4 mb-6">
                {/* Step 1 */}
                <div className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-300 ${
                  onboardingStep === 1 
                    ? 'bg-primary/10 border border-primary/20 shadow-sm' 
                    : onboardingStep > 1
                      ? 'bg-success/10 border border-success/20'
                      : 'bg-muted/30'
                }`}>
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                    onboardingStep === 1 
                      ? 'bg-primary/20 text-primary' 
                      : onboardingStep > 1
                        ? 'bg-success/20 text-success'
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    {onboardingStep > 1 ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <MessageCircle className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Step 1: Send a message</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Start the conversation with your family in the Chat tab
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-300 ${
                  onboardingStep === 2 
                    ? 'bg-primary/10 border border-primary/20 shadow-sm' 
                    : onboardingStep > 2
                      ? 'bg-success/10 border border-success/20'
                      : 'bg-muted/30'
                }`}>
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                    onboardingStep === 2 
                      ? 'bg-primary/20 text-primary' 
                      : onboardingStep > 2
                        ? 'bg-success/20 text-success'
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    {onboardingStep > 2 ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Target className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Step 2: Set your family values</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Define what matters most in your recovery journey
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-300 ${
                  onboardingStep === 3 
                    ? 'bg-primary/10 border border-primary/20 shadow-sm' 
                    : onboardingStep > 3
                      ? 'bg-success/10 border border-success/20'
                      : 'bg-muted/30'
                }`}>
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                    onboardingStep === 3 
                      ? 'bg-primary/20 text-primary' 
                      : onboardingStep > 3
                        ? 'bg-success/20 text-success'
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    {onboardingStep > 3 ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <ShieldCheck className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Step 3: Create your first boundary</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Establish healthy boundaries with love and clear consequences
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-300 ${
                  onboardingStep === 4 
                    ? 'bg-success/10 border border-success/20 shadow-sm' 
                    : 'bg-muted/30'
                }`}>
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                    onboardingStep === 4 
                      ? 'bg-success/20 text-success'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">You're ready!</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Explore more features as you go. We're here to support your journey.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    const onboardingKey = `familybridge_onboarding_${familyId}_complete`;
                    localStorage.setItem(onboardingKey, 'true');
                    setShowOnboarding(false);
                    setHasSeenOnboarding(true);
                  }}
                >
                  Skip for now
                </Button>
                
                {onboardingStep < 4 ? (
                  <Button 
                    className="flex-1 bg-gradient-to-r from-primary to-accent"
                    onClick={() => {
                      if (onboardingStep === 1) {
                        setActiveTab('messages');
                        setOnboardingStep(2);
                      } else if (onboardingStep === 2) {
                        setActiveTab('values');
                        setOnboardingStep(3);
                      } else if (onboardingStep === 3) {
                        setActiveTab('boundaries');
                        setOnboardingStep(4);
                      }
                    }}
                  >
                    {onboardingStep === 1 ? 'Start with Chat' : 
                     onboardingStep === 2 ? 'Set Goals' :
                     'Create Boundary'}
                  </Button>
                ) : (
                  <Button 
                    className="flex-1 bg-gradient-to-r from-success to-emerald-500"
                    onClick={() => {
                      const onboardingKey = `familybridge_onboarding_${familyId}_complete`;
                      localStorage.setItem(onboardingKey, 'true');
                      setShowOnboarding(false);
                      setHasSeenOnboarding(true);
                    }}
                  >
                    Let's Go!
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilyChat;
