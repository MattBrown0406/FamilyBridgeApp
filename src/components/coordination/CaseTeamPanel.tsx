import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fetchProfilesByIds } from '@/lib/profileApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from '@/components/ui/use-toast';
import { Users, Plus, Loader2, UserMinus } from 'lucide-react';

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  full_name: string;
  joined_at: string;
}

interface Props {
  caseId: string;
  userId: string;
  isProvider: boolean;
}

const roleLabels: Record<string, string> = {
  interventionist: 'Interventionist',
  clinician: 'Clinician / Therapist',
  treatment_provider: 'Treatment Provider',
  case_manager: 'Case Manager',
  family_member: 'Family Member',
  admin: 'Admin',
};

const roleColors: Record<string, string> = {
  interventionist: 'bg-purple-100 text-purple-700',
  clinician: 'bg-blue-100 text-blue-700',
  treatment_provider: 'bg-green-100 text-green-700',
  case_manager: 'bg-orange-100 text-orange-700',
  family_member: 'bg-gray-100 text-gray-700',
  admin: 'bg-red-100 text-red-700',
};

export const CaseTeamPanel = ({ caseId, userId, isProvider }: Props) => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addEmail, setAddEmail] = useState('');
  const [addRole, setAddRole] = useState('family_member');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadMembers();
  }, [caseId]);

  const loadMembers = async () => {
    try {
      const { data } = await supabase
        .from('coordination_case_members')
        .select('*')
        .eq('case_id', caseId)
        .order('joined_at');

      if (data?.length) {
        const userIds = data.map(m => m.user_id);
        const profiles = await fetchProfilesByIds(userIds);
        const profileMap = new Map(profiles.map((p: any) => [p.id, p.full_name || 'Unknown']));

        setMembers(data.map(m => ({
          ...m,
          full_name: profileMap.get(m.user_id) || 'Unknown User',
        })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const removeMember = async (memberId: string, memberUserId: string) => {
    if (memberUserId === userId) return;
    try {
      await supabase.from('coordination_case_members').delete().eq('id', memberId);
      setMembers(prev => prev.filter(m => m.id !== memberId));
      toast({ title: 'Member removed' });
    } catch (err: any) {
      toast({ title: 'Failed to remove member', variant: 'destructive' });
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Case Team</CardTitle>
            <Badge variant="outline">{members.length} members</Badge>
          </div>
          {isProvider && (
            <Button size="sm" variant="outline" onClick={() => setShowAdd(!showAdd)} className="gap-1">
              <Plus className="h-4 w-4" />
              Add Member
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add member form */}
        {showAdd && isProvider && (
          <div className="p-3 border rounded-lg space-y-3 bg-muted/30">
            <p className="text-sm font-medium">Add team member by looking up their profile</p>
            <p className="text-xs text-muted-foreground">
              The user must already have an account. Use the family member management tools to invite new users first.
            </p>
            <Select value={addRole} onValueChange={setAddRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(roleLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Members list */}
        <div className="space-y-2">
          {members.map(m => (
            <div key={m.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-sm">
                    {m.full_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{m.full_name}</p>
                  <Badge variant="secondary" className={`text-xs ${roleColors[m.role] || ''}`}>
                    {roleLabels[m.role] || m.role}
                  </Badge>
                </div>
              </div>
              {isProvider && m.user_id !== userId && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => removeMember(m.id, m.user_id)}
                >
                  <UserMinus className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Role visibility explanation */}
        <div className="mt-4 p-3 bg-muted/30 rounded-lg">
          <p className="text-xs font-semibold mb-2">Channel Visibility by Role</p>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p><strong>Family Members:</strong> Family Channel only</p>
            <p><strong>Providers & Clinical Staff:</strong> Family Channel + Provider Channel</p>
            <p><strong>AI Analysis:</strong> Providers & Admins only</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
