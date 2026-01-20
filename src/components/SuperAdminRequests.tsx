import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Inbox, Send, Loader2, MessageSquare, CheckCircle2, Clock, Lightbulb, Wrench, Building2 } from 'lucide-react';
import { format } from 'date-fns';

interface SupportRequest {
  id: string;
  organization_id: string;
  sender_id: string;
  request_type: string;
  subject: string;
  message: string;
  status: string;
  response: string | null;
  responded_at: string | null;
  created_at: string;
  organizations?: { name: string } | null;
  sender_name?: string;
}

export const SuperAdminRequests = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isOpen, setIsOpen] = useState(false);
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null);
  const [response, setResponse] = useState('');
  const [newStatus, setNewStatus] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('open');

  // Fetch requests when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchRequests();
    }
  }, [isOpen]);

  // Set up realtime subscription
  useEffect(() => {
    if (!isOpen) return;

    const channel = supabase
      .channel('provider_admin_requests_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'provider_admin_requests' },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen]);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('provider_admin_requests')
        .select('*, organizations:organization_id(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch sender names
      if (data && data.length > 0) {
        const senderIds = [...new Set(data.map(r => r.sender_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', senderIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);
        
        setRequests(data.map(r => ({
          ...r,
          sender_name: profileMap.get(r.sender_id) || 'Unknown'
        })));
      } else {
        setRequests([]);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRespond = async () => {
    if (!selectedRequest) return;

    setIsSubmitting(true);
    try {
      const updates: any = {
        status: newStatus || selectedRequest.status,
        updated_at: new Date().toISOString(),
      };

      if (response.trim()) {
        updates.response = response.trim();
        updates.responded_by = user!.id;
        updates.responded_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('provider_admin_requests')
        .update(updates)
        .eq('id', selectedRequest.id);

      if (error) throw error;

      toast({
        title: 'Response sent!',
        description: 'Your response has been saved.',
      });

      setSelectedRequest(null);
      setResponse('');
      setNewStatus('');
      await fetchRequests();
    } catch (error: any) {
      console.error('Error responding:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send response',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
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
        return <Wrench className="h-4 w-4 text-destructive" />;
      case 'improvement':
        return <Lightbulb className="h-4 w-4 text-accent-foreground" />;
      default:
        return <MessageSquare className="h-4 w-4 text-primary" />;
    }
  };

  const filteredRequests = requests.filter(r => {
    if (filter === 'all') return true;
    if (filter === 'open') return r.status === 'open' || r.status === 'in_progress';
    if (filter === 'resolved') return r.status === 'resolved' || r.status === 'closed';
    return true;
  });

  const openCount = requests.filter(r => r.status === 'open' || r.status === 'in_progress').length;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 gap-1.5 relative">
          <Inbox className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Requests</span>
          {openCount > 0 && (
            <Badge variant="destructive" className="h-5 px-1.5 text-xs absolute -top-2 -right-2">
              {openCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Inbox className="h-5 w-5 text-primary" />
            Provider Admin Requests
          </DialogTitle>
          <DialogDescription>
            Review and respond to requests from provider administrators.
          </DialogDescription>
        </DialogHeader>

        {selectedRequest ? (
          <div className="space-y-4 flex-1">
            <Button variant="ghost" size="sm" onClick={() => setSelectedRequest(null)}>
              ← Back to list
            </Button>
            
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(selectedRequest.request_type)}
                    <CardTitle className="text-base">{selectedRequest.subject}</CardTitle>
                  </div>
                  {getStatusBadge(selectedRequest.status)}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Building2 className="h-3 w-3" />
                  {(selectedRequest.organizations as any)?.name || 'Unknown Organization'}
                  <span className="text-muted-foreground/50">•</span>
                  {selectedRequest.sender_name}
                  <span className="text-muted-foreground/50">•</span>
                  {format(new Date(selectedRequest.created_at), 'MMM d, yyyy h:mm a')}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap mb-4">{selectedRequest.message}</p>
                
                {selectedRequest.response && (
                  <div className="bg-muted/50 rounded-lg p-3 mb-4">
                    <p className="text-xs text-muted-foreground mb-1">Previous Response:</p>
                    <p className="text-sm">{selectedRequest.response}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Response Form */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Update Status</label>
                  <Select value={newStatus || selectedRequest.status} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Response (optional)</label>
                <Textarea
                  placeholder="Type your response here..."
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
              </div>

              <Button
                className="w-full"
                onClick={handleRespond}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Save Response
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Filter */}
            <div className="flex gap-2 mb-3">
              <Button
                variant={filter === 'open' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('open')}
              >
                Open ({requests.filter(r => r.status === 'open' || r.status === 'in_progress').length})
              </Button>
              <Button
                variant={filter === 'resolved' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('resolved')}
              >
                Resolved
              </Button>
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Inbox className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No requests found</p>
              </div>
            ) : (
              <ScrollArea className="flex-1">
                <div className="space-y-2 pr-4">
                  {filteredRequests.map(request => (
                    <Card
                      key={request.id}
                      className="bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setSelectedRequest(request)}
                    >
                      <CardContent className="py-3 px-4">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(request.request_type)}
                            <span className="font-medium text-sm truncate">{request.subject}</span>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Building2 className="h-3 w-3" />
                          <span className="truncate">{(request.organizations as any)?.name || 'Unknown'}</span>
                          <span className="text-muted-foreground/50">•</span>
                          <span>{format(new Date(request.created_at), 'MMM d')}</span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                          {request.message}
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
