import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, MapPin, Wine, X, Check } from 'lucide-react';
import { format } from 'date-fns';

interface LiquorLicenseWarning {
  id: string;
  checkin_id: string;
  user_id: string;
  location_address: string;
  license_type: string;
  warned_at: string;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
}

interface LiquorLicenseWarningsProps {
  familyId: string;
  members: { user_id: string; full_name: string }[];
  isAdminOrModerator: boolean;
}

export function LiquorLicenseWarnings({ familyId, members, isAdminOrModerator }: LiquorLicenseWarningsProps) {
  const [warnings, setWarnings] = useState<LiquorLicenseWarning[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWarnings = async () => {
    try {
      const { data, error } = await supabase
        .from('liquor_license_warnings')
        .select('*')
        .eq('family_id', familyId)
        .is('acknowledged_at', null)
        .order('warned_at', { ascending: false });

      if (error) {
        console.error('Error fetching warnings:', error);
        return;
      }

      setWarnings(data || []);
    } catch (err) {
      console.error('Error in fetchWarnings:', err);
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeWarning = async (warningId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('liquor_license_warnings')
      .update({
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: user.id,
      })
      .eq('id', warningId);

    if (error) {
      console.error('Error acknowledging warning:', error);
      return;
    }

    setWarnings(prev => prev.filter(w => w.id !== warningId));
  };

  useEffect(() => {
    fetchWarnings();
  }, [familyId]);

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`liquor-warnings-${familyId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'liquor_license_warnings',
          filter: `family_id=eq.${familyId}`,
        },
        (payload) => {
          console.log('New liquor license warning:', payload);
          setWarnings(prev => [payload.new as LiquorLicenseWarning, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'liquor_license_warnings',
          filter: `family_id=eq.${familyId}`,
        },
        (payload) => {
          const updated = payload.new as LiquorLicenseWarning;
          if (updated.acknowledged_at) {
            setWarnings(prev => prev.filter(w => w.id !== updated.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [familyId]);

  const getMemberName = (userId: string) => {
    const member = members.find(m => m.user_id === userId);
    return member?.full_name || 'Unknown';
  };

  if (loading || warnings.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {warnings.map((warning) => (
        <Card key={warning.id} className="border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-orange-500 to-amber-500" />
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center shrink-0">
                <Wine className="h-5 w-5 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-semibold text-orange-800 dark:text-orange-200">
                    Liquor License Location Detected
                  </h4>
                  <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Concern
                  </Badge>
                </div>
                <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                  <strong>{getMemberName(warning.user_id)}</strong> checked in at a location with an active liquor license.
                </p>
                <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 mt-2">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{warning.location_address || 'Location details unavailable'}</span>
                </div>
                <p className="text-xs text-orange-500 mt-1">
                  {format(new Date(warning.warned_at), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
              {isAdminOrModerator && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => acknowledgeWarning(warning.id)}
                  className="shrink-0 border-orange-300 hover:bg-orange-100"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Acknowledge
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
