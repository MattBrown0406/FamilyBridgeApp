import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { fetchProfilesByIds } from '@/lib/profileApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import {
  Plus,
  Eye,
  EyeOff,
  Brain,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  Clock,
  TrendingUp,
  BarChart,
  Trash2,
  Pencil,
  Filter,
  Loader2,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';

interface ProviderNote {
  id: string;
  organization_id: string;
  family_id: string | null;
  author_id: string;
  note_type: 'observation' | 'concern' | 'hypothesis' | 'action';
  confidence_level: 'low' | 'moderate' | 'high';
  time_horizon: 'immediate' | 'emerging' | 'longitudinal';
  visibility: 'internal_only' | 'shareable_summary';
  include_in_ai_analysis: boolean;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  author_name?: string;
  family_name?: string;
}

interface Family {
  id: string;
  name: string;
  organization_id: string | null;
}

interface ModeratorNotesPanelProps {
  families: Family[];
}

const noteTypeConfig = {
  observation: { icon: Eye, color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Observation' },
  concern: { icon: AlertTriangle, color: 'bg-amber-100 text-amber-800 border-amber-200', label: 'Concern' },
  hypothesis: { icon: Lightbulb, color: 'bg-purple-100 text-purple-800 border-purple-200', label: 'Hypothesis' },
  action: { icon: CheckCircle, color: 'bg-green-100 text-green-800 border-green-200', label: 'Action' },
};

const confidenceConfig = {
  low: { color: 'bg-muted text-muted-foreground', label: 'Low' },
  moderate: { color: 'bg-secondary text-secondary-foreground', label: 'Moderate' },
  high: { color: 'bg-primary/20 text-primary', label: 'High' },
};

const horizonConfig = {
  immediate: { icon: Clock, label: 'Immediate' },
  emerging: { icon: TrendingUp, label: 'Emerging' },
  longitudinal: { icon: BarChart, label: 'Longitudinal' },
};

export const ModeratorNotesPanel = ({ families }: ModeratorNotesPanelProps) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<ProviderNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingNote, setEditingNote] = useState<ProviderNote | null>(null);
  
  // Filter state
  const [filterType, setFilterType] = useState<string>('all');
  const [filterFamily, setFilterFamily] = useState<string>('all');
  
  // New note form
  const [newNote, setNewNote] = useState({
    family_id: families[0]?.id || '',
    note_type: 'observation' as const,
    confidence_level: 'moderate' as const,
    time_horizon: 'emerging' as const,
    visibility: 'internal_only' as const,
    include_in_ai_analysis: true,
    title: '',
    content: '',
  });

  useEffect(() => {
    if (families.length > 0) {
      fetchNotes();
    } else {
      setIsLoading(false);
    }
  }, [families]);

  const fetchNotes = async () => {
    if (families.length === 0) {
      setNotes([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const familyIds = families.map(f => f.id);
      
      const { data, error } = await supabase
        .from('provider_notes')
        .select('*')
        .in('family_id', familyIds)
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      // Fetch author names
      if (data && data.length > 0) {
        const authorIds = [...new Set(data.map(n => n.author_id))];
        const profiles = await fetchProfilesByIds(authorIds);
        
        const notesWithNames = data.map(note => ({
          ...note,
          author_name: profiles.find(p => p.id === note.author_id)?.full_name || 'Unknown',
          family_name: families.find(f => f.id === note.family_id)?.name || 'Unknown',
        }));
        setNotes(notesWithNames as ProviderNote[]);
      } else {
        setNotes([]);
      }
    } catch (err) {
      console.error('Error fetching notes:', err);
      toast({ title: 'Error', description: 'Failed to load notes', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNote = async () => {
    if (!newNote.title.trim() || !newNote.content.trim()) {
      toast({ title: 'Error', description: 'Title and content are required', variant: 'destructive' });
      return;
    }

    if (!newNote.family_id) {
      toast({ title: 'Error', description: 'Please select a family', variant: 'destructive' });
      return;
    }

    const selectedFamily = families.find(f => f.id === newNote.family_id);
    if (!selectedFamily?.organization_id) {
      toast({ title: 'Error', description: 'Selected family is not part of an organization', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('provider_notes')
        .insert({
          organization_id: selectedFamily.organization_id,
          family_id: newNote.family_id,
          author_id: user?.id,
          note_type: newNote.note_type,
          confidence_level: newNote.confidence_level,
          time_horizon: newNote.time_horizon,
          visibility: newNote.visibility,
          include_in_ai_analysis: newNote.include_in_ai_analysis,
          title: newNote.title.trim(),
          content: newNote.content.trim(),
        });

      if (error) throw error;

      toast({ title: 'Success', description: 'Note created successfully' });
      setIsCreateDialogOpen(false);
      setNewNote({
        family_id: families[0]?.id || '',
        note_type: 'observation',
        confidence_level: 'moderate',
        time_horizon: 'emerging',
        visibility: 'internal_only',
        include_in_ai_analysis: true,
        title: '',
        content: '',
      });
      fetchNotes();
    } catch (err: any) {
      console.error('Error creating note:', err);
      toast({ title: 'Error', description: err.message || 'Failed to create note', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateNote = async () => {
    if (!editingNote) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('provider_notes')
        .update({
          note_type: editingNote.note_type,
          confidence_level: editingNote.confidence_level,
          time_horizon: editingNote.time_horizon,
          visibility: editingNote.visibility,
          include_in_ai_analysis: editingNote.include_in_ai_analysis,
          title: editingNote.title.trim(),
          content: editingNote.content.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingNote.id);

      if (error) throw error;

      toast({ title: 'Success', description: 'Note updated successfully' });
      setEditingNote(null);
      fetchNotes();
    } catch (err: any) {
      console.error('Error updating note:', err);
      toast({ title: 'Error', description: err.message || 'Failed to update note', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const { error } = await supabase
        .from('provider_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      toast({ title: 'Success', description: 'Note deleted' });
      fetchNotes();
    } catch (err: any) {
      console.error('Error deleting note:', err);
      toast({ title: 'Error', description: err.message || 'Failed to delete note', variant: 'destructive' });
    }
  };

  // Filter notes
  const filteredNotes = notes.filter(note => {
    if (filterType !== 'all' && note.note_type !== filterType) return false;
    if (filterFamily !== 'all' && note.family_id !== filterFamily) return false;
    return true;
  });

  const renderNoteForm = (
    note: typeof newNote | ProviderNote,
    setNote: (note: any) => void,
    isEdit = false,
  ) => (
    <div className="space-y-4">
      {!isEdit && (
        <div className="space-y-2">
          <Label>Family *</Label>
          <Select value={(note as typeof newNote).family_id || ''} onValueChange={(v) => setNote({ ...note, family_id: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Select a family" />
            </SelectTrigger>
            <SelectContent>
              {families.filter(f => f.organization_id).map(f => (
                <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Only families under an organization can have clinical notes</p>
        </div>
      )}

      <div className="space-y-2">
        <Label>Title *</Label>
        <Input
          value={note.title}
          onChange={(e) => setNote({ ...note, title: e.target.value })}
          placeholder="Brief summary of the note"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Note Type *</Label>
          <Select value={note.note_type} onValueChange={(v: any) => setNote({ ...note, note_type: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="observation">👁 Observation</SelectItem>
              <SelectItem value="concern">⚠️ Concern</SelectItem>
              <SelectItem value="hypothesis">💡 Hypothesis</SelectItem>
              <SelectItem value="action">✅ Action</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Confidence Level</Label>
          <Select value={note.confidence_level} onValueChange={(v: any) => setNote({ ...note, confidence_level: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="moderate">Moderate</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Time Horizon</Label>
          <Select value={note.time_horizon} onValueChange={(v: any) => setNote({ ...note, time_horizon: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="immediate">⏰ Immediate</SelectItem>
              <SelectItem value="emerging">📈 Emerging</SelectItem>
              <SelectItem value="longitudinal">📊 Longitudinal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Visibility</Label>
          <Select value={note.visibility} onValueChange={(v: any) => setNote({ ...note, visibility: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="internal_only">🔒 Internal Only</SelectItem>
              <SelectItem value="shareable_summary">📤 Shareable Summary</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
        <Brain className="h-5 w-5 text-primary" />
        <div className="flex-1">
          <Label htmlFor="ai-toggle" className="text-sm font-medium">Include in AI Analysis</Label>
          <p className="text-xs text-muted-foreground">This note will be used by FIIS for pattern recognition</p>
        </div>
        <Switch
          id="ai-toggle"
          checked={note.include_in_ai_analysis}
          onCheckedChange={(checked) => setNote({ ...note, include_in_ai_analysis: checked })}
        />
      </div>

      <div className="space-y-2">
        <Label>Content *</Label>
        <Textarea
          value={note.content}
          onChange={(e) => setNote({ ...note, content: e.target.value })}
          placeholder="Detailed notes, observations, or clinical insights..."
          rows={5}
        />
      </div>
    </div>
  );

  // Check if any families have organizations (required for notes)
  const eligibleFamilies = families.filter(f => f.organization_id);

  if (eligibleFamilies.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Clinical Notes Not Available</h3>
          <p className="text-muted-foreground">
            Clinical notes require families to be part of a provider organization. 
            Contact your administrator to link your families to an organization.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="observation">Observations</SelectItem>
              <SelectItem value="concern">Concerns</SelectItem>
              <SelectItem value="hypothesis">Hypotheses</SelectItem>
              <SelectItem value="action">Actions</SelectItem>
            </SelectContent>
          </Select>

          {families.length > 1 && (
            <Select value={filterFamily} onValueChange={setFilterFamily}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All families" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All families</SelectItem>
                {families.map(f => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Note
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Clinical Note</DialogTitle>
              <DialogDescription>
                Add a new observation, concern, hypothesis, or action item for your team.
              </DialogDescription>
            </DialogHeader>
            {renderNoteForm(newNote, setNewNote)}
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateNote} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Note
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingNote} onOpenChange={(open) => !open && setEditingNote(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
          </DialogHeader>
          {editingNote && renderNoteForm(editingNote, setEditingNote, true)}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setEditingNote(null)}>Cancel</Button>
            <Button onClick={handleUpdateNote} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredNotes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No notes yet</h3>
            <p className="text-muted-foreground mb-4">Create your first clinical note to start collaborating with your team.</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Note
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotes.map(note => {
            const TypeIcon = noteTypeConfig[note.note_type].icon;
            const HorizonIcon = horizonConfig[note.time_horizon].icon;
            
            return (
              <Card key={note.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={noteTypeConfig[note.note_type].color}>
                        <TypeIcon className="h-3 w-3 mr-1" />
                        {noteTypeConfig[note.note_type].label}
                      </Badge>
                      <Badge variant="outline" className={confidenceConfig[note.confidence_level].color}>
                        {confidenceConfig[note.confidence_level].label}
                      </Badge>
                      <Badge variant="outline" className="text-muted-foreground">
                        <HorizonIcon className="h-3 w-3 mr-1" />
                        {horizonConfig[note.time_horizon].label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      {note.visibility === 'internal_only' ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-green-600" />
                      )}
                      {note.include_in_ai_analysis && (
                        <Brain className="h-4 w-4 text-primary" />
                      )}
                      {note.author_id === user?.id && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7"
                            onClick={() => setEditingNote(note)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-destructive"
                            onClick={() => handleDeleteNote(note.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <h4 className="font-semibold mb-1">{note.title}</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-3">{note.content}</p>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                    <span>{note.author_name}</span>
                    <span>•</span>
                    <span>{note.family_name}</span>
                    <span>•</span>
                    <span>{format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
