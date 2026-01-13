import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { LifeBuoy, Loader2, Clock, AlertTriangle, Plus } from 'lucide-react';

interface TemporaryModeratorRequestProps {
  familyId: string;
  hasOrganization: boolean;
}

export const TemporaryModeratorRequest = ({ 
  familyId, 
  hasOrganization 
}: TemporaryModeratorRequestProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [hasRecentRequest, setHasRecentRequest] = useState(false);
  const [activeRequest, setActiveRequest] = useState<{ expires_at: string } | null>(null);

  useEffect(() => {
    if (user && familyId) {
      checkExistingRequests();
    }
  }, [user, familyId]);

  const checkExistingRequests = async () => {
    try {
      // Check for active request
      const { data: active } = await supabase
        .from('temporary_moderator_requests')
        .select('expires_at')
        .eq('family_id', familyId)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (active) {
        setActiveRequest(active);
        return;
      }

      // Check for any request in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recent } = await supabase
        .from('temporary_moderator_requests')
        .select('id')
        .eq('family_id', familyId)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .limit(1)
        .maybeSingle();

      setHasRecentRequest(!!recent);
    } catch (error) {
      console.error('Error checking requests:', error);
    }
  };

  const handleRequest = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('request-temp-moderator', {
        body: { familyId },
      });

      if (error) {
        throw new Error(error.message || 'Failed to request temporary moderator');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: 'Request Submitted',
        description: 'A professional interventionist has been assigned to your family for the next 24 hours.',
      });

      setDialogOpen(false);
      checkExistingRequests();
    } catch (error: any) {
      console.error('Error requesting temp moderator:', error);
      toast({
        title: 'Request Failed',
        description: error.message || 'Failed to request temporary moderator.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show button if family has an organization
  if (hasOrganization) {
    return null;
  }

  // Show active status if there's an active request
  if (activeRequest) {
    const expiresAt = new Date(activeRequest.expires_at);
    const hoursRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60)));
    
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-success/10 text-success rounded-full text-sm">
          <Clock className="h-4 w-4" />
          <span className="hidden sm:inline">Crisis Support Active</span>
          <span className="font-medium">{hoursRemaining}h left</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/moderator-purchase?familyId=${familyId}`)}
          className="gap-1"
        >
          <Plus className="h-3 w-3" />
          <span className="hidden sm:inline">Add Hours</span>
        </Button>
      </div>
    );
  }

  return (
    <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
        >
          <LifeBuoy className="h-4 w-4" />
          <span className="hidden sm:inline">Request Temporary Moderator</span>
          <span className="sm:hidden">Crisis Help</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Request 24-Hour Crisis Support
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4 text-left">
              <p>
                You are about to request temporary supervision from a professional 
                interventionist to help your family during a crisis.
              </p>
              
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="font-medium text-foreground">What happens next:</p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>A professional interventionist will be assigned immediately</li>
                  <li>They will have moderator access to your family group for 24 hours</li>
                  <li>They will monitor conversations and provide guidance</li>
                </ul>
              </div>

              <div className="bg-primary/10 p-4 rounded-lg">
                <p className="text-sm">
                  <strong className="text-foreground">Your membership includes:</strong>
                  {' '}One free 24-hour crisis supervision per 30-day period.
                </p>
                {hasRecentRequest && (
                  <p className="text-sm text-destructive mt-2 font-medium">
                    ⚠️ You've already used your free session this month.{' '}
                    <button 
                      onClick={() => {
                        setDialogOpen(false);
                        navigate(`/moderator-purchase?familyId=${familyId}`);
                      }}
                      className="underline hover:no-underline"
                    >
                    Purchase additional hours ($150/day)
                    </button>
                  </p>
                )}
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleRequest();
            }}
            disabled={isLoading}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Requesting...
              </>
            ) : (
              'Yes, Request Crisis Support'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
