import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { BrandedHeader } from "@/components/BrandedHeader";
import { BrandedFooter } from "@/components/BrandedFooter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SEOHead, createBreadcrumbSchema } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Clock, MessageCircle, Loader2, Send, CheckCircle, ArrowLeft } from "lucide-react";

const Support = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  
  // Get context from URL params
  const userType = searchParams.get('type') as 'family' | 'moderator' | 'provider' | null;
  const accountNumber = searchParams.get('account');
  const organizationName = searchParams.get('org');
  const organizationId = searchParams.get('orgId');

  const breadcrumbSchema = createBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Support', url: '/support' },
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in your name, email, and message.',
        variant: 'destructive',
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-support-email', {
        body: {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          message: formData.message.trim(),
          accountNumber: accountNumber || undefined,
          organizationName: organizationName || undefined,
          organizationId: organizationId || undefined,
          userType: userType || 'family',
        },
      });

      if (error) throw error;

      setIsSubmitted(true);
      toast({
        title: 'Message Sent!',
        description: 'We\'ll get back to you as soon as possible.',
      });
    } catch (error: any) {
      console.error('Error sending support email:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again or email us directly.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Support — FamilyBridge"
        description="Get help with FamilyBridge. FAQs, troubleshooting, and contact our support team."
        canonicalPath="/support"
        structuredData={breadcrumbSchema}
      />
      <BrandedHeader showHomeButton />
      
      <main className="flex-1 container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Customer Support</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            We're here to help you with any questions or concerns.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Contact Form */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                Contact Us
              </CardTitle>
              <CardDescription>
                Fill out the form below and we'll get back to you as soon as possible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isSubmitted ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Message Sent!</h3>
                  <p className="text-muted-foreground mb-4">
                    Thank you for contacting us. We'll respond to your inquiry within 24-48 business hours.
                  </p>
                  <Button variant="outline" onClick={() => {
                    setIsSubmitted(false);
                    setFormData({ name: '', email: '', phone: '', message: '' });
                  }}>
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Show account/org info if present */}
                  {(accountNumber || organizationName) && (
                    <div className="bg-muted/50 p-3 rounded-lg text-sm">
                      {userType === 'family' && accountNumber && (
                        <p><span className="font-medium">Account Number:</span> {accountNumber}</p>
                      )}
                      {(userType === 'moderator' || userType === 'provider') && organizationName && (
                        <p><span className="font-medium">Organization:</span> {organizationName}</p>
                      )}
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Your full name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      maxLength={100}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      maxLength={255}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={formData.phone}
                      onChange={handleChange}
                      maxLength={20}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message">Comment, Question, or Concern *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="How can we help you?"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={5}
                      maxLength={2000}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {formData.message.length}/2000
                    </p>
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Info Cards */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  Email Support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-3">
                  Prefer to email us directly? Reach out at:
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
                  Monday - Friday: 9:00 AM - 5:00 PM PST
                </p>
                <p className="text-muted-foreground">
                  Weekend: Limited availability
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  Common Topics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground text-sm">
                  <li>• Account setup and family group management</li>
                  <li>• Subscription and billing inquiries</li>
                  <li>• Technical issues with the app</li>
                  <li>• Privacy and security concerns</li>
                  <li>• Feature requests and feedback</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <BrandedFooter />
    </div>
  );
};

export default Support;
