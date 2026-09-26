import { useEffect } from 'react';
import { usePlatform } from '@/hooks/usePlatform';
import { WEB_APP_URL } from '@/components/site/SiteChrome';

/**
 * Sends the previous web app's sign-in, join and dashboard pages to FamilyBridge on the web.
 * The previous native build still bundles its own screens, so it keeps them.
 */
export const WebAppRedirect = ({ to = '/', legacy }: { to?: string; legacy: React.ReactElement }) => {
  const { isNative } = usePlatform();
  const href = `${WEB_APP_URL}${to}`;

  useEffect(() => {
    if (!isNative) window.location.replace(href);
  }, [isNative, href]);

  if (isNative) return legacy;
  return (
    <div className="min-h-screen grid place-items-center bg-background px-4">
      <p className="text-muted-foreground">
        Taking you to FamilyBridge… <a href={href} className="font-semibold text-primary underline">Continue</a>
      </p>
    </div>
  );
};
