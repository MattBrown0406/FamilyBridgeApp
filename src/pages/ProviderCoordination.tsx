import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProviderAdmin } from '@/hooks/useProviderAdmin';
import { useOrganizationBranding } from '@/hooks/useOrganizationBranding';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Loader2, Shield, Users } from 'lucide-react';
import { CoordinationCaseList } from '@/components/coordination/CoordinationCaseList';
import { CoordinationCaseView } from '@/components/coordination/CoordinationCaseView';
import { CreateCaseDialog } from '@/components/coordination/CreateCaseDialog';
import familyBridgeLogo from '@/assets/familybridge-logo.png';

const ProviderCoordination = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { organizations, isLoading: orgsLoading, isProvider } = useProviderAdmin();
  const { branding, applyBranding, resetBranding } = useOrganizationBranding();
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  // Apply org branding
  useEffect(() => {
    applyBranding();
    return () => resetBranding();
  }, [branding]);

  if (authLoading || orgsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isProvider) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Provider Access Required</h2>
            <p className="text-muted-foreground mb-4">
              This coordination system is available to providers and clinical staff only.
            </p>
            <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentOrg = organizations[0];
  const logoUrl = currentOrg?.logo_url || familyBridgeLogo;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/provider-workspace')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img
              src={logoUrl}
              alt={currentOrg?.name || 'Provider'}
              className="h-8 object-contain"
            />
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {currentOrg?.name ? `${currentOrg.name} Coordination` : 'Provider Coordination'}
              </h1>
              <p className="text-sm text-muted-foreground">
                Unified communication & care coordination
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Users className="h-3 w-3" />
              Team Hub
            </Badge>
            <Button onClick={() => setShowCreateDialog(true)} size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              New Case
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4">
        {selectedCaseId ? (
          <CoordinationCaseView
            caseId={selectedCaseId}
            onBack={() => setSelectedCaseId(null)}
            userId={user!.id}
          />
        ) : (
          <CoordinationCaseList
            userId={user!.id}
            onSelectCase={setSelectedCaseId}
          />
        )}
      </main>

      <CreateCaseDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        userId={user!.id}
        organizations={organizations}
        onCreated={(caseId) => {
          setShowCreateDialog(false);
          setSelectedCaseId(caseId);
        }}
      />
    </div>
  );
};

export default ProviderCoordination;
