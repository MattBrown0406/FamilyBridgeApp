import { useNavigate } from 'react-router-dom';
import { useOrganization } from '@/hooks/useOrganization';
import familyBridgeLogo from '@/assets/familybridge-logo.png';
import { Home, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFamilyMemberJourney } from '@/hooks/useSobrietyJourney';

interface BrandedHeaderProps {
  className?: string;
  showHomeButton?: boolean;
  familyId?: string;
}

const SobrietyBadge = ({ familyId }: { familyId: string }) => {
  const { journey, daysCount, loading } = useFamilyMemberJourney(familyId);

  if (loading || !journey) return null;

  return (
    <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-primary/10 rounded-full border border-primary/20">
      <Flame className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
      <span className="font-bold text-primary text-sm sm:text-base">{daysCount}</span>
      <span className="text-[10px] sm:text-xs text-muted-foreground hidden xs:inline">days sober</span>
    </div>
  );
};

export const BrandedHeader = ({ className = '', showHomeButton = true, familyId }: BrandedHeaderProps) => {
  const navigate = useNavigate();
  const { organization, isWhiteLabeled } = useOrganization();

  const handleHomeClick = () => {
    navigate('/');
  };

  if (isWhiteLabeled && organization) {
    return (
      <header className={`border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50 ${className}`}>
        <div className="container mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between">
          <div 
            className="flex items-center gap-1.5 sm:gap-2 cursor-pointer" 
            onClick={handleHomeClick}
          >
            {organization.logo_url ? (
              <img 
                src={organization.logo_url} 
                alt={organization.name} 
                className="h-7 sm:h-8 w-auto object-contain"
              />
            ) : (
              <img 
                src={familyBridgeLogo} 
                alt="FamilyBridge" 
                className="h-7 sm:h-8 w-auto object-contain"
              />
            )}
            <span className="text-base sm:text-lg font-display font-semibold text-foreground truncate max-w-[150px] sm:max-w-none">
              {organization.name}
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {familyId && <SobrietyBadge familyId={familyId} />}
            {showHomeButton && (
              <Button variant="ghost" size="sm" onClick={handleHomeClick} className="h-8 px-2 sm:px-3">
                <Home className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Home</span>
              </Button>
            )}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className={`border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50 ${className}`}>
      <div className="container mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between">
        <div 
          className="flex items-center gap-1.5 sm:gap-2 cursor-pointer" 
          onClick={handleHomeClick}
        >
          <img 
            src={familyBridgeLogo} 
            alt="FamilyBridge" 
            className="h-7 sm:h-8 w-auto object-contain"
          />
          <span className="text-base sm:text-lg font-display font-semibold text-foreground">
            FamilyBridge
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {familyId && <SobrietyBadge familyId={familyId} />}
          {showHomeButton && (
            <Button variant="ghost" size="sm" onClick={handleHomeClick} className="h-8 px-2 sm:px-3">
              <Home className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Home</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
