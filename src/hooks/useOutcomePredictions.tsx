import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface OutcomePrediction {
  id: string;
  family_id: string;
  prediction_type: string;
  probability: number;
  previous_probability: number | null;
  trend: string;
  confidence: string;
  risk_drivers: string[];
  protective_factors: string[];
  ai_insight: string | null;
  ai_recommendation: { actions?: string[]; avoid?: string[] } | null;
  data_sources: Record<string, number>;
  calculated_at: string;
}

export interface PredictionAlert {
  id: string;
  family_id: string;
  prediction_type: string;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  is_dismissed: boolean;
  created_at: string;
}

export function useOutcomePredictions(familyId?: string) {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState<OutcomePrediction[]>([]);
  const [alerts, setAlerts] = useState<PredictionAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  const loadData = useCallback(async () => {
    if (!user || !familyId) return;
    setLoading(true);
    try {
      const [predRes, alertRes] = await Promise.all([
        supabase
          .from('outcome_predictions')
          .select('*')
          .eq('family_id', familyId)
          .order('calculated_at', { ascending: false })
          .limit(14),
        supabase
          .from('outcome_prediction_alerts')
          .select('*')
          .eq('family_id', familyId)
          .eq('is_dismissed', false)
          .order('created_at', { ascending: false }),
      ]);

      // Get latest of each type
      const latest = new Map<string, OutcomePrediction>();
      for (const p of (predRes.data || []) as OutcomePrediction[]) {
        if (!latest.has(p.prediction_type)) latest.set(p.prediction_type, p);
      }
      setPredictions(Array.from(latest.values()));
      setAlerts((alertRes.data || []) as PredictionAlert[]);
    } catch (err) {
      console.error('Error loading predictions:', err);
    } finally {
      setLoading(false);
    }
  }, [user, familyId]);

  useEffect(() => { loadData(); }, [loadData]);

  const calculatePredictions = async () => {
    if (!familyId) return;
    setCalculating(true);
    try {
      await supabase.functions.invoke('calculate-outcome-predictions', {
        body: { family_id: familyId },
      });
      await loadData();
    } catch (err) {
      console.error('Error calculating predictions:', err);
    } finally {
      setCalculating(false);
    }
  };

  const dismissAlert = async (id: string) => {
    if (!user) return;
    await supabase
      .from('outcome_prediction_alerts')
      .update({ is_dismissed: true, dismissed_by: user.id, dismissed_at: new Date().toISOString() })
      .eq('id', id);
    await loadData();
  };

  const getPrediction = (type: string) => predictions.find(p => p.prediction_type === type);

  const getHistorical = useCallback(async (type: string) => {
    if (!familyId) return [];
    const { data } = await supabase
      .from('outcome_predictions')
      .select('probability, calculated_at')
      .eq('family_id', familyId)
      .eq('prediction_type', type)
      .order('calculated_at', { ascending: true })
      .limit(30);
    return (data || []) as { probability: number; calculated_at: string }[];
  }, [familyId]);

  return {
    predictions, alerts, loading, calculating,
    calculatePredictions, dismissAlert, getPrediction, getHistorical, refresh: loadData,
  };
}
