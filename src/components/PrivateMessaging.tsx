import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Send, Loader2, ArrowLeft, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface PrivateMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_name?: string;
}

interface Member {
  id: string;
  user_id: string;
  role: string;
  full_name: string;
}

interface PrivateMessagingProps {
  familyId: string;
  currentUserId: string;
  currentUserRole: string;
  members: Member[];
  isOpen: boolean;
  onClose: () => void;
}

export const PrivateMessaging = ({
  familyId,
  currentUserId,
  currentUserRole,
  members,
  isOpen,
  onClose,
}: PrivateMessagingProps) => {
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get eligible chat partners (moderators for members, all members for moderators)
  const getChatPartners = () => {
    if (currentUserRole === 'moderator') {
      return members.filter(m => m.user_id !== currentUserId);
    } else {
      return members.filter(m => m.role === 'moderator');
    }
  };

  const fetchUnreadCounts = async () => {
    const { data, error } = await supabase
      .from('private_messages')
      .select('sender_id')
      .eq('family_id', familyId)
      .eq('recipient_id', currentUserId)
      .eq('is_read', false);

    if (!error && data) {
      const counts: Record<string, number> = {};
      data.forEach(msg => {
        counts[msg.sender_id] = (counts[msg.sender_id] || 0) + 1;
      });
      setUnreadCounts(counts);
    }
  };

  const fetchMessages = async (partnerId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('private_messages')
        .select('*')
        .eq('family_id', familyId)
        .or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Add sender names
      const messagesWithNames = (data || []).map(msg => ({
        ...msg,
        sender_name: members.find(m => m.user_id === msg.sender_id)?.full_name || 'Unknown',
      }));

      setMessages(messagesWithNames);

      // Mark messages as read
      await supabase
        .from('private_messages')
        .update({ is_read: true })
        .eq('family_id', familyId)
        .eq('sender_id', partnerId)
        .eq('recipient_id', currentUserId)
        .eq('is_read', false);

      // Update unread counts
      setUnreadCounts(prev => ({ ...prev, [partnerId]: 0 }));
    } catch (error) {
      console.error('Error fetching private messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedMember) return;

    setIsSending(true);
    try {
      const { error } = await supabase
        .from('private_messages')
        .insert({
          family_id: familyId,
          sender_id: currentUserId,
          recipient_id: selectedMember.user_id,
          content: newMessage.trim(),
        });

      if (error) throw error;

      setNewMessage('');
    } catch (error) {
      console.error('Error sending private message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  // Subscribe to new messages
  useEffect(() => {
    if (!isOpen || !selectedMember) return;

    const channel = supabase
      .channel(`private-messages-${familyId}-${selectedMember.user_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'private_messages',
          filter: `family_id=eq.${familyId}`,
        },
        (payload) => {
          const newMsg = payload.new as PrivateMessage;
          // Only add if it's part of this conversation
          if (
            (newMsg.sender_id === currentUserId && newMsg.recipient_id === selectedMember.user_id) ||
            (newMsg.sender_id === selectedMember.user_id && newMsg.recipient_id === currentUserId)
          ) {
            const msgWithName = {
              ...newMsg,
              sender_name: members.find(m => m.user_id === newMsg.sender_id)?.full_name || 'Unknown',
            };
            setMessages(prev => [...prev, msgWithName]);

            // Mark as read if we're the recipient
            if (newMsg.recipient_id === currentUserId) {
              supabase
                .from('private_messages')
                .update({ is_read: true })
                .eq('id', newMsg.id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, selectedMember, familyId, currentUserId, members]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch unread counts when sheet opens
  useEffect(() => {
    if (isOpen) {
      fetchUnreadCounts();
    }
  }, [isOpen]);

  // Fetch messages when member is selected
  useEffect(() => {
    if (selectedMember) {
      fetchMessages(selectedMember.user_id);
    }
  }, [selectedMember]);

  const chatPartners = getChatPartners();

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            {selectedMember ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setSelectedMember(null)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {getInitials(selectedMember.full_name)}
                  </AvatarFallback>
                </Avatar>
                <span>{selectedMember.full_name}</span>
              </>
            ) : (
              <>
                <MessageSquare className="h-5 w-5 text-primary" />
                Private Messages
              </>
            )}
          </SheetTitle>
        </SheetHeader>

        {!selectedMember ? (
          // Member list
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-2">
              {chatPartners.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {currentUserRole === 'moderator'
                    ? 'No family members to message.'
                    : 'No moderators available to message.'}
                </p>
              ) : (
                chatPartners.map((member) => (
                  <button
                    key={member.user_id}
                    onClick={() => setSelectedMember(member)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-left"
                  >
                    <Avatar>
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(member.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{member.full_name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                    </div>
                    {unreadCounts[member.user_id] > 0 && (
                      <Badge variant="default" className="bg-primary">
                        {unreadCounts[member.user_id]}
                      </Badge>
                    )}
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        ) : (
          // Chat view
          <>
            <ScrollArea className="flex-1 p-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : messages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No messages yet. Start the conversation!
                </p>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => {
                    const isOwn = msg.sender_id === currentUserId;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            isOwn
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            }`}
                          >
                            {format(new Date(msg.created_at), 'h:mm a')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Message input */}
            <div className="p-4 border-t">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="flex gap-2"
              >
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button type="submit" disabled={!newMessage.trim() || isSending}>
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
