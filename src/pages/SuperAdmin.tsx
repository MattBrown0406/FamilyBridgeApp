import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  User
} from 'lucide-react';
import { format } from 'date-fns';

interface FamilyDetails {
  family: {
    id: string;
    name: string;
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

const SuperAdmin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isVerifying, stats, isLoadingStats, error, refetch } = useSuperAdmin();
  const [familySearch, setFamilySearch] = useState('');
  const [orgSearch, setOrgSearch] = useState('');
  
  // Detail dialog states
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [familyDetails, setFamilyDetails] = useState<FamilyDetails | null>(null);
  const [orgDetails, setOrgDetails] = useState<OrgDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const fetchFamilyDetails = async (familyId: string) => {
    setSelectedFamilyId(familyId);
    setIsLoadingDetails(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-admin-stats', {
        body: {},
        headers: {},
      });
      
      // Use query params approach
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-admin-stats?family_id=${familyId}`,
        {
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );
      const detailData = await response.json();
      setFamilyDetails(detailData);
    } catch (err) {
      console.error('Error fetching family details:', err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const fetchOrgDetails = async (orgId: string) => {
    setSelectedOrgId(orgId);
    setIsLoadingDetails(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-admin-stats?org_id=${orgId}`,
        {
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );
      const detailData = await response.json();
      setOrgDetails(detailData);
    } catch (err) {
      console.error('Error fetching org details:', err);
    } finally {
      setIsLoadingDetails(false);
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

  const filteredFamilies = stats?.families.filter(f => 
    f.name.toLowerCase().includes(familySearch.toLowerCase()) ||
    (f.organization_name && f.organization_name.toLowerCase().includes(familySearch.toLowerCase()))
  ) || [];

  const filteredOrgs = stats?.organizations.filter(o =>
    o.name.toLowerCase().includes(orgSearch.toLowerCase()) ||
    o.subdomain.toLowerCase().includes(orgSearch.toLowerCase())
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
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Home
              </Button>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <h1 className="text-xl font-display font-semibold">Super Admin</h1>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refetch}
              disabled={isLoadingStats}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingStats ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">Families</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.overview.total_families}</p>
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
            </div>

            {/* Additional Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">Total Users</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.overview.total_users}</p>
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

            {/* Tabs for Families and Organizations */}
            <Tabs defaultValue="families" className="space-y-4">
              <TabsList>
                <TabsTrigger value="families" className="gap-2">
                  <Users className="h-4 w-4" />
                  Families ({stats.families.length})
                </TabsTrigger>
                <TabsTrigger value="organizations" className="gap-2">
                  <Building2 className="h-4 w-4" />
                  Organizations ({stats.organizations.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="families" className="space-y-4">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search families..."
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
            </Tabs>
          </>
        ) : null}
      </main>

      {/* Family Details Dialog */}
      <Dialog open={!!selectedFamilyId} onOpenChange={() => { setSelectedFamilyId(null); setFamilyDetails(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {familyDetails?.family.name || 'Family Details'}
            </DialogTitle>
          </DialogHeader>
          
          {isLoadingDetails ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : familyDetails ? (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-6 pr-4">
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
                      <div key={member.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
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

                <div className="pt-4">
                  <Button 
                    className="w-full" 
                    onClick={() => {
                      setSelectedFamilyId(null);
                      navigate(`/family/${familyDetails.family.id}`);
                    }}
                  >
                    Open Family Chat
                  </Button>
                </div>
              </div>
            </ScrollArea>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Organization Details Dialog */}
      <Dialog open={!!selectedOrgId} onOpenChange={() => { setSelectedOrgId(null); setOrgDetails(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {orgDetails?.organization.name || 'Organization Details'}
            </DialogTitle>
          </DialogHeader>
          
          {isLoadingDetails ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : orgDetails ? (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-6 pr-4">
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
                      <div key={member.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
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
              </div>
            </ScrollArea>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdmin;