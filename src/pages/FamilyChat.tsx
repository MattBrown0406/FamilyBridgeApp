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
  ExternalLink, CreditCard, CheckCircle2, Paperclip, Image, HandCoins, Trash2
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
import { Textarea } from '@/components/ui/textarea';
import { NotificationBell } from '@/components/NotificationBell';
import { MeetingCheckin } from '@/components/MeetingCheckin';
import { CheckinHistory } from '@/components/CheckinHistory';

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
  requester_paypal?: string | null;
  requester_venmo?: string | null;
  requester_cashapp?: string | null;
  attachment_url?: string | null;
}

interface Family {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
}

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
    }
  }, [user, familyId]);

  const fetchPaymentHandles = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('paypal_username, venmo_username, cashapp_username')
      .eq('id', user.id)
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
      const { error } = await supabase
        .from('profiles')
        .update({
          paypal_username: paypalUsername.trim() || null,
          venmo_username: venmoUsername.trim() || null,
          cashapp_username: cashappUsername.trim() || null,
        })
        .eq('id', user.id);

      if (error) throw error;

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
      const { data: familyData, error: familyError } = await supabase
        .from('families')
        .select('*')
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

      const profilesById = new Map<string, string>();

      if (memberUserIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', memberUserIds);

        if (profilesError) throw profilesError;

        for (const p of profilesData || []) {
          profilesById.set(p.id, p.full_name);
        }
      }

      const formattedMembers: Member[] = memberRows.map((m) => ({
        id: m.id,
        user_id: m.user_id,
        role: m.role,
        full_name: profilesById.get(m.user_id) || 'Unknown',
      }));

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
    
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, full_name, paypal_username, venmo_username, cashapp_username')
      .in('id', allUserIds.length > 0 ? allUserIds : ['00000000-0000-0000-0000-000000000000']);

    const profilesById = new Map(
      (profilesData || []).map(p => [p.id, p] as const)
    );

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
        requester_paypal: profile?.paypal_username || null,
        requester_venmo: profile?.venmo_username || null,
        requester_cashapp: profile?.cashapp_username || null,
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setIsSending(true);
    try {
      const filterResult = filterContent(newMessage);

      const { error } = await supabase
        .from('messages')
        .insert({
          family_id: familyId,
          sender_id: user?.id,
          content: filterResult.filteredContent,
          original_content: filterResult.isClean ? null : filterResult.originalContent,
          was_filtered: !filterResult.isClean,
        });

      if (error) throw error;

      if (!filterResult.isClean) {
        toast({
          title: 'Message filtered',
          description: 'Some content was modified to maintain a supportive environment.',
          variant: 'default',
        });
      }

      setNewMessage('');
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

  // Payment link generators
  const getPayPalLink = (username: string, amount: number) => {
    return `https://paypal.me/${username}/${amount.toFixed(2)}`;
  };

  const getVenmoLink = (username: string, amount: number, note: string) => {
    const encodedNote = encodeURIComponent(note);
    return `https://venmo.com/${username}?txn=pay&amount=${amount.toFixed(2)}&note=${encodedNote}`;
  };

  const getCashAppLink = (username: string, amount: number, note: string) => {
    const encodedNote = encodeURIComponent(note);
    return `https://cash.app/$${username}/${amount.toFixed(2)}?note=${encodedNote}`;
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

  const handleConfirmReceipt = async (requestId: string) => {
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
            <div className="flex items-center gap-2">
              <Heart className="h-6 w-6 text-primary" />
              <div>
                <h1 className="font-display font-semibold text-foreground">{family?.name}</h1>
                <p className="text-xs text-muted-foreground">{members.length} members</p>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
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
          <TabsList className="grid w-full grid-cols-4 mb-4 shrink-0">
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
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Members</span>
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
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a supportive message..."
                    className="flex-1"
                  />
                  <Button type="submit" disabled={isSending || !newMessage.trim()}>
                    {isSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Messages are filtered for harmful language to maintain a supportive environment.
                </p>
              </form>
            </Card>
          </TabsContent>

          {/* Check-in Tab */}
          <TabsContent value="checkin" className="flex-1 overflow-auto mt-0">
            <div className="space-y-4">
              <MeetingCheckin 
                familyId={familyId!} 
                onCheckinComplete={() => setCheckinRefreshKey(k => k + 1)} 
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
                        const hasPaymentHandles = req.requester_paypal || req.requester_venmo || req.requester_cashapp;

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

                            {/* Bill Attachment */}
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
                                {/* If not paid yet - show payment links to non-requesters */}
                                {!isPaid && !isRequester && (
                                  <div className="space-y-2">
                                    <p className="text-sm font-medium text-foreground">Send Payment:</p>
                                    {hasPaymentHandles ? (
                                      <div className="flex flex-wrap gap-2">
                                        {req.requester_paypal && (
                                          <a
                                            href={getPayPalLink(req.requester_paypal, req.amount)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex"
                                          >
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => handleMarkAsPaid(req.id, 'PayPal')}
                                            >
                                              <ExternalLink className="h-3 w-3 mr-1" />
                                              PayPal
                                            </Button>
                                          </a>
                                        )}
                                        {req.requester_venmo && (
                                          <a
                                            href={getVenmoLink(req.requester_venmo, req.amount, `FamilyBridge: ${req.reason}`)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex"
                                          >
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => handleMarkAsPaid(req.id, 'Venmo')}
                                            >
                                              <ExternalLink className="h-3 w-3 mr-1" />
                                              Venmo
                                            </Button>
                                          </a>
                                        )}
                                        {req.requester_cashapp && (
                                          <a
                                            href={getCashAppLink(req.requester_cashapp, req.amount, `FamilyBridge: ${req.reason}`)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex"
                                          >
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => handleMarkAsPaid(req.id, 'Cash App')}
                                            >
                                              <ExternalLink className="h-3 w-3 mr-1" />
                                              Cash App
                                            </Button>
                                          </a>
                                        )}
                                      </div>
                                    ) : (
                                      <p className="text-sm text-muted-foreground">
                                        Requester hasn't set up payment handles. Contact them directly.
                                      </p>
                                    )}
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button size="sm" variant="secondary" className="mt-2">
                                          <CreditCard className="h-3 w-3 mr-1" />
                                          I Paid Another Way
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

                                {/* If paid - show confirm button to requester */}
                                {isPaid && isRequester && (
                                  <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">
                                      Payment sent via {req.payment_method}. Did you receive it?
                                    </p>
                                    <Button
                                      size="sm"
                                      variant="success"
                                      onClick={() => handleConfirmReceipt(req.id)}
                                    >
                                      <CheckCircle2 className="h-4 w-4 mr-1" />
                                      Confirm Receipt
                                    </Button>
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

          {/* Members Tab */}
          <TabsContent value="members" className="mt-0 space-y-4">
            {/* Payment Handles Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-display">Your Payment Handles</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
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
              </CardContent>
            </Card>

            {/* Family Members List */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-display">Family Members</CardTitle>
              </CardHeader>
              <CardContent>
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
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default FamilyChat;
