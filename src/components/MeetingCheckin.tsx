import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle, MapPin, AlertTriangle } from 'lucide-react';
import { LocationData } from '@/components/LocationCapture';
import { Badge } from '@/components/ui/badge';

const MEETING_TYPES = [
  { value: 'AA', label: 'Alcoholics Anonymous (AA)' },
  { value: 'Al-Anon', label: 'Al-Anon Family Groups' },
  { value: 'NA', label: 'Narcotics Anonymous (NA)' },
  { value: 'Nar-Anon', label: 'Nar-Anon Family Groups' },
  { value: 'Refuge Recovery', label: 'Refuge Recovery' },
  { value: 'Smart Recovery', label: 'SMART Recovery' },
  { value: 'ACA', label: 'Adult Children of Alcoholics (ACA)' },
  { value: 'CoDA', label: 'Co-Dependents Anonymous (CoDA)' },
  { value: 'Families Anonymous', label: 'Families Anonymous' },
  { value: 'Celebrate Recovery', label: 'Celebrate Recovery' },
  { value: 'Other', label: 'Other Recovery Meeting' },
];

interface LiquorCheckResult {
  hasLiquorLicense: boolean;
  hasTHCDispensary?: boolean;
  hasLiquorStore?: boolean;
  hasBar?: boolean;
  hasAdultEntertainment?: boolean;
  confidence: string;
  places: Array<{ name: string; type: string; reason: string; category?: 'bar' | 'liquor_store' | 'thc_dispensary' | 'adult_entertainment' }>;
}

interface MeetingCheckinProps {
  familyId: string;
  onCheckinComplete?: () => void;
  capturedLocation?: LocationData | null;
}

