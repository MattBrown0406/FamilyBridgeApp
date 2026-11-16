import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * The demo app (public/app-demo) is one file, /app-demo/index.html, that shows its screens under addresses such as
 * /app-demo/tools/finances. Those addresses are not files, so reloading the phone frame on one, or opening one in
 * a new tab, lands on this website instead. Inside the frame, send it back to the app on the same screen; on its
 * own, the demo page is the place to be.
 */
const AppDemoReturn = () => {
  const { pathname, search } = useLocation();
  useEffect(() => {
    const screen = pathname.replace(/^\/app-demo/, '') || '/';
    const framed = window.self !== window.top;
    window.location.replace(framed ? `/app-demo/index.html?go=${encodeURIComponent(screen + search)}` : '/demo');
  }, [pathname, search]);
  return null;
};

export default AppDemoReturn;
