import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Navigation, XCircle, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useLocationCapture } from '@/components/LocationCapture';

interface PendingRequest {
  id: string;
  requester_id: string;
  requester_note: string | null;
  requested_at: string;
  requester_profile?: { full_name: string };
}

interface LocationCheckinResponseProps {
  familyId: string;
  userRole: string;
}

export const LocationCheckinResponse = ({ familyId, userRole }: LocationCheckinResponseProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { getLocation, isGettingLocation, locationError } = useLocationCapture();

  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseNote, setResponseNote] = useState('');

  const isRecovering = userRole === 'recovering';

  useEffect(() => {
    if (isRecovering) {
      fetchPendingRequests();
      
      // Set up realtime subscription for new requests
      const channel = supabase
        .channel('location-requests')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'location_checkin_requests',
            filter: `target_user_id=eq.${user?.id}`,
          },
          () => {
            fetchPendingRequests();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [familyId, isRecovering, user?.id]);

  const fetchPendingRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('location_checkin_requests')
        .select('*')
        .eq('family_id', familyId)
        .eq('target_user_id', user?.id)
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });

      if (error) throw error;

      // Fetch requester profiles
      const requests = data || [];
      const requesterIds = [...new Set(requests.map(r => r.requester_id))];

      if (requesterIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', requesterIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

        const enrichedRequests = requests.map(r => ({
          ...r,
          requester_profile: profileMap.get(r.requester_id),
        }));

        setPendingRequests(enrichedRequests);
      } else {
        setPendingRequests(requests);
      }
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkFlaggedLocation = async (latitude: number, longitude: number, address?: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-liquor-license`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ latitude, longitude, address }),
        }
      );

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error checking flagged location:', error);
    }
    return null;
  };

  const postFlaggedLocationAlert = async (flaggedResult: any, locationAddress: string) => {
    if (!flaggedResult?.hasLiquorLicense && !flaggedResult?.hasAdultEntertainment) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user?.id)
      .single();

    const userName = profile?.full_name || 'A family member';
    const alerts: string[] = [];

    if (flaggedResult.hasAdultEntertainment) {
      const places = flaggedResult.places.filter((p: any) => p.category === 'adult_entertainment');
      alerts.push(`🚨 Adult Entertainment: ${places.map((p: any) => p.name).join(', ')}`);
    }
    if (flaggedResult.hasTHCDispensary) {
      const places = flaggedResult.places.filter((p: any) => p.category === 'thc_dispensary');
      alerts.push(`🌿 THC Dispensary: ${places.map((p: any) => p.name).join(', ')}`);
    }
    if (flaggedResult.hasLiquorStore) {
      const places = flaggedResult.places.filter((p: any) => p.category === 'liquor_store');
      alerts.push(`🍺 Liquor Store: ${places.map((p: any) => p.name).join(', ')}`);
    }
    if (flaggedResult.hasBar) {
      const places = flaggedResult.places.filter((p: any) => p.category === 'bar');
      alerts.push(`🍸 Bar/Restaurant: ${places.map((p: any) => p.name).join(', ')}`);
    }

    if (alerts.length > 0) {
      await supabase.from('messages').insert({
        family_id: familyId,
        sender_id: user?.id,
        content: `⚠️ **Location Check-In Alert**\n\n${userName} shared their location from a flagged area:\n📍 ${locationAddress || 'Location shared'}\n\n${alerts.join('\n')}\n\n_This is an automated safety alert._`,
      });
    }
  };

  const handleShareLocation = async (requestId: string) => {
    setRespondingTo(requestId);

    try {
      const location = await getLocation();

      // Check for flagged locations
      const flaggedResult = await checkFlaggedLocation(
        location.latitude,
        location.longitude,
        location.address
      );

      // Update the request with location
      const { error } = await supabase
        .from('location_checkin_requests')
        .update({
          status: 'completed',
          responded_at: new Date().toISOString(),
          latitude: location.latitude,
          longitude: location.longitude,
          location_address: location.address,
          response_note: responseNote.trim() || null,
        })
        .eq('id', requestId);

      if (error) throw error;

      // Post alert if at flagged location
      await postFlaggedLocationAlert(flaggedResult, location.address || '');

      toast({
        title: 'Location shared',
        description: 'Your family member has been notified.',
      });

      setResponseNote('');
      fetchPendingRequests();
    } catch (error) {
      console.error('Error sharing location:', error);
      toast({
        title: 'Error',
        description: 'Failed to share location. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setRespondingTo(null);
    }
  };

  const handleDecline = async (requestId: string) => {
    setRespondingTo(requestId);
    try {
      const { error } = await supabase
        .from('location_checkin_requests')
        .update({
          status: 'declined',
          responded_at: new Date().toISOString(),
          response_note: responseNote.trim() || null,
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: 'Request declined',
        description: 'Your family member has been notified.',
      });

      setResponseNote('');
      fetchPendingRequests();
    } catch (error) {
      console.error('Error declining request:', error);
      toast({
        title: 'Error',
        description: 'Failed to decline request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setRespondingTo(null);
    }
  };

  if (!isRecovering) {
    return null; // Non-recovering members don't see this component
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (pendingRequests.length === 0) {
    return null; // No pending requests
  }

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 font-display text-lg">
          <AlertTriangle className="h-5 w-5 text-primary" />
          Location Check-In Requests
        </CardTitle>
        <CardDescription>
          Your family members are requesting a location check-in.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {locationError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Location Error</AlertTitle>
            <AlertDescription>{locationError}</AlertDescription>
          </Alert>
        )}

        {pendingRequests.map((request) => (
          <div
            key={request.id}
            className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">
                  {request.requester_profile?.full_name || 'A family member'} is requesting your location
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(request.requested_at), { addSuffix: true })}
                </p>
              </div>
            </div>

            {request.requester_note && (
              <p className="text-sm italic text-muted-foreground">
                "{request.requester_note}"
              </p>
            )}

            <div className="space-y-2">
              <Label className="text-sm">Response note (optional)</Label>
              <Textarea
                placeholder="Add a note with your response..."
                value={responseNote}
                onChange={(e) => setResponseNote(e.target.value)}
                maxLength={200}
                rows={2}
                disabled={respondingTo === request.id}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => handleShareLocation(request.id)}
                disabled={respondingTo !== null}
                className="flex-1"
              >
                {respondingTo === request.id && isGettingLocation ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Getting location...
                  </>
                ) : (
                  <>
                    <Navigation className="h-4 w-4 mr-2" />
                    Share My Location
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleDecline(request.id)}
                disabled={respondingTo !== null}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Decline
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
