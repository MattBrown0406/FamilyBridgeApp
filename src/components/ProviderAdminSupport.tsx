import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { HelpCircle, Send, Loader2, MessageSquare, CheckCircle2, Clock, Lightbulb, Wrench, History } from 'lucide-react';
import { format } from 'date-fns';

interface ProviderAdminSupportProps {
  organizationId: string;
  organizationName: string;
}

type RequestType = 'technical' | 'improvement' | 'general';

interface SupportRequest {
  id: string;
  request_type: string;
  subject: string;
  message: string;
  status: string;
  response: string | null;
  responded_at: string | null;
  created_at: string;
}

export const ProviderAdminSupport = ({ organizationId, organizationName }: ProviderAdminSupportProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [requestType, setRequestType] = useState<RequestType>('general');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Fetch history when dialog opens or history tab is shown
  useEffect(() => {
    if (isOpen && showHistory) {
      fetchHistory();
    }
  }, [isOpen, showHistory]);

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('provider_admin_requests')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please provide both a subject and message.',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);
    try {
      const { error } = await supabase
        .from('provider_admin_requests')
        .insert({
          organization_id: organizationId,
          sender_id: user!.id,
          request_type: requestType,
          subject: subject.trim(),
          message: message.trim(),
        });

      if (error) throw error;

      toast({
        title: 'Request sent!',
        description: 'Your message has been sent to the FamilyBridge team. We\'ll respond as soon as possible.',
      });

      // Reset form
      setSubject('');
      setMessage('');
      setRequestType('general');
      setIsOpen(false);
    } catch (error: any) {
      console.error('Error sending request:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send request',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="secondary" className="bg-secondary text-secondary-foreground"><Clock className="h-3 w-3 mr-1" />Open</Badge>;
      case 'in_progress':
        return <Badge variant="secondary" className="bg-accent text-accent-foreground"><Loader2 className="h-3 w-3 mr-1" />In Progress</Badge>;
      case 'resolved':
        return <Badge variant="secondary" className="bg-primary/20 text-primary"><CheckCircle2 className="h-3 w-3 mr-1" />Resolved</Badge>;
      case 'closed':
        return <Badge variant="outline">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'technical':
        return <Wrench className="h-4 w-4" />;
      case 'improvement':
        return <Lightbulb className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <HelpCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Contact Support</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            Contact FamilyBridge Support
          </DialogTitle>
          <DialogDescription>
            Submit technical questions or product improvement suggestions to the FamilyBridge team.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button
            variant={!showHistory ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowHistory(false)}
          >
            <Send className="h-4 w-4 mr-1" />
            New Request
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
          <div className="space-y-4 flex-1">
            {/* Request Type */}
            <div className="space-y-2">
              <Label>Request Type</Label>
              <Select value={requestType} onValueChange={(v) => setRequestType(v as RequestType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      General Question
                    </div>
                  </SelectItem>
                  <SelectItem value="technical">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4" />
                      Technical Issue
                    </div>
                  </SelectItem>
                  <SelectItem value="improvement">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      Product Improvement
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                placeholder="Brief summary of your request..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                placeholder="Provide details about your question or suggestion..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[120px] resize-none"
              />
            </div>

            {/* Context Info */}
            <p className="text-xs text-muted-foreground">
              Sending as: {organizationName}
            </p>

            {/* Send Button */}
            <Button
              className="w-full"
              onClick={handleSend}
              disabled={isSending || !subject.trim() || !message.trim()}
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Request
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
            ) : requests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No previous requests</p>
              </div>
            ) : (
              <ScrollArea className="h-[350px]">
                <div className="space-y-3 pr-4">
                  {requests.map(request => (
                    <Card key={request.id} className="bg-muted/30">
                      <CardContent className="py-3 px-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(request.request_type)}
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(request.created_at), 'MMM d, yyyy')}
                            </span>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>
                        <p className="font-medium text-sm mb-1">{request.subject}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {request.message}
                        </p>
                        
                        {request.response && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs text-muted-foreground mb-1">Response:</p>
                            <p className="text-sm">{request.response}</p>
                            {request.responded_at && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {format(new Date(request.responded_at), 'MMM d, yyyy h:mm a')}
                              </p>
                            )}
                          </div>
                        )}
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
