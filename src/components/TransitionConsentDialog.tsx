import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle, FileText, Shield, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TransitionConsentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transitionSummaryId: string;
  organizationId: string;
  organizationName: string;
  patientName: string;
  onSuccess?: () => void;
}

export function TransitionConsentDialog({
  open,
  onOpenChange,
  transitionSummaryId,
  organizationId,
  organizationName,
  patientName,
  onSuccess,
}: TransitionConsentDialogProps) {
  const [signature, setSignature] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!signature.trim() || !agreed) {
      toast({
        title: 'Please complete the form',
        description: 'You must type your full name and agree to the terms.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Use secure RPC function that encrypts signature server-side
      const { error } = await supabase.rpc('sign_transition_consent', {
        _transition_summary_id: transitionSummaryId,
        _organization_id: organizationId,
        _full_name: patientName,
        _signature_data: signature.trim(),
        _notes: null,
      });

      if (error) throw error;

      toast({
        title: 'Consent Signed Successfully',
        description: `Your transition summary will now be shared with ${organizationName}.`,
      });

      setSignature('');
      setAgreed(false);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error signing consent:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save your consent. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <DialogTitle className="text-xl">
              Authorization to Share Transition Summary
            </DialogTitle>
          </div>
          <DialogDescription>
            HIPAA-compliant consent for sharing your care transition information
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Receiving Organization Info */}
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 flex gap-3">
            <Building2 className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Receiving Organization
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {organizationName}
              </p>
            </div>
          </div>

          {/* Warning */}
          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              By signing below, you authorize the sharing of your transition summary—including 
              treatment progress, medications, and care recommendations—with the receiving organization.
            </p>
          </div>

          {/* Consent Document */}
          <ScrollArea className="flex-1 border rounded-lg p-4 bg-muted/30 min-h-[200px]">
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-base">
                  AUTHORIZATION FOR RELEASE OF TRANSITION CARE INFORMATION
                </h3>
              </div>

              <p><strong>Patient Name:</strong> {patientName}</p>
              <p><strong>Receiving Organization:</strong> {organizationName}</p>
              <p><strong>Date:</strong> {currentDate}</p>

              <div className="border-t pt-4 mt-4">
                <p className="font-semibold mb-2">I. PURPOSE OF DISCLOSURE</p>
                <p>
                  I hereby authorize the disclosure of my transition care summary to the receiving 
                  organization for the purpose of continuity of care. This includes:
                </p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>Treatment progress and phase transition details</li>
                  <li>Sobriety status and recovery milestones</li>
                  <li>Strengths identified and areas for continued focus</li>
                  <li>Risk factors and protective factors</li>
                  <li>Aftercare recommendations</li>
                  <li>Medication notes (non-prescription details)</li>
                  <li>Support system information</li>
                  <li>Transition readiness assessment</li>
                </ul>
              </div>

              <div className="border-t pt-4">
                <p className="font-semibold mb-2">II. AUTHORIZED RECIPIENT</p>
                <p>
                  I authorize the disclosure of my transition summary to:
                </p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li><strong>{organizationName}</strong> and its authorized staff members</li>
                  <li>Care coordinators and treatment professionals at the receiving facility</li>
                </ul>
              </div>

              <div className="border-t pt-4">
                <p className="font-semibold mb-2">III. DURATION AND REVOCATION</p>
                <p>
                  This authorization shall remain in effect until I revoke it in writing. I understand 
                  that I may revoke this authorization at any time through the FamilyBridge platform. 
                  Revocation will not affect information already disclosed.
                </p>
              </div>

              <div className="border-t pt-4">
                <p className="font-semibold mb-2">IV. PATIENT RIGHTS</p>
                <p>I understand that:</p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>I have the right to refuse to sign this authorization</li>
                  <li>My refusal will not affect my treatment or care</li>
                  <li>I may revoke this consent at any time</li>
                  <li>Information disclosed may be subject to re-disclosure</li>
                  <li>I may request a copy of this signed authorization</li>
                </ul>
              </div>

              <div className="border-t pt-4">
                <p className="font-semibold mb-2">V. 42 CFR PART 2 NOTICE</p>
                <p>
                  This information has been disclosed from records protected by Federal 
                  confidentiality rules (42 CFR Part 2). The Federal rules prohibit further 
                  disclosure without express written consent. A general authorization for 
                  release of medical information is NOT sufficient. The Federal rules restrict 
                  use of this information to criminally investigate or prosecute any alcohol 
                  or drug abuse patient.
                </p>
              </div>
            </div>
          </ScrollArea>

          {/* Signature Section */}
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="consent-signature">
                Electronic Signature <span className="text-destructive">*</span>
              </Label>
              <p className="text-xs text-muted-foreground">
                Type your full legal name to sign this authorization
              </p>
              <Input
                id="consent-signature"
                placeholder="Type your full legal name"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                className="font-serif italic text-lg"
              />
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="consent-agree"
                checked={agreed}
                onCheckedChange={(checked) => setAgreed(checked === true)}
              />
              <Label htmlFor="consent-agree" className="text-sm font-normal leading-relaxed cursor-pointer">
                I have read and understand this Authorization. I am signing voluntarily and 
                authorize the release of my transition care information to {organizationName}.
              </Label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!signature.trim() || !agreed || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Signing...' : 'Sign & Authorize'}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            By clicking "Sign & Authorize", you agree that your electronic signature is legally binding.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
