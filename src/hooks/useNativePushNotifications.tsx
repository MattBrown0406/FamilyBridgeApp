import { useCallback, useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

type PermissionState = 'default' | 'granted' | 'denied';

type NotificationData = Record<string, unknown> & {
  family_id?: string;
  type?: string;
  url?: string;
};

const isNativePushPlatform = () => Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';

const normalizePermission = (receive: string): PermissionState => {
  if (receive === 'granted') return 'granted';
  if (receive === 'denied') return 'denied';
  return 'default';
};

/**
 * Native iOS push notifications, delivered directly through APNs by the
 * Supabase send-push-notification edge function.
 *
 * This intentionally does NOT use Firebase Messaging. Capacitor's native push
 * plugin returns the raw APNs token on iOS; we store that token in Supabase and
 * send through Apple's APNs HTTP/2 API from the edge function.
 */
export const useNativePushNotifications = () => {
  const { user } = useAuth();
  const platform = Capacitor.getPlatform();
  const [isSupported] = useState<boolean>(isNativePushPlatform());
  const [permission, setPermission] = useState<PermissionState>('default');
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const tokenRef = useRef<string | null>(null);
  const navigateRef = useRef<((path: string) => void) | null>(null);

  const setNavigator = useCallback((fn: (path: string) => void) => {
    navigateRef.current = fn;
  }, []);

  const routeForNotification = useCallback((data: NotificationData) => {
    if (data?.type && ['handoff_request', 'handoff_accepted', 'handoff_declined'].includes(String(data.type))) {
      return '/moderator?tab=transfers';
    }
    if (data?.type === 'org_transfer_invite') {
      return '/moderator?tab=co-mod';
    }
    if (data?.url && typeof data.url === 'string') {
      return data.url;
    }
    if (data?.family_id) {
      return `/family/${data.family_id}`;
    }
    return '/dashboard';
  }, []);

  const upsertToken = useCallback(async (token: string) => {
    if (!user || !isSupported || platform !== 'ios') return false;

    tokenRef.current = token;

    const { error } = await supabase
      .from('native_push_tokens' as never)
      .upsert(
        {
          user_id: user.id,
          platform: 'ios',
          token,
          token_provider: 'apns',
          environment: 'production',
          device_id: Capacitor.getPlatform(),
          enabled: true,
          last_seen_at: new Date().toISOString(),
        } as never,
        { onConflict: 'user_id,platform,token' }
      );

    if (error) {
      console.error('[native-push] APNs token upsert failed:', error);
      return false;
    }

    setIsRegistered(true);
    return true;
  }, [user, isSupported, platform]);

  useEffect(() => {
    if (!isSupported) return;

    let removed = false;
    const listenerHandles: Array<{ remove: () => Promise<void> | void }> = [];

    (async () => {
      try {
        const status = await PushNotifications.checkPermissions();
        if (removed) return;
        const nextPermission = normalizePermission(status.receive);
        setPermission(nextPermission);

        const registrationListener = await PushNotifications.addListener('registration', (token) => {
          if (token?.value) {
            void upsertToken(token.value);
          }
        });
        listenerHandles.push(registrationListener);

        const registrationErrorListener = await PushNotifications.addListener('registrationError', (error) => {
          console.error('[native-push] APNs registration error:', error);
          setIsRegistered(false);
        });
        listenerHandles.push(registrationErrorListener);

        const actionListener = await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
          const data = (action?.notification?.data ?? {}) as NotificationData;
          const nav = navigateRef.current;
          if (nav) nav(routeForNotification(data));
        });
        listenerHandles.push(actionListener);

        if (nextPermission === 'granted') {
          await PushNotifications.register();
        }
      } catch (error) {
        console.error('[native-push] initialization failed:', error);
      }
    })();

    return () => {
      removed = true;
      listenerHandles.forEach((handle) => void handle.remove());
    };
  }, [isSupported, routeForNotification, upsertToken]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !user) return false;

    setIsLoading(true);
    try {
      const status = await PushNotifications.requestPermissions();
      const nextPermission = normalizePermission(status.receive);
      setPermission(nextPermission);

      if (nextPermission !== 'granted') {
        setIsLoading(false);
        return false;
      }

      await PushNotifications.register();
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('[native-push] subscribe failed:', error);
      setIsLoading(false);
      return false;
    }
  }, [isSupported, user]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !user) return false;

    setIsLoading(true);
    try {
      const token = tokenRef.current;
      const query = supabase
        .from('native_push_tokens' as never)
        .update({ enabled: false, last_seen_at: new Date().toISOString() } as never)
        .eq('user_id', user.id)
        .eq('platform', 'ios');

      if (token) {
        query.eq('token', token);
      }

      const { error } = await query;
      if (error) {
        console.error('[native-push] unsubscribe failed:', error);
        setIsLoading(false);
        return false;
      }

      setIsRegistered(false);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('[native-push] unsubscribe failed:', error);
      setIsLoading(false);
      return false;
    }
  }, [isSupported, user]);

  useEffect(() => {
    if (!isSupported || user || !tokenRef.current) return;

    const token = tokenRef.current;
    void supabase
      .from('native_push_tokens' as never)
      .update({ enabled: false } as never)
      .eq('token', token);

    tokenRef.current = null;
    setIsRegistered(false);
  }, [isSupported, user]);

  return {
    isNative: isSupported,
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
