import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LifeAppointmentCheckin } from '@/components/LifeAppointmentCheckin';
import { LocationData } from '@/components/LocationCapture';
import { CheckCircle, Calendar, Sparkles } from 'lucide-react';
import { useState } from 'react';

interface TabbedCheckinProps {
  familyId: string;
  onCheckinComplete?: () => void;
  capturedLocation?: LocationData | null;
  hideCard?: boolean;
}

export const TabbedCheckin = ({ familyId, onCheckinComplete, capturedLocation, hideCard }: TabbedCheckinProps) => {
  const [activeTab, setActiveTab] = useState('recovery');

  const content = (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="recovery" className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline">Recovery Meetings</span>
          <span className="sm:hidden">Recovery</span>
        </TabsTrigger>
        <TabsTrigger value="life" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span className="hidden sm:inline">Life Appointments</span>
          <span className="sm:hidden">Appointments</span>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="recovery" className="mt-4">
        <MeetingCheckinForm 
          familyId={familyId} 
          capturedLocation={capturedLocation}
          onCheckinComplete={onCheckinComplete}
        />
      </TabsContent>
      
      <TabsContent value="life" className="mt-4">
        <LifeAppointmentCheckin 
          familyId={familyId} 
          capturedLocation={capturedLocation}
          onCheckinComplete={onCheckinComplete}
        />
      </TabsContent>
    </Tabs>
  );

  if (hideCard) {
    return content;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display">
          <CheckCircle className="h-5 w-5 text-primary" />
          Check-In
        </CardTitle>
        <CardDescription>
          Check in at your meeting or appointment to let your family know where you are.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {content}
      </CardContent>
    </Card>
  );
};

// Extracted form portion of MeetingCheckin without the card wrapper
import { useState as useStateInner, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, MapPin, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const MEETING_TYPES = [
  { value: 'AA', label: 'Alcoholics Anonymous (AA)' },
  { value: 'Al-Anon', label: 'Al-Anon Family Groups' },
  { value: 'NA', label: 'Narcotics Anonymous (NA)' },
  { value: 'Nar-Anon', label: 'Nar-Anon Family Groups' },
  { value: 'Refuge Recovery', label: 'Refuge Recovery' },
  { value: 'Smart Recovery', label: 'Smart Recovery' },
  { value: 'ACA', label: 'Adult Children of Alcoholics (ACA)' },
  { value: 'CoDA', label: 'Co-Dependents Anonymous (CoDA)' },
  { value: 'Families Anonymous', label: 'Families Anonymous' },
  { value: 'Celebrate Recovery', label: 'Celebrate Recovery' },
  { value: 'Other', label: 'Other Recovery Meeting' },
];

interface LiquorCheckResult {
  hasLiquorLicense: boolean;
  confidence: string;
  places: Array<{ name: string; type: string; reason: string }>;
}

interface MeetingCheckinFormProps {
  familyId: string;
  onCheckinComplete?: () => void;
  capturedLocation?: LocationData | null;
}

const MeetingCheckinForm = ({ familyId, onCheckinComplete, capturedLocation }: MeetingCheckinFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [meetingType, setMeetingType] = useStateInner<string>('');
  const [meetingName, setMeetingName] = useStateInner('');
  const [meetingAddress, setMeetingAddress] = useStateInner('');
  const [notes, setNotes] = useStateInner('');
  const [isSubmitting, setIsSubmitting] = useStateInner(false);
  const [liquorCheck, setLiquorCheck] = useStateInner<LiquorCheckResult | null>(null);
  const [isCheckingLiquor, setIsCheckingLiquor] = useStateInner(false);

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
        } else {
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
      const { data: moderators, error: modError } = await supabase
        .from('family_members')
        .select('user_id')
        .eq('family_id', familyId)
        .eq('role', 'moderator');

      if (modError) throw modError;

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user?.id)
        .single();

      const userName = profile?.full_name || 'A family member';
      const placeNames = liquorPlaces.map(p => p.name).join(', ');

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
        await supabase.from('notifications').insert(notifications);
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
        meeting_type: meetingType as any,
        meeting_name: meetingName.trim() || null,
        meeting_address: meetingAddress.trim() || null,
        latitude: capturedLocation.latitude,
        longitude: capturedLocation.longitude,
        notes: notes.trim() || null,
      }).select('id').single();

      if (error) throw error;

      if (liquorCheck?.hasLiquorLicense && data?.id) {
        await notifyModerators(data.id, liquorCheck.places);
        
        // Create a liquor license warning record
        const placeNames = liquorCheck.places.map(p => p.name).join(', ');
        await supabase.from('liquor_license_warnings').insert({
          family_id: familyId,
          checkin_id: data.id,
          user_id: user?.id,
          location_address: meetingAddress.trim() || placeNames,
          license_type: liquorCheck.places[0]?.type || 'liquor_license',
        });
      }

      toast({
        title: 'Check-in successful! 🎉',
        description: liquorCheck?.hasLiquorLicense 
          ? 'Your family has been notified. Note: This location is near an establishment with a liquor license.'
          : 'Your family has been notified of your meeting attendance.',
      });

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

          {liquorCheck?.hasLiquorLicense && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-destructive">Liquor License Detected</p>
                  <Badge variant="destructive" className="text-xs">
                    {liquorCheck.confidence === 'high' ? 'High Confidence' : 'Possible Match'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Nearby: {liquorCheck.places.map(p => p.name).join(', ')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Moderators will be notified of this check-in location.
                </p>
              </div>
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
  );
};
