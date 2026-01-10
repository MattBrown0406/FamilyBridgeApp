import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useLocationDriftMonitor } from '@/hooks/useLocationDriftMonitor';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, LogOut, MapPin, Clock, AlertCircle, AlertTriangle, Navigation } from 'lucide-react';
import { LocationCapture, LocationData } from '@/components/LocationCapture';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow, isPast, isFuture } from 'date-fns';

interface PendingCheckout {
  id: string;
  meeting_type: string;
  meeting_name: string | null;
  meeting_address: string | null;
  checked_in_at: string;
  checkout_due_at: string;
  meeting_start_time: string;
  latitude: number;
  longitude: number;
}

interface MeetingCheckoutProps {
  familyId: string;
  onCheckoutComplete?: () => void;
}

export const MeetingCheckout = ({ familyId, onCheckoutComplete }: MeetingCheckoutProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [pendingCheckout, setPendingCheckout] = useState<PendingCheckout | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [capturedLocation, setCapturedLocation] = useState<LocationData | null>(null);
  const [notes, setNotes] = useState('');
  const [checkoutAvailable, setCheckoutAvailable] = useState(false);

  // Location drift monitoring - tracks if user moves >100 yards from check-in location
  const driftMonitor = useLocationDriftMonitor(
    pendingCheckout ? {
      checkinId: pendingCheckout.id,
      familyId,
      checkinLatitude: pendingCheckout.latitude,
      checkinLongitude: pendingCheckout.longitude,
      thresholdYards: 100,
      checkIntervalMs: 30000,
    } : null
  );

  // Fetch pending checkout
  useEffect(() => {
    const fetchPendingCheckout = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('meeting_checkins')
          .select('id, meeting_type, meeting_name, meeting_address, checked_in_at, checkout_due_at, meeting_start_time, latitude, longitude')
          .eq('user_id', user.id)
          .eq('family_id', familyId)
          .is('checked_out_at', null)
          .not('checkout_due_at', 'is', null)
          .order('checked_in_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        setPendingCheckout(data);
        
        // Check if checkout time has passed
        if (data?.checkout_due_at) {
          setCheckoutAvailable(isPast(new Date(data.checkout_due_at)));
        }
      } catch (error) {
        console.error('Error fetching pending checkout:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPendingCheckout();
  }, [user?.id, familyId]);

  // Update checkout availability every minute
  useEffect(() => {
    if (!pendingCheckout?.checkout_due_at) return;

    const checkTime = () => {
      const dueAt = new Date(pendingCheckout.checkout_due_at);
      setCheckoutAvailable(isPast(dueAt));
    };

    checkTime();
    const interval = setInterval(checkTime, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [pendingCheckout?.checkout_due_at]);

  const handleLocationCapture = (location: LocationData) => {
    setCapturedLocation(location);
  };

  const handleCheckout = async () => {
    if (!pendingCheckout || !capturedLocation) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('meeting_checkins')
        .update({
          checked_out_at: new Date().toISOString(),
          checkout_latitude: capturedLocation.latitude,
          checkout_longitude: capturedLocation.longitude,
          checkout_address: capturedLocation.address || null,
          notes: notes.trim() || null,
        })
        .eq('id', pendingCheckout.id);

      if (error) throw error;

      toast({
        title: 'Checked out successfully! 🎉',
        description: 'Your meeting checkout has been recorded.',
      });

      setPendingCheckout(null);
      setCapturedLocation(null);
      setNotes('');
      onCheckoutComplete?.();
    } catch (error) {
      console.error('Error checking out:', error);
      toast({
        title: 'Error',
        description: 'Failed to check out. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Loading...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!pendingCheckout) {
    return null;
  }

  const checkoutDueAt = new Date(pendingCheckout.checkout_due_at);
  const isOverdue = isPast(checkoutDueAt);
  const timeUntilCheckout = isFuture(checkoutDueAt) 
    ? formatDistanceToNow(checkoutDueAt, { addSuffix: true })
    : null;

  return (
    <Card className={isOverdue ? 'border-primary/50 bg-primary/5' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 font-display">
              <LogOut className="h-5 w-5 text-primary" />
              Meeting Checkout Required
            </CardTitle>
            <CardDescription>
              Complete your meeting checkout to confirm attendance.
            </CardDescription>
          </div>
          {isOverdue ? (
            <Badge variant="default">Ready</Badge>
          ) : (
            <Badge variant="secondary">Pending</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Meeting Info */}
        <div className="p-3 bg-muted/50 rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{pendingCheckout.meeting_type}</span>
            {pendingCheckout.meeting_name && (
              <span className="text-muted-foreground">• {pendingCheckout.meeting_name}</span>
            )}
          </div>
          {pendingCheckout.meeting_address && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {pendingCheckout.meeting_address}
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>
              Checked in: {format(new Date(pendingCheckout.checked_in_at), 'h:mm a')}
            </span>
            <span>•</span>
            <span>
              Checkout due: {format(checkoutDueAt, 'h:mm a')}
            </span>
          </div>
        </div>

        {/* Location Drift Monitor Status */}
        {driftMonitor.isMonitoring && (
          <div className={`flex items-start gap-2 p-3 rounded-lg ${
            driftMonitor.hasExceededThreshold 
              ? 'bg-destructive/10 border border-destructive/20' 
              : 'bg-primary/5 border border-primary/10'
          }`}>
            <Navigation className={`h-5 w-5 shrink-0 mt-0.5 ${
              driftMonitor.hasExceededThreshold ? 'text-destructive' : 'text-primary'
            }`} />
            <div className="flex-1 min-w-0">
              {driftMonitor.hasExceededThreshold ? (
                <>
                  <p className="text-sm font-medium text-destructive">Location Drift Detected</p>
                  <p className="text-xs text-muted-foreground">
                    You've moved {Math.round(driftMonitor.currentDistance || 0)} yards from check-in location.
                    {driftMonitor.warningPosted && ' A notification has been sent to your family.'}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-primary">Location Monitoring Active</p>
                  <p className="text-xs text-muted-foreground">
                    {driftMonitor.currentDistance !== null 
                      ? `Currently ${Math.round(driftMonitor.currentDistance)} yards from check-in location`
                      : 'Tracking your location during the meeting'}
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {driftMonitor.error && (
          <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Location tracking unavailable: {driftMonitor.error}
            </p>
          </div>
        )}

        {!checkoutAvailable ? (
          <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Checkout available {timeUntilCheckout}</p>
              <p className="text-xs text-muted-foreground">
                You can checkout once the meeting ends at {format(checkoutDueAt, 'h:mm a')}.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Location Capture */}
            <div className="space-y-2">
              <Label>Capture Your Checkout Location</Label>
              <LocationCapture
                onLocationCaptured={handleLocationCapture}
                buttonLabel="Capture Checkout Location"
                buttonLoadingLabel="Getting location..."
                showCapturedState
              />
            </div>

            {capturedLocation && (
              <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
                <MapPin className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary">Checkout location ready</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {capturedLocation.address || `${capturedLocation.latitude.toFixed(6)}, ${capturedLocation.longitude.toFixed(6)}`}
                  </p>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="checkoutNotes">Notes (optional)</Label>
              <Textarea
                id="checkoutNotes"
                placeholder="How was the meeting?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={500}
                rows={2}
              />
            </div>

            {/* Checkout Button */}
            <Button
              onClick={handleCheckout}
              className="w-full"
              disabled={isSubmitting || !capturedLocation}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Checking out...
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4 mr-2" />
                  Complete Checkout
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};
