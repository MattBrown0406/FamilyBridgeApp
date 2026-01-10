import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { HIPAARelease } from '@/components/HIPAARelease';
import { Loader2 } from 'lucide-react';

const SignHIPAA = () => {
  const [searchParams] = useSearchParams();
  const familyId = searchParams.get('familyId');
  const familyName = searchParams.get('familyName') || 'Family Group';
  
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<{ full_name: string } | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      // Fetch user profile
      supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          setUserProfile(data);
        });
    }
  }, [user, loading, navigate]);

  if (loading || !user || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-hero">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!familyId) {
    navigate('/dashboard');
    return null;
  }

  const handleComplete = () => {
    navigate('/family-chat');
  };

  const handleCancel = () => {
    // If they cancel, they're still a member but haven't signed
    // They can sign later or leave the family
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen gradient-hero py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <HIPAARelease
          familyId={familyId}
          familyName={familyName}
          userId={user.id}
          userFullName={userProfile.full_name}
          onComplete={handleComplete}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
};

export default SignHIPAA;