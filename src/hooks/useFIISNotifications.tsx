import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UseFIISNotificationsProps {
  familyId: string | undefined;
}

export function useFIISNotifications({ familyId }: UseFIISNotificationsProps) {
  const { user } = useAuth();
  const [hasNewAnalysis, setHasNewAnalysis] = useState(false);
  const [lastViewedAt, setLastViewedAt] = useState<string | null>(null);

  // Get the key for localStorage based on user and family
  const getStorageKey = useCallback(() => {
    if (!user?.id || !familyId) return null;
    return `fiis_last_viewed_${user.id}_${familyId}`;
  }, [user?.id, familyId]);

  // Load last viewed timestamp from localStorage
  useEffect(() => {
    const key = getStorageKey();
    if (key) {
      const stored = localStorage.getItem(key);
      setLastViewedAt(stored);
    }
  }, [getStorageKey]);

  // Check for new analyses
  const checkForNewAnalysis = useCallback(async () => {
    if (!familyId || !user) return;

    try {
      const { data, error } = await supabase
        .from('fiis_pattern_analyses')
        .select('created_at')
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error checking FIIS analyses:', error);
        return;
      }

      if (data?.created_at) {
        const lastAnalysisTime = new Date(data.created_at).getTime();
        const lastViewedTime = lastViewedAt ? new Date(lastViewedAt).getTime() : 0;
        
        // Has new analysis if it was created after last viewed
        setHasNewAnalysis(lastAnalysisTime > lastViewedTime);
      } else {
        setHasNewAnalysis(false);
      }
    } catch (error) {
      console.error('Error in checkForNewAnalysis:', error);
    }
  }, [familyId, user, lastViewedAt]);

  // Initial check and subscribe to changes
  useEffect(() => {
    if (!familyId || !user) return;

    checkForNewAnalysis();

    // Subscribe to new analyses
    const channel = supabase
      .channel(`fiis-notifications-${familyId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'fiis_pattern_analyses',
          filter: `family_id=eq.${familyId}`,
        },
        () => {
          // New analysis created - show notification
          setHasNewAnalysis(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [familyId, user, checkForNewAnalysis]);

  // Mark as viewed - call this when user opens FIIS tab
  const markAsViewed = useCallback(() => {
    const key = getStorageKey();
    if (key) {
      const now = new Date().toISOString();
      localStorage.setItem(key, now);
      setLastViewedAt(now);
      setHasNewAnalysis(false);
    }
  }, [getStorageKey]);

  return {
    hasNewAnalysis,
    markAsViewed,
  };
}
