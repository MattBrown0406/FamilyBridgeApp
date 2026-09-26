import { Navigate } from 'react-router-dom';
import { usePlatform } from '@/hooks/usePlatform';

/**
 * The previous web app's sign-in, join, dashboard and admin pages. FamilyBridge now runs in the iPhone/iPad app,
 * so on the web these go to the App Store download (families) or Practice billing (professionals).
 * The previous native build still bundles its own screens, so it keeps them.
 */
export const LegacyRedirect = ({ to, legacy }: { to: string; legacy: React.ReactElement }) => {
  const { isNative } = usePlatform();
  return isNative ? legacy : <Navigate to={to} replace />;
};
