import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNativePushNotifications } from "@/hooks/useNativePushNotifications";

/**
 * Mounts the native push notifications hook so iOS Capacitor builds
 * register for APNs push, persist the APNs token, and route taps via React Router.
 * No-op on web and unsupported native platforms.
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