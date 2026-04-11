import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { InputConfidence, TrackingState } from '@/data/inputReconciliationDemoData';

export interface DBInputIssue {
  id: string;
  family_id: string;
  organization_id: string | null;
  issue_type: 'shallow' | 'incomplete' | 'contradiction';
  category: string;
  summary: string;
  prior_input: string | null;
  current_input: string | null;
  required_info: string[];
  escalation_level: number;
  tracking_state: TrackingState;
  family_member_name: string | null;
  resolved_at: string | null;
  deferred_until: string | null;
  created_at: string;
}

export interface DBDataConfidence {
  id: string;
  family_id: string;
  organization_id: string | null;
  category: string;
  confidence_level: InputConfidence;
  completeness: number;
  consistency: number;
  specificity: number;
  overall_score: number;
  issues_list: string[];
  calculated_at: string;
}

export interface DBDeferral {
  id: string;
  family_id: string;
  issue_id: string;
  deferred_by: string;
  family_member_name: string | null;
  return_time: string;
  reminder_sent: boolean;
  returned_at: string | null;
  resolved: boolean;
  created_at: string;
}

export interface DBReconciliationEvent {
  id: string;
  family_id: string;
  organization_id: string | null;
  event_type: string;
  description: string;
  family_member_name: string | null;
  category: string;
  confidence_level: InputConfidence | null;
  created_at: string;
}

export interface PlatformHealthData {
  totalFamilies: number;
  totalProviders: number;
  avgDataConfidence: number;
  totalUnresolved: number;
  totalContradictions: number;
  totalShallowInputs: number;
  totalIncomplete: number;
  totalDeferralsOverdue: number;
  confidenceDistribution: { low: number; moderate: number; high: number };
  orgHealth: Array<{
    id: string;
    name: string;
    type: 'provider' | 'private_family';
    totalFamilies: number;
    avgConfidence: number;
    confidence: InputConfidence;
    unresolvedIssues: number;
    contradictions: number;
    shallowInputs: number;
    incompleteInputs: number;
    deferralsOverdue: number;
  }>;
  topCategories: Array<{ category: string; count: number; pct: number }>;
}

