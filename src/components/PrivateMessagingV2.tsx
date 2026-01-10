import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Send, Loader2, ArrowLeft, MessageSquare, Plus, Users, X, Check } from 'lucide-react';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface Conversation {
  id: string;
  family_id: string;
  name: string | null;
  is_group: boolean;
  created_at: string;
  updated_at: string;
  participants: Participant[];
  lastMessage?: ConversationMessage;
  unreadCount: number;
}

interface Participant {
  id: string;
  conversation_id: string;
  user_id: string;
  last_read_at: string | null;
  full_name?: string;
}

interface ConversationMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_name?: string;
}

interface Member {
  id: string;
  user_id: string;
  role: string;
  full_name: string;
  private_messaging_enabled?: boolean;
}

interface PrivateMessagingV2Props {
  familyId: string;
  currentUserId: string;
  currentUserRole: string;
  currentUserMessagingEnabled: boolean;
  hasProfessionalModerator: boolean;
  members: Member[];
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
}

export const PrivateMessagingV2 = ({
  familyId,
  currentUserId,
  currentUserRole,
  currentUserMessagingEnabled,
  hasProfessionalModerator,
  members,
  isOpen,
  onClose,
  onUnreadCountChange,
}: PrivateMessagingV2Props) => {
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [view, setView] = useState<'list' | 'chat' | 'new'>('list');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get eligible chat partners based on role and permissions
  const getChatPartners = useCallback(() => {
    if (currentUserRole === 'moderator' || currentUserRole === 'admin') {
      return members.filter(m => m.user_id !== currentUserId);
    } else if (currentUserRole === 'recovering') {
      return members.filter(m => {
        if (m.user_id === currentUserId) return false;
        if (m.role !== 'moderator' && m.role !== 'admin') return false;
        if (hasProfessionalModerator) return true;
        return currentUserMessagingEnabled;
      });
    } else {
      return members.filter(m => 
        (m.role === 'moderator' || m.role === 'admin') && currentUserMessagingEnabled
      );
    }
  }, [members, currentUserId, currentUserRole, hasProfessionalModerator, currentUserMessagingEnabled]);

  const canSendMessages = () => {
    if (currentUserRole === 'moderator' || currentUserRole === 'admin') return true;
    if (hasProfessionalModerator) return true;
    return currentUserMessagingEnabled;
  };

  const fetchConversations = async () => {
    setIsLoading(true);
    try {
      // Get all conversations for this family that the user is part of
      const { data: participantData, error: pError } = await supabase
        .from('private_conversation_participants')
        .select('conversation_id')
        .eq('user_id', currentUserId);

      if (pError) throw pError;
      
      const conversationIds = (participantData || []).map(p => p.conversation_id);
      
      if (conversationIds.length === 0) {
        setConversations([]);
        setIsLoading(false);
        return;
      }

      // Get conversation details
      const { data: convData, error: cError } = await supabase
        .from('private_conversations')
        .select('*')
        .eq('family_id', familyId)
        .in('id', conversationIds)
        .order('updated_at', { ascending: false });

      if (cError) throw cError;

      // Get all participants for these conversations
      const { data: allParticipants } = await supabase
        .from('private_conversation_participants')
        .select('*')
        .in('conversation_id', conversationIds);

      // Get latest message for each conversation
      const conversationsWithDetails = await Promise.all(
        (convData || []).map(async (conv) => {
          const participants = (allParticipants || [])
            .filter(p => p.conversation_id === conv.id)
            .map(p => ({
              ...p,
              full_name: members.find(m => m.user_id === p.user_id)?.full_name || 'Unknown',
            }));

          // Get latest message
          const { data: msgData } = await supabase
            .from('private_conversation_messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1);

          const lastMessage = msgData?.[0] ? {
            ...msgData[0],
            sender_name: members.find(m => m.user_id === msgData[0].sender_id)?.full_name || 'Unknown',
          } : undefined;

          // Calculate unread count
          const myParticipant = participants.find(p => p.user_id === currentUserId);
          const lastReadAt = myParticipant?.last_read_at ? new Date(myParticipant.last_read_at) : new Date(0);
          
          const { count: unreadCount } = await supabase
            .from('private_conversation_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', currentUserId)
            .gt('created_at', lastReadAt.toISOString());

          return {
            ...conv,
            participants,
            lastMessage,
            unreadCount: unreadCount || 0,
          };
        })
      );

      setConversations(conversationsWithDetails);
      
      // Calculate total unread
      const totalUnread = conversationsWithDetails.reduce((sum, c) => sum + c.unreadCount, 0);
      onUnreadCountChange?.(totalUnread);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('private_conversation_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const messagesWithNames = (data || []).map(msg => ({
        ...msg,
        sender_name: members.find(m => m.user_id === msg.sender_id)?.full_name || 'Unknown',
      }));

      setMessages(messagesWithNames);

      // Mark as read
      await supabase
        .from('private_conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', currentUserId);

      // Update local unread count
      setConversations(prev => prev.map(c => 
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      ));
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const createConversation = async () => {
    if (selectedMembers.length === 0) return;

    setIsCreating(true);
    try {
      // Check if 1:1 conversation already exists
      if (selectedMembers.length === 1) {
        const existingConv = conversations.find(c => {
          if (c.is_group) return false;
          const otherParticipants = c.participants.filter(p => p.user_id !== currentUserId);
          return otherParticipants.length === 1 && otherParticipants[0].user_id === selectedMembers[0];
        });

        if (existingConv) {
          setSelectedConversation(existingConv);
          setView('chat');
          fetchMessages(existingConv.id);
          setSelectedMembers([]);
          setIsCreating(false);
          return;
        }
      }

      // Create new conversation
      const isGroup = selectedMembers.length > 1;
      const participantNames = selectedMembers
        .map(id => members.find(m => m.user_id === id)?.full_name || 'Unknown')
        .join(', ');
      
      const { data: convData, error: convError } = await supabase
        .from('private_conversations')
        .insert({
          family_id: familyId,
          name: isGroup ? participantNames : null,
          is_group: isGroup,
          created_by: currentUserId,
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add participants (including self)
      const allParticipants = [...selectedMembers, currentUserId];
      const { error: partError } = await supabase
        .from('private_conversation_participants')
        .insert(
          allParticipants.map(userId => ({
            conversation_id: convData.id,
            user_id: userId,
          }))
        );

      if (partError) throw partError;

      // Refresh and open new conversation
      await fetchConversations();
      
      const newConv: Conversation = {
        ...convData,
        participants: allParticipants.map(userId => ({
          id: '',
          conversation_id: convData.id,
          user_id: userId,
          last_read_at: new Date().toISOString(),
          full_name: members.find(m => m.user_id === userId)?.full_name || 'Unknown',
        })),
        unreadCount: 0,
      };

      setSelectedConversation(newConv);
      setView('chat');
      setMessages([]);
      setSelectedMembers([]);
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to create conversation.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    setIsSending(true);
    try {
      const { error } = await supabase
        .from('private_conversation_messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: currentUserId,
          content: newMessage.trim(),
        });

      if (error) throw error;

      // Update conversation updated_at
      await supabase
        .from('private_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selectedConversation.id);

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

  const getConversationTitle = (conv: Conversation) => {
    if (conv.name) return conv.name;
    const others = conv.participants.filter(p => p.user_id !== currentUserId);
    return others.map(p => p.full_name).join(', ') || 'Conversation';
  };

  const getConversationAvatar = (conv: Conversation) => {
    const others = conv.participants.filter(p => p.user_id !== currentUserId);
    if (others.length === 1 && others[0].full_name) {
      return getInitials(others[0].full_name);
    }
    return others.length.toString();
  };

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM d');
    }
  };

  // Subscribe to new messages - always active for unread badge updates
  useEffect(() => {
    const channel = supabase
      .channel(`private-conv-messages-${familyId}-${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'private_conversation_messages',
        },
        (payload) => {
          const newMsg = payload.new as ConversationMessage;
          
          // If sheet is open and viewing this conversation, add the message
          if (isOpen && selectedConversation && newMsg.conversation_id === selectedConversation.id) {
            const msgWithName = {
              ...newMsg,
              sender_name: members.find(m => m.user_id === newMsg.sender_id)?.full_name || 'Unknown',
            };
            setMessages(prev => [...prev, msgWithName]);

            // Mark as read if we're the recipient
            if (newMsg.sender_id !== currentUserId) {
              supabase
                .from('private_conversation_participants')
                .update({ last_read_at: new Date().toISOString() })
                .eq('conversation_id', newMsg.conversation_id)
                .eq('user_id', currentUserId);
            }
          }

          // Always update conversation list and unread counts
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [familyId, currentUserId, isOpen, selectedConversation, members]);

  // Initial fetch of conversations for unread count
  useEffect(() => {
    fetchConversations();
  }, [familyId, currentUserId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch conversations when sheet opens
  useEffect(() => {
    if (isOpen) {
      fetchConversations();
    } else {
      setView('list');
      setSelectedConversation(null);
      setMessages([]);
      setSelectedMembers([]);
    }
  }, [isOpen]);

  // Fetch messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  const chatPartners = getChatPartners();
  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0 gap-0">
        {/* Header */}
        <SheetHeader className="p-4 border-b shrink-0 bg-card">
          <SheetTitle className="flex items-center gap-2">
            {view === 'list' ? (
              <>
                <MessageSquare className="h-5 w-5 text-primary" />
                <span className="flex-1">Messages</span>
                {canSendMessages() && chatPartners.length > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setView('new')}
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                )}
              </>
            ) : view === 'new' ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    setView('list');
                    setSelectedMembers([]);
                  }}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <span className="flex-1">New Message</span>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    setView('list');
                    setSelectedConversation(null);
                    setMessages([]);
                  }}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                {selectedConversation && (
                  <>
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className={`text-xs ${selectedConversation.is_group ? 'bg-accent/20 text-accent' : 'bg-primary/10 text-primary'}`}>
                        {selectedConversation.is_group ? (
                          <Users className="h-4 w-4" />
                        ) : (
                          getConversationAvatar(selectedConversation)
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate text-sm">
                        {getConversationTitle(selectedConversation)}
                      </p>
                      {selectedConversation.is_group && (
                        <p className="text-xs text-muted-foreground">
                          {selectedConversation.participants.length} members
                        </p>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </SheetTitle>
        </SheetHeader>

        {/* Content */}
        {view === 'list' && (
          <ScrollArea className="flex-1">
            <div className="p-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                    <MessageSquare className="h-8 w-8 text-primary/50" />
                  </div>
                  <p className="font-medium text-foreground">No conversations yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {canSendMessages() ? 'Start a new conversation!' : 'Ask your moderator to enable private messaging.'}
                  </p>
                  {canSendMessages() && chatPartners.length > 0 && (
                    <Button
                      className="mt-4"
                      onClick={() => setView('new')}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      New Message
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => {
                        setSelectedConversation(conv);
                        setView('chat');
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/70 transition-colors text-left group"
                    >
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className={`${conv.is_group ? 'bg-accent/20 text-accent' : 'bg-primary/10 text-primary'}`}>
                            {conv.is_group ? (
                              <Users className="h-5 w-5" />
                            ) : (
                              getConversationAvatar(conv)
                            )}
                          </AvatarFallback>
                        </Avatar>
                        {conv.unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-medium">
                            {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`font-semibold truncate ${conv.unreadCount > 0 ? 'text-foreground' : 'text-foreground/80'}`}>
                            {getConversationTitle(conv)}
                          </p>
                          {conv.lastMessage && (
                            <span className="text-xs text-muted-foreground shrink-0">
                              {formatMessageTime(conv.lastMessage.created_at)}
                            </span>
                          )}
                        </div>
                        {conv.lastMessage && (
                          <p className={`text-sm truncate mt-0.5 ${conv.unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                            {conv.lastMessage.sender_id === currentUserId ? 'You: ' : ''}
                            {conv.lastMessage.content}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        {view === 'new' && (
          <>
            <ScrollArea className="flex-1">
              <div className="p-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Select one or more members to message:
                </p>
                <div className="space-y-2">
                  {chatPartners.map((member) => {
                    const isSelected = selectedMembers.includes(member.user_id);
                    return (
                      <button
                        key={member.user_id}
                        onClick={() => {
                          setSelectedMembers(prev => 
                            isSelected 
                              ? prev.filter(id => id !== member.user_id)
                              : [...prev, member.user_id]
                          );
                        }}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                          isSelected 
                            ? 'bg-primary/10 ring-2 ring-primary' 
                            : 'bg-secondary/50 hover:bg-secondary'
                        }`}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(member.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{member.full_name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                        </div>
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center ${
                          isSelected ? 'bg-primary text-primary-foreground' : 'border-2 border-muted-foreground/30'
                        }`}>
                          {isSelected && <Check className="h-4 w-4" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </ScrollArea>
            <div className="p-4 border-t shrink-0">
              <Button
                className="w-full"
                disabled={selectedMembers.length === 0 || isCreating}
                onClick={createConversation}
              >
                {isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <MessageSquare className="h-4 w-4 mr-2" />
                )}
                {selectedMembers.length === 0 
                  ? 'Select members' 
                  : selectedMembers.length === 1 
                    ? 'Start Chat' 
                    : `Create Group (${selectedMembers.length} members)`}
              </Button>
            </div>
          </>
        )}

        {view === 'chat' && selectedConversation && (
          <>
            <ScrollArea className="flex-1 p-4">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-muted-foreground">
                    No messages yet. Start the conversation!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg, index) => {
                    const isOwn = msg.sender_id === currentUserId;
                    const showAvatar = !isOwn && (
                      index === 0 || 
                      messages[index - 1]?.sender_id !== msg.sender_id
                    );
                    const showName = selectedConversation.is_group && showAvatar;
                    
                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isOwn && (
                          <div className="w-8 shrink-0">
                            {showAvatar && (
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs bg-secondary text-secondary-foreground">
                                  {getInitials(msg.sender_name || 'U')}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        )}
                        <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                          {showName && (
                            <span className="text-xs text-muted-foreground ml-3 mb-0.5">
                              {msg.sender_name}
                            </span>
                          )}
                          <div
                            className={`px-4 py-2 ${
                              isOwn
                                ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-md'
                                : 'bg-secondary rounded-2xl rounded-bl-md'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                          </div>
                          <span
                            className={`text-[10px] mt-0.5 px-1 ${
                              isOwn ? 'text-muted-foreground' : 'text-muted-foreground'
                            }`}
                          >
                            {format(new Date(msg.created_at), 'h:mm a')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Message input - iMessage style */}
            <div className="p-3 border-t bg-card shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="flex gap-2 items-end"
              >
                <div className="flex-1 bg-secondary rounded-full px-4 py-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="iMessage"
                    className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                <Button 
                  type="submit" 
                  size="icon"
                  disabled={!newMessage.trim() || isSending}
                  className="h-10 w-10 rounded-full shrink-0"
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
