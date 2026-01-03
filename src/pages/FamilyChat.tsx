import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { supabase } from '@/integrations/supabase/client';
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
  Heart, ArrowLeft, Send, Loader2, Users, DollarSign, 
  MessageCircle, AlertTriangle, Check, X, Shield, MapPin,
  ExternalLink, CreditCard, CheckCircle2, Paperclip, Image, HandCoins, Trash2, Pencil,
  Target, ShieldCheck, Plus, CheckCircle, MessageSquare, FlaskConical
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
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
import { Textarea } from '@/components/ui/textarea';
import { NotificationBell } from '@/components/NotificationBell';
import { TabbedCheckin } from '@/components/TabbedCheckin';
import { MeetingCheckout } from '@/components/MeetingCheckout';
import { CheckinHistory } from '@/components/CheckinHistory';
import { LocationCheckinRequest } from '@/components/LocationCheckinRequest';
import { LocationCheckinResponse } from '@/components/LocationCheckinResponse';
import { LocationCapture, LocationData } from '@/components/LocationCapture';
import { PrivateMessaging } from '@/components/PrivateMessaging';
import { ConversationStarters } from '@/components/ConversationStarters';
import { TemporaryModeratorRequest } from '@/components/TemporaryModeratorRequest';

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
}

interface Family {
  id: string;
  name: string;
  description: string | null;
  organization_id: string | null;
}


interface FamilyBoundary {
  id: string;
  family_id: string;
  created_by: string;
  creator_name?: string;
  target_user_id: string | null;
  target_name?: string;
  content: string;
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
    key: 'weekly_meetings', 
    name: 'Attend Weekly Family Meetings', 
    description: 'Meet regularly as a family to check in and support each other.'
  },
  { 
    key: 'open_communication', 
    name: 'Practice Open Communication Daily', 
    description: 'Share feelings and concerns honestly each day.'
  },
  { 
    key: 'no_enabling', 
    name: 'Eliminate Enabling Behaviors', 
    description: 'Stop actions that protect loved ones from consequences of their choices.'
  },
  { 
    key: 'self_care', 
    name: 'Prioritize Individual Self-Care', 
    description: 'Each member commits to their own mental and physical health.'
  },
  { 
    key: 'celebrate_wins', 
    name: 'Celebrate Small Wins Together', 
    description: 'Acknowledge and celebrate progress, no matter how small.'
  },
  { 
    key: 'attend_support', 
    name: 'Attend Support Groups (Al-Anon, etc.)', 
    description: 'Family members participate in their own recovery support.'
  },
  { 
    key: 'rebuild_trust', 
    name: 'Work on Rebuilding Trust', 
    description: 'Take intentional steps to repair and strengthen relationships.'
  },
  { 
    key: 'healthy_boundaries', 
    name: 'Establish Healthy Boundaries', 
    description: 'Create and maintain clear, loving boundaries.'
  },
  { 
    key: 'financial_health', 
    name: 'Restore Financial Stability', 
    description: 'Work together on budget, debts, and financial recovery.'
  },
  { 
    key: 'quality_time', 
    name: 'Schedule Sober Quality Time', 
    description: 'Plan regular activities that bring joy without substances.'
  },
] as const;


const FAMILY_VALUES_OPTIONS = [
  { 
    key: 'honesty', 
    name: 'Honesty & Transparency', 
    description: 'We commit to open, truthful communication—even when it\'s difficult.',
    icon: 'Heart'
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
    icon: 'Heart'
  },
  { 
    key: 'forgiveness', 
    name: 'Forgiveness & Moving Forward', 
    description: 'We release resentment and focus on building a better future together.',
    icon: 'Heart'
  },
  { 
    key: 'self_care', 
    name: 'Self-Care for Everyone', 
    description: 'We prioritize each person\'s wellbeing—recovery affects the whole family.',
    icon: 'Heart'
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
    icon: 'Heart'
  },
] as const;

