import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FinancialRequestCard } from '@/components/FinancialRequestCard';
import { 
  ArrowLeft, 
  Send, 
  Users, 
  DollarSign, 
  MessageCircle, 
  MapPin,
  Shield,
  Check,
  X,
  ThumbsUp,
  ThumbsDown,
  Clock,
  CheckCircle,
  Target,
  Calendar,
  AlertTriangle,
  Sparkles,
  Paperclip,
  FileText,
  TrendingUp,
  Activity,
  Mail,
  FlaskConical,
  Crown
} from 'lucide-react';
import familyBridgeLogo from '@/assets/familybridge-logo.png';
import { format } from 'date-fns';
import demoElectricBill from '@/assets/demo-electric-bill.png';
import { toast } from 'sonner';

import demoGasReceipt from '@/assets/demo-gas-receipt.png';

// Demo data
const DEMO_MEMBERS = [
  { id: '0', name: 'Matt Brown', role: 'moderator', relationship: 'Case Manager', initials: 'MB' },
  { id: '1', name: 'Sarah Johnson', role: 'admin', relationship: 'Parent', initials: 'SJ' },
  { 
    id: '2', 
    name: 'Michael Johnson', 
    role: 'recovering', 
    relationship: 'Recovering', 
    initials: 'MJ',
    paymentInfo: {
      paypal: 'michael.johnson@email.com',
      venmo: '@MichaelJ-Recovery',
      cashapp: '$MichaelJohnson47'
    }
  },
  { id: '3', name: 'David Johnson', role: 'member', relationship: 'Sibling', initials: 'DJ' },
  { id: '4', name: 'Emily Johnson', role: 'member', relationship: 'Spouse', initials: 'EJ' },
  { id: '5', name: 'Robert Johnson', role: 'member', relationship: 'Grandparent', initials: 'RJ' },
];

const DEMO_MESSAGES = [
  { id: '1', sender: 'Sarah Johnson', senderId: '1', content: 'Good morning everyone! Michael, how did last night go?', time: '9:15 AM' },
  { id: '2', sender: 'Michael Johnson', senderId: '2', content: 'Morning mom. Went to my AA meeting last night. 47 days sober today 🙏', time: '9:22 AM' },
  { id: '3', sender: 'Emily Johnson', senderId: '4', content: 'That\'s amazing Michael! So proud of you!', time: '9:25 AM' },
  { id: '4', sender: 'David Johnson', senderId: '3', content: 'Great job bro! Keep it up!', time: '9:28 AM' },
  { id: '5', sender: 'Robert Johnson', senderId: '5', content: 'Very proud of you, grandson. One day at a time.', time: '9:32 AM' },
  { id: '6', sender: 'Michael Johnson', senderId: '2', content: 'Thanks everyone. I\'m going to check in to my meeting tonight. Will update after.', time: '10:05 AM' },
  { id: '7', sender: 'Michael Johnson', senderId: '2', content: '💰 **Financial Request** from Michael Johnson\n\n**Amount:** $147.23\n**Reason:** Electric bill - City Power & Light (Account #4521-7890-3336)\n\nPlease vote on this request and pledge to help if you can!', time: '2:30 PM' },
  { id: '8', sender: 'Michael Johnson', senderId: '2', content: '🙏 **Checked into Recovery Meeting**\n\nI\'m attending: AA - Evening Serenity Group\n📍 St. Mark\'s Church, 123 Main St\n⏰ Checkout expected at 8:00 PM', time: '6:45 PM' },
];

const DEMO_FINANCIAL_REQUESTS = [
  { 
    id: '1', 
    requester: 'Michael Johnson', 
    amount: 147.23, 
    reason: 'Electric bill - City Power & Light (Account #4521-7890-3336)', 
    status: 'pending',
    attachmentUrl: demoElectricBill,
    attachmentCaption: 'Electric bill for Michael Johnson • Account #4521-7890-3336 • Amount: $147.23',
    votes: { approve: 3, deny: 0 },
    pledges: [
      { name: 'Sarah Johnson', amount: 75 },
      { name: 'Robert Johnson', amount: 72.23 },
    ],
    createdAt: 'Yesterday at 2:30 PM'
  },
  { 
    id: '2', 
    requester: 'Michael Johnson', 
    amount: 50, 
    reason: 'Gas for work commute', 
    status: 'completed',
    attachmentUrl: demoGasReceipt,
    attachmentCaption: 'Gas station receipt • Total: $50.00',
    fundsReceived: true,
    fundsReceivedAt: '2 days ago',
    paymentConfirmed: true,
    paymentConfirmedAt: '2 days ago',
    votes: { approve: 4, deny: 0 },
    pledges: [
      { name: 'Emily Johnson', amount: 50 },
    ],
    createdAt: '3 days ago'
  },
];

