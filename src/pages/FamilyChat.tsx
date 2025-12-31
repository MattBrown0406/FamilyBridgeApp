import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { filterContent } from '@/lib/contentFilter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
}

interface FamilyGoal {
  id: string;
  family_id: string;
  goal_type: string;
  created_at: string;
  created_by: string;
  completed_at: string | null;
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

const GOAL_OPTIONS = [
  { value: 'into_treatment', label: 'Get {name} into treatment' },
  { value: 'complete_treatment', label: 'Help {name} complete treatment' },
  { value: 'finish_aftercare', label: 'Help {name} finish aftercare plan' },
  { value: 'one_year_sobriety', label: 'Help {name} get to one year of sobriety' },
] as const;

const FamilyChat = () => {
  const { familyId } = useParams();
  const { user, loading } = useAuth();
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
  
  // Goals state
  const [familyGoals, setFamilyGoals] = useState<FamilyGoal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState('');
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  
  // Boundaries state
  const [familyBoundaries, setFamilyBoundaries] = useState<FamilyBoundary[]>([]);
  const [newBoundaryContent, setNewBoundaryContent] = useState('');
  const [newBoundaryTarget, setNewBoundaryTarget] = useState<string>('all');
  const [isAddingBoundary, setIsAddingBoundary] = useState(false);
  const [showBoundaryForm, setShowBoundaryForm] = useState(false);
  
  // Private messaging state
  const [privateMessagingOpen, setPrivateMessagingOpen] = useState(false);
  const [unreadPrivateMessages, setUnreadPrivateMessages] = useState(0);

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
        .select('id, name, description')
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
        .select('id, user_id, role')
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
      
      // Fetch family goals
      await fetchFamilyGoals();
      
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

  const fetchFamilyGoals = async () => {
    const { data, error } = await supabase
      .from('family_goals')
      .select('*')
      .eq('family_id', familyId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching goals:', error);
      return;
    }

    setFamilyGoals(data || []);
  };

  const handleAddGoal = async () => {
    if (!selectedGoal || !user || !familyId) return;

    setIsAddingGoal(true);
    try {
      const { error } = await supabase
        .from('family_goals')
        .insert({
          family_id: familyId,
          goal_type: selectedGoal,
          created_by: user.id,
        });

      if (error) throw error;

      toast({
        title: 'Goal added',
        description: 'Family goal has been added successfully.',
      });

      setSelectedGoal('');
      await fetchFamilyGoals();
    } catch (error) {
      console.error('Error adding goal:', error);
      toast({
        title: 'Error',
        description: 'Failed to add goal.',
        variant: 'destructive',
      });
    } finally {
      setIsAddingGoal(false);
    }
  };

  const handleToggleGoalComplete = async (goalId: string, isCompleted: boolean) => {
    try {
      const { error } = await supabase
        .from('family_goals')
        .update({
          completed_at: isCompleted ? null : new Date().toISOString(),
        })
        .eq('id', goalId);

      if (error) throw error;

      await fetchFamilyGoals();
    } catch (error) {
      console.error('Error updating goal:', error);
      toast({
        title: 'Error',
        description: 'Failed to update goal.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      const { error } = await supabase
        .from('family_goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;

      toast({
        title: 'Goal removed',
        description: 'Family goal has been removed.',
      });

      await fetchFamilyGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove goal.',
        variant: 'destructive',
      });
    }
  };

  const getRecoveringMemberName = () => {
    const recoveringMember = members.find(m => m.role === 'recovering');
    return recoveringMember?.full_name || 'your loved one';
  };

  const getGoalLabel = (goalType: string) => {
    const option = GOAL_OPTIONS.find(o => o.value === goalType);
    if (!option) return goalType;
    return option.label.replace('{name}', getRecoveringMemberName());
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

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card shrink-0">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <button 
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              onClick={() => setMembersSheetOpen(true)}
            >
              <Heart className="h-6 w-6 text-primary" />
              <div className="text-left">
                <h1 className="font-display font-semibold text-foreground">{family?.name}</h1>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {members.length} members
                </p>
              </div>
            </button>
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setPrivateMessagingOpen(true);
                  // Reset count when opening (will be updated by component)
                }}
                title="Private Messages"
                className="relative"
              >
                <MessageSquare className="h-5 w-5" />
                {unreadPrivateMessages > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-medium">
                    {unreadPrivateMessages > 9 ? '9+' : unreadPrivateMessages}
                  </span>
                )}
              </Button>
              {currentUserRole === 'moderator' && (
                <Badge variant="outline">
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
          <TabsList className="grid w-full grid-cols-6 mb-4 shrink-0">
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Messages</span>
            </TabsTrigger>
            <TabsTrigger value="checkin" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Check-in</span>
            </TabsTrigger>
            <TabsTrigger value="financial" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Financial</span>
            </TabsTrigger>
            <TabsTrigger value="values" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Values/Goals</span>
            </TabsTrigger>
            <TabsTrigger value="boundaries" className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Boundaries</span>
            </TabsTrigger>
            <TabsTrigger value="test-results" className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4" />
              <span className="hidden sm:inline">Test Results</span>
            </TabsTrigger>
          </TabsList>

          {/* Messages Tab */}
          <TabsContent value="messages" className="flex-1 flex flex-col overflow-hidden mt-0">
            <Card className="flex-1 flex flex-col overflow-hidden">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${msg.sender_id === user?.id ? 'flex-row-reverse' : ''}`}
                      >
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {getInitials(msg.sender_name || '')}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`max-w-[70%] ${msg.sender_id === user?.id ? 'items-end' : ''}`}>
                          <div className="flex items-center gap-2 mb-1">
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
                            className={`rounded-2xl px-4 py-2 ${
                              msg.sender_id === user?.id
                                ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                : 'bg-secondary text-secondary-foreground rounded-tl-sm'
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              <form onSubmit={handleSendMessage} className="p-4 border-t border-border shrink-0">
                {cooldownRemaining > 0 && (
                  <div className="mb-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
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
                    className="flex-1"
                    disabled={cooldownRemaining > 0}
                  />
                  <Button type="submit" disabled={isSending || !newMessage.trim() || cooldownRemaining > 0}>
                    {isSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : cooldownRemaining > 0 ? (
                      <span className="text-xs">{cooldownRemaining}s</span>
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <ConversationStarters 
                    onSelect={(prompt) => setNewMessage(prompt)}
                    disabled={cooldownRemaining > 0}
                  />
                  <p className="text-xs text-muted-foreground">
                    Messages are filtered for harmful language.
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
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 font-display text-lg">
                    <MapPin className="h-5 w-5 text-primary" />
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
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-display">Request Financial Support</CardTitle>
                </CardHeader>
                <CardContent>
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
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">Reason</Label>
                        <Select value={requestReason} onValueChange={setRequestReason}>
                          <SelectTrigger className="bg-background">
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
                                {isConfirmed && (
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
                  <div className="space-y-3">
                    <h3 className="font-medium text-foreground">Core Values</h3>
                    <p className="text-sm text-muted-foreground">
                      Define the values that guide your family's recovery journey together.
                    </p>
                    <div className="grid gap-3">
                      <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                        <div className="flex items-center gap-2 mb-2">
                          <Heart className="h-4 w-4 text-primary" />
                          <span className="font-medium">Honesty & Transparency</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          We commit to open communication and truthfulness with each other.
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="h-4 w-4 text-primary" />
                          <span className="font-medium">Support Without Enabling</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          We help each other while maintaining healthy accountability.
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="h-4 w-4 text-primary" />
                          <span className="font-medium">Respect & Dignity</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          We treat each other with compassion, even in difficult moments.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-foreground">Shared Goals</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Track your family's collective recovery milestones.
                    </p>

                    {/* Moderator goal selection */}
                    {currentUserRole === 'moderator' && (
                      <div className="flex gap-2">
                        <Select value={selectedGoal} onValueChange={setSelectedGoal}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select a goal to add..." />
                          </SelectTrigger>
                          <SelectContent>
                            {GOAL_OPTIONS.filter(
                              option => !familyGoals.some(g => g.goal_type === option.value)
                            ).map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label.replace('{name}', getRecoveringMemberName())}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={handleAddGoal}
                          disabled={!selectedGoal || isAddingGoal}
                          size="icon"
                        >
                          {isAddingGoal ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    )}

                    {/* Goals list */}
                    <div className="grid gap-3">
                      {familyGoals.length === 0 ? (
                        <div className="p-4 rounded-lg bg-secondary/30 border border-border text-center">
                          <p className="text-sm text-muted-foreground">
                            No goals set yet. {currentUserRole === 'moderator' && 'Select a goal above to get started.'}
                          </p>
                        </div>
                      ) : (
                        familyGoals.map((goal) => (
                          <div
                            key={goal.id}
                            className={`p-4 rounded-lg border ${
                              goal.completed_at
                                ? 'bg-primary/10 border-primary/30'
                                : 'bg-primary/5 border-primary/20'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-3 flex-1">
                                {currentUserRole === 'moderator' ? (
                                  <button
                                    onClick={() => handleToggleGoalComplete(goal.id, !!goal.completed_at)}
                                    className={`shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                      goal.completed_at
                                        ? 'bg-primary border-primary text-primary-foreground'
                                        : 'border-muted-foreground hover:border-primary'
                                    }`}
                                  >
                                    {goal.completed_at && <Check className="h-3 w-3" />}
                                  </button>
                                ) : (
                                  <div
                                    className={`shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                                      goal.completed_at
                                        ? 'bg-primary border-primary text-primary-foreground'
                                        : 'border-muted-foreground'
                                    }`}
                                  >
                                    {goal.completed_at && <Check className="h-3 w-3" />}
                                  </div>
                                )}
                                <span className={`font-medium ${goal.completed_at ? 'line-through text-muted-foreground' : ''}`}>
                                  {getGoalLabel(goal.goal_type)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {goal.completed_at ? (
                                  <Badge variant="default" className="bg-primary/80">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Complete
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">In Progress</Badge>
                                )}
                                {currentUserRole === 'moderator' && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    onClick={() => handleDeleteGoal(goal.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
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
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                  >
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
          members={members}
          isOpen={privateMessagingOpen}
          onClose={() => setPrivateMessagingOpen(false)}
        />
      )}
    </div>
  );
};

export default FamilyChat;
