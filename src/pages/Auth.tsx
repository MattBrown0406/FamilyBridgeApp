import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Heart, Loader2, Fingerprint } from 'lucide-react';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Name must be at least 2 characters').optional(),
});

const Auth = () => {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';
  const familyInviteCode = searchParams.get('familyInvite');
  
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isJoiningFamily, setIsJoiningFamily] = useState(false);

  const { signIn, signUp, user, loading } = useAuth();
  const { 
    isAvailable: biometricAvailable, 
    hasStoredCredentials, 
    saveCredentials, 
    getCredentials,
    getBiometryLabel 
  } = useBiometricAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Join family after signup if invite code was provided
  const joinFamilyWithInviteCode = async (userId: string, inviteCode: string) => {
    setIsJoiningFamily(true);
    try {
      const { data, error } = await supabase.functions.invoke('join-family', {
        body: {
          inviteCode: inviteCode.trim(),
          relationshipType: 'other', // Default, can be updated later
        },
      });

      if (error) throw error;

      if (data?.family) {
        toast({
          title: 'Welcome to the family!',
          description: `You've joined ${data.family.name}. Redirecting to your family group...`,
        });
        // Navigate to the family chat
        navigate('/family-chat');
        return true;
      } else {
        throw new Error(data?.error || 'Failed to join family');
      }
    } catch (error) {
      console.error('Error joining family:', error);
      toast({
        title: 'Could not join family',
        description: 'The invite code may be invalid. You can try again from the dashboard.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsJoiningFamily(false);
    }
  };

  // Check if user is an organization member (moderator) and redirect accordingly
  const checkUserRoleAndRedirect = async (userId: string) => {
    // If we have a family invite code, try to join the family first
    if (familyInviteCode) {
      const joined = await joinFamilyWithInviteCode(userId, familyInviteCode);
      if (joined) return; // Already navigated to family chat
    }

    try {
      // Check if user is an organization member
      const { data: orgMemberships } = await supabase
        .from('organization_members')
        .select('id, role')
        .eq('user_id', userId);

      if (orgMemberships && orgMemberships.length > 0) {
        // User is an organization member - redirect to moderator dashboard
        navigate('/moderator-dashboard');
      } else {
        // Regular user - redirect to normal dashboard
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      navigate('/dashboard');
    }
  };

  useEffect(() => {
    if (!loading && user) {
      checkUserRoleAndRedirect(user.id);
    }
  }, [user, loading]);

  // Auto-trigger biometric login if available and has stored credentials
  useEffect(() => {
    if (!loading && !user && biometricAvailable && hasStoredCredentials && mode === 'signin') {
      handleBiometricLogin();
    }
  }, [loading, user, biometricAvailable, hasStoredCredentials, mode]);

  const validateForm = () => {
    try {
      if (mode === 'signup') {
        authSchema.parse({ email, password, fullName });
      } else {
        authSchema.omit({ fullName: true }).parse({ email, password });
      }
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach((error) => {
          if (error.path[0]) {
            newErrors[error.path[0] as string] = error.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleBiometricLogin = async () => {
    setIsLoading(true);
    try {
      const credentials = await getCredentials();
      if (credentials) {
        const { error } = await signIn(credentials.email, credentials.password);
        if (error) {
          toast({
            title: 'Sign in failed',
            description: 'Please sign in with your email and password.',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      console.error('Biometric login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: 'Account exists',
              description: 'This email is already registered. Please sign in instead.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Sign up failed',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          // Save credentials for biometric login
          if (biometricAvailable) {
            await saveCredentials(email, password);
            toast({
              title: 'Welcome to FamilyBridge!',
              description: `Account created. ${getBiometryLabel()} enabled for quick sign in.`,
            });
          } else {
            toast({
              title: 'Welcome to FamilyBridge!',
              description: 'Your account has been created successfully.',
            });
          }
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: 'Sign in failed',
            description: 'Invalid email or password. Please try again.',
            variant: 'destructive',
          });
        } else {
          // Save credentials for biometric login after successful sign in
          if (biometricAvailable && !hasStoredCredentials) {
            await saveCredentials(email, password);
            toast({
              title: 'Welcome back!',
              description: `${getBiometryLabel()} enabled for quick sign in.`,
            });
          }
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-hero">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center gradient-hero p-4">
      <div className="w-full max-w-md animate-scale-in">
        <div className="text-center mb-8">
          <div 
            className="flex items-center justify-center gap-2 cursor-pointer mb-4"
            onClick={() => navigate('/')}
          >
            <Heart className="h-10 w-10 text-primary" />
            <span className="text-2xl font-display font-bold text-foreground">FamilyBridge</span>
          </div>
          <p className="text-muted-foreground">
            {mode === 'signin' ? 'Welcome back' : familyInviteCode ? 'Create your account to join the family' : 'Start your recovery journey'}
          </p>
          {familyInviteCode && mode === 'signup' && (
            <p className="text-sm text-primary mt-2">
              You're joining with invite code: <span className="font-mono font-semibold">{familyInviteCode}</span>
            </p>
          )}
        </div>

        <Card className="shadow-elevated border-0">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-display">
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </CardTitle>
            <CardDescription>
              {mode === 'signin'
                ? 'Enter your credentials to access your family groups'
                : 'Create an account to connect with your family'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Biometric Login Button */}
            {mode === 'signin' && biometricAvailable && hasStoredCredentials && (
              <div className="mb-6">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  size="lg"
                  onClick={handleBiometricLogin}
                  disabled={isLoading}
                >
                  <Fingerprint className="h-5 w-5 mr-2" />
                  Sign in with {getBiometryLabel()}
                </Button>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Smith"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={errors.fullName ? 'border-destructive' : ''}
                  />
                  {errors.fullName && (
                    <p className="text-sm text-destructive">{errors.fullName}</p>
                  )}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={errors.password ? 'border-destructive' : ''}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isLoading || isJoiningFamily}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
                  </>
                ) : isJoiningFamily ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Joining family...
                  </>
                ) : (
                  mode === 'signin' ? 'Sign In' : familyInviteCode ? 'Create Account & Join Family' : 'Create Account'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'signin' ? 'signup' : 'signin');
                  setErrors({});
                }}
                className="text-sm text-primary hover:underline"
              >
                {mode === 'signin'
                  ? "Don't have an account? Sign up"
                  : 'Already have an account? Sign in'}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
