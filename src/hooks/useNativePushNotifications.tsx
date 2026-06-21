import { useCallback } from 'react';

/**
 * Native push notifications are intentionally disabled in this App Store build.
 *
 * The Firebase Messaging Capacitor plugin configures Firebase during native plugin
 * load. Without a bundled GoogleService-Info.plist, TestFlight can crash on app
 * startup before React renders. Re-enable this hook only after the iOS Firebase
 * app is configured and the plist is added to the Xcode target.
 */
export const useNativePushNotifications = () => {
  const noopAsync = useCallback(async () => false, []);
  const setNavigator = useCallback((_fn: (path: string) => void) => {}, []);

  return {
    isNative: false,
    isSupported: false,
    permission: 'denied' as const,
    isSubscribed: false,
    isLoading: false,
    subscribe: noopAsync,
    unsubscribe: noopAsync,
    setNavigator,
    isEnabled: false,
  };
};
