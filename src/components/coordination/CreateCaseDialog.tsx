import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  organizations: any[];
  onCreated: (caseId: string) => void;
}

export const CreateCaseDialog = ({ open, onOpenChange, userId, organizations, onCreated }: Props) => {
  const [title, setTitle] = useState('');
  const [familyId, setFamilyId] = useState('');
  const [families, setFamilies] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingFamilies, setLoadingFamilies] = useState(false);

  useEffect(() => {
    if (open && organizations.length > 0) {
      loadFamilies();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, organizations]);

  const loadFamilies = async () => {
    setLoadingFamilies(true);
    try {
      const orgIds = organizations.map((o: any) => o.id);
      const { data } = await supabase
        .from('families')
        .select('id, name')
        .in('organization_id', orgIds)
        .eq('is_archived', false)
        .order('name');
      setFamilies(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFamilies(false);
    }
  };

  const handleCreate = async () => {
    if (!title.trim() || !familyId) {
      toast({ title: 'Please fill in all fields', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { data: caseId, error: caseError } = await supabase.rpc('create_coordination_case', {
        p_family_id: familyId,
        p_title: title.trim(),
        p_creator_role: 'case_manager',
      });

      if (caseError) throw caseError;
      if (!caseId) throw new Error('Case creation did not return an identifier');

      toast({ title: 'Case created', description: 'Channels have been set up automatically.' });
      setTitle('');
      setFamilyId('');
      onCreated(caseId);
    } catch (err: any) {
      toast({ title: 'Failed to create case', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Coordination Case</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Case Title</Label>
            <Input
              placeholder="e.g., Smith Family Intervention Coordination"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Family</Label>
            <Select value={familyId} onValueChange={setFamilyId}>
              <SelectTrigger>
                <SelectValue placeholder={loadingFamilies ? 'Loading...' : 'Select family'} />
              </SelectTrigger>
              <SelectContent>
                {families.map(f => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleCreate} disabled={loading} className="w-full">
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Case
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
