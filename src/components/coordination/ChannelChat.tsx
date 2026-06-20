import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fetchProfilesByIds } from '@/lib/profileApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Shield, Users, Loader2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_name?: string;
  message_type: string;
  created_at: string;
}

interface Props {
  channelId: string;
  channelName: string;
  channelDescription: string;
  channelType: 'family' | 'provider';
  userId: string;
}

export const ChannelChat = ({ channelId, channelName, channelDescription, channelType, userId }: Props) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();

    const channel = supabase
      .channel(`coordination-${channelId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'coordination_messages',
        filter: `channel_id=eq.${channelId}`,
      }, async (payload) => {
        const msg = payload.new as any;
        const profiles = await fetchProfilesByIds([msg.sender_id]);
        const profile = profiles.find((p: any) => p.id === msg.sender_id);
        setMessages(prev => [...prev, {
          ...msg,
          sender_name: profile?.full_name || 'Unknown',
        }]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    try {
      const { data } = await supabase
        .from('coordination_messages')
        .select('*')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true })
        .limit(200);

      if (data?.length) {
        const senderIds = [...new Set(data.map(m => m.sender_id))];
        const profiles = await fetchProfilesByIds(senderIds);
        const profileMap = new Map(profiles.map((p: any) => [p.id, p.full_name]));

        setMessages(data.map(m => ({
          ...m,
          sender_name: profileMap.get(m.sender_id) || 'Unknown',
        })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      const { error } = await supabase.from('coordination_messages').insert({
        channel_id: channelId,
        sender_id: userId,
        content: newMessage.trim(),
        message_type: 'message',
      });
      if (error) throw error;
      setNewMessage('');
    } catch (err: any) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const channelColor = channelType === 'provider' ? 'text-orange-500' : 'text-blue-500';
  const ChannelIcon = channelType === 'provider' ? Shield : Users;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChannelIcon className={`h-5 w-5 ${channelColor}`} />
            <CardTitle className="text-lg">{channelName}</CardTitle>
          </div>
          {channelType === 'provider' && (
            <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50">
              <Shield className="h-3 w-3 mr-1" />
              Provider Only
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{channelDescription}</p>
        {channelType === 'provider' && (
          <div className="flex items-center gap-2 mt-2 p-2 bg-orange-50 rounded-md border border-orange-200">
            <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />
            <span className="text-xs text-orange-700">
              This channel is NOT visible to family members. Clinical discussions only.
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        <ScrollArea className="h-[400px] pr-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No messages yet. Start the conversation.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map(msg => (
                <div key={msg.id} className={`flex gap-2 ${msg.sender_id === userId ? 'justify-end' : ''}`}>
                  {msg.sender_id !== userId && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {msg.sender_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`max-w-[75%] ${msg.sender_id === userId ? 'text-right' : ''}`}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium">{msg.sender_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(msg.created_at), 'h:mm a')}
                      </span>
                    </div>
                    <div className={`inline-block p-2.5 rounded-lg text-sm ${
                      msg.sender_id === userId
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>
          )}
        </ScrollArea>

        <div className="flex gap-2">
          <Textarea
            placeholder={`Message ${channelName.toLowerCase()}...`}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            className="min-h-[44px] max-h-[120px] resize-none"
            rows={1}
          />
          <Button onClick={sendMessage} disabled={sending || !newMessage.trim()} size="icon">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
