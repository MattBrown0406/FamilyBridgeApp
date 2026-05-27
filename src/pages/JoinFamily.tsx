import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SEOHead } from "@/components/SEOHead";
import { Loader2, UserPlus, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import familyBridgeLogo from "@/assets/familybridge-logo.png";

/**
 * /join — minimal page for people who already have an invite code.
 *
 * Validates the code against family_invite_codes (and legacy families.invite_code)
 * and routes the user to /auth?mode=signup&familyInvite=XXXX where Auth.tsx
 * handles the rest of the join flow via the join-family edge function.
 *
 * This page deliberately bypasses /family-purchase so code-holders never see
 * a payment screen.
 */
const JoinFamily = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [inviteCode, setInviteCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  // Pre-fill from ?code=XXXX (used by legacy email redirects)
  useEffect(() => {
    const codeParam = searchParams.get("code") || searchParams.get("inviteCode");
    if (codeParam) {
      setInviteCode(codeParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleJoin = async () => {
    const code = inviteCode.trim().toLowerCase();
    if (!code) {
      toast.error("Please enter your invite code");
      return;
    }

    setIsValidating(true);
    try {
      // Check family_invite_codes table first (current schema)
      const { data: inviteData, error: inviteError } = await supabase
        .from("family_invite_codes")
        .select("family_id")
        .eq("invite_code", code)
        .maybeSingle();

      if (inviteError) throw inviteError;

      let familyId = inviteData?.family_id;

      // Fall back to legacy families.invite_code
      if (!familyId) {
        const { data: familyData, error: familyError } = await supabase
          .from("families")
          .select("id")
          .eq("invite_code", code)
          .maybeSingle();

        if (familyError) throw familyError;
        familyId = familyData?.id;
      }

      if (!familyId) {
        toast.error("That invite code isn't valid. Double-check with whoever sent it to you.");
        return;
      }

      toast.success("Code accepted. Create your account to join.");
      navigate(`/auth?mode=signup&familyInvite=${encodeURIComponent(code)}`);
    } catch (error) {
      console.error("Invite code validation error:", error);
      toast.error("Couldn't validate that code. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-hero p-3 sm:p-4">
      <SEOHead
        title="Join a Family — FamilyBridge"
        description="Have a FamilyBridge invite code? Enter it here to join your family group."
        canonicalPath="/join"
        noIndex={true}
      />
      <div className="w-full max-w-md animate-scale-in">
        <div className="text-center mb-5 sm:mb-8">
          <div
            className="flex items-center justify-center gap-2 cursor-pointer mb-3 sm:mb-4"
            onClick={() => navigate("/")}
          >
            <img src={familyBridgeLogo} alt="FamilyBridge" className="h-8 sm:h-10 w-auto object-contain" />
            <span className="text-xl sm:text-2xl font-display font-bold text-foreground">FamilyBridge</span>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">
            You've been invited to a family group
          </p>
        </div>

        <Card className="shadow-elevated border-0">
          <CardHeader className="space-y-1 pb-3 sm:pb-4 px-4 sm:px-6">
            <CardTitle className="text-xl sm:text-2xl font-display">Join with invite code</CardTitle>
            <CardDescription className="text-sm">
              Enter the 8-character code your family admin sent you.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inviteCode">Invite code</Label>
              <Input
                id="inviteCode"
                placeholder="e.g. 77a1948e"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleJoin();
                }}
                className="font-mono tracking-wider text-lg"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Codes are not case-sensitive.
              </p>
            </div>

            <Button
              onClick={handleJoin}
              disabled={isValidating || !inviteCode.trim()}
              className="w-full"
              size="lg"
            >
              {isValidating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              Continue
            </Button>

            <div className="pt-2 text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/auth")}
                className="text-sm text-muted-foreground"
              >
                Already have an account? Sign in
              </Button>
            </div>

            <div className="pt-1 text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="text-xs text-muted-foreground"
              >
                <ArrowLeft className="h-3 w-3 mr-1" />
                Back to home
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground px-4">
          Don't have a code? <button onClick={() => navigate("/family-purchase")} className="text-primary hover:underline">Start a new family group</button>.
        </p>
      </div>
    </div>
  );
};

export default JoinFamily;
