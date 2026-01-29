import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  ArrowLeft,
  Building2,
  Users,
  MessageSquare,
  Brain,
  ClipboardList,
  TrendingUp,
  TrendingDown,
  Activity,
  Send,
  Phone,
  Mail,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Plus,
  Sparkles,
  Target,
  BarChart3,
  FileText,
  UserPlus,
  DollarSign,
  GripVertical,
  Eye,
  Star
} from 'lucide-react';
import familyBridgeLogo from '@/assets/familybridge-logo.png';
import { format, subDays, subHours } from 'date-fns';
import { toast } from 'sonner';

const now = new Date();

// Demo Referral Sources
const DEMO_REFERRAL_SOURCES = [
  { id: 'ref-1', name: 'Hope Harbor Interventions', type: 'intervention_company', contact: 'David Martinez' },
  { id: 'ref-2', name: 'City General Hospital', type: 'hospital', contact: 'Dr. Sarah Kim' },
  { id: 'ref-3', name: 'Self-Referral', type: 'website', contact: null },
  { id: 'ref-4', name: 'Serenity Counseling Center', type: 'therapist', contact: 'Dr. Michelle Brooks' }
];

// Demo CRM Pipeline Data
const DEMO_CRM_LEADS = [
  {
    id: 'lead-1',
    contact_name: 'Sandra Williams',
    contact_email: 'sandra.w@email.com',
    contact_phone: '(555) 123-4567',
    patient_name: 'Marcus Williams',
    patient_age: '24',
    stage: 'new',
    presenting_issue: 'Opioid dependency, recent overdose scare',
    notes: 'Referred by Hope Harbor Interventions. Son was brought to ER after suspected overdose. Mother is desperate for help. David Martinez did initial consult.',
    created_at: format(subHours(now, 4), 'yyyy-MM-dd HH:mm'),
    priority: 'high',
    estimated_value: 9500,
    referral_source: 'Hope Harbor Interventions',
    tags: ['urgent', 'intervention-referral']
  },
  {
    id: 'lead-2',
    contact_name: 'Michael Chen',
    contact_email: 'mchen@email.com',
    contact_phone: '(555) 234-5678',
    patient_name: 'Emily Chen',
    patient_age: '19',
    stage: 'contacted',
    presenting_issue: 'College student, alcohol and benzodiazepine abuse',
    notes: 'Referred by Hope Harbor Interventions after family consultation. Father called after getting call from university. Daughter was placed on academic probation.',
    created_at: format(subDays(now, 2), 'yyyy-MM-dd HH:mm'),
    priority: 'medium',
    estimated_value: 8500,
    referral_source: 'Hope Harbor Interventions',
    tags: ['college-student', 'intervention-referral']
  },
  {
    id: 'lead-3',
    contact_name: 'Jennifer Rodriguez',
    contact_email: 'jen.rodriguez@email.com',
    contact_phone: '(555) 345-6789',
    patient_name: 'Self',
    patient_age: '35',
    stage: 'qualified',
    presenting_issue: 'Alcohol dependency, seeking help voluntarily',
    notes: 'Self-referral via website. Has tried AA but struggles with consistency. Looking for more structured support. Very motivated.',
    created_at: format(subDays(now, 5), 'yyyy-MM-dd HH:mm'),
    priority: 'medium',
    estimated_value: 7500,
    referral_source: 'Self-Referral',
    tags: ['self-referral', 'motivated']
  },
  {
    id: 'lead-4',
    contact_name: 'Thomas & Linda Baker',
    contact_email: 'bakerfamily@email.com',
    contact_phone: '(555) 456-7890',
    patient_name: 'Jason Baker',
    patient_age: '28',
    stage: 'proposal',
    presenting_issue: 'Methamphetamine addiction, lost job, estranged from family',
    notes: 'Referred by Hope Harbor Interventions. Parents attended family education workshop. Ready to proceed with intervention. Scheduling for next week.',
    created_at: format(subDays(now, 8), 'yyyy-MM-dd HH:mm'),
    priority: 'high',
    estimated_value: 10000,
    referral_source: 'Hope Harbor Interventions',
    tags: ['intervention-scheduled']
  },
  {
    id: 'lead-5',
    contact_name: 'Patricia Mitchell',
    contact_email: 'patricia.m@email.com',
    contact_phone: '(555) 567-8901',
    patient_name: 'Tyler Mitchell',
    patient_age: '27',
    stage: 'active',
    presenting_issue: 'Heroin/opioid addiction, in treatment',
    notes: 'Referred by Hope Harbor Interventions. Intervention completed successfully. Tyler is now at Recovery Partners. Transitioned to FamilyBridge for ongoing support.',
    created_at: format(subDays(now, 35), 'yyyy-MM-dd HH:mm'),
    priority: 'medium',
    estimated_value: 9000,
    referral_source: 'Hope Harbor Interventions',
    tags: ['converted', 'active-client']
  },
  {
    id: 'lead-6',
    contact_name: 'Robert & Nancy Clark',
    contact_email: 'clarkfamily@email.com',
    contact_phone: '(555) 678-9012',
    patient_name: 'Daniel Clark',
    patient_age: '31',
    stage: 'new',
    presenting_issue: 'Cocaine and alcohol abuse, gambling debts',
    notes: 'Referred by City General Hospital social worker after ER visit for chest pains linked to substance use. Family unaware of gambling issue.',
    created_at: format(subHours(now, 12), 'yyyy-MM-dd HH:mm'),
    priority: 'high',
    estimated_value: 8750,
    referral_source: 'City General Hospital',
    tags: ['hospital-referral', 'dual-diagnosis']
  },
  {
    id: 'lead-7',
    contact_name: 'Angela Foster',
    contact_email: 'afoster@email.com',
    contact_phone: '(555) 789-0123',
    patient_name: 'Kevin Foster',
    patient_age: '22',
    stage: 'contacted',
    presenting_issue: 'Prescription painkiller addiction after sports injury',
    notes: 'Referred by Dr. Michelle Brooks at Serenity Counseling. Kevin has been seeing therapist but not disclosing full extent of use to family.',
    created_at: format(subDays(now, 3), 'yyyy-MM-dd HH:mm'),
    priority: 'medium',
    estimated_value: 7850,
    referral_source: 'Serenity Counseling Center',
    tags: ['therapist-referral', 'young-adult']
  }
];

