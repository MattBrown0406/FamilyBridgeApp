import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Megaphone, Send, Loader2, Users, CheckCircle2, History, Building2 } from 'lucide-react';
import { format } from 'date-fns';

interface Organization {
  id: string;
  name: string;
}

interface Family {
  id: string;
  name: string;
  organization_id: string | null;
  organization_name?: string;
}

interface BroadcastHistory {
  id: string;
  subject: string | null;
  content: string;
  family_ids: string[];
  sent_at: string;
  sender_name?: string;
  organization_name?: string;
}

type RecipientType = 'providers' | 'families';

export const SuperAdminBroadcast = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [recipientType, setRecipientType] = useState<RecipientType>('families');
  
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([]);
  const [selectedFamilies, setSelectedFamilies] = useState<string[]>([]);
  
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [broadcastHistory, setBroadcastHistory] = useState<BroadcastHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Fetch data when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  // Fetch history when history tab is shown
  useEffect(() => {
    if (showHistory) {
      fetchBroadcastHistory();
    }
  }, [showHistory]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch all organizations
      const { data: orgsData, error: orgsError } = await supabase
        .from('organizations')
        .select('id, name')
        .order('name');

      if (orgsError) throw orgsError;
      setOrganizations(orgsData || []);

      // Fetch all active families
      const { data: familiesData, error: familiesError } = await supabase
        .from('families')
        .select('id, name, organization_id')
        .eq('is_archived', false)
        .order('name');

      if (familiesError) throw familiesError;
      
      // Map organization names to families
      const orgMap = new Map((orgsData || []).map(o => [o.id, o.name]));
      const familiesWithOrg = (familiesData || []).map(f => ({
        ...f,
        organization_name: f.organization_id ? orgMap.get(f.organization_id) : undefined
      }));
      
      setFamilies(familiesWithOrg);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load data',
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
        .select('*, organizations:organization_id(name)')
        .order('sent_at', { ascending: false })
        .limit(30);

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
          sender_name: profileMap.get(b.sender_id) || 'Unknown',
          organization_name: (b.organizations as any)?.name
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

  const handleSelectAllOrgs = () => {
    if (selectedOrgs.length === organizations.length) {
      setSelectedOrgs([]);
    } else {
      setSelectedOrgs(organizations.map(o => o.id));
    }
  };

  const handleSelectAllFamilies = () => {
    if (selectedFamilies.length === families.length) {
      setSelectedFamilies([]);
    } else {
      setSelectedFamilies(families.map(f => f.id));
    }
  };

  const handleToggleOrg = (orgId: string) => {
    setSelectedOrgs(prev => 
      prev.includes(orgId) 
        ? prev.filter(id => id !== orgId)
        : [...prev, orgId]
    );
  };

  const handleToggleFamily = (familyId: string) => {
    setSelectedFamilies(prev => 
      prev.includes(familyId) 
        ? prev.filter(id => id !== familyId)
        : [...prev, familyId]
    );
  };

  const handleSend = async () => {
    if (!message.trim()) {
      toast({
        title: 'Message required',
        description: 'Please enter a message to send.',
        variant: 'destructive',
      });
      return;
    }

    let targetFamilyIds: string[] = [];
    
    if (recipientType === 'providers') {
      if (selectedOrgs.length === 0) {
        toast({
          title: 'No providers selected',
          description: 'Please select at least one provider organization.',
          variant: 'destructive',
        });
        return;
      }
      // Get all families belonging to selected organizations
      targetFamilyIds = families
        .filter(f => f.organization_id && selectedOrgs.includes(f.organization_id))
        .map(f => f.id);
      
      if (targetFamilyIds.length === 0) {
        toast({
          title: 'No families found',
          description: 'The selected providers have no active family groups.',
          variant: 'destructive',
        });
        return;
      }
    } else {
      if (selectedFamilies.length === 0) {
        toast({
          title: 'No families selected',
          description: 'Please select at least one family group.',
          variant: 'destructive',
        });
        return;
      }
      targetFamilyIds = selectedFamilies;
    }

    setIsSending(true);
    try {
      // Get sender name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user!.id)
        .single();

      const senderName = profile?.full_name || 'FamilyBridge Admin';

      // For each selected org (when sending to providers), record a broadcast per org
      // For direct family selection, record a single broadcast with null org
      if (recipientType === 'providers') {
        for (const orgId of selectedOrgs) {
          const orgFamilyIds = families
            .filter(f => f.organization_id === orgId)
            .map(f => f.id);
          
          if (orgFamilyIds.length > 0) {
            const { error: broadcastError } = await supabase
              .from('broadcast_messages')
              .insert({
                organization_id: orgId,
                sender_id: user!.id,
                subject: subject.trim() || null,
                content: message.trim(),
                family_ids: orgFamilyIds,
              });
            
            if (broadcastError) throw broadcastError;
          }
        }
      } else {
        // For direct family selection, group by org or use first family's org
        const orgId = families.find(f => targetFamilyIds.includes(f.id))?.organization_id;
        
        if (orgId) {
          const { error: broadcastError } = await supabase
            .from('broadcast_messages')
            .insert({
              organization_id: orgId,
              sender_id: user!.id,
              subject: subject.trim() || null,
              content: message.trim(),
              family_ids: targetFamilyIds,
            });
          
          if (broadcastError) throw broadcastError;
        }
      }

      // Format the announcement message
      const announcementContent = `📢 **Announcement from FamilyBridge**${subject ? `\n**${subject}**` : ''}\n\n${message.trim()}\n\n_— ${senderName}_`;

      // Insert messages into each target family's chat
      const messageInserts = targetFamilyIds.map(familyId => ({
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

      const recipientLabel = recipientType === 'providers' 
        ? `${selectedOrgs.length} provider${selectedOrgs.length > 1 ? 's' : ''} (${targetFamilyIds.length} families)`
        : `${targetFamilyIds.length} family group${targetFamilyIds.length > 1 ? 's' : ''}`;

      toast({
        title: 'Announcement sent!',
        description: `Your message was sent to ${recipientLabel}.`,
      });

      // Reset form
      setSubject('');
      setMessage('');
      setSelectedOrgs([]);
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

  const currentSelection = recipientType === 'providers' ? selectedOrgs : selectedFamilies;
  const currentItems = recipientType === 'providers' ? organizations : families;
  const handleSelectAll = recipientType === 'providers' ? handleSelectAllOrgs : handleSelectAllFamilies;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 gap-1.5">
          <Megaphone className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Announce</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            Send System Announcement
          </DialogTitle>
          <DialogDescription>
            Send an announcement to providers or family groups across the platform.
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
            {/* Recipient Type Selector */}
            <div className="space-y-2">
              <Label>Send To</Label>
              <Select value={recipientType} onValueChange={(v) => setRecipientType(v as RecipientType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="families">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Family Groups
                    </div>
                  </SelectItem>
                  <SelectItem value="providers">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Provider Organizations (all their families)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Selection List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>
                  {recipientType === 'providers' ? 'Select Providers' : 'Select Family Groups'}
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={isLoading || currentItems.length === 0}
                >
                  {currentSelection.length === currentItems.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : currentItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No {recipientType === 'providers' ? 'providers' : 'active families'} found.
                </p>
              ) : (
                <ScrollArea className="h-32 border rounded-md p-2">
                  <div className="space-y-2">
                    {recipientType === 'providers' ? (
                      organizations.map(org => (
                        <div
                          key={org.id}
                          className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded cursor-pointer"
                          onClick={() => handleToggleOrg(org.id)}
                        >
                          <Checkbox
                            id={org.id}
                            checked={selectedOrgs.includes(org.id)}
                            onCheckedChange={() => handleToggleOrg(org.id)}
                          />
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <label
                            htmlFor={org.id}
                            className="flex-1 text-sm font-medium cursor-pointer"
                          >
                            {org.name}
                          </label>
                          <Badge variant="secondary" className="text-xs">
                            {families.filter(f => f.organization_id === org.id).length} families
                          </Badge>
                        </div>
                      ))
                    ) : (
                      families.map(family => (
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
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <label
                            htmlFor={family.id}
                            className="flex-1 text-sm font-medium cursor-pointer"
                          >
                            {family.name}
                          </label>
                          {family.organization_name && (
                            <span className="text-xs text-muted-foreground">
                              {family.organization_name}
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              )}
              
              {currentSelection.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {recipientType === 'providers' ? (
                    <>
                      <Building2 className="h-4 w-4" />
                      {selectedOrgs.length} provider{selectedOrgs.length > 1 ? 's' : ''} selected
                      ({families.filter(f => f.organization_id && selectedOrgs.includes(f.organization_id)).length} families)
                    </>
                  ) : (
                    <>
                      <Users className="h-4 w-4" />
                      {selectedFamilies.length} family group{selectedFamilies.length > 1 ? 's' : ''} selected
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Subject (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject (Optional)</Label>
              <Input
                id="subject"
                placeholder="e.g., Platform Update, Important Notice..."
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
                className="min-h-[100px] resize-none"
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
                    <p className="font-semibold text-primary">📢 Announcement from FamilyBridge</p>
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
              disabled={isSending || currentSelection.length === 0 || !message.trim()}
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {recipientType === 'providers' 
                    ? `Send to ${selectedOrgs.length || 0} Provider${selectedOrgs.length !== 1 ? 's' : ''}`
                    : `Send to ${selectedFamilies.length || 0} Family${selectedFamilies.length !== 1 ? ' Groups' : ''}`
                  }
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
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(broadcast.sent_at), 'MMM d, yyyy h:mm a')}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {broadcast.organization_name && (
                              <Badge variant="outline" className="text-xs">
                                {broadcast.organization_name}
                              </Badge>
                            )}
                            <Badge variant="secondary" className="text-xs">
                              {broadcast.family_ids.length} group{broadcast.family_ids.length !== 1 ? 's' : ''}
                            </Badge>
                          </div>
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
