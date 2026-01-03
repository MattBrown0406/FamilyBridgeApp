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
  Heart,
  Check,
  Play,
  Sparkles,
  Loader2
} from 'lucide-react';

const Demo = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
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
    } catch (err: any) {
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
      icon: Palette,
      title: 'Custom Branding',
      description: 'Your logo, colors, and fonts throughout the app',
    },
    {
      icon: Users,
      title: 'Unlimited Families',
      description: 'Create and manage family groups for your clients',
    },
    {
      icon: MessageCircle,
      title: 'Moderated Chat',
      description: 'Safe, filtered communication for families',
    },
    {
      icon: DollarSign,
      title: 'Financial Transparency',
      description: 'Group-approved financial requests',
    },
    {
      icon: MapPin,
      title: 'Check-in System',
      description: 'Meeting and location verification',
    },
    {
      icon: Shield,
      title: 'Boundary Setting',
      description: 'Structured boundary agreements',
    },
  ];

  const demoFamily = {
    name: 'The Johnson Family',
    members: [
      { name: 'Matt Brown', role: 'moderator', relationship: 'Case Manager' },
      { name: 'Sarah Johnson', role: 'member', relationship: 'Parent' },
      { name: 'Michael Johnson', role: 'recovering', relationship: 'Recovering' },
      { name: 'David Johnson', role: 'member', relationship: 'Sibling' },
      { name: 'Emily Johnson', role: 'member', relationship: 'Spouse' },
      { name: 'Robert Johnson', role: 'member', relationship: 'Grandparent' },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl">FamilyBridge Demo</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate('/')}>
              Exit Demo
            </Button>
            <Button onClick={() => navigate('/provider-purchase')}>
              Subscribe
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-12 text-center">
        <Badge className="mb-4" variant="secondary">
          Interactive Demo
        </Badge>
        <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
          See FamilyBridge in Action
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Experience how your treatment center, therapy practice, or sober living facility can offer 
          a branded family communication platform to support recovery.
        </p>
      </section>

      {/* Demo Sections */}
      <Tabs defaultValue="branding" className="container mx-auto px-4 pb-12">
        <TabsList className="grid w-full max-w-lg mx-auto grid-cols-3 mb-8">
          <TabsTrigger value="branding">
            <Palette className="h-4 w-4 mr-2" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="family">
            <Users className="h-4 w-4 mr-2" />
            Family Demo
          </TabsTrigger>
          <TabsTrigger value="features">
            <Eye className="h-4 w-4 mr-2" />
            Features
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
                        <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
                          <Heart className="h-6 w-6" />
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
                  Explore a pre-populated family group to see how the platform works
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Family Info */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-lg">{demoFamily.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      A sample family group demonstrating all features of the platform including 
                      group chat, financial requests, meeting check-ins, and boundary setting.
                    </p>
                    <Button 
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
                      className="w-full"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Enter Demo Family
                    </Button>
                  </div>

                  {/* Members */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Family Members</h4>
                    {demoFamily.members.map((member, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {member.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium">{member.name}</p>
                            <p className="text-xs text-muted-foreground">{member.relationship}</p>
                          </div>
                        </div>
                        <Badge variant={
                          member.role === 'moderator' ? 'default' : 
                          member.role === 'recovering' ? 'secondary' : 
                          'outline'
                        }>
                          {member.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-4 mt-6">
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/demo/family')}>
                <CardContent className="pt-6">
                  <MessageCircle className="h-8 w-8 text-primary mb-3" />
                  <h4 className="font-medium">Group Chat</h4>
                  <p className="text-sm text-muted-foreground">See moderated messaging in action</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/demo/family')}>
                <CardContent className="pt-6">
                  <DollarSign className="h-8 w-8 text-primary mb-3" />
                  <h4 className="font-medium">Financial Requests</h4>
                  <p className="text-sm text-muted-foreground">Group voting and pledges</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/demo/family')}>
                <CardContent className="pt-6">
                  <MapPin className="h-8 w-8 text-primary mb-3" />
                  <h4 className="font-medium">Check-ins</h4>
                  <p className="text-sm text-muted-foreground">Meeting and location tracking</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Features */}
        <TabsContent value="features" className="space-y-8">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((feature, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h4 className="font-medium mb-1">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
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
                    onClick={() => navigate('/provider-purchase')}
                  >
                    Purchase License
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground/10"
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
