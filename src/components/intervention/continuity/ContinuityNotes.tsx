import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StickyNote, Plus } from 'lucide-react';
import { useState } from 'react';

interface Note {
  id: string;
  author: string;
  role: string;
  content: string;
  timestamp: string;
}

const demoNotes: Note[] = [
  {
    id: '1',
    author: 'Dr. Sarah Chen',
    role: 'Clinician',
    content: 'Family alignment is strong post-intervention. Recommend maintaining current boundary structure for at least 2 weeks before re-evaluating. Mom is showing signs of emotional fatigue—proactive support recommended.',
    timestamp: '1 day ago',
  },
  {
    id: '2',
    author: 'Mark Thompson',
    role: 'Interventionist',
    content: 'Intervention went as planned. Individual showed initial resistance but softened toward the end. Even with the decline, I expect a re-engagement window within 2–3 weeks if the family holds boundaries.',
    timestamp: '3 days ago',
  },
];

const roleColors: Record<string, string> = {
  Clinician: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  Interventionist: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  Family: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
};

export const ContinuityNotes = () => {
  const [notes, setNotes] = useState<Note[]>(demoNotes);
  const [newNote, setNewNote] = useState('');
  const [noteRole, setNoteRole] = useState('Family');

  const addNote = () => {
    if (!newNote.trim()) return;
    const note: Note = {
      id: Date.now().toString(),
      author: 'You',
      role: noteRole,
      content: newNote.trim(),
      timestamp: 'Just now',
    };
    setNotes((prev) => [note, ...prev]);
    setNewNote('');
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <StickyNote className="h-4 w-4 text-primary" />
          Notes & Observations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Note */}
        <div className="space-y-2 p-3 rounded-lg bg-muted/30 border border-border">
          <div className="flex gap-2">
            <Select value={noteRole} onValueChange={setNoteRole}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Family">Family</SelectItem>
                <SelectItem value="Clinician">Clinician</SelectItem>
                <SelectItem value="Interventionist">Interventionist</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" onClick={addNote} disabled={!newNote.trim()} className="h-8 gap-1">
              <Plus className="h-3 w-3" /> Add
            </Button>
          </div>
          <Textarea
            placeholder="Add an observation, note, or update..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={2}
            className="text-sm"
          />
        </div>

        {/* Notes List */}
        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note.id} className="p-3 rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-sm font-medium text-foreground">{note.author}</span>
                <Badge className={`${roleColors[note.role] || 'bg-muted text-muted-foreground'} border-0 text-xs`}>
                  {note.role}
                </Badge>
                <span className="text-xs text-muted-foreground ml-auto">{note.timestamp}</span>
              </div>
              <p className="text-sm text-muted-foreground">{note.content}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
