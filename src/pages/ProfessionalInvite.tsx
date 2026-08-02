import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

const ProfessionalInvite = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [acceptedFamilyId, setAcceptedFamilyId] = useState<string | null>(null);
  const token = searchParams.get('token')?.trim() || '';

  const nextPath = useMemo(() => `/professional-invite?token=${encodeURIComponent(token)}`, [token]);
  const authUrl = (mode: 'signin' | 'signup') => `/auth?mode=${mode}&next=${encodeURIComponent(nextPath)}`;

  useEffect(() => {
    if (!token) toast.error('This invitation link is incomplete.');
  }, [token]);

  const accept = async () => {
    if (!token || !user) return;
    setAccepting(true);
    const { data, error } = await supabase.rpc('accept_family_professional_invitation', { p_invite_token: token });
    if (error) {
      toast.error(error.message);
      setAccepting(false);
      return;
    }
    setAcceptedFamilyId(data);
    setAccepted(true);
    toast.success('Professional access accepted');
    setAccepting(false);
  };

  if (authLoading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <main className="mx-auto flex min-h-[75vh] max-w-xl items-center px-4 py-10">
      <Card className="w-full">
        <CardHeader>
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10"><ShieldCheck className="h-6 w-6 text-primary" /></div>
          <CardTitle>{accepted ? 'Access confirmed' : 'Professional access invitation'}</CardTitle>
          <CardDescription>
            {accepted
              ? 'Your authorized FamilyBridge workspace is ready.'
              : 'Access is tied to the invited email address, limited to named capabilities, time-limited, and revocable.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!token ? (
            <><p role="alert" className="text-sm text-destructive">The invitation token is missing.</p><Button variant="outline" onClick={() => navigate('/')}>Return home</Button></>
          ) : accepted ? (
            <Button disabled={!acceptedFamilyId} onClick={() => acceptedFamilyId && navigate(`/professional-family/${acceptedFamilyId}`)}>Open shared workspace</Button>
          ) : !user ? (
            <>
              <p className="text-sm text-muted-foreground">Sign in with the email address that received this invitation. If you do not have an account, create one using that same email.</p>
              <div className="flex flex-col gap-2 sm:flex-row"><Button onClick={() => navigate(authUrl('signin'))}>Sign in to review</Button><Button variant="outline" onClick={() => navigate(authUrl('signup'))}>Create account</Button></div>
            </>
          ) : (
            <>
              <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                <p className="font-medium">Signed in as {user.email}</p>
                <p className="mt-1 text-muted-foreground">For privacy, family details are revealed only after the server verifies that this email matches the named recipient.</p>
              </div>
              <Button disabled={accepting} onClick={() => void accept()}>{accepting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Accept authorized access</Button>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
};

export default ProfessionalInvite;
