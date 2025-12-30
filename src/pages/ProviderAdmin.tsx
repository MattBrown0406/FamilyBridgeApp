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
import { supabase } from '@/integrations/supabase/client';
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
  Type,
  Loader2,
  Globe,
  Wand2,
  Key,
  CreditCard
} from 'lucide-react';

// Helper to convert hex to HSL string
const hexToHsl = (hex: string): string => {
  if (!hex) return '';
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '';
  
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

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
    uploadFavicon,
    refetch
  } = useProviderAdmin();
  
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExtractingBranding, setIsExtractingBranding] = useState(false);
  const [showManualBranding, setShowManualBranding] = useState(false);
  
  // Activation code state
  const [activationCode, setActivationCode] = useState('');
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  
  // Create organization form with branding
  const [newOrg, setNewOrg] = useState({
    name: '',
    subdomain: '',
    tagline: '',
    support_email: '',
    website_url: '',
    phone: '',
  });
  
  // Manual branding inputs (when no website)
  const [manualBranding, setManualBranding] = useState({
    primary_color: '',
    logo_file: null as File | null,
  });
  
  // Extracted branding preview
  const [extractedBranding, setExtractedBranding] = useState<{
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
    accent_color?: string;
    fonts?: { primary?: string; heading?: string };
  } | null>(null);

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

  // Validate activation code
  const handleValidateCode = async () => {
    if (!activationCode.trim()) {
      toast({ title: 'Error', description: 'Please enter an activation code', variant: 'destructive' });
      return;
    }

    setIsValidatingCode(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-activation-code', {
        body: { code: activationCode.trim() }
      });

      if (error) throw error;

      if (data.valid) {
        setIsActivated(true);
        setIsCreating(true);
        toast({ title: 'Success', description: 'Activation code validated! You can now create your organization.' });
      } else {
        toast({ title: 'Error', description: data.error || 'Invalid activation code', variant: 'destructive' });
      }
    } catch (err: any) {
      console.error('Activation code validation error:', err);
      toast({ title: 'Error', description: 'Failed to validate activation code', variant: 'destructive' });
    } finally {
      setIsValidatingCode(false);
    }
  };

  // Extract branding from website
  const handleExtractBranding = async () => {
    if (!newOrg.website_url) {
      setShowManualBranding(true);
      return;
    }
    
    setIsExtractingBranding(true);
    try {
      const { data, error } = await supabase.functions.invoke('extract-branding', {
        body: { url: newOrg.website_url }
      });
      
      if (error) throw error;
      
      if (data?.success && data?.branding) {
        const branding = data.branding;
        setExtractedBranding({
          logo_url: branding.logo_url,
          primary_color: branding.colors?.primary ? hexToHsl(branding.colors.primary) : undefined,
          secondary_color: branding.colors?.secondary ? hexToHsl(branding.colors.secondary) : undefined,
          accent_color: branding.colors?.accent ? hexToHsl(branding.colors.accent) : undefined,
          fonts: branding.fonts,
        });
        toast({ title: 'Success', description: 'Branding extracted from your website!' });
      } else {
        setShowManualBranding(true);
        toast({ title: 'Info', description: 'Could not extract branding. Please enter manually.' });
      }
    } catch (err: any) {
      console.error('Branding extraction error:', err);
      setShowManualBranding(true);
      toast({ title: 'Info', description: 'Could not extract branding. Please enter manually.' });
    } finally {
      setIsExtractingBranding(false);
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
      // Build organization data with branding
      const orgData: any = { ...newOrg };
      
      // Apply extracted branding if available
      if (extractedBranding) {
        if (extractedBranding.primary_color) orgData.primary_color = extractedBranding.primary_color;
        if (extractedBranding.secondary_color) orgData.secondary_color = extractedBranding.secondary_color;
        if (extractedBranding.accent_color) orgData.accent_color = extractedBranding.accent_color;
        if (extractedBranding.logo_url) orgData.logo_url = extractedBranding.logo_url;
        if (extractedBranding.fonts?.heading) orgData.heading_font = extractedBranding.fonts.heading;
        if (extractedBranding.fonts?.primary) orgData.body_font = extractedBranding.fonts.primary;
      }
      
      // Apply manual branding if provided
      if (manualBranding.primary_color) {
        orgData.primary_color = manualBranding.primary_color;
      }
      
      const org = await createOrganization(orgData);
      
      // Upload manual logo if provided
      if (manualBranding.logo_file && org?.id) {
        try {
          await uploadLogo(org.id, manualBranding.logo_file);
        } catch (logoErr) {
          console.error('Logo upload error:', logoErr);
        }
      }
      
      toast({ title: 'Success', description: 'Organization created!' });
      setIsCreating(false);
      setNewOrg({ name: '', subdomain: '', tagline: '', support_email: '', website_url: '', phone: '' });
      setExtractedBranding(null);
      setManualBranding({ primary_color: '', logo_file: null });
      setShowManualBranding(false);
      await refetch();
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
            
            {/* Activation Code Input */}
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center justify-center gap-2">
                  <Key className="h-5 w-5" />
                  Enter Activation Code
                </CardTitle>
                <CardDescription>
                  Enter your purchased activation code to get started
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Input
                    placeholder="XXXX-XXXX-XXXX"
                    value={activationCode}
                    onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
                    className="text-center text-lg tracking-widest"
                    maxLength={14}
                  />
                </div>
                <Button 
                  onClick={handleValidateCode} 
                  disabled={isValidatingCode || !activationCode.trim()}
                  className="w-full"
                  size="lg"
                >
                  {isValidatingCode ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4 mr-2" />
                      Activate
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
            
            {/* Purchase Link */}
            <div className="mt-8">
              <p className="text-muted-foreground mb-4">
                Don't have an activation code?
              </p>
              <Button variant="outline" onClick={() => navigate('/provider-purchase')} size="lg">
                <CreditCard className="h-5 w-5 mr-2" />
                Purchase Activation Code
              </Button>
            </div>
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
                <Label htmlFor="website">Website (optional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="website"
                    placeholder="https://example.com"
                    value={newOrg.website_url}
                    onChange={(e) => {
                      setNewOrg({ ...newOrg, website_url: e.target.value });
                      setExtractedBranding(null);
                      setShowManualBranding(false);
                    }}
                  />
                  {newOrg.website_url && !extractedBranding && !showManualBranding && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleExtractBranding}
                      disabled={isExtractingBranding}
                    >
                      {isExtractingBranding ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Wand2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter your website to auto-extract logo and brand colors
                </p>
              </div>
              
              {/* Extracted Branding Preview */}
              {extractedBranding && (
                <Card className="bg-muted/50 border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Wand2 className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Extracted Branding</span>
                    </div>
                    <div className="flex items-center gap-4">
                      {extractedBranding.logo_url && (
                        <img 
                          src={extractedBranding.logo_url} 
                          alt="Logo" 
                          className="h-12 w-12 object-contain rounded bg-background p-1"
                        />
                      )}
                      <div className="flex gap-2">
                        {extractedBranding.primary_color && (
                          <div 
                            className="h-8 w-8 rounded border"
                            style={{ backgroundColor: `hsl(${extractedBranding.primary_color})` }}
                            title="Primary Color"
                          />
                        )}
                        {extractedBranding.secondary_color && (
                          <div 
                            className="h-8 w-8 rounded border"
                            style={{ backgroundColor: `hsl(${extractedBranding.secondary_color})` }}
                            title="Secondary Color"
                          />
                        )}
                        {extractedBranding.accent_color && (
                          <div 
                            className="h-8 w-8 rounded border"
                            style={{ backgroundColor: `hsl(${extractedBranding.accent_color})` }}
                            title="Accent Color"
                          />
                        )}
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-2 text-xs"
                      onClick={() => {
                        setExtractedBranding(null);
                        setShowManualBranding(true);
                      }}
                    >
                      Enter manually instead
                    </Button>
                  </CardContent>
                </Card>
              )}
              
              {/* Manual Branding Input (no website or extraction failed) */}
              {(showManualBranding || (!newOrg.website_url && !extractedBranding)) && (
                <Card className="bg-muted/50">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Palette className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Branding</span>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Logo</Label>
                      <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                        {manualBranding.logo_file ? (
                          <div className="flex items-center justify-center gap-2">
                            <img 
                              src={URL.createObjectURL(manualBranding.logo_file)} 
                              alt="Logo preview" 
                              className="h-10 object-contain"
                            />
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setManualBranding({ ...manualBranding, logo_file: null })}
                            >
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  setManualBranding({ ...manualBranding, logo_file: e.target.files[0] });
                                }
                              }}
                              className="hidden"
                              id="manual-logo-upload"
                            />
                            <Label htmlFor="manual-logo-upload" className="cursor-pointer text-primary hover:underline text-sm">
                              Upload Logo
                            </Label>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="manual-color">Primary Brand Color (HSL)</Label>
                      <div className="flex gap-2">
                        <Input
                          id="manual-color"
                          placeholder="150 25% 35%"
                          value={manualBranding.primary_color}
                          onChange={(e) => setManualBranding({ ...manualBranding, primary_color: e.target.value })}
                        />
                        {manualBranding.primary_color && (
                          <div 
                            className="h-10 w-10 rounded border shrink-0"
                            style={{ backgroundColor: `hsl(${manualBranding.primary_color})` }}
                          />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Format: "Hue Saturation% Lightness%" (e.g., "220 70% 50%" for blue)
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Show extract button if website provided but not yet extracted */}
              {newOrg.website_url && !extractedBranding && !showManualBranding && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleExtractBranding}
                  disabled={isExtractingBranding}
                  className="w-full"
                >
                  {isExtractingBranding ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Extracting branding...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Extract Logo & Colors from Website
                    </>
                  )}
                </Button>
              )}
              
              <Button onClick={handleCreateOrg} disabled={isSaving || isExtractingBranding} className="w-full">
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
              <Tabs defaultValue="users" className="space-y-4">
                <TabsList className="grid grid-cols-4 w-full max-w-lg">
                  <TabsTrigger value="users" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="hidden sm:inline">Users</span>
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span className="hidden sm:inline">Settings</span>
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    <span className="hidden sm:inline">Analytics</span>
                  </TabsTrigger>
                  <TabsTrigger value="branding" className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    <span className="hidden sm:inline">Branding</span>
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
