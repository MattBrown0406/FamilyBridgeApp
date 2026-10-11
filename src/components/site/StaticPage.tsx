import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import NotFound from '@/pages/NotFound';

const KEY = 'fb-static-reload';

/**
 * The blog (/blog/...) is plain static pages built by scripts/blog, not part of this app. A visit that lands here
 * (a router link, or a blog address that doesn't exist) reloads once so the host serves the static page; if the
 * reload comes straight back here, the page doesn't exist. Each static page clears the marker when it loads.
 */
const StaticPage = () => {
  const { pathname, search, hash } = useLocation();
  const [missing] = useState(() => {
    try {
      const last = JSON.parse(sessionStorage.getItem(KEY) ?? 'null') as { path: string; at: number } | null;
      if (last && last.path === pathname && Date.now() - last.at < 30_000) {
        sessionStorage.removeItem(KEY);
        return true;
      }
      sessionStorage.setItem(KEY, JSON.stringify({ path: pathname, at: Date.now() }));
      return false;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (!missing) window.location.replace(`${pathname}${search}${hash}`);
  }, [missing, pathname, search, hash]);

  return missing ? <NotFound /> : <div className="min-h-screen" aria-busy="true" />;
};

export default StaticPage;
