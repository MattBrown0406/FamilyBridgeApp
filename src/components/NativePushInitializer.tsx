import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNativePushNotifications } from "@/hooks/useNativePushNotifications";

/**
 * Mounts the native push notifications hook so iOS/Android Capacitor builds
 * register for push, persist the FCM token, and route taps via React Router.
 * No-op on web.
 */
const NativePushInitializer = () => {
  const navigate = useNavigate();
  const { isSupported, permission, subscribe, setNavigator } = useNativePushNotifications();

  useEffect(() => {
    setNavigator((path: string) => navigate(path));
  }, [navigate, setNavigator]);

  useEffect(() => {
    if (!isSupported) return;
    if (permission === "default") {
      void subscribe();
    }
  }, [isSupported, permission, subscribe]);

  return null;
};

export default NativePushInitializer;