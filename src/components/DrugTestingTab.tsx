import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { fetchProfilesByIds } from '@/lib/profileApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { FlaskConical, Plus, Loader2, ShieldAlert, FileText } from 'lucide-react';
import { format } from 'date-fns';

type ResultStatus = 'negative' | 'positive' | 'inconclusive' | 'missed' | 'refused' | 'pending';

interface DrugTestRow {
  id: string;
  family_id: string;
  target_user_id: string | null;
  entered_by: string;
  test_date: string;
  test_type: string | null;
  panel: string | null;
  result: ResultStatus;
  substances_detected: string[] | null;
  testing_provider: string | null;
  notes: string | null;
  is_manual_entry: boolean;
  source_document_id: string | null;
  created_at: string;
  target_name?: string;
  entered_by_name?: string;
}

const RESULT_BADGE: Record<ResultStatus, { label: string; cls: string }> = {
  negative:     { label: 'Negative',     cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  positive:     { label: 'Positive',     cls: 'bg-red-100 text-red-800 border-red-200' },
  inconclusive: { label: 'Inconclusive', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
  missed:       { label: 'Missed',       cls: 'bg-red-100 text-red-800 border-red-200' },
  refused:      { label: 'Refused',      cls: 'bg-red-100 text-red-800 border-red-200' },
  pending:      { label: 'Pending',      cls: 'bg-slate-100 text-slate-700 border-slate-200' },
};

interface Props {
  familyId: string;
  userRole: string;
}

export const DrugTestingTab = ({ familyId, userRole }: Props) => {
  const { user } = useAuth();
  const canManage = userRole === 'moderator' || userRole === 'admin';

  const [rows, setRows] = useState<DrugTestRow[]>([]);
  const [members, setMembers] = useState<{ id: string; full_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState<{
    target_user_id: string;
    test_date: string;
    test_type: string;
    panel: string;
    result: ResultStatus;
    substances_detected: string;
    testing_provider: string;
    notes: string;
  }>({
    target_user_id: '',
    test_date: today,
    test_type: '',
    panel: '',
    result: 'negative',
    substances_detected: '',
    testing_provider: '',
    notes: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const [{ data: results, error }, { data: fm }] = await Promise.all([
        supabase.from('drug_test_results').select('*').eq('family_id', familyId).order('test_date', { ascending: false }),
        supabase.from('family_members').select('user_id').eq('family_id', familyId),
      ]);
      if (error) throw error;
      const memberIds = (fm || []).map((m: any) => m.user_id);
      const profiles = memberIds.length ? await fetchProfilesByIds(memberIds) : [];
      setMembers(profiles.map((p) => ({ id: p.id, full_name: p.full_name || 'Unknown' })));

      const ids = Array.from(new Set([
        ...(results || []).map((r: any) => r.target_user_id).filter(Boolean),
        ...(results || []).map((r: any) => r.entered_by).filter(Boolean),
      ]));
      const profMap = new Map<string, string>(profiles.map((p) => [p.id, p.full_name || 'Unknown']));
      const missing = ids.filter((id) => !profMap.has(id));
      if (missing.length) {
        const extra = await fetchProfilesByIds(missing);
        extra.forEach((p) => profMap.set(p.id, p.full_name || 'Unknown'));
      }
      setRows((results || []).map((r: any) => ({
        ...r,
        target_name: r.target_user_id ? profMap.get(r.target_user_id) : undefined,
        entered_by_name: profMap.get(r.entered_by),
      })));
    } catch (e: any) {
      console.error('[DrugTesting] load failed', e);
      toast.error(e.message || 'Failed to load drug test results');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (familyId) load(); }, [familyId]);

  const submit = async () => {
    if (!user) return;
    if (!form.test_date) { toast.error('Test date is required'); return; }
    setSubmitting(true);
    try {
      const substances = form.substances_detected
        .split(',').map((s) => s.trim()).filter(Boolean);
      const { error } = await supabase.from('drug_test_results').insert({
        family_id: familyId,
        target_user_id: form.target_user_id || null,
        entered_by: user.id,
        test_date: form.test_date,
        test_type: form.test_type || null,
        panel: form.panel || null,
        result: form.result,
        substances_detected: substances.length ? substances : null,
        testing_provider: form.testing_provider || null,
        notes: form.notes || null,
        is_manual_entry: true,
      });
      if (error) throw error;
      toast.success('Drug test result added');
      setShowForm(false);
      setForm({ ...form, substances_detected: '', notes: '', testing_provider: '' });
      load();
    } catch (e: any) {
      console.error('[DrugTesting] insert failed', e);
      toast.error(e.message || 'Failed to save result');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />
      <CardHeader>
        <CardTitle className="text-lg font-display flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md">
            <FlaskConical className="h-5 w-5 text-white" />
          </div>
          Drug &amp; Alcohol Testing
          {canManage && (
            <Button size="sm" className="ml-auto" onClick={() => setShowForm((s) => !s)}>
              <Plus className="h-4 w-4 mr-1" />
              {showForm ? 'Close' : 'Add Result'}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-xs text-muted-foreground flex items-start gap-2 p-3 rounded-lg bg-muted/40 border">
          <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            FamilyBridge helps organize recovery-support information. It does not replace medical, clinical, legal, or toxicology interpretation.
            Manual entries are user-entered unless marked otherwise &mdash; confirm clinical interpretation with the testing provider.
          </span>
        </div>

        {showForm && canManage && (
          <div className="space-y-3 p-4 border rounded-lg bg-card">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Person tested</Label>
                <Select value={form.target_user_id} onValueChange={(v) => setForm({ ...form, target_user_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select family member" /></SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (<SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Test date *</Label>
                <Input type="date" value={form.test_date} onChange={(e) => setForm({ ...form, test_date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Test type</Label>
                <Input placeholder="urine / saliva / hair / breath" value={form.test_type} onChange={(e) => setForm({ ...form, test_type: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Panel</Label>
                <Input placeholder="e.g. 10-panel, EtG" value={form.panel} onChange={(e) => setForm({ ...form, panel: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Result *</Label>
                <Select value={form.result} onValueChange={(v: ResultStatus) => setForm({ ...form, result: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(RESULT_BADGE) as ResultStatus[]).map((k) => (
                      <SelectItem key={k} value={k}>{RESULT_BADGE[k].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Testing provider</Label>
                <Input placeholder="Lab / probation / sober living" value={form.testing_provider} onChange={(e) => setForm({ ...form, testing_provider: e.target.value })} />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Substances detected (comma-separated)</Label>
                <Input placeholder="e.g. THC, Opiates" value={form.substances_detected} onChange={(e) => setForm({ ...form, substances_detected: e.target.value })} />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Notes</Label>
                <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={submit} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save manually entered result
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <h4 className="text-sm font-semibold">History</h4>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground"><Loader2 className="h-5 w-5 mx-auto animate-spin" /></div>
          ) : rows.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground border rounded-lg">
              No drug/alcohol test results yet. {canManage ? 'Add one manually or upload a lab document on the Documents tab.' : ''}
            </div>
          ) : (
            <div className="space-y-2">
              {rows.map((r) => (
                <div key={r.id} className="flex items-start justify-between gap-3 p-3 border rounded-lg">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={RESULT_BADGE[r.result].cls}>{RESULT_BADGE[r.result].label}</Badge>
                      <span className="text-sm font-medium">{r.target_name || 'Unassigned'}</span>
                      <span className="text-xs text-muted-foreground">{format(new Date(r.test_date), 'MMM d, yyyy')}</span>
                      {!r.is_manual_entry && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <FileText className="h-3 w-3" /> From document
                        </Badge>
                      )}
                      {r.is_manual_entry && (
                        <Badge variant="outline" className="text-xs">Manually entered</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 space-x-3">
                      {r.test_type && <span>Type: {r.test_type}</span>}
                      {r.panel && <span>Panel: {r.panel}</span>}
                      {r.testing_provider && <span>Provider: {r.testing_provider}</span>}
                    </div>
                    {r.substances_detected?.length ? (
                      <div className="text-xs mt-1">Detected: {r.substances_detected.join(', ')}</div>
                    ) : null}
                    {r.notes && <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.notes}</div>}
                    <div className="text-[10px] text-muted-foreground mt-1">Entered by {r.entered_by_name || 'Unknown'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DrugTestingTab;