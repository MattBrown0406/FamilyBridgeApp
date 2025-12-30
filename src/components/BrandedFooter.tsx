import { Heart } from 'lucide-react';
import { useOrganization } from '@/hooks/useOrganization';

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
              <Heart className="h-5 w-5 text-primary" />
            )}
            <span className="font-display font-semibold text-foreground">
              {organization.name}
            </span>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-sm text-muted-foreground">
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
          <Heart className="h-5 w-5 text-primary" />
          <span className="font-display font-semibold text-foreground">FamilyBridge</span>
        </div>
        <p className="text-muted-foreground text-sm">
          © {currentYear} FamilyBridge. Supporting families on the path to recovery.
        </p>
      </div>
    </footer>
  );
};
