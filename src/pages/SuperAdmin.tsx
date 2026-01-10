import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  BarChart3, 
  Users, 
  Building2, 
  MessageCircle, 
  MapPin, 
  DollarSign,
  RefreshCw,
  Loader2,
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  Calendar,
  Mail,
  Phone,
  Globe,
  User,
  Pencil,
  Trash2,
  Plus,
  Activity,
  ChevronRight
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';

interface FamilyDetails {
  family: {
    id: string;
    name: string;
    account_number: string;
    description: string | null;
    created_at: string;
    created_by: string | null;
  };
  organization_name: string | null;
  members: Array<{
    id: string;
    user_id: string;
    role: string;
    relationship_type: string | null;
    joined_at: string;
    profiles: { id: string; full_name: string; avatar_url: string | null } | null;
  }>;
  recent_messages: Array<{
    id: string;
    created_at: string;
    sender_id: string;
    content: string;
  }>;
  recent_checkins: Array<{
    id: string;
    checked_in_at: string;
    meeting_type: string;
    meeting_name: string | null;
    user_id: string;
  }>;
  recent_requests: Array<{
    id: string;
    amount: number;
    reason: string;
    status: string;
    created_at: string;
  }>;
}

interface OrgDetails {
  organization: {
    id: string;
    name: string;
    subdomain: string;
    tagline: string | null;
    logo_url: string | null;
    support_email: string | null;
    phone: string | null;
    website_url: string | null;
    created_at: string;
  };
  members: Array<{
    id: string;
    user_id: string;
    role: string;
    joined_at: string;
    profiles: { id: string; full_name: string; avatar_url: string | null } | null;
  }>;
  families: Array<{
    id: string;
    name: string;
    created_at: string;
  }>;
}

interface UserDetails {
  profile: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    created_at: string;
  };
  email: string;
  last_sign_in: string | null;
  created_at: string;
  family_memberships: Array<{
    id: string;
    role: string;
    families: { id: string; name: string } | null;
  }>;
  organization_memberships: Array<{
    id: string;
    role: string;
    organizations: { id: string; name: string } | null;
  }>;
}

interface AdminStats {
  overview: {
    total_families: number;
    total_organizations: number;
    total_users: number;
    total_messages: number;
    messages_this_week: number;
    messages_this_month: number;
    total_checkins: number;
    checkins_this_week: number;
    total_financial_requests: number;
    financial_requests_this_month: number;
  };
  families: Array<{
    id: string;
    name: string;
    account_number: string;
    organization_name: string | null;
    organization_logo_url?: string | null;
    organization_primary_color?: string | null;
    created_at: string;
    messages_last_30_days: number;
    checkins_last_30_days: number;
    total_activity: number;
  }>;
  organizations: Array<{
    id: string;
    name: string;
    subdomain: string;
    created_at: string;
    family_count: number;
    logo_url?: string | null;
    primary_color?: string | null;
    secondary_color?: string | null;
    accent_color?: string | null;
    background_color?: string | null;
    foreground_color?: string | null;
  }>;
  users: Array<{
    id: string;
    full_name: string;
    avatar_url: string | null;
    created_at: string;
    family_count: number;
    family_roles?: string[];
    org_roles?: string[];
    is_super_admin?: boolean;
    org_logo_url?: string | null;
    org_name?: string | null;
    org_primary_color?: string | null;
  }>;
}

