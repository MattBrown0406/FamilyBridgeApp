import { useNavigate } from 'react-router-dom';
import { useOrganization } from '@/hooks/useOrganization';
import familyBridgeLogo from '@/assets/familybridge-logo.png';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BrandedHeaderProps {
  className?: string;
  showHomeButton?: boolean;
}

export const BrandedHeader = ({ className = '', showHomeButton = true }: BrandedHeaderProps) => {
  const navigate = useNavigate();
  const { organization, isWhiteLabeled } = useOrganization();

  const handleHomeClick = () => {
    navigate('/');
  };

  if (isWhiteLabeled && organization) {
    return (
      <header className={`border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50 ${className}`}>
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={handleHomeClick}
          >
            {organization.logo_url ? (
              <img 
                src={organization.logo_url} 
                alt={organization.name} 
                className="h-8 w-auto object-contain"
              />
            ) : (
              <img 
                src={familyBridgeLogo} 
                alt="FamilyBridge" 
                className="h-8 w-auto object-contain"
              />
            )}
            <span className="text-lg font-display font-semibold text-foreground">
              {organization.name}
            </span>
          </div>
          {showHomeButton && (
            <Button variant="ghost" size="sm" onClick={handleHomeClick}>
              <Home className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Home</span>
            </Button>
          )}
        </div>
      </header>
    );
  }

  return (
    <header className={`border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50 ${className}`}>
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div 
          className="flex items-center gap-2 cursor-pointer" 
          onClick={handleHomeClick}
        >
          <img 
            src={familyBridgeLogo} 
            alt="FamilyBridge" 
            className="h-8 w-auto object-contain"
          />
          <span className="text-lg font-display font-semibold text-foreground">
            FamilyBridge
          </span>
        </div>
        {showHomeButton && (
          <Button variant="ghost" size="sm" onClick={handleHomeClick}>
            <Home className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Home</span>
          </Button>
        )}
      </div>
    </header>
  );
};
