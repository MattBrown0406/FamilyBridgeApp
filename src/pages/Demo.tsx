import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SEOHead, createBreadcrumbSchema } from '@/components/SEOHead';
import {
  Building2, 
  Users, 
  MessageCircle, 
  DollarSign, 
  MapPin, 
  Shield, 
  ArrowRight,
  Eye,
  Check,
  Play,
  Sparkles,
  Pill,
  Brain,
  CreditCard,
  Trash2,
  ShieldCheck,
  FileText,
  Activity
} from 'lucide-react';
import familyBridgeLogo from '@/assets/familybridge-logo.png';
import { usePlatform } from '@/hooks/usePlatform';

const Demo = () => {
  const navigate = useNavigate();
  const { isNative, isIOS } = usePlatform();
  const demoPrimaryColor = '#6366f1';
  const demoName = 'App Review Demo';
  const demoLogo = null;
  const logoNeedsBackground = false;

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
              <Button size="sm" onClick={() => navigate('/provider-purchase')}>
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
      <Tabs defaultValue="review" className="container mx-auto px-3 sm:px-4 pb-8 sm:pb-12">
        <TabsList className="grid w-full max-w-3xl mx-auto grid-cols-4 mb-6 sm:mb-8 h-12 sm:h-14 p-1 sm:p-1.5 bg-primary/10 border border-primary/20 rounded-xl shadow-md">
          <TabsTrigger value="review" className="h-full text-xs sm:text-base font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg rounded-lg transition-all flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2 px-1 sm:px-3">
            <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Review Mode</span>
            <span className="sm:hidden text-[10px] leading-tight text-center">Review</span>
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

        {/* App Review Demo */}
        <TabsContent value="review" className="space-y-8">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  App Review Demo Mode
                </CardTitle>
                <CardDescription>
                  A complete, pre-populated path for Apple Review. No setup, website extraction, or blank account required.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Users className="h-5 w-5" />
                        Family Review Path
                      </CardTitle>
                      <CardDescription>
                        Opens a populated family workspace with chat, FIIS signals, check-ins, documents, boundaries, medication, and financial requests.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button className="w-full justify-between" onClick={() => navigate('/demo/family', { state: { initialFamily: 'johnson' } })}>
                        Stable Aftercare Family
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                      <Button className="w-full justify-between" variant="outline" onClick={() => navigate('/demo/family', { state: { initialFamily: 'davis' } })}>
                        Crisis / Boundary Stress Family
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                      <Button className="w-full justify-between" variant="outline" onClick={() => navigate('/demo/family', { state: { initialFamily: 'mitchell' } })}>
                        Treatment Transition Family
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Building2 className="h-5 w-5" />
                        Provider Review Path
                      </CardTitle>
                      <CardDescription>
                        Opens a populated provider workspace with families, notes, team messaging, coordination cases, outcomes, and CRM context.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button className="w-full justify-between" onClick={() => navigate('/demo/provider')}>
                        Provider Workspace
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                      <Button className="w-full justify-between" variant="outline" onClick={() => navigate('/features/fiis-intelligence')}>
                        FIIS Intelligence
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                      <Button className="w-full justify-between" variant="outline" onClick={() => navigate('/features/provider-outcomes')}>
                        Provider Outcomes
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { icon: MessageCircle, title: 'Secure Family Communication', text: 'Populated message threads and filtered-response examples.' },
                    { icon: Activity, title: 'Accountability & Check-ins', text: 'Meeting check-ins, emotional check-ins, and recovery timeline data.' },
                    { icon: Brain, title: 'FIIS Recovery Intelligence', text: 'Risk signals, trend summaries, observations, and system alignment.' },
                    { icon: DollarSign, title: 'Financial Requests', text: 'Requests, votes, pledges, approvals, and boundary context.' },
                    { icon: Shield, title: 'Boundaries', text: 'Family values, commitments, and documented support limits.' },
                    { icon: FileText, title: 'Documents', text: 'Receipts, support files, medication labels, and intervention letters.' },
                    { icon: CreditCard, title: 'Subscriptions', text: 'Family and provider plans route to in-app purchase screens.' },
                    { icon: Trash2, title: 'Account Deletion', text: 'Signed-in users can delete from Dashboard, Settings, Delete Account.' },
                  ].map((item) => (
                    <Card key={item.title}>
                      <CardContent className="p-4">
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                          <item.icon className="h-5 w-5" />
                        </div>
                        <h4 className="text-sm font-semibold">{item.title}</h4>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.text}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="rounded-xl border bg-muted/30 p-4">
                  <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                    <div>
                      <h4 className="font-semibold">Account review requirements</h4>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Reviewers can use this demo mode immediately, and the App Review demo account should still be provided for live account deletion, purchase restore, and authenticated settings checks.
                      </p>
                    </div>
                    <Button variant="outline" onClick={() => navigate('/auth')}>
                      Sign In for Authenticated Checks
                    </Button>
                  </div>
                </div>

                <Card className="border-primary/25 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <CreditCard className="h-5 w-5" />
                      In-App Purchase Review Paths
                    </CardTitle>
                    <CardDescription>
                      Direct links for Apple Review to locate every in-app purchase in the submitted iOS app.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3 md:grid-cols-3">
                    <Button className="w-full justify-between" onClick={() => navigate('/family-purchase')}>
                      Family Subscription
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Button className="w-full justify-between" variant="outline" onClick={() => navigate('/provider-purchase')}>
                      Provider Subscription
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Button className="w-full justify-between" variant="outline" onClick={() => navigate('/moderator-purchase')}>
                      Guidance Window
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
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
                    onClick={() => navigate('/provider-purchase')}
                  >
                    For Providers
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="lg"
                    onClick={() => navigate('/family-purchase')}
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