// Demo Provider Communications
const DEMO_PROVIDER_MESSAGES = [
  {
    id: 'pm-1',
    thread_type: 'team',
    participants: ['Matt Sullivan', 'Dr. Amanda Chen'],
    family_linked: 'Mitchell Family',
    messages: [
      {
        id: 'm1',
        sender: 'Matt Sullivan',
        content: 'Dr. Chen, wanted to give you a heads up before Tyler\'s family session today. The family did exceptional work during the intervention - they maintained complete unity for 4 days before Tyler agreed to treatment.',
        time: format(subDays(now, 7), 'h:mm a'),
        date: format(subDays(now, 7), 'MMM d')
      },
      {
        id: 'm2',
        sender: 'Dr. Amanda Chen',
        content: 'Thanks Matt. I noticed in the FIIS data that all financial requests during the resistance period were denied unanimously except by Tyler himself. That level of coordination is rare.',
        time: format(subDays(now, 7), 'h:mm a'),
        date: format(subDays(now, 7), 'MMM d')
      },
      {
        id: 'm3',
        sender: 'Matt Sullivan',
        content: 'The dad, Robert, was the weak link initially - classic enabler. But he stepped up during the intervention. I\'d watch him during the transition to sober living though.',
        time: format(subDays(now, 7), 'h:mm a'),
        date: format(subDays(now, 7), 'MMM d')
      },
      {
        id: 'm4',
        sender: 'Dr. Amanda Chen',
        content: 'Good insight. I\'ll make sure to address that in our family work. Tyler has been testing the sober living boundary already - asked his sister if he could stay with her.',
        time: format(subDays(now, 3), 'h:mm a'),
        date: format(subDays(now, 3), 'MMM d')
      },
      {
        id: 'm5',
        sender: 'Matt Sullivan',
        content: 'I saw that in the chat. Jessica handled it perfectly - redirected back to the group boundary. The FamilyBridge visibility really helps.',
        time: format(subDays(now, 3), 'h:mm a'),
        date: format(subDays(now, 3), 'MMM d')
      }
    ]
  },
  {
    id: 'pm-2',
    thread_type: 'team',
    participants: ['Matt Sullivan', 'Sarah Thompson'],
    family_linked: 'Johnson Family',
    messages: [
      {
        id: 'm1',
        sender: 'Sarah Thompson',
        content: 'Michael Johnson hit 125 days today. His transition from sober living has been remarkably smooth.',
        time: format(subDays(now, 1), 'h:mm a'),
        date: format(subDays(now, 1), 'MMM d')
      },
      {
        id: 'm2',
        sender: 'Matt Sullivan',
        content: 'Great news! I remember he was resistant to the sober living idea initially too. Glad the family held that boundary.',
        time: format(subDays(now, 1), 'h:mm a'),
        date: format(subDays(now, 1), 'MMM d')
      }
    ]
  }
];

// Demo Clinical Notes
const DEMO_CLINICAL_NOTES = [
  {
    id: 'cn-1',
    family: 'Mitchell Family',
    member: 'Tyler Mitchell',
    author: 'Matt Sullivan',
    note_type: 'observation',
    confidence: 'high',
    time_horizon: 'immediate',
    include_in_ai: true,
    content: 'Tyler\'s initial resistance during intervention was textbook - denial, anger, attempted manipulation. The family\'s complete communication block was the key factor in his eventual agreement to treatment.',
    created_at: format(subDays(now, 26), 'MMM d, yyyy h:mm a')
  },
  {
    id: 'cn-2',
    family: 'Mitchell Family',
    member: 'Robert Mitchell',
    author: 'Matt Sullivan',
    note_type: 'concern',
    confidence: 'moderate',
    time_horizon: 'emerging',
    include_in_ai: true,
    content: 'Robert (Dad) shows signs of codependency. He was the most reluctant to block Tyler and voted to approve early financial requests. Committed to Al-Anon per intervention letter. Need to monitor follow-through.',
    created_at: format(subDays(now, 25), 'MMM d, yyyy h:mm a')
  },
  {
    id: 'cn-3',
    family: 'Mitchell Family',
    member: 'Tyler Mitchell',
    author: 'Dr. Amanda Chen',
    note_type: 'hypothesis',
    confidence: 'high',
    time_horizon: 'longitudinal',
    include_in_ai: true,
    content: 'Underlying trauma from parents\' divorce at age 12 appears to be core wound. Tyler began using shortly after. Family therapy should address this directly - healing the family system, not just the identified patient.',
    created_at: format(subDays(now, 15), 'MMM d, yyyy h:mm a')
  },
  {
    id: 'cn-4',
    family: 'Mitchell Family',
    member: 'Tyler Mitchell',
    author: 'Dr. Amanda Chen',
    note_type: 'action',
    confidence: 'high',
    time_horizon: 'immediate',
    include_in_ai: false,
    content: 'Tyler testing boundaries around sober living (asked to stay with sister instead). Family held unified response. Reinforce in next session why sober living is clinically necessary, not punitive.',
    created_at: format(subDays(now, 3), 'MMM d, yyyy h:mm a')
  },
  {
    id: 'cn-5',
    family: 'Davis Family',
    member: 'Ashley Davis',
    author: 'Hope Harbor Interventions Consult',
    note_type: 'concern',
    confidence: 'very_high',
    time_horizon: 'immediate',
    include_in_ai: true,
    content: 'GPS check-in matched bar with liquor license, not claimed meeting location. Combined with 15-min checkout and escalating financial requests, strongly suggests active use. Family (except Richard) recognizes this.',
    created_at: format(subDays(now, 5), 'MMM d, yyyy h:mm a')
  }
];

// Demo FIIS Interaction History
const DEMO_FIIS_INTERACTIONS = [
  {
    id: 'fi-1',
    family: 'Mitchell Family',
    moderator: 'Matt Sullivan',
    query: 'What should I watch for as Tyler approaches the end of residential treatment?',
    response: 'Key areas to monitor: 1) Continued boundary testing around sober living - Tyler has already asked to skip it. 2) "Pink cloud" mentality - he\'s feeling better and may underestimate ongoing need for structure. 3) Robert (Dad) potentially backsliding on his Al-Anon commitment. 4) Ensure sober living placement is secured BEFORE discharge to prevent gap in care.',
    timestamp: format(subDays(now, 5), 'MMM d, yyyy h:mm a')
  },
  {
    id: 'fi-2',
    family: 'Mitchell Family',
    moderator: 'Dr. Amanda Chen',
    query: 'How should I frame the divorce trauma in family therapy without Tyler feeling blamed?',
    response: 'Frame the divorce as a family wound, not anyone\'s fault. Use language like "The divorce was hard on everyone, and each of you coped differently. Tyler found substances. Robert buried himself in work. Patricia over-functioned." This distributes the pain across the system and opens space for collective healing rather than Tyler feeling singled out.',
    timestamp: format(subDays(now, 10), 'MMM d, yyyy h:mm a')
  },
  {
    id: 'fi-3',
    family: 'Davis Family',
    moderator: 'Hope Harbor Interventions Consult',
    query: 'Richard is still giving money outside the app. How do I address this with the family?',
    response: 'Richard\'s enabling is a critical barrier to Ashley\'s recovery. Approach: 1) Don\'t shame him - he\'s acting from love, just misdirected. 2) Frame it clinically: "When we give money outside agreed boundaries, we\'re helping the addiction, not Ashley." 3) Share the bar check-in data - concrete evidence of active use. 4) Consider whether Richard needs individual support (Al-Anon or codependency counseling) before Ashley can succeed.',
    timestamp: format(subDays(now, 4), 'MMM d, yyyy h:mm a')
  }
];

