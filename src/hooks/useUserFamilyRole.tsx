import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useUserFamilyRole() {
  const { user } = useAuth();
  const [isRecovering, setIsRecovering] = useState(false);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    if (!user) {
      setIsRecovering(false);
      setRoles([]);
      setLoading(false);
      return;
    }

    const fetchRoles = async () => {
      const { data, error } = await supabase
        .from('family_members')
        .select('role')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching family roles:', error);
        setLoading(false);
        return;
      }

      const userRoles = (data || []).map(d => d.role);
      setRoles(userRoles);
      // User is "recovering" if ALL their family memberships are recovering role
      // (they have no non-recovering role in any family)
      const hasNonRecoveringRole = userRoles.some(r => r !== 'recovering');
      setIsRecovering(userRoles.length > 0 && !hasNonRecoveringRole);
      setLoading(false);
    };

    fetchRoles();
  }, [user]);

  return { isRecovering, roles, loading };
}