export const MeetingCheckin = ({ familyId, onCheckinComplete, capturedLocation }: MeetingCheckinProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [meetingType, setMeetingType] = useState<string>('');
  const [meetingName, setMeetingName] = useState('');
  const [meetingAddress, setMeetingAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [liquorCheck, setLiquorCheck] = useState<LiquorCheckResult | null>(null);
  const [isCheckingLiquor, setIsCheckingLiquor] = useState(false);

  // Update address when location is captured
  useEffect(() => {
    if (capturedLocation?.address) {
      setMeetingAddress(capturedLocation.address);
    }
  }, [capturedLocation]);

  // Check for liquor license when location is captured
  useEffect(() => {
    const checkLiquorLicense = async () => {
      if (!capturedLocation) {
        setLiquorCheck(null);
        return;
      }

      setIsCheckingLiquor(true);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-liquor-license`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              latitude: capturedLocation.latitude,
              longitude: capturedLocation.longitude,
              address: capturedLocation.address,
            }),
          }
        );

        if (response.ok) {
          const result = await response.json();
          setLiquorCheck(result);
          console.log('Liquor check result:', result);
        } else {
          console.error('Failed to check liquor license');
          setLiquorCheck(null);
        }
      } catch (error) {
        console.error('Error checking liquor license:', error);
        setLiquorCheck(null);
      } finally {
        setIsCheckingLiquor(false);
      }
    };

    checkLiquorLicense();
  }, [capturedLocation]);

  const notifyModerators = async (checkinId: string, liquorPlaces: Array<{ name: string; type: string; reason: string }>) => {
    try {
      // Get all moderators in the family
      const { data: moderators, error: modError } = await supabase
        .from('family_members')
        .select('user_id')
        .eq('family_id', familyId)
        .eq('role', 'moderator');

      if (modError) throw modError;

      // Get the user's name for the notification
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user?.id)
        .single();

      const userName = profile?.full_name || 'A family member';
      const placeNames = liquorPlaces.map(p => p.name).join(', ');

      // Create notifications for all moderators (except if the user is also a moderator)
      const notifications = moderators
        ?.filter(m => m.user_id !== user?.id)
        .map(moderator => ({
          user_id: moderator.user_id,
          family_id: familyId,
          type: 'liquor_alert',
          title: '⚠️ Liquor License Alert',
          body: `${userName} checked in near a location with a liquor license: ${placeNames}`,
          related_id: checkinId,
        })) || [];

      if (notifications.length > 0) {
        const { error: notifError } = await supabase
          .from('notifications')
          .insert(notifications);

        if (notifError) {
          console.error('Error creating liquor alert notifications:', notifError);
        } else {
          console.log(`Sent liquor alert to ${notifications.length} moderator(s)`);
        }
      }
    } catch (error) {
      console.error('Error notifying moderators:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!meetingType) {
      toast({
        title: 'Meeting type required',
        description: 'Please select a meeting type.',
        variant: 'destructive',
      });
      return;
    }

    if (!capturedLocation) {
      toast({
        title: 'Location required',
        description: 'Please capture your location before checking in.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.from('meeting_checkins').insert({
        user_id: user?.id,
        family_id: familyId,
        meeting_type: meetingType as 'AA' | 'Al-Anon' | 'NA' | 'Nar-Anon' | 'Refuge Recovery' | 'Smart Recovery' | 'ACA' | 'CoDA' | 'Families Anonymous' | 'Celebrate Recovery' | 'Other',
        meeting_name: meetingName.trim() || null,
        meeting_address: meetingAddress.trim() || null,
        latitude: capturedLocation.latitude,
        longitude: capturedLocation.longitude,
        notes: notes.trim() || null,
      }).select('id').single();

      if (error) throw error;

      // If liquor license was detected, notify moderators
      if (liquorCheck?.hasLiquorLicense && data?.id) {
        await notifyModerators(data.id, liquorCheck.places);
      }

      toast({
        title: 'Check-in successful! 🎉',
        description: liquorCheck?.hasLiquorLicense 
          ? 'Your family has been notified. Note: This location is near an establishment with a liquor license.'
          : 'Your family has been notified of your meeting attendance.',
      });

      // Reset form
      setMeetingType('');
      setMeetingName('');
      setMeetingAddress('');
      setNotes('');
      setLiquorCheck(null);
      
      onCheckinComplete?.();
    } catch (error) {
      console.error('Error checking in:', error);
      toast({
        title: 'Error',
        description: 'Failed to check in. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display">
          <CheckCircle className="h-5 w-5 text-primary" />
          Meeting Check-In
        </CardTitle>
        <CardDescription>
          Check in at your recovery meeting to let your family know you're attending.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Location Status */}
          {capturedLocation ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
                <MapPin className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary">Location ready</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {capturedLocation.address || `${capturedLocation.latitude.toFixed(6)}, ${capturedLocation.longitude.toFixed(6)}`}
                  </p>
                </div>
              </div>

              {/* Liquor License Warning */}
              {isCheckingLiquor && (
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Checking location...</span>
                </div>
              )}

              {(liquorCheck?.hasLiquorLicense || liquorCheck?.hasAdultEntertainment) && (
                <div className="space-y-2">
                  {/* Adult Entertainment Alert */}
                  {liquorCheck.hasAdultEntertainment && (
                    <div className="flex items-start gap-2 p-3 bg-pink-500/10 border border-pink-500/20 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-pink-600 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-pink-600">Adult Entertainment Detected</p>
                          <Badge className="text-xs bg-pink-500/20 text-pink-700 border-pink-500/30">
                            {liquorCheck.confidence === 'high' ? 'High Confidence' : 'Possible Match'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Nearby: {liquorCheck.places.filter(p => p.category === 'adult_entertainment').map(p => p.name).join(', ')}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* THC Dispensary Alert */}
                  {liquorCheck.hasTHCDispensary && (
                    <div className="flex items-start gap-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-orange-600">THC Dispensary Detected</p>
                          <Badge className="text-xs bg-orange-500/20 text-orange-700 border-orange-500/30">
                            {liquorCheck.confidence === 'high' ? 'High Confidence' : 'Possible Match'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Nearby: {liquorCheck.places.filter(p => p.category === 'thc_dispensary').map(p => p.name).join(', ')}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Liquor Store Alert */}
                  {liquorCheck.hasLiquorStore && (
                    <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-amber-600">Liquor Store Detected</p>
                          <Badge className="text-xs bg-amber-500/20 text-amber-700 border-amber-500/30">
                            {liquorCheck.confidence === 'high' ? 'High Confidence' : 'Possible Match'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Nearby: {liquorCheck.places.filter(p => p.category === 'liquor_store').map(p => p.name).join(', ')}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Bar/Club Alert */}
                  {liquorCheck.hasBar && (
                    <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-destructive">Bar/Club Detected</p>
                          <Badge variant="destructive" className="text-xs">
                            {liquorCheck.confidence === 'high' ? 'High Confidence' : 'Possible Match'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Nearby: {liquorCheck.places.filter(p => p.category === 'bar').map(p => p.name).join(', ')}
                        </p>
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Moderators will be notified of this check-in location.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
              Capture your location above before checking in.
            </div>
          )}

          {/* Meeting Type */}
          <div className="space-y-2">
            <Label htmlFor="meetingType">Meeting Type *</Label>
            <Select value={meetingType} onValueChange={setMeetingType}>
              <SelectTrigger>
                <SelectValue placeholder="Select meeting type" />
              </SelectTrigger>
              <SelectContent>
                {MEETING_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Meeting Name */}
          <div className="space-y-2">
            <Label htmlFor="meetingName">Meeting Name (optional)</Label>
            <Input
              id="meetingName"
              placeholder="e.g., Tuesday Night Group"
              value={meetingName}
              onChange={(e) => setMeetingName(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Meeting Address */}
          <div className="space-y-2">
            <Label htmlFor="meetingAddress">Meeting Address (optional)</Label>
            <Input
              id="meetingAddress"
              placeholder="Will be auto-filled from location"
              value={meetingAddress}
              onChange={(e) => setMeetingAddress(e.target.value)}
              maxLength={255}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              rows={2}
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !meetingType || !capturedLocation}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Checking in...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Check In to Meeting
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
