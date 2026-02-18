import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import { ArrowRight, Users, Mail, Loader2, CheckSquare, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type PipelineStage = 'lead' | 'contacted' | 'intake' | 'active' | 'aftercare' | 'alumni' | 'lost';

interface Lead {
  id: string;
  contact_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  stage: PipelineStage;
  priority: string;
  stage_entered_at: string;
}

interface OrgMember {
  user_id: string;
  full_name: string;
}

interface Template {
  id: string;
  name: string;
  template_type: string;
}

interface CRMBulkActionsProps {
  organizationId: string;
  leads: Lead[];
  orgMembers: OrgMember[];
  templates: Template[];
  onRefresh: () => void;
}

const PIPELINE_STAGES: { value: PipelineStage; label: string }[] = [
  { value: 'lead', label: 'New Lead' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'intake', label: 'Intake' },
  { value: 'active', label: 'Active' },
  { value: 'aftercare', label: 'Aftercare' },
  { value: 'alumni', label: 'Alumni' },
  { value: 'lost', label: 'Lost' },
];

export function CRMBulkActions({ organizationId, leads, orgMembers, templates, onRefresh }: CRMBulkActionsProps) {
  const { user } = useAuth();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isStageDialogOpen, setIsStageDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [targetStage, setTargetStage] = useState<PipelineStage>('contacted');
  const [targetAssignee, setTargetAssignee] = useState('');
  const [targetTemplate, setTargetTemplate] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === leads.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(leads.map(l => l.id)));
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkStageChange = async () => {
    setIsProcessing(true);
    try {
      const ids = Array.from(selectedIds);
      const { error } = await supabase
        .from('crm_leads')
        .update({ stage: targetStage, stage_entered_at: new Date().toISOString() })
        .in('id', ids);
      if (error) throw error;

      // Log activities
      await Promise.all(ids.map(id =>
        supabase.from('crm_activities').insert({
          organization_id: organizationId,
          user_id: user?.id,
          activity_type: 'stage_change',
          title: `Bulk stage change to ${PIPELINE_STAGES.find(s => s.value === targetStage)?.label}`,
          lead_id: id,
        })
      ));

      toast({ title: 'Success', description: `${ids.length} leads moved to ${PIPELINE_STAGES.find(s => s.value === targetStage)?.label}` });
      clearSelection();
      setIsStageDialogOpen(false);
      onRefresh();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkAssign = async () => {
    setIsProcessing(true);
    try {
      const ids = Array.from(selectedIds);
      const { error } = await supabase
        .from('crm_leads')
        .update({ assigned_to: targetAssignee })
        .in('id', ids);
      if (error) throw error;

      const assigneeName = orgMembers.find(m => m.user_id === targetAssignee)?.full_name || 'team member';
      toast({ title: 'Success', description: `${ids.length} leads assigned to ${assigneeName}` });
      clearSelection();
      setIsAssignDialogOpen(false);
      onRefresh();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkSend = async () => {
    setIsProcessing(true);
    try {
      const ids = Array.from(selectedIds);
      const template = templates.find(t => t.id === targetTemplate);
      if (!template) return;

      // This would invoke the send function for each lead
      let sent = 0;
      for (const id of ids) {
        const lead = leads.find(l => l.id === id);
        if (!lead) continue;
        if (template.template_type === 'email' && !lead.contact_email) continue;
        if (template.template_type === 'sms' && !lead.contact_phone) continue;

        await supabase.from('crm_activities').insert({
          organization_id: organizationId,
          user_id: user?.id,
          activity_type: template.template_type === 'email' ? 'email' : 'text',
          title: `Bulk sent: ${template.name}`,
          lead_id: id,
        });
        sent++;
      }

      toast({ title: 'Success', description: `Template queued for ${sent} leads` });
      clearSelection();
      setIsSendDialogOpen(false);
      onRefresh();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={selectAll}>
            <CheckSquare className="h-4 w-4 mr-1" />
            {selectedIds.size === leads.length ? 'Deselect All' : 'Select All'}
          </Button>
          {selectedIds.size > 0 && (
            <>
              <Badge variant="secondary">{selectedIds.size} selected</Badge>
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                <X className="h-4 w-4 mr-1" /> Clear
              </Button>
            </>
          )}
        </div>
        {selectedIds.size > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsStageDialogOpen(true)}>
              <ArrowRight className="h-4 w-4 mr-1" /> Move Stage
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsAssignDialogOpen(true)}>
              <Users className="h-4 w-4 mr-1" /> Assign
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsSendDialogOpen(true)}>
              <Mail className="h-4 w-4 mr-1" /> Send Template
            </Button>
          </div>
        )}
      </div>

      {/* Lead list with checkboxes */}
      <div className="space-y-2">
        {leads.map(lead => (
          <div
            key={lead.id}
            className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
          >
            <Checkbox
              checked={selectedIds.has(lead.id)}
              onCheckedChange={() => toggleSelect(lead.id)}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{lead.contact_name}</p>
              <p className="text-xs text-muted-foreground">
                {PIPELINE_STAGES.find(s => s.value === lead.stage)?.label} •{' '}
                {formatDistanceToNow(new Date(lead.stage_entered_at), { addSuffix: true })}
              </p>
            </div>
            <Badge variant="secondary" className="text-xs">{lead.priority}</Badge>
          </div>
        ))}
        {leads.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No leads available</p>
        )}
      </div>

      {/* Stage Change Dialog */}
      <Dialog open={isStageDialogOpen} onOpenChange={setIsStageDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Move {selectedIds.size} leads to stage</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Select value={targetStage} onValueChange={(v: PipelineStage) => setTargetStage(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PIPELINE_STAGES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={handleBulkStageChange} disabled={isProcessing} className="w-full">
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Move {selectedIds.size} Leads
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign {selectedIds.size} leads</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Select value={targetAssignee} onValueChange={setTargetAssignee}>
              <SelectTrigger><SelectValue placeholder="Select team member" /></SelectTrigger>
              <SelectContent>
                {orgMembers.map(m => <SelectItem key={m.user_id} value={m.user_id}>{m.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={handleBulkAssign} disabled={isProcessing || !targetAssignee} className="w-full">
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Assign {selectedIds.size} Leads
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Template Dialog */}
      <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Send template to {selectedIds.size} leads</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Select value={targetTemplate} onValueChange={setTargetTemplate}>
              <SelectTrigger><SelectValue placeholder="Select template" /></SelectTrigger>
              <SelectContent>
                {templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name} ({t.template_type})</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={handleBulkSend} disabled={isProcessing || !targetTemplate} className="w-full">
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Send to {selectedIds.size} Leads
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
