import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { History, Loader2, MailPlus, ShieldCheck, UserRoundX } from 'lucide-react';
import { toast } from 'sonner';

type RoleTemplate = 'interventionist' | 'therapist' | 'treatment_provider' | 'case_manager' | 'family_member' | 'read_only_support';

interface RoleDefinition {
  label: string;
  description: string;
  capabilities: string[];
}

const ROLE_TEMPLATES: Record<RoleTemplate, RoleDefinition> = {
  interventionist: {
    label: 'Interventionist',
    description: 'Coordinate the family plan, actions, decisions, and transitions.',
    capabilities: ['family.read', 'actions.read', 'actions.write', 'decisions.read', 'decisions.write', 'coordination.read', 'coordination.manage', 'coordination.tasks.write', 'transitions.manage'],
  },
  therapist: {
    label: 'Therapist',
    description: 'View coordination and participate in shared actions and decisions.',
    capabilities: ['family.read', 'actions.read', 'actions.write', 'decisions.read', 'decisions.write', 'coordination.read', 'coordination.tasks.write'],
  },
  treatment_provider: {
    label: 'Treatment provider',
    description: 'Coordinate care, shared actions, and consented transitions.',
    capabilities: ['family.read', 'actions.read', 'actions.write', 'decisions.read', 'coordination.read', 'coordination.tasks.write', 'transitions.manage', 'outcomes.read'],
  },
  case_manager: {
    label: 'Case manager',
    description: 'Manage coordination, the shared plan, and care transitions.',
    capabilities: ['family.read', 'actions.read', 'actions.write', 'decisions.read', 'decisions.write', 'coordination.read', 'coordination.manage', 'coordination.tasks.write', 'transitions.manage'],
  },
  family_member: {
    label: 'Family support participant',
    description: 'Read the authorized coordination view without professional-note access.',
    capabilities: ['family.read', 'actions.read', 'decisions.read', 'coordination.read'],
  },
  read_only_support: {
    label: 'Read-only support',
    description: 'View only the minimum authorized coordination information.',
    capabilities: ['family.read', 'actions.read', 'decisions.read', 'coordination.read'],
  },
};

interface ProfessionalAccessPanelProps {
  familyId: string;
}

interface InvitationRow {
  accepted_at: string | null;
  capabilities: string[];
  expires_at: string;
  id: string;
  invitee_email: string;
  role_template: string;
  status: string;
}

interface AccessEventRow {
  created_at: string;
  event_type: string;
  id: string;
}

const formatDate = (value: string) => new Intl.DateTimeFormat(undefined, {
  month: 'short', day: 'numeric', year: 'numeric',
}).format(new Date(value));

