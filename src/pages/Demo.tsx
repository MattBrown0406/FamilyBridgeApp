import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { SEOHead, createBreadcrumbSchema } from '@/components/SEOHead';
import { 
  Building2, 
  Palette, 
  Users, 
  MessageCircle, 
  DollarSign, 
  MapPin, 
  Shield, 
  ArrowRight,
  Eye,
  Wand2,
  Upload,
  Check,
  Play,
  Sparkles,
  Loader2,
  Pill
} from 'lucide-react';
import familyBridgeLogo from '@/assets/familybridge-logo.png';
import { usePlatform } from '@/hooks/usePlatform';

const Demo = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isNative, isIOS } = usePlatform();
  const paymentsWebOnly = isNative && isIOS;
  const [brandingStep, setBrandingStep] = useState(0);
  const [demoPrimaryColor, setDemoPrimaryColor] = useState('#6366f1');
  const [demoName, setDemoName] = useState('Recovery Partners');
  const [demoLogo, setDemoLogo] = useState<string | null>(null);
  const [logoNeedsBackground, setLogoNeedsBackground] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);

  const handleExtractBranding = async () => {
    if (!websiteUrl.trim()) {
      toast({
        title: 'URL Required',
        description: 'Please enter a website URL to extract branding from.',
        variant: 'destructive',
      });
      return;
    }

    setIsExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke('extract-branding', {
        body: { url: websiteUrl.trim() }
      });

      if (error) throw error;

      // Handle blocked sites
      if (data?.blocked) {
        toast({
          title: 'Website Blocked Access',
          description: data.error || 'This website has blocked automated access. Please enter your branding information manually.',
          variant: 'destructive',
        });
        // Still move to step 2 so they can enter manually
        setBrandingStep(2);
        // Try to at least get the name from URL
        try {
          const urlObj = new URL(websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`);
          const hostname = urlObj.hostname.replace('www.', '');
          const nameParts = hostname.split('.')[0];
          const formattedName = nameParts
            .split(/[-_]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          setDemoName(formattedName);
        } catch {
          // Keep default name
        }
        return;
      }

      if (data?.success && data?.branding) {
        const branding = data.branding;
        
        // Pick a single primary color - prefer primary, then secondary, then accent
        const primaryColor = branding.colors?.primary || branding.colors?.secondary || branding.colors?.accent || '#6366f1';
        setDemoPrimaryColor(primaryColor);

        // Update logo if extracted
        if (branding.logo_url) {
          setDemoLogo(branding.logo_url);
          // Use API's detection for whether logo needs background, or fallback to our own check
          const needsBackground = branding.logo_needs_background || 
            (branding.colors?.background && isColorDark(branding.colors.background));
          setLogoNeedsBackground(needsBackground || false);
        }

        // Use extracted company name, or fall back to URL parsing
        if (branding.company_name) {
          setDemoName(branding.company_name);
        } else {
          // Fallback: derive name from URL
          try {
            const urlObj = new URL(websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`);
            const hostname = urlObj.hostname.replace('www.', '');
            const nameParts = hostname.split('.')[0];
            const formattedName = nameParts
              .split(/[-_]/)
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
            setDemoName(formattedName);
          } catch {
            // Keep default name
          }
        }

        setBrandingStep(2);
        toast({
          title: 'Branding Extracted!',
          description: 'We found your brand colors and logo.',
        });
      } else {
        toast({
          title: 'Partial Extraction',
          description: 'Some branding elements could not be found. You can customize manually.',
        });
        setBrandingStep(2);
      }
    } catch (err: unknown) {
      console.error('Branding extraction error:', err);
      toast({
        title: 'Extraction Failed',
        description: 'Could not extract branding. Try a different URL or enter manually.',
        variant: 'destructive',
      });
    } finally {
      setIsExtracting(false);
    }
  };

  // Helper function to determine if a color is dark
  const isColorDark = (color: string): boolean => {
    // Handle hex colors
    if (color.startsWith('#')) {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      // Calculate luminance
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance < 0.5;
    }
    // Handle rgb colors
    if (color.startsWith('rgb')) {
      const match = color.match(/\d+/g);
      if (match && match.length >= 3) {
        const [r, g, b] = match.map(Number);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance < 0.5;
      }
    }
    return false;
  };

  const features = [
    {
      icon: Sparkles,
      title: 'FIIS Recovery Intelligence',
      description: 'AI-assisted pattern review highlights recovery trends and structured observations for providers.',
      badge: 'AI',
    },
    {
      icon: Pill,
      title: 'Medication Compliance',
      description: 'AI helps read medication labels, track doses, and notify authorized supporters about missed check-ins.',
      badge: 'AI',
    },
    {
      icon: MessageCircle,
      title: 'Secure Family Communication',
      description: 'Safe, filtered messaging keeps families connected while blocking harmful content.',
      badge: 'Family',
    },
    {
      icon: DollarSign,
      title: 'Financial Coordination',
      description: 'Group-approved financial requests with voting, pledges, and accountability tracking.',
      badge: 'Family',
    },
    {
      icon: MapPin,
      title: 'Meeting Check-ins',
      description: 'GPS-verified meeting attendance with liquor license proximity warnings.',
      badge: 'Family',
    },
    {
      icon: Shield,
      title: 'Boundary Management',
      description: 'AI-assisted document review pulls out likely boundaries from intervention letters for human review.',
      badge: 'AI',
    },
    {
      icon: Building2,
      title: 'Care Transition Management',
      description: 'Track movement between intervention, treatment, IOP, and aftercare phases.',
      badge: 'Provider',
    },
    {
      icon: Users,
      title: 'Provider Handoffs',
      description: 'Structured family handoffs between organizations with key context preserved for the next team.',
      badge: 'Provider',
    },
  ];

  const demoFamilies = [
    {
      id: 'johnson',
      name: 'Johnson Family',
      scenario: 'Positive recovery and aftercare',
      description: 'A stable family using chat, check-ins, coaching, financial requests, documents, and recovery tracking after treatment and sober living.',
      members: [
        { name: 'Matt Brown', role: 'moderator', relationship: 'Case Manager' },
        { name: 'Sarah Johnson', role: 'member', relationship: 'Parent' },
        { name: 'Michael Johnson', role: 'recovering', relationship: 'Person in Recovery' },
        { name: 'Emily Johnson', role: 'member', relationship: 'Spouse' },
      ],
    },
    {
      id: 'davis',
      name: 'Davis Family',
      scenario: 'Active crisis and boundary stress',
      description: 'A high-friction family showing what the app looks like when active addiction, money requests, and safety concerns are still in play.',
      members: [
        { name: 'Tasha Miller', role: 'moderator', relationship: 'Support Moderator' },
        { name: 'Linda Davis', role: 'member', relationship: 'Parent' },
        { name: 'Chris Davis', role: 'recovering', relationship: 'Loved One' },
        { name: 'Mark Davis', role: 'member', relationship: 'Parent' },
      ],
    },
    {
      id: 'mitchell',
      name: 'Mitchell Family',
      scenario: 'Treatment transition and discharge planning',
      description: 'A realistic provider-supported family moving from intervention into treatment, sober living, and aftercare planning.',
      members: [
        { name: 'Matt Brown', role: 'moderator', relationship: 'Interventionist' },
        { name: 'Jessica Mitchell', role: 'member', relationship: 'Sister' },
        { name: 'Tyler Mitchell', role: 'recovering', relationship: 'Loved One' },
        { name: 'Robert Mitchell', role: 'member', relationship: 'Parent' },
      ],
    },
  ];

  const breadcrumbSchema = createBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Demo', url: '/demo' },
  ]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Demo — See FamilyBridge in Action"
        description="See FamilyBridge in action. Explore our AI-powered family recovery platform with interactive demos of communication, financial, and accountability tools."
        canonicalPath="/demo"
        structuredData={breadcrumbSchema}
      />
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={familyBridgeLogo} alt="FamilyBridge" className="h-8 w-8 sm:h-10 sm:w-10 object-contain" />
            <span className="font-display font-bold text-lg sm:text-xl">FamilyBridge</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate('/')}>
              Exit
            </Button>
            {!(isNative && isIOS) && (
              <Button size="sm" onClick={() => navigate(paymentsWebOnly ? '/auth' : '/provider-purchase')}>
                Get Started
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-8 sm:py-12 text-center">
        <Badge className="mb-3 sm:mb-4" variant="secondary">
          Interactive Demo
        </Badge>
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-display font-bold text-foreground mb-3 sm:mb-4">
          See FamilyBridge in Action
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-6 sm:mb-8 px-2">
          Experience how your family or recovery support organization can benefit from structured support, 
          communication and accountability through each stage of the recovery process.
        </p>
      </section>

      {/* Demo Sections */}
      <Tabs defaultValue="branding" className="container mx-auto px-3 sm:px-4 pb-8 sm:pb-12">
        <TabsList className="grid w-full max-w-3xl mx-auto grid-cols-4 mb-6 sm:mb-8 h-12 sm:h-14 p-1 sm:p-1.5 bg-primary/10 border border-primary/20 rounded-xl shadow-md">
          <TabsTrigger value="branding" className="h-full text-xs sm:text-base font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg rounded-lg transition-all flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2 px-1 sm:px-3">
            <Palette className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Providers</span>
            <span className="sm:hidden text-[10px] leading-tight text-center">Providers</span>
          </TabsTrigger>
          <TabsTrigger value="provider-demo" className="h-full text-xs sm:text-base font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg rounded-lg transition-all flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2 px-1 sm:px-3">
            <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Provider Demo</span>
            <span className="sm:hidden text-[10px] leading-tight text-center">Provider</span>
          </TabsTrigger>
          <TabsTrigger value="family" className="h-full text-xs sm:text-base font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg rounded-lg transition-all flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2 px-1 sm:px-3">
            <Users className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Family Demo</span>
            <span className="sm:hidden text-[10px] leading-tight text-center">Family</span>
          </TabsTrigger>
          <TabsTrigger value="features" className="h-full text-xs sm:text-base font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg rounded-lg transition-all flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2 px-1 sm:px-3">
            <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Features</span>
            <span className="sm:hidden text-[10px] leading-tight text-center">Features</span>
          </TabsTrigger>
        </TabsList>

        {/* Branding Demo */}
        <TabsContent value="branding" className="space-y-8">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
              <CardTitle className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5" />
                  Automatic Branding Extraction <span className="text-muted-foreground font-normal text-base">(for professional recovery organizations)</span>
                </CardTitle>
                <CardDescription>
                  Enter your website URL and we'll automatically extract your brand colors, logo, and fonts
                </CardDescription>
                {!(isNative && isIOS) && (
                <div className="mt-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    {!isNative 
                      ? "Early Adopter Special for Organizations: $250/month for all of 2026!"
                      : "Early Adopter Special for Organizations available!"
                    }
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 ml-6">
                    {!isNative 
                      ? "Individual family plans available"
                      : "Individual family plans also available"
                    }
                  </p>
                </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {brandingStep === 0 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Your Website URL</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="https://yourcompany.com"
                          value={websiteUrl}
                          onChange={(e) => setWebsiteUrl(e.target.value)}
                        />
                        <Button onClick={handleExtractBranding} disabled={isExtracting}>
                          {isExtracting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Extracting...
                            </>
                          ) : (
                            <>
                              <Wand2 className="h-4 w-4 mr-2" />
                              Extract
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Enter your website URL and we'll extract your brand colors and logo automatically.
                    </p>
                  </div>
                )}

                {brandingStep === 2 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 text-green-600">
                      <Check className="h-5 w-5" />
                      <span className="font-medium">Branding extracted!</span>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-medium">Brand Color</h4>
                        <div className="flex gap-3">
                          <div className="space-y-1">
                            <div 
                              className="w-12 h-12 rounded-lg shadow-md border" 
                              style={{ backgroundColor: demoPrimaryColor }}
                            />
                            <span className="text-xs text-muted-foreground">Primary</span>
                          </div>
                        </div>
                        
                        {demoLogo && (
                          <div className="space-y-2">
                            <h4 className="font-medium">Extracted Logo</h4>
                            <div 
                              className="p-4 rounded-lg inline-block border shadow-sm"
                              style={{ 
                                backgroundColor: logoNeedsBackground ? demoPrimaryColor : undefined,
                                background: !logoNeedsBackground ? 'linear-gradient(to bottom right, hsl(var(--muted)), hsl(var(--muted) / 0.8))' : undefined
                              }}
                            >
                              <img 
                                src={demoLogo} 
                                alt="Extracted logo" 
                                className="max-h-16 max-w-[200px] object-contain"
                                style={{ 
                                  filter: logoNeedsBackground ? 'none' : 'drop-shadow(0 0 0.5px rgba(0,0,0,0.2)) drop-shadow(0 0 2px rgba(0,0,0,0.1))'
                                }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="font-medium">Organization Name</h4>
                        <Input value={demoName} onChange={(e) => setDemoName(e.target.value)} />
                      </div>
                    </div>

                    <Button onClick={() => { setBrandingStep(0); setDemoLogo(null); }} variant="outline">
                      Try Another Website
                    </Button>
                  </div>
                )}

                {/* Preview */}
                <div className="border rounded-xl p-6 bg-card">
                  <h4 className="font-medium mb-4">Live Preview</h4>
                  <div 
                    className="rounded-xl p-6 text-white transition-all duration-300"
                    style={{ backgroundColor: demoPrimaryColor }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      {demoLogo ? (
                        <div 
                          className="h-10 w-10 rounded-lg p-1 shadow-sm border border-white/20"
                          style={{ 
                            backgroundColor: logoNeedsBackground ? demoPrimaryColor : 'white'
                          }}
                        >
                          <img 
                            src={demoLogo} 
                            alt="Logo" 
                            className="h-full w-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center overflow-hidden">
                          <img src={familyBridgeLogo} alt="FamilyBridge" className="h-8 w-8 object-contain" />
                        </div>
                      )}
                      <span className="font-bold text-xl">{demoName}</span>
                    </div>
                    <p className="opacity-90 text-sm">
                      Supporting families on the journey to recovery
                    </p>
                    <Button 
                      size="lg"
                      className="mt-4 bg-white text-primary hover:bg-white/90 font-semibold shadow-lg"
                      onClick={() => navigate('/demo/family', { 
                        state: { 
                          branding: {
                            primaryColor: demoPrimaryColor,
                            logo: demoLogo,
                            logoNeedsBackground,
                            name: demoName
                          }
                        }
                      })}
                    >
                      Get Started
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Provider Demo */}
        <TabsContent value="provider-demo" className="space-y-8">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Provider Dashboard Demo
                </CardTitle>
                <CardDescription>
                  Experience the current provider workspace with notes, messaging, coordination, admin views, CRM context, and FIIS support tools.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-lg">Hope Harbor Interventions Demo</h4>
                    <p className="text-sm text-muted-foreground">
                      See how professional recovery organizations now move between workspace, coordination, and admin surfaces while staying synced with the family-facing experience.
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span>Provider workspace with notes, messaging, and FIIS summaries</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span>Coordination cases for crisis, transition, and aftercare</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span>Admin views for families, moderators, CRM, branding, and analytics</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span>Three realistic demo families mapped to provider-side context</span>
                      </div>
                    </div>
                    <Button onClick={() => navigate('/demo/provider', { state: { branding: { primaryColor: demoPrimaryColor, logo: demoLogo, logoNeedsBackground, name: demoName } } })} className="w-full">
                      <Play className="h-4 w-4 mr-2" />
                      Enter Provider Demo
                    </Button>
                  </div>
                  <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 rounded-xl p-6 border border-violet-200 dark:border-violet-800">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Hope Harbor Interventions</h4>
                        <p className="text-xs text-muted-foreground">Demo Organization</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="bg-white/50 dark:bg-white/10 rounded-lg p-3">
                        <p className="text-2xl font-bold text-violet-600">3</p>
                        <p className="text-xs text-muted-foreground">Active Families</p>
                      </div>
                      <div className="bg-white/50 dark:bg-white/10 rounded-lg p-3">
                        <p className="text-2xl font-bold text-violet-600">3</p>
                        <p className="text-xs text-muted-foreground">Open Coordination Cases</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Family Demo */}
        <TabsContent value="family" className="space-y-8">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Demo Family Group
                </CardTitle>
                <CardDescription>
                  Explore three pre-populated family journeys so prospects can see how the live app changes across crisis, treatment transition, and aftercare.
                </CardDescription>
                {!isNative && (
                <div className="mt-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Founding family price: FIIS Support at $49.99/month while active
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-1 ml-6">
                    For individual families not using a provider invite code
                  </p>
                </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  {demoFamilies.map((family) => (
                    <Card key={family.id} className="border bg-muted/20 shadow-sm">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <CardTitle className="text-base">{family.name}</CardTitle>
                            <CardDescription>{family.scenario}</CardDescription>
                          </div>
                          <Badge variant="outline">Demo</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">{family.description}</p>
                        <div className="space-y-2">
                          {family.members.map((member, index) => (
                            <div key={index} className="flex items-center justify-between rounded-lg bg-background p-2.5 border">
                              <div>
                                <p className="text-sm font-medium">{member.name}</p>
                                <p className="text-xs text-muted-foreground">{member.relationship}</p>
                              </div>
                              <Badge variant={member.role === 'moderator' ? 'default' : member.role === 'recovering' ? 'secondary' : 'outline'}>
                                {member.role}
                              </Badge>
                            </div>
                          ))}
                        </div>
                        <Button 
                          onClick={() => navigate('/demo/family', { 
                            state: { 
                              branding: {
                                primaryColor: demoPrimaryColor,
                                logo: demoLogo,
                                logoNeedsBackground,
                                name: demoName
                              },
                              initialFamily: family.id,
                            }
                          })} 
                          className="w-full"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Open {family.name}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-4 mt-6">
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/demo/family', { state: { branding: { primaryColor: demoPrimaryColor, logo: demoLogo, logoNeedsBackground, name: demoName }, initialFamily: 'johnson' } })}>
                <CardContent className="pt-6">
                  <MessageCircle className="h-8 w-8 text-primary mb-3" />
                  <h4 className="font-medium">Johnson Family</h4>
                  <p className="text-sm text-muted-foreground">Stable aftercare view with realistic chat and recovery tracking</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/demo/family', { state: { branding: { primaryColor: demoPrimaryColor, logo: demoLogo, logoNeedsBackground, name: demoName }, initialFamily: 'davis' } })}>
                <CardContent className="pt-6">
                  <DollarSign className="h-8 w-8 text-primary mb-3" />
                  <h4 className="font-medium">Davis Family</h4>
                  <p className="text-sm text-muted-foreground">Crisis demo with boundary stress, urgent requests, and active FIIS signals</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/demo/family', { state: { branding: { primaryColor: demoPrimaryColor, logo: demoLogo, logoNeedsBackground, name: demoName }, initialFamily: 'mitchell' } })}>
                <CardContent className="pt-6">
                  <MapPin className="h-8 w-8 text-primary mb-3" />
                  <h4 className="font-medium">Mitchell Family</h4>
                  <p className="text-sm text-muted-foreground">Treatment transition demo with discharge planning and provider coordination</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Features */}
        <TabsContent value="features" className="space-y-8">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {features.map((feature, index) => (
                <Card key={index} className="relative">
                  <CardContent className="pt-6">
                    {feature.badge && (
                      <Badge 
                        variant="secondary" 
                        className={`absolute top-3 right-3 text-xs ${
                          feature.badge === 'AI' ? 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300' :
                          feature.badge === 'Provider' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                          'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                        }`}
                      >
                        {feature.badge}
                      </Badge>
                    )}
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="font-medium mb-1 text-sm">{feature.title}</h4>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* CTA */}
            <Card className="mt-8 bg-primary text-primary-foreground">
              <CardContent className="py-8 text-center">
                <h3 className="text-2xl font-display font-bold mb-2">
                  Ready to Get Started?
                </h3>
                <p className="opacity-90 mb-6 max-w-md mx-auto">
                  Offer your clients a branded family communication platform to support their recovery journey.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    variant="secondary" 
                    size="lg"
                    onClick={() => navigate(paymentsWebOnly ? '/auth' : '/provider-purchase')}
                  >
                    For Providers
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="lg"
                    onClick={() => navigate(paymentsWebOnly ? '/auth' : '/family-purchase')}
                  >
                    For Families
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="border-white bg-white/20 text-white font-semibold hover:bg-white hover:text-primary"
                    onClick={() => navigate('/demo/family')}
                  >
                    Continue Demo
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Demo;
