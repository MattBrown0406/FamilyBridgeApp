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
import { AIProcessingNotice } from '@/components/AIProcessingNotice';
import { DOCUMENT_UPLOAD_ACCEPT, DOCUMENT_UPLOAD_HELPER_TEXT, getDocumentExtension, getDocumentMimeType } from '@/lib/documentUpload';

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
  discharge_plan: 'Discharge Plan',
  aftercare_plan: 'Aftercare Plan',
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
  const [isBackfilling, setIsBackfilling] = useState(false);
  const backfillTriggeredRef = useRef(false);
  
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

    if (!user) {
      toast.error('Please sign in to upload documents.');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = getDocumentExtension(selectedFile.name);
      const filePath = `${familyId}/${crypto.randomUUID()}.${fileExt}`;
      const mimeType = getDocumentMimeType(selectedFile);
      
      const { error: uploadError } = await supabase.storage
        .from('family-documents')
        .upload(filePath, selectedFile, { contentType: mimeType });

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
          mime_type: mimeType,
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

      if (storageError) {
        console.warn('Storage delete error:', storageError);
        toast.error('The document record was removed but the file may still exist in storage.');
      }

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

  // Shared analyzer used by manual click, post-upload auto-run, and backfill.
  const analyzeInterventionLetter = async (
    doc: Pick<FamilyDocument, 'id' | 'document_type' | 'file_path' | 'mime_type'>,
    opts: { silent?: boolean; refresh?: boolean } = {},
  ): Promise<{ ok: boolean; data?: any; error?: any }> => {
    if (doc.document_type !== 'intervention_letter') {
      if (!opts.silent) toast.error('Only intervention letters can be analyzed with FIIS');
      return { ok: false, error: new Error('not_intervention_letter') };
    }

    try {
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('family-documents')
        .download(doc.file_path);
      if (downloadError) throw downloadError;

      const arrayBuffer = await fileData.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      const base64 = btoa(binary);

      const { data, error } = await supabase.functions.invoke('analyze-intervention-letter', {
        body: {
          documentId: doc.id,
          familyId,
          fileBytes: base64,
          mimeType: doc.mime_type,
        },
      });
      if (error) throw error;

      if (!opts.silent) {
        const boundariesCreated = data?.boundariesCreated ?? 0;
        const valuesCreated = data?.valuesCreated ?? 0;
        const goalsCreated = data?.goalsCreated ?? 0;
        const valuesProposed = data?.valuesProposed ?? 0;
        const goalsProposed = data?.goalsProposed ?? 0;
        const valuesSkipped = data?.valuesSkipped ?? 0;
        const skippedDueToLimit = (data?.valuesSkippedDueToExistingLimit ?? []).length;

        const created: string[] = [];
        if (boundariesCreated > 0) created.push(`${boundariesCreated} boundar${boundariesCreated === 1 ? 'y' : 'ies'}`);
        if (valuesCreated > 0) created.push(`${valuesCreated} guiding value${valuesCreated === 1 ? '' : 's'}`);
        if (goalsCreated > 0) created.push(`${goalsCreated} family support goal${goalsCreated === 1 ? '' : 's'}`);

        if (created.length > 0) {
          toast.success(`FIIS analysis: ${created.join(', ')} added for review`);
        } else if (valuesProposed > 0 || goalsProposed > 0 || valuesSkipped > 0 || skippedDueToLimit > 0) {
          toast.info('FIIS reviewed this letter — existing family values and goals were preserved.');
        } else {
          toast.info(data?.message || 'FIIS did not find clear boundaries, values, or goals in this document.');
        }
      }

      if (opts.refresh !== false) fetchDocuments();
      return { ok: true, data };
    } catch (err: any) {
      console.error('[FIIS] Error analyzing intervention letter', { docId: doc.id, message: err?.message });
      if (!opts.silent) toast.error(err?.message || 'Failed to analyze document');
      return { ok: false, error: err };
    }
  };

  const handleAnalyzeWithFiis = async (doc: FamilyDocument) => {
    setAnalyzingId(doc.id);
    try {
      await analyzeInterventionLetter(doc);
    } finally {
      setAnalyzingId(null);
    }
  };

  // Backfill: run FIIS over any intervention letters that haven't been analyzed yet.
  const runBackfill = async (silent = true) => {
    if (!canManage) return;
    const pending = documents.filter(
      (d) => d.document_type === 'intervention_letter' && !d.fiis_analyzed,
    );
    if (pending.length === 0) {
      if (!silent) toast.info('No intervention letters need FIIS analysis.');
      return;
    }

    setIsBackfilling(true);
    if (!silent) toast.info(`FIIS is analyzing ${pending.length} intervention letter${pending.length === 1 ? '' : 's'}…`);

    let ok = 0;
    let failed = 0;
    for (const doc of pending) {
      setAnalyzingId(doc.id);
      const result = await analyzeInterventionLetter(doc, { silent: true, refresh: false });
      if (result.ok) ok++; else failed++;
    }
    setAnalyzingId(null);
    setIsBackfilling(false);
    await fetchDocuments();

    if (!silent || failed > 0) {
      if (ok > 0 && failed === 0) {
        toast.success(`FIIS analyzed ${ok} intervention letter${ok === 1 ? '' : 's'}.`);
      } else if (ok > 0 && failed > 0) {
        toast.warning(`FIIS analyzed ${ok}; ${failed} could not be processed.`);
      } else if (failed > 0) {
        toast.error(`FIIS could not analyze ${failed} intervention letter${failed === 1 ? '' : 's'}.`);
      }
    }
  };

  // Auto-trigger backfill once per session for moderators when unanalyzed letters exist.
  useEffect(() => {
    if (isLoading || backfillTriggeredRef.current || !canManage) return;
    const hasPending = documents.some(
      (d) => d.document_type === 'intervention_letter' && !d.fiis_analyzed,
    );
    if (hasPending) {
      backfillTriggeredRef.current = true;
      runBackfill(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, documents, canManage]);

  const handleAnalyzeForAftercare = async (doc: FamilyDocument) => {
    if (doc.document_type !== 'discharge_plan' && doc.document_type !== 'aftercare_plan') {
      toast.error('Only discharge/aftercare plans can be analyzed');
      return;
    }

    setAnalyzingId(doc.id);
    try {
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('family-documents')
        .download(doc.file_path);

      if (downloadError) throw downloadError;

      const arrayBuffer = await fileData.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);

      const { data, error } = await supabase.functions.invoke('analyze-aftercare-document', {
        body: {
          documentId: doc.id,
          familyId: familyId,
          fileBytes: base64,
          mimeType: doc.mime_type,
          targetUserId: await (async () => {
            const { data: memberData } = await supabase
              .from('family_members')
              .select('user_id')
              .eq('family_id', familyId)
              .eq('role', 'recovering')
              .maybeSingle();
            return memberData?.user_id ?? null;
          })()
        }
      });

      if (error) throw error;

      if (data.recommendationsCreated > 0) {
        toast.success(`Created ${data.recommendationsCreated} aftercare items from the plan`);
      } else {
        toast.info('No aftercare recommendations found in this document');
      }

      fetchDocuments();
    } catch (err: any) {
      console.error('Error analyzing aftercare document:', err);
      toast.error(err.message || 'Failed to analyze document');
    } finally {
      setAnalyzingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {canManage && (
        <AIProcessingNotice subject="documents you upload or analyze here, including intervention letters and discharge plans" />
      )}

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
                    accept={DOCUMENT_UPLOAD_ACCEPT}
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
                      <p className="text-xs text-muted-foreground mt-1">{DOCUMENT_UPLOAD_HELPER_TEXT}</p>
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
                    💡 FIIS can analyze intervention letters to extract boundaries, family values, and family-support goals for review.
                  </p>
                )}
                {(uploadForm.document_type === 'discharge_plan' || uploadForm.document_type === 'aftercare_plan') && (
                  <p className="text-xs text-muted-foreground">
                    💡 Discharge/aftercare plans will be analyzed to auto-create aftercare items for tracking.
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
            const isAftercarePlan = doc.document_type === 'discharge_plan' || doc.document_type === 'aftercare_plan';
            
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
                              {isAftercarePlan
                                ? `${doc.boundaries_extracted} items`
                                : isInterventionLetter
                                  ? `FIIS analyzed • ${doc.boundaries_extracted} boundaries extracted`
                                  : `${doc.boundaries_extracted} items`}
                            </Badge>
                          )}
                          {isInterventionLetter && !doc.fiis_analyzed && (
                            <Badge variant="outline" className="text-xs">
                              Ready for FIIS analysis
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
                          onClick={() => handleAnalyzeWithFiis(doc)}
                          disabled={analyzingId === doc.id}
                          title="Analyze with FIIS — extract boundaries, values & goals"
                        >
                          {analyzingId === doc.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Brain className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      {isAftercarePlan && !doc.fiis_analyzed && canManage && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleAnalyzeForAftercare(doc)}
                          disabled={analyzingId === doc.id}
                          title="Analyze & Create Aftercare Items"
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
