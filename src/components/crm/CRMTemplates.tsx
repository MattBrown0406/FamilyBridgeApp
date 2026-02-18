import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import { Plus, Mail, MessageSquare, Send, Loader2, Copy, Trash2, FileText } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  template_type: string;
  subject: string | null;
  body: string;
  stage: string | null;
}

interface Lead {
  id: string;
  contact_name: string;
  contact_email: string | null;
  contact_phone: string | null;
}

interface CRMTemplatesProps {
  organizationId: string;
  leads: Lead[];
  organizationName: string;
}

const DEFAULT_TEMPLATES = [
  { name: 'Initial Outreach', type: 'email', stage: 'lead', subject: 'Support Available for Your Family',
    body: 'Hi {{contact_name}},\n\nThank you for reaching out to {{org_name}}. We understand this is a difficult time, and we want you to know that support is available.\n\nWould you be open to a brief call to discuss how we can help your family? We offer confidential, compassionate support.\n\nWarmly,\n{{org_name}} Team' },
  { name: 'Follow-Up After Call', type: 'email', stage: 'contacted', subject: 'Next Steps - {{org_name}}',
    body: 'Hi {{contact_name}},\n\nThank you for speaking with us today. As discussed, here are the next steps:\n\n1. [Next step 1]\n2. [Next step 2]\n\nPlease don\'t hesitate to reach out if you have any questions.\n\nBest,\n{{org_name}} Team' },
  { name: 'Intake Reminder', type: 'sms', stage: 'intake',
    body: 'Hi {{contact_name}}, this is {{org_name}}. Just a reminder about your intake appointment. Please let us know if you need to reschedule. We\'re here for you.' },
  { name: 'Check-In', type: 'sms', stage: 'aftercare',
    body: 'Hi {{contact_name}}, checking in from {{org_name}}. How is everything going? We\'re always here if you need support. Reply anytime.' },
];

