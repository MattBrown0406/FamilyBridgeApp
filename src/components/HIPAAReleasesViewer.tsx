import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, FileText, CheckCircle2, User } from 'lucide-react';
import { format } from 'date-fns';

interface HIPAARelease {
  id: string;
  user_id: string;
  full_name: string;
  signed_at: string;
  signature_data: string;
  release_version: string;
}

interface HIPAAReleasesViewerProps {
  familyId: string;
}

export function HIPAAReleasesViewer({ familyId }: HIPAAReleasesViewerProps) {
  const [releases, setReleases] = useState<HIPAARelease[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReleases = async () => {
      try {
        const { data, error } = await supabase
          .from('hipaa_releases')
          .select('*')
          .eq('family_id', familyId)
          .order('signed_at', { ascending: false });

        if (error) throw error;
        setReleases(data || []);
      } catch (error) {
        console.error('Error fetching HIPAA releases:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReleases();
  }, [familyId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (releases.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No HIPAA releases have been signed yet.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Releases will appear here as family members join the group.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5" />
          Signed HIPAA Releases
        </CardTitle>
        <CardDescription>
          {releases.length} family member{releases.length !== 1 ? 's' : ''} have signed the HIPAA release
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {releases.map((release) => (
              <div
                key={release.id}
                className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{release.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Signed: {format(new Date(release.signed_at), 'MMM d, yyyy \'at\' h:mm a')}
                      </p>
                      <p className="text-sm text-muted-foreground font-serif italic mt-1">
                        Signature: "{release.signature_data}"
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    v{release.release_version}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}