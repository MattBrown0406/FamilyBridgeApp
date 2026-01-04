import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Eye,
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';

const SuperAdmin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isVerifying, stats, isLoadingStats, error, refetch } = useSuperAdmin();
  const [familySearch, setFamilySearch] = useState('');
  const [orgSearch, setOrgSearch] = useState('');

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
                    <CardDescription>Sorted by activity (most active first)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {filteredFamilies.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">No families found</p>
                      ) : (
                        filteredFamilies.map((family) => (
                          <div 
                            key={family.id}
                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
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
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => navigate(`/family/${family.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
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
                    <CardDescription>Provider accounts with family counts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {filteredOrgs.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">No organizations found</p>
                      ) : (
                        filteredOrgs.map((org) => (
                          <div 
                            key={org.id}
                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
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
    </div>
  );
};

export default SuperAdmin;
