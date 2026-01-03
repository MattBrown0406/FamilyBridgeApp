import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

export const useWebPushNotifications = () => {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if notifications are supported (desktop/laptop browsers)
    const supported = 'Notification' in window && !isMobileDevice();
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported]);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!isSupported || permission !== 'granted') {
      console.log('Notifications not available or not permitted');
      return null;
    }

    try {
      const notificationOptions: NotificationOptions = {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: options?.tag || 'familybridge-notification',
        ...options,
      };

      const notification = new Notification(title, notificationOptions);

      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        notification.close();
        
        // Navigate to the relevant page if data is provided
        if (options?.data?.url) {
          window.location.href = options.data.url;
        }
      };

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }, [isSupported, permission]);

  const showMessageNotification = useCallback((senderName: string, message: string, familyId?: string) => {
    return showNotification(`New message from ${senderName}`, {
      body: message.length > 100 ? message.substring(0, 100) + '...' : message,
      tag: `message-${Date.now()}`,
      data: familyId ? { url: `/family/${familyId}` } : undefined,
    });
  }, [showNotification]);

  const showAlertNotification = useCallback((title: string, body: string, url?: string) => {
    return showNotification(title, {
      body,
      tag: `alert-${Date.now()}`,
      data: url ? { url } : undefined,
      requireInteraction: true, // Keep notification visible until user interacts
    });
  }, [showNotification]);

  return {
    isSupported,
    permission,
    requestPermission,
    showNotification,
    showMessageNotification,
    showAlertNotification,
    isEnabled: isSupported && permission === 'granted',
  };
};
