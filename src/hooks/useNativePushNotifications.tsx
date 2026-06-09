import { useCallback, useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

type NotificationData = Record<string, unknown> & {
  family_id?: string;
  type?: string;
  url?: string;
};

/**
 * Native push notifications for installed iOS/Android (Capacitor) builds.
 * No-op on web — use usePushNotifications for browser/web push.
 */
export const useNativePushNotifications = () => {
  const { user } = useAuth();
  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform(); // 'ios' | 'android' | 'web'

  const [isSupported] = useState<boolean>(isNative && (platform === 'ios' || platform === 'android'));
  const [permission, setPermission] = useState<'default' | 'granted' | 'denied'>('default');
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const tokenRef = useRef<string | null>(null);
  const listenersAttached = useRef(false);
  const navigateRef = useRef<((path: string) => void) | null>(null);

  const setNavigator = useCallback((fn: (path: string) => void) => {
    navigateRef.current = fn;
  }, []);

  const upsertToken = useCallback(async (token: string) => {
    if (!user || (platform !== 'ios' && platform !== 'android')) return false;
    tokenRef.current = token;
    const { error } = await supabase
      .from('native_push_tokens' as never)
      .upsert(
        {
          user_id: user.id,
          platform,
          token,
          device_id: Capacitor.getPlatform(),
          enabled: true,
          last_seen_at: new Date().toISOString(),
        } as never,
        { onConflict: 'user_id,platform,token' }
      );
    if (error) {
      console.error('[native-push] upsert token failed:', error);
      return false;
    }
    setIsRegistered(true);
    return true;
  }, [user, platform]);

  const handleNotificationAction = useCallback((data: NotificationData) => {
    const nav = navigateRef.current;
    if (!nav) return;
    if (data?.type && ['handoff_request', 'handoff_accepted', 'handoff_declined'].includes(String(data.type))) {
      nav('/moderator?tab=transfers');
      return;
    }
    if (data?.family_id) {
      nav(`/family/${data.family_id}`);
      return;
    }
    if (data?.url && typeof data.url === 'string') {
      nav(data.url);
      return;
    }
    nav('/dashboard');
  }, []);

  // Attach listeners once on native platforms
  useEffect(() => {
    if (!isSupported || listenersAttached.current) return;
    let cleanup: (() => void) | undefined;

    (async () => {
      try {
        const mod = await import('@capacitor/push-notifications');
        const { PushNotifications } = mod;
        listenersAttached.current = true;

        const regListener = await PushNotifications.addListener('registration', (token) => {
          console.log('[native-push] registered token');
          void upsertToken(token.value);
        });
        const errListener = await PushNotifications.addListener('registrationError', (err) => {
          console.error('[native-push] registration error:', err);
        });
        const recvListener = await PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('[native-push] received:', notification);
        });
        const actionListener = await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
          const data = (action?.notification?.data ?? {}) as NotificationData;
          handleNotificationAction(data);
        });

        cleanup = () => {
          regListener.remove();
          errListener.remove();
          recvListener.remove();
          actionListener.remove();
          listenersAttached.current = false;
        };
      } catch (e) {
        console.error('[native-push] failed to init plugin:', e);
      }
    })();

    return () => {
      cleanup?.();
    };
  }, [isSupported, upsertToken, handleNotificationAction]);

  // Check existing permission on mount
  useEffect(() => {
    if (!isSupported) return;
    (async () => {
      try {
        const { PushNotifications } = await import('@capacitor/push-notifications');
        const status = await PushNotifications.checkPermissions();
        setPermission(status.receive as 'default' | 'granted' | 'denied');
        if (status.receive === 'granted') {
          await PushNotifications.register();
        }
      } catch (e) {
        console.error('[native-push] checkPermissions failed:', e);
      }
    })();
  }, [isSupported]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !user) return false;
    setIsLoading(true);
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      const status = await PushNotifications.requestPermissions();
      setPermission(status.receive as 'default' | 'granted' | 'denied');
      if (status.receive !== 'granted') {
        setIsLoading(false);
        return false;
      }
      await PushNotifications.register();
      setIsLoading(false);
      return true;
    } catch (e) {
      console.error('[native-push] subscribe failed:', e);
      setIsLoading(false);
      return false;
    }
  }, [isSupported, user]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !user) return false;
    setIsLoading(true);
    try {
      const token = tokenRef.current;
      if (token) {
        await supabase
          .from('native_push_tokens' as never)
          .update({ enabled: false } as never)
          .eq('user_id', user.id)
          .eq('token', token);
      } else {
        await supabase
          .from('native_push_tokens' as never)
          .update({ enabled: false } as never)
          .eq('user_id', user.id)
          .eq('platform', platform);
      }
      setIsRegistered(false);
      setIsLoading(false);
      return true;
    } catch (e) {
      console.error('[native-push] unsubscribe failed:', e);
      setIsLoading(false);
      return false;
    }
  }, [isSupported, user, platform]);

  // Disable token on logout
  useEffect(() => {
    if (!isSupported) return;
    if (!user && tokenRef.current) {
      const token = tokenRef.current;
      void supabase
        .from('native_push_tokens' as never)
        .update({ enabled: false } as never)
        .eq('token', token);
      tokenRef.current = null;
      setIsRegistered(false);
    }
  }, [user, isSupported]);

  return {
    isNative,
    isSupported,
    permission,
    isSubscribed: isRegistered,
    isLoading,
    subscribe,
    unsubscribe,
    setNavigator,
    isEnabled: isSupported && isRegistered && permission === 'granted',
  };
};
