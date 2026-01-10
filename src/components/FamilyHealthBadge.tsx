import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle, 
  TrendingUp,
  Loader2,
  ShieldAlert
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface FamilyHealthBadgeProps {
  familyId: string;
  refreshTrigger?: number;
}

type HealthStatus = 'crisis' | 'concern' | 'tension' | 'stable' | 'improving';

interface HealthData {
  status: HealthStatus;
  status_reason: string;
  metrics: Record<string, number>;
  calculated_at: string;
}

const statusConfig: Record<HealthStatus, { 
  label: string; 
  icon: typeof AlertTriangle; 
  className: string;
  description: string;
}> = {
  crisis: {
    label: 'Crisis',
    icon: AlertTriangle,
    className: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200',
    description: 'Immediate attention needed',
  },
  concern: {
    label: 'Concern',
    icon: ShieldAlert,
    className: 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200',
    description: 'Elevated concerns detected',
  },
  tension: {
    label: 'Tension Detected',
    icon: AlertCircle,
    className: 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200',
    description: 'Some friction in the family system',
  },
  stable: {
    label: 'Stable',
    icon: CheckCircle,
    className: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200',
    description: 'Family system operating normally',
  },
  improving: {
    label: 'Improving',
    icon: TrendingUp,
    className: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200',
    description: 'Positive trends in recovery journey',
  },
};

export function FamilyHealthBadge({ familyId, refreshTrigger }: FamilyHealthBadgeProps) {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  const fetchHealthStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('family_health_status')
        .select('*')
        .eq('family_id', familyId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching health status:', error);
        return;
      }

      if (data) {
        setHealthData(data as HealthData);
        
        // Check if we need to recalculate (older than 30 minutes)
        const calculatedAt = new Date(data.calculated_at);
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
        
        if (calculatedAt < thirtyMinutesAgo) {
          recalculateHealth();
        }
      } else {
        // No health status exists, calculate it
        recalculateHealth();
      }
    } catch (err) {
      console.error('Error in fetchHealthStatus:', err);
    } finally {
      setLoading(false);
    }
  };

  const recalculateHealth = async () => {
    setCalculating(true);
    try {
      const { data, error } = await supabase.functions.invoke('calculate-family-health', {
        body: { familyId },
      });

      if (error) {
        console.error('Error calculating health:', error);
        return;
      }

      if (data?.healthStatus) {
        setHealthData(data.healthStatus as HealthData);
      }
    } catch (err) {
      console.error('Error in recalculateHealth:', err);
    } finally {
      setCalculating(false);
    }
  };

  useEffect(() => {
    fetchHealthStatus();
  }, [familyId, refreshTrigger]);

  // Set up realtime subscription for health status changes
  useEffect(() => {
    const channel = supabase
      .channel(`family-health-${familyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'family_health_status',
          filter: `family_id=eq.${familyId}`,
        },
        (payload) => {
          console.log('Health status changed:', payload);
          if (payload.new) {
            setHealthData(payload.new as HealthData);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [familyId]);

  // Listen for events that should trigger recalculation
  useEffect(() => {
    const eventsChannel = supabase
      .channel(`family-events-${familyId}`)
      // Listen for new check-ins
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'meeting_checkins',
          filter: `family_id=eq.${familyId}`,
        },
        () => {
          console.log('New check-in detected, recalculating health...');
          recalculateHealth();
        }
      )
      // Listen for filtered messages
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `family_id=eq.${familyId}`,
        },
        (payload) => {
          if ((payload.new as { was_filtered?: boolean })?.was_filtered) {
            console.log('Filtered message detected, recalculating health...');
            recalculateHealth();
          }
        }
      )
      // Listen for financial votes
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'financial_votes',
        },
        () => {
          console.log('New vote detected, recalculating health...');
          recalculateHealth();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(eventsChannel);
    };
  }, [familyId]);

  if (loading) {
    return (
      <Badge variant="outline" className="animate-pulse">
        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
        Loading...
      </Badge>
    );
  }

  if (!healthData) {
    return null;
  }

  const config = statusConfig[healthData.status];
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`cursor-help transition-colors ${config.className} ${calculating ? 'animate-pulse' : ''}`}
          >
            <Icon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">{config.description}</p>
            <p className="text-xs text-muted-foreground">{healthData.status_reason}</p>
            <p className="text-xs text-muted-foreground/70">
              Last updated: {new Date(healthData.calculated_at).toLocaleString()}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Demo version for demo families
interface DemoFamilyHealthBadgeProps {
  status: HealthStatus;
  reason: string;
}

export function DemoFamilyHealthBadge({ status, reason }: DemoFamilyHealthBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`cursor-help transition-colors ${config.className}`}
          >
            <Icon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">{config.description}</p>
            <p className="text-xs text-muted-foreground">{reason}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
