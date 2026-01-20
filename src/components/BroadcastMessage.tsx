import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Megaphone, Send, Loader2, Users, CheckCircle2, History } from 'lucide-react';
import { format } from 'date-fns';

interface Family {
  id: string;
  name: string;
  is_archived: boolean;
}

interface BroadcastHistory {
  id: string;
  subject: string | null;
  content: string;
  family_ids: string[];
  sent_at: string;
  sender_name?: string;
}

interface BroadcastMessageProps {
  organizationId: string;
  organizationName: string;
}

export const BroadcastMessage = ({ organizationId, organizationName }: BroadcastMessageProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [families, setFamilies] = useState<Family[]>([]);
  const [selectedFamilies, setSelectedFamilies] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [broadcastHistory, setBroadcastHistory] = useState<BroadcastHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Fetch families when dialog opens
  useEffect(() => {
    if (isOpen && organizationId) {
      fetchFamilies();
    }
  }, [isOpen, organizationId]);

  // Fetch broadcast history when history tab is shown
  useEffect(() => {
    if (showHistory && organizationId) {
      fetchBroadcastHistory();
    }
  }, [showHistory, organizationId]);

  const fetchFamilies = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('families')
        .select('id, name, is_archived')
        .eq('organization_id', organizationId)
        .eq('is_archived', false)
        .order('name');

      if (error) throw error;
      setFamilies(data || []);
    } catch (error) {
      console.error('Error fetching families:', error);
      toast({
        title: 'Error',
        description: 'Failed to load families',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBroadcastHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('broadcast_messages')
        .select('*')
        .eq('organization_id', organizationId)
        .order('sent_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Fetch sender names
      if (data && data.length > 0) {
        const senderIds = [...new Set(data.map(b => b.sender_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', senderIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);
        
        setBroadcastHistory(data.map(b => ({
          ...b,
          sender_name: profileMap.get(b.sender_id) || 'Unknown'
        })));
      } else {
        setBroadcastHistory([]);
      }
    } catch (error) {
      console.error('Error fetching broadcast history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedFamilies.length === families.length) {
      setSelectedFamilies([]);
    } else {
      setSelectedFamilies(families.map(f => f.id));
    }
  };

  const handleToggleFamily = (familyId: string) => {
    setSelectedFamilies(prev => 
      prev.includes(familyId) 
        ? prev.filter(id => id !== familyId)
        : [...prev, familyId]
    );
  };

  const handleSend = async () => {
    if (selectedFamilies.length === 0) {
      toast({
        title: 'No families selected',
        description: 'Please select at least one family to send the announcement to.',
        variant: 'destructive',
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: 'Message required',
        description: 'Please enter a message to send.',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);
    try {
      // Record the broadcast
      const { error: broadcastError } = await supabase
        .from('broadcast_messages')
        .insert({
          organization_id: organizationId,
          sender_id: user!.id,
          subject: subject.trim() || null,
          content: message.trim(),
          family_ids: selectedFamilies,
        });

      if (broadcastError) throw broadcastError;

      // Get sender name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user!.id)
        .single();

      const senderName = profile?.full_name || 'Organization Admin';

      // Format the announcement message
      const announcementContent = `📢 **Announcement from ${organizationName}**${subject ? `\n**${subject}**` : ''}\n\n${message.trim()}\n\n_— ${senderName}_`;

      // Insert messages into each selected family's chat
      const messageInserts = selectedFamilies.map(familyId => ({
        family_id: familyId,
        sender_id: user!.id,
        content: announcementContent,
        is_announcement: true,
        announcement_subject: subject.trim() || null,
      }));

      const { error: messagesError } = await supabase
        .from('messages')
        .insert(messageInserts);

      if (messagesError) throw messagesError;

      toast({
        title: 'Announcement sent!',
        description: `Your message was sent to ${selectedFamilies.length} family group${selectedFamilies.length > 1 ? 's' : ''}.`,
      });

      // Reset form
      setSubject('');
      setMessage('');
      setSelectedFamilies([]);
      setIsOpen(false);
    } catch (error: any) {
      console.error('Error sending broadcast:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send announcement',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Megaphone className="h-4 w-4" />
          <span className="hidden sm:inline">Send Announcement</span>
          <span className="sm:hidden">Announce</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            Send Announcement
          </DialogTitle>
          <DialogDescription>
            Send an announcement to one or more family groups. Messages will appear as organization announcements in their chat.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button
            variant={!showHistory ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowHistory(false)}
          >
            <Send className="h-4 w-4 mr-1" />
            Compose
          </Button>
          <Button
            variant={showHistory ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowHistory(true)}
          >
            <History className="h-4 w-4 mr-1" />
            History
          </Button>
        </div>

        {!showHistory ? (
          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            {/* Family Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Select Family Groups</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={isLoading || families.length === 0}
                >
                  {selectedFamilies.length === families.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : families.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No active family groups found in this organization.
                </p>
              ) : (
                <ScrollArea className="h-32 border rounded-md p-2">
                  <div className="space-y-2">
                    {families.map(family => (
                      <div
                        key={family.id}
                        className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded cursor-pointer"
                        onClick={() => handleToggleFamily(family.id)}
                      >
                        <Checkbox
                          id={family.id}
                          checked={selectedFamilies.includes(family.id)}
                          onCheckedChange={() => handleToggleFamily(family.id)}
                        />
                        <label
                          htmlFor={family.id}
                          className="flex-1 text-sm font-medium cursor-pointer"
                        >
                          {family.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
              
              {selectedFamilies.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  {selectedFamilies.length} family group{selectedFamilies.length > 1 ? 's' : ''} selected
                </div>
              )}
            </div>

            {/* Subject (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject (Optional)</Label>
              <Input
                id="subject"
                placeholder="e.g., Important Update, Weekly Reminder..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            {/* Message */}
            <div className="space-y-2 flex-1">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                placeholder="Type your announcement here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[120px] resize-none"
              />
            </div>

            {/* Preview */}
            {message.trim() && (
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-xs text-muted-foreground">Preview</CardTitle>
                </CardHeader>
                <CardContent className="py-2 px-3">
                  <div className="text-sm">
                    <p className="font-semibold text-primary">📢 Announcement from {organizationName}</p>
                    {subject && <p className="font-medium mt-1">{subject}</p>}
                    <p className="mt-2 whitespace-pre-wrap">{message}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Send Button */}
            <Button
              className="w-full"
              onClick={handleSend}
              disabled={isSending || selectedFamilies.length === 0 || !message.trim()}
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send to {selectedFamilies.length || 0} Family Group{selectedFamilies.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : broadcastHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No announcements sent yet</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3 pr-4">
                  {broadcastHistory.map(broadcast => (
                    <Card key={broadcast.id} className="bg-muted/30">
                      <CardContent className="py-3 px-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(broadcast.sent_at), 'MMM d, yyyy h:mm a')}
                            </span>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {broadcast.family_ids.length} group{broadcast.family_ids.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        {broadcast.subject && (
                          <p className="font-medium text-sm mb-1">{broadcast.subject}</p>
                        )}
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {broadcast.content}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Sent by {broadcast.sender_name}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
