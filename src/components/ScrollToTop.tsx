import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** New page: start at the top — or at the linked section (e.g. /#pricing), once the page has rendered it. */
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }
    // Pages load on demand, so the section may not exist yet: look for it for up to two seconds.
    let tries = 0;
    let timer = 0;
    const find = () => {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (el) el.scrollIntoView();
      else if (tries++ < 20) timer = window.setTimeout(find, 100);
    };
    timer = window.setTimeout(find, 0);
    return () => window.clearTimeout(timer);
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
