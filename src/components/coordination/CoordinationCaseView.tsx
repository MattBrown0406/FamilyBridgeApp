import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Users, MessageSquare, ShieldCheck, Brain, ListTodo } from 'lucide-react';
import { ChannelChat } from '@/components/coordination/ChannelChat';
import { CaseTeamPanel } from '@/components/coordination/CaseTeamPanel';
import { CaseTasksPanel } from '@/components/coordination/CaseTasksPanel';
import { AIInsightsPanel } from '@/components/coordination/AIInsightsPanel';

interface Channel {
  id: string;
  channel_type: string;
  name: string;
  description: string | null;
}

interface CaseDetails {
  id: string;
  title: string;
  status: string;
  family_id: string;
  family_name?: string;
}

interface Props {
  caseId: string;
  onBack: () => void;
  userId: string;
}

export const CoordinationCaseView = ({ caseId, onBack, userId }: Props) => {
  const [caseDetails, setCaseDetails] = useState<CaseDetails | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isProvider, setIsProvider] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('family');

  useEffect(() => {
    loadCase();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  const loadCase = async () => {
    try {
      const [caseRes, channelsRes, memberRes] = await Promise.all([
        supabase.from('coordination_cases').select('*').eq('id', caseId).single(),
        supabase.from('coordination_channels').select('*').eq('case_id', caseId),
        supabase.from('coordination_case_members').select('role').eq('case_id', caseId).eq('user_id', userId).single(),
      ]);

      if (caseRes.data) {
        const { data: family } = await supabase
          .from('families')
          .select('name')
          .eq('id', caseRes.data.family_id)
          .single();
        
        setCaseDetails({
          ...caseRes.data,
          family_name: family?.name || 'Unknown',
        });
      }

      setChannels(channelsRes.data || []);
      
      const role = memberRes.data?.role;
      const providerRoles = ['interventionist', 'clinician', 'treatment_provider', 'case_manager', 'admin'];
      setIsProvider(providerRoles.includes(role || ''));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!caseDetails) return null;

  const familyChannel = channels.find(c => c.channel_type === 'family');
  const providerChannel = channels.find(c => c.channel_type === 'provider');
  const aiChannel = channels.find(c => c.channel_type === 'ai_analysis');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">{caseDetails.title}</h2>
            <Badge variant={caseDetails.status === 'active' ? 'default' : 'secondary'}>
              {caseDetails.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{caseDetails.family_name}</p>
        </div>
      </div>

      {/* Main tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
          <TabsTrigger value="family" className="gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            Family Channel
          </TabsTrigger>
          {isProvider && (
            <TabsTrigger value="provider" className="gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              Provider Only
            </TabsTrigger>
          )}
          <TabsTrigger value="team" className="gap-1">
            <Users className="h-3.5 w-3.5" />
            Team
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-1">
            <ListTodo className="h-3.5 w-3.5" />
            Tasks
          </TabsTrigger>
          {isProvider && (
            <TabsTrigger value="ai" className="gap-1">
              <Brain className="h-3.5 w-3.5" />
              AI Insights
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="family">
          {familyChannel && (
            <ChannelChat
              channelId={familyChannel.id}
              channelName="Family Channel"
              channelDescription="Updates, coordination, and guidance visible to family and professionals"
              channelType="family"
              userId={userId}
            />
          )}
        </TabsContent>

        {isProvider && (
          <TabsContent value="provider">
            {providerChannel && (
              <ChannelChat
                channelId={providerChannel.id}
                channelName="Provider Channel"
                channelDescription="Clinical concerns, risk flags, strategy discussion — providers only"
                channelType="provider"
                userId={userId}
              />
            )}
          </TabsContent>
        )}

        <TabsContent value="team">
          <CaseTeamPanel caseId={caseId} userId={userId} isProvider={isProvider} />
        </TabsContent>

        <TabsContent value="tasks">
          <CaseTasksPanel caseId={caseId} userId={userId} />
        </TabsContent>

        {isProvider && (
          <TabsContent value="ai">
            {aiChannel && (
              <AIInsightsPanel caseId={caseId} channelId={aiChannel.id} userId={userId} />
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};
