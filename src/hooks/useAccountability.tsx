import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface AccountabilityCommitment {
  id: string;
  family_id: string | null;
  organization_id: string | null;
  commitment_type: string;
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
  created_by: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_notes: string | null;
  created_at: string;
}

export interface AccountabilityScore {
  id: string;
  family_id: string | null;
  organization_id: string | null;
  score_type: string;
  score: number;
  previous_score: number | null;
  trend: string;
  factors: any[];
  ai_insight: string | null;
  positive_feedback: string[] | null;
  supportiveness_score?: number | null;
  criticism_score?: number | null;
  enabling_score?: number | null;
  emotional_regulation_score?: number | null;
  boundary_consistency_score?: number | null;
  recovery_alignment_score?: number | null;
  communication_valence?: string | null;
  calculated_at: string;
}

export interface AccountabilityAlert {
  id: string;
  family_id: string | null;
  organization_id: string | null;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  source_type: string;
  is_dismissed: boolean;
  created_at: string;
}

export interface AccountabilityContract {
  id: string;
  family_id: string | null;
  organization_id: string | null;
  contract_type: string;
  title: string;
  terms: any[];
  status: string;
  created_by: string;
  acknowledged_by: string[];
  expires_at: string | null;
  created_at: string;
}

export function useAccountability(familyId?: string, organizationId?: string) {
  const { user } = useAuth();
  const [commitments, setCommitments] = useState<AccountabilityCommitment[]>([]);
  const [scores, setScores] = useState<AccountabilityScore[]>([]);
  const [alerts, setAlerts] = useState<AccountabilityAlert[]>([]);
  const [contracts, setContracts] = useState<AccountabilityContract[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Build queries
      let commitQ = supabase.from('accountability_commitments').select('*');
      if (familyId) commitQ = commitQ.eq('family_id', familyId);
      if (organizationId) commitQ = commitQ.eq('organization_id', organizationId);

      let scoreQ = supabase.from('accountability_scores').select('*');
      if (familyId) scoreQ = scoreQ.eq('family_id', familyId);
      if (organizationId) scoreQ = scoreQ.eq('organization_id', organizationId);

      let alertQ = supabase.from('accountability_alerts').select('*').eq('is_dismissed', false);
      if (familyId) alertQ = alertQ.eq('family_id', familyId);
      if (organizationId) alertQ = alertQ.eq('organization_id', organizationId);

      let contractQ = supabase.from('accountability_contracts').select('*');
      if (familyId) contractQ = contractQ.eq('family_id', familyId);
      if (organizationId) contractQ = contractQ.eq('organization_id', organizationId);

      const [commitRes, scoreRes, alertRes, contractRes] = await Promise.all([
        commitQ.order('created_at', { ascending: false }),
        scoreQ.order('calculated_at', { ascending: false }).limit(10),
        alertQ.order('created_at', { ascending: false }),
        contractQ.order('created_at', { ascending: false }),
      ]);

      setCommitments((commitRes.data || []) as AccountabilityCommitment[]);
      setScores((scoreRes.data || []) as AccountabilityScore[]);
      setAlerts((alertRes.data || []) as AccountabilityAlert[]);
      setContracts((contractRes.data || []) as AccountabilityContract[]);
    } catch (err) {
      console.error('Error loading accountability data:', err);
    } finally {
      setLoading(false);
    }
  }, [user, familyId, organizationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addCommitment = async (data: {
    title: string;
    description?: string;
    commitment_type: string;
    due_date?: string;
  }) => {
    if (!user) return;
    const insert: any = {
      ...data,
      created_by: user.id,
      ...(familyId && { family_id: familyId }),
      ...(organizationId && { organization_id: organizationId }),
    };
    const { error } = await supabase.from('accountability_commitments').insert(insert);
    if (!error) await loadData();
    return error;
  };

  const updateCommitmentStatus = async (id: string, status: string, notes?: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('accountability_commitments')
      .update({
        status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
        review_notes: notes || null,
      })
      .eq('id', id);
    if (!error) await loadData();
    return error;
  };

  const dismissAlert = async (id: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('accountability_alerts')
      .update({
        is_dismissed: true,
        dismissed_by: user.id,
        dismissed_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (!error) await loadData();
    return error;
  };

  const getLatestScore = (type: string) =>
    scores.find((s) => s.score_type === type);

  return {
    commitments,
    scores,
    alerts,
    contracts,
    loading,
    addCommitment,
    updateCommitmentStatus,
    dismissAlert,
    getLatestScore,
    refresh: loadData,
  };
}
