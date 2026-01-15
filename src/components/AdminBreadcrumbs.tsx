import { useLocation, Link } from 'react-router-dom';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { useProviderAdmin } from '@/hooks/useProviderAdmin';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Shield, Building2, Users, Home } from 'lucide-react';

interface BreadcrumbSegment {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

export const AdminBreadcrumbs = () => {
  const location = useLocation();
  const { isAdmin: isSuperAdmin, isVerifying: superAdminVerifying } = useSuperAdmin();
  const { isProvider, isLoading: providerLoading } = useProviderAdmin();
  const [familyName, setFamilyName] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);

  // Extract IDs from path
  const pathParts = location.pathname.split('/').filter(Boolean);
  const familyId = pathParts[0] === 'family' ? pathParts[1] : null;

  // Fetch family name if on a family page
  useEffect(() => {
    if (familyId) {
      const fetchFamilyName = async () => {
        const { data } = await supabase
          .from('families')
          .select('name')
          .eq('id', familyId)
          .single();
        if (data) setFamilyName(data.name);
      };
      fetchFamilyName();
    } else {
      setFamilyName(null);
    }
  }, [familyId]);

  // Don't show if still loading or not an admin
  if (superAdminVerifying || providerLoading) return null;
  if (!isSuperAdmin && !isProvider) return null;

  // Build breadcrumb segments based on current route and admin type
  const segments: BreadcrumbSegment[] = [];

  // Root segment - primary dashboard
  if (isSuperAdmin) {
    segments.push({
      label: 'Super Admin',
      href: '/super-admin',
      icon: <Shield className="h-3.5 w-3.5" />,
    });
  } else if (isProvider) {
    segments.push({
      label: 'Provider Dashboard',
      href: '/provider-admin',
      icon: <Building2 className="h-3.5 w-3.5" />,
    });
  }

  // Add intermediate segments based on current path
  const currentPath = location.pathname;

  if (currentPath === '/super-admin' || currentPath === '/provider-admin') {
    // Already at primary dashboard, no additional segments needed
    return null;
  }

  if (currentPath === '/dashboard') {
    segments.push({
      label: 'Family Dashboard',
      icon: <Home className="h-3.5 w-3.5" />,
    });
  } else if (currentPath === '/moderator-dashboard') {
    segments.push({
      label: 'Moderator Dashboard',
      icon: <Users className="h-3.5 w-3.5" />,
    });
  } else if (familyId && familyName) {
    segments.push({
      label: familyName,
      icon: <Users className="h-3.5 w-3.5" />,
    });
  } else if (currentPath.startsWith('/family/') && !familyName) {
    segments.push({
      label: 'Family',
      icon: <Users className="h-3.5 w-3.5" />,
    });
  }

  // Don't render if only one segment (we're at the primary dashboard)
  if (segments.length <= 1) return null;

  return (
    <div className="bg-muted/50 border-b px-4 py-2">
      <div className="container mx-auto">
        <Breadcrumb>
          <BreadcrumbList>
            {segments.map((segment, index) => {
              const isLast = index === segments.length - 1;

              return (
                <BreadcrumbItem key={index}>
                  {index > 0 && <BreadcrumbSeparator />}
                  {isLast ? (
                    <BreadcrumbPage className="flex items-center gap-1.5">
                      {segment.icon}
                      {segment.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link 
                        to={segment.href || '#'} 
                        className="flex items-center gap-1.5 hover:text-primary"
                      >
                        {segment.icon}
                        {segment.label}
                      </Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </div>
  );
};
