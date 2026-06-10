import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProviderAdmin } from '@/hooks/useProviderAdmin';
import { useOrganizationBranding } from '@/hooks/useOrganizationBranding';
import { useUserFamilyRole } from '@/hooks/useUserFamilyRole';
import { supabase } from '@/integrations/supabase/client';
import { useAccountability } from '@/hooks/useAccountability';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Users, Building2, Activity, Shield, FileSignature, Eye } from 'lucide-react';
import { FamilyAccountabilityPanel } from '@/components/accountability/FamilyAccountabilityPanel';
import { ProviderPerformancePanel } from '@/components/accountability/ProviderPerformancePanel';
import { SystemAlignmentDashboard } from '@/components/accountability/SystemAlignmentDashboard';
import { BehavioralContractManager } from '@/components/accountability/BehavioralContractManager';
import {
  demoFamilyScore, demoProviderScore, demoSystemScore,
  demoCommitments, demoAlerts, demoContracts,
} from '@/data/accountabilityDemoData';
import familyBridgeLogo from '@/assets/familybridge-logo.png';

interface Family {
  id: string;
  name: string;
}

const AccountabilityEngine = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isDemo = searchParams.get('demo') === 'true';

  const { user, loading: authLoading } = useAuth();
  const { organizations, isLoading: orgsLoading, isProvider } = useProviderAdmin();
  const { branding, applyBranding, resetBranding } = useOrganizationBranding();
  const { isRecovering, loading: roleLoading } = useUserFamilyRole();
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
  const [families, setFamilies] = useState<Family[]>([]);
  const [loadingFamilies, setLoadingFamilies] = useState(true);
  const [activeTab, setActiveTab] = useState('family');

  const currentOrg = organizations?.[0];
  const orgId = currentOrg?.id;

  const {
    commitments, scores, alerts, contracts, acknowledgements, loading: dataLoading,
    addCommitment, updateCommitmentStatus, dismissAlert, getLatestScore, refresh
  } = useAccountability(selectedFamilyId || undefined, orgId);

  useEffect(() => {
    if (!isDemo && !authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate, isDemo]);

  useEffect(() => {
    if (!isDemo) {
      applyBranding();
      return () => resetBranding();
    }
  }, [branding, isDemo]);

  // Load families (skip in demo mode)
  useEffect(() => {
    if (isDemo) {
      setLoadingFamilies(false);
      return;
    }
    if (!user) return;
    const loadFamilies = async () => {
      setLoadingFamilies(true);
      const { data } = await supabase
        .from('family_members')
        .select('family_id, families!inner(id, name)')
        .eq('user_id', user.id);

      const fams = (data || []).map((d: any) => ({
        id: d.families.id,
        name: d.families.name,
      }));
      setFamilies(fams);
      if (fams.length > 0 && !selectedFamilyId) {
        setSelectedFamilyId(fams[0].id);
      }
      setLoadingFamilies(false);
    };
    loadFamilies();
  }, [user, isDemo]);

  // Demo mode — render with hardcoded data
  if (isDemo) {
    const noopAsync = async () => {};
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <img src={familyBridgeLogo} alt="Logo" className="h-8 object-contain shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">
                    Accountability Engine
                  </h1>
                  <Badge variant="outline" className="gap-1 shrink-0 text-xs border-primary/30 text-primary">
                    <Eye className="h-3 w-3" />
                    Demo
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                  Brown Family — Sample accountability data
                </p>
              </div>
            </div>
            <Button size="sm" onClick={() => navigate('/family-purchase')} className="shrink-0">
              Get Started
            </Button>
          </div>
        </header>

        <main className="max-w-7xl mx-auto p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start flex-wrap h-auto gap-1 mb-4">
              <TabsTrigger value="family" className="gap-1">
                <Users className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Family</span> Accountability
              </TabsTrigger>
              <TabsTrigger value="provider" className="gap-1">
                <Building2 className="h-3.5 w-3.5" />
                Provider <span className="hidden sm:inline">Performance</span>
              </TabsTrigger>
              <TabsTrigger value="alignment" className="gap-1">
                <Activity className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">System</span> Alignment
              </TabsTrigger>
              <TabsTrigger value="contracts" className="gap-1">
                <FileSignature className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Behavioral</span> Contracts
              </TabsTrigger>
            </TabsList>

            <TabsContent value="family">
              <FamilyAccountabilityPanel
                score={demoFamilyScore}
                commitments={demoCommitments.filter(c => c.commitment_type === 'family')}
                alerts={demoAlerts.filter(a => a.source_type === 'family')}
                canManage={false}
                onAddCommitment={noopAsync}
                onUpdateCommitmentStatus={noopAsync}
                onDismissAlert={noopAsync}
              />
            </TabsContent>

            <TabsContent value="provider">
              <ProviderPerformancePanel
                score={demoProviderScore}
                commitments={demoCommitments.filter(c => c.commitment_type === 'provider')}
                alerts={demoAlerts.filter(a => a.source_type === 'provider')}
                canManage={false}
                onAddCommitment={noopAsync}
                onUpdateCommitmentStatus={noopAsync}
                onDismissAlert={noopAsync}
              />
            </TabsContent>

            <TabsContent value="alignment">
              <SystemAlignmentDashboard
                familyScore={demoFamilyScore}
                providerScore={demoProviderScore}
                systemScore={demoSystemScore}
              />
            </TabsContent>

            <TabsContent value="contracts">
              <div className="space-y-4">
                <BehavioralContractManager
                  contracts={demoContracts}
                  contractType="family"
                  canManage={false}
                  onRefresh={noopAsync}
                />
                <BehavioralContractManager
                  contracts={demoContracts}
                  contractType="provider"
                  canManage={false}
                  onRefresh={noopAsync}
                />
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    );
  }

  // --- Authenticated mode below ---

  if (authLoading || orgsLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isRecovering) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
            <p className="text-muted-foreground mb-4">The Accountability Engine is available to family support members and providers.</p>
            <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canManage = !isRecovering;
  const logoUrl = currentOrg?.logo_url || familyBridgeLogo;
  const familyScore = getLatestScore('family');
  const providerScore = getLatestScore('provider');
  const systemScore = getLatestScore('system');

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img src={logoUrl} alt="Logo" className="h-8 object-contain shrink-0" />
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">
                Accountability Engine
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                Track, score, and reinforce system-wide accountability
              </p>
            </div>
          </div>
          {families.length > 1 && (
            <Select value={selectedFamilyId || ''} onValueChange={setSelectedFamilyId}>
              <SelectTrigger className="w-[160px] shrink-0">
                <SelectValue placeholder="Select family" />
              </SelectTrigger>
              <SelectContent>
                {families.map(f => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4">
        {loadingFamilies || dataLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start flex-wrap h-auto gap-1 mb-4">
              <TabsTrigger value="family" className="gap-1">
                <Users className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Family</span> Accountability
              </TabsTrigger>
              {isProvider && (
                <TabsTrigger value="provider" className="gap-1">
                  <Building2 className="h-3.5 w-3.5" />
                  Provider <span className="hidden sm:inline">Performance</span>
                </TabsTrigger>
              )}
              <TabsTrigger value="alignment" className="gap-1">
                <Activity className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">System</span> Alignment
              </TabsTrigger>
              <TabsTrigger value="contracts" className="gap-1">
                <FileSignature className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Behavioral</span> Contracts
              </TabsTrigger>
            </TabsList>

            <TabsContent value="family">
              <FamilyAccountabilityPanel
                score={familyScore}
                commitments={commitments}
                alerts={alerts}
                acknowledgements={acknowledgements}
                canManage={canManage}
                onAddCommitment={addCommitment}
                onUpdateCommitmentStatus={updateCommitmentStatus}
                onDismissAlert={dismissAlert}
              />
            </TabsContent>

            {isProvider && (
              <TabsContent value="provider">
                <ProviderPerformancePanel
                  score={providerScore}
                  commitments={commitments}
                  alerts={alerts}
                  canManage={canManage}
                  onAddCommitment={addCommitment}
                  onUpdateCommitmentStatus={updateCommitmentStatus}
                  onDismissAlert={dismissAlert}
                />
              </TabsContent>
            )}

            <TabsContent value="alignment">
              <SystemAlignmentDashboard
                familyScore={familyScore}
                providerScore={providerScore}
                systemScore={systemScore}
              />
            </TabsContent>

            <TabsContent value="contracts">
              <div className="space-y-4">
                <BehavioralContractManager
                  contracts={contracts}
                  contractType="family"
                  familyId={selectedFamilyId || undefined}
                  canManage={canManage}
                  onRefresh={refresh}
                />
                {isProvider && (
                  <BehavioralContractManager
                    contracts={contracts}
                    contractType="provider"
                    organizationId={orgId}
                    canManage={canManage}
                    onRefresh={refresh}
                  />
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default AccountabilityEngine;
