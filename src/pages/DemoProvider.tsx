import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  ArrowLeft,
  Building2,
  Users,
  MessageSquare,
  Brain,
  ClipboardList,
  Activity,
  Send,
  Phone,
  Mail,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  Target,
  BarChart3,
  FileText,
  UserPlus,
  DollarSign,
  CreditCard,
  Settings,
  Shield,
  LineChart,
  GitBranch,
  HeartPulse,
} from 'lucide-react';
import familyBridgeLogo from '@/assets/familybridge-logo.png';
import { toast } from 'sonner';
import { TutorialModal } from '@/components/tutorial/TutorialModal';
import { TutorialControls } from '@/components/tutorial/TutorialControls';
import { providerAdminSteps } from '@/components/tutorial/tutorialSteps';

interface DemoBranding {
  primaryColor: string;
  logo: string | null;
  logoNeedsBackground?: boolean;
  name: string;
}

const DEMO_FAMILIES = [
  {
    id: 'johnson',
    name: 'Johnson Family',
    stage: 'Aftercare',
    status: 'Stable progress',
    moderator: 'Matt Brown',
    health: 'improving',
    lastActivity: 'Michael checked into an AA meeting 12 min ago',
    members: 7,
    activeTasks: 3,
    pendingFinancials: 1,
    fiisSignal: 'Low concern, strong consistency',
    note: '125 days sober, family alignment is holding, aftercare structure is working.',
  },
  {
    id: 'davis',
    name: 'Davis Family',
    stage: 'Crisis stabilization',
    status: 'Needs close support',
    moderator: 'Tasha Miller',
    health: 'high-risk',
    lastActivity: 'Boundary dispute in chat 48 min ago',
    members: 5,
    activeTasks: 6,
    pendingFinancials: 2,
    fiisSignal: 'Escalation risk around money and safety',
    note: 'Active addiction, repeated emergency-style asks, one family member still wavering.',
  },
  {
    id: 'mitchell',
    name: 'Mitchell Family',
    stage: 'Treatment transition',
    status: 'Transition planning',
    moderator: 'Matt Brown',
    health: 'watch',
    lastActivity: 'Discharge planning note updated 2h ago',
    members: 6,
    activeTasks: 5,
    pendingFinancials: 0,
    fiisSignal: 'Watch for side deals during sober living handoff',
    note: 'Intervention succeeded, treatment entry complete, family is preparing for sober living and aftercare.',
  },
] as const;

const DEMO_TEAM = [
  {
    id: 'team-1',
    name: 'Matt Brown',
    role: 'Lead Interventionist',
    workload: '2 active families, 1 transition case',
    focus: 'Johnson aftercare cadence + Mitchell discharge plan',
    coverage: 'Primary moderator',
  },
  {
    id: 'team-2',
    name: 'Tasha Miller',
    role: 'Family Support Moderator',
    workload: '1 crisis family, 2 observation families',
    focus: 'Davis crisis de-escalation and consistent money boundaries',
    coverage: 'Evenings + weekends',
  },
  {
    id: 'team-3',
    name: 'Dr. Sarah Thompson',
    role: 'Clinical Partner',
    workload: 'Therapy and treatment handoff review',
    focus: 'Mitchell transition risks and Johnson ongoing recovery support',
    coverage: 'Treatment / therapy coordination',
  },
] as const;

const DEMO_NOTES = [
  {
    id: 'note-1',
    family: 'Johnson Family',
    member: 'Michael Johnson',
    author: 'Matt Brown',
    type: 'Progress note',
    includeInAi: true,
    createdAt: 'Today, 8:32 AM',
    content:
      'Michael is responding well to accountability without appearing overly managed. Family praise is healthy right now, but I want to keep redirecting support back to routines instead of emotional over-parenting.',
  },
  {
    id: 'note-2',
    family: 'Davis Family',
    member: 'Chris Davis',
    author: 'Tasha Miller',
    type: 'Risk note',
    includeInAi: true,
    createdAt: 'Today, 7:14 AM',
    content:
      'Pattern remains the same: urgent money asks, blame, and attempts to split the family. Dad still drafts softer replies in private. He needs direct coaching before the next likely flare-up.',
  },
  {
    id: 'note-3',
    family: 'Mitchell Family',
    member: 'Tyler Mitchell',
    author: 'Dr. Sarah Thompson',
    type: 'Transition note',
    includeInAi: false,
    createdAt: 'Yesterday, 4:10 PM',
    content:
      'Treatment team wants sober living to remain non-negotiable. Family should expect Tyler to test for private exceptions during the first discharge conversation.',
  },
] as const;

