import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Loader2, Lock, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ReauthenticationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (accessToken: string) => void;
  title?: string;
  description?: string;
}

export function ReauthenticationDialog({
  open,
  onOpenChange,
  onSuccess,
  title = "Verify Your Identity",
  description = "This information contains sensitive medical records. Please re-enter your password to continue.",
}: ReauthenticationDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  const handleVerify = async () => {
    if (!user?.email || !password.trim()) {
      setError("Please enter your password");
      return;
    }

    if (attempts >= 3) {
      setError("Too many failed attempts. Please try again later.");
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      // Re-authenticate the user with their password
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password,
      });

      if (authError) {
        setAttempts(prev => prev + 1);
        if (authError.message.includes("Invalid login credentials")) {
          setError("Incorrect password. Please try again.");
        } else {
          setError(authError.message);
        }
        return;
      }

      if (data.session?.access_token) {
        // Generate a short-lived access token for sensitive data
        const { data: tokenData, error: tokenError } = await supabase.functions.invoke(
          "generate-sensitive-access-token",
          {
            body: { purpose: "transition_summaries" },
          }
        );

        if (tokenError) {
          throw tokenError;
        }

        toast({
          title: "Identity Verified",
          description: "You now have temporary access to view this information.",
        });

        setPassword("");
        setAttempts(0);
        onOpenChange(false);
        onSuccess(tokenData.token);
      }
    } catch (error) {
      console.error("Re-authentication error:", error);
      setError("Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClose = () => {
    setPassword("");
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
            <Lock className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700 dark:text-amber-400 text-sm">
              This additional verification protects sensitive medical information from unauthorized access.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="reauthPassword">Password</Label>
            <Input
              id="reauthPassword"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleVerify();
                }
              }}
              disabled={isVerifying || attempts >= 3}
            />
            {user?.email && (
              <p className="text-xs text-muted-foreground">
                Verifying as: {user.email}
              </p>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {attempts >= 3 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Too many failed attempts. For security, please wait a few minutes before trying again.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isVerifying}>
            Cancel
          </Button>
          <Button 
            onClick={handleVerify} 
            disabled={isVerifying || !password.trim() || attempts >= 3}
          >
            {isVerifying ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Verify & Continue
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
