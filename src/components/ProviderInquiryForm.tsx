import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Send } from "lucide-react";

/**
 * Inline contact form embedded on /for-providers and /demo (provider tab).
 * Posts to the submit-provider-inquiry edge function which writes to
 * provider_inquiries and emails Matt via Resend.
 */
export const ProviderInquiryForm = ({ source = "for-providers-page" }: { source?: string }) => {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    organization: "",
    role: "",
    program_size: "",
    message: "",
  });

  const update = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!form.full_name.trim() || form.full_name.trim().length < 2) {
      toast.error("Please enter your name");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }

    setSubmitting(true);

    // Pull any UTM params off the URL so we know which channel a lead came in on
    const urlParams = new URLSearchParams(window.location.search);
    const payload = {
      ...form,
      full_name: form.full_name.trim(),
      email: form.email.trim().toLowerCase(),
      source,
      utm_source: urlParams.get("utm_source") || undefined,
      utm_medium: urlParams.get("utm_medium") || undefined,
      utm_campaign: urlParams.get("utm_campaign") || undefined,
    };

    try {
      const { data, error } = await supabase.functions.invoke("submit-provider-inquiry", {
        body: payload,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setSubmitted(true);
      toast.success("Thanks — Matt will be in touch within one business day.");
    } catch (err) {
      console.error("submit-provider-inquiry failed:", err);
      toast.error(
        "We couldn't submit your inquiry. Please email matt@freedominterventions.com directly.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="border-emerald-200 bg-emerald-50/40 dark:bg-emerald-950/20">
        <CardContent className="p-8 text-center">
          <div className="inline-flex h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-900/40 items-center justify-center mb-4">
            <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="text-xl font-display font-bold text-foreground mb-2">
            Got it — thanks, {form.full_name.split(" ")[0]}.
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
            Matt reviews provider inquiries himself and will be in touch within one business day.
            In the meantime, feel free to download the app from the App Store to explore.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60">
      <CardContent className="p-6 sm:p-8">
        <div className="mb-6">
          <h3 className="text-2xl font-display font-bold text-foreground tracking-tight mb-2">
            Let's talk about your program.
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
            Tell us a little about your organization and Matt will follow up personally — usually
            within one business day. No sales pipeline, no SDR call, just a direct conversation
            about whether FamilyBridge is a fit.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="full_name">Your name *</Label>
              <Input
                id="full_name"
                required
                autoComplete="name"
                value={form.full_name}
                onChange={(e) => update("full_name", e.target.value)}
                placeholder="Jane Smith"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="jane@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="(503) 555-0123"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="organization">Organization</Label>
              <Input
                id="organization"
                autoComplete="organization"
                value={form.organization}
                onChange={(e) => update("organization", e.target.value)}
                placeholder="Hope Harbor Treatment"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="role">Your role</Label>
              <Select value={form.role} onValueChange={(v) => update("role", v)}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="interventionist">Interventionist</SelectItem>
                  <SelectItem value="clinical_director">Clinical Director</SelectItem>
                  <SelectItem value="program_admin">Program Administrator</SelectItem>
                  <SelectItem value="therapist">Therapist / Counselor</SelectItem>
                  <SelectItem value="case_manager">Case Manager</SelectItem>
                  <SelectItem value="family_program">Family Program Lead</SelectItem>
                  <SelectItem value="sober_living">Sober Living Operator</SelectItem>
                  <SelectItem value="owner">Owner / Founder</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="program_size">Program size</Label>
              <Select value={form.program_size} onValueChange={(v) => update("program_size", v)}>
                <SelectTrigger id="program_size">
                  <SelectValue placeholder="Families served per month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solo">Solo practice (1-5)</SelectItem>
                  <SelectItem value="small">Small (6-25)</SelectItem>
                  <SelectItem value="mid">Mid-size (26-100)</SelectItem>
                  <SelectItem value="large">Large (100+)</SelectItem>
                  <SelectItem value="enterprise">Multi-location / enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="message">What are you hoping FamilyBridge could solve?</Label>
            <Textarea
              id="message"
              rows={4}
              value={form.message}
              onChange={(e) => update("message", e.target.value)}
              placeholder="What does the family-side of your work look like today? Where do things slip through the cracks?"
              className="resize-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center pt-2">
            <Button type="submit" size="lg" disabled={submitting} className="h-12 px-6">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send inquiry
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground sm:ml-2 leading-snug">
              We respond personally — usually within one business day.
              <br className="hidden sm:inline" /> Your info is never sold or used for marketing lists.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
