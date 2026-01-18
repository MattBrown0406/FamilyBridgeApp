import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fetchProfilesByIds } from '@/lib/profileApi';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MapPin, Loader2, Navigation, Send, Clock, CheckCircle, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface RecoveringMember {
  user_id: string;
  full_name: string;
}

interface LocationRequest {
  id: string;
  requester_id: string;
  target_user_id: string;
  status: string;
  requested_at: string;
  responded_at: string | null;
  latitude: number | null;
  longitude: number | null;
  location_address: string | null;
  requester_note: string | null;
  response_note: string | null;
  target_profile?: { full_name: string };
  requester_profile?: { full_name: string };
}

interface LocationCheckinRequestProps {
  familyId: string;
  userRole: string;
  isProfessionalModerator?: boolean;
  excludeUserIds?: string[];
}

export const LocationCheckinRequest = ({ familyId, userRole, isProfessionalModerator = false, excludeUserIds = [] }: LocationCheckinRequestProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [recoveringMembers, setRecoveringMembers] = useState<RecoveringMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [requestNote, setRequestNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [recentRequests, setRecentRequests] = useState<LocationRequest[]>([]);
  const [showDialog, setShowDialog] = useState(false);

  // Only recovering members who are NOT moderators should be blocked
  const isRecovering = userRole === 'recovering' && !isProfessionalModerator;
  
  // Moderators (including professional moderators) should have access
  const canRequestCheckins = !isRecovering || isProfessionalModerator;

  useEffect(() => {
    if (canRequestCheckins) {
      fetchRecoveringMembers();
      fetchRecentRequests();
    }
  }, [familyId, canRequestCheckins]);

  const fetchRecoveringMembers = async () => {
    setIsLoading(true);
    try {
      // Get eligible family members to request a check-in from (exclude self)
      // NOTE: We include both 'recovering' and regular 'member' roles because
      // some families may not use the 'recovering' role consistently.
      const { data: membersData, error: membersError } = await supabase
        .from('family_members')
        .select('user_id, role')
        .eq('family_id', familyId)
        .in('role', ['recovering', 'member'])
        .neq('user_id', user?.id || '');

      if (membersError) throw membersError;

      if (!membersData || membersData.length === 0) {
        setRecoveringMembers([]);
        setIsLoading(false);
        return;
      }

      // Then fetch their profiles separately (rate-limited backend function)
      const userIds = membersData.map(m => m.user_id);
      const profilesData = await fetchProfilesByIds(userIds);

      const profileMap = new Map(profilesData?.map(p => [p.id, p.full_name]) || []);
      
      // Filter out excluded users (professional moderators)
      const members = membersData
        .filter((m) => !excludeUserIds.includes(m.user_id))
        .map((m) => ({
          user_id: m.user_id,
          full_name: profileMap.get(m.user_id) || 'Unknown',
        }));

      setRecoveringMembers(members);
    } catch (error) {
      console.error('Error fetching recovering members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('location_checkin_requests')
        .select('*')
        .eq('family_id', familyId)
        .eq('requester_id', user?.id)
        .order('requested_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      // Fetch target profiles separately
      const requests = data || [];
      const targetIds = [...new Set(requests.map(r => r.target_user_id))];
      
      if (targetIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', targetIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        
        const enrichedRequests = requests.map(r => ({
          ...r,
          target_profile: profileMap.get(r.target_user_id),
        }));

        setRecentRequests(enrichedRequests);
      } else {
        setRecentRequests(requests);
      }
    } catch (error) {
      console.error('Error fetching recent requests:', error);
    }
  };

  const handleSendRequest = async () => {
    if (!selectedMember) {
      toast({
        title: 'Select a member',
        description: 'Please select who you want to request a check-in from.',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);
    try {
      const { data, error } = await supabase.from('location_checkin_requests').insert({
        family_id: familyId,
        requester_id: user?.id,
        target_user_id: selectedMember,
        requester_note: requestNote.trim() || null,
      }).select('id').single();

      if (error) throw error;

      // Schedule expiration check after 5 minutes
      if (data?.id) {
        setTimeout(async () => {
          try {
            await supabase.functions.invoke('expire-location-request', {
              body: { request_id: data.id },
            });
          } catch (e) {
            console.error('Error calling expire function:', e);
          }
        }, 5 * 60 * 1000); // 5 minutes
      }

      toast({
        title: 'Request sent',
        description: 'They will receive a notification to share their location. Request expires in 5 minutes.',
      });

      setSelectedMember('');
      setRequestNote('');
      setShowDialog(false);
      fetchRecentRequests();
    } catch (error) {
      console.error('Error sending request:', error);
      toast({
        title: 'Error',
        description: 'Failed to send request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'declined':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Location shared';
      case 'declined':
        return 'Declined';
      case 'expired':
        return 'Expired';
      default:
        return 'Pending';
    }
  };

  if (!canRequestCheckins) {
    return null; // Recovering members (who aren't professional moderators) don't see this component
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (recoveringMembers.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 font-display text-lg">
            <Navigation className="h-5 w-5 text-muted-foreground" />
            Location Check-In Request
          </CardTitle>
          <CardDescription>
            No eligible family members to request check-ins from.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 font-display text-lg">
          <Navigation className="h-5 w-5 text-primary" />
          Location Check-In Request
        </CardTitle>
        <CardDescription>
          Request a location check-in from a family member.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <Send className="h-4 w-4 mr-2" />
              Request Location Check-In
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Request Location Check-In</DialogTitle>
              <DialogDescription>
                Send a check-in request to your family member. They will receive a notification and can choose to share their current location.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Request from</Label>
                <Select value={selectedMember} onValueChange={setSelectedMember}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select family member" />
                  </SelectTrigger>
                  <SelectContent>
                    {recoveringMembers.map((member) => (
                      <SelectItem key={member.user_id} value={member.user_id}>
                        {member.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Note (optional)</Label>
                <Textarea
                  placeholder="Add a note to your request..."
                  value={requestNote}
                  onChange={(e) => setRequestNote(e.target.value)}
                  maxLength={200}
                  rows={2}
                />
              </div>
              <Button
                onClick={handleSendRequest}
                disabled={isSending || !selectedMember}
                className="w-full"
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
          </DialogContent>
        </Dialog>

        {/* Recent Requests */}
        {recentRequests.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Recent Requests</h4>
            <div className="space-y-2">
              {recentRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-start justify-between p-3 bg-secondary/30 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(request.status)}
                      <span className="text-sm font-medium">
                        {request.target_profile?.full_name || 'Family member'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {getStatusLabel(request.status)} •{' '}
                      {formatDistanceToNow(new Date(request.requested_at), { addSuffix: true })}
                    </p>
                    {request.status === 'completed' && request.location_address && (
                      <p className="text-xs text-foreground mt-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {request.location_address}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