const PIPELINE_STAGES = [
  { key: 'new', label: 'New', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { key: 'contacted', label: 'Contacted', color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  { key: 'qualified', label: 'Qualified', color: 'bg-violet-100 text-violet-700 border-violet-200' },
  { key: 'proposal', label: 'Proposal', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { key: 'active', label: 'Active', color: 'bg-green-100 text-green-700 border-green-200' }
];

const DemoProvider = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pipeline');
  const [selectedThread, setSelectedThread] = useState<typeof DEMO_PROVIDER_MESSAGES[0] | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [fiisQuery, setFiisQuery] = useState('');

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    toast.success('Message sent (Demo)', { description: 'In the live app, this would notify the recipient.' });
    setNewMessage('');
  };

  const handleAskFIIS = () => {
    if (!fiisQuery.trim()) return;
    toast.info('FIIS Query Submitted', { description: 'In the live app, AI would analyze family data and respond.' });
    setFiisQuery('');
  };

  const getLeadsByStage = (stage: string) => DEMO_CRM_LEADS.filter(l => l.stage === stage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b backdrop-blur-md bg-background/80 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate('/demo')} className="hover-lift">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Demo
              </Button>
              <div className="h-6 w-px bg-border/50" />
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="font-semibold text-foreground">Hope Harbor Interventions</h1>
                  <p className="text-xs text-muted-foreground">Provider Dashboard Demo</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-violet-100 text-violet-700 border-violet-200">
                <Sparkles className="h-3 w-3 mr-1" />
                Demo Mode
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full max-w-2xl mb-6 h-12 p-1 bg-card border rounded-xl shadow-sm">
            <TabsTrigger value="pipeline" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Pipeline</span>
            </TabsTrigger>
            <TabsTrigger value="communication" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Team Chat</span>
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">Clinical Notes</span>
            </TabsTrigger>
            <TabsTrigger value="fiis" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">FIIS AI</span>
            </TabsTrigger>
          </TabsList>

          {/* Pipeline Tab */}
          <TabsContent value="pipeline" className="space-y-6">
            {/* Pipeline Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {PIPELINE_STAGES.map(stage => {
                const leads = getLeadsByStage(stage.key);
                const value = leads.reduce((sum, l) => sum + (l.estimated_value || 0), 0);
                return (
                  <Card key={stage.key} className={`border ${stage.color.replace('text-', 'border-').replace('100', '200')}`}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={stage.color}>{stage.label}</Badge>
                        <span className="text-2xl font-bold">{leads.length}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">${value.toLocaleString()} value</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Kanban Board */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {PIPELINE_STAGES.map(stage => (
                <div key={stage.key} className="space-y-3">
                  <div className={`p-2 rounded-lg ${stage.color} font-medium text-sm flex items-center justify-between`}>
                    <span>{stage.label}</span>
                    <Badge variant="secondary" className="bg-white/50">{getLeadsByStage(stage.key).length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {getLeadsByStage(stage.key).map(lead => (
                      <Card key={lead.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium text-sm">{lead.contact_name}</p>
                              <p className="text-xs text-muted-foreground">{lead.patient_name}</p>
                            </div>
                            {lead.priority === 'high' && (
                              <Badge variant="destructive" className="text-[10px] h-5">Urgent</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{lead.presenting_issue}</p>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">${lead.estimated_value?.toLocaleString()}</span>
                            <div className="flex gap-1">
                              {lead.tags?.slice(0, 2).map(tag => (
                                <Badge key={tag} variant="outline" className="text-[10px] px-1">{tag}</Badge>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Communication Tab */}
          <TabsContent value="communication" className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              {/* Thread List */}
              <Card className="md:col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    Team Conversations
                    <Button size="icon" variant="ghost" className="h-8 w-8">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {DEMO_PROVIDER_MESSAGES.map(thread => (
                      <button
                        key={thread.id}
                        className={`w-full p-3 text-left hover:bg-muted/50 transition-colors ${selectedThread?.id === thread.id ? 'bg-primary/10' : ''}`}
                        onClick={() => setSelectedThread(thread)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-violet-100 text-violet-700 text-xs">
                              {thread.participants[0].split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{thread.participants.join(', ')}</p>
                            <p className="text-xs text-muted-foreground">{thread.family_linked}</p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {thread.messages[thread.messages.length - 1]?.content}
                        </p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Message View */}
              <Card className="md:col-span-2">
                {selectedThread ? (
                  <>
                    <CardHeader className="pb-2 border-b">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-sm">{selectedThread.participants.join(' & ')}</CardTitle>
                          <CardDescription>Linked to: {selectedThread.family_linked}</CardDescription>
                        </div>
                        <Badge variant="outline">Team Chat</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ScrollArea className="h-[400px] p-4">
                        <div className="space-y-4">
                          {selectedThread.messages.map(msg => (
                            <div key={msg.id} className="flex gap-3">
                              <Avatar className="h-8 w-8 shrink-0">
                                <AvatarFallback className="bg-violet-100 text-violet-700 text-xs">
                                  {msg.sender.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{msg.sender}</span>
                                  <span className="text-xs text-muted-foreground">{msg.date} at {msg.time}</span>
                                </div>
                                <p className="text-sm mt-1">{msg.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      <div className="p-4 border-t">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Type a message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                          />
                          <Button onClick={handleSendMessage}>
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </>
                ) : (
                  <CardContent className="h-[500px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Select a conversation to view messages</p>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
          </TabsContent>

          {/* Clinical Notes Tab */}
          <TabsContent value="notes" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ClipboardList className="h-5 w-5 text-violet-600" />
                      Clinical Notes
                    </CardTitle>
                    <CardDescription>Provider observations linked to FIIS analysis</CardDescription>
                  </div>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Note
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {DEMO_CLINICAL_NOTES.map(note => (
                    <Collapsible
                      key={note.id}
                      open={expandedNotes.has(note.id)}
                      onOpenChange={(open) => {
                        const newSet = new Set(expandedNotes);
                        if (open) newSet.add(note.id);
                        else newSet.delete(note.id);
                        setExpandedNotes(newSet);
                      }}
                    >
                      <div className={`p-4 rounded-lg border ${
                        note.note_type === 'concern' ? 'border-amber-200 bg-amber-50' :
                        note.note_type === 'action' ? 'border-blue-200 bg-blue-50' :
                        note.note_type === 'hypothesis' ? 'border-violet-200 bg-violet-50' :
                        'border-border bg-muted/30'
                      }`}>
                        <CollapsibleTrigger className="w-full">
                          <div className="flex items-start justify-between text-left">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className={`text-xs ${
                                  note.note_type === 'concern' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                  note.note_type === 'action' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                  note.note_type === 'hypothesis' ? 'bg-violet-100 text-violet-700 border-violet-200' :
                                  ''
                                }`}>
                                  {note.note_type}
                                </Badge>
                                <Badge variant="outline" className="text-xs">{note.confidence}</Badge>
                                {note.include_in_ai && (
                                  <Badge className="bg-primary/10 text-primary border-primary/20 text-xs gap-1">
                                    <Brain className="h-3 w-3" />
                                    AI-Linked
                                  </Badge>
                                )}
                              </div>
                              <p className="font-medium text-sm">{note.family} - {note.member}</p>
                              <p className="text-xs text-muted-foreground">{note.author} • {note.created_at}</p>
                            </div>
                            {expandedNotes.has(note.id) ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                            )}
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <p className="text-sm mt-3 pt-3 border-t">{note.content}</p>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FIIS AI Tab */}
          <TabsContent value="fiis" className="space-y-6">
            {/* FIIS Query Interface */}
            <Card className="border-violet-200 bg-gradient-to-r from-violet-50/50 to-purple-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                  FIIS AI Assistant
                </CardTitle>
                <CardDescription>
                  Ask questions about family dynamics, communication strategies, or clinical considerations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Example: What should I watch for as Tyler approaches the end of residential treatment?"
                    value={fiisQuery}
                    onChange={(e) => setFiisQuery(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
                <div className="flex justify-between items-center mt-3">
                  <p className="text-xs text-muted-foreground">
                    FIIS will analyze family data, patterns, and clinical notes to provide guidance.
                  </p>
                  <Button onClick={handleAskFIIS} className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    Ask FIIS
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Previous Interactions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Recent FIIS Consultations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {DEMO_FIIS_INTERACTIONS.map(interaction => (
                    <div key={interaction.id} className="p-4 rounded-lg bg-muted/50 border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{interaction.family}</Badge>
                          <span className="text-xs text-muted-foreground">{interaction.moderator}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{interaction.timestamp}</span>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Question:</p>
                          <p className="text-sm italic">"{interaction.query}"</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">FIIS Response:</p>
                          <p className="text-sm">{interaction.response}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default DemoProvider;