const SuperAdmin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isVerifying, stats: rawStats, isLoadingStats, error, refetch } = useSuperAdmin();
  const stats = rawStats as AdminStats | null;
  
  const [globalSearch, setGlobalSearch] = useState('');
  const [activeTab, setActiveTab] = useState('families');
  
  // Detail dialog states
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [familyDetails, setFamilyDetails] = useState<FamilyDetails | null>(null);
  const [orgDetails, setOrgDetails] = useState<OrgDetails | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, string>>({});

  // Delete confirmation states
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'family' | 'org' | 'user'; id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Create dialog states
  const [isCreatingProvider, setIsCreatingProvider] = useState(false);
  const [isCreatingFamily, setIsCreatingFamily] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [providerForm, setProviderForm] = useState({ name: '', subdomain: '', support_email: '', phone: '', website_url: '' });
  const [familyForm, setFamilyForm] = useState({ name: '', description: '', organization_id: '' });

  const getAuthHeaders = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session?.access_token) {
      const { data: refreshData } = await supabase.auth.refreshSession();
      if (!refreshData.session?.access_token) {
        throw new Error('No valid session');
      }
      return {
        'Authorization': `Bearer ${refreshData.session.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        'Content-Type': 'application/json',
      };
    }
    return {
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      'Content-Type': 'application/json',
    };
  };

  const fetchFamilyDetails = async (familyId: string) => {
    setSelectedFamilyId(familyId);
    setIsLoadingDetails(true);
    setIsEditing(false);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-admin-stats?family_id=${familyId}`,
        { headers: await getAuthHeaders() }
      );
      const detailData = await response.json();
      setFamilyDetails(detailData);
      setEditForm({ name: detailData.family?.name || '', description: detailData.family?.description || '' });
    } catch (err) {
      console.error('Error fetching family details:', err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const fetchOrgDetails = async (orgId: string) => {
    setSelectedOrgId(orgId);
    setIsLoadingDetails(true);
    setIsEditing(false);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-admin-stats?org_id=${orgId}`,
        { headers: await getAuthHeaders() }
      );
      const detailData = await response.json();
      setOrgDetails(detailData);
      setEditForm({
        name: detailData.organization?.name || '',
        subdomain: detailData.organization?.subdomain || '',
        tagline: detailData.organization?.tagline || '',
        support_email: detailData.organization?.support_email || '',
        phone: detailData.organization?.phone || '',
        website_url: detailData.organization?.website_url || '',
      });
    } catch (err) {
      console.error('Error fetching org details:', err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const fetchUserDetails = async (userId: string) => {
    setSelectedUserId(userId);
    setIsLoadingDetails(true);
    setIsEditing(false);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-admin-stats?user_id=${userId}`,
        { headers: await getAuthHeaders() }
      );
      const detailData = await response.json();
      setUserDetails(detailData);
      setEditForm({ full_name: detailData.profile?.full_name || '' });
    } catch (err) {
      console.error('Error fetching user details:', err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleSave = async () => {
    setIsLoadingDetails(true);
    try {
      const headers = await getAuthHeaders();
      let url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-admin-stats`;
      
      if (selectedFamilyId) {
        url += `?family_id=${selectedFamilyId}`;
      } else if (selectedOrgId) {
        url += `?org_id=${selectedOrgId}`;
      } else if (selectedUserId) {
        url += `?user_id=${selectedUserId}`;
      }

      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(editForm),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Updated successfully');
        setIsEditing(false);
        refetch();
        if (selectedFamilyId) fetchFamilyDetails(selectedFamilyId);
        if (selectedOrgId) fetchOrgDetails(selectedOrgId);
        if (selectedUserId) fetchUserDetails(selectedUserId);
      } else {
        toast.error(result.error || 'Failed to update');
      }
    } catch (err) {
      console.error('Error saving:', err);
      toast.error('Failed to save changes');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);

    try {
      const headers = await getAuthHeaders();
      let url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-admin-stats?action=delete`;
      
      if (deleteConfirm.type === 'family') {
        url += `&family_id=${deleteConfirm.id}`;
      } else if (deleteConfirm.type === 'org') {
        url += `&org_id=${deleteConfirm.id}`;
      } else if (deleteConfirm.type === 'user') {
        url += `&user_id=${deleteConfirm.id}`;
      }

      const response = await fetch(url, {
        method: 'DELETE',
        headers,
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(`${deleteConfirm.type === 'family' ? 'Family' : deleteConfirm.type === 'org' ? 'Organization' : 'User'} deleted successfully`);
        setDeleteConfirm(null);
        setSelectedFamilyId(null);
        setSelectedOrgId(null);
        setSelectedUserId(null);
        setFamilyDetails(null);
        setOrgDetails(null);
        setUserDetails(null);
        refetch();
      } else {
        toast.error(result.error || 'Failed to delete');
      }
    } catch (err) {
      console.error('Error deleting:', err);
      toast.error('Failed to delete');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateProvider = async () => {
    if (!providerForm.name.trim() || !providerForm.subdomain.trim()) {
      toast.error('Provider name and subdomain are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-organization`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            name: providerForm.name.trim(),
            subdomain: providerForm.subdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, ''),
            support_email: providerForm.support_email.trim() || null,
            phone: providerForm.phone.trim() || null,
            website_url: providerForm.website_url.trim() || null,
          }),
        }
      );

      const result = await response.json();
      
      if (result.organization) {
        toast.success('Provider created successfully');
        setIsCreatingProvider(false);
        setProviderForm({ name: '', subdomain: '', support_email: '', phone: '', website_url: '' });
        refetch();
      } else {
        toast.error(result.error || 'Failed to create provider');
      }
    } catch (err) {
      console.error('Error creating provider:', err);
      toast.error('Failed to create provider');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateFamily = async () => {
    if (!familyForm.name.trim()) {
      toast.error('Family name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-family`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            name: familyForm.name.trim(),
            description: familyForm.description.trim() || null,
            organization_id: familyForm.organization_id || null,
          }),
        }
      );

      const result = await response.json();
      
      if (result.family) {
        toast.success('Family group created successfully');
        setIsCreatingFamily(false);
        setFamilyForm({ name: '', description: '', organization_id: '' });
        refetch();
      } else {
        toast.error(result.error || 'Failed to create family group');
      }
    } catch (err) {
      console.error('Error creating family:', err);
      toast.error('Failed to create family group');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30">
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <Shield className="h-5 w-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-sm text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-destructive/5">
        <Card className="max-w-md border-destructive/20 animate-scale-in">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              You don't have permission to access this page.
            </p>
            <Button onClick={() => navigate('/')}>Return Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const searchLower = globalSearch.toLowerCase();
  const filteredFamilies = stats?.families?.filter(f => 
    f.name.toLowerCase().includes(searchLower) ||
    f.account_number.toLowerCase().includes(searchLower) ||
    (f.organization_name && f.organization_name.toLowerCase().includes(searchLower))
  ) || [];

  const filteredOrgs = stats?.organizations?.filter(o =>
    o.name.toLowerCase().includes(searchLower) ||
    o.subdomain.toLowerCase().includes(searchLower)
  ) || [];

  const filteredUsers = stats?.users?.filter(u =>
    u.full_name.toLowerCase().includes(searchLower)
  ) || [];

  const getActivityIndicator = (activity: number) => {
    if (activity === 0) return { color: 'bg-muted', label: 'Inactive' };
    if (activity < 10) return { color: 'bg-orange-500', label: 'Low' };
    if (activity < 50) return { color: 'bg-yellow-500', label: 'Moderate' };
    return { color: 'bg-green-500', label: 'Active' };
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'outline'; className?: string }> = {
      moderator: { variant: 'default', className: 'bg-primary' },
      recovering: { variant: 'secondary' },
      owner: { variant: 'default', className: 'bg-primary' },
      admin: { variant: 'secondary' },
      staff: { variant: 'outline' },
    };
    const config = variants[role] || { variant: 'outline' as const };
    return <Badge variant={config.variant} className={config.className}>{role}</Badge>;
  };

  // Stat card component for cleaner code
  const StatPill = ({ icon: Icon, label, value, subValue }: { icon: typeof Users; label: string; value: number | string; subValue?: string }) => (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-card rounded-xl border shadow-sm hover:shadow-md transition-shadow">
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold leading-none">{value}</p>
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        {subValue && <p className="text-[10px] text-muted-foreground/70">{subValue}</p>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Compact Header */}
      <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-2.5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-display font-semibold hidden sm:inline">Super Admin</span>
              </div>
            </div>

            {/* Global Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search families, providers, users..."
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  className="pl-9 h-9 bg-muted/50 border-0 focus-visible:ring-1"
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Button size="sm" onClick={() => setIsCreatingProvider(true)} className="h-8 gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Provider</span>
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setIsCreatingFamily(true)} className="h-8 gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Family</span>
              </Button>
              <Button variant="ghost" size="icon" onClick={refetch} disabled={isLoadingStats} className="h-8 w-8">
                <RefreshCw className={`h-4 w-4 ${isLoadingStats ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4">
        {error ? (
          <Card className="border-destructive/50 animate-scale-in">
            <CardContent className="pt-6 text-center">
              <p className="text-destructive">{error}</p>
              <Button onClick={refetch} className="mt-4">Try Again</Button>
            </CardContent>
          </Card>
        ) : isLoadingStats && !stats ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading dashboard...</p>
            </div>
          </div>
        ) : stats ? (
          <div className="space-y-4 animate-fade-in">
            {/* Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
              <StatPill icon={Users} label="Families" value={stats.overview.total_families} />
              <StatPill icon={Building2} label="Providers" value={stats.overview.total_organizations} />
              <StatPill icon={User} label="Users" value={stats.overview.total_users} />
              <StatPill icon={MessageCircle} label="Messages" value={stats.overview.messages_this_month} subValue="30 days" />
              <StatPill icon={MapPin} label="Check-ins" value={stats.overview.checkins_this_week} subValue="7 days" />
              <StatPill icon={DollarSign} label="Requests" value={stats.overview.financial_requests_this_month} subValue="30 days" />
              <StatPill icon={BarChart3} label="Avg/Family" value={stats.overview.total_families > 0 ? Math.round(stats.overview.messages_this_month / stats.overview.total_families) : 0} subValue="msgs/mo" />
            </div>

            {/* Main Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3">
              <TabsList className="h-9 p-1 bg-muted/50">
                <TabsTrigger value="families" className="h-7 text-xs gap-1.5 data-[state=active]:shadow-sm">
                  <Users className="h-3.5 w-3.5" />
                  Families
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px] ml-1">{filteredFamilies.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="organizations" className="h-7 text-xs gap-1.5 data-[state=active]:shadow-sm">
                  <Building2 className="h-3.5 w-3.5" />
                  Providers
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px] ml-1">{filteredOrgs.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="users" className="h-7 text-xs gap-1.5 data-[state=active]:shadow-sm">
                  <User className="h-3.5 w-3.5" />
                  Users
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px] ml-1">{filteredUsers.length}</Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="families" className="mt-0">
                <Card className="border-0 shadow-sm">
                  <ScrollArea className="h-[calc(100vh-280px)]">
                    <div className="divide-y">
                      {filteredFamilies.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground">
                          <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                          <p>No families found</p>
                        </div>
                      ) : (
                        filteredFamilies.map((family, i) => {
                          const activity = getActivityIndicator(family.total_activity);
                          return (
                            <div
                              key={family.id}
                              className="flex items-center gap-4 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors group"
                              onClick={() => fetchFamilyDetails(family.id)}
                              style={{ animationDelay: `${i * 20}ms` }}
                            >
                              <div 
                                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden border"
                                style={{ 
                                  backgroundColor: family.organization_primary_color ? `hsl(${family.organization_primary_color})` : undefined,
                                  borderColor: family.organization_primary_color ? `hsl(${family.organization_primary_color})` : 'hsl(var(--border))'
                                }}
                              >
                                {family.organization_logo_url ? (
                                  <img 
                                    src={family.organization_logo_url} 
                                    alt={`${family.organization_name} logo`}
                                    className="w-full h-full object-contain bg-white p-0.5 rounded"
                                  />
                                ) : (
                                  <Users className="h-4 w-4 text-primary" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium truncate">{family.name}</p>
                                  <span className={`w-2 h-2 rounded-full ${activity.color} flex-shrink-0`} title={activity.label} />
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span className="font-mono">{family.account_number}</span>
                                  {family.organization_name && (
                                    <span className="flex items-center gap-1">
                                      <Building2 className="h-3 w-3" />
                                      {family.organization_name}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="hidden sm:flex items-center gap-6 text-xs text-center">
                                <div>
                                  <p className="font-semibold text-sm">{family.messages_last_30_days}</p>
                                  <p className="text-muted-foreground">msgs</p>
                                </div>
                                <div>
                                  <p className="font-semibold text-sm">{family.checkins_last_30_days}</p>
                                  <p className="text-muted-foreground">checkins</p>
                                </div>
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
                            </div>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                </Card>
              </TabsContent>

              <TabsContent value="organizations" className="mt-0">
                <Card className="border-0 shadow-sm">
                  <ScrollArea className="h-[calc(100vh-280px)]">
                    <div className="divide-y">
                      {filteredOrgs.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground">
                          <Building2 className="h-10 w-10 mx-auto mb-2 opacity-30" />
                          <p>No providers found</p>
                        </div>
                      ) : (
                        filteredOrgs.map((org, i) => {
                          const hasBranding = org.logo_url || org.primary_color;
                          return (
                            <div
                              key={org.id}
                              className="flex items-center gap-4 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors group relative overflow-hidden"
                              onClick={() => fetchOrgDetails(org.id)}
                              style={{ animationDelay: `${i * 20}ms` }}
                            >
                              {/* Brand color accent bar */}
                              {org.primary_color && (
                                <div 
                                  className="absolute left-0 top-0 bottom-0 w-1"
                                  style={{ backgroundColor: `hsl(${org.primary_color})` }}
                                />
                              )}
                              
                              {/* Logo or fallback icon */}
                              <div 
                                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden border"
                                style={{ 
                                  backgroundColor: org.background_color ? `hsl(${org.background_color})` : undefined,
                                  borderColor: org.primary_color ? `hsl(${org.primary_color})` : undefined
                                }}
                              >
                                {org.logo_url ? (
                                  <img 
                                    src={org.logo_url} 
                                    alt={`${org.name} logo`}
                                    className="w-full h-full object-contain"
                                  />
                                ) : (
                                  <Building2 
                                    className="h-4 w-4" 
                                    style={{ color: org.primary_color ? `hsl(${org.primary_color})` : undefined }}
                                  />
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium truncate">{org.name}</p>
                                  {hasBranding && (
                                    <div className="flex items-center gap-0.5">
                                      {org.primary_color && (
                                        <div 
                                          className="w-3 h-3 rounded-full border border-white/50 shadow-sm" 
                                          style={{ backgroundColor: `hsl(${org.primary_color})` }}
                                          title="Primary color"
                                        />
                                      )}
                                      {org.secondary_color && (
                                        <div 
                                          className="w-3 h-3 rounded-full border border-white/50 shadow-sm -ml-1" 
                                          style={{ backgroundColor: `hsl(${org.secondary_color})` }}
                                          title="Secondary color"
                                        />
                                      )}
                                      {org.accent_color && (
                                        <div 
                                          className="w-3 h-3 rounded-full border border-white/50 shadow-sm -ml-1" 
                                          style={{ backgroundColor: `hsl(${org.accent_color})` }}
                                          title="Accent color"
                                        />
                                      )}
                                    </div>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">{org.subdomain}.familybridge.app</p>
                              </div>
                              <div className="hidden sm:block text-xs text-center">
                                <p className="font-semibold text-sm">{org.family_count}</p>
                                <p className="text-muted-foreground">families</p>
                              </div>
                              <div className="hidden sm:block text-xs text-muted-foreground">
                                {format(new Date(org.created_at), 'MMM yyyy')}
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
                            </div>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                </Card>
              </TabsContent>

              <TabsContent value="users" className="mt-0">
                <Card className="border-0 shadow-sm">
                  <ScrollArea className="h-[calc(100vh-280px)]">
                    <div className="divide-y">
                      {filteredUsers.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground">
                          <User className="h-10 w-10 mx-auto mb-2 opacity-30" />
                          <p>No users found</p>
                        </div>
                      ) : (
                        filteredUsers.map((u, i) => {
                          // Determine display roles with priority
                          const displayRoles: Array<{ label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; className?: string }> = [];
                          
                          if (u.is_super_admin) {
                            displayRoles.push({ label: 'Super Admin', variant: 'destructive' });
                          }
                          if (u.org_roles?.includes('owner')) {
                            displayRoles.push({ label: 'Provider Owner', variant: 'default', className: 'bg-violet-600' });
                          }
                          if (u.org_roles?.includes('admin')) {
                            displayRoles.push({ label: 'Provider Admin', variant: 'default', className: 'bg-violet-500' });
                          }
                          if (u.org_roles?.includes('staff')) {
                            displayRoles.push({ label: 'Provider Staff', variant: 'secondary' });
                          }
                          if (u.family_roles?.includes('moderator')) {
                            displayRoles.push({ label: 'Moderator', variant: 'default', className: 'bg-blue-600' });
                          }
                          if (u.family_roles?.includes('admin')) {
                            displayRoles.push({ label: 'Family Admin', variant: 'default', className: 'bg-emerald-600' });
                          }
                          if (u.family_roles?.includes('recovering')) {
                            displayRoles.push({ label: 'Recovering', variant: 'secondary', className: 'bg-amber-100 text-amber-800 border-amber-300' });
                          }
                          if (u.family_roles?.includes('member') && !displayRoles.some(r => r.label === 'Recovering')) {
                            displayRoles.push({ label: 'Family Member', variant: 'outline' });
                          }
                          
                          return (
                            <div
                              key={u.id}
                              className="flex items-center gap-4 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors group"
                              onClick={() => fetchUserDetails(u.id)}
                              style={{ animationDelay: `${i * 20}ms` }}
                            >
                              {/* Show provider logo for moderators/owners, otherwise avatar */}
                              {(u.org_roles?.includes('owner') || u.org_roles?.includes('admin') || u.family_roles?.includes('moderator')) && u.org_logo_url ? (
                                <div 
                                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden border"
                                  style={{ 
                                    borderColor: u.org_primary_color ? `hsl(${u.org_primary_color})` : 'hsl(var(--border))'
                                  }}
                                  title={u.org_name || undefined}
                                >
                                  <img 
                                    src={u.org_logo_url} 
                                    alt={`${u.org_name} logo`}
                                    className="w-full h-full object-contain bg-white p-0.5 rounded"
                                  />
                                </div>
                              ) : (
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={u.avatar_url || undefined} />
                                  <AvatarFallback className="bg-muted">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-medium truncate">{u.full_name}</p>
                                  <div className="flex items-center gap-1 flex-wrap">
                                    {displayRoles.slice(0, 3).map((role, idx) => (
                                      <Badge 
                                        key={idx} 
                                        variant={role.variant} 
                                        className={`text-[10px] px-1.5 py-0 h-5 ${role.className || ''}`}
                                      >
                                        {role.label}
                                      </Badge>
                                    ))}
                                    {displayRoles.length > 3 && (
                                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                                        +{displayRoles.length - 3}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Joined {format(new Date(u.created_at), 'MMM d, yyyy')}
                                </p>
                              </div>
                              <div className="hidden sm:block text-xs text-center">
                                <p className="font-semibold text-sm">{u.family_count}</p>
                                <p className="text-muted-foreground">families</p>
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
                            </div>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : null}
      </main>

      {/* Family Details Dialog */}
      <Dialog open={!!selectedFamilyId} onOpenChange={() => { setSelectedFamilyId(null); setFamilyDetails(null); setIsEditing(false); }}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  {familyDetails?.family.name || 'Family Details'}
                </span>
                {familyDetails?.family.account_number && (
                  <Badge variant="outline" className="font-mono text-xs w-fit mt-1.5">
                    {familyDetails.family.account_number}
                  </Badge>
                )}
              </div>
              {familyDetails && !isEditing && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                    <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={() => setDeleteConfirm({ type: 'family', id: familyDetails.family.id, name: familyDetails.family.name })}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
                  </Button>
                </div>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {isLoadingDetails ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : familyDetails ? (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-5 pr-4">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <Label>Name</Label>
                      <Input value={editForm.name || ''} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Input value={editForm.description || ''} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSave} disabled={isLoadingDetails}>
                        {isLoadingDetails && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Save
                      </Button>
                      <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-2xl font-bold">{familyDetails.members.length}</p>
                        <p className="text-xs text-muted-foreground">Members</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-2xl font-bold">{familyDetails.recent_messages.length}</p>
                        <p className="text-xs text-muted-foreground">Messages</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-2xl font-bold">{familyDetails.recent_checkins.length}</p>
                        <p className="text-xs text-muted-foreground">Check-ins</p>
                      </div>
                    </div>

                    {familyDetails.organization_name && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        {familyDetails.organization_name}
                      </div>
                    )}

                    <div>
                      <h4 className="text-sm font-medium mb-2">Members</h4>
                      <div className="space-y-1.5">
                        {familyDetails.members.map((member) => (
                          <div 
                            key={member.id} 
                            className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => { setSelectedFamilyId(null); fetchUserDetails(member.user_id); }}
                          >
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7">
                                <AvatarImage src={member.profiles?.avatar_url || undefined} />
                                <AvatarFallback><User className="h-3 w-3" /></AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">{member.profiles?.full_name || 'Unknown'}</span>
                            </div>
                            {getRoleBadge(member.role)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Organization Details Dialog */}
      <Dialog open={!!selectedOrgId} onOpenChange={() => { setSelectedOrgId(null); setOrgDetails(null); setIsEditing(false); }}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-secondary-foreground" />
                </div>
                {orgDetails?.organization.name || 'Provider Details'}
              </span>
              {orgDetails && !isEditing && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                    <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={() => setDeleteConfirm({ type: 'org', id: orgDetails.organization.id, name: orgDetails.organization.name })}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
                  </Button>
                </div>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {isLoadingDetails ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : orgDetails ? (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-5 pr-4">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <Label>Name</Label>
                      <Input value={editForm.name || ''} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                    </div>
                    <div>
                      <Label>Subdomain</Label>
                      <Input value={editForm.subdomain || ''} onChange={(e) => setEditForm({ ...editForm, subdomain: e.target.value })} />
                    </div>
                    <div>
                      <Label>Tagline</Label>
                      <Input value={editForm.tagline || ''} onChange={(e) => setEditForm({ ...editForm, tagline: e.target.value })} />
                    </div>
                    <div>
                      <Label>Support Email</Label>
                      <Input value={editForm.support_email || ''} onChange={(e) => setEditForm({ ...editForm, support_email: e.target.value })} />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input value={editForm.phone || ''} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                    </div>
                    <div>
                      <Label>Website URL</Label>
                      <Input value={editForm.website_url || ''} onChange={(e) => setEditForm({ ...editForm, website_url: e.target.value })} />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSave} disabled={isLoadingDetails}>
                        {isLoadingDetails && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Save
                      </Button>
                      <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-2xl font-bold">{orgDetails.families.length}</p>
                        <p className="text-xs text-muted-foreground">Families</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-2xl font-bold">{orgDetails.members.length}</p>
                        <p className="text-xs text-muted-foreground">Team Members</p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Globe className="h-4 w-4" />
                        {orgDetails.organization.subdomain}.familybridge.app
                      </p>
                      {orgDetails.organization.support_email && (
                        <p className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          {orgDetails.organization.support_email}
                        </p>
                      )}
                      {orgDetails.organization.phone && (
                        <p className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          {orgDetails.organization.phone}
                        </p>
                      )}
                    </div>

                    {orgDetails.members.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Team</h4>
                        <div className="space-y-1.5">
                          {orgDetails.members.map((member) => (
                            <div 
                              key={member.id} 
                              className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                              onClick={() => { setSelectedOrgId(null); fetchUserDetails(member.user_id); }}
                            >
                              <div className="flex items-center gap-2">
                                <Avatar className="h-7 w-7">
                                  <AvatarImage src={member.profiles?.avatar_url || undefined} />
                                  <AvatarFallback><User className="h-3 w-3" /></AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium">{member.profiles?.full_name || 'Unknown'}</span>
                              </div>
                              {getRoleBadge(member.role)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {orgDetails.families.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Families</h4>
                        <div className="space-y-1.5">
                          {orgDetails.families.map((family) => (
                            <div 
                              key={family.id} 
                              className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                              onClick={() => { setSelectedOrgId(null); fetchFamilyDetails(family.id); }}
                            >
                              <span className="text-sm font-medium flex items-center gap-2">
                                <Users className="h-3.5 w-3.5 text-primary" />
                                {family.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(family.created_at), 'MMM yyyy')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </ScrollArea>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={!!selectedUserId} onOpenChange={() => { setSelectedUserId(null); setUserDetails(null); setIsEditing(false); }}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={userDetails?.profile?.avatar_url || undefined} />
                  <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                </Avatar>
                {userDetails?.profile?.full_name || 'User Details'}
              </span>
              {userDetails && !isEditing && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                    <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={() => setDeleteConfirm({ type: 'user', id: userDetails.profile.id, name: userDetails.profile.full_name })}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
                  </Button>
                </div>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {isLoadingDetails ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : userDetails ? (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-5 pr-4">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <Label>Full Name</Label>
                      <Input value={editForm.full_name || ''} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSave} disabled={isLoadingDetails}>
                        {isLoadingDetails && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Save
                      </Button>
                      <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 text-sm">
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        {userDetails.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Joined {format(new Date(userDetails.created_at), 'PPP')}
                      </p>
                      {userDetails.last_sign_in && (
                        <p className="text-xs text-muted-foreground">
                          Last seen {format(new Date(userDetails.last_sign_in), 'PPP p')}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-2xl font-bold">{userDetails.family_memberships.length}</p>
                        <p className="text-xs text-muted-foreground">Families</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-2xl font-bold">{userDetails.organization_memberships.length}</p>
                        <p className="text-xs text-muted-foreground">Organizations</p>
                      </div>
                    </div>

                    {userDetails.family_memberships.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Families</h4>
                        <div className="space-y-1.5">
                          {userDetails.family_memberships.map((m) => (
                            <div 
                              key={m.id} 
                              className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                              onClick={() => {
                                if (m.families?.id) {
                                  setSelectedUserId(null);
                                  fetchFamilyDetails(m.families.id);
                                }
                              }}
                            >
                              <span className="text-sm font-medium flex items-center gap-2">
                                <Users className="h-3.5 w-3.5 text-primary" />
                                {m.families?.name || 'Unknown'}
                              </span>
                              {getRoleBadge(m.role)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {userDetails.organization_memberships.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Organizations</h4>
                        <div className="space-y-1.5">
                          {userDetails.organization_memberships.map((m) => (
                            <div 
                              key={m.id} 
                              className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                              onClick={() => {
                                if (m.organizations?.id) {
                                  setSelectedUserId(null);
                                  fetchOrgDetails(m.organizations.id);
                                }
                              }}
                            >
                              <span className="text-sm font-medium flex items-center gap-2">
                                <Building2 className="h-3.5 w-3.5 text-primary" />
                                {m.organizations?.name || 'Unknown'}
                              </span>
                              {getRoleBadge(m.role)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </ScrollArea>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteConfirm?.name}</strong> and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Provider Dialog */}
      <Dialog open={isCreatingProvider} onOpenChange={setIsCreatingProvider}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                <Building2 className="h-4 w-4 text-secondary-foreground" />
              </div>
              Create Provider
            </DialogTitle>
            <DialogDescription>
              Create a new provider organization to manage multiple family groups.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Provider Name *</Label>
              <Input
                placeholder="Recovery Center Name"
                value={providerForm.name}
                onChange={(e) => setProviderForm({ ...providerForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Subdomain *</Label>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="myrecovery"
                  value={providerForm.subdomain}
                  onChange={(e) => setProviderForm({ ...providerForm, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">.familybridge.app</span>
              </div>
            </div>
            <div>
              <Label>Support Email</Label>
              <Input
                type="email"
                placeholder="support@example.com"
                value={providerForm.support_email}
                onChange={(e) => setProviderForm({ ...providerForm, support_email: e.target.value })}
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                placeholder="(555) 123-4567"
                value={providerForm.phone}
                onChange={(e) => setProviderForm({ ...providerForm, phone: e.target.value })}
              />
            </div>
            <div>
              <Label>Website</Label>
              <Input
                placeholder="https://example.com"
                value={providerForm.website_url}
                onChange={(e) => setProviderForm({ ...providerForm, website_url: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreatingProvider(false)}>Cancel</Button>
            <Button onClick={handleCreateProvider} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Family Dialog */}
      <Dialog open={isCreatingFamily} onOpenChange={setIsCreatingFamily}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-primary" />
              </div>
              Create Family Group
            </DialogTitle>
            <DialogDescription>
              Create a new family group, optionally assigned to a provider.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Family Name *</Label>
              <Input
                placeholder="The Smith Family"
                value={familyForm.name}
                onChange={(e) => setFamilyForm({ ...familyForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                placeholder="Optional description..."
                value={familyForm.description}
                onChange={(e) => setFamilyForm({ ...familyForm, description: e.target.value })}
                rows={2}
              />
            </div>
            <div>
              <Label>Assign to Provider</Label>
              <Select 
                value={familyForm.organization_id || 'standalone'} 
                onValueChange={(value) => setFamilyForm({ ...familyForm, organization_id: value === 'standalone' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a provider..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standalone">Standalone (No Provider)</SelectItem>
                  {stats?.organizations?.map((org) => (
                    <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Leave as "Standalone" if not affiliated with a provider.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreatingFamily(false)}>Cancel</Button>
            <Button onClick={handleCreateFamily} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdmin;
