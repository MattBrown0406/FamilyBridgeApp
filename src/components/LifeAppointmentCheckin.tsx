import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle, MapPin, Briefcase, Heart, Stethoscope, Scale, Calendar } from 'lucide-react';
import { LocationData } from '@/components/LocationCapture';

const APPOINTMENT_TYPES = [
  { value: 'Therapy', label: 'Therapy / Counseling', icon: Heart, category: 'Healthcare' },
  { value: 'Medical', label: 'Medical Appointment', icon: Stethoscope, category: 'Healthcare' },
  { value: 'Wellness', label: 'Wellness Activity', icon: Heart, category: 'Healthcare' },
  { value: 'Support Group', label: 'Support Group', icon: Heart, category: 'Healthcare' },
  { value: 'Work', label: 'Work / Job', icon: Briefcase, category: 'Professional' },
  { value: 'Job Interview', label: 'Job Interview', icon: Briefcase, category: 'Professional' },
  { value: 'Court', label: 'Court Appearance', icon: Scale, category: 'Legal' },
  { value: 'Probation', label: 'Probation Meeting', icon: Scale, category: 'Legal' },
];

interface LifeAppointmentCheckinProps {
  familyId: string;
  onCheckinComplete?: () => void;
  capturedLocation?: LocationData | null;
}

export const LifeAppointmentCheckin = ({ familyId, onCheckinComplete, capturedLocation }: LifeAppointmentCheckinProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [appointmentType, setAppointmentType] = useState<string>('');
  const [appointmentName, setAppointmentName] = useState('');
  const [appointmentAddress, setAppointmentAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update address when location is captured
  useEffect(() => {
    if (capturedLocation?.address) {
      setAppointmentAddress(capturedLocation.address);
    }
  }, [capturedLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!appointmentType) {
      toast({
        title: 'Appointment type required',
        description: 'Please select an appointment type.',
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
        meeting_type: appointmentType as any,
        meeting_name: appointmentName.trim() || null,
        meeting_address: appointmentAddress.trim() || null,
        latitude: capturedLocation.latitude,
        longitude: capturedLocation.longitude,
        notes: notes.trim() || null,
      });

      if (error) throw error;

      toast({
        title: 'Check-in successful! 🎉',
        description: 'Your family has been notified of your appointment.',
      });

      // Reset form
      setAppointmentType('');
      setAppointmentName('');
      setAppointmentAddress('');
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

  // Group appointments by category
  const groupedAppointments = APPOINTMENT_TYPES.reduce((acc, type) => {
    if (!acc[type.category]) {
      acc[type.category] = [];
    }
    acc[type.category].push(type);
    return acc;
  }, {} as Record<string, typeof APPOINTMENT_TYPES>);

  return (
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

      {/* Appointment Type */}
      <div className="space-y-2">
        <Label htmlFor="appointmentType">Appointment Type *</Label>
        <Select value={appointmentType} onValueChange={setAppointmentType}>
          <SelectTrigger>
            <SelectValue placeholder="Select appointment type" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(groupedAppointments).map(([category, types]) => (
              <div key={category}>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                  {category}
                </div>
                {types.map((type) => {
                  const IconComponent = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <span className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4" />
                        {type.label}
                      </span>
                    </SelectItem>
                  );
                })}
              </div>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Appointment Name/Details */}
      <div className="space-y-2">
        <Label htmlFor="appointmentName">Details (optional)</Label>
        <Input
          id="appointmentName"
          placeholder="e.g., Dr. Smith, ABC Company"
          value={appointmentName}
          onChange={(e) => setAppointmentName(e.target.value)}
          maxLength={100}
        />
      </div>

      {/* Appointment Address */}
      <div className="space-y-2">
        <Label htmlFor="appointmentAddress">Address (optional)</Label>
        <Input
          id="appointmentAddress"
          placeholder="Will be auto-filled from location"
          value={appointmentAddress}
          onChange={(e) => setAppointmentAddress(e.target.value)}
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
        disabled={isSubmitting || !appointmentType || !capturedLocation}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Checking in...
          </>
        ) : (
          <>
            <Calendar className="h-4 w-4 mr-2" />
            Check In to Appointment
          </>
        )}
      </Button>
    </form>
  );
};
