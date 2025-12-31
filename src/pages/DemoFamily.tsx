import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
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
  Sparkles
} from 'lucide-react';
import { format } from 'date-fns';

// Demo data
const DEMO_MEMBERS = [
  { id: '1', name: 'Sarah Johnson', role: 'moderator', relationship: 'Parent', initials: 'SJ' },
  { id: '2', name: 'Michael Johnson', role: 'recovering', relationship: 'Recovering', initials: 'MJ' },
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
  { id: '7', sender: 'Sarah Johnson', senderId: '1', content: '🙏 **Checked into Recovery Meeting**\n\nI\'m attending: AA - Evening Serenity Group\n📍 St. Mark\'s Church, 123 Main St\n⏰ Checkout expected at 8:00 PM', time: '6:45 PM' },
];

const DEMO_FINANCIAL_REQUESTS = [
  { 
    id: '1', 
    requester: 'Michael Johnson', 
    amount: 150, 
    reason: 'Electric bill - due in 3 days', 
    status: 'pending',
    votes: { approve: 3, deny: 0 },
    pledges: [
      { name: 'Sarah Johnson', amount: 75 },
      { name: 'Robert Johnson', amount: 50 },
    ],
    createdAt: 'Yesterday at 2:30 PM'
  },
  { 
    id: '2', 
    requester: 'Michael Johnson', 
    amount: 50, 
    reason: 'Gas for work commute', 
    status: 'approved',
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
    acknowledgments: ['Michael Johnson'],
  },
  {
    id: '3',
    content: 'All communication must go through this app - no secret conversations',
    createdBy: 'David Johnson',
    status: 'pending',
    acknowledgments: [],
  },
];

const DEMO_GOALS = [
  { id: '1', goal: 'Help Michael complete his aftercare plan', status: 'in_progress' },
  { id: '2', goal: 'Get to 90 days sobriety', status: 'in_progress' },
];

const DemoFamily = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('chat');
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState(DEMO_MESSAGES);

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/demo')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Demo
            </Button>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Heart className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-medium">The Johnson Family</span>
              <Badge variant="secondary">Demo Mode</Badge>
            </div>
          </div>
          <Button onClick={() => navigate('/provider-purchase')}>
            Get Started
          </Button>
        </div>
      </header>

      {/* Demo Banner */}
      <div className="bg-primary/10 border-b border-primary/20 py-2 px-4 text-center">
        <p className="text-sm text-primary flex items-center justify-center gap-2">
          <Sparkles className="h-4 w-4" />
          You're viewing a demo family. All data is simulated.
        </p>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-5xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="chat">
                <MessageCircle className="h-4 w-4 mr-2" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="financial">
                <DollarSign className="h-4 w-4 mr-2" />
                Financial
              </TabsTrigger>
              <TabsTrigger value="checkins">
                <MapPin className="h-4 w-4 mr-2" />
                Check-ins
              </TabsTrigger>
              <TabsTrigger value="boundaries">
                <Shield className="h-4 w-4 mr-2" />
                Boundaries
              </TabsTrigger>
              <TabsTrigger value="members">
                <Users className="h-4 w-4 mr-2" />
                Members
              </TabsTrigger>
            </TabsList>

            {/* Chat Tab */}
            <TabsContent value="chat">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Family Chat</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                      {messages.map((msg) => (
                        <div key={msg.id} className="flex gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {msg.sender.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{msg.sender}</span>
                              <span className="text-xs text-muted-foreground">{msg.time}</span>
                            </div>
                            <p className="text-sm mt-1 whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  
                  <div className="flex gap-2 mt-4 pt-4 border-t">
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
                </CardContent>
              </Card>
            </TabsContent>

            {/* Financial Tab */}
            <TabsContent value="financial">
              <div className="space-y-4">
                {DEMO_FINANCIAL_REQUESTS.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{request.requester}</span>
                            <Badge variant={request.status === 'approved' ? 'default' : 'secondary'}>
                              {request.status}
                            </Badge>
                          </div>
                          <p className="text-2xl font-bold text-primary">${request.amount}</p>
                          <p className="text-sm text-muted-foreground">{request.reason}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{request.createdAt}</span>
                      </div>

                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-1 text-green-600">
                          <ThumbsUp className="h-4 w-4" />
                          <span className="text-sm">{request.votes.approve} approve</span>
                        </div>
                        <div className="flex items-center gap-1 text-red-600">
                          <ThumbsDown className="h-4 w-4" />
                          <span className="text-sm">{request.votes.deny} deny</span>
                        </div>
                      </div>

                      {request.pledges.length > 0 && (
                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-sm font-medium mb-2">Pledges</p>
                          <div className="space-y-1">
                            {request.pledges.map((pledge, i) => (
                              <div key={i} className="flex justify-between text-sm">
                                <span>{pledge.name}</span>
                                <span className="font-medium">${pledge.amount}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {request.status === 'pending' && (
                        <div className="flex gap-2 mt-4">
                          <Button size="sm" className="flex-1">
                            <ThumbsUp className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1">
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
            <TabsContent value="checkins">
              <div className="space-y-4">
                {DEMO_CHECKINS.map((checkin) => (
                  <Card key={checkin.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            checkin.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'
                          }`}>
                            <MapPin className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{checkin.user}</span>
                              <Badge variant={checkin.status === 'active' ? 'default' : 'outline'}>
                                {checkin.status === 'active' ? 'In Progress' : 'Completed'}
                              </Badge>
                            </div>
                            <p className="text-sm font-medium text-primary mt-1">
                              {checkin.type} - {checkin.name}
                            </p>
                            <p className="text-sm text-muted-foreground">{checkin.location}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Checked in: {checkin.checkinTime}
                              </span>
                              {checkin.status === 'active' ? (
                                <span className="flex items-center gap-1 text-orange-600">
                                  <AlertTriangle className="h-3 w-3" />
                                  Checkout due: {checkin.checkoutDue}
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-green-600">
                                  <CheckCircle className="h-3 w-3" />
                                  Checked out: {checkin.checkoutTime}
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
            <TabsContent value="boundaries">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Family Goals
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {DEMO_GOALS.map((goal) => (
                      <div key={goal.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <Check className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm">{goal.goal}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {DEMO_BOUNDARIES.map((boundary) => (
                  <Card key={boundary.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Shield className="h-5 w-5 text-primary" />
                          <Badge variant={boundary.status === 'approved' ? 'default' : 'secondary'}>
                            {boundary.status}
                          </Badge>
                          {boundary.targetUser && (
                            <Badge variant="outline">For: {boundary.targetUser}</Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">by {boundary.createdBy}</span>
                      </div>
                      
                      <p className="text-sm mb-4">{boundary.content}</p>
                      
                      {boundary.acknowledgments.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {boundary.acknowledgments.map((name, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              <Check className="h-3 w-3 mr-1" />
                              {name}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {boundary.status === 'pending' && (
                        <div className="flex gap-2 mt-4">
                          <Button size="sm">Approve</Button>
                          <Button size="sm" variant="outline">Reject</Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Members Tab */}
            <TabsContent value="members">
              <Card>
                <CardHeader>
                  <CardTitle>Family Members</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {DEMO_MEMBERS.map((member) => (
                    <div 
                      key={member.id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{member.initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-muted-foreground">{member.relationship}</p>
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
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default DemoFamily;
