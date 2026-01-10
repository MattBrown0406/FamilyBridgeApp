import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface DriftMonitorConfig {
  checkinId: string;
  familyId: string;
  checkinLatitude: number;
  checkinLongitude: number;
  thresholdYards?: number; // Default 100 yards
  checkIntervalMs?: number; // Default 30 seconds
}

interface DriftStatus {
  isMonitoring: boolean;
  currentDistance: number | null; // in yards
  hasExceededThreshold: boolean;
  warningPosted: boolean;
  lastChecked: Date | null;
  error: string | null;
}

// Haversine formula to calculate distance between two coordinates in meters
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
}

// Convert meters to yards
function metersToYards(meters: number): number {
  return meters * 1.09361;
}

export function useLocationDriftMonitor(config: DriftMonitorConfig | null) {
  const { user } = useAuth();
  const [status, setStatus] = useState<DriftStatus>({
    isMonitoring: false,
    currentDistance: null,
    hasExceededThreshold: false,
    warningPosted: false,
    lastChecked: null,
    error: null,
  });

  const watchIdRef = useRef<number | null>(null);
  const warningPostedRef = useRef(false);
  const thresholdYards = config?.thresholdYards ?? 100;
  const checkIntervalMs = config?.checkIntervalMs ?? 30000;

  const postWarningToChat = useCallback(async (
    familyId: string,
    userId: string,
    distanceYards: number,
    currentAddress?: string
  ) => {
    if (warningPostedRef.current) return;
    
    try {
      // Get user's name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single();

      const userName = profile?.full_name || 'A family member';
      const distanceText = Math.round(distanceYards);

      // Post warning message to family chat
      const { error } = await supabase.from('messages').insert({
        family_id: familyId,
        sender_id: userId,
        content: `⚠️ **Location Drift Alert**\n\n${userName} has moved approximately ${distanceText} yards from their check-in location while still checked into a meeting.${currentAddress ? `\n\n📍 Current location: ${currentAddress}` : ''}\n\n_This is an automated alert._`,
      });

      if (error) {
        console.error('Error posting drift warning:', error);
      } else {
        console.log('Drift warning posted to chat');
        warningPostedRef.current = true;
        setStatus(prev => ({ ...prev, warningPosted: true }));
      }

      // Also create a notification for moderators
      const { data: moderators } = await supabase
        .from('family_members')
        .select('user_id')
        .eq('family_id', familyId)
        .eq('role', 'moderator');

      if (moderators && moderators.length > 0) {
        const notifications = moderators
          .filter(m => m.user_id !== userId)
          .map(mod => ({
            user_id: mod.user_id,
            family_id: familyId,
            type: 'location_drift',
            title: '⚠️ Location Drift Alert',
            body: `${userName} has moved ${distanceText} yards from their check-in location.`,
            related_id: config?.checkinId,
          }));

        if (notifications.length > 0) {
          await supabase.from('notifications').insert(notifications);
        }
      }
    } catch (error) {
      console.error('Error posting drift warning:', error);
    }
  }, [config?.checkinId]);

  const reverseGeocode = useCallback(async (lat: number, lon: number): Promise<string | undefined> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
        { headers: { 'User-Agent': 'FamilyBridge/1.0' } }
      );
      if (response.ok) {
        const data = await response.json();
        return data.display_name;
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
    }
    return undefined;
  }, []);

  const checkPosition = useCallback(async (position: GeolocationPosition) => {
    if (!config || !user?.id) return;

    const currentLat = position.coords.latitude;
    const currentLon = position.coords.longitude;
    
    const distanceMeters = calculateDistance(
      config.checkinLatitude,
      config.checkinLongitude,
      currentLat,
      currentLon
    );
    
    const distanceYards = metersToYards(distanceMeters);
    const exceeded = distanceYards > thresholdYards;

    setStatus(prev => ({
      ...prev,
      currentDistance: distanceYards,
      hasExceededThreshold: exceeded,
      lastChecked: new Date(),
      error: null,
    }));

    console.log(`Location drift check: ${distanceYards.toFixed(1)} yards from check-in (threshold: ${thresholdYards} yards)`);

    // Post warning if threshold exceeded and not already posted
    if (exceeded && !warningPostedRef.current) {
      const currentAddress = await reverseGeocode(currentLat, currentLon);
      await postWarningToChat(config.familyId, user.id, distanceYards, currentAddress);
    }
  }, [config, user?.id, thresholdYards, postWarningToChat, reverseGeocode]);

  const handlePositionError = useCallback((error: GeolocationPositionError) => {
    console.error('Location drift monitor error:', error.message);
    setStatus(prev => ({
      ...prev,
      error: error.message,
    }));
  }, []);

  // Start monitoring when config is provided
  useEffect(() => {
    if (!config) {
      // Clean up if config is removed (checkout happened)
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      warningPostedRef.current = false;
      setStatus({
        isMonitoring: false,
        currentDistance: null,
        hasExceededThreshold: false,
        warningPosted: false,
        lastChecked: null,
        error: null,
      });
      return;
    }

    if (!navigator.geolocation) {
      setStatus(prev => ({
        ...prev,
        error: 'Geolocation not supported',
      }));
      return;
    }

    console.log('Starting location drift monitoring...');
    setStatus(prev => ({ ...prev, isMonitoring: true, error: null }));
    warningPostedRef.current = false;

    // Use watchPosition for continuous tracking
    watchIdRef.current = navigator.geolocation.watchPosition(
      checkPosition,
      handlePositionError,
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: checkIntervalMs,
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        console.log('Stopping location drift monitoring...');
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [config, checkPosition, handlePositionError, checkIntervalMs]);

  const stopMonitoring = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setStatus(prev => ({ ...prev, isMonitoring: false }));
  }, []);

  return {
    ...status,
    stopMonitoring,
  };
}