export const ProfessionalAccessPanel = ({ familyId }: ProfessionalAccessPanelProps) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<RoleTemplate>('read_only_support');
  const [expiryDays, setExpiryDays] = useState('14');
  const [invitations, setInvitations] = useState<InvitationRow[]>([]);
  const [events, setEvents] = useState<AccessEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roleDefinition = ROLE_TEMPLATES[role];
  const load = useCallback(async () => {
    setLoading(true);
    const [inviteResult, eventResult] = await Promise.all([
      supabase
        .from('family_professional_invitations')
        .select('id, invitee_email, role_template, capabilities, status, expires_at, accepted_at')
        .eq('family_id', familyId)
        .order('created_at', { ascending: false }),
      supabase
        .from('family_professional_access_events')
        .select('id, event_type, created_at')
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })
        .limit(8),
    ]);
    const loadError = inviteResult.error || eventResult.error;
    if (loadError) setError(loadError.message);
    else {
      setError(null);
      setInvitations(inviteResult.data || []);
      setEvents(eventResult.data || []);
    }
    setLoading(false);
  }, [familyId]);

  useEffect(() => { void load(); }, [load]);

  const activeInvitations = useMemo(() => invitations.filter((invitation) => (
    invitation.status === 'accepted' || (invitation.status === 'pending' && new Date(invitation.expires_at) > new Date())
  )), [invitations]);

  const sendInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    setSaving(true);
    const expiresAt = new Date();
    expiresAt.setUTCDate(expiresAt.getUTCDate() + Number(expiryDays));
    const { error: inviteError } = await supabase.functions.invoke('send-family-professional-invite', {
      body: {
        familyId,
        inviteeEmail: email.trim().toLowerCase(),
        roleTemplate: role,
        capabilities: roleDefinition.capabilities,
        expiresAt: expiresAt.toISOString(),
      },
    });
    if (inviteError) {
      toast.error(inviteError.message || 'Invitation could not be sent');
    } else {
      toast.success('Secure invitation sent');
      setEmail('');
      await load();
    }
    setSaving(false);
  };

  const revoke = async (invitationId: string) => {
    setSaving(true);
    const { error: revokeError } = await supabase.rpc('revoke_family_professional_invitation', {
      p_invitation_id: invitationId,
    });
    if (revokeError) toast.error(revokeError.message);
    else {
      toast.success('Access revoked');
      await load();
    }
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-5 w-5 text-primary" />Professional access</CardTitle>
        <CardDescription>Invite a named person with an expiring, capability-limited role. Private professional notes are never shared by this invitation.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <form onSubmit={sendInvite} className="space-y-3 rounded-xl border bg-muted/30 p-3">
          <div>
            <Label htmlFor="professional-invite-email">Recipient email</Label>
            <Input id="professional-invite-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="professional@example.com" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="professional-invite-role">Role template</Label>
              <Select value={role} onValueChange={(value) => setRole(value as RoleTemplate)}>
                <SelectTrigger id="professional-invite-role"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(ROLE_TEMPLATES).map(([value, definition]) => <SelectItem key={value} value={value}>{definition.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="professional-invite-expiry">Access expires</Label>
              <Select value={expiryDays} onValueChange={setExpiryDays}>
                <SelectTrigger id="professional-invite-expiry"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="7">7 days</SelectItem><SelectItem value="14">14 days</SelectItem><SelectItem value="30">30 days</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="rounded-md border bg-background p-3 text-sm">
            <p className="font-medium">{roleDefinition.label}</p>
            <p className="mt-1 text-muted-foreground">{roleDefinition.description}</p>
            <div className="mt-2 flex flex-wrap gap-1">{roleDefinition.capabilities.map((capability) => <Badge key={capability} variant="secondary" className="text-[10px]">{capability.replace('.', ': ')}</Badge>)}</div>
          </div>
          <Button type="submit" disabled={saving || !email.trim()}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MailPlus className="mr-2 h-4 w-4" />}Send secure invitation</Button>
        </form>

        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {loading ? <div className="flex items-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading access…</div> : (
          <div className="space-y-2">
            <p className="text-sm font-medium">Current and pending access</p>
            {activeInvitations.length === 0 ? <p className="text-sm text-muted-foreground">No active professional invitations.</p> : activeInvitations.map((invitation) => (
              <div key={invitation.id} className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{invitation.invitee_email}</p>
                  <p className="text-xs text-muted-foreground">{ROLE_TEMPLATES[invitation.role_template as RoleTemplate]?.label || invitation.role_template} · {invitation.status} · expires {formatDate(invitation.expires_at)}</p>
                </div>
                <Button type="button" size="sm" variant="outline" disabled={saving} onClick={() => void revoke(invitation.id)}><UserRoundX className="mr-1 h-4 w-4" />Revoke</Button>
              </div>
            ))}
          </div>
        )}

        {events.length > 0 && (
          <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
            <p className="mb-2 flex items-center gap-1 font-medium text-foreground"><History className="h-3.5 w-3.5" />Recent access history</p>
            <ul className="space-y-1">{events.map((event) => <li key={event.id}>{event.event_type.replace(/_/g, ' ')} · {formatDate(event.created_at)}</li>)}</ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
