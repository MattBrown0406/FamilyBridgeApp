import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProviderAdmin } from '@/hooks/useProviderAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Users, LogOut, Loader2, Copy, ArrowRight, Crown, Home, Settings, Trash2, HelpCircle } from 'lucide-react';
import familyBridgeLogo from '@/assets/familybridge-logo.png';
import { NotificationBell } from '@/components/NotificationBell';
import { AdminBreadcrumbs } from '@/components/AdminBreadcrumbs';
import { ArchivedFamilyNotice } from '@/components/ArchivedFamilyNotice';
import { PaymentFailurePopup } from '@/components/PaymentFailurePopup';
import { usePaymentStatus } from '@/hooks/usePaymentStatus';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';


interface Family {
  id: string;
  name: string;
  description: string | null;
  invite_code: string | null;
  role: string;
  member_count: number;
  account_number: string;
}

const Dashboard = () => {
  const { user, signOut, loading } = useAuth();
  const { isProvider, isLoading: isProviderLoading } = useProviderAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    showPaymentPopup, 
    selectedIssue, 
    setShowPaymentPopup, 
    getGracePeriodRemaining 
  } = usePaymentStatus();
  
  const [families, setFamilies] = useState<Family[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Redirect provider admins/moderators to the moderator dashboard
  useEffect(() => {
    if (!isProviderLoading && isProvider) {
      navigate('/moderator-dashboard', { replace: true });
    }
  }, [isProvider, isProviderLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchFamilies();
    }
  }, [user]);

  const fetchFamilies = async () => {
    try {
      // Fetch only active (non-archived) families
      const { data: memberData, error: memberError } = await supabase
        .from('family_members')
        .select(`
          role,
          family_id,
          families!inner (
            id,
            name,
            description,
            is_archived,
            account_number
          )
        `)
        .eq('user_id', user.id)
        .eq('families.is_archived', false);

      if (memberError) throw memberError;

      const familiesWithCounts = await Promise.all(
        (memberData || []).map(async (member) => {
          const { count } = await supabase
            .from('family_members')
            .select('*', { count: 'exact', head: true })
            .eq('family_id', member.family_id);

          // Fetch invite code if user is a moderator or admin
          let inviteCode: string | null = null;
          if (member.role === 'moderator' || member.role === 'admin') {
            const { data: codeData } = await supabase
              .rpc('get_family_invite_code', { _family_id: member.family_id });
            inviteCode = codeData;
          }

          return {
            id: (member.families as any).id,
            name: (member.families as any).name,
            description: (member.families as any).description,
            account_number: (member.families as any).account_number,
            invite_code: inviteCode,
            role: member.role,
            member_count: count || 0,
          };
        })
      );

      setFamilies(familiesWithCounts);
    } catch (error) {
      console.error('Error fetching families:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your family groups.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Copied!',
      description: 'Invite code copied to clipboard.',
    });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      // Delete user's family memberships
      const { error: memberError } = await supabase
        .from('family_members')
        .delete()
        .eq('user_id', user!.id);

      if (memberError) throw memberError;

      // Delete user's profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user!.id);

      if (profileError) throw profileError;

      // Delete user's notifications
      const { error: notifError } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user!.id);

      if (notifError) throw notifError;

      // Delete user's payment info
      const { error: paymentError } = await supabase
        .from('payment_info')
        .delete()
        .eq('user_id', user!.id);

      if (paymentError) throw paymentError;

      // Sign out the user (the auth.users record will remain but user data is deleted)
      await signOut();
      
      toast({
        title: 'Account Deleted',
        description: 'Your account data has been successfully deleted.',
      });
      
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete account. Please contact support.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (loading || isLoading || isProviderLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Don't render if provider (they will be redirected)
  if (isProvider) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Payment Failure Popup */}
      <PaymentFailurePopup
        open={showPaymentPopup}
        onOpenChange={setShowPaymentPopup}
        paymentIssue={selectedIssue}
        gracePeriodRemaining={selectedIssue ? getGracePeriodRemaining(selectedIssue) : null}
      />
      {/* Admin Breadcrumbs for super admins and provider admins */}
      <AdminBreadcrumbs />
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-1.5 sm:gap-2 cursor-pointer" onClick={() => navigate('/')}>
                <img src={familyBridgeLogo} alt="FamilyBridge" className="h-6 sm:h-7 w-auto object-contain" />
                <span className="text-lg sm:text-xl font-display font-semibold text-foreground hidden xs:inline">FamilyBridge</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Home</span>
              </Button>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="text-sm text-muted-foreground hidden sm:block">
                {user?.email}
              </span>
              <Button variant="ghost" size="sm" onClick={() => navigate('/subscription')}>
                <Crown className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Premium</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  const firstFamily = families[0];
                  const params = new URLSearchParams({ type: 'family' });
                  if (firstFamily?.account_number) params.set('account', firstFamily.account_number);
                  navigate(`/support?${params.toString()}`);
                }}
              >
                <HelpCircle className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Support</span>
              </Button>
              <NotificationBell />
              
              {/* Settings Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                    <span className="hidden sm:inline ml-2">Settings</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Your Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account data, 
              including your profile, family memberships, and all associated information.
              {'\n\n'}
              If you have an active subscription, please cancel it through your App Store or 
              Google Play settings before deleting your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete Account'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-1 sm:mb-2">
              Your Family Groups
            </h1>
            <p className="text-muted-foreground">
              Manage your family communication and support networks.
            </p>
          </div>

          {/* Archived Family Notice - shows if user has archived families */}
          <div className="mb-6">
            <ArchivedFamilyNotice />
          </div>

          {/* Family Groups List */}
          {families.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No Family Groups Yet
                </h3>
                <p className="text-muted-foreground mb-6">
                  You haven't been added to a family group yet. Ask a family member to share an invite link with you.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {families.map((family) => (
                <Card 
                  key={family.id} 
                  className="hover:shadow-elevated transition-shadow cursor-pointer"
                  onClick={() => navigate(`/family/${family.id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="font-display text-xl">{family.name}</CardTitle>
                        {family.description && (
                          <CardDescription className="mt-1">{family.description}</CardDescription>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        family.role === 'moderator' 
                          ? 'bg-primary/10 text-primary' 
                          : family.role === 'recovering'
                          ? 'bg-accent/10 text-accent'
                          : 'bg-secondary text-secondary-foreground'
                      }`}>
                        {family.role}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {family.member_count} members
                        </span>
                        {family.invite_code && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyInviteCode(family.invite_code!);
                            }}
                            className="flex items-center gap-1 hover:text-primary transition-colors"
                          >
                            <Copy className="h-4 w-4" />
                            {family.invite_code}
                          </button>
                        )}
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
