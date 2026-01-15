import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useFamilyArchive = () => {
  const { toast } = useToast();
  const [isArchiving, setIsArchiving] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);

  const archiveFamily = async (familyId: string, familyName: string) => {
    setIsArchiving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('families')
        .update({
          is_archived: true,
          archived_at: new Date().toISOString(),
          archived_by: user.id,
        })
        .eq('id', familyId);

      if (error) throw error;

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

  return {
    archiveFamily,
    reactivateFamily,
    isArchiving,
    isReactivating,
  };
};