const DEMO_THREADS = [
  {
    id: 'thread-1',
    title: 'Johnson aftercare team',
    family: 'Johnson Family',
    participants: ['Matt Brown', 'Dr. Sarah Thompson'],
    preview: 'Keep the family affirming progress, but don’t let support turn into rescuing.',
    messages: [
      { sender: 'Dr. Sarah Thompson', at: '8:05 AM', content: 'Michael sounds grounded. I would keep the family focused on meeting cadence and the request workflow.' },
      { sender: 'Matt Brown', at: '8:11 AM', content: 'Agreed. Sarah is supportive, but I want to keep her from jumping in too fast when he feels anxious.' },
      { sender: 'Dr. Sarah Thompson', at: '8:14 AM', content: 'That matches what I’m seeing. He benefits from support that reinforces structure, not relief from discomfort.' },
    ],
  },
  {
    id: 'thread-2',
    title: 'Davis crisis response',
    family: 'Davis Family',
    participants: ['Tasha Miller', 'Matt Brown'],
    preview: 'Need tighter wording before the next emergency-style request lands.',
    messages: [
      { sender: 'Tasha Miller', at: '7:32 AM', content: 'Chris sent another “I’m stranded” text. Same pattern as last week, no proof, trying to trigger panic.' },
      { sender: 'Matt Brown', at: '7:36 AM', content: 'Let’s keep the reply short. No money. Offer transportation only toward treatment, meeting, or a verified safe option.' },
      { sender: 'Tasha Miller', at: '7:42 AM', content: 'I’ll coach dad before he responds. He is still the one most likely to break ranks.' },
    ],
  },
  {
    id: 'thread-3',
    title: 'Mitchell discharge planning',
    family: 'Mitchell Family',
    participants: ['Matt Brown', 'Dr. Sarah Thompson', 'Jessica Mitchell'],
    preview: 'Family needs one clean plan before Tyler starts shopping for softer options.',
    messages: [
      { sender: 'Matt Brown', at: 'Yesterday', content: 'We should assume Tyler will ask to bypass sober living and stay with family instead.' },
      { sender: 'Dr. Sarah Thompson', at: 'Yesterday', content: 'Yes. The cleaner the family wording is now, the less chance there is of triangulation after discharge.' },
      { sender: 'Jessica Mitchell', at: 'Yesterday', content: 'Understood. I’ll keep my answer aligned with the written plan and won’t negotiate privately.' },
    ],
  },
] as const;

const DEMO_COORDINATION_CASES = [
  {
    id: 'case-1',
    family: 'Mitchell Family',
    title: 'Treatment to sober living handoff',
    owner: 'Matt Brown',
    phase: 'Transition planning',
    priority: 'High',
    summary: 'Treatment is finishing this week. Family needs one shared plan for sober living, finances, and communication boundaries before discharge.',
    blockers: ['Waiting on final discharge packet', 'Need sober living intake time confirmed'],
    nextSteps: [
      'Confirm sober living bed and intake window',
      'Share discharge summary with all approved family members',
      'Lock in first-week aftercare check-ins inside FamilyBridge',
    ],
    timeline: [
      'Intervention completed successfully 26 days ago',
      'Treatment team reports solid engagement',
      'Discharge call scheduled for tomorrow at 11:00 AM',
    ],
  },
  {
    id: 'case-2',
    family: 'Davis Family',
    title: 'Crisis containment and family alignment',
    owner: 'Tasha Miller',
    phase: 'Active crisis',
    priority: 'Urgent',
    summary: 'Family needs tighter alignment before the next likely money / housing flare-up. Current risk is one member privately overriding group boundaries.',
    blockers: ['Dad still softening replies in private', 'No verified transportation plan if treatment is accepted'],
    nextSteps: [
      'Coach both parents on the exact response script',
      'Create transportation-only contingency plan',
      'Flag any private side deals immediately in team messaging',
    ],
    timeline: [
      'Threat-based money ask yesterday evening',
      'Family remained aligned publicly',
      'Private rescue attempt detected and corrected this morning',
    ],
  },
  {
    id: 'case-3',
    family: 'Johnson Family',
    title: 'Aftercare maintenance review',
    owner: 'Matt Brown',
    phase: 'Aftercare',
    priority: 'Routine',
    summary: 'Family is doing well. Main job is keeping support healthy without over-functioning.',
    blockers: ['None'],
    nextSteps: [
      'Keep financial requests routed through the app',
      'Review check-in consistency next week',
      'Continue reinforcing meeting and therapy cadence',
    ],
    timeline: [
      '125 days sober today',
      'Family engagement remains high',
      'No concerning FIIS trend this week',
    ],
  },
] as const;