export function CRMTemplates({ organizationId, leads, organizationName }: CRMTemplatesProps) {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [sendLeadId, setSendLeadId] = useState('');
  const [newTemplate, setNewTemplate] = useState({
    name: '', template_type: 'email', subject: '', body: '', stage: '',
  });

  useEffect(() => { fetchTemplates(); }, [organizationId]);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('crm_communication_templates')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setTemplates((data as Template[]) || []);
    } catch (err) {
      console.error('Error fetching templates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!newTemplate.name || !newTemplate.body) {
      toast({ title: 'Error', description: 'Name and body are required', variant: 'destructive' });
      return;
    }
    try {
      const { error } = await supabase.from('crm_communication_templates').insert({
        organization_id: organizationId,
        name: newTemplate.name,
        template_type: newTemplate.template_type,
        subject: newTemplate.subject || null,
        body: newTemplate.body,
        stage: newTemplate.stage || null,
        created_by: user?.id,
      });
      if (error) throw error;
      toast({ title: 'Template created' });
      setNewTemplate({ name: '', template_type: 'email', subject: '', body: '', stage: '' });
      setIsAddOpen(false);
      fetchTemplates();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase.from('crm_communication_templates').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Template deleted' });
      fetchTemplates();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const fillTemplate = (body: string, lead: Lead) => {
    return body
      .replace(/\{\{contact_name\}\}/g, lead.contact_name)
      .replace(/\{\{org_name\}\}/g, organizationName);
  };

  const handleSendTemplate = async () => {
    if (!selectedTemplate || !sendLeadId) return;
    const lead = leads.find(l => l.id === sendLeadId);
    if (!lead) return;

    setIsSending(true);
    try {
      const filledBody = fillTemplate(selectedTemplate.body, lead);
      const filledSubject = selectedTemplate.subject
        ? fillTemplate(selectedTemplate.subject, lead) : undefined;

      if (selectedTemplate.template_type === 'email') {
        if (!lead.contact_email) {
          toast({ title: 'Error', description: 'Lead has no email address', variant: 'destructive' });
          return;
        }
        const { error } = await supabase.functions.invoke('send-support-email', {
          body: {
            to: lead.contact_email,
            subject: filledSubject || `Message from ${organizationName}`,
            text: filledBody,
          },
        });
        if (error) throw error;
      } else {
        if (!lead.contact_phone) {
          toast({ title: 'Error', description: 'Lead has no phone number', variant: 'destructive' });
          return;
        }
        const { error } = await supabase.functions.invoke('send-family-invite-sms', {
          body: {
            phoneNumber: lead.contact_phone,
            message: filledBody,
          },
        });
        if (error) throw error;
      }

      // Log activity
      await supabase.from('crm_activities').insert({
        organization_id: organizationId,
        user_id: user?.id,
        activity_type: selectedTemplate.template_type === 'email' ? 'email' : 'text',
        title: `Sent template: ${selectedTemplate.name}`,
        description: filledBody.slice(0, 200),
        lead_id: sendLeadId,
      });

      toast({ title: 'Sent!', description: `${selectedTemplate.template_type === 'email' ? 'Email' : 'SMS'} sent to ${lead.contact_name}` });
      setIsSendOpen(false);
      setSendLeadId('');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  const seedDefaults = async () => {
    try {
      const inserts = DEFAULT_TEMPLATES.map(t => ({
        organization_id: organizationId,
        name: t.name,
        template_type: t.type,
        subject: t.subject || null,
        body: t.body,
        stage: t.stage || null,
        created_by: user?.id,
      }));
      const { error } = await supabase.from('crm_communication_templates').insert(inserts);
      if (error) throw error;
      toast({ title: 'Default templates added' });
      fetchTemplates();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Communication Templates</h3>
          <p className="text-sm text-muted-foreground">Send emails and SMS directly to leads</p>
        </div>
        <div className="flex gap-2">
          {templates.length === 0 && (
            <Button variant="outline" size="sm" onClick={seedDefaults}>
              <FileText className="h-4 w-4 mr-1" /> Load Defaults
            </Button>
          )}
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Template</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Template</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input value={newTemplate.name} onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })} placeholder="Initial outreach email" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={newTemplate.template_type} onValueChange={v => setNewTemplate({ ...newTemplate, template_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Pipeline Stage</Label>
                    <Select value={newTemplate.stage || '_any'} onValueChange={v => setNewTemplate({ ...newTemplate, stage: v === '_any' ? '' : v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_any">Any Stage</SelectItem>
                        <SelectItem value="lead">New Lead</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="intake">Intake</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="aftercare">Aftercare</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {newTemplate.template_type === 'email' && (
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Input value={newTemplate.subject} onChange={e => setNewTemplate({ ...newTemplate, subject: e.target.value })} placeholder="Use {{contact_name}} for personalization" />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Body *</Label>
                  <Textarea value={newTemplate.body} onChange={e => setNewTemplate({ ...newTemplate, body: e.target.value })} rows={6} placeholder="Use {{contact_name}} and {{org_name}} for personalization" />
                  <p className="text-xs text-muted-foreground">Variables: {'{{contact_name}}'}, {'{{org_name}}'}</p>
                </div>
                <Button onClick={handleCreateTemplate} className="w-full">Create Template</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {templates.map(template => (
          <Card key={template.id}>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {template.template_type === 'email' ? <Mail className="h-4 w-4 text-purple-500" /> : <MessageSquare className="h-4 w-4 text-blue-500" />}
                  <p className="font-medium text-sm">{template.name}</p>
                </div>
                <div className="flex items-center gap-1">
                  {template.stage && <Badge variant="secondary" className="text-xs">{template.stage}</Badge>}
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteTemplate(template.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              {template.subject && <p className="text-xs text-muted-foreground">Subject: {template.subject}</p>}
              <p className="text-xs line-clamp-3 text-muted-foreground">{template.body}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => {
                  navigator.clipboard.writeText(template.body);
                  toast({ title: 'Copied to clipboard' });
                }}>
                  <Copy className="h-3 w-3 mr-1" /> Copy
                </Button>
                <Button size="sm" className="flex-1" onClick={() => {
                  setSelectedTemplate(template);
                  setIsSendOpen(true);
                }}>
                  <Send className="h-3 w-3 mr-1" /> Send
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {templates.length === 0 && !isLoading && (
          <Card className="col-span-2">
            <CardContent className="py-8 text-center text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No templates yet. Create one or load the defaults.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Send Dialog */}
      <Dialog open={isSendOpen} onOpenChange={setIsSendOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Send: {selectedTemplate?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Send to Lead</Label>
              <Select value={sendLeadId} onValueChange={setSendLeadId}>
                <SelectTrigger><SelectValue placeholder="Select a lead..." /></SelectTrigger>
                <SelectContent>
                  {leads.filter(l => selectedTemplate?.template_type === 'email' ? l.contact_email : l.contact_phone).map(l => (
                    <SelectItem key={l.id} value={l.id}>{l.contact_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {sendLeadId && selectedTemplate && (
              <div className="p-3 rounded-lg bg-muted text-sm whitespace-pre-wrap">
                {fillTemplate(selectedTemplate.body, leads.find(l => l.id === sendLeadId)!)}
              </div>
            )}
            <Button onClick={handleSendTemplate} disabled={!sendLeadId || isSending} className="w-full">
              {isSending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Send {selectedTemplate?.template_type === 'email' ? 'Email' : 'SMS'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
