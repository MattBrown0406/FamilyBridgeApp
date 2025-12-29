import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Heart, Plus, Users, LogOut, Loader2, Copy, ArrowRight } from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';

interface Family {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  role: string;
  member_count: number;
}

const Dashboard = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [families, setFamilies] = useState<Family[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [newFamilyDescription, setNewFamilyDescription] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchFamilies();
    }
  }, [user]);

  const fetchFamilies = async () => {
    try {
      const { data: memberData, error: memberError } = await supabase
        .from('family_members')
        .select(`
          role,
          family_id,
          families (
            id,
            name,
            description,
            invite_code
          )
        `)
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      const familiesWithCounts = await Promise.all(
        (memberData || []).map(async (member) => {
          const { count } = await supabase
            .from('family_members')
            .select('*', { count: 'exact', head: true })
            .eq('family_id', member.family_id);

          return {
            id: (member.families as any).id,
            name: (member.families as any).name,
            description: (member.families as any).description,
            invite_code: (member.families as any).invite_code,
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

  const handleCreateFamily = async () => {
    if (!user) {
      toast({
        title: 'Not signed in',
        description: 'Please sign in again to create a family group.',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    if (!newFamilyName.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a name for your family group.',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    try {
      // Create family via backend function (bypasses RLS safely)
      const { data, error } = await supabase.functions.invoke('create-family', {
        body: {
          name: newFamilyName.trim(),
          description: newFamilyDescription.trim() || null,
        },
      });

      if (error) throw error;

      const family = (data as any)?.family;
      if (!family?.id) {
        throw new Error('Failed to create family');
      }

      toast({
        title: 'Family created!',
        description: `${newFamilyName} has been created successfully.`,
      });

      setShowCreateDialog(false);
      setNewFamilyName('');
      setNewFamilyDescription('');
      fetchFamilies();
    } catch (error: any) {
      console.error('Error creating family:', error);
      toast({
        title: 'Error',
        description: 'Failed to create family group. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinFamily = async () => {
    if (!user) {
      toast({
        title: 'Not signed in',
        description: 'Please sign in again to join a family group.',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    if (!inviteCode.trim()) {
      toast({
        title: 'Code required',
        description: 'Please enter an invite code.',
        variant: 'destructive',
      });
      return;
    }

    setIsJoining(true);
    try {
      // Join family via backend function (allows invite-code lookup)
      const { data, error } = await supabase.functions.invoke('join-family', {
        body: {
          inviteCode: inviteCode.trim(),
        },
      });

      if (error) {
        const msg = (error as any)?.message || 'Failed to join family group.';
        if (msg.toLowerCase().includes('invalid invite code')) {
          toast({
            title: 'Invalid code',
            description: 'No family group found with this invite code.',
            variant: 'destructive',
          });
          return;
        }
        if (msg.toLowerCase().includes('already a member')) {
          toast({
            title: 'Already a member',
            description: 'You are already a member of this family group.',
            variant: 'destructive',
          });
          return;
        }
        throw error;
      }

      const family = (data as any)?.family;
      if (!family?.id) {
        throw new Error('Failed to join family');
      }

      toast({
        title: 'Joined successfully!',
        description: `You are now a member of ${family.name}.`,
      });

      setShowJoinDialog(false);
      setInviteCode('');
      fetchFamilies();
    } catch (error: any) {
      console.error('Error joining family:', error);
      toast({
        title: 'Error',
        description: 'Failed to join family group. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsJoining(false);
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

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-7 w-7 text-primary" />
              <span className="text-xl font-display font-semibold text-foreground">FamilyBridge</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="text-sm text-muted-foreground hidden sm:block">
                {user?.email}
              </span>
              <NotificationBell />
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">
              Your Family Groups
            </h1>
            <p className="text-muted-foreground">
              Manage your family communication and support networks.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button variant="hero" size="lg">
                  <Plus className="h-5 w-5" />
                  Create Family Group
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-display">Create Family Group</DialogTitle>
                  <DialogDescription>
                    Start a new family group and invite members to join.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="familyName">Family Name</Label>
                    <Input
                      id="familyName"
                      placeholder="e.g., The Smith Family"
                      value={newFamilyName}
                      onChange={(e) => setNewFamilyName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="familyDescription">Description (optional)</Label>
                    <Input
                      id="familyDescription"
                      placeholder="A brief description of your group"
                      value={newFamilyDescription}
                      onChange={(e) => setNewFamilyDescription(e.target.value)}
                    />
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={handleCreateFamily}
                    disabled={isCreating}
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Group'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="lg">
                  <Users className="h-5 w-5" />
                  Join with Code
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-display">Join Family Group</DialogTitle>
                  <DialogDescription>
                    Enter the invite code shared by a family member.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="inviteCode">Invite Code</Label>
                    <Input
                      id="inviteCode"
                      placeholder="e.g., abc12345"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                    />
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={handleJoinFamily}
                    disabled={isJoining}
                  >
                    {isJoining ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Joining...
                      </>
                    ) : (
                      'Join Group'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
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
                  Create a new family group or join one with an invite code.
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
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyInviteCode(family.invite_code);
                          }}
                          className="flex items-center gap-1 hover:text-primary transition-colors"
                        >
                          <Copy className="h-4 w-4" />
                          {family.invite_code}
                        </button>
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
