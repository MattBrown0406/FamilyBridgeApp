import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface AdminStats {
  overview: {
    total_families: number;
    total_organizations: number;
    total_users: number;
    total_messages: number;
    messages_this_week: number;
    messages_this_month: number;
    total_checkins: number;
    checkins_this_week: number;
    total_financial_requests: number;
    financial_requests_this_month: number;
  };
  families: Array<{
    id: string;
    name: string;
    organization_name: string | null;
    created_at: string;
    messages_last_30_days: number;
    checkins_last_30_days: number;
    total_activity: number;
  }>;
  organizations: Array<{
    id: string;
    name: string;
    subdomain: string;
    created_at: string;
    family_count: number;
  }>;
  users: Array<{
    id: string;
    full_name: string;
    avatar_url: string | null;
    created_at: string;
    family_count: number;
  }>;
}

export const useSuperAdmin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifyAdmin = useCallback(async () => {
    if (!user) {
      setIsAdmin(false);
      setIsVerifying(false);
      return;
    }

    try {
      // Get fresh session to ensure valid JWT
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        console.error('No active session');
        setIsAdmin(false);
        setIsVerifying(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('verify-super-admin');
      
      if (error) {
        console.error('Error verifying admin:', error);
        setIsAdmin(false);
      } else {
        setIsAdmin(data?.isAdmin || false);
      }
    } catch (err) {
      console.error('Error verifying admin:', err);
      setIsAdmin(false);
    } finally {
      setIsVerifying(false);
    }
  }, [user]);

  const fetchStats = useCallback(async () => {
    if (!isAdmin) return;
    
    setIsLoadingStats(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('get-admin-stats');
      
      if (error) {
        throw error;
      }
      
      if (data?.error) {
        throw new Error(data.error);
      }
      
      setStats(data);
    } catch (err: any) {
      console.error('Error fetching admin stats:', err);
      setError(err.message || 'Failed to load admin stats');
    } finally {
      setIsLoadingStats(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    verifyAdmin();
  }, [verifyAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
    }
  }, [isAdmin, fetchStats]);

  return {
    isAdmin,
    isVerifying,
    stats,
    isLoadingStats,
    error,
    refetch: fetchStats,
  };
};
