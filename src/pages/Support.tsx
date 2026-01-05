import { BrandedHeader } from "@/components/BrandedHeader";
import { BrandedFooter } from "@/components/BrandedFooter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, Clock, MessageCircle } from "lucide-react";

const Support = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <BrandedHeader showHomeButton />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Customer Support</h1>
          <p className="text-muted-foreground">
            We're here to help you with any questions or concerns.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Email Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-3">
                For general inquiries, technical issues, or billing questions:
              </p>
              <a 
                href="mailto:matt@freedominterventions.com"
                className="text-primary hover:underline font-medium"
              >
                matt@freedominterventions.com
              </a>
              <p className="text-sm text-muted-foreground mt-3">
                We typically respond within 24-48 business hours.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Support Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-2">
                Monday - Friday: 9:00 AM - 5:00 PM EST
              </p>
              <p className="text-muted-foreground">
                Weekend: Limited availability
              </p>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                Common Topics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Account setup and family group management</li>
                <li>• Subscription and billing inquiries</li>
                <li>• Technical issues with the app</li>
                <li>• Privacy and security concerns</li>
                <li>• Feature requests and feedback</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>

      <BrandedFooter />
    </div>
  );
};

export default Support;
