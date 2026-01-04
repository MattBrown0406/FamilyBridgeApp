import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Users, LogOut, Loader2, ArrowRight, Home, Building2 } from 'lucide-react';
import familyBridgeLogo from '@/assets/familybridge-logo.png';
import { NotificationBell } from '@/components/NotificationBell';

interface AssignedFamily {
  id: string;
  name: string;
  description: string | null;
  member_count: number;
  organization_name: string;
}

interface OrganizationInfo {
  id: string;
  name: string;
  role: 'owner' | 'admin' | 'staff';
}

const ModeratorDashboard = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [assignedFamilies, setAssignedFamilies] = useState<AssignedFamily[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchModeratorData();
    }
  }, [user]);

  const fetchModeratorData = async () => {
    try {
      // Fetch organizations user is a member of
      const { data: orgMembers, error: orgError } = await supabase
        .from('organization_members')
        .select('organization_id, role, organizations(id, name)')
        .eq('user_id', user!.id);

      if (orgError) throw orgError;

      const orgs: OrganizationInfo[] = (orgMembers || []).map((om: any) => ({
        id: om.organizations.id,
        name: om.organizations.name,
        role: om.role,
      }));
      setOrganizations(orgs);

      // Fetch families where user is a moderator
      const { data: familyMembers, error: familyError } = await supabase
        .from('family_members')
        .select(`
          family_id,
          families (
            id,
            name,
            description,
            organization_id,
            organizations (
              name
            )
          )
        `)
        .eq('user_id', user!.id)
        .eq('role', 'moderator');

      if (familyError) throw familyError;

      // Get member counts for each family
      const familiesWithCounts = await Promise.all(
        (familyMembers || []).map(async (fm: any) => {
          const { count } = await supabase
            .from('family_members')
            .select('*', { count: 'exact', head: true })
            .eq('family_id', fm.family_id);

          return {
            id: fm.families.id,
            name: fm.families.name,
            description: fm.families.description,
            member_count: count || 0,
            organization_name: fm.families.organizations?.name || 'Independent',
          };
        })
      );

      setAssignedFamilies(familiesWithCounts);
    } catch (error) {
      console.error('Error fetching moderator data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your assigned family groups.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                <img src={familyBridgeLogo} alt="FamilyBridge" className="h-7 w-auto object-contain" />
                <span className="text-xl font-display font-semibold text-foreground">FamilyBridge</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Home</span>
              </Button>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="text-sm text-muted-foreground hidden sm:block">
                {user?.email}
              </span>
              <NotificationBell />
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">
              Moderator Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage your assigned family groups and support networks.
            </p>
          </div>

          {/* Organizations Summary */}
          {organizations.length > 0 && (
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {organizations.map((org) => (
                  <span 
                    key={org.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
                  >
                    <Building2 className="h-3.5 w-3.5" />
                    {org.name}
                    <span className="text-xs opacity-70">({org.role})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Assigned Family Groups */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Your Assigned Family Groups
              </CardTitle>
              <CardDescription>
                Family groups you are moderating ({assignedFamilies.length} total)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assignedFamilies.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No Family Groups Assigned
                  </h3>
                  <p className="text-muted-foreground">
                    You haven't been assigned to any family groups yet. Contact your organization admin.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {assignedFamilies.map((family) => (
                    <div
                      key={family.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/family/${family.id}`)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{family.name}</h3>
                          {family.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {family.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {family.member_count} member{family.member_count !== 1 ? 's' : ''}
                            </span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-primary">
                              {family.organization_name}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-4">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              View Personal Dashboard
            </Button>
            {organizations.some(o => o.role === 'owner' || o.role === 'admin') && (
              <Button variant="outline" onClick={() => navigate('/provider-admin')}>
                Provider Admin Panel
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ModeratorDashboard;
