import { useState, useEffect, useRef } from 'react';
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  Upload,
  FileText,
  Download,
  Trash2,
  Loader2,
  File,
  FileImage,
  Eye,
  Brain,
  CheckCircle,
  Shield,
} from 'lucide-react';
import { format } from 'date-fns';

interface FamilyDocument {
  id: string;
  family_id: string;
  uploaded_by: string;
  title: string;
  description: string | null;
  document_type: string;
  file_path: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  fiis_analyzed: boolean;
  fiis_analyzed_at: string | null;
  boundaries_extracted: number;
  created_at: string;
  uploader_name?: string;
}

interface FamilyDocumentsTabProps {
  familyId: string;
  userRole: string;
}

const documentTypeLabels: Record<string, string> = {
  intervention_letter: 'Intervention Letter',
  treatment_plan: 'Treatment Plan',
  clinical_summary: 'Clinical Summary',
  consent_form: 'Consent Form',
  other: 'Other',
};

const formatFileSize = (bytes: number | null): string => {
  if (!bytes) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (mimeType: string | null) => {
  if (!mimeType) return File;
  if (mimeType.startsWith('image/')) return FileImage;
  return FileText;
};

export const FamilyDocumentsTab = ({ familyId, userRole }: FamilyDocumentsTabProps) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [documents, setDocuments] = useState<FamilyDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    document_type: 'other',
  });

  const canManage = userRole === 'moderator' || userRole === 'admin';

  useEffect(() => {
    if (familyId) {
      fetchDocuments();
    }
  }, [familyId]);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('family_documents')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      if (data && data.length > 0) {
        const uploaderIds = [...new Set(data.map(d => d.uploaded_by))];
        const profiles = await fetchProfilesByIds(uploaderIds);
        
        const docsWithNames = data.map(doc => ({
          ...doc,
          uploader_name: profiles.find(p => p.id === doc.uploaded_by)?.full_name || 'Unknown',
        }));
        setDocuments(docsWithNames);
      } else {
        setDocuments([]);
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        toast.error('Maximum file size is 20MB');
        return;
      }
      setSelectedFile(file);
      if (!uploadForm.title) {
        setUploadForm(prev => ({ ...prev, title: file.name.replace(/\.[^/.]+$/, '') }));
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadForm.title.trim()) {
      toast.error('Please select a file and provide a title');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const filePath = `${familyId}/${crypto.randomUUID()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('family-documents')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('family_documents')
        .insert({
          family_id: familyId,
          uploaded_by: user?.id,
          title: uploadForm.title.trim(),
          description: uploadForm.description.trim() || null,
          document_type: uploadForm.document_type,
          file_path: filePath,
          file_name: selectedFile.name,
          file_size: selectedFile.size,
          mime_type: selectedFile.type,
        });

      if (dbError) throw dbError;

      toast.success('Document uploaded successfully');
      setIsUploadDialogOpen(false);
      setSelectedFile(null);
      setUploadForm({ title: '', description: '', document_type: 'other' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchDocuments();
    } catch (err: any) {
      console.error('Error uploading document:', err);
      toast.error(err.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (doc: FamilyDocument) => {
    setDownloadingId(doc.id);
    try {
      const { data, error } = await supabase.storage
        .from('family-documents')
        .download(doc.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading document:', err);
      toast.error('Failed to download document');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleView = async (doc: FamilyDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from('family-documents')
        .createSignedUrl(doc.file_path, 3600);

      if (error) throw error;
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (err) {
      console.error('Error viewing document:', err);
      toast.error('Failed to open document');
    }
  };

  const handleDelete = async (docId: string, filePath: string) => {
    try {
      const { error: storageError } = await supabase.storage
        .from('family-documents')
        .remove([filePath]);

      if (storageError) console.warn('Storage delete error:', storageError);

      const { error: dbError } = await supabase
        .from('family_documents')
        .delete()
        .eq('id', docId);

      if (dbError) throw dbError;

      toast.success('Document deleted');
      fetchDocuments();
    } catch (err) {
      console.error('Error deleting document:', err);
      toast.error('Failed to delete document');
    }
  };

  const handleAnalyzeForBoundaries = async (doc: FamilyDocument) => {
    if (doc.document_type !== 'intervention_letter') {
      toast.error('Only intervention letters can be analyzed for boundaries');
      return;
    }

    setAnalyzingId(doc.id);
    try {
      // Download the file content
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('family-documents')
        .download(doc.file_path);

      if (downloadError) throw downloadError;

      // Read file content as text
      const text = await fileData.text();

      // Call the analysis edge function
      const { data, error } = await supabase.functions.invoke('analyze-intervention-letter', {
        body: {
          documentId: doc.id,
          familyId: familyId,
          documentContent: text
        }
      });

      if (error) throw error;

      if (data.boundariesCreated > 0) {
        toast.success(`Found ${data.boundariesCreated} boundaries - submitted for review`);
      } else {
        toast.info('No boundaries found in this document');
      }

      fetchDocuments();
    } catch (err: any) {
      console.error('Error analyzing document:', err);
      toast.error(err.message || 'Failed to analyze document');
    } finally {
      setAnalyzingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Family Documents</h3>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
              <DialogDescription>
                Upload intervention letters, treatment plans, or other documents.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>File *</Label>
                <div 
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                  />
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="h-8 w-8 text-primary" />
                      <div className="text-left">
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">Click to select a file</p>
                      <p className="text-xs text-muted-foreground mt-1">PDF, DOC, TXT, or images (max 20MB)</p>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Document title"
                />
              </div>

              <div className="space-y-2">
                <Label>Document Type</Label>
                <Select 
                  value={uploadForm.document_type} 
                  onValueChange={(v) => setUploadForm(prev => ({ ...prev, document_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(documentTypeLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {uploadForm.document_type === 'intervention_letter' && (
                  <p className="text-xs text-muted-foreground">
                    💡 Intervention letters can be analyzed by FIIS to extract boundaries automatically.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Description (Optional)</Label>
                <Textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description..."
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleUpload} disabled={isUploading || !selectedFile}>
                  {isUploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Upload
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : documents.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No documents yet</h3>
            <p className="text-muted-foreground mb-4">Upload intervention letters, treatment plans, and other documents.</p>
            <Button onClick={() => setIsUploadDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload First Document
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {documents.map(doc => {
            const FileIcon = getFileIcon(doc.mime_type);
            const isInterventionLetter = doc.document_type === 'intervention_letter';
            
            return (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FileIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{doc.title}</h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {documentTypeLabels[doc.document_type] || doc.document_type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(doc.file_size)}
                          </span>
                          {doc.fiis_analyzed && (
                            <Badge variant="secondary" className="text-xs gap-1">
                              <CheckCircle className="h-3 w-3" />
                              {doc.boundaries_extracted} boundaries
                            </Badge>
                          )}
                        </div>
                        {doc.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{doc.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Uploaded by {doc.uploader_name} • {format(new Date(doc.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {isInterventionLetter && !doc.fiis_analyzed && canManage && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleAnalyzeForBoundaries(doc)}
                          disabled={analyzingId === doc.id}
                          title="Analyze for Boundaries"
                        >
                          {analyzingId === doc.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Brain className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleView(doc)} title="View">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDownload(doc)} 
                        disabled={downloadingId === doc.id}
                        title="Download"
                      >
                        {downloadingId === doc.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                      {(doc.uploaded_by === user?.id || canManage) && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="Delete">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Document?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete "{doc.title}". This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleDelete(doc.id, doc.file_path);
                                }}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
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
