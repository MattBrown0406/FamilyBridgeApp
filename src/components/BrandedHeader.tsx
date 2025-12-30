import { Heart } from 'lucide-react';
import { useOrganization } from '@/hooks/useOrganization';

interface BrandedHeaderProps {
  className?: string;
}

export const BrandedHeader = ({ className = '' }: BrandedHeaderProps) => {
  const { organization, isWhiteLabeled } = useOrganization();

  if (isWhiteLabeled && organization) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {organization.logo_url ? (
          <img 
            src={organization.logo_url} 
            alt={organization.name} 
            className="h-8 w-auto object-contain"
          />
        ) : (
          <Heart className="h-7 w-7 text-primary" />
        )}
        <span className="text-lg font-display font-semibold text-foreground">
          {organization.name}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Heart className="h-7 w-7 text-primary" />
      <span className="text-lg font-display font-semibold text-foreground">
        FamilyBridge
      </span>
    </div>
  );
};
