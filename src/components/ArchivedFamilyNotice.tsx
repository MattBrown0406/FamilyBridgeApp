import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFamilyArchive } from '@/hooks/useFamilyArchive';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Archive, RotateCcw, Users, Loader2, Bell, CheckCircle, AlertTriangle, Building2 } from 'lucide-react';
import { format } from 'date-fns';

interface ArchivedFamily {
  id: string;
  name: string;
  archived_at: string | null;
  organization_id: string | null;
  organization_name: string | null;
  user_role: string;
  has_pending_request: boolean;
}

interface ReactivationRequest {
  id: string;
  family_id: string;
  family_name: string;
  requested_by: string;
  requester_name: string;
  requested_at: string;
}

export const ArchivedFamilyNotice = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { requestReactivation, reactivateFamilyAsIndependent, isRequesting, isReactivating } = useFamilyArchive();
  
  const [archivedFamilies, setArchivedFamilies] = useState<ArchivedFamily[]>([]);
  const [pendingRequests, setPendingRequests] = useState<ReactivationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchArchivedFamilies();
    }
  }, [user]);

  const fetchArchivedFamilies = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Fetch user's family memberships where family is archived
      const { data: memberships, error: memberError } = await supabase
        .from('family_members')
        .select(`
          family_id,
          role,
          families!inner (
            id,
            name,
            archived_at,
            organization_id,
            is_archived,
            organizations (name)
          )
        `)
        .eq('user_id', user.id)
        .eq('families.is_archived', true);

      if (memberError) throw memberError;

      // Check for pending reactivation requests for each family
      const familiesWithRequestStatus = await Promise.all(
        (memberships || []).map(async (m: any) => {
          const { data: requests } = await supabase
            .from('family_reactivation_requests')
            .select('id')
            .eq('family_id', m.family_id)
            .eq('status', 'pending')
            .limit(1);

          return {
            id: m.families.id,
            name: m.families.name,
            archived_at: m.families.archived_at,
            organization_id: m.families.organization_id,
            organization_name: m.families.organizations?.name || null,
            user_role: m.role,
            has_pending_request: (requests?.length || 0) > 0,
          };
        })
      );

      setArchivedFamilies(familiesWithRequestStatus);

      // If user is admin/moderator, fetch pending reactivation requests
      const adminFamilies = familiesWithRequestStatus.filter(
        f => f.user_role === 'admin' || f.user_role === 'moderator'
      );

      if (adminFamilies.length > 0) {
        const { data: requests, error: reqError } = await supabase
          .from('family_reactivation_requests')
          .select('*')
          .in('family_id', adminFamilies.map(f => f.id))
          .eq('status', 'pending');

        if (!reqError && requests) {
          // Fetch requester profiles
          const requesterIds = [...new Set(requests.map(r => r.requested_by))];
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', requesterIds);

          const profileMap = (profiles || []).reduce((acc, p) => {
            acc[p.id] = p.full_name;
            return acc;
          }, {} as Record<string, string>);

          const requestsWithNames = requests.map(r => ({
            id: r.id,
            family_id: r.family_id,
            family_name: adminFamilies.find(f => f.id === r.family_id)?.name || 'Unknown',
            requested_by: r.requested_by,
            requester_name: profileMap[r.requested_by] || 'Unknown',
            requested_at: r.requested_at,
          }));

          setPendingRequests(requestsWithNames);
        }
      }
    } catch (error) {
      console.error('Error fetching archived families:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestReactivation = async (familyId: string) => {
    const success = await requestReactivation(familyId);
    if (success) {
      fetchArchivedFamilies();
    }
  };

  const handleReactivateAsIndependent = async (familyId: string, familyName: string) => {
    const success = await reactivateFamilyAsIndependent(familyId, familyName);
    if (success) {
      fetchArchivedFamilies();
      // Navigate to dashboard after reactivation
      navigate('/dashboard');
    }
  };

  if (isLoading) {
    return null; // Don't show loading state, just wait
  }

  if (archivedFamilies.length === 0) {
    return null; // No archived families, don't show anything
  }

  const isAdminOrModerator = archivedFamilies.some(
    f => f.user_role === 'admin' || f.user_role === 'moderator'
  );

  return (
    <div className="space-y-4">
      {/* Archived Family Notice */}
      {archivedFamilies.map((family) => (
        <Card key={family.id} className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <Archive className="h-5 w-5" />
              Family Archived
            </CardTitle>
            <CardDescription className="text-amber-600 dark:text-amber-500">
              {family.name} has been archived
              {family.organization_name && (
                <span className="flex items-center gap-1 mt-1">
                  <Building2 className="h-3 w-3" />
                  by {family.organization_name}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {family.archived_at && (
              <p className="text-sm text-muted-foreground">
                Archived on {format(new Date(family.archived_at), 'MMMM d, yyyy')}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="capitalize">
                Your role: {family.user_role}
              </Badge>
              {family.has_pending_request && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  <Bell className="h-3 w-3 mr-1" />
                  Reactivation Requested
                </Badge>
              )}
            </div>

            {/* Actions based on role */}
            {(family.user_role === 'admin' || family.user_role === 'moderator') ? (
              // Admin/Moderator can reactivate as independent (requires purchase)
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  As a family admin, you can reactivate this family as an independent group 
                  (no longer associated with {family.organization_name || 'the provider'}).
                  A subscription purchase is required to continue.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="default"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reactivate as Independent
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reactivate as Independent Family?</AlertDialogTitle>
                      <AlertDialogDescription>
                        To reactivate "{family.name}" as an independent family group, 
                        you'll need to purchase a family subscription.
                        <br /><br />
                        <strong>Note:</strong> If you want to remain with {family.organization_name || 'the provider'}, 
                        please contact them to reactivate your family at no additional cost.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => navigate(`/family-purchase?reactivate=${family.id}`)}
                      >
                        Continue to Purchase
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ) : (
              // Regular members can request reactivation
              <div className="space-y-3">
                {family.has_pending_request ? (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <CheckCircle className="h-4 w-4" />
                    A reactivation request has been sent to your family admin.
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Request your family admin to reactivate this family group.
                    </p>
                    <Button 
                      variant="outline"
                      onClick={() => handleRequestReactivation(family.id)}
                      disabled={isRequesting}
                    >
                      {isRequesting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Bell className="h-4 w-4 mr-2" />
                      )}
                      Request Reactivation
                    </Button>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Pending Reactivation Requests (for admins/moderators) */}
      {isAdminOrModerator && pendingRequests.length > 0 && (
        <Card className="border-blue-500/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
              <Bell className="h-5 w-5" />
              Pending Reactivation Requests
            </CardTitle>
            <CardDescription>
              Family members have requested to reactivate the family
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <div 
                  key={request.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{request.requester_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Requested on {format(new Date(request.requested_at), 'MMM d, yyyy')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Family: {request.family_name}
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" disabled={isReactivating}>
                        {isReactivating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Approve & Reactivate'
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Approve Reactivation Request?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will reactivate "{request.family_name}" as an independent family group.
                          The family will no longer be associated with the original provider.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleReactivateAsIndependent(request.family_id, request.family_name)}
                        >
                          Approve & Reactivate
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