const DEMO_CHECKINS = [
  { 
    id: '1', 
    user: 'Michael Johnson', 
    type: 'AA', 
    name: 'Evening Serenity Group',
    location: 'St. Mark\'s Church, 123 Main St',
    checkinTime: '6:45 PM',
    checkoutDue: '8:00 PM',
    status: 'active'
  },
  { 
    id: '2', 
    user: 'Michael Johnson', 
    type: 'Therapy', 
    name: 'Dr. Smith',
    location: 'Wellness Center, Suite 200',
    checkinTime: '10:00 AM',
    checkoutTime: '11:02 AM',
    status: 'completed'
  },
];

const DEMO_BOUNDARIES = [
  {
    id: '1',
    content: 'No financial assistance for anything other than essential bills (rent, utilities, food)',
    createdBy: 'Sarah Johnson',
    status: 'approved',
    acknowledgments: ['Sarah Johnson', 'David Johnson', 'Emily Johnson', 'Robert Johnson', 'Michael Johnson'],
  },
  {
    id: '2',
    content: 'Michael must check in to at least 3 meetings per week',
    createdBy: 'Sarah Johnson',
    targetUser: 'Michael Johnson',
    status: 'approved',
    acknowledgments: ['Sarah Johnson', 'Michael Johnson', 'David Johnson', 'Emily Johnson', 'Robert Johnson'],
  },
  {
    id: '3',
    content: 'All communication must go through this app - no secret conversations',
    createdBy: 'David Johnson',
    status: 'pending',
    acknowledgments: [],
  },
  {
    id: '4',
    content: 'Mom will no longer track my location on her phone - she will use the app check-ins instead',
    createdBy: 'Michael Johnson',
    targetUser: 'Sarah Johnson',
    status: 'pending',
    acknowledgments: [],
  },
];

const DEMO_GOALS = [
  { id: '1', goal: 'Help Michael complete his aftercare plan', status: 'in_progress' },
  { id: '2', goal: 'Get to 90 days sobriety', status: 'in_progress' },
];

const DEMO_VALUES = [
  { key: 'honesty', name: 'Honesty & Transparency' },
  { key: 'accountability', name: 'Accountability and Repair Without Shame' },
];

const DEMO_COMMON_GOALS = [
  { key: 'weekly_meetings', name: 'Attend Weekly Family Meetings', completed: false },
  { key: 'attend_support', name: 'Attend Support Groups (Al-Anon, etc.)', completed: false },
];

interface DemoBranding {
  primaryColor: string;
  logo: string | null;
  logoNeedsBackground?: boolean;
  name: string;
}

