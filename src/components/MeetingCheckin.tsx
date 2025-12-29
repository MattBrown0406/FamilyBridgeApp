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
import { Loader2, CheckCircle, MapPin } from 'lucide-react';
import { LocationData } from '@/components/LocationCapture';

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

  // Update address when location is captured
  useEffect(() => {
    if (capturedLocation?.address) {
      setMeetingAddress(capturedLocation.address);
    }
  }, [capturedLocation]);

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
      const { error } = await supabase.from('meeting_checkins').insert({
        user_id: user?.id,
        family_id: familyId,
        meeting_type: meetingType as 'AA' | 'Al-Anon' | 'NA' | 'Nar-Anon' | 'Refuge Recovery' | 'Smart Recovery' | 'ACA' | 'CoDA' | 'Families Anonymous' | 'Celebrate Recovery' | 'Other',
        meeting_name: meetingName.trim() || null,
        meeting_address: meetingAddress.trim() || null,
        latitude: capturedLocation.latitude,
        longitude: capturedLocation.longitude,
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
            <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
              <MapPin className="h-5 w-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary">Location ready</p>
                <p className="text-xs text-muted-foreground truncate">
                  {capturedLocation.address || `${capturedLocation.latitude.toFixed(6)}, ${capturedLocation.longitude.toFixed(6)}`}
                </p>
              </div>
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
