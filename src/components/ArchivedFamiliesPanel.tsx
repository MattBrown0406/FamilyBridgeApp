import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fetchProfilesByIds } from '@/lib/profileApi';
import { useFamilyArchive } from '@/hooks/useFamilyArchive';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Archive, RotateCcw, Users, Building2, Calendar, Loader2, Bell } from 'lucide-react';
import { format } from 'date-fns';

interface ArchivedFamily {
  id: string;
  name: string;
  description: string | null;
  account_number: string;
  archived_at: string | null;
  archived_by: string | null;
  organization_id: string | null;
  organizations?: { name: string } | null;
  archiver_profile?: { full_name: string } | null;
  pending_requests_count: number;
}

interface ArchivedFamiliesPanelProps {
  organizationId?: string; // If provided, filter by org
  onReactivate?: () => void; // Callback after reactivation
}

export const ArchivedFamiliesPanel = ({ organizationId, onReactivate }: ArchivedFamiliesPanelProps) => {
  const [archivedFamilies, setArchivedFamilies] = useState<ArchivedFamily[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { reactivateFamily, isReactivating } = useFamilyArchive();
  const [reactivatingId, setReactivatingId] = useState<string | null>(null);

  const fetchArchivedFamilies = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('families')
        .select(`
          id,
          name,
          description,
          account_number,
          archived_at,
          archived_by,
          organization_id,
          organizations (name)
        `)
        .eq('is_archived', true)
        .order('archived_at', { ascending: false });

      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch archiver profiles and pending request counts
      const archiverIds = [...new Set((data || []).filter(f => f.archived_by).map(f => f.archived_by))];
      let archiverProfiles: Record<string, string> = {};

      if (archiverIds.length > 0) {
        const profiles = await fetchProfilesByIds(archiverIds);

        archiverProfiles = (profiles || []).reduce((acc, p) => {
          acc[p.id] = p.full_name;
          return acc;
        }, {} as Record<string, string>);
      }

      // Get pending request counts for each family
      const familyIds = (data || []).map(f => f.id);
      let requestCounts: Record<string, number> = {};
      
      if (familyIds.length > 0) {
        const { data: requests } = await supabase
          .from('family_reactivation_requests')
          .select('family_id')
          .in('family_id', familyIds)
          .eq('status', 'pending');

        requestCounts = (requests || []).reduce((acc, r) => {
          acc[r.family_id] = (acc[r.family_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
      }

      const familiesWithArchivers = (data || []).map(family => ({
        ...family,
        archiver_profile: family.archived_by ? { full_name: archiverProfiles[family.archived_by] || 'Unknown' } : null,
        pending_requests_count: requestCounts[family.id] || 0,
      }));

      setArchivedFamilies(familiesWithArchivers);
    } catch (error) {
      console.error('Error fetching archived families:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArchivedFamilies();
  }, [organizationId]);

  const handleReactivate = async (family: ArchivedFamily) => {
    setReactivatingId(family.id);
    
    // Provider admin reactivation - keeps organization association
    const success = await reactivateFamily(family.id, family.name);
    
    if (success) {
      // Also update any pending requests to approved with provider_admin type
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('family_reactivation_requests')
          .update({
            status: 'approved',
            approved_by: user.id,
            approved_at: new Date().toISOString(),
            reactivation_type: 'provider_admin',
          })
          .eq('family_id', family.id)
          .eq('status', 'pending');
      }
      
      fetchArchivedFamilies();
      onReactivate?.();
    }
    
    setReactivatingId(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Archived Families
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Archive className="h-5 w-5" />
          Archived Families
        </CardTitle>
        <CardDescription>
          {archivedFamilies.length} archived family group{archivedFamilies.length !== 1 ? 's' : ''}
          {organizationId && ' in your organization'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {archivedFamilies.length === 0 ? (
          <div className="text-center py-8">
            <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No archived families</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {archivedFamilies.map((family) => (
                <div
                  key={family.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-muted/30"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <Users className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-foreground truncate">{family.name}</h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {family.account_number}
                        </Badge>
                        {family.organizations?.name && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Building2 className="h-3 w-3" />
                            {family.organizations.name}
                          </span>
                        )}
                        {family.pending_requests_count > 0 && (
                          <Badge variant="default" className="text-xs bg-blue-500">
                            <Bell className="h-3 w-3 mr-1" />
                            {family.pending_requests_count} request{family.pending_requests_count > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                      {family.archived_at && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Calendar className="h-3 w-3" />
                          Archived {format(new Date(family.archived_at), 'MMM d, yyyy')}
                          {family.archiver_profile && (
                            <span> by {family.archiver_profile.full_name}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={isReactivating && reactivatingId === family.id}
                      >
                        {isReactivating && reactivatingId === family.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Reactivate
                          </>
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reactivate Family Group?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will restore "{family.name}" to active status within your organization. 
                          All members and data will become accessible again.
                          {family.pending_requests_count > 0 && (
                            <span className="block mt-2 text-blue-600">
                              Note: {family.pending_requests_count} member{family.pending_requests_count > 1 ? 's have' : ' has'} requested reactivation.
                            </span>
                          )}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleReactivate(family)}>
                          Reactivate
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
