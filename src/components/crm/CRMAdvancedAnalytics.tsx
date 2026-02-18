import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { DollarSign, Users, TrendingDown, Heart, Award } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface Lead {
  id: string;
  stage: string;
  referral_source_id: string | null;
  converted_to_family_id: string | null;
  converted_at: string | null;
  lost_reason: string | null;
  lost_category?: string | null;
  estimated_value: number | null;
  assigned_to: string | null;
  created_at: string;
  contact_name: string;
  priority: string;
  stage_entered_at: string;
}

interface ReferralSource {
  id: string;
  name: string;
  source_type: string;
}

interface Activity {
  id: string;
  activity_type: string;
  user_id: string;
  lead_id: string | null;
  occurred_at: string;
}

interface FamilyHealth {
  family_id: string;
  status: string;
  family_name: string;
}

interface OrgMember {
  user_id: string;
  full_name: string;
}

interface CRMAdvancedAnalyticsProps {
  leads: Lead[];
  referralSources: ReferralSource[];
  activities: Activity[];
  familyHealthData: FamilyHealth[];
  orgMembers: OrgMember[];
}

const CHART_COLORS = ['#3b82f6', '#22c55e', '#eab308', '#a855f7', '#f97316', '#ec4899', '#14b8a6', '#ef4444'];

const tooltipStyle = {
  backgroundColor: 'hsl(var(--background))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
};

