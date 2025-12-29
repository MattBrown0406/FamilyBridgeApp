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
  MessageCircle, AlertTriangle, Check, X, Shield 
} from 'lucide-react';
import { format } from 'date-fns';

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

interface FinancialRequest {
  id: string;
  amount: number;
  reason: string;
  status: string;
  requester_id: string;
  requester_name?: string;
  created_at: string;
  votes: { approved: boolean; voter_id: string }[];
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
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string>('member');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && familyId) {
      fetchFamilyData();
      subscribeToMessages();
    }
  }, [user, familyId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchFamilyData = async () => {
    try {
      // Fetch family info
      const { data: familyData, error: familyError } = await supabase
        .from('families')
        .select('*')
        .eq('id', familyId)
        .single();

      if (familyError) throw familyError;
      setFamily(familyData);

      // Fetch members with profiles
      const { data: membersData, error: membersError } = await supabase
        .from('family_members')
        .select(`
          id,
          user_id,
          role,
          profiles (
            full_name
          )
        `)
        .eq('family_id', familyId);

      if (membersError) throw membersError;
      
      const formattedMembers = (membersData || []).map(m => ({
        id: m.id,
        user_id: m.user_id,
        role: m.role,
        full_name: (m.profiles as any)?.full_name || 'Unknown',
      }));
      setMembers(formattedMembers);

      // Set current user role
      const currentMember = formattedMembers.find(m => m.user_id === user?.id);
      if (currentMember) {
        setCurrentUserRole(currentMember.role);
      }

      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          sender_id,
          was_filtered,
          created_at
        `)
        .eq('family_id', familyId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      const messagesWithNames = (messagesData || []).map(msg => {
        const sender = formattedMembers.find(m => m.user_id === msg.sender_id);
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

    const requestsWithNames = (requestsData || []).map(req => {
      const requester = membersList.find(m => m.user_id === req.requester_id);
      return {
        id: req.id,
        amount: req.amount,
        reason: req.reason,
        status: req.status,
        requester_id: req.requester_id,
        requester_name: requester?.full_name || 'Unknown',
        created_at: req.created_at,
        votes: req.financial_votes || [],
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
    if (isNaN(amount) || amount <= 0 || !requestReason.trim()) {
      toast({
        title: 'Invalid request',
        description: 'Please enter a valid amount and reason.',
        variant: 'destructive',
      });
      return;
    }

    setIsRequesting(true);
    try {
      const { error } = await supabase
        .from('financial_requests')
        .insert({
          family_id: familyId,
          requester_id: user?.id,
          amount,
          reason: requestReason.trim(),
        });

      if (error) throw error;

      toast({
        title: 'Request submitted',
        description: 'Your financial request has been submitted for approval.',
      });

      setRequestAmount('');
      setRequestReason('');
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
            {currentUserRole === 'moderator' && (
              <Badge variant="outline" className="ml-auto">
                <Shield className="h-3 w-3 mr-1" />
                Moderator
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-4 overflow-hidden">
        <Tabs defaultValue="messages" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mb-4 shrink-0">
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Messages</span>
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
                        <Input
                          placeholder="Reason for request"
                          value={requestReason}
                          onChange={(e) => setRequestReason(e.target.value)}
                        />
                      </div>
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
                            </div>
                            <p className="text-sm mb-3">{req.reason}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Check className="h-4 w-4 text-success" />
                                  {approvalCount}
                                </span>
                                <span className="flex items-center gap-1">
                                  <X className="h-4 w-4 text-destructive" />
                                  {denialCount}
                                </span>
                              </div>
                              {req.status === 'pending' && 
                               req.requester_id !== user?.id && 
                               !hasVoted && (
                                <div className="flex gap-2">
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
                              {hasVoted && (
                                <span className="text-sm text-muted-foreground">
                                  You've voted
                                </span>
                              )}
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

          {/* Members Tab */}
          <TabsContent value="members" className="mt-0">
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
