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
  CreditCard,
  Shield,
  Copy,
  Check,
  UsersRound,
  Pencil,
  Trash2
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
  
  // Family group management state
  const [orgFamilies, setOrgFamilies] = useState<any[]>([]);
  const [isLoadingFamilies, setIsLoadingFamilies] = useState(false);
  const [isCreatingFamily, setIsCreatingFamily] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [newFamilyDescription, setNewFamilyDescription] = useState('');
  const [leadMemberName, setLeadMemberName] = useState('');
  const [leadMemberEmail, setLeadMemberEmail] = useState('');
  const [selectedModeratorForFamily, setSelectedModeratorForFamily] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  // Moderator management state
  const [orgModerators, setOrgModerators] = useState<any[]>([]);
  const [moderatorFamilyCounts, setModeratorFamilyCounts] = useState<Record<string, number>>({});
  const [isLoadingModerators, setIsLoadingModerators] = useState(false);
  const [isAddingModerator, setIsAddingModerator] = useState(false);
  const [newModeratorName, setNewModeratorName] = useState('');
  const [newModeratorEmail, setNewModeratorEmail] = useState('');
  const [newModeratorPassword, setNewModeratorPassword] = useState('');
  const [newModeratorRole, setNewModeratorRole] = useState<'admin' | 'staff'>('staff');
  const [editingModerator, setEditingModerator] = useState<string | null>(null);
  const [editModeratorRole, setEditModeratorRole] = useState<'admin' | 'staff'>('staff');
  
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
  const handleSelectOrg = async (orgId: string) => {
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
      // Load families and moderators for this org
      await Promise.all([fetchOrgFamilies(orgId), fetchOrgModerators(orgId)]);
    }
  };

  // Fetch families for the selected organization
  const fetchOrgFamilies = async (orgId: string) => {
    setIsLoadingFamilies(true);
    try {
      const { data, error } = await supabase
        .from('families')
        .select('*, family_invite_codes(invite_code)')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrgFamilies(data || []);
    } catch (err) {
      console.error('Error fetching families:', err);
      toast({ title: 'Error', description: 'Failed to load families', variant: 'destructive' });
    } finally {
      setIsLoadingFamilies(false);
    }
  };

  // Create a new family for the organization
  const handleCreateFamily = async () => {
    if (!newFamilyName.trim() || !selectedOrg) {
      toast({ title: 'Error', description: 'Family name is required', variant: 'destructive' });
      return;
    }

    if (!leadMemberName.trim() || !leadMemberEmail.trim()) {
      toast({ title: 'Error', description: 'Lead family member name and email are required', variant: 'destructive' });
      return;
    }

    // Basic email validation
    if (!leadMemberEmail.includes('@')) {
      toast({ title: 'Error', description: 'Please enter a valid email address', variant: 'destructive' });
      return;
    }

    // Determine which moderator to assign
    let moderatorUserId = selectedModeratorForFamily;
    if (!moderatorUserId && orgModerators.length === 1) {
      moderatorUserId = orgModerators[0].user_id;
    }

    if (!moderatorUserId) {
      toast({ title: 'Error', description: 'Please select a moderator for this family group', variant: 'destructive' });
      return;
    }

    setIsCreatingFamily(true);
    try {
      // Create the family with the organization_id
      // Note: account_number is auto-generated by database trigger
      const { data: family, error: familyError } = await supabase
        .from('families')
        .insert({
          name: newFamilyName.trim(),
          description: newFamilyDescription.trim() || null,
          organization_id: selectedOrg,
          created_by: moderatorUserId
        } as any)
        .select('*')
        .single();

      if (familyError) throw familyError;

      // Add the moderator as a family member with 'moderator' role
      const { error: memberError } = await supabase
        .from('family_members')
        .insert({
          family_id: family.id,
          user_id: moderatorUserId,
          role: 'moderator'
        });

      if (memberError) {
        console.error('Error adding moderator to family:', memberError);
      }

      // Create invite code for the family
      const { data: inviteCodeData, error: inviteError } = await supabase
        .from('family_invite_codes')
        .insert({ family_id: family.id })
        .select('invite_code')
        .single();

      if (inviteError) {
        console.error('Error creating invite code:', inviteError);
      }

      // Send email to lead family member with the invite code
      if (inviteCodeData?.invite_code) {
        try {
          await supabase.functions.invoke('send-family-invite', {
            body: {
              recipientEmail: leadMemberEmail.trim(),
              recipientName: leadMemberName.trim(),
              familyName: newFamilyName.trim(),
              inviteCode: inviteCodeData.invite_code,
              organizationName: currentOrg?.name || 'FamilyBridge'
            }
          });
          toast({ title: 'Success', description: 'Family group created and invite email sent!' });
        } catch (emailErr) {
          console.error('Error sending invite email:', emailErr);
          toast({ title: 'Success', description: 'Family group created! (Email could not be sent - please share the invite code manually)' });
        }
      } else {
        toast({ title: 'Success', description: 'Family group created!' });
      }

      setNewFamilyName('');
      setNewFamilyDescription('');
      setLeadMemberName('');
      setLeadMemberEmail('');
      setSelectedModeratorForFamily('');
      await Promise.all([fetchOrgFamilies(selectedOrg), fetchOrgModerators(selectedOrg)]);
    } catch (err: any) {
      console.error('Error creating family:', err);
      toast({ title: 'Error', description: err.message || 'Failed to create family', variant: 'destructive' });
    } finally {
      setIsCreatingFamily(false);
    }
  };

  // Copy invite code to clipboard
  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast({ title: 'Copied!', description: 'Invite code copied to clipboard' });
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to copy code', variant: 'destructive' });
    }
  };

  // Fetch moderators for the selected organization
  const fetchOrgModerators = async (orgId: string) => {
    setIsLoadingModerators(true);
    try {
      // First fetch organization members
      const { data: members, error: membersError } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', orgId)
        .order('joined_at', { ascending: false });

      if (membersError) throw membersError;

      // Then fetch profiles for those members
      if (members && members.length > 0) {
        const userIds = members.map(m => m.user_id);
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
        }

        // Combine members with their profiles
        const membersWithProfiles = members.map(member => ({
          ...member,
          profiles: profiles?.find(p => p.id === member.user_id) || null
        }));

        setOrgModerators(membersWithProfiles);
      } else {
        setOrgModerators([]);
      }

      // Fetch family counts for each moderator
      const { data: families } = await supabase
        .from('families')
        .select('id')
        .eq('organization_id', orgId);

      if (families && families.length > 0) {
        const familyIds = families.map(f => f.id);
        const { data: familyMembers } = await supabase
          .from('family_members')
          .select('user_id, family_id')
          .in('family_id', familyIds)
          .eq('role', 'moderator');

        // Count families per user
        const counts: Record<string, number> = {};
        (familyMembers || []).forEach(fm => {
          counts[fm.user_id] = (counts[fm.user_id] || 0) + 1;
        });
        setModeratorFamilyCounts(counts);
      } else {
        setModeratorFamilyCounts({});
      }

      // Auto-select if only one moderator
      if (members && members.length === 1) {
        setSelectedModeratorForFamily(members[0].user_id);
      }
    } catch (err) {
      console.error('Error fetching moderators:', err);
      toast({ title: 'Error', description: 'Failed to load moderators', variant: 'destructive' });
    } finally {
      setIsLoadingModerators(false);
    }
  };

  // Add a new moderator
  const handleAddModerator = async () => {
    if (!newModeratorEmail.trim() || !newModeratorName.trim() || !newModeratorPassword.trim() || !selectedOrg) {
      toast({ title: 'Error', description: 'Name, email, and password are required', variant: 'destructive' });
      return;
    }

    if (newModeratorPassword.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }

    setIsAddingModerator(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-moderator', {
        body: {
          organizationId: selectedOrg,
          email: newModeratorEmail.trim(),
          password: newModeratorPassword,
          fullName: newModeratorName.trim(),
          role: newModeratorRole,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ 
        title: 'Success', 
        description: data?.message || 'Moderator account created successfully! They can now log in with their email and password.',
      });

      // Clear form
      setNewModeratorName('');
      setNewModeratorEmail('');
      setNewModeratorPassword('');
      setNewModeratorRole('staff');
      
      // Refresh moderators list
      await fetchOrgModerators(selectedOrg);
    } catch (err: any) {
      console.error('Error adding moderator:', err);
      toast({ title: 'Error', description: err.message || 'Failed to add moderator', variant: 'destructive' });
    } finally {
      setIsAddingModerator(false);
    }
  };

  // Update moderator role
  const handleUpdateModeratorRole = async (memberId: string, newRole: 'admin' | 'staff') => {
    try {
      const { error } = await supabase
        .from('organization_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;
      
      toast({ title: 'Success', description: 'Role updated successfully' });
      setEditingModerator(null);
      if (selectedOrg) await fetchOrgModerators(selectedOrg);
    } catch (err: any) {
      console.error('Error updating moderator:', err);
      toast({ title: 'Error', description: err.message || 'Failed to update role', variant: 'destructive' });
    }
  };

  // Delete moderator
  const handleDeleteModerator = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this moderator?')) return;
    
    try {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
      
      toast({ title: 'Success', description: 'Moderator removed successfully' });
      if (selectedOrg) await fetchOrgModerators(selectedOrg);
    } catch (err: any) {
      console.error('Error deleting moderator:', err);
      toast({ title: 'Error', description: err.message || 'Failed to remove moderator', variant: 'destructive' });
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
              <Tabs defaultValue="families" className="space-y-4">
                <TabsList className="grid grid-cols-5 w-full max-w-2xl">
                  <TabsTrigger value="families" className="flex items-center gap-2">
                    <UsersRound className="h-4 w-4" />
                    <span className="hidden sm:inline">Family Groups</span>
                  </TabsTrigger>
                  <TabsTrigger value="moderators" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="hidden sm:inline">Moderators</span>
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

                <TabsContent value="moderators" className="space-y-6">
                  {/* Add Moderator */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Add Moderator
                      </CardTitle>
                      <CardDescription>
                        Add staff members who can manage family groups
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="moderator-name">Full Name *</Label>
                          <Input
                            id="moderator-name"
                            type="text"
                            placeholder="John Doe"
                            value={newModeratorName}
                            onChange={(e) => setNewModeratorName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="moderator-email">Email Address *</Label>
                          <Input
                            id="moderator-email"
                            type="email"
                            placeholder="moderator@example.com"
                            value={newModeratorEmail}
                            onChange={(e) => setNewModeratorEmail(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="moderator-password">Password *</Label>
                          <Input
                            id="moderator-password"
                            type="password"
                            placeholder="Min. 6 characters"
                            value={newModeratorPassword}
                            onChange={(e) => setNewModeratorPassword(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">
                            An account will be created with this password
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="moderator-role">Role</Label>
                          <select
                            id="moderator-role"
                            value={newModeratorRole}
                            onChange={(e) => setNewModeratorRole(e.target.value as 'admin' | 'staff')}
                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                          >
                            <option value="staff">Staff</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                      </div>
                      <Button 
                        onClick={handleAddModerator} 
                        disabled={isAddingModerator || !newModeratorEmail.trim() || !newModeratorName.trim() || newModeratorPassword.length < 6}
                      >
                        {isAddingModerator ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Moderator
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Existing Moderators */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Organization Members</CardTitle>
                      <CardDescription>
                        Manage moderators and staff in your organization
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoadingModerators ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : orgModerators.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                          No moderators yet. Add one above to get started.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {orgModerators.map((member) => (
                            <div 
                              key={member.id} 
                              className="flex items-center justify-between p-4 rounded-lg border bg-card"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Users className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {member.profiles?.full_name || 'Unknown User'}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    <span className="capitalize">{member.role}</span>
                                    <span className="mx-1">•</span>
                                    <span>{moderatorFamilyCounts[member.user_id] || 0} families</span>
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {editingModerator === member.id ? (
                                  <>
                                    <select
                                      value={editModeratorRole}
                                      onChange={(e) => setEditModeratorRole(e.target.value as 'admin' | 'staff')}
                                      className="h-8 px-2 rounded-md border border-input bg-background text-sm"
                                    >
                                      <option value="staff">Staff</option>
                                      <option value="admin">Admin</option>
                                    </select>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleUpdateModeratorRole(member.id, editModeratorRole)}
                                    >
                                      <Check className="h-4 w-4 text-green-500" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setEditingModerator(null)}
                                    >
                                      Cancel
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    {member.role !== 'owner' && (
                                      <>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => {
                                            setEditingModerator(member.id);
                                            setEditModeratorRole(member.role);
                                          }}
                                        >
                                          <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => handleDeleteModerator(member.id)}
                                        >
                                          <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                      </>
                                    )}
                                    {member.role === 'owner' && (
                                      <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded">
                                        Owner
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
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

                <TabsContent value="families" className="space-y-6">
                  {/* Create Family Group */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <UsersRound className="h-5 w-5" />
                        Create Family Group
                      </CardTitle>
                      <CardDescription>
                        Create a new family group and generate an invite code for clients
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="family-name">Family Name *</Label>
                          <Input
                            id="family-name"
                            placeholder="e.g., The Johnson Family"
                            value={newFamilyName}
                            onChange={(e) => setNewFamilyName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="family-description">Description (optional)</Label>
                          <Input
                            id="family-description"
                            placeholder="Brief description"
                            value={newFamilyDescription}
                            onChange={(e) => setNewFamilyDescription(e.target.value)}
                          />
                        </div>
                      </div>
                      
                      {/* Lead Family Member */}
                      <div className="border-t pt-4 mt-4">
                        <p className="text-sm font-medium mb-3">Lead Family Member</p>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="lead-member-name">Name *</Label>
                            <Input
                              id="lead-member-name"
                              placeholder="Lead family member's name"
                              value={leadMemberName}
                              onChange={(e) => setLeadMemberName(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lead-member-email">Email *</Label>
                            <Input
                              id="lead-member-email"
                              type="email"
                              placeholder="lead@example.com"
                              value={leadMemberEmail}
                              onChange={(e) => setLeadMemberEmail(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                              An invite code will be sent to this email
                            </p>
                          </div>
                        </div>
                      </div>

                      {orgModerators.length > 1 && (
                        <div className="space-y-2">
                          <Label htmlFor="family-moderator">Assign Moderator *</Label>
                          <select
                            id="family-moderator"
                            value={selectedModeratorForFamily}
                            onChange={(e) => setSelectedModeratorForFamily(e.target.value)}
                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                          >
                            <option value="">Select a moderator...</option>
                            {orgModerators.map((mod) => (
                              <option key={mod.id} value={mod.user_id}>
                                {mod.profiles?.full_name || 'Unknown'} ({mod.role}) - {moderatorFamilyCounts[mod.user_id] || 0} families
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      {orgModerators.length === 1 && (
                        <p className="text-sm text-muted-foreground">
                          Moderator: <span className="font-medium">{orgModerators[0]?.profiles?.full_name || 'Unknown'}</span> (auto-assigned)
                        </p>
                      )}
                      <Button 
                        onClick={handleCreateFamily} 
                        disabled={isCreatingFamily || !newFamilyName.trim() || !leadMemberName.trim() || !leadMemberEmail.trim()}
                      >
                        {isCreatingFamily ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Family Group
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Existing Family Groups */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Family Groups</CardTitle>
                      <CardDescription>
                        Manage family groups in your organization
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoadingFamilies ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : orgFamilies.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                          No family groups yet. Create one above to get started.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {orgFamilies.map((family) => {
                            const inviteCode = family.family_invite_codes?.[0]?.invite_code || family.invite_code;
                            return (
                              <div 
                                key={family.id} 
                                className="flex items-center justify-between p-4 rounded-lg border bg-card"
                              >
                                <div className="flex-1">
                                  <p className="font-medium">{family.name}</p>
                                  {family.description && (
                                    <p className="text-sm text-muted-foreground">{family.description}</p>
                                  )}
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Created {new Date(family.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3">
                                  {inviteCode && (
                                    <div className="flex items-center gap-2">
                                      <div className="text-right">
                                        <p className="text-xs text-muted-foreground">Invite Code</p>
                                        <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                                          {inviteCode}
                                        </code>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleCopyCode(inviteCode)}
                                      >
                                        {copiedCode === inviteCode ? (
                                          <Check className="h-4 w-4 text-green-500" />
                                        ) : (
                                          <Copy className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </div>
                                  )}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(`/family/${family.id}`)}
                                    className="gap-1"
                                  >
                                    <Eye className="h-4 w-4" />
                                    Open
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
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
