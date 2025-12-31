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
  Heart,
  AlertTriangle,
  Sparkles,
  Paperclip,
  FileText,
  TrendingUp,
  Activity,
  Mail
} from 'lucide-react';
import { format } from 'date-fns';
import demoElectricBill from '@/assets/demo-electric-bill.png';
import { toast } from 'sonner';

import demoGasReceipt from '@/assets/demo-gas-receipt.png';

// Demo data
const DEMO_MEMBERS = [
  { id: '0', name: 'Matt Brown', role: 'moderator', relationship: 'Case Manager', initials: 'MB' },
  { id: '1', name: 'Sarah Johnson', role: 'member', relationship: 'Parent', initials: 'SJ' },
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
    status: 'approved',
    attachmentUrl: demoGasReceipt,
    attachmentCaption: 'Gas station receipt • Total: $50.00',
    fundsReceived: true,
    fundsReceivedAt: '2 days ago',
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

interface DemoBranding {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  logo: string | null;
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
        style={branding ? { backgroundColor: `${branding.colors.primary}08` } : undefined}
      >
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/demo')} className="hover-lift">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Demo
            </Button>
            <div className="h-6 w-px bg-border/50" />
            <div className="flex items-center gap-3">
              {branding?.logo ? (
                <img 
                  src={branding.logo} 
                  alt={branding.name} 
                  className="h-10 w-10 rounded-xl object-contain bg-white/90 p-1.5 shadow-md ring-2 ring-primary/20"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div 
                  className="h-10 w-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-primary to-primary/80 shadow-lg animate-pulse-soft"
                  style={branding ? { background: `linear-gradient(135deg, ${branding.colors.primary}, ${branding.colors.secondary})` } : undefined}
                >
                  <Heart className="h-5 w-5 text-primary-foreground" />
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-semibold text-foreground">The Johnson Family</span>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-muted-foreground">6 members active</span>
                </div>
              </div>
              {branding && (
                <Badge 
                  variant="secondary" 
                  className="ml-2 animate-fade-in"
                  style={{ 
                    backgroundColor: `${branding.colors.secondary}20`,
                    color: branding.colors.secondary 
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
            style={branding ? { backgroundColor: branding.colors.primary } : undefined}
          >
            Get Started
          </Button>
        </div>
      </header>

      {/* Demo Banner */}
      <div 
        className="border-b py-3 px-4 text-center bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5"
        style={branding ? { 
          background: `linear-gradient(90deg, ${branding.colors.primary}08, ${branding.colors.primary}15, ${branding.colors.primary}08)`,
          borderColor: `${branding.colors.primary}20` 
        } : undefined}
      >
        <p 
          className="text-sm flex items-center justify-center gap-2 animate-fade-in"
          style={branding ? { color: branding.colors.primary } : undefined}
        >
          <Sparkles className="h-4 w-4 animate-pulse" />
          {branding ? `You're viewing a demo family powered by ${branding.name}. All data is simulated.` : "You're viewing a demo family. All data is simulated."}
          <Activity className="h-4 w-4 animate-pulse" />
        </p>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-5xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5 mb-6 bg-muted/50 backdrop-blur-sm p-1.5 rounded-xl border border-border/50 shadow-sm">
              <TabsTrigger 
                value="chat" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-lg transition-all duration-300"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Chat
              </TabsTrigger>
              <TabsTrigger 
                value="financial"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg transition-all duration-300"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Financial
              </TabsTrigger>
              <TabsTrigger 
                value="checkins"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg transition-all duration-300"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Check-ins
              </TabsTrigger>
              <TabsTrigger 
                value="boundaries"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-violet-500 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg transition-all duration-300"
              >
                <Shield className="h-4 w-4 mr-2" />
                Boundaries
              </TabsTrigger>
              <TabsTrigger 
                value="members"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg transition-all duration-300"
              >
                <Users className="h-4 w-4 mr-2" />
                Members
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
                            <Avatar className={`h-9 w-9 ring-2 ring-offset-2 ${isRecovering ? 'ring-primary' : 'ring-muted'}`}>
                              <AvatarFallback className={`text-xs font-medium ${isRecovering ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground' : 'bg-muted'}`}>
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
                              <div className={`mt-1.5 rounded-2xl rounded-tl-sm px-4 py-2.5 inline-block max-w-[90%] ${
                                isSystemMessage 
                                  ? 'bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20' 
                                  : isRecovering 
                                    ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-md'
                                    : 'bg-muted/70'
                              }`}>
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
                      style={branding ? { background: `linear-gradient(135deg, ${branding.colors.primary}, ${branding.colors.secondary})` } : undefined}
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

              <div className="space-y-4">
                {DEMO_FINANCIAL_REQUESTS.map((request, index) => (
                  <Card 
                    key={request.id} 
                    className="card-interactive border-0 shadow-lg overflow-hidden animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className={`h-1 ${request.status === 'approved' ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'}`} />
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-xs">MJ</AvatarFallback>
                            </Avatar>
                            <span className="font-semibold">{request.requester}</span>
                            <Badge 
                              variant={request.status === 'approved' ? 'default' : 'secondary'}
                              className={request.status === 'approved' ? 'bg-gradient-to-r from-green-500 to-emerald-500 border-0' : 'bg-amber-100 text-amber-700 border-amber-200'}
                              style={request.status === 'approved' && branding ? { background: `linear-gradient(135deg, ${branding.colors.primary}, ${branding.colors.secondary})` } : undefined}
                            >
                              {request.status === 'approved' ? <CheckCircle className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                              {request.status}
                            </Badge>
                          </div>
                          <p className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">${request.amount.toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground mt-1">{request.reason}</p>
                        </div>
                        <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">{request.createdAt}</span>
                      </div>

                      {request.attachmentUrl && (
                        <div className="mb-4 border border-border/50 rounded-xl overflow-hidden shadow-sm hover-lift transition-all duration-300">
                          <div className="bg-gradient-to-r from-muted/50 to-muted/30 px-4 py-2.5 border-b flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Attached Document</span>
                            <Paperclip className="h-3 w-3 text-muted-foreground ml-auto" />
                          </div>
                          <a href={request.attachmentUrl} target="_blank" rel="noopener noreferrer" className="block">
                            <img 
                              src={request.attachmentUrl} 
                              alt="Electric bill attachment" 
                              className="w-full max-h-64 object-contain bg-white cursor-pointer hover:scale-[1.02] transition-transform duration-300"
                            />
                          </a>
                          <div className="bg-muted/20 px-4 py-2 border-t">
                            <p className="text-xs text-muted-foreground">
                              {request.attachmentCaption}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-6 mb-4 p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2 text-green-600">
                          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                            <ThumbsUp className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="text-lg font-bold">{request.votes.approve}</span>
                            <span className="text-sm ml-1">approve</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-red-500">
                          <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                            <ThumbsDown className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="text-lg font-bold">{request.votes.deny}</span>
                            <span className="text-sm ml-1">deny</span>
                          </div>
                        </div>
                      </div>

                      {request.pledges.length > 0 && (
                        <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-4 mb-4 border border-primary/10">
                          <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <Heart className="h-4 w-4 text-primary" />
                            Pledges ({request.pledges.length})
                          </p>
                          <div className="space-y-2">
                            {request.pledges.map((pledge, i) => (
                              <div key={i} className="flex justify-between items-center text-sm bg-background/60 rounded-lg px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback className="text-[10px] bg-muted">{pledge.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                  </Avatar>
                                  <span>{pledge.name}</span>
                                </div>
                                <span className="font-bold text-primary">${pledge.amount}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {request.fundsReceived && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 animate-fade-in">
                          <div className="flex items-center gap-3 text-green-700">
                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                              <CheckCircle className="h-5 w-5" />
                            </div>
                            <div>
                              <span className="font-semibold">Funds Received</span>
                              <p className="text-xs text-green-600">
                                {request.requester} confirmed receipt • {request.fundsReceivedAt}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {request.status === 'pending' && (
                        <div className="flex gap-3 mt-4">
                          <Button 
                            size="lg" 
                            className="flex-1 shadow-md hover-lift bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                            style={branding ? { background: `linear-gradient(135deg, ${branding.colors.primary}, ${branding.colors.secondary})` } : undefined}
                          >
                            <ThumbsUp className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <Button size="lg" variant="outline" className="flex-1 hover-lift border-red-200 text-red-600 hover:bg-red-50">
                            <ThumbsDown className="h-4 w-4 mr-2" />
                            Deny
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Check-ins Tab */}
            <TabsContent value="checkins" className="animate-fade-in">
              <div className="space-y-4">
                {DEMO_CHECKINS.map((checkin, index) => (
                  <Card 
                    key={checkin.id} 
                    className="card-interactive border-0 shadow-lg overflow-hidden animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className={`h-1 ${checkin.status === 'active' ? 'bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500' : 'bg-gradient-to-r from-gray-300 to-gray-400'}`} />
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-md ${
                            checkin.status === 'active' 
                              ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white animate-pulse-soft' 
                              : 'bg-gradient-to-br from-gray-100 to-gray-200 text-muted-foreground'
                          }`}>
                            <MapPin className="h-7 w-7" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Avatar className="h-7 w-7 ring-2 ring-primary/20">
                                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-[10px]">MJ</AvatarFallback>
                              </Avatar>
                              <span className="font-semibold">{checkin.user}</span>
                              <Badge 
                                variant={checkin.status === 'active' ? 'default' : 'outline'}
                                className={checkin.status === 'active' 
                                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 border-0 animate-pulse' 
                                  : 'bg-muted text-muted-foreground'
                                }
                                style={checkin.status === 'active' && branding ? { background: `linear-gradient(135deg, ${branding.colors.primary}, ${branding.colors.secondary})` } : undefined}
                              >
                                {checkin.status === 'active' ? (
                                  <><Activity className="h-3 w-3 mr-1" /> In Progress</>
                                ) : (
                                  <><CheckCircle className="h-3 w-3 mr-1" /> Completed</>
                                )}
                              </Badge>
                            </div>
                            <p className="text-lg font-semibold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mt-2">
                              {checkin.type} - {checkin.name}
                            </p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {checkin.location}
                            </p>
                            <div className="flex items-center gap-4 mt-3 text-sm">
                              <span className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-full">
                                <Clock className="h-4 w-4 text-blue-500" />
                                <span className="text-muted-foreground">In:</span>
                                <span className="font-medium">{checkin.checkinTime}</span>
                              </span>
                              {checkin.status === 'active' ? (
                                <span className="flex items-center gap-1.5 bg-orange-100 text-orange-700 px-3 py-1.5 rounded-full animate-pulse">
                                  <AlertTriangle className="h-4 w-4" />
                                  <span>Due:</span>
                                  <span className="font-medium">{checkin.checkoutDue}</span>
                                </span>
                              ) : (
                                <span className="flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1.5 rounded-full">
                                  <CheckCircle className="h-4 w-4" />
                                  <span>Out:</span>
                                  <span className="font-medium">{checkin.checkoutTime}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Boundaries Tab */}
            <TabsContent value="boundaries" className="animate-fade-in">
              <div className="space-y-4">
                <Card className="border-0 shadow-lg overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500" />
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center shadow-md">
                        <Target className="h-5 w-5 text-white" />
                      </div>
                      Family Goals
                      <Badge variant="secondary" className="ml-auto bg-purple-100 text-purple-700 border-purple-200">
                        {DEMO_GOALS.length} Active
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {DEMO_GOALS.map((goal, index) => (
                      <div 
                        key={goal.id} 
                        className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50/80 to-violet-50/50 rounded-xl border border-purple-100 hover-lift transition-all duration-300 animate-fade-in"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center shadow-md">
                          <Check className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-sm font-medium flex-1">{goal.goal}</span>
                        <Badge className="bg-purple-100 text-purple-700 border-purple-200">In Progress</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {DEMO_BOUNDARIES.map((boundary, index) => (
                  <Card 
                    key={boundary.id} 
                    className="card-interactive border-0 shadow-lg overflow-hidden animate-fade-in"
                    style={{ animationDelay: `${(index + 2) * 100}ms` }}
                  >
                    <div className={`h-1 ${boundary.status === 'approved' ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'}`} />
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-md ${
                            boundary.status === 'approved' 
                              ? 'bg-gradient-to-br from-green-500 to-emerald-500' 
                              : 'bg-gradient-to-br from-amber-500 to-orange-500'
                          }`}>
                            <Shield className="h-5 w-5 text-white" />
                          </div>
                          <Badge 
                            variant={boundary.status === 'approved' ? 'default' : 'secondary'}
                            className={boundary.status === 'approved' 
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500 border-0' 
                              : 'bg-amber-100 text-amber-700 border-amber-200'
                            }
                            style={boundary.status === 'approved' && branding ? { background: `linear-gradient(135deg, ${branding.colors.primary}, ${branding.colors.secondary})` } : undefined}
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
                        <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">by {boundary.createdBy}</span>
                      </div>
                      
                      <p className="text-sm mb-4 p-4 bg-muted/30 rounded-xl border border-border/50">{boundary.content}</p>
                      
                      {boundary.acknowledgments.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs text-muted-foreground mb-2 font-medium">Acknowledged by:</p>
                          <div className="flex flex-wrap gap-2">
                            {boundary.acknowledgments.map((name, i) => (
                              <Badge 
                                key={i} 
                                variant="outline" 
                                className="text-xs bg-green-50 border-green-200 text-green-700 animate-fade-in"
                                style={{ animationDelay: `${i * 50}ms` }}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                {name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {boundary.status === 'pending' && (
                        <div className="flex gap-3 mt-4">
                          <Button 
                            className="flex-1 shadow-md hover-lift bg-gradient-to-r from-green-500 to-emerald-500"
                            style={branding ? { background: `linear-gradient(135deg, ${branding.colors.primary}, ${branding.colors.secondary})` } : undefined}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <Button variant="outline" className="flex-1 hover-lift border-red-200 text-red-600 hover:bg-red-50">
                            <X className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Members Tab */}
            <TabsContent value="members" className="animate-fade-in">
              <Card className="border-0 shadow-lg overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500" />
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-md">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    Family Members
                    <Badge variant="secondary" className="ml-auto bg-orange-100 text-orange-700 border-orange-200">
                      {DEMO_MEMBERS.length} Members
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {DEMO_MEMBERS.map((member, index) => (
                    <div 
                      key={member.id}
                      className={`flex items-center justify-between p-4 rounded-xl border border-border/50 transition-all duration-300 animate-fade-in ${
                        member.paymentInfo 
                          ? 'cursor-pointer hover:shadow-md hover:border-primary/30 hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent hover-lift' 
                          : 'bg-muted/30'
                      }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                      onClick={() => member.paymentInfo && setSelectedMember(member)}
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className={`h-12 w-12 ring-2 ring-offset-2 ${
                          member.role === 'recovering' ? 'ring-primary' : 
                          member.role === 'moderator' ? 'ring-orange-500' : 
                          'ring-muted'
                        }`}>
                          <AvatarFallback className={`text-sm font-medium ${
                            member.role === 'recovering' ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground' :
                            member.role === 'moderator' ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white' :
                            'bg-muted'
                          }`}>
                            {member.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">{member.name}</p>
                          {/* Direct Message button - only show for non-recovering members */}
                          {member.role !== 'recovering' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                toast.success(`Opening DM with ${member.name}`, {
                                  description: "Direct messaging feature - Demo only"
                                });
                              }}
                            >
                              <Mail className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{member.relationship}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {member.paymentInfo && (
                          <span className="text-xs text-primary font-medium flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-full">
                            View Profile
                            <ArrowLeft className="h-3 w-3 rotate-180" />
                          </span>
                        )}
                        <Badge 
                          variant={
                            member.role === 'moderator' ? 'default' : 
                            member.role === 'recovering' ? 'secondary' : 
                            'outline'
                          }
                          className={
                            member.role === 'moderator' ? 'bg-gradient-to-r from-orange-500 to-amber-500 border-0' :
                            member.role === 'recovering' ? 'bg-primary/10 text-primary border-primary/20' :
                            ''
                          }
                          style={member.role === 'moderator' && branding ? { background: `linear-gradient(135deg, ${branding.colors.primary}, ${branding.colors.secondary})` } : undefined}
                        >
                          {member.role}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
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
                    <Heart className="h-3 w-3 inline mr-1" />
                    Click "Send" to open the payment app and send funds directly
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DemoFamily;
