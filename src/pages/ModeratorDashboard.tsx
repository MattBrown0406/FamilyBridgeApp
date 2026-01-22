import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { useFamilyArchive } from '@/hooks/useFamilyArchive';
import { useOrganizationBranding } from '@/hooks/useOrganizationBranding';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Users, LogOut, Loader2, ArrowRight, Home, Building2, Shield, Plus, Copy, Archive, HelpCircle } from 'lucide-react';
import familyBridgeLogo from '@/assets/familybridge-logo.png';
import { NotificationBell } from '@/components/NotificationBell';
import { AdminBreadcrumbs } from '@/components/AdminBreadcrumbs';
import { FamilyHealthBadge } from '@/components/FamilyHealthBadge';
import { BroadcastMessage } from '@/components/BroadcastMessage';

type HealthStatus = 'crisis' | 'concern' | 'tension' | 'stable' | 'improving';

// Color coding for family cards based on health status
const getHealthBorderColor = (status: HealthStatus | null): string => {
  if (!status) return 'border-l-muted';
  switch (status) {
    case 'crisis':
      return 'border-l-red-500';
    case 'concern':
      return 'border-l-orange-500';
    case 'tension':
      return 'border-l-amber-500';
    case 'stable':
      return 'border-l-green-500';
    case 'improving':
      return 'border-l-green-400';
    default:
      return 'border-l-muted';
  }
};

const getHealthBgColor = (status: HealthStatus | null): string => {
  if (!status) return '';
  switch (status) {
    case 'crisis':
      return 'bg-red-50/50';
    case 'concern':
      return 'bg-orange-50/50';
    case 'tension':
      return 'bg-amber-50/50';
    case 'stable':
      return 'bg-green-50/30';
    case 'improving':
      return 'bg-green-50/30';
    default:
      return '';
  }
};

interface AssignedFamily {
  id: string;
  name: string;
  description: string | null;
  member_count: number;
  organization_name: string;
  invite_code: string | null;
  health_status: HealthStatus | null;
}

interface OrganizationInfo {
  id: string;
  name: string;
  role: 'owner' | 'admin' | 'staff';
}

