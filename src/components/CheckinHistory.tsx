import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Clock, CalendarDays, ExternalLink, Loader2, LogOut, CheckCircle, ShieldAlert } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface Checkin {
  id: string;
  user_id: string;
  meeting_type: string;
  meeting_name: string | null;
  meeting_address: string | null;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  checked_in_at: string;
  checkout_due_at: string | null;
  checked_out_at: string | null;
  checkout_latitude: number | null;
  checkout_longitude: number | null;
  checkout_address: string | null;
  user_name?: string;
}

interface Member {
  user_id: string;
  full_name: string;
}

interface CheckinHistoryProps {
  familyId: string;
  members: Member[];
  refreshKey?: number;
  currentUserId?: string;
  isModerator?: boolean;
}

const MEETING_TYPE_COLORS: Record<string, string> = {
  'AA': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'Al-Anon': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'NA': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'Nar-Anon': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  'Other': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
};

export const CheckinHistory = ({ familyId, members, refreshKey, currentUserId, isModerator }: CheckinHistoryProps) => {
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCheckins();
  }, [familyId, refreshKey]);

  const fetchCheckins = async () => {
    try {
      // Use the base table - RLS policies control what data is visible
      // Users see their own checkins with full location data
      // Moderators see family checkins but location data is controlled by RLS
      const { data, error } = await supabase
        .from('meeting_checkins')
        .select('*')
        .eq('family_id', familyId)
        .order('checked_in_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const checkinsWithNames = (data || []).map(checkin => {
        const member = members.find(m => m.user_id === checkin.user_id);
        return {
          ...checkin,
          user_name: member?.full_name || 'Unknown',
        };
      });

      setCheckins(checkinsWithNames);
    } catch (error) {
      console.error('Error fetching check-ins:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openInMaps = (lat: number | null, lng: number | null) => {
    if (lat && lng) {
      window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
    }
  };

  // Check if location data is available (not masked)
  const hasLocationData = (checkin: Checkin) => {
    return checkin.latitude !== null && checkin.longitude !== null;
  };

  // Check if user is viewing their own checkin
  const isOwnCheckin = (checkin: Checkin) => {
    return currentUserId && checkin.user_id === currentUserId;
  };

  const getCheckoutStatus = (checkin: Checkin) => {
    if (checkin.checked_out_at) {
      return { status: 'completed', label: 'Checked Out', variant: 'default' as const };
    }
    if (checkin.checkout_due_at) {
      const dueAt = new Date(checkin.checkout_due_at);
      const now = new Date();
      if (now < dueAt) {
        return { status: 'pending', label: 'In Meeting', variant: 'secondary' as const };
      }
      return { status: 'overdue', label: 'Checkout Pending', variant: 'destructive' as const };
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (checkins.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <CalendarDays className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">No check-ins yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Check-ins will appear here when family members attend meetings.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display">Recent Check-ins</CardTitle>
        <CardDescription>
          Meeting attendance from family members
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="divide-y">
            {checkins.map((checkin) => {
              const checkoutStatus = getCheckoutStatus(checkin);
              
              return (
                <div key={checkin.id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-medium text-foreground">
                          {checkin.user_name}
                        </span>
                        <Badge 
                          variant="secondary" 
                          className={MEETING_TYPE_COLORS[checkin.meeting_type] || MEETING_TYPE_COLORS['Other']}
                        >
                          {checkin.meeting_type}
                        </Badge>
                        {checkoutStatus && (
                          <Badge variant={checkoutStatus.variant} className="text-xs">
                            {checkoutStatus.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                            {checkoutStatus.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                            {checkoutStatus.status === 'overdue' && <LogOut className="h-3 w-3 mr-1" />}
                            {checkoutStatus.label}
                          </Badge>
                        )}
                      </div>
                      
                      {checkin.meeting_name && (
                        <p className="text-sm text-foreground mb-1">
                          {checkin.meeting_name}
                        </p>
                      )}

                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                        <Clock className="h-3 w-3" />
                        <span>
                          Checked in {formatDistanceToNow(new Date(checkin.checked_in_at), { addSuffix: true })}
                        </span>
                        <span className="mx-1">•</span>
                        <span>
                          {format(new Date(checkin.checked_in_at), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>

                      {/* Checkout info */}
                      {checkin.checked_out_at && (
                        <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 mb-2">
                          <LogOut className="h-3 w-3" />
                          <span>
                            Checked out at {format(new Date(checkin.checked_out_at), 'h:mm a')}
                          </span>
                          {checkin.checkout_address && checkin.checkout_latitude && checkin.checkout_longitude && (
                            <>
                              <span className="mx-1">•</span>
                              <button
                                onClick={() => openInMaps(checkin.checkout_latitude, checkin.checkout_longitude)}
                                className="flex items-center gap-1 hover:underline"
                              >
                                <MapPin className="h-3 w-3" />
                                <span className="truncate max-w-[150px]">{checkin.checkout_address}</span>
                              </button>
                            </>
                          )}
                          {checkin.checkout_address && !checkin.checkout_latitude && (
                            <>
                              <span className="mx-1">•</span>
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <ShieldAlert className="h-3 w-3" />
                                <span className="truncate max-w-[150px]">{checkin.checkout_address}</span>
                              </span>
                            </>
                          )}
                        </div>
                      )}

                      {/* Show full location for user's own checkins */}
                      {hasLocationData(checkin) && checkin.meeting_address && (
                        <button
                          onClick={() => openInMaps(checkin.latitude, checkin.longitude)}
                          className="flex items-start gap-1 text-xs text-primary hover:underline group"
                        >
                          <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                          <span className="text-left line-clamp-2">{checkin.meeting_address}</span>
                          <ExternalLink className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      )}

                      {hasLocationData(checkin) && !checkin.meeting_address && (
                        <button
                          onClick={() => openInMaps(checkin.latitude, checkin.longitude)}
                          className="flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <MapPin className="h-3 w-3" />
                          <span>View on map</span>
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      )}

                      {/* Show masked location indicator for moderators viewing others' checkins */}
                      {!hasLocationData(checkin) && checkin.meeting_address && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <ShieldAlert className="h-3 w-3" />
                          <span>{checkin.meeting_address}</span>
                          <span className="text-xs italic">(Location protected)</span>
                        </div>
                      )}

                      {!hasLocationData(checkin) && !checkin.meeting_address && !isOwnCheckin(checkin) && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <ShieldAlert className="h-3 w-3" />
                          <span className="italic">Location protected for privacy</span>
                        </div>
                      )}

                      {checkin.notes && (
                        <p className="text-sm text-muted-foreground mt-2 italic">
                          "{checkin.notes}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};