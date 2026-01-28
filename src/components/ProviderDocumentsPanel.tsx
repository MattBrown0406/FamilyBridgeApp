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
import { toast } from '@/components/ui/use-toast';
import {
  Upload,
  FileText,
  Download,
  Trash2,
  Loader2,
  File,
  FileImage,
  Filter,
  Plus,
  Eye,
  Shield,
  Users,
} from 'lucide-react';
import { format } from 'date-fns';

interface ProviderDocument {
  id: string;
  organization_id: string;
  family_id: string | null;
  uploaded_by: string;
  title: string;
  description: string | null;
  document_type: string;
  file_path: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
  uploader_name?: string;
  family_name?: string;
}

interface Family {
  id: string;
  name: string;
  organization_id: string | null;
}

interface ProviderDocumentsPanelProps {
  organizationId: string;
  families: Family[];
}

const documentTypeLabels: Record<string, string> = {
  intervention_letter: 'Intervention Letter',
  treatment_plan: 'Treatment Plan',
  clinical_summary: 'Clinical Summary',
  consent_form: 'Consent Form',
  discharge_summary: 'Discharge Summary',
  assessment: 'Assessment',
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

export const ProviderDocumentsPanel = ({ organizationId, families }: ProviderDocumentsPanelProps) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [documents, setDocuments] = useState<ProviderDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  
  // Filter state
  const [filterType, setFilterType] = useState<string>('all');
  const [filterFamily, setFilterFamily] = useState<string>('all');
  
  // Upload form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    document_type: 'intervention_letter',
    family_id: '',
  });

  useEffect(() => {
    if (organizationId) {
      fetchDocuments();
    }
  }, [organizationId]);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('provider_documents')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      if (data && data.length > 0) {
        const uploaderIds = [...new Set(data.map(d => d.uploaded_by))];
        const profiles = await fetchProfilesByIds(uploaderIds);
        
        const docsWithNames = data.map(doc => ({
          ...doc,
          uploader_name: profiles.find(p => p.id === doc.uploaded_by)?.full_name || 'Unknown',
          family_name: families.find(f => f.id === doc.family_id)?.name || 'Organization-wide',
        }));
        setDocuments(docsWithNames);
      } else {
        setDocuments([]);
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
      toast({ title: 'Error', description: 'Failed to load documents', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Max 20MB
      if (file.size > 20 * 1024 * 1024) {
        toast({ title: 'File too large', description: 'Maximum file size is 20MB', variant: 'destructive' });
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
      toast({ title: 'Error', description: 'Please select a file and provide a title', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    try {
      // Upload file to storage
      const fileExt = selectedFile.name.split('.').pop();
      const filePath = `${organizationId}/${crypto.randomUUID()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('provider-documents')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Create document record
      const { error: dbError } = await supabase
        .from('provider_documents')
        .insert({
          organization_id: organizationId,
          family_id: uploadForm.family_id || null,
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

      toast({ title: 'Success', description: 'Document uploaded successfully' });
      setIsUploadDialogOpen(false);
      setSelectedFile(null);
      setUploadForm({
        title: '',
        description: '',
        document_type: 'intervention_letter',
        family_id: '',
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchDocuments();
    } catch (err: any) {
      console.error('Error uploading document:', err);
      toast({ title: 'Error', description: err.message || 'Failed to upload document', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (doc: ProviderDocument) => {
    // Check if this is a HIPAA release (virtual file - cannot be downloaded directly)
    if (doc.file_path.startsWith('hipaa_releases/')) {
      toast({ 
        title: 'HIPAA Release', 
        description: 'HIPAA releases are stored securely and cannot be downloaded directly. Contact support if you need a copy.',
      });
      return;
    }
    
    setDownloadingId(doc.id);
    try {
      const { data, error } = await supabase.storage
        .from('provider-documents')
        .download(doc.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error downloading document:', err);
      toast({ title: 'Error', description: 'Failed to download document', variant: 'destructive' });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleView = async (doc: ProviderDocument) => {
    // Check if this is a HIPAA release (virtual file)
    if (doc.file_path.startsWith('hipaa_releases/')) {
      toast({ 
        title: 'HIPAA Release', 
        description: 'This is a signed HIPAA release. The signature is encrypted and stored securely.',
      });
      return;
    }
    
    try {
      const { data, error } = await supabase.storage
        .from('provider-documents')
        .createSignedUrl(doc.file_path, 3600); // 1 hour expiry

      if (error) throw error;
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (err: any) {
      console.error('Error viewing document:', err);
      toast({ title: 'Error', description: 'Failed to open document', variant: 'destructive' });
    }
  };

  const handleDelete = async (docId: string, filePath: string) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('provider-documents')
        .remove([filePath]);

      if (storageError) console.warn('Storage delete error:', storageError);

      // Delete from database
      const { error: dbError } = await supabase
        .from('provider_documents')
        .delete()
        .eq('id', docId);

      if (dbError) throw dbError;

      toast({ title: 'Deleted', description: 'Document has been removed' });
      fetchDocuments();
    } catch (err: any) {
      console.error('Error deleting document:', err);
      toast({ title: 'Error', description: 'Failed to delete document', variant: 'destructive' });
    }
  };

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    if (filterType !== 'all' && doc.document_type !== filterType) return false;
    if (filterFamily !== 'all') {
      if (filterFamily === 'org-wide' && doc.family_id) return false;
      if (filterFamily !== 'org-wide' && doc.family_id !== filterFamily) return false;
    }
    return true;
  });

  // Group documents by family
  const groupedDocuments = filteredDocuments.reduce((acc, doc) => {
    const groupKey = doc.family_id || 'org-wide';
    const groupName = doc.family_name || 'Organization-wide';
    if (!acc[groupKey]) {
      acc[groupKey] = { name: groupName, documents: [] };
    }
    acc[groupKey].documents.push(doc);
    return acc;
  }, {} as Record<string, { name: string; documents: ProviderDocument[] }>);

  // Sort groups: org-wide first, then alphabetically by family name
  const sortedGroups = Object.entries(groupedDocuments).sort(([keyA, groupA], [keyB, groupB]) => {
    if (keyA === 'org-wide') return -1;
    if (keyB === 'org-wide') return 1;
    return groupA.name.localeCompare(groupB.name);
  });

  // Check if document is a HIPAA release (virtual file)
  const isHipaaRelease = (doc: ProviderDocument) => doc.file_path.startsWith('hipaa_releases/');

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[160px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {Object.entries(documentTypeLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {families.length > 1 && (
            <Select value={filterFamily} onValueChange={setFilterFamily}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All families" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All families</SelectItem>
                <SelectItem value="org-wide">Org-wide only</SelectItem>
                {families.map(f => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
              <DialogDescription>
                Upload intervention letters, treatment plans, or other clinical documents.
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

              <div className="grid grid-cols-2 gap-4">
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
                </div>

                <div className="space-y-2">
                  <Label>Family (Optional)</Label>
                  <Select 
                    value={uploadForm.family_id} 
                    onValueChange={(v) => setUploadForm(prev => ({ ...prev, family_id: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Organization-wide" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Organization-wide</SelectItem>
                      {families.map(f => (
                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description (Optional)</Label>
                <Textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this document..."
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
      ) : filteredDocuments.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No documents yet</h3>
            <p className="text-muted-foreground mb-4">Upload intervention letters, treatment plans, and other clinical documents.</p>
            <Button onClick={() => setIsUploadDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload First Document
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {sortedGroups.map(([groupKey, group]) => (
            <div key={groupKey} className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Users className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium text-sm text-muted-foreground">{group.name}</h3>
                <Badge variant="secondary" className="text-xs">{group.documents.length}</Badge>
              </div>
              
              <div className="space-y-3">
                {group.documents.map(doc => {
                  const isHipaa = isHipaaRelease(doc);
                  const FileIcon = isHipaa ? Shield : getFileIcon(doc.mime_type);
                  
                  return (
                    <Card key={doc.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isHipaa ? 'bg-accent' : 'bg-primary/10'}`}>
                              <FileIcon className={`h-5 w-5 ${isHipaa ? 'text-accent-foreground' : 'text-primary'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate">{doc.title}</h4>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <Badge variant={isHipaa ? 'default' : 'outline'} className="text-xs">
                                  {documentTypeLabels[doc.document_type] || doc.document_type}
                                </Badge>
                                {!isHipaa && doc.file_size && (
                                  <span className="text-xs text-muted-foreground">
                                    {formatFileSize(doc.file_size)}
                                  </span>
                                )}
                                {isHipaa && (
                                  <span className="text-xs text-primary font-medium">
                                    Signed & Encrypted
                                  </span>
                                )}
                              </div>
                              {doc.description && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{doc.description}</p>
                              )}
                              <p className="text-xs text-muted-foreground mt-2">
                                {isHipaa ? 'Signed' : 'Uploaded'} by {doc.uploader_name} • {format(new Date(doc.created_at), 'MMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button variant="ghost" size="icon" onClick={() => handleView(doc)} title={isHipaa ? "View Info" : "View"}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {!isHipaa && (
                              <>
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
                                        onClick={() => handleDelete(doc.id, doc.file_path)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