export function CRMAdvancedAnalytics({
  leads, referralSources, activities, familyHealthData, orgMembers
}: CRMAdvancedAnalyticsProps) {
  // ── Referral Source ROI ──
  const referralROI = referralSources.map(source => {
    const sourceLeads = leads.filter(l => l.referral_source_id === source.id);
    const converted = sourceLeads.filter(l => l.converted_to_family_id);
    const lost = sourceLeads.filter(l => l.stage === 'lost');
    const totalValue = converted.reduce((sum, l) => sum + (l.estimated_value || 0), 0);
    const avgDaysToConvert = converted.length > 0
      ? converted.reduce((sum, l) => sum + differenceInDays(new Date(l.converted_at!), new Date(l.created_at)), 0) / converted.length
      : 0;

    return {
      name: source.name,
      type: source.source_type,
      totalLeads: sourceLeads.length,
      converted: converted.length,
      lost: lost.length,
      conversionRate: sourceLeads.length > 0 ? Math.round((converted.length / sourceLeads.length) * 100) : 0,
      totalValue,
      avgDaysToConvert: Math.round(avgDaysToConvert),
    };
  }).filter(s => s.totalLeads > 0).sort((a, b) => b.conversionRate - a.conversionRate);

  // ── Team Performance ──
  const teamPerformance = orgMembers.map(member => {
    const memberLeads = leads.filter(l => l.assigned_to === member.user_id);
    const memberActivities = activities.filter(a => a.user_id === member.user_id);
    const converted = memberLeads.filter(l => l.converted_to_family_id);
    const calls = memberActivities.filter(a => a.activity_type === 'call').length;
    const emails = memberActivities.filter(a => a.activity_type === 'email').length;

    return {
      name: member.full_name,
      totalLeads: memberLeads.length,
      converted: converted.length,
      conversionRate: memberLeads.length > 0 ? Math.round((converted.length / memberLeads.length) * 100) : 0,
      activities: memberActivities.length,
      calls,
      emails,
      avgResponseDays: memberLeads.length > 0
        ? Math.round(memberLeads.reduce((sum, l) => {
            const firstActivity = memberActivities.find(a => a.lead_id === l.id);
            if (!firstActivity) return sum + 999;
            return sum + differenceInDays(new Date(firstActivity.occurred_at), new Date(l.created_at));
          }, 0) / memberLeads.length)
        : 0,
    };
  }).filter(m => m.totalLeads > 0 || m.activities > 0).sort((a, b) => b.converted - a.converted);

  // ── Lost Lead Analysis ──
  const lostLeads = leads.filter(l => l.stage === 'lost');
  const lostReasons: Record<string, number> = {};
  lostLeads.forEach(l => {
    const reason = l.lost_category || l.lost_reason || 'Unknown';
    lostReasons[reason] = (lostReasons[reason] || 0) + 1;
  });
  const lostReasonData = Object.entries(lostReasons)
    .map(([name, value]) => ({ name: name.length > 20 ? name.slice(0, 20) + '...' : name, value, fullName: name }))
    .sort((a, b) => b.value - a.value);

  const lostByStage: Record<string, number> = {};
  lostLeads.forEach(l => {
    // Use the stage they were in before being moved to lost (approximate via created_at timing)
    lostByStage['Lost'] = (lostByStage['Lost'] || 0) + 1;
  });

  const avgDaysBeforeLost = lostLeads.length > 0
    ? Math.round(lostLeads.reduce((sum, l) => sum + differenceInDays(new Date(l.stage_entered_at), new Date(l.created_at)), 0) / lostLeads.length)
    : 0;

  // ── Family Health Correlation ──
  const healthStatusCounts: Record<string, number> = {};
  familyHealthData.forEach(fh => {
    healthStatusCounts[fh.status] = (healthStatusCounts[fh.status] || 0) + 1;
  });
  const healthCorrelationData = Object.entries(healthStatusCounts)
    .map(([name, value]) => ({ name, value }));

  // Correlate referral sources with family health
  const sourceHealthCorrelation = referralSources.map(source => {
    const sourceLeads = leads.filter(l => l.referral_source_id === source.id && l.converted_to_family_id);
    const familyIds = sourceLeads.map(l => l.converted_to_family_id);
    const healthData = familyHealthData.filter(fh => familyIds.includes(fh.family_id));
    const healthyCount = healthData.filter(fh => fh.status === 'healthy' || fh.status === 'stable').length;
    const healthRate = healthData.length > 0 ? Math.round((healthyCount / healthData.length) * 100) : 0;
    return {
      name: source.name,
      families: familyIds.length,
      healthRate,
      healthy: healthyCount,
      total: healthData.length,
    };
  }).filter(s => s.families > 0).sort((a, b) => b.healthRate - a.healthRate);

  return (
    <Tabs defaultValue="referral-roi" className="w-full">
      <TabsList className="flex flex-wrap h-auto gap-1">
        <TabsTrigger value="referral-roi" className="gap-1.5">
          <DollarSign className="h-3.5 w-3.5" /> Referral ROI
        </TabsTrigger>
        <TabsTrigger value="team" className="gap-1.5">
          <Award className="h-3.5 w-3.5" /> Team
        </TabsTrigger>
        <TabsTrigger value="lost" className="gap-1.5">
          <TrendingDown className="h-3.5 w-3.5" /> Lost Leads
        </TabsTrigger>
        <TabsTrigger value="health" className="gap-1.5">
          <Heart className="h-3.5 w-3.5" /> Health Correlation
        </TabsTrigger>
      </TabsList>

      {/* ── Referral Source ROI ── */}
      <TabsContent value="referral-roi" className="mt-4 space-y-4">
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-3xl font-bold">{referralROI.length}</p>
              <p className="text-sm text-muted-foreground">Active Sources</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-3xl font-bold">
                {referralROI.length > 0 ? referralROI[0].name : 'N/A'}
              </p>
              <p className="text-sm text-muted-foreground">Top Converter</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-3xl font-bold">
                ${referralROI.reduce((sum, r) => sum + r.totalValue, 0).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Total Pipeline Value</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Referral Source Performance</CardTitle>
            <CardDescription>Conversion rates and value by source</CardDescription>
          </CardHeader>
          <CardContent>
            {referralROI.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={referralROI}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="converted" name="Converted" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="lost" name="Lost" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">No referral data yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Detailed Source Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-3">
                {referralROI.map((source, i) => (
                  <div key={source.name} className="flex items-center gap-3 p-3 rounded-lg border">
                    <div className="w-2 h-10 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{source.name}</p>
                      <p className="text-xs text-muted-foreground">{source.type}</p>
                    </div>
                    <div className="text-right text-sm space-y-0.5">
                      <p>{source.totalLeads} leads → {source.converted} converted</p>
                      <p className="text-xs text-muted-foreground">
                        {source.conversionRate}% rate • avg {source.avgDaysToConvert}d to convert
                      </p>
                    </div>
                  </div>
                ))}
                {referralROI.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No referral sources with leads</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ── Team Performance ── */}
      <TabsContent value="team" className="mt-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Team Leaderboard</CardTitle>
            <CardDescription>Performance across leads, activities, and conversions</CardDescription>
          </CardHeader>
          <CardContent>
            {teamPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={teamPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="converted" name="Converted" fill="#22c55e" stackId="a" />
                  <Bar dataKey="totalLeads" name="Total Leads" fill="#3b82f6" stackId="b" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">No team data yet</p>
            )}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamPerformance.map((member, i) => (
            <Card key={member.name}>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.conversionRate}% conversion</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2 rounded bg-muted">
                    <p className="text-lg font-bold">{member.totalLeads}</p>
                    <p className="text-[10px] text-muted-foreground">Leads</p>
                  </div>
                  <div className="p-2 rounded bg-muted">
                    <p className="text-lg font-bold">{member.activities}</p>
                    <p className="text-[10px] text-muted-foreground">Activities</p>
                  </div>
                  <div className="p-2 rounded bg-muted">
                    <p className="text-lg font-bold">{member.calls}</p>
                    <p className="text-[10px] text-muted-foreground">Calls</p>
                  </div>
                  <div className="p-2 rounded bg-muted">
                    <p className="text-lg font-bold">{member.emails}</p>
                    <p className="text-[10px] text-muted-foreground">Emails</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      {/* ── Lost Lead Analysis ── */}
      <TabsContent value="lost" className="mt-4 space-y-4">
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-3xl font-bold text-destructive">{lostLeads.length}</p>
              <p className="text-sm text-muted-foreground">Total Lost</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-3xl font-bold">{avgDaysBeforeLost}d</p>
              <p className="text-sm text-muted-foreground">Avg Days Before Lost</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-3xl font-bold">
                {leads.length > 0 ? Math.round((lostLeads.length / leads.length) * 100) : 0}%
              </p>
              <p className="text-sm text-muted-foreground">Loss Rate</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Reasons for Loss</CardTitle>
            <CardDescription>Why leads don't convert</CardDescription>
          </CardHeader>
          <CardContent>
            {lostReasonData.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={lostReasonData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" paddingAngle={2}>
                      {lostReasonData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(value: number, name: string) => [value, name]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {lostReasonData.map((item, i) => (
                    <div key={item.fullName} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-sm flex-1">{item.fullName}</span>
                      <Badge variant="secondary">{item.value}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No lost leads recorded</p>
            )}
          </CardContent>
        </Card>

        {/* Lost leads list */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recently Lost</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[250px]">
              <div className="space-y-2">
                {lostLeads.slice(0, 10).map(lead => (
                  <div key={lead.id} className="flex items-center gap-3 p-2 rounded-lg border">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{lead.contact_name}</p>
                      <p className="text-xs text-muted-foreground">{lead.lost_reason || 'No reason given'}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {differenceInDays(new Date(), new Date(lead.stage_entered_at))}d ago
                    </p>
                  </div>
                ))}
                {lostLeads.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No lost leads</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ── Family Health Correlation ── */}
      <TabsContent value="health" className="mt-4 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Family Health Distribution</CardTitle>
              <CardDescription>Health status of converted families</CardDescription>
            </CardHeader>
            <CardContent>
              {healthCorrelationData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={healthCorrelationData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" paddingAngle={2}>
                      {healthCorrelationData.map((entry, i) => (
                        <Cell key={i} fill={
                          entry.name === 'healthy' ? '#22c55e' :
                          entry.name === 'stable' ? '#3b82f6' :
                          entry.name === 'at_risk' ? '#eab308' :
                          entry.name === 'critical' ? '#ef4444' :
                          CHART_COLORS[i % CHART_COLORS.length]
                        } />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">No health data available</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Source → Family Health</CardTitle>
              <CardDescription>Which referral sources produce healthiest outcomes</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[250px]">
                <div className="space-y-3">
                  {sourceHealthCorrelation.map((source, i) => (
                    <div key={source.name} className="flex items-center gap-3 p-2 rounded-lg border">
                      <Heart className={cn(
                        "h-4 w-4",
                        source.healthRate >= 70 ? "text-green-500" :
                        source.healthRate >= 40 ? "text-yellow-500" : "text-red-500"
                      )} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{source.name}</p>
                        <p className="text-xs text-muted-foreground">{source.families} families</p>
                      </div>
                      <Badge variant={source.healthRate >= 70 ? "default" : "secondary"}>
                        {source.healthRate}% healthy
                      </Badge>
                    </div>
                  ))}
                  {sourceHealthCorrelation.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No correlation data yet</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}
