import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePlatform } from "@/hooks/usePlatform";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Users, Loader2, Check } from "lucide-react";
import { BrandedHeader } from "@/components/BrandedHeader";

type RelationshipType = 
  | 'recovering'
  | 'parent'
  | 'spouse_partner'
  | 'sibling'
  | 'child'
  | 'grandparent'
  | 'aunt_uncle'
  | 'cousin'
  | 'friend'
  | 'other';

interface FamilyMember {
  id: string;
  name: string;
  email: string;
  relationship: RelationshipType | '';
}

const RELATIONSHIP_OPTIONS: { value: RelationshipType; label: string }[] = [
  { value: 'recovering', label: 'Person in Recovery' },
  { value: 'parent', label: 'Parent' },
  { value: 'spouse_partner', label: 'Spouse/Partner' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'child', label: 'Child' },
  { value: 'grandparent', label: 'Grandparent' },
  { value: 'aunt_uncle', label: 'Aunt/Uncle' },
  { value: 'cousin', label: 'Cousin' },
  { value: 'friend', label: 'Friend' },
  { value: 'other', label: 'Other' },
];

const FamilySetup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isNative, isIOS } = usePlatform();
  const paymentsWebOnly = isNative && isIOS;
  const [searchParams] = useSearchParams();
  
  const [inviteCode, setInviteCode] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [familyDescription, setFamilyDescription] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [members, setMembers] = useState<FamilyMember[]>([
    { id: crypto.randomUUID(), name: "", email: "", relationship: "" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Auto-fill invite code from URL parameters
  useEffect(() => {
    const codeParam = searchParams.get('code');
    if (codeParam && !inviteCode) {
      setInviteCode(codeParam);
    }
  }, [searchParams, inviteCode]);

  const addMember = () => {
    setMembers([...members, { id: crypto.randomUUID(), name: "", email: "", relationship: "" }]);
  };

  const removeMember = (id: string) => {
    if (members.length > 1) {
      setMembers(members.filter(m => m.id !== id));
    }
  };

  const updateMember = (id: string, field: keyof FamilyMember, value: string) => {
    setMembers(members.map(m => 
      m.id === id ? { ...m, [field]: value } : m
    ));
  };

  const validateForm = () => {
    if (!inviteCode.trim()) {
      toast.error("Please enter your invite code");
      return false;
    }
    if (!familyName.trim()) {
      toast.error("Please enter a family group name");
      return false;
    }
    if (!adminName.trim()) {
      toast.error("Please enter your name");
      return false;
    }
    if (!adminEmail.trim() || !adminEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return false;
    }
    
    const validMembers = members.filter(m => m.name.trim() && m.email.trim() && m.relationship);
    if (validMembers.length === 0) {
      toast.error("Please add at least one family member");
      return false;
    }

    for (const member of validMembers) {
      if (!member.email.includes("@")) {
        toast.error(`Invalid email address for ${member.name}`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const validMembers = members.filter(m => m.name.trim() && m.email.trim() && m.relationship);
      
      const { data, error } = await supabase.functions.invoke("create-family-group", {
        body: {
          inviteCode: inviteCode.trim(),
          familyName: familyName.trim(),
          familyDescription: familyDescription.trim(),
          adminName: adminName.trim(),
          adminEmail: adminEmail.trim(),
          members: validMembers.map(m => ({
            name: m.name.trim(),
            email: m.email.trim(),
            relationship: m.relationship,
          })),
        },
      });

      if (error) throw error;

      if (data.success) {
        setIsComplete(true);
        toast.success("Family group created! Invitations have been sent.");
      } else {
        throw new Error(data.error || "Failed to create family group");
      }
    } catch (error) {
      console.error("Create family error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create family group");
    } finally {
      setIsLoading(false);
    }
  };

  if (isComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Family Group Created!</CardTitle>
            <CardDescription>
              All family members have been sent invitation emails
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Each family member will receive an email with instructions on how to join your family group.
            </p>
            <div className="space-y-2">
              <Button onClick={() => navigate("/auth")} className="w-full">
                Sign In to Access Your Family
              </Button>
              <Button variant="outline" onClick={() => navigate("/")} className="w-full">
                Return Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <BrandedHeader />
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Set Up Your Family Group</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Enter your invite code and add your family members
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Family Information
              </CardTitle>
              <CardDescription>
                Start by entering your invite code
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Invite Code */}
              <div className="space-y-2">
                <Label htmlFor="inviteCode">Invite Code *</Label>
                <Input
                  id="inviteCode"
                  placeholder="Enter your invite code (e.g., ABC1-DEF2-GHI3)"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  This is the code you received when your account was set up
                </p>
              </div>

              {/* Admin Info */}
              <div className="border rounded-lg p-4 bg-muted/30 space-y-4">
                <div>
                  <Label className="text-sm font-medium">Your Information (Family Admin)</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    You'll be the administrator for this family group
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="adminName" className="text-xs">Your Name *</Label>
                    <Input
                      id="adminName"
                      placeholder="Your full name"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="adminEmail" className="text-xs">Your Email *</Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      placeholder="your.email@example.com"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Family Name */}
              <div className="space-y-2">
                <Label htmlFor="familyName">Family Group Name *</Label>
                <Input
                  id="familyName"
                  placeholder="e.g., The Smith Family"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                />
              </div>

              {/* Family Description */}
              <div className="space-y-2">
                <Label htmlFor="familyDescription">Description (Optional)</Label>
                <Input
                  id="familyDescription"
                  placeholder="A brief description of your family group"
                  value={familyDescription}
                  onChange={(e) => setFamilyDescription(e.target.value)}
                />
              </div>

              {/* Family Members */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Family Members</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addMember}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Member
                  </Button>
                </div>

                <div className="space-y-4">
                  {members.map((member, index) => (
                    <div key={member.id} className="border rounded-lg p-3 sm:p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Member {index + 1}</span>
                        {members.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMember(member.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Name</Label>
                          <Input
                            placeholder="Full name"
                            value={member.name}
                            onChange={(e) => updateMember(member.id, "name", e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Email</Label>
                          <Input
                            type="email"
                            placeholder="email@example.com"
                            value={member.email}
                            onChange={(e) => updateMember(member.id, "email", e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Relationship</Label>
                          <Select
                            value={member.relationship}
                            onValueChange={(value) => updateMember(member.id, "relationship", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              {RELATIONSHIP_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating Family Group...
                  </>
                ) : (
                  "Create Family Group & Send Invitations"
                )}
              </Button>
            </CardContent>
          </Card>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an invite code?{" "}
              <Button variant="link" onClick={() => navigate(paymentsWebOnly ? "/auth" : "/family-purchase")} className="p-0 h-auto">
                Set up an account
              </Button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FamilySetup;