const ModeratorDashboard = () => {
  const { user, signOut, loading } = useAuth();
  const { isAdmin: isSuperAdmin } = useSuperAdmin();
  const { archiveFamily, isArchiving } = useFamilyArchive();
  const { branding, applyBranding, resetBranding } = useOrganizationBranding();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [assignedFamilies, setAssignedFamilies] = useState<AssignedFamily[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [newFamilyDescription, setNewFamilyDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [archivingFamilyId, setArchivingFamilyId] = useState<string | null>(null);

  // Apply organization branding when loaded
  useEffect(() => {
    if (branding) {
      applyBranding();
    }
    return () => {
      resetBranding();
    };
  }, [branding, applyBranding, resetBranding]);

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Copied!',
      description: 'Invite code copied to clipboard.',
    });
  };

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

      // Fetch families where user is a moderator (excluding archived)
      const { data: familyMembers, error: familyError } = await supabase
        .from('family_members')
        .select(`
          family_id,
          families!inner (
            id,
            name,
            description,
            organization_id,
            is_archived,
            organizations (
              name
            )
          )
        `)
        .eq('user_id', user!.id)
        .eq('role', 'moderator')
        .eq('families.is_archived', false);

      if (familyError) throw familyError;

      // Get member counts, invite codes, and health status for each family
      const familiesWithCounts = await Promise.all(
        (familyMembers || []).map(async (fm: any) => {
          const [countResult, codeResult, healthResult] = await Promise.all([
            supabase
              .from('family_members')
              .select('*', { count: 'exact', head: true })
              .eq('family_id', fm.family_id),
            supabase.rpc('get_family_invite_code', { _family_id: fm.family_id }),
            supabase
              .from('family_health_status')
              .select('status')
              .eq('family_id', fm.family_id)
              .maybeSingle()
          ]);

          return {
            id: fm.families.id,
            name: fm.families.name,
            description: fm.families.description,
            member_count: countResult.count || 0,
            organization_name: fm.families.organizations?.name || 'Independent',
            invite_code: codeResult.data || null,
            health_status: (healthResult.data?.status as HealthStatus) || null,
          };
        })
      );

      // Sort families by health status priority: crisis first, then concern, tension, stable, improving
      const statusPriority: Record<HealthStatus | 'null', number> = {
        crisis: 0,
        concern: 1,
        tension: 2,
        stable: 3,
        improving: 4,
        null: 5,
      };

      familiesWithCounts.sort((a, b) => {
        const priorityA = statusPriority[a.health_status || 'null'];
        const priorityB = statusPriority[b.health_status || 'null'];
        return priorityA - priorityB;
      });

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

  const handleCreateFamily = async () => {
    if (!user) {
      toast({
        title: 'Not signed in',
        description: 'Please sign in again to create a family group.',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    if (!newFamilyName.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a name for your family group.',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    try {
      // Auto-assign to moderator's organization if they belong to one
      const organizationId = organizations.length > 0 ? organizations[0].id : null;
      
      const { data, error } = await supabase.functions.invoke('create-family', {
        body: {
          name: newFamilyName.trim(),
          description: newFamilyDescription.trim() || null,
          organization_id: organizationId,
        },
      });

      if (error) throw error;

      const family = (data as any)?.family;
      if (!family?.id) {
        throw new Error('Failed to create family');
      }

      toast({
        title: 'Family created!',
        description: `${newFamilyName} has been created successfully.`,
      });

      setShowCreateDialog(false);
      setNewFamilyName('');
      setNewFamilyDescription('');
      fetchModeratorData();
    } catch (error: any) {
      console.error('Error creating family:', error);
      toast({
        title: 'Error',
        description: 'Failed to create family group. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleArchiveFamily = async (familyId: string, familyName: string) => {
    setArchivingFamilyId(familyId);
    const success = await archiveFamily(familyId, familyName);
    if (success) {
      fetchModeratorData();
    }
    setArchivingFamilyId(null);
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
      {/* Admin Breadcrumbs for super admins and provider admins */}
      <AdminBreadcrumbs />
      {/* Header */}
      <header className="border-b border-border bg-primary text-primary-foreground">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-1.5 sm:gap-2 cursor-pointer" onClick={() => navigate('/')}>
                <img 
                  src={branding?.logo_url || familyBridgeLogo} 
                  alt={branding?.name || "FamilyBridge"} 
                  className="h-6 sm:h-7 w-auto object-contain" 
                />
                <span className="text-lg sm:text-xl font-display font-semibold hidden xs:inline">
                  {branding?.name || "FamilyBridge"}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="text-primary-foreground hover:bg-primary-foreground/10">
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Home</span>
              </Button>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              {organizations.some(o => o.role === 'owner' || o.role === 'admin') && (
                <Button variant="ghost" size="sm" onClick={() => navigate('/provider-admin')} className="text-primary-foreground hover:bg-primary-foreground/10">
                  <Building2 className="h-4 w-4" />
                  <span className="hidden sm:inline ml-2">Provider Admin</span>
                </Button>
              )}
              {isSuperAdmin && (
                <Button variant="ghost" size="sm" onClick={() => navigate('/super-admin')} className="text-primary-foreground hover:bg-primary-foreground/10">
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline ml-2">Super Admin</span>
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  const org = organizations[0];
                  const params = new URLSearchParams({ type: 'moderator' });
                  if (org?.name) params.set('org', org.name);
                  if (org?.id) params.set('orgId', org.id);
                  navigate(`/support?${params.toString()}`);
                }}
                className="text-primary-foreground hover:bg-primary-foreground/10"
              >
                <HelpCircle className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Support</span>
              </Button>
              <NotificationBell />
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-primary-foreground hover:bg-primary-foreground/10">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-1 sm:mb-2">
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

          {/* Action Buttons */}
          <div className="mb-6 flex flex-wrap gap-3">
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="h-5 w-5" />
                  Create Family Group
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-display">Create Family Group</DialogTitle>
                  <DialogDescription>
                    Start a new family group and invite members to join.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="familyName">Family Name</Label>
                    <Input
                      id="familyName"
                      placeholder="e.g., The Smith Family"
                      value={newFamilyName}
                      onChange={(e) => setNewFamilyName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="familyDescription">Description (optional)</Label>
                    <Input
                      id="familyDescription"
                      placeholder="A brief description of your group"
                      value={newFamilyDescription}
                      onChange={(e) => setNewFamilyDescription(e.target.value)}
                    />
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={handleCreateFamily}
                    disabled={isCreating}
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Group'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Broadcast Message Button - show if user has at least one org */}
            {organizations.length > 0 && (
              <BroadcastMessage 
                organizationId={organizations[0].id} 
                organizationName={organizations[0].name} 
              />
            )}
          </div>

          {/* Assigned Family Groups */}
          <Card className="mb-6 border-primary/20">
            <CardHeader className="bg-primary/5 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-primary">
                <Users className="h-5 w-5" />
                Your Assigned Family Groups
              </CardTitle>
              <CardDescription>
                Family groups you are moderating ({assignedFamilies.length} total) - sorted by priority
              </CardDescription>
              {/* Legend */}
              <div className="flex flex-wrap gap-3 mt-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-muted-foreground">Critical</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span className="text-muted-foreground">Concern</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-muted-foreground">Tension</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-muted-foreground">Stable</span>
                </div>
              </div>
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
                      className={`flex items-center justify-between p-4 rounded-lg border border-l-4 ${getHealthBorderColor(family.health_status)} ${getHealthBgColor(family.health_status)} bg-card hover:shadow-md transition-shadow`}
                    >
                      <div 
                        className="flex items-center gap-4 flex-1 cursor-pointer"
                        onClick={() => navigate(`/family/${family.id}`)}
                      >
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-foreground">{family.name}</h3>
                            <FamilyHealthBadge familyId={family.id} />
                          </div>
                          {family.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {family.description}
                            </p>
                          )}
                          <div className="flex items-center flex-wrap gap-3 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {family.member_count} member{family.member_count !== 1 ? 's' : ''}
                            </span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-primary">
                              {family.organization_name}
                            </span>
                            {family.invite_code && (
                              <>
                                <span className="text-xs text-muted-foreground">•</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyInviteCode(family.invite_code!);
                                  }}
                                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                                >
                                  <Copy className="h-3 w-3" />
                                  {family.invite_code}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                              disabled={isArchiving && archivingFamilyId === family.id}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              {isArchiving && archivingFamilyId === family.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Archive className="h-4 w-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Archive Family Group?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will archive "{family.name}". The family will no longer appear in active lists, 
                                but can be reactivated by a provider admin or super admin.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleArchiveFamily(family.id, family.name)}>
                                Archive
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigate(`/family/${family.id}`)}
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
};

export default ModeratorDashboard;
