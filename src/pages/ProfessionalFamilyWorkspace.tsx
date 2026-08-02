import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Loader2, LogOut, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FamilyToday } from '@/features/family-board/FamilyToday';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface AccessGrant {
  capabilities: string[];
  expires_at: string;
  role_template: string;
}

const ProfessionalFamilyWorkspace = () => {
  const { familyId } = useParams<{ familyId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const [access, setAccess] = useState<AccessGrant | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    const loadAccess = async () => {
      if (!user || !familyId) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('family_professional_invitations')
        .select('capabilities, expires_at, role_template')
        .eq('family_id', familyId)
        .eq('accepted_by', user.id)
        .eq('status', 'accepted')
        .is('revoked_at', null)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (error || !data || !data.capabilities.includes('family.read')) {
        setDenied(true);
        setAccess(null);
      } else {
        setAccess(data);
        setDenied(false);
      }
      setLoading(false);
    };
    void loadAccess();
  }, [familyId, user]);

  if (!authLoading && !user) {
    return <Navigate to={`/auth?redirect=${encodeURIComponent(`/professional-family/${familyId || ''}`)}`} replace />;
  }

  if (authLoading || loading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /><span className="ml-2">Opening shared workspace…</span></div>;
  }

  if (!familyId || denied || !access || !user) {
    return (
      <main className="container mx-auto flex min-h-screen max-w-xl items-center px-4">
        <Card className="w-full">
          <CardHeader><CardTitle>Shared access unavailable</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">This invitation is unavailable, expired, revoked, or does not include family workspace access.</p>
            <Button onClick={() => navigate('/')}>Return home</Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const capabilities = new Set(access.capabilities);
  const canWriteActions = capabilities.has('actions.write');
  const canWriteDecisions = capabilities.has('decisions.write');

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-semibold"><ShieldCheck className="h-4 w-4 text-primary" /> Secure professional access</p>
            <p className="text-xs text-muted-foreground">{access.role_template.replace(/_/g, ' ')} · expires {new Date(access.expires_at).toLocaleDateString()}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => void signOut()}><LogOut className="mr-1.5 h-4 w-4" />Sign out</Button>
        </div>
      </header>
      <main className="container mx-auto max-w-5xl px-3 py-4 sm:px-4 sm:py-6">
        <FamilyToday
          familyId={familyId}
          familyName="Shared family workspace"
          journeyStage="Professional collaboration"
          members={[{ user_id: user.id, full_name: 'You' }]}
          currentUserId={user.id}
          canManageAccess={false}
          canManageWork={canWriteActions}
          canCreateActions={canWriteActions}
          canCreateDecisions={canWriteDecisions}
          canRespondToDecisions={canWriteDecisions}
        />
      </main>
    </div>
  );
};

export default ProfessionalFamilyWorkspace;