const DEMO_PIPELINE = [
  {
    id: 'lead-1',
    name: 'Sandra Williams',
    patient: 'Marcus Williams',
    stage: 'New',
    value: '$9,500',
    source: 'Hope Harbor Interventions',
    note: 'Opioid use, recent overdose scare, family highly motivated.',
  },
  {
    id: 'lead-2',
    name: 'Michael Chen',
    patient: 'Emily Chen',
    stage: 'Contacted',
    value: '$8,500',
    source: 'Provider referral',
    note: 'College family seeking intervention guidance after campus incident.',
  },
  {
    id: 'lead-3',
    name: 'Jennifer Rodriguez',
    patient: 'Self referral',
    stage: 'Qualified',
    value: '$7,500',
    source: 'Website',
    note: 'Motivated prospect, wants structure after inconsistent AA attendance.',
  },
  {
    id: 'lead-4',
    name: 'Baker Family',
    patient: 'Jason Baker',
    stage: 'Proposal',
    value: '$10,000',
    source: 'Hope Harbor Interventions',
    note: 'Intervention likely next week, family already attended education call.',
  },
] as const;

const DEMO_ANALYTICS = [
  { label: 'Active families', value: '3', subtext: '2 moderated by Matt, 1 by Tasha' },
  { label: 'Open coordination cases', value: '3', subtext: '1 urgent, 1 high, 1 routine' },
  { label: 'Pending financial requests', value: '3', subtext: '2 Davis, 1 Johnson' },
  { label: 'Families needing attention today', value: '2', subtext: 'Davis and Mitchell' },
] as const;

const statusTone = {
  improving: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  watch: 'bg-amber-100 text-amber-700 border-amber-200',
  'high-risk': 'bg-rose-100 text-rose-700 border-rose-200',
} as const;