const FamilyChat = () => {
  const { familyId } = useParams();
  const { user, loading } = useAuth();
  const { organization } = useOrganization();
  const navigate = useNavigate();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [family, setFamily] = useState<Family | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [financialRequests, setFinancialRequests] = useState<FinancialRequest[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [requestAmount, setRequestAmount] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [requestOtherDescription, setRequestOtherDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string>('member');
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
  
  // Edit member profile state (for moderators)
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editPaypal, setEditPaypal] = useState('');
  const [editVenmo, setEditVenmo] = useState('');
  const [editCashapp, setEditCashapp] = useState('');
  const [isSavingMember, setIsSavingMember] = useState(false);
  
  // Content warning cooldown state
  const [warningCount, setWarningCount] = useState(0);
  const [cooldownEndTime, setCooldownEndTime] = useState<number | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [membersSheetOpen, setMembersSheetOpen] = useState(false);
  
  
  // Family Values state
  const [familyValues, setFamilyValues] = useState<FamilyValue[]>([]);
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [isSavingValues, setIsSavingValues] = useState(false);
  const [isEditingValues, setIsEditingValues] = useState(false);
  
  // Common Goals state
  const [familyCommonGoals, setFamilyCommonGoals] = useState<FamilyCommonGoal[]>([]);
  const [selectedCommonGoals, setSelectedCommonGoals] = useState<string[]>([]);
  const [isSavingCommonGoals, setIsSavingCommonGoals] = useState(false);
  const [isEditingCommonGoals, setIsEditingCommonGoals] = useState(false);
  
  // Boundaries state
  const [familyBoundaries, setFamilyBoundaries] = useState<FamilyBoundary[]>([]);
  const [newBoundaryContent, setNewBoundaryContent] = useState('');
  const [newBoundaryTarget, setNewBoundaryTarget] = useState<string>('all');
  const [isAddingBoundary, setIsAddingBoundary] = useState(false);
  const [showBoundaryForm, setShowBoundaryForm] = useState(false);
  
  // Private messaging state
  const [privateMessagingOpen, setPrivateMessagingOpen] = useState(false);
  const [unreadPrivateMessages, setUnreadPrivateMessages] = useState(0);
  const [hasProfessionalModerator, setHasProfessionalModerator] = useState(false);

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
      fetchUnreadPrivateMessages();
      subscribeToPrivateMessages();
    }
  }, [user, familyId]);

  const fetchUnreadPrivateMessages = async () => {
    if (!user || !familyId) return;
    const { count, error } = await supabase
      .from('private_messages')
      .select('*', { count: 'exact', head: true })
      .eq('family_id', familyId)
      .eq('recipient_id', user.id)
      .eq('is_read', false);

    if (!error && count !== null) {
      setUnreadPrivateMessages(count);
    }
  };

  const subscribeToPrivateMessages = () => {
    if (!user || !familyId) return;

    const channel = supabase
      .channel(`private-messages-unread-${familyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'private_messages',
          filter: `family_id=eq.${familyId}`,
        },
        () => {
          // Refetch unread count on any change
          fetchUnreadPrivateMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

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

  const checkProfessionalModerator = async () => {
    if (!familyId) return;
    
    // Check temporary moderator requests
    const { data: tempMod } = await supabase
      .from('temporary_moderator_requests')
      .select('id')
      .eq('family_id', familyId)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .limit(1);

    // Check paid moderator requests
    const { data: paidMod } = await supabase
      .from('paid_moderator_requests')
      .select('id')
      .eq('family_id', familyId)
      .eq('status', 'active')
      .limit(1);

    setHasProfessionalModerator((tempMod && tempMod.length > 0) || (paidMod && paidMod.length > 0));
  };

  useEffect(() => {
    if (familyId) {
      checkProfessionalModerator();
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
        .select('id, name, description, organization_id')
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
        // Fetch profiles (names only)
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', memberUserIds);

        if (profilesError) throw profilesError;

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

      // Set current user role
      const currentMember = formattedMembers.find((m) => m.user_id === user?.id);
      if (currentMember) {
        setCurrentUserRole(currentMember.role);
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
      setMessages(messagesWithNames);

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
        });

      if (error) throw error;

      toast({
        title: 'Boundary proposed',
        description: 'Your boundary has been submitted for moderator approval.',
      });

      setNewBoundaryContent('');
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
    if (!user) return;
    try {
      const { error } = await supabase
        .from('boundary_acknowledgments')
        .insert({
          boundary_id: boundaryId,
          user_id: user.id,
        });

      if (error) throw error;

      toast({
        title: 'Boundary acknowledged',
        description: 'You have acknowledged this boundary.',
      });

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
    setFinancialRequests(requestsWithNames);
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
          setMessages(prev => [...prev, {
            ...newMsg,
            sender_name: sender?.full_name || 'Unknown',
          }]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
        description: `You can send a message in ${cooldownRemaining} seconds.`,
        variant: 'destructive',
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
          description: 'You must wait 60 seconds before sending another message. Please take a moment to reflect.',
          variant: 'destructive',
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

  // Fetch secure payment links via RPC (only after marking as payer)
  const fetchPaymentLinks = async (requestId: string): Promise<PaymentLinks | null> => {
    try {
      const { data, error } = await supabase.rpc('get_payment_links_for_request', {
        _request_id: requestId,
      });
      
      if (error || !data || data.length === 0) {
        return null;
      }
      
      const links: PaymentLinks = {
        paypal_link: data[0].paypal_link,
        venmo_link: data[0].venmo_link,
        cashapp_link: data[0].cashapp_link,
      };
      
      // Cache the links
      setPaymentLinksCache(prev => ({ ...prev, [requestId]: links }));
      return links;
    } catch (err) {
      console.error('Error fetching payment links:', err);
      return null;
    }
  };

  const handleMarkAsPaid = async (requestId: string, method: string) => {
    try {
      const { error } = await supabase
        .from('financial_requests')
        .update({
          paid_at: new Date().toISOString(),
          paid_by_user_id: user?.id,
          payment_method: method,
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: 'Marked as paid',
        description: 'The requester will need to confirm receipt.',
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
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg animate-pulse-soft">
            <Heart className="h-8 w-8 text-white" />
          </div>
          <div className="absolute -inset-2 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl animate-ping opacity-50" />
        </div>
        <p className="mt-6 text-muted-foreground font-medium animate-fade-in">Loading your family...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20 flex flex-col">
      {/* Header with glass effect */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md shrink-0 sticky top-0 z-50 shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/dashboard')}
              className="hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <button 
              className="flex items-center gap-3 hover:opacity-80 transition-all group"
              onClick={() => setMembersSheetOpen(true)}
            >
              <div className="relative">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                  <Heart className="h-5 w-5 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-success rounded-full border-2 border-card flex items-center justify-center">
                  <span className="text-[8px] text-white font-bold">{members.length}</span>
                </div>
              </div>
              <div className="text-left">
                <h1 className="font-display font-semibold text-foreground text-lg group-hover:text-primary transition-colors">
                  {family?.name}
                </h1>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {members.length} member{members.length !== 1 ? 's' : ''} • Active now
                </p>
              </div>
            </button>
            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              {familyId && (
                <TemporaryModeratorRequest 
                  familyId={familyId} 
                  hasOrganization={!!family?.organization_id} 
                />
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPrivateMessagingOpen(true)}
                title="Private Messages"
                className="relative hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <MessageSquare className="h-5 w-5" />
                {unreadPrivateMessages > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-medium notification-pulse">
                    {unreadPrivateMessages > 9 ? '9+' : unreadPrivateMessages}
                  </span>
                )}
              </Button>
              {currentUserRole === 'moderator' && (
                <Badge className="bg-gradient-to-r from-primary to-accent text-white border-0 shadow-md">
                  <Shield className="h-3 w-3 mr-1" />
                  Moderator
                </Badge>
              )}
              <NotificationBell />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-4 overflow-hidden">
        <Tabs defaultValue="messages" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-6 mb-4 shrink-0 bg-card/50 backdrop-blur-sm border border-border/50 p-1.5 rounded-xl shadow-soft">
            <TabsTrigger 
              value="messages" 
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-lg transition-all duration-200"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Messages</span>
            </TabsTrigger>
            <TabsTrigger 
              value="checkin" 
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-lg transition-all duration-200"
            >
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Check-in</span>
            </TabsTrigger>
            <TabsTrigger 
              value="financial" 
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-lg transition-all duration-200"
            >
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Financial</span>
            </TabsTrigger>
            <TabsTrigger 
              value="values" 
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-lg transition-all duration-200"
            >
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Values/Goals</span>
            </TabsTrigger>
            <TabsTrigger 
              value="boundaries" 
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-lg transition-all duration-200"
            >
              <ShieldCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Boundaries</span>
            </TabsTrigger>
            <TabsTrigger 
              value="test-results" 
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-lg transition-all duration-200"
            >
              <FlaskConical className="h-4 w-4" />
              <span className="hidden sm:inline">Test Results</span>
            </TabsTrigger>
          </TabsList>

          {/* Messages Tab */}
          <TabsContent value="messages" className="flex-1 flex flex-col overflow-hidden mt-0">
            <Card className="flex-1 flex flex-col overflow-hidden shadow-card border-border/50 card-enter">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-12 animate-fade-in">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <MessageCircle className="h-8 w-8 text-primary animate-pulse-soft" />
                      </div>
                      <h3 className="font-display font-semibold text-foreground mb-1">No messages yet</h3>
                      <p className="text-muted-foreground text-sm">Start the conversation with your family!</p>
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
                                ? { background: `linear-gradient(135deg, ${organization.primary_color}, ${organization.primary_color}cc)` }
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
                                  ? { background: `linear-gradient(135deg, ${organization.primary_color}, ${organization.primary_color}dd)` }
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
              <form onSubmit={handleSendMessage} className="p-4 border-t border-border/50 shrink-0 bg-card/50 backdrop-blur-sm">
                {cooldownRemaining > 0 && (
                  <div className="mb-3 p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-2 animate-scale-in">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <span className="text-sm text-destructive">
                      Cooldown active: {cooldownRemaining} seconds remaining
                    </span>
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={cooldownRemaining > 0 ? "Please wait..." : "Type a supportive message..."}
                    className="flex-1 bg-background/80 border-border/50 focus:border-primary/50 transition-colors"
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
                    Messages are filtered for safety
                  </p>
                </div>
              </form>
            </Card>
          </TabsContent>

          {/* Check-in Tab */}
          <TabsContent value="checkin" className="flex-1 overflow-auto mt-0">
            <div className="space-y-4">
              {/* Location Check-in Response (for recovering members) */}
              <LocationCheckinResponse 
                familyId={familyId!}
                userRole={currentUserRole}
              />
              
              {/* Shared Location Capture Card */}
              <Card className="card-interactive card-enter overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary" />
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 font-display text-lg">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-primary" />
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
              />
              
              <TabbedCheckin 
                familyId={familyId!} 
                onCheckinComplete={() => {
                  setCheckinRefreshKey(k => k + 1);
                  setCapturedLocation(null);
                }}
                capturedLocation={capturedLocation}
              />
              
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
              />
            </div>
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial" className="flex-1 overflow-auto mt-0">
            <div className="space-y-4">
              {/* Create Request */}
              <Card className="card-interactive card-enter overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-success via-primary to-accent" />
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg font-display">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-success/20 to-primary/20 flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-success" />
                    </div>
                    Request Financial Support
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Warning for outstanding approved request */}
                  {financialRequests.some(r => r.status === 'approved' && !r.resolved_at) && (
                    <div className="mb-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium">Outstanding request pending</p>
                        <p className="text-yellow-700">
                          There is an approved request that hasn't been marked as completed yet. 
                          New requests cannot be submitted until a moderator completes the outstanding request.
                        </p>
                      </div>
                    </div>
                  )}
                  <form onSubmit={handleCreateRequest} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">Amount</Label>
                        <Input
                          type="number"
                          placeholder="Amount ($)"
                          value={requestAmount}
                          onChange={(e) => setRequestAmount(e.target.value)}
                          min="0"
                          step="0.01"
                          className="bg-background/80"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">Reason</Label>
                        <Select value={requestReason} onValueChange={setRequestReason}>
                          <SelectTrigger className="bg-background/80">
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
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">
                          Description (required)
                        </Label>
                        <Textarea
                          placeholder="Please describe what this request is for..."
                          value={requestOtherDescription}
                          onChange={(e) => setRequestOtherDescription(e.target.value)}
                          className="min-h-[80px]"
                        />
                      </div>
                    )}
                    
                    {/* Bill Attachment */}
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">
                        Bill/Receipt Photo (recommended for utilities)
                      </Label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      {billPreview ? (
                        <div className="relative">
                          <img
                            src={billPreview}
                            alt="Bill preview"
                            className="w-full max-h-48 object-contain rounded-lg border border-border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={clearAttachment}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Paperclip className="h-4 w-4 mr-2" />
                          Attach Bill/Receipt Photo
                        </Button>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Include a photo showing the account name, number, and amount due.
                      </p>
                    </div>

                    <Button type="submit" disabled={isRequesting} className="w-full">
                      {isRequesting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Request for Approval'
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Financial Summary */}
              <Card className="mb-4">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Total Requested</p>
                      <p className="text-2xl font-bold text-foreground">
                        ${financialRequests.reduce((sum, r) => sum + r.amount, 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm text-green-700 mb-1">Total Funds Given</p>
                      <p className="text-2xl font-bold text-green-600">
                        ${financialRequests
                          .filter(r => r.payment_confirmed_at || r.status === 'approved')
                          .reduce((sum, r) => r.pledges.reduce((pSum, p) => pSum + p.amount, 0) + sum, 0)
                          .toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Requests List */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-display">Financial Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  {financialRequests.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No financial requests yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
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

                        return (
                          <div
                            key={req.id}
                            className="p-4 rounded-lg border border-border bg-card"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <p className="font-semibold text-foreground">
                                  ${req.amount.toFixed(2)}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Requested by {req.requester_name}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <Badge
                                  variant={
                                    req.status === 'approved'
                                      ? 'default'
                                      : req.status === 'denied'
                                      ? 'destructive'
                                      : 'secondary'
                                  }
                                >
                                  {req.status}
                                </Badge>
                                {isCompleted && (
                                  <Badge variant="outline" className="text-primary border-primary bg-primary/10">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Completed
                                  </Badge>
                                )}
                                {isConfirmed && !isCompleted && (
                                  <Badge variant="outline" className="text-green-600 border-green-600">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Payment Complete
                                  </Badge>
                                )}
                                {isPaid && !isConfirmed && (
                                  <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                                    <CreditCard className="h-3 w-3 mr-1" />
                                    Awaiting Confirmation
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <p className="text-sm mb-3">{req.reason}</p>

                            {/* Rescind button for requester on pending requests with no votes */}
                            {isRequester && req.status === 'pending' && req.votes.length === 0 && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="mb-3 text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => handleRescindRequest(req.id)}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Rescind Request
                              </Button>
                            )}
                            {isRequester && req.status === 'pending' && req.votes.length > 0 && (
                              <p className="text-xs text-muted-foreground mb-3">
                                Voting has begun — request cannot be rescinded
                              </p>
                            )}
                            {req.attachment_url && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <button className="mb-3 flex items-center gap-2 text-sm text-primary hover:underline">
                                    <Image className="h-4 w-4" />
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
                            
                            {/* Vote counts */}
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                              <span className="flex items-center gap-1">
                                <Check className="h-4 w-4 text-success" />
                                {approvalCount}
                              </span>
                              <span className="flex items-center gap-1">
                                <X className="h-4 w-4 text-destructive" />
                                {denialCount}
                              </span>
                              {req.payment_method && (
                                <span className="text-xs">
                                  Paid via {req.payment_method}
                                </span>
                              )}
                            </div>

                            {/* Voting buttons for pending requests */}
                            {req.status === 'pending' && !isRequester && !hasVoted && (
                              <div className="flex gap-2 mb-3">
                                <Button
                                  size="sm"
                                  variant="success"
                                  onClick={() => handleVote(req.id, true)}
                                >
                                  <Check className="h-4 w-4" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleVote(req.id, false)}
                                >
                                  <X className="h-4 w-4" />
                                  Deny
                                </Button>
                              </div>
                            )}
                            {hasVoted && req.status === 'pending' && (
                              <p className="text-sm text-muted-foreground mb-3">You've voted</p>
                            )}

                            {/* Pledges section */}
                            {req.status === 'pending' && (
                              <div className="border-t border-border pt-3 mt-3">
                                {/* Existing pledges */}
                                {req.pledges.length > 0 && (
                                  <div className="mb-3">
                                    <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-1">
                                      <HandCoins className="h-4 w-4 text-primary" />
                                      Pledges (${req.pledges.reduce((sum, p) => sum + Number(p.amount), 0).toFixed(2)} of ${req.amount.toFixed(2)})
                                    </p>
                                    <div className="space-y-1">
                                      {req.pledges.map((pledge) => (
                                        <div key={pledge.id} className="flex items-center justify-between text-sm bg-secondary/50 px-2 py-1 rounded">
                                          <span>
                                            {pledge.user_name}: ${Number(pledge.amount).toFixed(2)}
                                            {pledge.payment_method && ` via ${pledge.payment_method}`}
                                          </span>
                                          {pledge.user_id === user?.id && (
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                              onClick={() => handleDeletePledge(pledge.id)}
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Add pledge form (for non-requesters) */}
                                {!isRequester && (
                                  <div className="space-y-2">
                                    <p className="text-sm font-medium text-foreground">
                                      Pledge to help with this request:
                                    </p>
                                    <div className="flex gap-2">
                                      <Input
                                        type="number"
                                        placeholder="Amount ($)"
                                        value={pledgeAmounts[req.id] || ''}
                                        onChange={(e) => setPledgeAmounts(prev => ({ ...prev, [req.id]: e.target.value }))}
                                        min="0"
                                        step="0.01"
                                        className="w-24"
                                      />
                                      <Select 
                                        value={pledgeMethods[req.id] || ''} 
                                        onValueChange={(value) => setPledgeMethods(prev => ({ ...prev, [req.id]: value }))}
                                      >
                                        <SelectTrigger className="w-32 bg-background">
                                          <SelectValue placeholder="Method" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-background z-50">
                                          <SelectItem value="PayPal">PayPal</SelectItem>
                                          <SelectItem value="Venmo">Venmo</SelectItem>
                                          <SelectItem value="Cash App">Cash App</SelectItem>
                                          <SelectItem value="Zelle">Zelle</SelectItem>
                                          <SelectItem value="Cash">Cash</SelectItem>
                                          <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <Button
                                        size="sm"
                                        onClick={() => handleCreatePledge(req.id, req.amount)}
                                        disabled={isPledging === req.id}
                                      >
                                        {isPledging === req.id ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <>
                                            <HandCoins className="h-4 w-4 mr-1" />
                                            Pledge
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Payment section for approved requests */}
                            {isApproved && !isConfirmed && (
                              <div className="border-t border-border pt-3 mt-3">
                                {/* If not paid yet - show payment options to non-requesters */}
                                {!isPaid && !isRequester && (
                                  <div className="space-y-2">
                                    <p className="text-sm font-medium text-foreground">Send Payment:</p>
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button size="sm" variant="secondary">
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
                                    <p className="text-xs text-muted-foreground">
                                      After marking as paid, payment links will be available to complete the transaction.
                                    </p>
                                  </div>
                                )}

                                {/* If paid by current user - show payment links fetched securely */}
                                {isPaid && isPayer && !isConfirmed && (
                                  <div className="space-y-2">
                                    <p className="text-sm font-medium text-foreground">Complete Payment:</p>
                                    {cachedLinks ? (
                                      <div className="flex flex-wrap gap-2">
                                        {cachedLinks.paypal_link && (
                                          <a
                                            href={cachedLinks.paypal_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex"
                                          >
                                            <Button size="sm" variant="outline">
                                              <ExternalLink className="h-3 w-3 mr-1" />
                                              PayPal
                                            </Button>
                                          </a>
                                        )}
                                        {cachedLinks.venmo_link && (
                                          <a
                                            href={cachedLinks.venmo_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex"
                                          >
                                            <Button size="sm" variant="outline">
                                              <ExternalLink className="h-3 w-3 mr-1" />
                                              Venmo
                                            </Button>
                                          </a>
                                        )}
                                        {cachedLinks.cashapp_link && (
                                          <a
                                            href={cachedLinks.cashapp_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex"
                                          >
                                            <Button size="sm" variant="outline">
                                              <ExternalLink className="h-3 w-3 mr-1" />
                                              Cash App
                                            </Button>
                                          </a>
                                        )}
                                        {!cachedLinks.paypal_link && !cachedLinks.venmo_link && !cachedLinks.cashapp_link && (
                                          <p className="text-sm text-muted-foreground">
                                            Requester hasn't set up payment handles. Contact them directly.
                                          </p>
                                        )}
                                      </div>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => fetchPaymentLinks(req.id)}
                                      >
                                        <ExternalLink className="h-3 w-3 mr-1" />
                                        Show Payment Links
                                      </Button>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                      Waiting for {req.requester_name} to confirm receipt.
                                    </p>
                                  </div>
                                )}

                                {/* If paid - show confirm button to requester */}
                                {isPaid && isRequester && (
                                  <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">
                                      Payment sent via {req.payment_method}. Did you receive it?
                                    </p>
                                    {req.attachment_url ? (
                                      <Button
                                        size="sm"
                                        variant="success"
                                        onClick={() => handleConfirmReceipt(req.id, !!req.attachment_url)}
                                      >
                                        <CheckCircle2 className="h-4 w-4 mr-1" />
                                        Confirm Receipt
                                      </Button>
                                    ) : (
                                      <p className="text-sm text-destructive">
                                        A bill/receipt must be attached before confirming payment.
                                      </p>
                                    )}
                                  </div>
                                )}

                                {/* Waiting message for non-requester after paying */}
                                {isPaid && !isRequester && (
                                  <p className="text-sm text-muted-foreground">
                                    Waiting for {req.requester_name} to confirm receipt.
                                  </p>
                                )}

                                {/* Waiting message for requester before payment */}
                                {!isPaid && isRequester && (
                                  <p className="text-sm text-muted-foreground">
                                    Waiting for a family member to send payment.
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Mark as Completed button for moderators on confirmed requests */}
                            {isApproved && isConfirmed && !isCompleted && currentUserRole === 'moderator' && (
                              <div className="border-t border-border pt-3 mt-3">
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleMarkAsCompleted(req.id)}
                                  className="w-full"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Mark as Completed
                                </Button>
                                <p className="text-xs text-muted-foreground mt-2">
                                  Marking as completed will allow new financial requests to be submitted.
                                </p>
                              </div>
                            )}
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
          <TabsContent value="values" className="mt-0 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-display flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Family Values & Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Guiding Values Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-foreground">Guiding Values</h3>
                      {currentUserRole === 'moderator' && familyValues.length > 0 && !isEditingValues && (
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
                          if (!valueOption) return null;
                          return (
                            <div
                              key={fv.id}
                              className="px-3 py-2 rounded-lg bg-primary/10 border border-primary flex items-center gap-2"
                            >
                              <Heart className="h-4 w-4 text-primary shrink-0" />
                              <span className="font-medium text-sm text-foreground">{valueOption.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* Selection mode */
                      currentUserRole === 'moderator' || isEditingValues || familyValues.length === 0 ? (
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground">
                            {currentUserRole === 'moderator' 
                              ? `Select 2 values (${selectedValues.length}/2 selected):`
                              : 'A family moderator will select the guiding values for your family.'}
                          </p>
                          
                          {currentUserRole === 'moderator' && (
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
                                        <Heart className={`h-3 w-3 shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
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
                              </div>
                              
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
                      {currentUserRole === 'moderator' && familyCommonGoals.length > 0 && !isEditingCommonGoals && (
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
                      Choose <strong>two common goals</strong> your family will work toward together. Mark them complete as you achieve them.
                    </p>

                    {/* Show current common goals if set and not editing */}
                    {familyCommonGoals.length > 0 && !isEditingCommonGoals ? (
                      <div className="grid gap-2">
                        {familyCommonGoals.map(fg => {
                          const goalOption = COMMON_GOALS_OPTIONS.find(g => g.key === fg.goal_key);
                          if (!goalOption) return null;
                          return (
                            <div
                              key={fg.id}
                              className={`px-3 py-2 rounded-lg border flex items-center justify-between gap-2 ${
                                fg.completed_at 
                                  ? 'bg-primary/10 border-primary/30' 
                                  : 'bg-secondary/50 border-border'
                              }`}
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {currentUserRole === 'moderator' ? (
                                  <button
                                    onClick={() => handleToggleCommonGoalComplete(fg.id, !!fg.completed_at)}
                                    className={`shrink-0 h-4 w-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                                      fg.completed_at
                                        ? 'bg-primary border-primary text-primary-foreground'
                                        : 'border-muted-foreground hover:border-primary'
                                    }`}
                                  >
                                    {fg.completed_at && <Check className="h-2.5 w-2.5" />}
                                  </button>
                                ) : (
                                  <div
                                    className={`shrink-0 h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                                      fg.completed_at
                                        ? 'bg-primary border-primary text-primary-foreground'
                                        : 'border-muted-foreground'
                                    }`}
                                  >
                                    {fg.completed_at && <Check className="h-2.5 w-2.5" />}
                                  </div>
                                )}
                                <span className={`text-sm font-medium truncate ${fg.completed_at ? 'line-through text-muted-foreground' : ''}`}>
                                  {goalOption.name}
                                </span>
                              </div>
                              {fg.completed_at && (
                                <Badge variant="default" className="bg-primary/80 shrink-0 text-xs">
                                  Complete
                                </Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* Selection mode */
                      currentUserRole === 'moderator' || isEditingCommonGoals || familyCommonGoals.length === 0 ? (
                        <div className="space-y-3">
                          {currentUserRole === 'moderator' ? (
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
                                      className={`px-3 py-2 rounded-lg border text-left transition-all text-sm ${
                                        isSelected 
                                          ? 'bg-primary/10 border-primary' 
                                          : 'bg-secondary/50 border-border hover:border-primary/50'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <Target className={`h-3 w-3 shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
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
                              </div>
                              
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
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-display flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Family Boundaries
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBoundaryForm(!showBoundaryForm)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Propose Boundary
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <p className="text-sm text-muted-foreground">
                    Clear boundaries help protect both the recovering person and family members. 
                    Propose boundaries that will be reviewed by a moderator.
                  </p>

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
                        <Label htmlFor="boundaryContent">Boundary Description</Label>
                        <Textarea
                          id="boundaryContent"
                          placeholder="Describe the boundary clearly and specifically..."
                          value={newBoundaryContent}
                          onChange={(e) => setNewBoundaryContent(e.target.value)}
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleCreateBoundary}
                          disabled={!newBoundaryContent.trim() || isAddingBoundary}
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
                  {currentUserRole === 'moderator' && familyBoundaries.filter(b => b.status === 'pending').length > 0 && (
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
                  {currentUserRole !== 'moderator' && familyBoundaries.filter(b => b.status === 'pending' && b.created_by === user?.id).length > 0 && (
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
                                <p className="text-xs text-muted-foreground mt-2">
                                  Awaiting moderator approval...
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
                              </div>
                              {currentUserRole === 'moderator' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                                  onClick={() => handleDeleteBoundary(boundary.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
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
                          <span>Recovery progress must be demonstrated through regular meeting check-ins.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>Immediate response is required for all location check-in requests. Failure to respond may result in loss of cell phone service.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>Any relapse must be disclosed to the family within 24 hours.</span>
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
                      Violations of these boundaries may result in reduced financial support, 
                      more frequent check-ins, or other consequences as agreed by the family.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Test Results Tab */}
          <TabsContent value="test-results" className="mt-0 space-y-4 overflow-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-display flex items-center gap-2">
                  <FlaskConical className="h-5 w-5 text-primary" />
                  Test Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FlaskConical className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">Coming Soon</h3>
                  <p className="text-muted-foreground max-w-md">
                    Breathalyzer and drug testing integration is coming soon. 
                    This feature will allow family members to view and track test results 
                    as part of the recovery accountability process.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

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
            <SheetDescription>
              {members.length} family members
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

            {/* Family Members List */}
            <div className="space-y-3">
              <h3 className="font-medium text-foreground">Family Members</h3>
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex flex-col p-3 rounded-lg bg-secondary/50 gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(member.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">
                            {member.full_name}
                            {member.user_id === user?.id && (
                              <span className="text-muted-foreground ml-2">(You)</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {currentUserRole === 'moderator' && member.user_id !== user?.id && (
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
                            member.role === 'moderator'
                              ? 'default'
                              : member.role === 'recovering'
                              ? 'outline'
                              : 'secondary'
                          }
                        >
                          {member.role}
                        </Badge>
                      </div>
                    </div>
                    {/* Private messaging toggle for recovering members - only shown to moderators */}
                    {currentUserRole === 'moderator' && 
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
                ))}
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

      {/* Private Messaging */}
      {user && familyId && (
        <PrivateMessaging
          familyId={familyId}
          currentUserId={user.id}
          currentUserRole={currentUserRole}
          currentUserMessagingEnabled={members.find(m => m.user_id === user.id)?.private_messaging_enabled ?? false}
          hasProfessionalModerator={hasProfessionalModerator}
          members={members}
          isOpen={privateMessagingOpen}
          onClose={() => setPrivateMessagingOpen(false)}
        />
      )}
    </div>
  );
};

export default FamilyChat;
