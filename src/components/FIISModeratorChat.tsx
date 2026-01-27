import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Brain, Send, Loader2, MessageSquare, Trash2, Plus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Family {
  id: string;
  name: string;
  organization_id: string | null;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface Chat {
  id: string;
  family_id: string;
  updated_at: string;
}

interface FIISModeratorChatProps {
  families: Family[];
}

const FIISModeratorChat = ({ families }: FIISModeratorChatProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>('');
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load or create chat when family is selected
  useEffect(() => {
    if (selectedFamilyId && user) {
      loadOrCreateChat();
    } else {
      setCurrentChat(null);
      setMessages([]);
    }
  }, [selectedFamilyId, user]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadOrCreateChat = async () => {
    if (!selectedFamilyId || !user) return;
    
    setIsLoadingChat(true);
    try {
      // Try to find existing chat
      const { data: existingChat, error: chatError } = await supabase
        .from('fiis_moderator_chats')
        .select('*')
        .eq('family_id', selectedFamilyId)
        .eq('moderator_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (chatError) throw chatError;

      if (existingChat) {
        setCurrentChat(existingChat);
        // Load messages
        const { data: chatMessages, error: msgError } = await supabase
          .from('fiis_moderator_chat_messages')
          .select('*')
          .eq('chat_id', existingChat.id)
          .order('created_at', { ascending: true });

        if (msgError) throw msgError;
        setMessages((chatMessages || []).map(m => ({
          ...m,
          role: m.role as 'user' | 'assistant',
        })));
      } else {
        // Create new chat
        const { data: newChat, error: createError } = await supabase
          .from('fiis_moderator_chats')
          .insert({
            family_id: selectedFamilyId,
            moderator_id: user.id,
          })
          .select()
          .single();

        if (createError) throw createError;
        setCurrentChat(newChat);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading chat:', error);
      toast({
        title: 'Error',
        description: 'Failed to load chat. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingChat(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !currentChat || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // Add user message to UI immediately
    const tempUserMsg: ChatMessage = {
      id: `temp-user-${Date.now()}`,
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMsg]);

    // Add placeholder for assistant response
    const tempAssistantMsg: ChatMessage = {
      id: `temp-assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempAssistantMsg]);

    try {
      // Save user message to database
      const { data: savedUserMsg, error: userMsgError } = await supabase
        .from('fiis_moderator_chat_messages')
        .insert({
          chat_id: currentChat.id,
          role: 'user',
          content: userMessage,
        })
        .select()
        .single();

      if (userMsgError) throw userMsgError;

      // Get session for auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      // Prepare chat history (excluding current message)
      const chatHistory = messages
        .filter(m => !m.id.startsWith('temp-'))
        .map(m => ({ role: m.role, content: m.content }));

      // Call edge function with streaming
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fiis-moderator-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            familyId: selectedFamilyId,
            message: userMessage,
            chatHistory,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get response');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let textBuffer = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);

            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (line.startsWith(':') || line.trim() === '') continue;
            if (!line.startsWith('data: ')) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') break;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantContent += content;
                setMessages(prev =>
                  prev.map(m =>
                    m.id === tempAssistantMsg.id
                      ? { ...m, content: assistantContent }
                      : m
                  )
                );
              }
            } catch {
              textBuffer = line + '\n' + textBuffer;
              break;
            }
          }
        }
      }

      // Save assistant message to database
      const { data: savedAssistantMsg, error: assistantMsgError } = await supabase
        .from('fiis_moderator_chat_messages')
        .insert({
          chat_id: currentChat.id,
          role: 'assistant',
          content: assistantContent,
        })
        .select()
        .single();

      if (assistantMsgError) throw assistantMsgError;

      // Update messages with real IDs
      setMessages(prev =>
        prev.map(m => {
          if (m.id === tempUserMsg.id) return { ...savedUserMsg, role: savedUserMsg.role as 'user' | 'assistant' };
          if (m.id === tempAssistantMsg.id) return { ...savedAssistantMsg, role: savedAssistantMsg.role as 'user' | 'assistant' };
          return m;
        })
      );
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send message',
        variant: 'destructive',
      });
      // Remove temporary messages on error
      setMessages(prev =>
        prev.filter(m => m.id !== tempUserMsg.id && m.id !== tempAssistantMsg.id)
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = async () => {
    if (!selectedFamilyId || !user) return;

    try {
      const { data: newChat, error } = await supabase
        .from('fiis_moderator_chats')
        .insert({
          family_id: selectedFamilyId,
          moderator_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentChat(newChat);
      setMessages([]);
      toast({
        title: 'New Chat Started',
        description: 'Started a fresh conversation about this family.',
      });
    } catch (error) {
      console.error('Error creating new chat:', error);
      toast({
        title: 'Error',
        description: 'Failed to start new chat.',
        variant: 'destructive',
      });
    }
  };

  const handleClearChat = async () => {
    if (!currentChat) return;

    try {
      const { error } = await supabase
        .from('fiis_moderator_chat_messages')
        .delete()
        .eq('chat_id', currentChat.id);

      if (error) throw error;

      setMessages([]);
      toast({
        title: 'Chat Cleared',
        description: 'All messages have been removed from this chat.',
      });
    } catch (error) {
      console.error('Error clearing chat:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear chat.',
        variant: 'destructive',
      });
    }
  };

  const selectedFamily = families.find(f => f.id === selectedFamilyId);

  return (
    <div className="flex flex-col h-[600px]">
      {/* Family Selector */}
      <div className="flex items-center gap-3 mb-4">
        <Select value={selectedFamilyId} onValueChange={setSelectedFamilyId}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select a family to discuss..." />
          </SelectTrigger>
          <SelectContent>
            {families.map(family => (
              <SelectItem key={family.id} value={family.id}>
                {family.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {currentChat && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleNewChat}
              title="Start new chat"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleClearChat}
              title="Clear chat history"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {!selectedFamilyId ? (
        <Card className="flex-1 flex items-center justify-center">
          <CardContent className="text-center py-12">
            <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">FIIS Communication Assistant</h3>
            <p className="text-muted-foreground max-w-sm">
              Select a family above to start a conversation with FIIS about how to 
              better communicate with family members. This chat is private and not 
              included in FIIS pattern analysis.
            </p>
          </CardContent>
        </Card>
      ) : isLoadingChat ? (
        <Card className="flex-1 flex items-center justify-center">
          <CardContent className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading chat...</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="py-3 border-b bg-primary/5">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-base">
                  FIIS Chat - {selectedFamily?.name}
                </CardTitle>
                <CardDescription className="text-xs">
                  Private moderator consultation (not included in analysis)
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">
                  Ask FIIS about communication strategies, family dynamics, 
                  or how to approach specific conversations.
                </p>
                <div className="mt-4 text-xs space-y-1">
                  <p className="font-medium">Try asking:</p>
                  <p>"How should I approach discussing boundaries with this family?"</p>
                  <p>"What patterns have you noticed in their communication?"</p>
                  <p>"How can I help [member name] feel more heard?"</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map(message => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {message.role === 'assistant' ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown>{message.content || '...'}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask FIIS about this family..."
                className="min-h-[60px] resize-none"
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
                className="self-end"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default FIISModeratorChat;
