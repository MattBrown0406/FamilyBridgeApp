import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Loader2, CheckCircle, Navigation } from 'lucide-react';

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

interface MeetingCheckinProps {
  familyId: string;
  onCheckinComplete?: () => void;
}

export const MeetingCheckin = ({ familyId, onCheckinComplete }: MeetingCheckinProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [meetingType, setMeetingType] = useState<string>('');
  const [meetingName, setMeetingName] = useState('');
  const [meetingAddress, setMeetingAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const getLocation = () => {
    setIsGettingLocation(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);

        // Try to get address from coordinates using reverse geocoding
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          const data = await response.json();
          if (data.display_name) {
            setMeetingAddress(data.display_name);
          }
        } catch (error) {
          console.log('Could not fetch address:', error);
        }

        setIsGettingLocation(false);
        toast({
          title: 'Location captured',
          description: 'Your current location has been recorded.',
        });
      },
      (error) => {
        setIsGettingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Please allow location access to check in');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information is unavailable');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out');
            break;
          default:
            setLocationError('An unknown error occurred');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
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

    if (latitude === null || longitude === null) {
      toast({
        title: 'Location required',
        description: 'Please capture your location before checking in.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('meeting_checkins').insert({
        user_id: user?.id,
        family_id: familyId,
        meeting_type: meetingType as 'AA' | 'Al-Anon' | 'NA' | 'Nar-Anon' | 'Refuge Recovery' | 'Smart Recovery' | 'ACA' | 'CoDA' | 'Families Anonymous' | 'Celebrate Recovery' | 'Other',
        meeting_name: meetingName.trim() || null,
        meeting_address: meetingAddress.trim() || null,
        latitude,
        longitude,
        notes: notes.trim() || null,
      });

      if (error) throw error;

      toast({
        title: 'Check-in successful! 🎉',
        description: 'Your family has been notified of your meeting attendance.',
      });

      // Reset form
      setMeetingType('');
      setMeetingName('');
      setMeetingAddress('');
      setNotes('');
      setLatitude(null);
      setLongitude(null);
      
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
          Your location will be shared to verify attendance.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Location Button */}
          <div className="space-y-2">
            <Label>Your Location</Label>
            {latitude && longitude ? (
              <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
                <MapPin className="h-5 w-5 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary">Location captured</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {meetingAddress || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={getLocation}
                >
                  Update
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={getLocation}
                disabled={isGettingLocation}
                className="w-full"
              >
                {isGettingLocation ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Getting location...
                  </>
                ) : (
                  <>
                    <Navigation className="h-4 w-4 mr-2" />
                    Capture My Location
                  </>
                )}
              </Button>
            )}
            {locationError && (
              <p className="text-sm text-destructive">{locationError}</p>
            )}
          </div>

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
            disabled={isSubmitting || !meetingType || latitude === null}
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
