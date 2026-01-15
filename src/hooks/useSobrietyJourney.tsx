import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface SobrietyJourney {
  id: string;
  user_id: string;
  family_id: string;
  start_date: string;
  is_active: boolean;
  reset_count: number;
  created_at: string;
  updated_at: string;
}

export interface SobrietyMilestone {
  id: string;
  journey_id: string;
  milestone_days: number;
  achieved_at: string;
  celebrated_by_family: boolean;
  notes: string | null;
  created_at: string;
}

export const MILESTONE_DAYS = [1, 7, 14, 30, 60, 90, 180, 365, 730, 1095];

export const MILESTONE_NAMES: Record<number, string> = {
  1: "First Step",
  7: "One Week",
  14: "Two Weeks",
  30: "One Month",
  60: "Two Months",
  90: "Three Months",
  180: "Six Months",
  365: "One Year",
  730: "Two Years",
  1095: "Three Years",
};

export const useSobrietyJourney = (familyId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [journey, setJourney] = useState<SobrietyJourney | null>(null);
  const [milestones, setMilestones] = useState<SobrietyMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [daysCount, setDaysCount] = useState(0);

  const calculateDays = useCallback((startDate: string) => {
    const start = new Date(startDate);
    const today = new Date();
    start.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }, []);

  const getNextMilestone = useCallback((days: number) => {
    for (const milestone of MILESTONE_DAYS) {
      if (days < milestone) {
        return milestone;
      }
    }
    return null;
  }, []);

  const fetchJourney = useCallback(async () => {
    if (!user || !familyId) return;

    try {
      const { data, error } = await supabase
        .from('sobriety_journeys')
        .select('*')
        .eq('family_id', familyId)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setJourney(data);
        setDaysCount(calculateDays(data.start_date));
      } else {
        setJourney(null);
        setDaysCount(0);
      }
    } catch (error) {
      console.error('Error fetching sobriety journey:', error);
    } finally {
      setLoading(false);
    }
  }, [user, familyId, calculateDays]);

  const fetchMilestones = useCallback(async () => {
    if (!journey) return;

    try {
      const { data, error } = await supabase
        .from('sobriety_milestones')
        .select('*')
        .eq('journey_id', journey.id)
        .order('milestone_days', { ascending: true });

      if (error) throw error;
      setMilestones(data || []);
    } catch (error) {
      console.error('Error fetching milestones:', error);
    }
  }, [journey]);

  const startJourney = async (startDate: Date) => {
    if (!user || !familyId) return;

    try {
      const { data, error } = await supabase
        .from('sobriety_journeys')
        .insert({
          user_id: user.id,
          family_id: familyId,
          start_date: startDate.toISOString().split('T')[0],
        })
        .select()
        .single();

      if (error) throw error;

      setJourney(data);
      setDaysCount(calculateDays(data.start_date));
      
      toast({
        title: "Journey Started! 🌟",
        description: "Your sobriety counter is now active. You've got this!",
      });

      return data;
    } catch (error: any) {
      console.error('Error starting journey:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to start journey",
        variant: "destructive",
      });
    }
  };

  const resetJourney = async (newStartDate: Date) => {
    if (!user || !familyId || !journey) return;

    try {
      // Deactivate current journey
      await supabase
        .from('sobriety_journeys')
        .update({ is_active: false })
        .eq('id', journey.id);

      // Create new journey with incremented reset count
      const { data, error } = await supabase
        .from('sobriety_journeys')
        .insert({
          user_id: user.id,
          family_id: familyId,
          start_date: newStartDate.toISOString().split('T')[0],
          reset_count: journey.reset_count + 1,
        })
        .select()
        .single();

      if (error) throw error;

      setJourney(data);
      setDaysCount(calculateDays(data.start_date));
      setMilestones([]);
      
      toast({
        title: "Fresh Start 💪",
        description: "Starting fresh is a sign of strength. Every day is a new opportunity.",
      });

      return data;
    } catch (error: any) {
      console.error('Error resetting journey:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to reset journey",
        variant: "destructive",
      });
    }
  };

  const updateStartDate = async (newStartDate: Date) => {
    if (!journey) return;

    try {
      const { data, error } = await supabase
        .from('sobriety_journeys')
        .update({ 
          start_date: newStartDate.toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        })
        .eq('id', journey.id)
        .select()
        .single();

      if (error) throw error;

      setJourney(data);
      setDaysCount(calculateDays(data.start_date));
      
      toast({
        title: "Date Updated",
        description: "The sobriety start date has been updated.",
      });

      return data;
    } catch (error: any) {
      console.error('Error updating start date:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update start date",
        variant: "destructive",
      });
    }
  };

  const recordMilestone = async (milestoneDays: number, notes?: string) => {
    if (!journey) return;

    try {
      const { data, error } = await supabase
        .from('sobriety_milestones')
        .insert({
          journey_id: journey.id,
          milestone_days: milestoneDays,
          notes: notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      setMilestones(prev => [...prev, data]);
      return data;
    } catch (error: any) {
      // Ignore duplicate milestone errors
      if (error.code !== '23505') {
        console.error('Error recording milestone:', error);
      }
    }
  };

  const celebrateMilestone = async (milestoneId: string) => {
    try {
      const { error } = await supabase
        .from('sobriety_milestones')
        .update({ celebrated_by_family: true })
        .eq('id', milestoneId);

      if (error) throw error;

      setMilestones(prev =>
        prev.map(m => m.id === milestoneId ? { ...m, celebrated_by_family: true } : m)
      );
    } catch (error) {
      console.error('Error celebrating milestone:', error);
    }
  };

  // Check for new milestones
  useEffect(() => {
    if (!journey || daysCount === 0) return;

    const achievedMilestoneDays = milestones.map(m => m.milestone_days);
    
    for (const milestoneDays of MILESTONE_DAYS) {
      if (daysCount >= milestoneDays && !achievedMilestoneDays.includes(milestoneDays)) {
        recordMilestone(milestoneDays);
      }
    }
  }, [daysCount, journey, milestones]);

  useEffect(() => {
    fetchJourney();
  }, [fetchJourney]);

  useEffect(() => {
    if (journey) {
      fetchMilestones();
    }
  }, [journey, fetchMilestones]);

  // Update day count at midnight
  useEffect(() => {
    if (!journey) return;

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    const timeout = setTimeout(() => {
      setDaysCount(calculateDays(journey.start_date));
    }, msUntilMidnight);

    return () => clearTimeout(timeout);
  }, [journey, calculateDays]);

  return {
    journey,
    milestones,
    loading,
    daysCount,
    nextMilestone: getNextMilestone(daysCount),
    daysUntilNextMilestone: getNextMilestone(daysCount) 
      ? getNextMilestone(daysCount)! - daysCount 
      : null,
    startJourney,
    resetJourney,
    updateStartDate,
    recordMilestone,
    celebrateMilestone,
    refetch: fetchJourney,
  };
};

// Hook for family members to view a recovering member's journey
export const useFamilyMemberJourney = (familyId: string, memberId?: string) => {
  const [journey, setJourney] = useState<SobrietyJourney | null>(null);
  const [loading, setLoading] = useState(true);
  const [daysCount, setDaysCount] = useState(0);

  const calculateDays = useCallback((startDate: string) => {
    const start = new Date(startDate);
    const today = new Date();
    start.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }, []);

  useEffect(() => {
    const fetchMemberJourney = async () => {
      if (!familyId) return;

      try {
        let query = supabase
          .from('sobriety_journeys')
          .select('*')
          .eq('family_id', familyId)
          .eq('is_active', true);

        if (memberId) {
          query = query.eq('user_id', memberId);
        }

        const { data, error } = await query.maybeSingle();

        if (error) throw error;

        if (data) {
          setJourney(data);
          setDaysCount(calculateDays(data.start_date));
        }
      } catch (error) {
        console.error('Error fetching member journey:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMemberJourney();
  }, [familyId, memberId, calculateDays]);

  return { journey, loading, daysCount };
};
