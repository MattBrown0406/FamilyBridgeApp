import { Link } from 'react-router-dom';
import { useOrganization } from '@/hooks/useOrganization';
import familyBridgeLogo from '@/assets/familybridge-logo.png';

export const BrandedFooter = () => {
  const { organization, isWhiteLabeled } = useOrganization();
  const currentYear = new Date().getFullYear();

  if (isWhiteLabeled && organization) {
    return (
      <footer className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 border-t border-border">
        <div className="flex flex-col items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            {organization.logo_url ? (
              <img 
                src={organization.logo_url} 
                alt={organization.name} 
                className="h-4 sm:h-5 w-auto object-contain"
              />
            ) : (
              <img src={familyBridgeLogo} alt="FamilyBridge" className="h-4 sm:h-5 w-auto object-contain" />
            )}
            <span className="font-display font-semibold text-foreground text-sm sm:text-base">
              {organization.name}
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          </div>
          <span className="text-xs text-muted-foreground">© {currentYear} {organization.name}</span>
        </div>
        <div className="mt-3 sm:mt-4 text-center">
          <p className="text-xs text-muted-foreground/60">
            Powered by FamilyBridge
          </p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 border-t border-border">
      <div className="flex flex-col items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2">
          <img src={familyBridgeLogo} alt="FamilyBridge" className="h-4 sm:h-5 w-auto object-contain" />
          <span className="font-display font-semibold text-foreground text-sm sm:text-base">FamilyBridge</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
          <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          <Link to="/support" className="hover:text-foreground transition-colors">Support</Link>
        </div>
        <span className="text-xs text-muted-foreground">© {currentYear} FamilyBridge</span>
      </div>
    </footer>
  );
};
