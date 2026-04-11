import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, FileSignature, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { AccountabilityContract } from '@/hooks/useAccountability';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';

interface Props {
  contracts: AccountabilityContract[];
  contractType: 'family' | 'provider';
  familyId?: string;
  organizationId?: string;
  canManage: boolean;
  onRefresh: () => void;
}

export const BehavioralContractManager = ({ contracts, contractType, familyId, organizationId, canManage, onRefresh }: Props) => {
  const { user } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [termsText, setTermsText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filtered = contracts.filter(c => c.contract_type === contractType);

  const handleCreate = async () => {
    if (!user || !title.trim() || !termsText.trim()) return;
    setSubmitting(true);
    const terms = termsText.split('\n').filter(Boolean).map(t => ({ text: t.trim(), adhered: null }));
    const { error } = await supabase.from('accountability_contracts').insert({
      title: title.trim(),
      terms,
      contract_type: contractType,
      created_by: user.id,
      ...(familyId && { family_id: familyId }),
      ...(organizationId && { organization_id: organizationId }),
    });
    if (!error) {
      toast({ title: 'Contract created' });
      setTitle('');
      setTermsText('');
      setShowAdd(false);
      onRefresh();
    }
    setSubmitting(false);
  };

  const handleAcknowledge = async (contractId: string, currentAcked: string[]) => {
    if (!user) return;
    if (currentAcked.includes(user.id)) return;
    await supabase.from('accountability_contracts').update({
      acknowledged_by: [...currentAcked, user.id],
    }).eq('id', contractId);
    onRefresh();
    toast({ title: 'Contract acknowledged' });
  };

  const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
    draft: { color: 'bg-gray-100 text-gray-800', icon: <Clock className="h-3 w-3" /> },
    active: { color: 'bg-blue-100 text-blue-800', icon: <FileSignature className="h-3 w-3" /> },
    completed: { color: 'bg-green-100 text-green-800', icon: <CheckCircle2 className="h-3 w-3" /> },
    violated: { color: 'bg-red-100 text-red-800', icon: <XCircle className="h-3 w-3" /> },
    expired: { color: 'bg-gray-100 text-gray-600', icon: <Clock className="h-3 w-3" /> },
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileSignature className="h-4 w-4" />
            {contractType === 'family' ? 'Family Agreements' : 'Provider SLAs'}
          </CardTitle>
          {canManage && (
            <Button size="sm" variant="outline" onClick={() => setShowAdd(!showAdd)} className="gap-1">
              <Plus className="h-3.5 w-3.5" /> New
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {showAdd && (
          <div className="space-y-2 p-3 border rounded-lg bg-muted/30">
            <Input placeholder="Agreement title" value={title} onChange={e => setTitle(e.target.value)} />
            <Textarea
              placeholder="Enter each term on a new line, e.g.:&#10;Respond within 24 hours&#10;Provide weekly updates&#10;No financial rescue"
              value={termsText}
              onChange={e => setTermsText(e.target.value)}
              rows={4}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreate} disabled={submitting || !title.trim() || !termsText.trim()}>Create</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {filtered.length === 0 && !showAdd && (
          <p className="text-sm text-muted-foreground text-center py-4">No agreements yet.</p>
        )}

        {filtered.map(contract => {
          const cfg = statusConfig[contract.status] || statusConfig.active;
          const terms = Array.isArray(contract.terms) ? contract.terms : [];
          const isAcked = user ? contract.acknowledged_by?.includes(user.id) : false;

          return (
            <div key={contract.id} className="p-3 border rounded-lg space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {cfg.icon}
                  <p className="font-medium text-sm">{contract.title}</p>
                </div>
                <Badge variant="secondary" className={cfg.color}>{contract.status}</Badge>
              </div>
              <ul className="space-y-1 ml-5">
                {terms.map((t: any, i: number) => (
                  <li key={i} className="text-xs text-muted-foreground list-disc">{t.text || JSON.stringify(t)}</li>
                ))}
              </ul>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Created {format(new Date(contract.created_at), 'MMM d, yyyy')}</span>
                <div className="flex items-center gap-2">
                  <span>{contract.acknowledged_by?.length || 0} acknowledged</span>
                  {!isAcked && contract.status === 'active' && (
                    <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => handleAcknowledge(contract.id, contract.acknowledged_by || [])}>
                      Acknowledge
                    </Button>
                  )}
                  {isAcked && <Badge variant="outline" className="text-xs">Acknowledged</Badge>}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
