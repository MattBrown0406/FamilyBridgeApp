import { useState } from 'react';
import { format } from 'date-fns';
import { FileText, Plus, Flag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { ClinicianNote, NoteType, SignalCategoryName } from '@/data/interventionReadinessData';

const NOTE_TYPES: NoteType[] = [
  'Pattern observation', 'Intervention strategy', 'Family coaching',
  'Placement planning', 'Risk flag', 'Timing judgment',
];

const CATEGORIES: (SignalCategoryName | 'General')[] = [
  'General', 'Distress Elevation', 'Consequence Awareness', 'Resistance Fatigue',
  'Instability / System Disruption', 'Help-Proximity Behavior',
];

interface ClinicianNotesProps {
  notes: ClinicianNote[];
  onAddNote: (note: ClinicianNote) => void;
}

export function ClinicianNotes({ notes, onAddNote }: ClinicianNotesProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [text, setText] = useState('');
  const [noteType, setNoteType] = useState<NoteType>('Pattern observation');
  const [category, setCategory] = useState<SignalCategoryName | 'General'>('General');
  const [followUp, setFollowUp] = useState(false);

  const handleAdd = () => {
    if (!text.trim()) return;
    onAddNote({
      id: `note-${Date.now()}`,
      createdAt: new Date().toISOString(),
      noteType,
      text: text.trim(),
      category,
      followUp,
    });
    setText('');
    setFollowUp(false);
    setDialogOpen(false);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Clinician Notes
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-8 text-xs">
                <Plus className="h-3 w-3 mr-1" /> Add Note
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Clinician Note</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Note</Label>
                  <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Enter your observation or note..." rows={4} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Type</Label>
                    <Select value={noteType} onValueChange={(v) => setNoteType(v as NoteType)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {NOTE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select value={category} onValueChange={(v) => setCategory(v as SignalCategoryName | 'General')}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={followUp} onCheckedChange={setFollowUp} />
                  <Label>Follow-up needed</Label>
                </div>
                <Button onClick={handleAdd} className="w-full">Add Note</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
          {notes.map((note) => (
            <div key={note.id} className="p-3 rounded-lg border bg-card">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs">{note.noteType}</Badge>
                {note.category !== 'General' && (
                  <Badge variant="secondary" className="text-xs">{note.category}</Badge>
                )}
                {note.followUp && (
                  <Badge className="bg-warning/15 text-warning-foreground text-xs gap-1">
                    <Flag className="h-3 w-3" /> Follow-up
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground ml-auto">
                  {format(new Date(note.createdAt), 'MMM d, h:mm a')}
                </span>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">{note.text}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
