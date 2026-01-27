import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { fetchProfilesByIds } from '@/lib/profileApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  MessageSquare,
  Plus,
  Send,
  Users,
  User,
  Loader2,
  ArrowLeft,
  Home,
} from 'lucide-react';
import { format } from 'date-fns';

interface Conversation {
  id: string;
  organization_id: string;
  family_id: string | null;
  family_name?: string | null;
  name: string | null;
  is_direct_message: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  participants?: { user_id: string; full_name?: string; avatar_url?: string | null }[];
  last_message?: string;
  last_message_time?: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_name?: string;
  sender_avatar?: string | null;
}

interface OrgMember {
  user_id: string;
  full_name: string;
  avatar_url?: string | null;
  role: string;
}

interface Family {
  id: string;
  name: string;
}

interface ProviderMessagingProps {
  organizationId: string;
  orgMembers?: OrgMember[];
  families?: Family[];
}

export const ProviderMessaging = ({ organizationId, orgMembers = [], families = [] }: ProviderMessagingProps) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // New conversation form
  const [newConversationName, setNewConversationName] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [isDirectMessage, setIsDirectMessage] = useState(false);
  const [selectedFamilyForConv, setSelectedFamilyForConv] = useState<string | null>(null);

  useEffect(() => {
    if (organizationId) {
      fetchConversations();
    }
  }, [organizationId]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      
      // Subscribe to realtime messages
      const channel = supabase
        .channel(`provider-messages-${selectedConversation.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'provider_messages',
            filter: `conversation_id=eq.${selectedConversation.id}`,
          },
          async (payload) => {
            const newMsg = payload.new as Message;
            // Fetch sender name
            const profiles = await fetchProfilesByIds([newMsg.sender_id]);
            const senderProfile = profiles.find(p => p.id === newMsg.sender_id);
            setMessages(prev => [...prev, {
              ...newMsg,
              sender_name: senderProfile?.full_name || 'Unknown',
              sender_avatar: senderProfile?.avatar_url,
            }]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    setIsLoading(true);
    try {
      // Get conversations where user is a participant
      const { data: participations, error: partError } = await supabase
        .from('provider_conversation_participants')
        .select('conversation_id')
        .eq('user_id', user?.id);

      if (partError) throw partError;

      if (!participations || participations.length === 0) {
        setConversations([]);
        setIsLoading(false);
        return;
      }

      const conversationIds = participations.map(p => p.conversation_id);
      
      const { data: convs, error: convsError } = await supabase
        .from('provider_conversations')
        .select('*')
        .in('id', conversationIds)
        .order('updated_at', { ascending: false });

      if (convsError) throw convsError;

      // Fetch participants and family names for each conversation
      const convsWithParticipants = await Promise.all((convs || []).map(async conv => {
        const { data: parts } = await supabase
          .from('provider_conversation_participants')
          .select('user_id')
          .eq('conversation_id', conv.id);
        
        const userIds = parts?.map(p => p.user_id) || [];
        const profiles = await fetchProfilesByIds(userIds);
        
        // Get family name if family_id exists
        let familyName: string | null = null;
        if (conv.family_id) {
          const family = families.find(f => f.id === conv.family_id);
          familyName = family?.name || null;
        }
        
        return {
          ...conv,
          family_name: familyName,
          participants: profiles.map(p => ({
            user_id: p.id,
            full_name: p.full_name,
            avatar_url: p.avatar_url,
          })),
        };
      }));

      setConversations(convsWithParticipants);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      toast({ title: 'Error', description: 'Failed to load conversations', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    setIsLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from('provider_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const senderIds = [...new Set(data.map(m => m.sender_id))];
        const profiles = await fetchProfilesByIds(senderIds);
        
        const messagesWithNames = data.map(msg => ({
          ...msg,
          sender_name: profiles.find(p => p.id === msg.sender_id)?.full_name || 'Unknown',
          sender_avatar: profiles.find(p => p.id === msg.sender_id)?.avatar_url,
        }));
        setMessages(messagesWithNames);
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleCreateConversation = async () => {
    if (selectedParticipants.length === 0) {
      toast({ title: 'Error', description: 'Select at least one participant', variant: 'destructive' });
      return;
    }

    if (!isDirectMessage && !newConversationName.trim()) {
      toast({ title: 'Error', description: 'Group conversations need a name', variant: 'destructive' });
      return;
    }

    setIsCreating(true);
    try {
      // Create conversation
      const { data: conv, error: convError } = await supabase
        .from('provider_conversations')
        .insert({
          organization_id: organizationId,
          family_id: selectedFamilyForConv || null,
          name: isDirectMessage ? null : newConversationName.trim(),
          is_direct_message: isDirectMessage && selectedParticipants.length === 1,
          created_by: user?.id,
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add participants (including creator)
      const allParticipants = [...new Set([user?.id!, ...selectedParticipants])];
      const { error: partError } = await supabase
        .from('provider_conversation_participants')
        .insert(allParticipants.map(userId => ({
          conversation_id: conv.id,
          user_id: userId,
        })));

      if (partError) throw partError;

      toast({ title: 'Success', description: 'Conversation created!' });
      setIsCreateDialogOpen(false);
      setNewConversationName('');
      setSelectedParticipants([]);
      setIsDirectMessage(false);
      setSelectedFamilyForConv(null);
      fetchConversations();
    } catch (err: any) {
      console.error('Error creating conversation:', err);
      toast({ title: 'Error', description: err.message || 'Failed to create conversation', variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    setIsSending(true);
    try {
      const { error } = await supabase
        .from('provider_messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: user?.id,
          content: newMessage.trim(),
        });

      if (error) throw error;

      // Update conversation's updated_at
      await supabase
        .from('provider_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selectedConversation.id);

      // Send alerts to assigned moderator and provider admins if conversation has a family
      if (selectedConversation.family_id) {
        await sendFamilyAlerts(
          selectedConversation.family_id,
          selectedConversation.family_name || 'Family',
          newMessage.trim()
        );
      }

      setNewMessage('');
    } catch (err: any) {
      console.error('Error sending message:', err);
      toast({ title: 'Error', description: err.message || 'Failed to send message', variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  const sendFamilyAlerts = async (familyId: string, familyName: string, messagePreview: string) => {
    try {
      // Get the assigned moderator
      const { data: moderatorId } = await supabase.rpc('get_family_moderator_id', { _family_id: familyId });
      
      // Get provider admins
      const { data: adminIds } = await supabase.rpc('get_family_provider_admins', { _family_id: familyId });
      
      // Collect alert recipients (exclude current user)
      const alertRecipients = new Set<string>();
      if (moderatorId && moderatorId !== user?.id) {
        alertRecipients.add(moderatorId);
      }
      if (adminIds) {
        for (const admin of adminIds) {
          if (admin.user_id !== user?.id) {
            alertRecipients.add(admin.user_id);
          }
        }
      }

      if (alertRecipients.size === 0) return;

      // Create notifications for each recipient
      const notifications = Array.from(alertRecipients).map(recipientId => ({
        user_id: recipientId,
        type: 'provider_message',
        title: `Team message about ${familyName}`,
        body: messagePreview.length > 100 ? messagePreview.substring(0, 100) + '...' : messagePreview,
        related_id: selectedConversation?.id,
      }));

      await supabase.from('notifications').insert(notifications);
    } catch (err) {
      console.error('Error sending family alerts:', err);
      // Don't fail the message send if alerts fail
    }
  };

  const getConversationDisplayName = (conv: Conversation) => {
    if (conv.name) return conv.name;
    if (conv.is_direct_message && conv.participants) {
      const otherParticipant = conv.participants.find(p => p.user_id !== user?.id);
      return otherParticipant?.full_name || 'Direct Message';
    }
    return 'Group Chat';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (selectedConversation) {
    return (
      <div className="flex flex-col h-[600px] border rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b bg-muted/30">
          <Button variant="ghost" size="icon" onClick={() => setSelectedConversation(null)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 flex-1">
            {selectedConversation.is_direct_message ? (
              <User className="h-5 w-5 text-muted-foreground" />
            ) : (
              <Users className="h-5 w-5 text-muted-foreground" />
            )}
            <div className="min-w-0">
              <span className="font-medium block truncate">{getConversationDisplayName(selectedConversation)}</span>
              {selectedConversation.family_name && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Home className="h-3 w-3" />
                  {selectedConversation.family_name}
                </span>
              )}
            </div>
          </div>
          {selectedConversation.family_name && (
            <Badge variant="secondary" className="text-xs">
              Alerts Active
            </Badge>
          )}
          {selectedConversation.participants && (
            <Badge variant="outline">
              {selectedConversation.participants.length} members
            </Badge>
          )}
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          {isLoadingMessages ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map(msg => {
                const isOwnMessage = msg.sender_id === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-2 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={msg.sender_avatar || undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials(msg.sender_name || 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`max-w-[70%] ${isOwnMessage ? 'text-right' : ''}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium">{msg.sender_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(msg.created_at), 'h:mm a')}
                        </span>
                      </div>
                      <div
                        className={`rounded-lg px-3 py-2 text-sm ${
                          isOwnMessage
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t bg-background">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex gap-2"
          >
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={isSending}
            />
            <Button type="submit" disabled={isSending || !newMessage.trim()}>
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Team Conversations</h3>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Conversation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start a Conversation</DialogTitle>
              <DialogDescription>
                Create a direct message or group conversation with team members.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="dm-toggle"
                  checked={isDirectMessage}
                  onCheckedChange={(checked) => {
                    setIsDirectMessage(!!checked);
                    if (checked && selectedParticipants.length > 1) {
                      setSelectedParticipants([selectedParticipants[0]]);
                    }
                  }}
                />
                <Label htmlFor="dm-toggle">Direct Message (1:1)</Label>
              </div>

              {!isDirectMessage && (
                <div className="space-y-2">
                  <Label>Group Name</Label>
                  <Input
                    value={newConversationName}
                    onChange={(e) => setNewConversationName(e.target.value)}
                    placeholder="e.g., Smith Family Case Discussion"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Family Context (Optional)</Label>
                <Select
                  value={selectedFamilyForConv || 'none'}
                  onValueChange={(v) => setSelectedFamilyForConv(v === 'none' ? null : v)}
                >
                  <SelectTrigger>
                    <Home className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="No family selected" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No family - General discussion</SelectItem>
                    {families.map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Messages about a family will alert the assigned moderator and provider admins.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Select Participants</Label>
                <div className="border rounded-lg max-h-48 overflow-y-auto p-2 space-y-1">
                  {orgMembers.filter(m => m.user_id !== user?.id).map(member => (
                    <div
                      key={member.user_id}
                      className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                        selectedParticipants.includes(member.user_id)
                          ? 'bg-primary/10 border border-primary/30'
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => {
                        if (isDirectMessage) {
                          setSelectedParticipants([member.user_id]);
                        } else {
                          setSelectedParticipants(prev =>
                            prev.includes(member.user_id)
                              ? prev.filter(id => id !== member.user_id)
                              : [...prev, member.user_id]
                          );
                        }
                      }}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatar_url || undefined} />
                        <AvatarFallback>{getInitials(member.full_name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{member.full_name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                      </div>
                      {selectedParticipants.includes(member.user_id) && (
                        <Badge variant="default" className="text-xs">Selected</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateConversation} disabled={isCreating}>
                  {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : conversations.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No conversations yet</h3>
            <p className="text-muted-foreground mb-4">
              Start a conversation with your team members for private discussions.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Start First Conversation
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {conversations.map(conv => (
            <Card
              key={conv.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedConversation(conv)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {conv.is_direct_message ? (
                      <User className="h-5 w-5 text-primary" />
                    ) : (
                      <Users className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{getConversationDisplayName(conv)}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {conv.participants?.length || 0} members
                      </span>
                      {conv.family_name && (
                        <Badge variant="secondary" className="text-xs">
                          <Home className="h-3 w-3 mr-1" />
                          {conv.family_name}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(conv.updated_at), 'MMM d')}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
