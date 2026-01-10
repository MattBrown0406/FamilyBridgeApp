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
  Trash2
} from 'lucide-react';
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
  }>;
  users: Array<{
    id: string;
    full_name: string;
    avatar_url: string | null;
    created_at: string;
    family_count: number;
  }>;
}

const SuperAdmin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isVerifying, stats: rawStats, isLoadingStats, error, refetch } = useSuperAdmin();
  const stats = rawStats as AdminStats | null;
  
  const [familySearch, setFamilySearch] = useState('');
  const [orgSearch, setOrgSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  
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

  const getAuthHeaders = async () => {
    // Refresh session to ensure we have valid tokens
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session?.access_token) {
      // Try to refresh the session
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
        // Refresh details
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

  if (authLoading || isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Verifying access...
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 text-destructive mx-auto mb-4" />
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

  const filteredFamilies = stats?.families?.filter(f => 
    f.name.toLowerCase().includes(familySearch.toLowerCase()) ||
    f.account_number.toLowerCase().includes(familySearch.toLowerCase()) ||
    (f.organization_name && f.organization_name.toLowerCase().includes(familySearch.toLowerCase()))
  ) || [];

  const filteredOrgs = stats?.organizations?.filter(o =>
    o.name.toLowerCase().includes(orgSearch.toLowerCase()) ||
    o.subdomain.toLowerCase().includes(orgSearch.toLowerCase())
  ) || [];

  const filteredUsers = stats?.users?.filter(u =>
    u.full_name.toLowerCase().includes(userSearch.toLowerCase())
  ) || [];

  const getActivityBadge = (activity: number) => {
    if (activity === 0) {
      return <Badge variant="outline" className="text-muted-foreground"><Minus className="h-3 w-3 mr-1" />Inactive</Badge>;
    }
    if (activity < 10) {
      return <Badge variant="outline" className="text-orange-600"><TrendingDown className="h-3 w-3 mr-1" />Low</Badge>;
    }
    if (activity < 50) {
      return <Badge variant="secondary"><Minus className="h-3 w-3 mr-1" />Moderate</Badge>;
    }
    return <Badge className="bg-green-600"><TrendingUp className="h-3 w-3 mr-1" />Active</Badge>;
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'moderator':
        return <Badge className="bg-primary">Moderator</Badge>;
      case 'recovering':
        return <Badge variant="secondary">Recovering</Badge>;
      case 'owner':
        return <Badge className="bg-primary">Owner</Badge>;
      case 'admin':
        return <Badge variant="secondary">Admin</Badge>;
      case 'staff':
        return <Badge variant="outline">Staff</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="px-2 sm:px-3">
                <ArrowLeft className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Home</span>
              </Button>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                <h1 className="text-base sm:text-xl font-display font-semibold">Super Admin</h1>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refetch}
              disabled={isLoadingStats}
              className="px-2 sm:px-3"
            >
              <RefreshCw className={`h-4 w-4 sm:mr-2 ${isLoadingStats ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {error ? (
          <Card className="border-destructive">
            <CardContent className="pt-6 text-center">
              <p className="text-destructive">{error}</p>
              <Button onClick={refetch} className="mt-4">Try Again</Button>
            </CardContent>
          </Card>
        ) : isLoadingStats && !stats ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : stats ? (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-8">
              <Card>
                <CardContent className="p-3 sm:pt-4">
                  <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground mb-1">
                    <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm">Families</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold">{stats.overview.total_families}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Building2 className="h-4 w-4" />
                    <span className="text-sm">Organizations</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.overview.total_organizations}</p>
                </CardContent>
              </Card>
              
              <Card 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => {/* Users tab will handle this */}}
              >
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <User className="h-4 w-4" />
                    <span className="text-sm">Total Users</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.overview.total_users}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <MessageCircle className="h-4 w-4" />
                    <span className="text-sm">Messages (30d)</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.overview.messages_this_month}</p>
                  <p className="text-xs text-muted-foreground">{stats.overview.messages_this_week} this week</p>
                </CardContent>
              </Card>
            </div>

            {/* Additional Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">Check-ins (7d)</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.overview.checkins_this_week}</p>
                  <p className="text-xs text-muted-foreground">{stats.overview.total_checkins} total</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm">Financial Requests (30d)</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.overview.financial_requests_this_month}</p>
                  <p className="text-xs text-muted-foreground">{stats.overview.total_financial_requests} total</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <BarChart3 className="h-4 w-4" />
                    <span className="text-sm">Avg Messages/Family</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {stats.overview.total_families > 0 
                      ? Math.round(stats.overview.messages_this_month / stats.overview.total_families)
                      : 0}
                  </p>
                  <p className="text-xs text-muted-foreground">last 30 days</p>
                </CardContent>
              </Card>
            </div>

            {/* Tabs for Families, Organizations, and Users */}
            <Tabs defaultValue="families" className="space-y-4">
              <TabsList>
                <TabsTrigger value="families" className="gap-2">
                  <Users className="h-4 w-4" />
                  Families ({stats.families?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="organizations" className="gap-2">
                  <Building2 className="h-4 w-4" />
                  Organizations ({stats.organizations?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="users" className="gap-2">
                  <User className="h-4 w-4" />
                  Users ({stats.users?.length || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="families" className="space-y-4">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or account number..."
                    value={familySearch}
                    onChange={(e) => setFamilySearch(e.target.value)}
                    className="max-w-sm"
                  />
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">All Families</CardTitle>
                    <CardDescription>Sorted by activity (most active first). Click to view details.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {filteredFamilies.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">No families found</p>
                      ) : (
                        filteredFamilies.map((family) => (
                          <div 
                            key={family.id}
                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                            onClick={() => fetchFamilyDetails(family.id)}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium">{family.name}</h3>
                                <Badge variant="outline" className="font-mono text-xs">{family.account_number}</Badge>
                                {getActivityBadge(family.total_activity)}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                {family.organization_name && (
                                  <span className="flex items-center gap-1">
                                    <Building2 className="h-3 w-3" />
                                    {family.organization_name}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(family.created_at), 'MMM d, yyyy')}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-6 text-sm">
                              <div className="text-center">
                                <p className="font-medium">{family.messages_last_30_days}</p>
                                <p className="text-xs text-muted-foreground">messages</p>
                              </div>
                              <div className="text-center">
                                <p className="font-medium">{family.checkins_last_30_days}</p>
                                <p className="text-xs text-muted-foreground">check-ins</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="organizations" className="space-y-4">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search organizations..."
                    value={orgSearch}
                    onChange={(e) => setOrgSearch(e.target.value)}
                    className="max-w-sm"
                  />
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">All Organizations</CardTitle>
                    <CardDescription>Provider accounts with family counts. Click to view details.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {filteredOrgs.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">No organizations found</p>
                      ) : (
                        filteredOrgs.map((org) => (
                          <div 
                            key={org.id}
                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                            onClick={() => fetchOrgDetails(org.id)}
                          >
                            <div className="flex-1">
                              <h3 className="font-medium">{org.name}</h3>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                <span>{org.subdomain}.familybridge.app</span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(org.created_at), 'MMM d, yyyy')}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-center">
                                <p className="font-medium">{org.family_count}</p>
                                <p className="text-xs text-muted-foreground">families</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="users" className="space-y-4">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="max-w-sm"
                  />
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">All Users</CardTitle>
                    <CardDescription>Click to view details and manage users.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {filteredUsers.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">No users found</p>
                      ) : (
                        filteredUsers.map((u) => (
                          <div 
                            key={u.id}
                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                            onClick={() => fetchUserDetails(u.id)}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={u.avatar_url || undefined} />
                                <AvatarFallback>
                                  <User className="h-5 w-5" />
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-medium">{u.full_name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  Joined {format(new Date(u.created_at), 'MMM d, yyyy')}
                                </p>
                              </div>
                            </div>
                            <div className="text-center">
                              <p className="font-medium">{u.family_count}</p>
                              <p className="text-xs text-muted-foreground">families</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        ) : null}
      </main>

      {/* Family Details Dialog */}
      <Dialog open={!!selectedFamilyId} onOpenChange={() => { setSelectedFamilyId(null); setFamilyDetails(null); setIsEditing(false); }}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {familyDetails?.family.name || 'Family Details'}
                </span>
                {familyDetails?.family.account_number && (
                  <Badge variant="outline" className="font-mono text-xs w-fit mt-1">
                    {familyDetails.family.account_number}
                  </Badge>
                )}
              </div>
              {familyDetails && !isEditing && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                    <Pencil className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={() => setDeleteConfirm({ type: 'family', id: familyDetails.family.id, name: familyDetails.family.name })}
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </div>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {isLoadingDetails ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : familyDetails ? (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-6 pr-4">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <Label>Name</Label>
                      <Input 
                        value={editForm.name || ''} 
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Input 
                        value={editForm.description || ''} 
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSave} disabled={isLoadingDetails}>
                        {isLoadingDetails ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Save
                      </Button>
                      <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Family Info */}
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Info</h4>
                      <div className="text-sm space-y-1">
                        {familyDetails.family.description && (
                          <p>{familyDetails.family.description}</p>
                        )}
                        <p className="text-muted-foreground">
                          Created {format(new Date(familyDetails.family.created_at), 'PPP')}
                        </p>
                        {familyDetails.organization_name && (
                          <p className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {familyDetails.organization_name}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Members */}
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">
                        Members ({familyDetails.members.length})
                      </h4>
                      <div className="space-y-2">
                        {familyDetails.members.map((member) => (
                          <div 
                            key={member.id} 
                            className="flex items-center justify-between p-2 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted"
                            onClick={() => { setSelectedFamilyId(null); fetchUserDetails(member.user_id); }}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={member.profiles?.avatar_url || undefined} />
                                <AvatarFallback>
                                  <User className="h-4 w-4" />
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{member.profiles?.full_name || 'Unknown'}</p>
                                <p className="text-xs text-muted-foreground">
                                  {member.relationship_type || 'Member'}
                                </p>
                              </div>
                            </div>
                            {getRoleBadge(member.role)}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recent Messages */}
                    {familyDetails.recent_messages.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">
                          Recent Messages ({familyDetails.recent_messages.length})
                        </h4>
                        <div className="space-y-2 text-sm">
                          {familyDetails.recent_messages.slice(0, 5).map((msg) => (
                            <div key={msg.id} className="p-2 bg-muted/50 rounded-lg">
                              <p className="line-clamp-2">{msg.content}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {format(new Date(msg.created_at), 'MMM d, h:mm a')}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recent Check-ins */}
                    {familyDetails.recent_checkins.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">
                          Recent Check-ins ({familyDetails.recent_checkins.length})
                        </h4>
                        <div className="space-y-2 text-sm">
                          {familyDetails.recent_checkins.slice(0, 5).map((checkin) => (
                            <div key={checkin.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-primary" />
                                <span>{checkin.meeting_type}</span>
                                {checkin.meeting_name && <span className="text-muted-foreground">- {checkin.meeting_name}</span>}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(checkin.checked_in_at), 'MMM d')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recent Financial Requests */}
                    {familyDetails.recent_requests.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">
                          Recent Financial Requests
                        </h4>
                        <div className="space-y-2 text-sm">
                          {familyDetails.recent_requests.slice(0, 5).map((req) => (
                            <div key={req.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-green-600" />
                                <span>${req.amount}</span>
                                <span className="text-muted-foreground">- {req.reason}</span>
                              </div>
                              <Badge variant={req.status === 'approved' ? 'default' : req.status === 'denied' ? 'destructive' : 'secondary'}>
                                {req.status}
                              </Badge>
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

      {/* Organization Details Dialog */}
      <Dialog open={!!selectedOrgId} onOpenChange={() => { setSelectedOrgId(null); setOrgDetails(null); setIsEditing(false); }}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {orgDetails?.organization.name || 'Organization Details'}
              </span>
              {orgDetails && !isEditing && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                    <Pencil className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={() => setDeleteConfirm({ type: 'org', id: orgDetails.organization.id, name: orgDetails.organization.name })}
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </div>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {isLoadingDetails ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : orgDetails ? (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-6 pr-4">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <Label>Name</Label>
                      <Input 
                        value={editForm.name || ''} 
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Subdomain</Label>
                      <Input 
                        value={editForm.subdomain || ''} 
                        onChange={(e) => setEditForm({ ...editForm, subdomain: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Tagline</Label>
                      <Input 
                        value={editForm.tagline || ''} 
                        onChange={(e) => setEditForm({ ...editForm, tagline: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Support Email</Label>
                      <Input 
                        value={editForm.support_email || ''} 
                        onChange={(e) => setEditForm({ ...editForm, support_email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input 
                        value={editForm.phone || ''} 
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Website URL</Label>
                      <Input 
                        value={editForm.website_url || ''} 
                        onChange={(e) => setEditForm({ ...editForm, website_url: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSave} disabled={isLoadingDetails}>
                        {isLoadingDetails ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Save
                      </Button>
                      <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Org Info */}
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Info</h4>
                      <div className="space-y-2">
                        {orgDetails.organization.logo_url && (
                          <img 
                            src={orgDetails.organization.logo_url} 
                            alt={orgDetails.organization.name} 
                            className="h-12 w-auto object-contain"
                          />
                        )}
                        {orgDetails.organization.tagline && (
                          <p className="text-sm italic">{orgDetails.organization.tagline}</p>
                        )}
                        <div className="text-sm space-y-1">
                          <p className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            {orgDetails.organization.subdomain}.familybridge.app
                          </p>
                          {orgDetails.organization.support_email && (
                            <p className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              {orgDetails.organization.support_email}
                            </p>
                          )}
                          {orgDetails.organization.phone && (
                            <p className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              {orgDetails.organization.phone}
                            </p>
                          )}
                          {orgDetails.organization.website_url && (
                            <a 
                              href={orgDetails.organization.website_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-primary hover:underline"
                            >
                              <Globe className="h-4 w-4" />
                              {orgDetails.organization.website_url}
                            </a>
                          )}
                          <p className="text-muted-foreground">
                            Created {format(new Date(orgDetails.organization.created_at), 'PPP')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Team Members */}
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">
                        Team Members ({orgDetails.members.length})
                      </h4>
                      <div className="space-y-2">
                        {orgDetails.members.map((member) => (
                          <div 
                            key={member.id} 
                            className="flex items-center justify-between p-2 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted"
                            onClick={() => { setSelectedOrgId(null); fetchUserDetails(member.user_id); }}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={member.profiles?.avatar_url || undefined} />
                                <AvatarFallback>
                                  <User className="h-4 w-4" />
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{member.profiles?.full_name || 'Unknown'}</p>
                                <p className="text-xs text-muted-foreground">
                                  Joined {format(new Date(member.joined_at), 'MMM d, yyyy')}
                                </p>
                              </div>
                            </div>
                            {getRoleBadge(member.role)}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Families */}
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">
                        Families ({orgDetails.families.length})
                      </h4>
                      <div className="space-y-2">
                        {orgDetails.families.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No families yet</p>
                        ) : (
                          orgDetails.families.map((family) => (
                            <div 
                              key={family.id} 
                              className="flex items-center justify-between p-2 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted"
                              onClick={() => {
                                setSelectedOrgId(null);
                                fetchFamilyDetails(family.id);
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-primary" />
                                <span className="font-medium text-sm">{family.name}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(family.created_at), 'MMM d, yyyy')}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={!!selectedUserId} onOpenChange={() => { setSelectedUserId(null); setUserDetails(null); setIsEditing(false); }}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {userDetails?.profile?.full_name || 'User Details'}
              </span>
              {userDetails && !isEditing && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                    <Pencil className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={() => setDeleteConfirm({ type: 'user', id: userDetails.profile.id, name: userDetails.profile.full_name })}
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </div>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {isLoadingDetails ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : userDetails ? (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-6 pr-4">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <Label>Full Name</Label>
                      <Input 
                        value={editForm.full_name || ''} 
                        onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSave} disabled={isLoadingDetails}>
                        {isLoadingDetails ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Save
                      </Button>
                      <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* User Info */}
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={userDetails.profile?.avatar_url || undefined} />
                        <AvatarFallback>
                          <User className="h-8 w-8" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-lg font-medium">{userDetails.profile?.full_name}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {userDetails.email}
                        </p>
                      </div>
                    </div>

                    <div className="text-sm space-y-1">
                      <p className="text-muted-foreground">
                        Joined {format(new Date(userDetails.created_at), 'PPP')}
                      </p>
                      {userDetails.last_sign_in && (
                        <p className="text-muted-foreground">
                          Last sign in: {format(new Date(userDetails.last_sign_in), 'PPP p')}
                        </p>
                      )}
                    </div>

                    {/* Family Memberships */}
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">
                        Family Memberships ({userDetails.family_memberships.length})
                      </h4>
                      <div className="space-y-2">
                        {userDetails.family_memberships.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No family memberships</p>
                        ) : (
                          userDetails.family_memberships.map((m) => (
                            <div 
                              key={m.id} 
                              className="flex items-center justify-between p-2 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted"
                              onClick={() => {
                                if (m.families?.id) {
                                  setSelectedUserId(null);
                                  fetchFamilyDetails(m.families.id);
                                }
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-primary" />
                                <span className="font-medium text-sm">{m.families?.name || 'Unknown'}</span>
                              </div>
                              {getRoleBadge(m.role)}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Organization Memberships */}
                    {userDetails.organization_memberships.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">
                          Organization Memberships ({userDetails.organization_memberships.length})
                        </h4>
                        <div className="space-y-2">
                          {userDetails.organization_memberships.map((m) => (
                            <div 
                              key={m.id} 
                              className="flex items-center justify-between p-2 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted"
                              onClick={() => {
                                if (m.organizations?.id) {
                                  setSelectedUserId(null);
                                  fetchOrgDetails(m.organizations.id);
                                }
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-primary" />
                                <span className="font-medium text-sm">{m.organizations?.name || 'Unknown'}</span>
                              </div>
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
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SuperAdmin;