export function useInputReconciliation(familyId?: string) {
  const { user } = useAuth();
  const [issues, setIssues] = useState<DBInputIssue[]>([]);
  const [confidence, setConfidence] = useState<DBDataConfidence[]>([]);
  const [deferrals, setDeferrals] = useState<DBDeferral[]>([]);
  const [events, setEvents] = useState<DBReconciliationEvent[]>([]);
  const [platformHealth, setPlatformHealth] = useState<PlatformHealthData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCaseData = useCallback(async () => {
    if (!user || !familyId) return;
    setLoading(true);
    try {
      const [issuesRes, confRes, defRes, evtRes] = await Promise.all([
        supabase
          .from('input_reconciliation_issues')
          .select('*')
          .eq('family_id', familyId)
          .order('created_at', { ascending: false }),
        supabase
          .from('input_data_confidence')
          .select('*')
          .eq('family_id', familyId)
          .order('calculated_at', { ascending: false }),
        supabase
          .from('input_deferrals')
          .select('*')
          .eq('family_id', familyId)
          .order('created_at', { ascending: false }),
        supabase
          .from('input_reconciliation_events')
          .select('*')
          .eq('family_id', familyId)
          .order('created_at', { ascending: false })
          .limit(50),
      ]);

      setIssues((issuesRes.data || []) as DBInputIssue[]);
      setConfidence((confRes.data || []) as DBDataConfidence[]);
      setDeferrals((defRes.data || []) as DBDeferral[]);
      setEvents((evtRes.data || []) as DBReconciliationEvent[]);
    } catch (err) {
      console.error('Error loading input reconciliation data:', err);
    } finally {
      setLoading(false);
    }
  }, [user, familyId]);

  const loadPlatformHealth = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch all issues, confidence scores, and deferrals (super admin RLS gives full access)
      const [issuesRes, confRes, defRes] = await Promise.all([
        supabase
          .from('input_reconciliation_issues')
          .select('id, family_id, organization_id, issue_type, tracking_state, category')
          .neq('tracking_state', 'resolved'),
        supabase
          .from('input_data_confidence')
          .select('id, family_id, organization_id, category, confidence_level, overall_score')
          .order('calculated_at', { ascending: false }),
        supabase
          .from('input_deferrals')
          .select('id, family_id, return_time, resolved')
          .eq('resolved', false),
      ]);

      const allIssues = (issuesRes.data || []) as any[];
      const allConf = (confRes.data || []) as any[];
      const allDef = (defRes.data || []) as any[];

      // Get unique families and orgs
      const familyIds = new Set<string>();
      const orgIds = new Set<string>();
      [...allIssues, ...allConf].forEach((r: any) => {
        if (r.family_id) familyIds.add(r.family_id);
        if (r.organization_id) orgIds.add(r.organization_id);
      });

      // Fetch org names
      let orgMap: Record<string, string> = {};
      if (orgIds.size > 0) {
        const { data: orgs } = await supabase
          .from('organizations')
          .select('id, name')
          .in('id', Array.from(orgIds));
        (orgs || []).forEach((o: any) => { orgMap[o.id] = o.name; });
      }

      // Compute confidence distribution
      const confDist = { low: 0, moderate: 0, high: 0 };
      // Deduplicate confidence by family (latest per family)
      const latestConfByFamily = new Map<string, any>();
      allConf.forEach((c: any) => {
        if (!latestConfByFamily.has(c.family_id)) {
          latestConfByFamily.set(c.family_id, []);
        }
        latestConfByFamily.get(c.family_id)!.push(c);
      });

      // Per-family avg confidence
      const familyAvgConf = new Map<string, number>();
      latestConfByFamily.forEach((entries, fid) => {
        const avg = Math.round(entries.reduce((s: number, e: any) => s + e.overall_score, 0) / entries.length);
        familyAvgConf.set(fid, avg);
        if (avg >= 70) confDist.high++;
        else if (avg >= 50) confDist.moderate++;
        else confDist.low++;
      });

      const avgDataConfidence = familyAvgConf.size > 0
        ? Math.round([...familyAvgConf.values()].reduce((a, b) => a + b, 0) / familyAvgConf.size)
        : 0;

      const now = new Date();
      const overdueDefsCount = allDef.filter((d: any) => new Date(d.return_time) < now).length;

      // Category breakdown
      const catCounts: Record<string, number> = {};
      allIssues.forEach((i: any) => {
        catCounts[i.category] = (catCounts[i.category] || 0) + 1;
      });
      const totalIssueCount = allIssues.length;
      const topCategories = Object.entries(catCounts)
        .map(([category, count]) => ({ category, count, pct: totalIssueCount > 0 ? Math.round((count / totalIssueCount) * 100) : 0 }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Per-org health
      const orgHealthMap = new Map<string, any>();
      // Group issues by org
      allIssues.forEach((i: any) => {
        const key = i.organization_id || '__private__';
        if (!orgHealthMap.has(key)) {
          orgHealthMap.set(key, {
            id: key,
            name: key === '__private__' ? 'Private Families (Self-Managed)' : (orgMap[key] || 'Unknown'),
            type: key === '__private__' ? 'private_family' : 'provider',
            familyIds: new Set(),
            unresolvedIssues: 0,
            contradictions: 0,
            shallowInputs: 0,
            incompleteInputs: 0,
          });
        }
        const entry = orgHealthMap.get(key)!;
        entry.familyIds.add(i.family_id);
        entry.unresolvedIssues++;
        if (i.issue_type === 'contradiction') entry.contradictions++;
        if (i.issue_type === 'shallow') entry.shallowInputs++;
        if (i.issue_type === 'incomplete') entry.incompleteInputs++;
      });

      // Also add families from confidence that might not have issues
      allConf.forEach((c: any) => {
        const key = c.organization_id || '__private__';
        if (!orgHealthMap.has(key)) {
          orgHealthMap.set(key, {
            id: key,
            name: key === '__private__' ? 'Private Families (Self-Managed)' : (orgMap[key] || 'Unknown'),
            type: key === '__private__' ? 'private_family' : 'provider',
            familyIds: new Set(),
            unresolvedIssues: 0, contradictions: 0, shallowInputs: 0, incompleteInputs: 0,
          });
        }
        orgHealthMap.get(key)!.familyIds.add(c.family_id);
      });

      // Compute per-org avg confidence + overdue deferrals
      const orgHealth = Array.from(orgHealthMap.values()).map((entry: any) => {
        const orgFamilyIds = Array.from(entry.familyIds) as string[];
        const orgConfScores = orgFamilyIds
          .map((fid: string) => familyAvgConf.get(fid))
          .filter((v): v is number => v !== undefined);
        const avgConf = orgConfScores.length > 0
          ? Math.round(orgConfScores.reduce((a, b) => a + b, 0) / orgConfScores.length)
          : 0;
        const overdue = allDef.filter((d: any) => entry.familyIds.has(d.family_id) && new Date(d.return_time) < now).length;

        return {
          id: entry.id,
          name: entry.name,
          type: entry.type as 'provider' | 'private_family',
          totalFamilies: orgFamilyIds.length,
          avgConfidence: avgConf,
          confidence: (avgConf >= 70 ? 'high' : avgConf >= 50 ? 'moderate' : 'low') as InputConfidence,
          unresolvedIssues: entry.unresolvedIssues,
          contradictions: entry.contradictions,
          shallowInputs: entry.shallowInputs,
          incompleteInputs: entry.incompleteInputs,
          deferralsOverdue: overdue,
        };
      }).sort((a, b) => b.unresolvedIssues - a.unresolvedIssues);

      setPlatformHealth({
        totalFamilies: familyIds.size,
        totalProviders: orgIds.size,
        avgDataConfidence,
        totalUnresolved: allIssues.length,
        totalContradictions: allIssues.filter((i: any) => i.issue_type === 'contradiction').length,
        totalShallowInputs: allIssues.filter((i: any) => i.issue_type === 'shallow').length,
        totalIncomplete: allIssues.filter((i: any) => i.issue_type === 'incomplete').length,
        totalDeferralsOverdue: overdueDefsCount,
        confidenceDistribution: confDist,
        orgHealth,
        topCategories,
      });
    } catch (err) {
      console.error('Error loading platform health:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateIssueState = async (id: string, state: TrackingState) => {
    if (!user) return;
    const update: any = { tracking_state: state };
    if (state === 'resolved') update.resolved_at = new Date().toISOString();
    const { error } = await supabase
      .from('input_reconciliation_issues')
      .update(update)
      .eq('id', id);
    if (!error && familyId) await loadCaseData();
    return error;
  };

  return {
    issues,
    confidence,
    deferrals,
    events,
    platformHealth,
    loading,
    loadCaseData,
    loadPlatformHealth,
    updateIssueState,
  };
}
