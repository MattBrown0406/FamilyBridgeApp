import { Link } from 'react-router-dom';
import { useOrganization } from '@/hooks/useOrganization';
import familyBridgeLogo from '@/assets/familybridge-logo.png';

export const BrandedFooter = () => {
  const { organization, isWhiteLabeled } = useOrganization();
  const currentYear = new Date().getFullYear();

  if (isWhiteLabeled && organization) {
    return (
      <footer className="container mx-auto px-4 py-8 border-t border-border">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {organization.logo_url ? (
              <img 
                src={organization.logo_url} 
                alt={organization.name} 
                className="h-5 w-auto object-contain"
              />
            ) : (
              <img src={familyBridgeLogo} alt="FamilyBridge" className="h-5 w-auto object-contain" />
            )}
            <span className="font-display font-semibold text-foreground">
              {organization.name}
            </span>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-sm text-muted-foreground">
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <span>© {currentYear} {organization.name}</span>
          </div>
        </div>
        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground/60">
            Powered by FamilyBridge
          </p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="container mx-auto px-4 py-8 border-t border-border">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <img src={familyBridgeLogo} alt="FamilyBridge" className="h-5 w-auto object-contain" />
          <span className="font-display font-semibold text-foreground">FamilyBridge</span>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-sm text-muted-foreground">
          <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          <Link to="/support" className="hover:text-foreground transition-colors">Support</Link>
          <span>© {currentYear} FamilyBridge</span>
        </div>
      </div>
    </footer>
  );
};
