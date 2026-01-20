import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useFamilyArchive = () => {
  const { toast } = useToast();
  const [isArchiving, setIsArchiving] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  const archiveFamily = async (familyId: string, familyName: string) => {
    setIsArchiving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if this family belongs to an organization (provider-managed)
      const { data: family } = await supabase
        .from('families')
        .select('organization_id')
        .eq('id', familyId)
        .single();

      const isProviderManaged = family?.organization_id !== null;

      const { error } = await supabase
        .from('families')
        .update({
          is_archived: true,
          archived_at: new Date().toISOString(),
          archived_by: user.id,
        })
        .eq('id', familyId);

      if (error) throw error;

      // Send archive notification email if this was a provider-managed family
      if (isProviderManaged) {
        try {
          await supabase.functions.invoke('send-archive-notification', {
            body: { familyId, familyName },
          });
        } catch (emailError) {
          console.error('Error sending archive notification:', emailError);
          // Don't fail the archive operation if email fails
        }
      }

      toast({
        title: 'Family Archived',
        description: `${familyName} has been archived successfully.`,
      });

      return true;
    } catch (error: any) {
      console.error('Error archiving family:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to archive family',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsArchiving(false);
    }
  };

  // Provider admin reactivation - keeps organization association
  const reactivateFamily = async (familyId: string, familyName: string) => {
    setIsReactivating(true);
    try {
      const { error } = await supabase
        .from('families')
        .update({
          is_archived: false,
          archived_at: null,
          archived_by: null,
        })
        .eq('id', familyId);

      if (error) throw error;

      toast({
        title: 'Family Reactivated',
        description: `${familyName} has been reactivated successfully.`,
      });

      return true;
    } catch (error: any) {
      console.error('Error reactivating family:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to reactivate family',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsReactivating(false);
    }
  };

  // Family admin reactivation - removes organization association (becomes independent)
  const reactivateFamilyAsIndependent = async (familyId: string, familyName: string) => {
    setIsReactivating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update family to be independent (remove org) and unarchive
      const { error: familyError } = await supabase
        .from('families')
        .update({
          is_archived: false,
          archived_at: null,
          archived_by: null,
          organization_id: null, // Remove provider association
        })
        .eq('id', familyId);

      if (familyError) throw familyError;

      // Update any pending reactivation requests to approved
      await supabase
        .from('family_reactivation_requests')
        .update({
          status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          reactivation_type: 'family_admin',
        })
        .eq('family_id', familyId)
        .eq('status', 'pending');

      toast({
        title: 'Family Reactivated as Independent',
        description: `${familyName} has been reactivated as an independent family group.`,
      });

      return true;
    } catch (error: any) {
      console.error('Error reactivating family as independent:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to reactivate family',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsReactivating(false);
    }
  };

  // Request reactivation (for regular family members)
  const requestReactivation = async (familyId: string) => {
    setIsRequesting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if there's already a pending request
      const { data: existing } = await supabase
        .from('family_reactivation_requests')
        .select('id')
        .eq('family_id', familyId)
        .eq('status', 'pending')
        .single();

      if (existing) {
        toast({
          title: 'Request Already Pending',
          description: 'A reactivation request is already pending for this family.',
        });
        return true;
      }

      const { error } = await supabase
        .from('family_reactivation_requests')
        .insert({
          family_id: familyId,
          requested_by: user.id,
        });

      if (error) throw error;

      toast({
        title: 'Reactivation Requested',
        description: 'Your request has been sent to the family admin.',
      });

      return true;
    } catch (error: any) {
      console.error('Error requesting reactivation:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to request reactivation',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsRequesting(false);
    }
  };

  return {
    archiveFamily,
    reactivateFamily,
    reactivateFamilyAsIndependent,
    requestReactivation,
    isArchiving,
    isReactivating,
    isRequesting,
  };
};
