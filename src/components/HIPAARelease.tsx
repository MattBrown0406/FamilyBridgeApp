import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, FileText, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface HIPAAReleaseProps {
  familyId: string;
  familyName: string;
  userId: string;
  userFullName: string;
  onComplete: () => void;
  onCancel?: () => void;
}

export function HIPAARelease({ 
  familyId, 
  familyName, 
  userId, 
  userFullName, 
  onComplete,
  onCancel 
}: HIPAAReleaseProps) {
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
      const { error } = await supabase.rpc('sign_hipaa_release', {
        _family_id: familyId,
        _full_name: userFullName,
        _signature: signature.trim(),
        _user_agent: navigator.userAgent,
      });

      if (error) throw error;

      toast({
        title: 'HIPAA Release Signed',
        description: 'Thank you for signing the release. You may now continue.',
      });
      
      onComplete();
    } catch (error) {
      console.error('Error signing HIPAA release:', error);
      toast({
        title: 'Error',
        description: 'Failed to save your signature. Please try again.',
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
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <CardTitle className="text-xl">HIPAA Authorization for Release of Information</CardTitle>
        </div>
        <CardDescription>
          Required for joining provider-supervised family groups
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            This family group is supervised by a certified professional interventionist.
            If you choose to share treatment or recovery information with the moderator and family members,
            you may be asked to sign an authorization.
          </p>
        </div>

        <ScrollArea className="h-[300px] border rounded-lg p-4 bg-muted/30">
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-base">AUTHORIZATION FOR RELEASE OF PROTECTED HEALTH INFORMATION</h3>
            </div>

            <p><strong>Patient/Client Name:</strong> {userFullName}</p>
            <p><strong>Family Group:</strong> {familyName}</p>
            <p><strong>Date:</strong> {currentDate}</p>

            <div className="border-t pt-4 mt-4">
              <p className="font-semibold mb-2">I. PURPOSE OF DISCLOSURE</p>
              <p>
                I hereby authorize the disclosure and exchange of sensitive treatment and recovery information
                for the purpose of facilitating communication, support, and coordination within my family group
                on the FamilyBridge platform. This includes, but is not limited to:
              </p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Recovery status and progress you choose to share</li>
                <li>Meeting attendance and check-in information</li>
                <li>Treatment participation and progress updates</li>
                <li>Financial assistance requests related to recovery</li>
                <li>Location check-ins and safety status</li>
                <li>Communications shared within the family group</li>
              </ul>
            </div>

            <div className="border-t pt-4">
              <p className="font-semibold mb-2">II. PERSONS/ENTITIES AUTHORIZED TO RECEIVE INFORMATION</p>
              <p>I authorize the following to receive and share this information:</p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>The assigned Certified Professional Interventionist (Moderator)</li>
                <li>All current and future members of my designated family group</li>
                <li>FamilyBridge platform administrators (for technical support only)</li>
              </ul>
            </div>

            <div className="border-t pt-4">
              <p className="font-semibold mb-2">III. INFORMATION TO BE DISCLOSED</p>
              <p>
                This authorization covers all information shared through the FamilyBridge platform, 
                including but not limited to:
              </p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Messages sent in family group chat</li>
                <li>Check-in data (meetings, locations, appointments)</li>
                <li>Financial requests and related documentation</li>
                <li>Pattern analysis and recovery insights generated by the platform</li>
                <li>Any observations or notes logged by family members or moderators</li>
              </ul>
            </div>

            <div className="border-t pt-4">
              <p className="font-semibold mb-2">IV. DURATION AND EXPIRATION</p>
              <p>
                This authorization shall remain in effect for as long as I am a member of this 
                family group on FamilyBridge, or until I revoke it in writing. I understand that 
                I may revoke this authorization at any time by leaving the family group or by 
                submitting a written request to FamilyBridge support.
              </p>
            </div>

            <div className="border-t pt-4">
              <p className="font-semibold mb-2">V. PATIENT RIGHTS</p>
              <p>I understand that:</p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>I have the right to refuse to sign this authorization</li>
                <li>My refusal will not affect my ability to use FamilyBridge for non-provider-supervised groups</li>
                <li>I may revoke this authorization at any time, except to the extent that action has already been taken in reliance on it</li>
                <li>Information disclosed pursuant to this authorization may be subject to re-disclosure and may no longer be protected by HIPAA</li>
                <li>I may request a copy of this signed authorization</li>
              </ul>
            </div>

            <div className="border-t pt-4">
              <p className="font-semibold mb-2">VI. 42 CFR PART 2 NOTICE (For Substance Use Disorder Records)</p>
              <p>
                This information has been disclosed to you from records protected by Federal 
                confidentiality rules (42 CFR Part 2). The Federal rules prohibit you from making 
                any further disclosure of this information unless further disclosure is expressly 
                permitted by the written consent of the person to whom it pertains or as otherwise 
                permitted by 42 CFR Part 2. A general authorization for the release of medical or 
                other information is NOT sufficient for this purpose. The Federal rules restrict 
                any use of the information to criminally investigate or prosecute any alcohol or 
                drug abuse patient.
              </p>
            </div>
          </div>
        </ScrollArea>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signature">
              Electronic Signature <span className="text-destructive">*</span>
            </Label>
            <p className="text-xs text-muted-foreground">
              Type your full legal name exactly as it appears above to sign this authorization
            </p>
            <Input
              id="signature"
              placeholder="Type your full legal name"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              className="font-serif italic text-lg"
            />
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="agree"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked === true)}
            />
            <Label htmlFor="agree" className="text-sm font-normal leading-relaxed cursor-pointer">
              I have read and understand this Authorization for Release of Protected Health Information. 
              I am signing this document voluntarily and understand that my signature authorizes the 
              release of my health information as described above.
            </Label>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
          )}
          <Button 
            onClick={handleSubmit} 
            disabled={!signature.trim() || !agreed || isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? 'Signing...' : 'Sign & Continue'}
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          By clicking "Sign & Continue", you agree that your electronic signature is legally binding.
        </p>
      </CardContent>
    </Card>
  );
}