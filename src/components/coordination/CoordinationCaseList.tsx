import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Users, Clock, CheckCircle, PauseCircle } from 'lucide-react';

interface CoordinationCase {
  id: string;
  title: string;
  status: string;
  created_at: string;
  family_id: string;
  family_name?: string;
  member_count?: number;
}

interface Props {
  userId: string;
  onSelectCase: (caseId: string) => void;
}

export const CoordinationCaseList = ({ userId, onSelectCase }: Props) => {
  const [cases, setCases] = useState<CoordinationCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCases();
  }, [userId]);

  const loadCases = async () => {
    try {
      // Get cases where user is a member
      const { data: memberData } = await supabase
        .from('coordination_case_members')
        .select('case_id')
        .eq('user_id', userId);

      if (!memberData?.length) {
        setCases([]);
        setLoading(false);
        return;
      }

      const caseIds = memberData.map(m => m.case_id);
      
      const { data: casesData } = await supabase
        .from('coordination_cases')
        .select('*')
        .in('id', caseIds)
        .order('updated_at', { ascending: false });

      if (casesData) {
        // Get family names
        const familyIds = [...new Set(casesData.map(c => c.family_id))];
        const { data: families } = await supabase
          .from('families')
          .select('id, name')
          .in('id', familyIds);

        const familyMap = new Map(families?.map(f => [f.id, f.name]) || []);

        // Get member counts
        const { data: allMembers } = await supabase
          .from('coordination_case_members')
          .select('case_id')
          .in('case_id', caseIds);

        const countMap = new Map<string, number>();
        allMembers?.forEach(m => {
          countMap.set(m.case_id, (countMap.get(m.case_id) || 0) + 1);
        });

        setCases(casesData.map(c => ({
          ...c,
          family_name: familyMap.get(c.family_id) || 'Unknown Family',
          member_count: countMap.get(c.id) || 0,
        })));
      }
    } catch (err) {
      console.error('Failed to load cases:', err);
    } finally {
      setLoading(false);
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Clock className="h-4 w-4 text-green-500" />;
      case 'paused': return <PauseCircle className="h-4 w-4 text-yellow-500" />;
      case 'closed': return <CheckCircle className="h-4 w-4 text-muted-foreground" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!cases.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Coordination Cases</h3>
          <p className="text-muted-foreground">
            Create a new case to begin coordinating care across your team.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Active Cases</h2>
      {cases.map(c => (
        <Card
          key={c.id}
          className="cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => onSelectCase(c.id)}
        >
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {statusIcon(c.status)}
                  <span className="font-semibold">{c.title}</span>
                </div>
                <p className="text-sm text-muted-foreground">{c.family_name}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="gap-1">
                  <Users className="h-3 w-3" />
                  {c.member_count}
                </Badge>
                <Badge variant={c.status === 'active' ? 'default' : 'secondary'}>
                  {c.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
