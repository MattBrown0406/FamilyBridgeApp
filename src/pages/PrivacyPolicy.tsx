import { BrandedHeader } from "@/components/BrandedHeader";
import { BrandedFooter } from "@/components/BrandedFooter";
import { Card, CardContent } from "@/components/ui/card";
import { SEOHead, createBreadcrumbSchema } from "@/components/SEOHead";

const PrivacyPolicy = () => {
  const breadcrumbSchema = createBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Privacy Policy', url: '/privacy' },
  ]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Privacy Policy — FamilyBridge"
        description="FamilyBridge privacy policy. How we protect your family's sensitive data."
        canonicalPath="/privacy"
        structuredData={breadcrumbSchema}
      />
      <BrandedHeader showHomeButton />
      
      <main className="flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-4xl">
        <div className="text-center mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Last updated: January 2026
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-3">Introduction</h2>
              <p className="text-muted-foreground">
                FamilyBridge ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application. Please read this privacy policy carefully. By using FamilyBridge, you agree to the collection and use of information in accordance with this policy.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-3">Information We Collect</h2>
              <div className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="font-medium text-foreground mb-1">Personal Information</h3>
                  <p>When you create an account, we collect your name, email address, and profile information you choose to provide.</p>
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1">Family Group Information</h3>
                  <p>We collect information about family groups you create or join, including messages, boundaries, goals, and financial requests shared within your family group.</p>
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1">Location Information</h3>
                  <p>With your permission, we collect location data for meeting check-ins and location check-in requests. This data is shared only with members of your family group.</p>
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1">Payment Information</h3>
                  <p>Payment usernames (Venmo, PayPal, Cash App) you provide for family financial support are encrypted and stored securely. Subscription payments are processed securely through our payment provider.</p>
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1">Device Information</h3>
                  <p>We may collect device identifiers, operating system version, and app version for analytics and to improve our services.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-3">How We Use Your Information</h2>
              <ul className="space-y-2 text-muted-foreground list-disc list-inside">
                <li>To provide and maintain our service</li>
                <li>To facilitate communication within family groups</li>
                <li>To process meeting check-ins and location sharing</li>
                <li>To manage financial support requests between family members</li>
                <li>To send notifications about activity in your family group</li>
                <li>To improve and personalize your experience</li>
                <li>To respond to your inquiries and support requests</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-3">Data Sharing and Disclosure</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>We do not sell your personal information. We may share your information in the following circumstances:</p>
                <ul className="space-y-2 list-disc list-inside">
                  <li><strong>Within Family Groups:</strong> Information you share is visible to other members of your family group as intended by the app's functionality.</li>
                  <li><strong>With Service Providers:</strong> We use trusted third-party services to help operate our platform (hosting, payment processing, email delivery).</li>
                  <li><strong>Legal Requirements:</strong> We may disclose information if required by law or to protect our rights and safety.</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-3">Data Security</h2>
              <p className="text-muted-foreground">
                We implement appropriate technical and organizational security measures to protect your personal information. This includes encryption of sensitive data, secure authentication, and regular security assessments. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-3">Your Rights</h2>
              <ul className="space-y-2 text-muted-foreground list-disc list-inside">
                <li>Access and review your personal information</li>
                <li>Update or correct your account information</li>
                <li>Delete your account and associated data</li>
                <li>Opt out of promotional communications</li>
                <li>Request a copy of your data</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-3">Children's Privacy</h2>
              <p className="text-muted-foreground">
                FamilyBridge is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-3">Subscriptions & Payments</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>FamilyBridge offers subscription services:</p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Payments are securely processed through our payment provider. We do not store your credit card information.</li>
                  <li>Subscriptions auto-renew unless cancelled before the end of the current billing period.</li>
                </ul>
                <p>You can manage or cancel subscriptions through your account settings.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-3">Changes to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-3">Contact Us</h2>
              <p className="text-muted-foreground mb-3">
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <a 
                href="mailto:matt@freedominterventions.com"
                className="text-primary hover:underline font-medium"
              >
                matt@freedominterventions.com
              </a>
            </CardContent>
          </Card>

          <div className="text-center mt-8">
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              FamilyBridge provides educational and support-focused content only. It does not offer medical, mental health, or crisis services.
            </p>
          </div>
        </div>
      </main>

      <BrandedFooter />
    </div>
  );
};

export default PrivacyPolicy;
