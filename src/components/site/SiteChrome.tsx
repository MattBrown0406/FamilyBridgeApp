import { Link } from 'react-router-dom';
import familyBridgeLogo from '@/assets/familybridge-logo.png';

/** The App Store listing for FamilyBridge. */
export const APP_STORE_URL = 'https://apps.apple.com/app/id6757375159';

export const AppStoreBadge = ({ className = '', dark = true }: { className?: string; dark?: boolean }) => (
  <a
    href={APP_STORE_URL}
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Download FamilyBridge on the App Store"
    className={`inline-flex items-center gap-2.5 h-12 px-4 rounded-xl ${dark ? 'bg-black text-white' : 'bg-white text-black'} shadow-sm hover:opacity-90 transition-opacity ${className}`}
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
    <span className="flex flex-col leading-none text-left">
      <span className="text-[10px] opacity-80">Download on the</span>
      <span className="text-[17px] font-semibold tracking-tight">App Store</span>
    </span>
  </a>
);

/** A real screen from the app in a phone frame. */
export const Phone = ({ src, alt, className = '' }: { src: string; alt: string; className?: string }) => (
  <div className={`relative rounded-[2.2rem] bg-[#0E2F34] p-2 shadow-[0_30px_60px_-20px_rgba(19,74,81,0.45)] ${className}`}>
    <img src={src} alt={alt} loading="lazy" className="block w-full rounded-[1.7rem] aspect-[390/844] object-cover object-top" />
  </div>
);

export const SiteHeader = ({ right }: { right?: React.ReactNode }) => (
  <header className="sticky top-0 z-50 backdrop-blur-md bg-background/85 border-b border-border/60">
    <nav className="container mx-auto px-4 max-w-6xl h-14 flex items-center justify-between gap-3">
      <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="FamilyBridge home">
        <img src={familyBridgeLogo} alt="" className="h-8 w-8 rounded-lg" />
        <span className="text-lg font-extrabold tracking-tight text-foreground">FamilyBridge</span>
      </Link>
      <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
        <a href="/#features" className="hover:text-foreground">Features</a>
        <Link to="/for-providers" className="hover:text-foreground">For professionals</Link>
        <a href="/#pricing" className="hover:text-foreground">Pricing</a>
        <Link to="/support" className="hover:text-foreground">Support</Link>
      </div>
      <div className="flex items-center gap-2">{right}</div>
    </nav>
  </header>
);
