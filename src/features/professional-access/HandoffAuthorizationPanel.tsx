import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface PendingHandoff {
  id: string;
  toOrganizationId: string;
  toOrganizationName: string;
  transitionSummaryId: string | null;
}

interface HandoffAuthorizationPanelProps {
  currentUserId?: string;
  fullName?: string;
}

const authorizationExpiry = () => {
  const expires = new Date();
  expires.setDate(expires.getDate() + 30);
  return expires.toISOString();
};

export const HandoffAuthorizationPanel = ({ currentUserId, fullName = '' }: HandoffAuthorizationPanelProps) => {
  const { toast } = useToast();
  const [handoffs, setHandoffs] = useState<PendingHandoff[]>([]);
  const [loading, setLoading] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [signatureById, setSignatureById] = useState<Record<string, string>>({});
  const [agreedById, setAgreedById] = useState<Record<string, boolean>>({});
  const signerName = useMemo(() => fullName.trim(), [fullName]);

  const load = useCallback(async () => {
    if (!currentUserId) return;
    setLoading(true);
    try {
      const { data: pending, error } = await supabase
        .from('provider_handoffs')
        .select('id, to_organization_id, transition_summary_id')
        .eq('user_id', currentUserId)
        .eq('status', 'pending')
        .order('initiated_at', { ascending: false });
      if (error) throw error;
      if (!pending?.length) {
        setHandoffs([]);
        return;
      }

      const handoffIds = pending.map((handoff) => handoff.id);
      const organizationIds = [...new Set(pending.map((handoff) => handoff.to_organization_id))];
      const [{ data: authorizations, error: authorizationError }, { data: organizations, error: organizationError }] = await Promise.all([
        supabase
          .from('provider_handoff_authorizations')
          .select('handoff_id, expires_at')
          .in('handoff_id', handoffIds)
          .is('revoked_at', null),
        supabase.from('organizations').select('id, name').in('id', organizationIds),
      ]);
      if (authorizationError) throw authorizationError;
      if (organizationError) throw organizationError;

      const active = new Set((authorizations || [])
        .filter((authorization) => new Date(authorization.expires_at).getTime() > Date.now())
        .map((authorization) => authorization.handoff_id));
      const names = new Map((organizations || []).map((organization) => [organization.id, organization.name]));
      setHandoffs(pending
        .filter((handoff) => !active.has(handoff.id))
        .map((handoff) => ({
          id: handoff.id,
          toOrganizationId: handoff.to_organization_id,
          toOrganizationName: names.get(handoff.to_organization_id) || 'the receiving provider',
          transitionSummaryId: handoff.transition_summary_id,
        })));
    } catch (error) {
      console.error('Unable to load handoff authorizations', error);
      toast({ title: 'Unable to load handoff requests', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [currentUserId, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const authorize = async (handoff: PendingHandoff) => {
    const signature = signatureById[handoff.id]?.trim();
    if (!signerName || !signature || !agreedById[handoff.id]) return;
    setSubmittingId(handoff.id);
    try {
      const expiresAt = authorizationExpiry();
      const result = handoff.transitionSummaryId
        ? await supabase.rpc('sign_transition_handoff_consent', {
            p_handoff_id: handoff.id,
            p_full_name: signerName,
            p_signature_data: signature,
            p_consent_scope: 'transition_summary',
            p_expires_at: expiresAt,
            p_notes: null,
          })
        : await supabase.rpc('sign_provider_handoff_authorization', {
            p_handoff_id: handoff.id,
            p_full_name: signerName,
            p_signature_data: signature,
            p_expires_at: expiresAt,
            p_authorization_scope: 'handoff_metadata',
          });
      if (result.error) throw result.error;
      toast({
        title: 'Authorization recorded',
        description: `${handoff.toOrganizationName} can now review the minimum information needed to respond to this handoff.`,
      });
      await load();
    } catch (error) {
      console.error('Unable to authorize handoff', error);
      toast({
        title: 'Authorization was not saved',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmittingId(null);
    }
  };

  if (!currentUserId || (!loading && handoffs.length === 0)) return null;

  return (
    <Card className="border-blue-300 dark:border-blue-900">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-5 w-5 text-blue-600" /> Secure provider handoff authorization
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="flex items-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading requests…</p>
        ) : handoffs.map((handoff) => (
          <div key={handoff.id} className="space-y-3 rounded-xl border p-4">
            <Alert>
              <ShieldCheck className="h-4 w-4" />
              <AlertTitle>{handoff.toOrganizationName}</AlertTitle>
              <AlertDescription>
                A provider requested a handoff. Nothing is disclosed to the receiving organization until you authorize it. Authorization lasts 30 days and is bound only to this organization and request.
                {handoff.transitionSummaryId ? ' This request also includes your transition summary.' : ''}
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor={`handoff-signature-${handoff.id}`}>Type your full name as your signature</Label>
              <Input
                id={`handoff-signature-${handoff.id}`}
                autoComplete="name"
                value={signatureById[handoff.id] || ''}
                onChange={(event) => setSignatureById((current) => ({ ...current, [handoff.id]: event.target.value }))}
              />
            </div>
            <div className="flex items-start gap-2">
              <Checkbox
                id={`handoff-agree-${handoff.id}`}
                checked={Boolean(agreedById[handoff.id])}
                onCheckedChange={(checked) => setAgreedById((current) => ({ ...current, [handoff.id]: checked === true }))}
              />
              <Label htmlFor={`handoff-agree-${handoff.id}`} className="text-sm font-normal leading-5">
                I authorize the minimum necessary handoff information for {handoff.toOrganizationName}. I understand that private family messages and unrelated clinical notes are not included.
              </Label>
            </div>
            <Button
              onClick={() => void authorize(handoff)}
              disabled={submittingId === handoff.id || !signerName || !signatureById[handoff.id]?.trim() || !agreedById[handoff.id]}
            >
              {submittingId === handoff.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Authorize this handoff
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
