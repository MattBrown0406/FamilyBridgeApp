import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

// Extend ServiceWorkerRegistration to include pushManager (Web Push API)
declare global {
  interface ServiceWorkerRegistration {
    pushManager: PushManager;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const vapidPublicKeyRef = useRef<string | null>(null);

  useEffect(() => {
    // Check if push notifications are supported
    const supported = 'serviceWorker' in navigator && 
                      'PushManager' in window && 
                      'Notification' in window;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
      fetchVapidKey();
      checkExistingSubscription();
    }
  }, [user]);

  const fetchVapidKey = async () => {
    if (vapidPublicKeyRef.current) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('get-vapid-public-key');
      if (!error && data?.publicKey) {
        vapidPublicKeyRef.current = data.publicKey;
      }
    } catch (error) {
      console.error('Error fetching VAPID key:', error);
    }
  };

  const checkExistingSubscription = async () => {
    if (!user) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        // Check if this subscription is saved in database
        const { data } = await supabase
          .from('push_subscriptions')
          .select('id')
          .eq('user_id', user.id)
          .eq('endpoint', subscription.endpoint)
          .single();
        
        setIsSubscribed(!!data);
      } else {
        setIsSubscribed(false);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  };

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !user) {
      console.log('Push notifications not supported or user not logged in');
      return false;
    }

    // Ensure we have the VAPID key
    if (!vapidPublicKeyRef.current) {
      await fetchVapidKey();
    }
    
    if (!vapidPublicKeyRef.current) {
      console.log('VAPID public key not available');
      return false;
    }

    setIsLoading(true);

    try {
      // Request notification permission
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== 'granted') {
        console.log('Notification permission denied');
        setIsLoading(false);
        return false;
      }

      // Register service worker
      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        registration = await registerServiceWorker();
      }

      if (!registration) {
        setIsLoading(false);
        return false;
      }

      await navigator.serviceWorker.ready;

      // Subscribe to push
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKeyRef.current!);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
      });

      const subscriptionJson = subscription.toJSON();
      
      // Save to database
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subscriptionJson.endpoint!,
          p256dh: subscriptionJson.keys!.p256dh,
          auth: subscriptionJson.keys!.auth,
        }, {
          onConflict: 'user_id,endpoint'
        });

      if (error) {
        console.error('Error saving subscription:', error);
        setIsLoading(false);
        return false;
      }

      setIsSubscribed(true);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      setIsLoading(false);
      return false;
    }
  }, [isSupported, user]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Remove from database
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id)
          .eq('endpoint', subscription.endpoint);
      }

      setIsSubscribed(false);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      setIsLoading(false);
      return false;
    }
  }, [user]);

  const sendNotification = useCallback(async (
    userIds: string[],
    title: string,
    body: string,
    data?: Record<string, any>,
    type?: string
  ): Promise<boolean> => {
    try {
      const { data: result, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          user_ids: userIds,
          title,
          body,
          data,
          type,
        },
      });

      if (error) {
        console.error('Error sending push notification:', error);
        return false;
      }

      console.log('Push notification result:', result);
      return result?.success || false;
    } catch (error) {
      console.error('Error invoking push notification function:', error);
      return false;
    }
  }, []);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    sendNotification,
    isEnabled: isSupported && isSubscribed && permission === 'granted',
  };
};
