import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProviderAdmin } from '@/hooks/useProviderAdmin';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { 
  Building2, 
  Palette, 
  Users, 
  BarChart3, 
  Settings, 
  Upload,
  ArrowLeft,
  Plus,
  Eye,
  Type
} from 'lucide-react';

const ProviderAdmin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { 
    organizations, 
    isLoading, 
    isProvider, 
    createOrganization, 
    updateOrganization,
    uploadLogo,
    uploadFavicon
  } = useProviderAdmin();
  
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Create organization form
  const [newOrg, setNewOrg] = useState({
    name: '',
    subdomain: '',
    tagline: '',
    support_email: '',
    website_url: '',
    phone: '',
  });

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    tagline: '',
    support_email: '',
    website_url: '',
    phone: '',
    primary_color: '',
    primary_foreground_color: '',
    secondary_color: '',
    accent_color: '',
    background_color: '',
    foreground_color: '',
    heading_font: '',
    body_font: '',
  });

  const currentOrg = organizations.find(o => o.id === selectedOrg);

  // Load edit form when org is selected
  const handleSelectOrg = (orgId: string) => {
    const org = organizations.find(o => o.id === orgId);
    if (org) {
      setSelectedOrg(orgId);
      setEditForm({
        name: org.name,
        tagline: org.tagline || '',
        support_email: org.support_email || '',
        website_url: org.website_url || '',
        phone: org.phone || '',
        primary_color: org.primary_color,
        primary_foreground_color: org.primary_foreground_color,
        secondary_color: org.secondary_color,
        accent_color: org.accent_color,
        background_color: org.background_color,
        foreground_color: org.foreground_color,
        heading_font: org.heading_font,
        body_font: org.body_font,
      });
    }
  };

  const handleCreateOrg = async () => {
    if (!newOrg.name || !newOrg.subdomain) {
      toast({ title: 'Error', description: 'Name and subdomain are required', variant: 'destructive' });
      return;
    }

    // Validate subdomain format
    if (!/^[a-z0-9-]+$/.test(newOrg.subdomain)) {
      toast({ title: 'Error', description: 'Subdomain can only contain lowercase letters, numbers, and hyphens', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const org = await createOrganization(newOrg);
      toast({ title: 'Success', description: 'Organization created!' });
      setIsCreating(false);
      setNewOrg({ name: '', subdomain: '', tagline: '', support_email: '', website_url: '', phone: '' });
      handleSelectOrg(org.id);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to create organization', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedOrg) return;
    
    setIsSaving(true);
    try {
      await updateOrganization(selectedOrg, editForm);
      toast({ title: 'Success', description: 'Changes saved!' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to save changes', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedOrg || !e.target.files?.[0]) return;
    
    try {
      await uploadLogo(selectedOrg, e.target.files[0]);
      toast({ title: 'Success', description: 'Logo uploaded!' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to upload logo', variant: 'destructive' });
    }
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedOrg || !e.target.files?.[0]) return;
    
    try {
      await uploadFavicon(selectedOrg, e.target.files[0]);
      toast({ title: 'Success', description: 'Favicon uploaded!' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to upload favicon', variant: 'destructive' });
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  // Show create organization prompt if not a provider
  if (!isProvider && !isCreating) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="max-w-2xl mx-auto text-center">
            <Building2 className="h-16 w-16 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-display font-bold text-foreground mb-4">
              Become a Provider
            </h1>
            <p className="text-muted-foreground mb-8">
              Create your own branded version of FamilyBridge for your clients. 
              Perfect for treatment centers, therapists, sober coaches, and interventionists.
            </p>
            <Button onClick={() => setIsCreating(true)} size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Create Your Organization
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show create form
  if (isCreating) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Button variant="ghost" onClick={() => setIsCreating(false)} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <Card className="max-w-xl mx-auto">
            <CardHeader>
              <CardTitle>Create Your Organization</CardTitle>
              <CardDescription>
                Set up your branded version of FamilyBridge
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Organization Name *</Label>
                <Input
                  id="name"
                  placeholder="Recovery Solutions LLC"
                  value={newOrg.name}
                  onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subdomain">Subdomain *</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="subdomain"
                    placeholder="recovery-solutions"
                    value={newOrg.subdomain}
                    onChange={(e) => setNewOrg({ ...newOrg, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  />
                  <span className="text-muted-foreground text-sm whitespace-nowrap">.familybridge.app</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your clients will access the app at this address
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  placeholder="Supporting families through recovery"
                  value={newOrg.tagline}
                  onChange={(e) => setNewOrg({ ...newOrg, tagline: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Support Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="support@example.com"
                    value={newOrg.support_email}
                    onChange={(e) => setNewOrg({ ...newOrg, support_email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    placeholder="(555) 123-4567"
                    value={newOrg.phone}
                    onChange={(e) => setNewOrg({ ...newOrg, phone: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  placeholder="https://example.com"
                  value={newOrg.website_url}
                  onChange={(e) => setNewOrg({ ...newOrg, website_url: e.target.value })}
                />
              </div>
              
              <Button onClick={handleCreateOrg} disabled={isSaving} className="w-full">
                {isSaving ? 'Creating...' : 'Create Organization'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Provider dashboard
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <h1 className="text-2xl font-display font-bold text-foreground">
              Provider Admin
            </h1>
          </div>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Organization
          </Button>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Organization selector */}
          <div className="lg:col-span-1 space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground mb-3">
              Your Organizations
            </h2>
            {organizations.map((org) => (
              <Card 
                key={org.id}
                className={`cursor-pointer transition-colors ${
                  selectedOrg === org.id ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
                }`}
                onClick={() => handleSelectOrg(org.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {org.logo_url ? (
                      <img src={org.logo_url} alt={org.name} className="h-10 w-10 rounded object-contain" />
                    ) : (
                      <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-foreground">{org.name}</p>
                      <p className="text-xs text-muted-foreground">{org.subdomain}.familybridge.app</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main content */}
          <div className="lg:col-span-3">
            {selectedOrg && currentOrg ? (
              <Tabs defaultValue="branding" className="space-y-4">
                <TabsList className="grid grid-cols-4 w-full max-w-lg">
                  <TabsTrigger value="branding" className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    <span className="hidden sm:inline">Branding</span>
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span className="hidden sm:inline">Settings</span>
                  </TabsTrigger>
                  <TabsTrigger value="users" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="hidden sm:inline">Users</span>
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    <span className="hidden sm:inline">Analytics</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="branding" className="space-y-6">
                  {/* Logo & Favicon */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Logo & Favicon</CardTitle>
                      <CardDescription>Upload your organization's branding assets</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label>Logo</Label>
                          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                            {currentOrg.logo_url ? (
                              <img src={currentOrg.logo_url} alt="Logo" className="h-16 mx-auto mb-2 object-contain" />
                            ) : (
                              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleLogoUpload}
                              className="hidden"
                              id="logo-upload"
                            />
                            <Label htmlFor="logo-upload" className="cursor-pointer text-primary hover:underline">
                              Upload Logo
                            </Label>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <Label>Favicon</Label>
                          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                            {currentOrg.favicon_url ? (
                              <img src={currentOrg.favicon_url} alt="Favicon" className="h-8 mx-auto mb-2 object-contain" />
                            ) : (
                              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFaviconUpload}
                              className="hidden"
                              id="favicon-upload"
                            />
                            <Label htmlFor="favicon-upload" className="cursor-pointer text-primary hover:underline">
                              Upload Favicon
                            </Label>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Colors */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Palette className="h-5 w-5" />
                        Brand Colors
                      </CardTitle>
                      <CardDescription>Customize the color scheme (HSL format: "H S% L%")</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Primary Color</Label>
                          <Input
                            value={editForm.primary_color}
                            onChange={(e) => setEditForm({ ...editForm, primary_color: e.target.value })}
                            placeholder="150 25% 35%"
                          />
                          <div 
                            className="h-8 rounded border" 
                            style={{ backgroundColor: `hsl(${editForm.primary_color})` }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Primary Foreground</Label>
                          <Input
                            value={editForm.primary_foreground_color}
                            onChange={(e) => setEditForm({ ...editForm, primary_foreground_color: e.target.value })}
                            placeholder="0 0% 100%"
                          />
                          <div 
                            className="h-8 rounded border" 
                            style={{ backgroundColor: `hsl(${editForm.primary_foreground_color})` }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Secondary Color</Label>
                          <Input
                            value={editForm.secondary_color}
                            onChange={(e) => setEditForm({ ...editForm, secondary_color: e.target.value })}
                            placeholder="35 30% 92%"
                          />
                          <div 
                            className="h-8 rounded border" 
                            style={{ backgroundColor: `hsl(${editForm.secondary_color})` }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Accent Color</Label>
                          <Input
                            value={editForm.accent_color}
                            onChange={(e) => setEditForm({ ...editForm, accent_color: e.target.value })}
                            placeholder="175 35% 45%"
                          />
                          <div 
                            className="h-8 rounded border" 
                            style={{ backgroundColor: `hsl(${editForm.accent_color})` }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Background</Label>
                          <Input
                            value={editForm.background_color}
                            onChange={(e) => setEditForm({ ...editForm, background_color: e.target.value })}
                            placeholder="40 20% 98%"
                          />
                          <div 
                            className="h-8 rounded border" 
                            style={{ backgroundColor: `hsl(${editForm.background_color})` }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Foreground</Label>
                          <Input
                            value={editForm.foreground_color}
                            onChange={(e) => setEditForm({ ...editForm, foreground_color: e.target.value })}
                            placeholder="220 20% 20%"
                          />
                          <div 
                            className="h-8 rounded border" 
                            style={{ backgroundColor: `hsl(${editForm.foreground_color})` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Typography */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Type className="h-5 w-5" />
                        Typography
                      </CardTitle>
                      <CardDescription>Choose fonts from Google Fonts</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Heading Font</Label>
                          <Input
                            value={editForm.heading_font}
                            onChange={(e) => setEditForm({ ...editForm, heading_font: e.target.value })}
                            placeholder="Playfair Display"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Body Font</Label>
                          <Input
                            value={editForm.body_font}
                            onChange={(e) => setEditForm({ ...editForm, body_font: e.target.value })}
                            placeholder="DM Sans"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex gap-3">
                    <Button onClick={handleSaveChanges} disabled={isSaving}>
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button variant="outline" asChild>
                      <a 
                        href={`/?org=${currentOrg.subdomain}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Preview
                      </a>
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="settings">
                  <Card>
                    <CardHeader>
                      <CardTitle>Organization Settings</CardTitle>
                      <CardDescription>Update your organization details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Organization Name</Label>
                        <Input
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Tagline</Label>
                        <Input
                          value={editForm.tagline}
                          onChange={(e) => setEditForm({ ...editForm, tagline: e.target.value })}
                        />
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Support Email</Label>
                          <Input
                            value={editForm.support_email}
                            onChange={(e) => setEditForm({ ...editForm, support_email: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Phone</Label>
                          <Input
                            value={editForm.phone}
                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Website</Label>
                        <Input
                          value={editForm.website_url}
                          onChange={(e) => setEditForm({ ...editForm, website_url: e.target.value })}
                        />
                      </div>
                      <Button onClick={handleSaveChanges} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="users">
                  <Card>
                    <CardHeader>
                      <CardTitle>Family Management</CardTitle>
                      <CardDescription>
                        View and manage families using your branded platform
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-center py-8">
                        Family management coming soon. You'll be able to view all families using your platform,
                        see activity reports, and manage access.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="analytics">
                  <Card>
                    <CardHeader>
                      <CardTitle>Analytics Dashboard</CardTitle>
                      <CardDescription>
                        Track engagement and usage across your platform
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-center py-8">
                        Analytics dashboard coming soon. You'll see metrics like active families, 
                        meeting check-ins, messages sent, and more.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Select an organization to manage its settings
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderAdmin;
