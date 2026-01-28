import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Clock, GripVertical, Phone, Mail, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatDistanceToNow, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

type PipelineStage = 'lead' | 'contacted' | 'intake' | 'active' | 'aftercare' | 'alumni' | 'lost';
type Priority = 'low' | 'medium' | 'high' | 'urgent';

interface Lead {
  id: string;
  organization_id: string;
  created_by: string;
  assigned_to: string | null;
  contact_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  patient_name: string | null;
  patient_age: string | null;
  presenting_issue: string | null;
  stage: PipelineStage;
  stage_entered_at: string;
  referral_source_id: string | null;
  referral_notes: string | null;
  converted_to_family_id: string | null;
  converted_at: string | null;
  lost_reason: string | null;
  notes: string | null;
  priority: Priority;
  estimated_value: number | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

interface CRMKanbanBoardProps {
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  onStageChange: (leadId: string, newStage: PipelineStage) => void;
  calculateLeadScore: (lead: Lead) => number;
}

const PIPELINE_STAGES: { value: PipelineStage; label: string; color: string; bgColor: string }[] = [
  { value: 'lead', label: 'New Lead', color: 'bg-slate-500', bgColor: 'bg-slate-50 dark:bg-slate-900/50' },
  { value: 'contacted', label: 'Contacted', color: 'bg-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-900/30' },
  { value: 'intake', label: 'Intake', color: 'bg-yellow-500', bgColor: 'bg-yellow-50 dark:bg-yellow-900/30' },
  { value: 'active', label: 'Active', color: 'bg-green-500', bgColor: 'bg-green-50 dark:bg-green-900/30' },
  { value: 'aftercare', label: 'Aftercare', color: 'bg-purple-500', bgColor: 'bg-purple-50 dark:bg-purple-900/30' },
  { value: 'alumni', label: 'Alumni', color: 'bg-indigo-500', bgColor: 'bg-indigo-50 dark:bg-indigo-900/30' },
  { value: 'lost', label: 'Lost', color: 'bg-red-500', bgColor: 'bg-red-50 dark:bg-red-900/30' },
];

const PRIORITY_COLORS: Record<Priority, string> = {
  low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

const getScoreColor = (score: number) => {
  if (score >= 70) return 'text-green-600 dark:text-green-400';
  if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
};

const getScoreIcon = (score: number) => {
  if (score >= 70) return <TrendingUp className="h-3 w-3" />;
  if (score >= 40) return <Minus className="h-3 w-3" />;
  return <TrendingDown className="h-3 w-3" />;
};

export function CRMKanbanBoard({ leads, onLeadClick, onStageChange, calculateLeadScore }: CRMKanbanBoardProps) {
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [dragOverStage, setDragOverStage] = useState<PipelineStage | null>(null);

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', lead.id);
  };

  const handleDragOver = (e: React.DragEvent, stage: PipelineStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stage);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (e: React.DragEvent, newStage: PipelineStage) => {
    e.preventDefault();
    if (draggedLead && draggedLead.stage !== newStage) {
      onStageChange(draggedLead.id, newStage);
    }
    setDraggedLead(null);
    setDragOverStage(null);
  };

  const handleDragEnd = () => {
    setDraggedLead(null);
    setDragOverStage(null);
  };

  const isStale = (lead: Lead) => {
    const daysSinceUpdate = differenceInDays(new Date(), new Date(lead.stage_entered_at));
    return daysSinceUpdate > 7 && !['active', 'alumni', 'lost'].includes(lead.stage);
  };

  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-4 pb-4 min-w-max">
        {PIPELINE_STAGES.map((stage) => {
          const stageLeads = leads.filter((l) => l.stage === stage.value);
          const isDragOver = dragOverStage === stage.value;

          return (
            <div
              key={stage.value}
              className={cn(
                'flex-shrink-0 w-72 rounded-lg border transition-all duration-200',
                stage.bgColor,
                isDragOver && 'ring-2 ring-primary ring-offset-2 scale-[1.02]'
              )}
              onDragOver={(e) => handleDragOver(e, stage.value)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.value)}
            >
              <div className="p-3 border-b bg-background/50 backdrop-blur-sm rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn('w-3 h-3 rounded-full', stage.color)} />
                    <span className="font-semibold text-sm">{stage.label}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {stageLeads.length}
                  </Badge>
                </div>
              </div>

              <div className="p-2 space-y-2 min-h-[200px] max-h-[60vh] overflow-y-auto">
                {stageLeads.map((lead) => {
                  const score = calculateLeadScore(lead);
                  const stale = isStale(lead);

                  return (
                    <Card
                      key={lead.id}
                      className={cn(
                        'cursor-pointer hover:shadow-md transition-all duration-200 group',
                        draggedLead?.id === lead.id && 'opacity-50 scale-95',
                        stale && 'border-orange-300 dark:border-orange-700'
                      )}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead)}
                      onDragEnd={handleDragEnd}
                      onClick={() => onLeadClick(lead)}
                    >
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1">
                            <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                            <p className="font-medium text-sm truncate">{lead.contact_name}</p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <span className={cn('flex items-center gap-0.5 text-xs font-medium', getScoreColor(score))}>
                              {getScoreIcon(score)}
                              {score}
                            </span>
                          </div>
                        </div>

                        {lead.patient_name && (
                          <p className="text-xs text-muted-foreground truncate">
                            Patient: {lead.patient_name}
                          </p>
                        )}

                        <div className="flex items-center justify-between gap-2">
                          <Badge className={cn('text-[10px] px-1.5', PRIORITY_COLORS[lead.priority])}>
                            {lead.priority}
                          </Badge>
                          <div className="flex items-center gap-1">
                            {lead.contact_phone && (
                              <Phone className="h-3 w-3 text-muted-foreground" />
                            )}
                            {lead.contact_email && (
                              <Mail className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(lead.stage_entered_at), { addSuffix: true })}
                          </div>
                          {stale && (
                            <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                              <AlertTriangle className="h-3 w-3" />
                              <span>Stale</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {stageLeads.length === 0 && (
                  <div className="flex items-center justify-center h-24 text-xs text-muted-foreground">
                    No leads in this stage
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