const DemoProvider = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = (location.state as { branding?: DemoBranding } | null) ?? null;
  const branding = locationState?.branding;

  const [activeArea, setActiveArea] = useState('workspace');
  const [workspaceTab, setWorkspaceTab] = useState('notes');
  const [adminTab, setAdminTab] = useState('families');
  const [selectedThreadId, setSelectedThreadId] = useState<string>(DEMO_THREADS[0].id);
  const [selectedCaseId, setSelectedCaseId] = useState<string>(DEMO_COORDINATION_CASES[0].id);
  const [analyticsTab, setAnalyticsTab] = useState('overview');

  const selectedThread = useMemo(
    () => DEMO_THREADS.find((thread) => thread.id === selectedThreadId) ?? DEMO_THREADS[0],
    [selectedThreadId]
  );

  const selectedCase = useMemo(
    () => DEMO_COORDINATION_CASES.find((item) => item.id === selectedCaseId) ?? DEMO_COORDINATION_CASES[0],
    [selectedCaseId]
  );

  const accentStyle = branding ? { backgroundColor: branding.primaryColor } : undefined;
  const accentBorderStyle = branding ? { borderColor: branding.primaryColor } : undefined;

  return (
    <div className="min-h-screen bg-background">
      <TutorialModal steps={providerAdminSteps} storageKey="fb_tutorial_demo_provider" />
      <header className="border-b bg-card sticky top-0 z-20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/demo')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className={`h-11 w-11 rounded-xl border bg-white flex items-center justify-center overflow-hidden ${branding?.logoNeedsBackground ? 'p-2' : 'p-0'}`}>
                <img src={branding?.logo || familyBridgeLogo} alt={branding?.name || 'FamilyBridge'} className="max-h-full max-w-full object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">{branding?.name || 'Hope Harbor Interventions'} provider demo</h1>
                <p className="text-sm text-muted-foreground">Demo workspace shaped to match the current provider-facing FamilyBridge experience.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => navigate('/provider-purchase')}>
                <CreditCard className="h-4 w-4 mr-2" />
                Provider IAP
              </Button>
              <Button variant={activeArea === 'workspace' ? 'default' : 'outline'} style={activeArea === 'workspace' ? accentStyle : undefined} onClick={() => setActiveArea('workspace')}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Workspace
              </Button>
              <Button variant={activeArea === 'coordination' ? 'default' : 'outline'} style={activeArea === 'coordination' ? accentStyle : undefined} onClick={() => setActiveArea('coordination')}>
                <ClipboardList className="h-4 w-4 mr-2" />
                Coordination
              </Button>
              <Button variant={activeArea === 'admin' ? 'default' : 'outline'} style={activeArea === 'admin' ? accentStyle : undefined} onClick={() => setActiveArea('admin')}>
                <Settings className="h-4 w-4 mr-2" />
                Admin
              </Button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            {DEMO_ANALYTICS.map((metric) => (
              <Card key={metric.label} className="shadow-sm">
                <CardContent className="pt-5">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{metric.label}</p>
                  <p className="mt-1 text-2xl font-semibold">{metric.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{metric.subtext}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {activeArea === 'workspace' && (
          <div className="space-y-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Provider workspace</h2>
                <p className="text-sm text-muted-foreground">Notes, team messaging, and FIIS summaries grouped the way providers actually work.</p>
              </div>
              <Tabs value={workspaceTab} onValueChange={setWorkspaceTab} className="w-full lg:w-auto">
                <TabsList>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                  <TabsTrigger value="messaging">Messaging</TabsTrigger>
                  <TabsTrigger value="fiis">FIIS</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {workspaceTab === 'notes' && (
              <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-4">
                  {DEMO_NOTES.map((note) => (
                    <Card key={note.id} className="shadow-sm">
                      <CardHeader className="pb-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <CardTitle className="text-base">{note.family}</CardTitle>
                            <CardDescription>{note.member} • {note.type}</CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="outline">{note.author}</Badge>
                            <Badge variant={note.includeInAi ? 'default' : 'secondary'}>{note.includeInAi ? 'Included in AI' : 'Private note'}</Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">{note.content}</p>
                        <p className="text-xs text-muted-foreground">{note.createdAt}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card className="shadow-sm h-fit">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Add provider note
                    </CardTitle>
                    <CardDescription>Static demo composer to show the current provider note flow.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Input value="Johnson Family" readOnly />
                    <Input value="Michael Johnson" readOnly />
                    <Textarea
                      readOnly
                      value="Observed consistent structure and healthy family reinforcement. Recommend continuing to redirect support through the agreed recovery plan."
                      className="min-h-[140px]"
                    />
                    <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
                      <span>Include this note in FIIS / AI context</span>
                      <Badge>Enabled</Badge>
                    </div>
                    <Button className="w-full" onClick={() => toast.info('Demo mode: note creation is disabled')}>Save Demo Note</Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {workspaceTab === 'messaging' && (
              <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Team threads</CardTitle>
                    <CardDescription>Provider-to-provider coordination around active families.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {DEMO_THREADS.map((thread) => (
                      <button
                        key={thread.id}
                        type="button"
                        onClick={() => setSelectedThreadId(thread.id)}
                        className={`w-full rounded-xl border p-3 text-left transition ${selectedThreadId === thread.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/40'}`}
                        style={selectedThreadId === thread.id ? accentBorderStyle : undefined}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-sm">{thread.title}</p>
                          <Badge variant="outline">{thread.family}</Badge>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">{thread.preview}</p>
                      </button>
                    ))}
                  </CardContent>
                </Card>

                <Card className="shadow-sm min-w-0">
                  <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <CardTitle className="text-base">{selectedThread.title}</CardTitle>
                        <CardDescription>{selectedThread.family} • {selectedThread.participants.join(', ')}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => toast.info('Demo mode: call actions are disabled')}>
                          <Phone className="h-4 w-4 mr-2" />
                          Call
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => toast.info('Demo mode: email actions are disabled')}>
                          <Mail className="h-4 w-4 mr-2" />
                          Email
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 min-w-0">
                    <ScrollArea className="h-[420px] pr-4">
                      <div className="space-y-4">
                        {selectedThread.messages.map((message, index) => (
                          <div key={`${message.sender}-${index}`} className="flex gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback>{message.sender.split(' ').map((part) => part[0]).join('').slice(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-medium">{message.sender}</p>
                                <span className="text-xs text-muted-foreground">{message.at}</span>
                              </div>
                              <div className="mt-1 rounded-xl border bg-muted/20 p-3 text-sm text-muted-foreground">
                                {message.content}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    <div className="flex gap-2">
                      <Input readOnly value="Add a team update or handoff note…" />
                      <Button onClick={() => toast.info('Demo mode: messages are read-only')}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {workspaceTab === 'fiis' && (
              <div className="grid gap-4 lg:grid-cols-3">
                {DEMO_FAMILIES.map((family) => (
                  <Card key={family.id} className="shadow-sm">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <CardTitle className="text-base">{family.name}</CardTitle>
                          <CardDescription>{family.stage}</CardDescription>
                        </div>
                        <Badge className={statusTone[family.health]} variant="outline">{family.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="rounded-xl border bg-muted/20 p-3">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">FIIS signal</p>
                        <p className="mt-1 text-sm font-medium">{family.fiisSignal}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">{family.note}</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="rounded-lg border p-3">
                          <p className="text-xs text-muted-foreground">Open tasks</p>
                          <p className="text-lg font-semibold">{family.activeTasks}</p>
                        </div>
                        <div className="rounded-lg border p-3">
                          <p className="text-xs text-muted-foreground">Pending financials</p>
                          <p className="text-lg font-semibold">{family.pendingFinancials}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeArea === 'coordination' && (
          <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Coordination cases</CardTitle>
                <CardDescription>Current provider-side handoffs, discharge work, and crisis coordination.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {DEMO_COORDINATION_CASES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedCaseId(item.id)}
                    className={`w-full rounded-xl border p-3 text-left transition ${selectedCaseId === item.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/30'}`}
                    style={selectedCaseId === item.id ? accentBorderStyle : undefined}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm">{item.family}</p>
                      <Badge variant={item.priority === 'Urgent' ? 'destructive' : item.priority === 'High' ? 'default' : 'secondary'}>{item.priority}</Badge>
                    </div>
                    <p className="mt-1 text-sm">{item.title}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{item.phase} • Owner: {item.owner}</p>
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card className="shadow-sm min-w-0">
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">{selectedCase.title}</CardTitle>
                    <CardDescription>{selectedCase.family} • {selectedCase.phase}</CardDescription>
                  </div>
                  <Badge variant={selectedCase.priority === 'Urgent' ? 'destructive' : selectedCase.priority === 'High' ? 'default' : 'secondary'}>{selectedCase.priority}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="space-y-4">
                    <div className="rounded-xl border bg-muted/20 p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Case summary</p>
                      <p className="mt-2 text-sm text-muted-foreground">{selectedCase.summary}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">Next steps</p>
                      <div className="space-y-2">
                        {selectedCase.nextSteps.map((step) => (
                          <div key={step} className="flex items-start gap-2 rounded-lg border p-3 text-sm">
                            <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Blockers</p>
                      <div className="space-y-2">
                        {selectedCase.blockers.map((blocker) => (
                          <div key={blocker} className="flex items-start gap-2 rounded-lg border p-3 text-sm">
                            <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                            <span>{blocker}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">Timeline</p>
                      <div className="space-y-2">
                        {selectedCase.timeline.map((event) => (
                          <div key={event} className="flex items-start gap-2 rounded-lg border p-3 text-sm">
                            <Clock className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                            <span>{event}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeArea === 'admin' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">Provider admin</h2>
              <p className="text-sm text-muted-foreground">Families, moderators, CRM, branding, and reporting in one place.</p>
            </div>

            <Tabs value={adminTab} onValueChange={setAdminTab}>
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto">
                <TabsTrigger value="families">Families</TabsTrigger>
                <TabsTrigger value="moderators">Moderators</TabsTrigger>
                <TabsTrigger value="crm">CRM</TabsTrigger>
                <TabsTrigger value="branding">Branding</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="families" className="mt-4">
                <div className="grid gap-4 lg:grid-cols-3">
                  {DEMO_FAMILIES.map((family) => (
                    <Card key={family.id} className="shadow-sm">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <CardTitle className="text-base">{family.name}</CardTitle>
                            <CardDescription>{family.stage}</CardDescription>
                          </div>
                          <Badge className={statusTone[family.health]} variant="outline">{family.status}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p><span className="font-medium text-foreground">Moderator:</span> {family.moderator}</p>
                          <p><span className="font-medium text-foreground">Members:</span> {family.members}</p>
                          <p><span className="font-medium text-foreground">Last activity:</span> {family.lastActivity}</p>
                        </div>
                        <div className="rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground">{family.note}</div>
                        <div className="flex gap-2">
                          <Button variant="outline" className="flex-1" onClick={() => navigate('/demo/family', { state: { branding, initialFamily: family.id } })}>Open family demo</Button>
                          <Button className="flex-1" onClick={() => toast.info('Demo mode: family management actions are disabled')}>Manage</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="moderators" className="mt-4">
                <div className="grid gap-4 lg:grid-cols-3">
                  {DEMO_TEAM.map((member) => (
                    <Card key={member.id} className="shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-base">{member.name}</CardTitle>
                        <CardDescription>{member.role}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm text-muted-foreground">
                        <p><span className="font-medium text-foreground">Current workload:</span> {member.workload}</p>
                        <p><span className="font-medium text-foreground">Focus:</span> {member.focus}</p>
                        <p><span className="font-medium text-foreground">Coverage:</span> {member.coverage}</p>
                        <Button variant="outline" className="w-full" onClick={() => toast.info('Demo mode: moderator management is disabled')}>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Adjust Coverage
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="crm" className="mt-4">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {DEMO_PIPELINE.map((lead) => (
                    <Card key={lead.id} className="shadow-sm">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <CardTitle className="text-base">{lead.name}</CardTitle>
                            <CardDescription>{lead.patient}</CardDescription>
                          </div>
                          <Badge variant="outline">{lead.stage}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm text-muted-foreground">
                        <p><span className="font-medium text-foreground">Estimated value:</span> {lead.value}</p>
                        <p><span className="font-medium text-foreground">Source:</span> {lead.source}</p>
                        <p>{lead.note}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="branding" className="mt-4">
                <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                  <Card className="shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-base">Organization branding</CardTitle>
                      <CardDescription>What providers edit here also reshapes the family-facing demo surfaces.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3 rounded-xl border p-4">
                        <div className={`h-14 w-14 rounded-xl border bg-white flex items-center justify-center overflow-hidden ${branding?.logoNeedsBackground ? 'p-2' : 'p-0'}`}>
                          <img src={branding?.logo || familyBridgeLogo} alt={branding?.name || 'Organization'} className="max-h-full max-w-full object-contain" />
                        </div>
                        <div>
                          <p className="font-medium">{branding?.name || 'Hope Harbor Interventions'}</p>
                          <p className="text-sm text-muted-foreground">Current provider demo organization</p>
                        </div>
                      </div>
                      <div className="rounded-lg border p-4">
                        <p className="text-sm font-medium">Primary color</p>
                        <div className="mt-3 flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full border" style={accentStyle} />
                          <p className="text-sm text-muted-foreground">{branding?.primaryColor || '#7c3aed'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-base">Family experience preview</CardTitle>
                      <CardDescription>The demo now keeps provider context aligned with what families see in the live app.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3 md:grid-cols-2 text-sm">
                      <div className="rounded-xl border p-4">
                        <p className="font-medium flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Family chat</p>
                        <p className="mt-2 text-muted-foreground">Same family-level messages, check-ins, financial requests, boundaries, and coaching context shown in the demo family dashboards.</p>
                      </div>
                      <div className="rounded-xl border p-4">
                        <p className="font-medium flex items-center gap-2"><Brain className="h-4 w-4" /> FIIS support</p>
                        <p className="mt-2 text-muted-foreground">Provider notes, coaching summaries, and family patterns stay synchronized with the provider-side view.</p>
                      </div>
                      <div className="rounded-xl border p-4">
                        <p className="font-medium flex items-center gap-2"><Shield className="h-4 w-4" /> Boundaries + transitions</p>
                        <p className="mt-2 text-muted-foreground">Crisis, treatment transition, and aftercare states are represented across multiple demo families instead of one generic mock.</p>
                      </div>
                      <div className="rounded-xl border p-4">
                        <p className="font-medium flex items-center gap-2"><Sparkles className="h-4 w-4" /> Sales realism</p>
                        <p className="mt-2 text-muted-foreground">Prospects can see both the family app and the provider operational layer in a believable end-to-end flow.</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="mt-4 space-y-4">
                <div className="grid gap-4 lg:grid-cols-4">
                  <Card className="shadow-sm">
                    <CardContent className="pt-5">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Treatment completion</p>
                      <p className="mt-1 text-2xl font-semibold">72%</p>
                      <p className="text-xs text-muted-foreground mt-1">Across all demo episodes tracked in FamilyBridge.</p>
                    </CardContent>
                  </Card>
                  <Card className="shadow-sm">
                    <CardContent className="pt-5">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">1-year sober</p>
                      <p className="mt-1 text-2xl font-semibold">47%</p>
                      <p className="text-xs text-muted-foreground mt-1">Unified apples-to-apples benchmark across levels of care.</p>
                    </CardContent>
                  </Card>
                  <Card className="shadow-sm">
                    <CardContent className="pt-5">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Aftercare adherence</p>
                      <p className="mt-1 text-2xl font-semibold">61%</p>
                      <p className="text-xs text-muted-foreground mt-1">Started the recommended next step within 7 days.</p>
                    </CardContent>
                  </Card>
                  <Card className="shadow-sm">
                    <CardContent className="pt-5">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Readmission anywhere</p>
                      <p className="mt-1 text-2xl font-semibold">19%</p>
                      <p className="text-xs text-muted-foreground mt-1">Any treatment readmission within 365 days.</p>
                    </CardContent>
                  </Card>
                </div>

                <Tabs value={analyticsTab} onValueChange={setAnalyticsTab}>
                  <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="collection">Collection</TabsTrigger>
                    <TabsTrigger value="reporting">Reporting</TabsTrigger>
                    <TabsTrigger value="pitch">Provider Pitch</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="mt-4">
                    <div className="grid gap-4 xl:grid-cols-2">
                      <Card className="shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2"><LineChart className="h-4 w-4" /> Outcomes this center can track</CardTitle>
                          <CardDescription>Built-in longitudinal measurement across residential, outpatient, and sober living.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-muted-foreground">
                          <div className="rounded-xl border p-4">
                            <p className="font-medium text-foreground">Treatment completion by level of care</p>
                            <p className="mt-1">30-day residential, 90-day residential, outpatient, and sober living all tracked using the same definitions.</p>
                          </div>
                          <div className="rounded-xl border p-4">
                            <p className="font-medium text-foreground">1-year sobriety benchmarking</p>
                            <p className="mt-1">Use sober at 365 days as the clean universal comparison point instead of a dozen inconsistent success definitions.</p>
                          </div>
                          <div className="rounded-xl border p-4">
                            <p className="font-medium text-foreground">Aftercare follow-through</p>
                            <p className="mt-1">Track whether the patient actually followed the step-down plan after discharge, not just whether it was recommended.</p>
                          </div>
                          <div className="rounded-xl border p-4">
                            <p className="font-medium text-foreground">Readmission honesty</p>
                            <p className="mt-1">Separate same-provider readmission from any-program readmission so the metrics stay honest.</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> Age and gender segmentation</CardTitle>
                          <CardDescription>Providers can see performance by age band and gender without pretending those are the only drivers.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
                          <div className="rounded-xl border p-4">
                            <p className="font-medium">Men 18-30</p>
                            <p className="text-muted-foreground mt-1">Completion 62%, 1-year sober 31%, aftercare 44%</p>
                          </div>
                          <div className="rounded-xl border p-4">
                            <p className="font-medium">Women 18-30</p>
                            <p className="text-muted-foreground mt-1">Completion 68%, 1-year sober 37%, aftercare 51%</p>
                          </div>
                          <div className="rounded-xl border p-4">
                            <p className="font-medium">Men 30+</p>
                            <p className="text-muted-foreground mt-1">Completion 74%, 1-year sober 46%, aftercare 63%</p>
                          </div>
                          <div className="rounded-xl border p-4">
                            <p className="font-medium">Women 30+</p>
                            <p className="text-muted-foreground mt-1">Completion 77%, 1-year sober 49%, aftercare 67%</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="collection" className="mt-4">
                    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4 text-sm text-muted-foreground">
                      <Card className="shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-base">Episode intake</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <p>Level of care</p>
                          <p>Age band and gender</p>
                          <p>Admit date and primary substance</p>
                          <p>Provider and facility</p>
                        </CardContent>
                      </Card>
                      <Card className="shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-base">Discharge capture</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <p>Completed vs left early</p>
                          <p>Discharge date</p>
                          <p>Recommended next step</p>
                          <p>Family engagement at discharge</p>
                        </CardContent>
                      </Card>
                      <Card className="shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-base">Follow-up checkpoints</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <p>30 / 90 / 180 / 365 day sobriety</p>
                          <p>Aftercare participation</p>
                          <p>Living environment</p>
                          <p>Relapse or return-to-use signals</p>
                        </CardContent>
                      </Card>
                      <Card className="shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-base">Confidence labels</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <p>Family-reported</p>
                          <p>Self-reported</p>
                          <p>Provider-confirmed</p>
                          <p>Multi-source confirmed</p>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="reporting" className="mt-4">
                    <div className="grid gap-4 xl:grid-cols-2 text-sm text-muted-foreground">
                      <Card className="shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2"><GitBranch className="h-4 w-4" /> Benchmark reporting</CardTitle>
                          <CardDescription>What FamilyBridge can report back to each treatment center.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="rounded-xl border p-4">Center-specific completion rates vs network average</div>
                          <div className="rounded-xl border p-4">1-year sobriety by level of care</div>
                          <div className="rounded-xl border p-4">Aftercare adherence impact on outcomes</div>
                          <div className="rounded-xl border p-4">Age and gender breakdowns</div>
                          <div className="rounded-xl border p-4">Same-provider vs any-program readmission</div>
                        </CardContent>
                      </Card>
                      <Card className="shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2"><HeartPulse className="h-4 w-4" /> Why providers care</CardTitle>
                          <CardDescription>This is not just a family app anymore. It becomes a performance intelligence layer.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="rounded-xl border p-4">Providers usually lose visibility after discharge. FamilyBridge keeps it.</div>
                          <div className="rounded-xl border p-4">Centers can see whether their aftercare plans are actually being followed.</div>
                          <div className="rounded-xl border p-4">Leadership gets private scorecards without public shaming.</div>
                          <div className="rounded-xl border p-4">Over time they learn what pathways produce the best long-term outcomes.</div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="pitch" className="mt-4">
                    <Card className="shadow-sm border-primary/20 bg-primary/5">
                      <CardContent className="pt-6 space-y-4 text-sm text-muted-foreground">
                        <p className="text-primary font-medium">Provider-facing positioning</p>
                        <p>
                          FamilyBridge gives treatment providers a private outcomes intelligence layer that follows families beyond discharge,
                          tracks treatment completion, aftercare adherence, 30/90/180/365-day sobriety, and readmission, and benchmarks each center against anonymized network-wide performance.
                        </p>
                        <p>
                          That means providers can finally answer questions like: which levels of care perform best, which patient segments need stronger follow-through,
                          and whether their discharge plans are producing long-term recovery or just good discharge-day optics.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Button onClick={() => navigate('/features/provider-outcomes')}>Open full demo page</Button>
                          <Button variant="outline" onClick={() => toast.info('Demo mode: exporting analytics is disabled')}>
                            Export sample report
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  );
};

export default DemoProvider;
