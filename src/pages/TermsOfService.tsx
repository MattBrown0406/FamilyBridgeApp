import { BrandedHeader } from "@/components/BrandedHeader";
import { BrandedFooter } from "@/components/BrandedFooter";
import { Card, CardContent } from "@/components/ui/card";
import { SEOHead, createBreadcrumbSchema } from "@/components/SEOHead";
import PublicCrisisHelp from "@/components/PublicCrisisHelp";

const TermsOfService = () => {
  const breadcrumbSchema = createBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Terms of Service', url: '/terms' },
  ]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Terms of Service — FamilyBridge"
        description="FamilyBridge terms of service."
        canonicalPath="/terms"
        structuredData={breadcrumbSchema}
      />
      <BrandedHeader showHomeButton />
      
      <main className="flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-4xl">
        <div className="text-center mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Terms of Service</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Last updated: April 2026
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                By accessing or using FamilyBridge ("the App"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the App. We may modify these Terms at any time, and your continued use of the App constitutes acceptance of any changes.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-3">2. Description of Service</h2>
              <p className="text-muted-foreground">
                FamilyBridge is a communication and support platform designed to help families affected by addiction. The App provides tools for family communication, boundary setting, financial request management, meeting check-ins, and related features. FamilyBridge is not a medical, mental health, or crisis intervention service.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-3">3. Eligibility</h2>
              <p className="text-muted-foreground">
                You must be at least 13 years old to use the App. If you are under 18, you must have parental or guardian consent. By using the App, you represent that you meet these eligibility requirements.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-3">4. Account Registration</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>You are responsible for:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Providing accurate and complete registration information</li>
                  <li>Maintaining the security of your account credentials</li>
                  <li>All activities that occur under your account</li>
                  <li>Notifying us immediately of any unauthorized use of your account</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-3">5. Subscriptions and Payments</h2>
              <div className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="font-medium text-foreground mb-2">5.1 Subscription Terms</h3>
                  <p>FamilyBridge offers subscription-based access to premium features. Subscriptions automatically renew at the end of each billing period unless cancelled.</p>
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-2">5.2 Billing</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Payment will be charged to your selected payment method at confirmation of purchase.</li>
                    <li>Subscriptions renew automatically unless cancelled before the end of the current billing period.</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-2">5.3 Cancellation</h3>
                  <p>You may cancel your subscription at any time through your account settings. Cancellation takes effect at the end of the current billing period. No refunds are provided for partial billing periods.</p>
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-2">5.4 Price Changes</h3>
                  <p>We may change subscription prices at any time. Price changes will be communicated in advance and will apply to the next billing cycle.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-3">6. User Conduct</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>You agree not to:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Use the App for any illegal purpose</li>
                  <li>Harass, abuse, or harm other users</li>
                  <li>Share false or misleading information</li>
                  <li>Attempt to gain unauthorized access to the App or other accounts</li>
                  <li>Interfere with the proper functioning of the App</li>
                  <li>Share content that is obscene, defamatory, or violates others' rights</li>
                  <li>Use the App in any way that violates these Terms</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-3">7. Content and Intellectual Property</h2>
              <div className="space-y-3 text-muted-foreground">
                <p><strong>Your Content:</strong> You retain ownership of content you submit to the App. By submitting content, you grant us a license to use, store, and display that content as necessary to provide the service.</p>
                <p><strong>Our Content:</strong> The App and its original content, features, and functionality are owned by FamilyBridge and are protected by copyright, trademark, and other intellectual property laws.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-3">8. Privacy</h2>
              <p className="text-muted-foreground">
                Your use of the App is also governed by our Privacy Policy, which is incorporated into these Terms by reference. Please review our Privacy Policy to understand our practices regarding your personal information.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-3">9. AI-Assisted Features</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>Some FamilyBridge features use AI to generate suggestions or extract information from content you choose to submit, including messages, screenshots, documents, and medication-label photos.</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>These features are optional and provided for support and convenience only.</li>
                  <li>You are responsible for reviewing AI-generated output before relying on it or sharing it with others.</li>
                  <li>You should avoid submitting unrelated sensitive information when it is not necessary for the feature you are using.</li>
                  <li>AI output may be inaccurate, incomplete, or inappropriate and is not a substitute for professional judgment.</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-3">10. Disclaimer of Warranties</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE APP WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.</p>
                <p><strong>Important:</strong> FamilyBridge is not a substitute for professional medical, mental health, or addiction treatment services. If you or someone you know may be in immediate danger, call 911 now. In the U.S. and Canada, call or text 988 for immediate crisis support.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-3">11. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, FAMILYBRIDGE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES RESULTING FROM YOUR USE OF THE APP.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-3">12. Indemnification</h2>
              <p className="text-muted-foreground">
                You agree to indemnify and hold harmless FamilyBridge and its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses arising out of your use of the App or violation of these Terms.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-3">13. Termination</h2>
              <p className="text-muted-foreground">
                We may terminate or suspend your account and access to the App at any time, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties, or for any other reason at our sole discretion.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-3">14. Governing Law</h2>
              <p className="text-muted-foreground">
                These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-3">15. Contact Us</h2>
              <p className="text-muted-foreground mb-3">
                If you have any questions about these Terms, please contact us at:
              </p>
              <a 
                href="mailto:matt@freedominterventions.com"
                className="text-primary hover:underline font-medium"
              >
                matt@freedominterventions.com
              </a>
            </CardContent>
          </Card>

          <div className="mt-8">
            <PublicCrisisHelp className="max-w-2xl mx-auto mb-4" />
            <p className="text-xs text-muted-foreground max-w-md mx-auto text-center">
              FamilyBridge provides educational and support-focused content only. It does not offer medical, mental health, or crisis services.
            </p>
          </div>
        </div>
      </main>

      <BrandedFooter />
    </div>
  );
};

export default TermsOfService;