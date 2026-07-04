import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { enqueueSpineEvent } from "../_shared/spine.ts";


interface InquiryBody {
  full_name?: string;
  email?: string;
  phone?: string;
  organization?: string;
  role?: string;
  program_size?: string;
  message?: string;
  source?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

// Basic email validation
const isValidEmail = (s: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length < 320;

// Cheap spam heuristics — block obvious bot patterns without going overboard.
// This is a public, unauthenticated endpoint so we expect some abuse.
const isLikelySpam = (b: InquiryBody): boolean => {
  const msg = (b.message ?? "").toLowerCase();
  if (msg.length > 5000) return true;
  // Common spam tokens
  if (/\b(viagra|cialis|crypto|bitcoin|seo services|backlink)\b/i.test(msg)) return true;
  // Too many URLs in message
  const urlCount = (msg.match(/https?:\/\//g) ?? []).length;
  if (urlCount > 2) return true;
  return false;
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = (await req.json()) as InquiryBody;

    // Required fields
    const name = (body.full_name ?? "").trim();
    const email = (body.email ?? "").trim().toLowerCase();

    if (!name || name.length < 2) {
      return new Response(JSON.stringify({ error: "Name is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!email || !isValidEmail(email)) {
      return new Response(JSON.stringify({ error: "A valid email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userAgent = req.headers.get("user-agent") ?? null;
    // Supabase Edge runs behind a proxy; honor X-Forwarded-For first hop
    const fwd = req.headers.get("x-forwarded-for") ?? "";
    const clientIp = fwd.split(",")[0]?.trim() || null;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const status = isLikelySpam(body) ? "spam" : "new";

    const { data: inserted, error: insertError } = await supabase
      .from("provider_inquiries")
      .insert({
        full_name: name,
        email,
        phone: body.phone?.trim() || null,
        organization: body.organization?.trim() || null,
        role: body.role?.trim() || null,
        program_size: body.program_size?.trim() || null,
        message: body.message?.trim() || null,
        source: body.source?.trim() || "for-providers-page",
        utm_source: body.utm_source ?? null,
        utm_medium: body.utm_medium ?? null,
        utm_campaign: body.utm_campaign ?? null,
        user_agent: userAgent,
        ip_inet: clientIp,
        status,
      })
      .select("id, created_at, status")
      .single();

    if (insertError) {
      console.error("DB insert failed:", insertError);
      return new Response(JSON.stringify({ error: "Failed to save inquiry" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only notify Matt if it's not flagged spam
    if (status !== "spam") {
      const resendKey = Deno.env.get("RESEND_API_KEY");
      const notifyEmail = Deno.env.get("PROVIDER_INQUIRY_NOTIFY_EMAIL") ?? "matt@freedominterventions.com";

      if (resendKey) {
        try {
          const resend = new Resend(resendKey);
          const lines = [
            `<p><strong>${name}</strong> just submitted a provider inquiry on FamilyBridge.</p>`,
            `<table style="font-family: -apple-system, sans-serif; font-size: 14px; line-height: 1.55;">`,
            `<tr><td style="color:#666; padding-right: 12px;">Email</td><td><a href="mailto:${email}">${email}</a></td></tr>`,
            body.phone ? `<tr><td style="color:#666; padding-right: 12px;">Phone</td><td><a href="tel:${body.phone}">${body.phone}</a></td></tr>` : "",
            body.organization ? `<tr><td style="color:#666; padding-right: 12px;">Organization</td><td>${body.organization}</td></tr>` : "",
            body.role ? `<tr><td style="color:#666; padding-right: 12px;">Role</td><td>${body.role}</td></tr>` : "",
            body.program_size ? `<tr><td style="color:#666; padding-right: 12px;">Program size</td><td>${body.program_size}</td></tr>` : "",
            `<tr><td style="color:#666; padding-right: 12px;">Source</td><td>${body.source ?? "for-providers-page"}</td></tr>`,
            `</table>`,
            body.message ? `<p style="margin-top: 18px; padding: 14px; background: #F3ECDF; border-left: 3px solid #4AA09B; border-radius: 4px;"><em>${body.message.replace(/\n/g, "<br>")}</em></p>` : "",
            `<p style="margin-top: 18px; color: #666; font-size: 12px;">Reply to this email to respond directly. Reference ID: <code>${inserted.id}</code></p>`,
          ].filter(Boolean).join("\n");

          await resend.emails.send({
            from: "FamilyBridge <noreply@familybridgeapp.com>",
            to: [notifyEmail],
            reply_to: email,
            subject: `New provider inquiry — ${name}${body.organization ? ` (${body.organization})` : ""}`,
            html: lines,
          });
        } catch (e) {
          // Non-fatal — inquiry is saved, we just couldn't email
          console.error("Resend notify failed:", e);
        }
      }
    }

    if (status !== "spam") {
      await enqueueSpineEvent("lead_captured", {
        email,
        name,
        phone: body.phone?.trim() || null,
        props: {
          source: body.source ?? "for-providers-page",
          organization: body.organization ?? null,
          role: body.role ?? null,
        },
      }, supabase);
    }

    return new Response(
      JSON.stringify({
        success: true,
        id: inserted.id,
        // Don't leak spam-status to the client; everyone gets a polite ack
        message: "Thanks — we'll be in touch within one business day.",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("submit-provider-inquiry error:", error);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
