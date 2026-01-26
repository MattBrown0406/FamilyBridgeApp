import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProviderAdmin } from '@/hooks/useProviderAdmin';
import { useOrganizationBranding } from '@/hooks/useOrganizationBranding';
import { supabase } from '@/integrations/supabase/client';
import { fetchProfilesByIds } from '@/lib/profileApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import {
  ArrowLeft,
  FileText,
  MessageSquare,
  Building2,
  Loader2,
  Users,
} from 'lucide-react';
import { ProviderNotesPanel } from '@/components/ProviderNotesPanel';
import { ProviderMessaging } from '@/components/ProviderMessaging';
import familyBridgeLogo from '@/assets/familybridge-logo.png';

interface Family {
  id: string;
  name: string;
}

interface OrgMember {
  user_id: string;
  full_name: string;
  avatar_url?: string | null;
  role: string;
}

const ProviderWorkspace = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { organizations, isLoading: orgsLoading, isProvider } = useProviderAdmin();
  const { branding, applyBranding, resetBranding } = useOrganizationBranding();
  
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
  const [families, setFamilies] = useState<Family[]>([]);
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);
  const [isLoadingFamilies, setIsLoadingFamilies] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  // Apply branding
  useEffect(() => {
    if (branding) {
      applyBranding();
    }
    return () => resetBranding();
  }, [branding, applyBranding, resetBranding]);

  // Auto-select first org
  useEffect(() => {
    if (organizations.length > 0 && !selectedOrgId) {
      setSelectedOrgId(organizations[0].id);
    }
  }, [organizations, selectedOrgId]);

  // Load families and members when org changes
  useEffect(() => {
    if (selectedOrgId) {
      fetchFamilies();
      fetchOrgMembers();
    }
  }, [selectedOrgId]);

  const fetchFamilies = async () => {
    if (!selectedOrgId) return;
    setIsLoadingFamilies(true);
    try {
      const { data, error } = await supabase
        .from('families')
        .select('id, name')
        .eq('organization_id', selectedOrgId)
        .eq('is_archived', false)
        .order('name');
      
      if (error) throw error;
      setFamilies(data || []);
    } catch (err) {
      console.error('Error fetching families:', err);
    } finally {
      setIsLoadingFamilies(false);
    }
  };

  const fetchOrgMembers = async () => {
    if (!selectedOrgId) return;
    setIsLoadingMembers(true);
    try {
      const { data: members, error } = await supabase
        .from('organization_members')
        .select('user_id, role')
        .eq('organization_id', selectedOrgId);
      
      if (error) throw error;

      if (members && members.length > 0) {
        const profiles = await fetchProfilesByIds(members.map(m => m.user_id));
        const membersWithProfiles: OrgMember[] = members.map(m => {
          const profile = profiles.find(p => p.id === m.user_id);
          return {
            user_id: m.user_id,
            full_name: profile?.full_name || 'Unknown',
            avatar_url: profile?.avatar_url,
            role: m.role,
          };
        });
        setOrgMembers(membersWithProfiles);
      } else {
        setOrgMembers([]);
      }
    } catch (err) {
      console.error('Error fetching org members:', err);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  // Auth check
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

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
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Provider Access Required</h2>
            <p className="text-muted-foreground mb-4">
              You need to be a member of a provider organization to access this workspace.
            </p>
            <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentOrg = organizations.find(o => o.id === selectedOrgId);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <img
                src={currentOrg?.logo_url || familyBridgeLogo}
                alt="Logo"
                className="h-8 object-contain"
              />
              <div>
                <h1 className="text-lg font-semibold">Provider Workspace</h1>
                <p className="text-sm text-muted-foreground">
                  {currentOrg?.name || 'Team Notes & Messaging'}
                </p>
              </div>
            </div>

            {organizations.length > 1 && (
              <Select value={selectedOrgId || ''} onValueChange={setSelectedOrgId}>
                <SelectTrigger className="w-[200px]">
                  <Building2 className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map(org => (
                    <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {selectedOrgId ? (
          <Tabs defaultValue="notes" className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <TabsList className="bg-primary/10">
                <TabsTrigger 
                  value="notes" 
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Clinical Notes
                </TabsTrigger>
                <TabsTrigger 
                  value="messaging"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Team Messaging
                </TabsTrigger>
              </TabsList>

              <Select
                value={selectedFamilyId || 'all'}
                onValueChange={(v) => setSelectedFamilyId(v === 'all' ? null : v)}
              >
                <SelectTrigger className="w-[200px]">
                  <Users className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All families" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Families</SelectItem>
                  {families.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <TabsContent value="notes">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Clinical Notes
                  </CardTitle>
                  <CardDescription>
                    Private observations, concerns, hypotheses, and action items for your team.
                    {selectedFamilyId && families.find(f => f.id === selectedFamilyId) && (
                      <span className="font-medium ml-1">
                        Filtering: {families.find(f => f.id === selectedFamilyId)?.name}
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProviderNotesPanel
                    organizationId={selectedOrgId}
                    families={families}
                    selectedFamilyId={selectedFamilyId}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="messaging">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Team Messaging
                  </CardTitle>
                  <CardDescription>
                    Private conversations between team members. These are not visible to families.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProviderMessaging
                    organizationId={selectedOrgId}
                    orgMembers={orgMembers}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Select an Organization</h3>
              <p className="text-muted-foreground">
                Choose an organization to view team notes and messaging.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default ProviderWorkspace;