const DemoFamily = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const branding = (location.state as { branding?: DemoBranding })?.branding;
  const [activeTab, setActiveTab] = useState('chat');
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState(DEMO_MESSAGES);
  const [selectedMember, setSelectedMember] = useState<typeof DEMO_MEMBERS[0] | null>(null);
  const [showMembersList, setShowMembersList] = useState(false);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    const newMsg = {
      id: String(messages.length + 1),
      sender: 'You (Demo User)',
      senderId: 'demo',
      content: newMessage,
      time: format(new Date(), 'h:mm a'),
    };
    
    setMessages([...messages, newMsg]);
    setNewMessage('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header 
        className="border-b backdrop-blur-md bg-background/80 sticky top-0 z-50 shadow-sm"
        style={branding ? { backgroundColor: `${branding.primaryColor}08` } : undefined}
      >
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/demo')} className="hover-lift">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Demo
            </Button>
            <div className="h-6 w-px bg-border/50" />
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowMembersList(true)}
                className="h-10 w-10 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 relative"
                style={{ 
                  background: branding 
                    ? `linear-gradient(135deg, ${branding.primaryColor}, ${branding.primaryColor}cc)` 
                    : 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))'
                }}
                title="View family members"
              >
                <img src={familyBridgeLogo} alt="FamilyBridge" className="h-5 w-5 object-contain" />
                <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-white shadow-md flex items-center justify-center text-[10px] font-bold text-primary border border-primary/20">
                  {DEMO_MEMBERS.length}
                </span>
              </button>
              <div className="flex flex-col">
                <span className="font-semibold text-foreground">The Johnson Family</span>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-muted-foreground">{DEMO_MEMBERS.length} members active</span>
                </div>
              </div>
              {branding && (
                <Badge 
                  variant="secondary" 
                  className="ml-2 animate-fade-in"
                  style={{ 
                    backgroundColor: `${branding.primaryColor}20`,
                    color: branding.primaryColor 
                  }}
                >
                  {branding.name}
                </Badge>
              )}
              <Badge variant="secondary" className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
                <Sparkles className="h-3 w-3 mr-1" />
                Demo Mode
              </Badge>
            </div>
          </div>
          <Button 
            onClick={() => navigate('/provider-purchase')}
            className="hover-lift shadow-lg"
            style={branding ? { backgroundColor: branding.primaryColor } : undefined}
          >
            Get Started
          </Button>
        </div>
      </header>

      {/* Demo Banner */}
      <div 
        className="border-b py-3 px-4 text-center bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5"
        style={branding ? { 
          background: `linear-gradient(90deg, ${branding.primaryColor}08, ${branding.primaryColor}15, ${branding.primaryColor}08)`,
          borderColor: `${branding.primaryColor}20` 
        } : undefined}
      >
        <p 
          className="text-sm flex items-center justify-center gap-2 animate-fade-in"
          style={branding ? { color: branding.primaryColor } : undefined}
        >
          <Sparkles className="h-4 w-4 animate-pulse" />
          {branding ? `You're viewing a demo family powered by ${branding.name}. All data is simulated.` : "You're viewing a demo family. All data is simulated."}
          <Activity className="h-4 w-4 animate-pulse" />
        </p>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-5xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6 mb-6 bg-muted/50 backdrop-blur-sm p-1.5 rounded-xl border border-border/50 shadow-sm">
              <TabsTrigger 
                value="chat" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-lg transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2 px-1 sm:px-3"
              >
                <MessageCircle className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Chat</span>
              </TabsTrigger>
              <TabsTrigger 
                value="financial"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2 px-1 sm:px-3"
              >
                <DollarSign className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Financial</span>
              </TabsTrigger>
              <TabsTrigger 
                value="checkins"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2 px-1 sm:px-3"
              >
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Check-ins</span>
              </TabsTrigger>
              <TabsTrigger 
                value="values"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-rose-500 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2 px-1 sm:px-3"
              >
                <Sparkles className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Values</span>
              </TabsTrigger>
              <TabsTrigger 
                value="boundaries"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-violet-500 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2 px-1 sm:px-3"
              >
                <Shield className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Boundaries</span>
              </TabsTrigger>
              <TabsTrigger 
                value="testing"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2 px-1 sm:px-3"
              >
                <FlaskConical className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Testing</span>
              </TabsTrigger>
            </TabsList>

            {/* Chat Tab */}
            <TabsContent value="chat" className="animate-fade-in">
              <Card className="card-interactive border-0 shadow-lg bg-gradient-to-br from-card to-card/95 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/60" />
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                      <MessageCircle className="h-4 w-4 text-primary-foreground" />
                    </div>
                    Family Chat
                    <Badge variant="secondary" className="ml-auto bg-green-100 text-green-700 border-green-200">
                      <Activity className="h-3 w-3 mr-1" />
                      Live
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                      {messages.map((msg, index) => {
                        const isRecovering = msg.senderId === '2';
                        const isSystemMessage = msg.content.includes('**Financial Request**') || msg.content.includes('**Checked into');
                        
                        return (
                          <div 
                            key={msg.id} 
                            className="flex gap-3 animate-fade-in"
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <Avatar 
                              className={`h-9 w-9 ring-2 ring-offset-2 ${isRecovering ? '' : 'ring-muted'}`}
                              style={isRecovering && branding ? { '--tw-ring-color': branding.primaryColor } as React.CSSProperties : isRecovering ? { '--tw-ring-color': 'hsl(var(--primary))' } as React.CSSProperties : undefined}
                            >
                              <AvatarFallback 
                                className={`text-xs font-medium ${isRecovering ? 'text-white' : 'bg-muted'}`}
                                style={isRecovering && branding 
                                  ? { background: `linear-gradient(135deg, ${branding.primaryColor}, ${branding.primaryColor}cc)` }
                                  : isRecovering 
                                    ? { background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))' }
                                    : undefined
                                }
                              >
                                {msg.sender.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className={`font-semibold text-sm ${isRecovering ? 'text-primary' : 'text-foreground'}`}>
                                  {msg.sender}
                                </span>
                                {isRecovering && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">
                                    Recovering
                                  </Badge>
                                )}
                                <span className="text-xs text-muted-foreground">{msg.time}</span>
                              </div>
                              <div 
                                className={`mt-1.5 rounded-2xl rounded-tl-sm px-4 py-2.5 inline-block max-w-[90%] ${
                                  isSystemMessage 
                                    ? 'border shadow-sm' 
                                    : isRecovering 
                                      ? 'text-white shadow-md'
                                      : 'bg-muted/70'
                                }`}
                                style={
                                  isSystemMessage && branding
                                    ? { 
                                        backgroundColor: `${branding.primaryColor}10`,
                                        borderColor: `${branding.primaryColor}30`
                                      }
                                    : isRecovering && branding
                                      ? { background: `linear-gradient(135deg, ${branding.primaryColor}, ${branding.primaryColor}dd)` }
                                      : isSystemMessage
                                        ? { backgroundColor: 'hsl(var(--primary) / 0.1)', borderColor: 'hsl(var(--primary) / 0.2)' }
                                        : isRecovering
                                          ? { background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.9))' }
                                          : undefined
                                }
                              >
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                  
                  <div className="flex gap-2 mt-4 pt-4 border-t border-border/50">
                    <Input 
                      placeholder="Type a message..." 
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="border-muted-foreground/20 focus:border-primary focus:ring-primary/20"
                    />
                    <Button 
                      onClick={handleSendMessage}
                      className="shadow-md hover-lift bg-gradient-to-r from-primary to-primary/90"
                      style={branding ? { background: `linear-gradient(135deg, ${branding.primaryColor}, ${branding.primaryColor}cc)` } : undefined}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Financial Tab */}
            <TabsContent value="financial" className="animate-fade-in">
              {/* Financial Summary */}
              <Card className="mb-6 border-0 shadow-lg overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500" />
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center p-6 bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl border border-border/50 hover-lift transition-all duration-300">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                        <DollarSign className="h-6 w-6 text-primary" />
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">Total Requested</p>
                      <p className="text-3xl font-bold text-foreground">
                        ${DEMO_FINANCIAL_REQUESTS.reduce((sum, r) => sum + r.amount, 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50/50 rounded-xl border border-green-200 hover-lift transition-all duration-300">
                      <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                        <TrendingUp className="h-6 w-6 text-green-600" />
                      </div>
                      <p className="text-sm text-green-700 mb-1">Total Funds Given</p>
                      <p className="text-3xl font-bold text-green-600">
                        ${DEMO_FINANCIAL_REQUESTS
                          .filter(r => r.fundsReceived || r.status === 'approved')
                          .reduce((sum, r) => r.pledges.reduce((pSum, p) => pSum + p.amount, 0) + sum, 0)
                          .toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                {DEMO_FINANCIAL_REQUESTS.map((request, index) => (
                  <div 
                    key={request.id} 
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <FinancialRequestCard
                      id={request.id}
                      requester={request.requester}
                      requesterInitials="MJ"
                      amount={request.amount}
                      reason={request.reason}
                      status={request.status as 'pending' | 'approved' | 'denied' | 'completed'}
                      createdAt={request.createdAt}
                      votes={request.votes}
                      pledges={request.pledges}
                      attachmentUrl={request.attachmentUrl}
                      attachmentCaption={request.attachmentCaption}
                      fundsReceived={request.fundsReceived}
                      fundsReceivedAt={request.fundsReceivedAt}
                      branding={branding ? { primaryColor: branding.primaryColor } : undefined}
                      isDemo={true}
                    />
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Check-ins Tab */}
            <TabsContent value="checkins" className="animate-fade-in">
              <div className="space-y-4">
                {/* Location Capture Card */}
                <Card className="card-interactive overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary" />
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 font-display text-lg">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                      Capture My Location
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Capture your current location to use for meeting check-ins or location requests.
                    </p>
                    <Button 
                      className="w-full"
                      style={branding ? { background: `linear-gradient(135deg, ${branding.primaryColor}, ${branding.primaryColor}cc)` } : undefined}
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Capture Location
                    </Button>
                  </CardContent>
                </Card>

                {/* Check-In Form Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-display">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      Check-In
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Check in at your meeting or appointment to let your family know where you are.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Tabbed Content */}
                    <Tabs defaultValue="recovery" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="recovery" className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          <span className="hidden sm:inline">Recovery Meetings</span>
                          <span className="sm:hidden">Recovery</span>
                        </TabsTrigger>
                        <TabsTrigger value="life" className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span className="hidden sm:inline">Life Appointments</span>
                          <span className="sm:hidden">Appointments</span>
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="recovery" className="mt-4 space-y-4">
                        <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                          Capture your location above before checking in.
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Meeting Type *</label>
                          <div className="p-3 border rounded-lg text-muted-foreground text-sm">
                            Select meeting type
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Meeting Name (optional)</label>
                          <Input placeholder="e.g., Tuesday Night Group" disabled className="opacity-60" />
                        </div>
                        <Button className="w-full" disabled>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Check In to Meeting
                        </Button>
                      </TabsContent>
                      
                      <TabsContent value="life" className="mt-4 space-y-4">
                        <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                          Capture your location above before checking in.
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Appointment Type *</label>
                          <div className="p-3 border rounded-lg text-muted-foreground text-sm">
                            Select appointment type
                          </div>
                        </div>
                        <Button className="w-full" disabled>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Check In to Appointment
                        </Button>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>

                {/* Meeting Checkout Card (Demo - showing active checkout) */}
                <Card className="border-primary/50 bg-primary/5">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="flex items-center gap-2 font-display">
                          <Activity className="h-5 w-5 text-primary" />
                          Meeting Checkout Required
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Complete your meeting checkout to confirm attendance.
                        </p>
                      </div>
                      <Badge variant="default">Ready</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Meeting Info */}
                    <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">AA</span>
                        <span className="text-muted-foreground">• Evening Serenity Group</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        St. Mark's Church, 123 Main St
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>Checked in: 6:45 PM</span>
                        <span>•</span>
                        <span>Checkout due: 8:00 PM</span>
                      </div>
                    </div>

                    {/* Demo location capture */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Capture Your Checkout Location</label>
                      <Button variant="outline" className="w-full">
                        <MapPin className="h-4 w-4 mr-2" />
                        Capture Checkout Location
                      </Button>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Notes (optional)</label>
                      <Textarea placeholder="How was the meeting?" rows={2} />
                    </div>

                    {/* Checkout Button */}
                    <Button 
                      className="w-full"
                      style={branding ? { background: `linear-gradient(135deg, ${branding.primaryColor}, ${branding.primaryColor}cc)` } : undefined}
                    >
                      <Activity className="h-4 w-4 mr-2" />
                      Complete Checkout
                    </Button>
                  </CardContent>
                </Card>

                {/* Recent Check-ins History Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="font-display">Recent Check-ins</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Meeting attendance from family members
                    </p>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[300px]">
                      <div className="divide-y">
                        {DEMO_CHECKINS.map((checkin, index) => (
                          <div key={checkin.id} className="p-4 hover:bg-muted/50 transition-colors animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback className="text-[10px] bg-primary/10">MJ</AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium text-foreground">{checkin.user}</span>
                                  <Badge 
                                    variant="secondary" 
                                    className={checkin.type === 'AA' 
                                      ? 'bg-blue-100 text-blue-800' 
                                      : 'bg-green-100 text-green-800'
                                    }
                                  >
                                    {checkin.type}
                                  </Badge>
                                  <Badge 
                                    variant={checkin.status === 'active' ? 'default' : 'secondary'}
                                    className={checkin.status === 'active' 
                                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0' 
                                      : ''
                                    }
                                  >
                                    {checkin.status === 'active' ? (
                                      <><Clock className="h-3 w-3 mr-1" /> In Meeting</>
                                    ) : (
                                      <><CheckCircle className="h-3 w-3 mr-1" /> Checked Out</>
                                    )}
                                  </Badge>
                                </div>
                                
                                {checkin.name && (
                                  <p className="text-sm text-foreground mb-1">{checkin.name}</p>
                                )}

                                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                                  <Clock className="h-3 w-3" />
                                  <span>Checked in at {checkin.checkinTime}</span>
                                  {checkin.checkoutTime && (
                                    <>
                                      <span className="mx-1">•</span>
                                      <span className="text-green-600">Out: {checkin.checkoutTime}</span>
                                    </>
                                  )}
                                  {checkin.checkoutDue && checkin.status === 'active' && (
                                    <>
                                      <span className="mx-1">•</span>
                                      <span className="text-orange-600">Due: {checkin.checkoutDue}</span>
                                    </>
                                  )}
                                </div>

                                <button className="flex items-start gap-1 text-xs text-primary hover:underline">
                                  <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                                  <span className="text-left">{checkin.location}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Testing Tab */}
            <TabsContent value="testing" className="animate-fade-in">
              <div className="space-y-4">
                <Card className="border-0 shadow-lg overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md">
                        <FlaskConical className="h-5 w-5 text-white" />
                      </div>
                      Drug & Alcohol Testing
                      <Badge className="ml-auto bg-gradient-to-r from-amber-500 to-orange-500 border-0 text-white">
                        <Crown className="h-3 w-3 mr-1" />
                        Premium
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Coming Soon Banner */}
                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-2 border-dashed border-amber-300 p-8">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-200/40 to-orange-200/40 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                      <div className="relative text-center space-y-4">
                        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg mx-auto">
                          <FlaskConical className="h-8 w-8 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-foreground mb-2">Coming Soon</h3>
                          <p className="text-muted-foreground max-w-md mx-auto">
                            Drug and alcohol testing features are currently in development. When ready, they will be offered as part of a premium upgrade.
                          </p>
                        </div>
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">
                          <Activity className="h-3 w-3 mr-1" />
                          In Development
                        </Badge>
                      </div>
                    </div>

                    {/* Planned Features */}
                    <div className="space-y-3">
                      <h3 className="font-medium text-foreground flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-amber-500" />
                        Planned Features
                      </h3>
                      <div className="grid gap-3">
                        {[
                          { title: 'At-Home Testing Kits', description: 'Order FDA-approved drug and alcohol testing kits delivered to your door' },
                          { title: 'Lab-Verified Results', description: 'Results verified by certified laboratories for accuracy and reliability' },
                          { title: 'Family Dashboard', description: 'View test history and results in a secure, shared family dashboard' },
                          { title: 'Random Testing Schedule', description: 'Set up randomized testing schedules to support accountability' },
                          { title: 'Instant Notifications', description: 'Family members receive notifications when tests are completed' },
                        ].map((feature, index) => (
                          <div
                            key={feature.title}
                            className="p-4 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors animate-fade-in"
                            style={{ animationDelay: `${index * 100}ms` }}
                          >
                            <div className="flex items-start gap-3">
                              <div className="h-6 w-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                                <Check className="h-3 w-3 text-amber-600" />
                              </div>
                              <div>
                                <h4 className="font-medium text-sm text-foreground">{feature.title}</h4>
                                <p className="text-xs text-muted-foreground mt-0.5">{feature.description}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Interest CTA */}
                    <div className="p-4 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md shrink-0">
                          <Mail className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground">Interested in Testing Features?</h4>
                          <p className="text-sm text-muted-foreground">Contact us to be notified when this premium feature launches.</p>
                        </div>
                        <Button 
                          variant="outline" 
                          className="shrink-0 border-primary/30 text-primary hover:bg-primary/10"
                          onClick={() => toast.info("Thanks for your interest! We'll notify you when testing features launch.")}
                        >
                          Notify Me
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Values & Goals Tab */}
            <TabsContent value="values" className="animate-fade-in">
              <div className="space-y-4">
                <Card className="border-0 shadow-lg overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-pink-500 via-rose-500 to-red-500" />
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-md overflow-hidden">
                        <img src={familyBridgeLogo} alt="FamilyBridge" className="h-7 w-7 object-contain" />
                      </div>
                      Family Values & Goals
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Guiding Values Section */}
                    <div className="space-y-3">
                      <h3 className="font-medium text-foreground">Guiding Values</h3>
                      <div className="p-4 rounded-lg bg-pink-50/50 border border-pink-100">
                        <p className="text-sm text-muted-foreground mb-3">
                          Select the values that matter most to your family. These guide your decisions, shape your boundaries, and keep everyone aligned on what truly matters.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {DEMO_VALUES.map((value, index) => (
                            <div
                              key={value.key}
                              className="px-3 py-2 rounded-lg bg-pink-100 border border-pink-200 flex items-center gap-2 animate-fade-in"
                              style={{ animationDelay: `${index * 100}ms` }}
                            >
                              <Sparkles className="h-4 w-4 text-pink-600 shrink-0" />
                              <span className="font-medium text-sm text-foreground">{value.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Common Goals Section */}
                    <div className="space-y-3">
                      <h3 className="font-medium text-foreground">Common Goals</h3>
                      <p className="text-sm text-muted-foreground">
                        Choose goals that reflect your family's priorities. These shared objectives help guide decisions about financial support, boundaries, and what recovery success looks like for your family.
                      </p>
                      <div className="grid gap-2">
                        {DEMO_COMMON_GOALS.map((goal, index) => (
                          <div
                            key={goal.key}
                            className="px-3 py-2 rounded-lg bg-secondary/50 border border-border flex items-center justify-between gap-2 animate-fade-in"
                            style={{ animationDelay: `${index * 100}ms` }}
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div className="shrink-0 h-4 w-4 rounded-full border-2 border-muted-foreground flex items-center justify-center" />
                              <span className="text-sm font-medium truncate">{goal.name}</span>
                            </div>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200 shrink-0 text-xs">
                              In Progress
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Family-Specific Goals */}
                    <div className="space-y-3">
                      <h3 className="font-medium text-foreground">Family-Specific Goals</h3>
                      {DEMO_GOALS.map((goal, index) => (
                        <div 
                          key={goal.id} 
                          className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50/80 to-violet-50/50 rounded-xl border border-purple-100 hover-lift transition-all duration-300 animate-fade-in"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center shadow-md">
                            <Target className="h-5 w-5 text-white" />
                          </div>
                          <span className="text-sm font-medium flex-1">{goal.goal}</span>
                          <Badge className="bg-purple-100 text-purple-700 border-purple-200">In Progress</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Boundaries Tab */}
            <TabsContent value="boundaries" className="animate-fade-in">
              <div className="space-y-4">
                {/* Universal Boundaries */}
                <Card className="border-0 shadow-lg overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500" />
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center shadow-md">
                        <Shield className="h-5 w-5 text-white" />
                      </div>
                      Universal Boundaries
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 rounded-lg bg-purple-50/50 border border-purple-100">
                      <p className="text-sm text-muted-foreground mb-3">
                        These boundaries apply to all families using this platform:
                      </p>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                          <span>No financial support will be provided for substances or activities that enable addiction.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                          <span>All financial support must go through the approval process on this app. No cash.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                          <span>All family members commit to honest, respectful communication.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                          <span>Recovery progress must be demonstrated through treatment completion, aftercare compliance, meeting and therapy attendance, medication compliance where needed.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                          <span>Immediate response is required for all location check-in requests. Failure to respond may result in the loss of cell phone service, vehicle privileges, financial support or other natural consequences.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                          <span>Any relapse must be disclosed to the family within 24 hours.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                          <span>Support system members must be involved in their own recovery process and document their involvement in recovery meetings, support groups, therapy appointments or other activities that support family recovery.</span>
                        </li>
                      </ul>
                    </div>

                    {/* Consequences Section */}
                    <div className="p-4 rounded-lg bg-red-50 border border-red-200 mt-4">
                      <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        Consequences
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Violation of the boundaries listed on this page could result in the reduction or elimination of financial support, access to transportation or phone service or other consequences agreed upon by the family group. Consequences apply to family group members who continue to enable the addiction or ignore their own recovery process.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Family-Specific Boundaries */}
                <Card className="border-0 shadow-lg overflow-hidden">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <Shield className="h-5 w-5 text-purple-600" />
                      Family-Specific Boundaries
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {DEMO_BOUNDARIES.map((boundary, index) => (
                      <div 
                        key={boundary.id} 
                        className={`p-4 rounded-xl border animate-fade-in ${
                          boundary.status === 'approved' 
                            ? 'bg-green-50/50 border-green-200' 
                            : 'bg-amber-50/50 border-amber-200'
                        }`}
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={boundary.status === 'approved' ? 'default' : 'secondary'}
                              className={boundary.status === 'approved' 
                                ? 'bg-green-500 border-0' 
                                : 'bg-amber-100 text-amber-700 border-amber-200'
                              }
                            >
                              {boundary.status === 'approved' ? <CheckCircle className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                              {boundary.status}
                            </Badge>
                            {boundary.targetUser && (
                              <Badge variant="outline" className="border-primary/30 text-primary">
                                <Users className="h-3 w-3 mr-1" />
                                For: {boundary.targetUser}
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">by {boundary.createdBy}</span>
                        </div>
                        
                        <p className="text-sm mb-3">{boundary.content}</p>
                        
                        {boundary.acknowledgments.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs text-muted-foreground mb-2 font-medium">Acknowledged by:</p>
                            <div className="flex flex-wrap gap-1">
                              {boundary.acknowledgments.map((name, i) => (
                                <Badge 
                                  key={i} 
                                  variant="outline" 
                                  className="text-xs bg-green-50 border-green-200 text-green-700"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  {name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {boundary.status === 'pending' && (
                          <div className="flex gap-2 mt-3">
                            <Button size="sm" className="flex-1 bg-green-500 hover:bg-green-600">
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50">
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

          </Tabs>
        </div>
      </div>

      {/* Member Profile Dialog */}
      <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
        <DialogContent className="sm:max-w-md border-0 shadow-2xl">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/60 rounded-t-lg" />
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Member Profile
            </DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary/5 to-transparent rounded-xl">
                <Avatar className="h-16 w-16 ring-4 ring-primary/20 ring-offset-2">
                  <AvatarFallback className="text-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                    {selectedMember.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-bold text-foreground">{selectedMember.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedMember.relationship}</p>
                  <Badge variant="secondary" className="mt-2 bg-primary/10 text-primary border-primary/20">
                    {selectedMember.role}
                  </Badge>
                </div>
              </div>

              {selectedMember.paymentInfo && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Payment Methods
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-50/50 rounded-xl border border-blue-200 hover-lift transition-all duration-300">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
                          PP
                        </div>
                        <div>
                          <p className="text-sm font-semibold">PayPal</p>
                          <p className="text-xs text-muted-foreground">{selectedMember.paymentInfo.paypal}</p>
                        </div>
                      </div>
                      <Button size="sm" className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-md" asChild>
                        <a href={`https://paypal.me/${selectedMember.paymentInfo.paypal}`} target="_blank" rel="noopener noreferrer">
                          <Send className="h-3 w-3 mr-1" />
                          Send
                        </a>
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-sky-50 to-sky-50/50 rounded-xl border border-sky-200 hover-lift transition-all duration-300">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
                          V
                        </div>
                        <div>
                          <p className="text-sm font-semibold">Venmo</p>
                          <p className="text-xs text-muted-foreground">{selectedMember.paymentInfo.venmo}</p>
                        </div>
                      </div>
                      <Button size="sm" className="bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 shadow-md" asChild>
                        <a href={`https://venmo.com/${selectedMember.paymentInfo.venmo.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
                          <Send className="h-3 w-3 mr-1" />
                          Send
                        </a>
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50/50 rounded-xl border border-green-200 hover-lift transition-all duration-300">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-600 to-emerald-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
                          $
                        </div>
                        <div>
                          <p className="text-sm font-semibold">Cash App</p>
                          <p className="text-xs text-muted-foreground">{selectedMember.paymentInfo.cashapp}</p>
                        </div>
                      </div>
                      <Button size="sm" className="bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 shadow-md" asChild>
                        <a href={`https://cash.app/${selectedMember.paymentInfo.cashapp}`} target="_blank" rel="noopener noreferrer">
                          <Send className="h-3 w-3 mr-1" />
                          Send
                        </a>
                      </Button>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground text-center bg-muted/30 p-3 rounded-lg">
                    <Sparkles className="h-3 w-3 inline mr-1" />
                    Click "Send" to open the payment app and send funds directly
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Members List Dialog */}
      <Dialog open={showMembersList} onOpenChange={setShowMembersList}>
        <DialogContent className="sm:max-w-md border-0 shadow-2xl max-h-[80vh] overflow-auto">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/60 rounded-t-lg" />
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <img src={familyBridgeLogo} alt="FamilyBridge" className="h-5 w-5 object-contain" />
              Family Members
              <Badge variant="secondary" className="ml-auto bg-primary/10 text-primary">
                {DEMO_MEMBERS.length} Members
              </Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {DEMO_MEMBERS.map((member, index) => (
              <div 
                key={member.id}
                className={`flex items-center justify-between p-3 rounded-xl border border-border/50 transition-all duration-300 animate-fade-in ${
                  member.paymentInfo 
                    ? 'cursor-pointer hover:shadow-md hover:border-primary/30 hover:bg-primary/5' 
                    : 'bg-muted/30'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => {
                  if (member.paymentInfo) {
                    setShowMembersList(false);
                    setSelectedMember(member);
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  <Avatar className={`h-10 w-10 ring-2 ring-offset-1 ${
                    member.role === 'recovering' ? 'ring-primary' : 
                    member.role === 'moderator' ? 'ring-orange-500' : 
                    'ring-muted'
                  }`}>
                    <AvatarFallback className={`text-xs font-medium ${
                      member.role === 'recovering' ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground' :
                      member.role === 'moderator' ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white' :
                      'bg-muted'
                    }`}>
                      {member.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm text-foreground">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.relationship}</p>
                  </div>
                </div>
                <Badge 
                  variant={
                    member.role === 'moderator' ? 'default' : 
                    member.role === 'recovering' ? 'secondary' : 
                    'outline'
                  }
                  className={`text-xs ${
                    member.role === 'moderator' ? 'bg-gradient-to-r from-orange-500 to-amber-500 border-0' :
                    member.role === 'recovering' ? 'bg-primary/10 text-primary border-primary/20' :
                    ''
                  }`}
                >
                  {member.role}
                </Badge>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DemoFamily;
