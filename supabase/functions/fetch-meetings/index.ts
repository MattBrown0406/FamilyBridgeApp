/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Meeting {
  name: string;
  slug: string;
  day?: number;
  time?: string;
  end_time?: string;
  location?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  types?: string[];
  notes?: string;
  url?: string;
  conference_url?: string;
  conference_phone?: string;
  latitude?: number;
  longitude?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { feedUrl } = await req.json();

    if (!feedUrl) {
      return new Response(
        JSON.stringify({ error: "Feed URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Fetching meetings from:", feedUrl);

    const response = await fetch(feedUrl, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "FamilyBridge/1.0 (Recovery Meeting Finder)",
      },
    });

    if (!response.ok) {
      console.error("Feed fetch failed:", response.status, response.statusText);
      return new Response(
        JSON.stringify({ error: "Failed to fetch meeting data" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    
    // Handle different response formats
    let meetings: Meeting[] = [];
    
    if (Array.isArray(data)) {
      meetings = data;
    } else if (data.meetings && Array.isArray(data.meetings)) {
      meetings = data.meetings;
    } else if (data.data && Array.isArray(data.data)) {
      meetings = data.data;
    }

    // Normalize and clean the meeting data
    meetings = meetings.map((m: any) => ({
      name: m.name || "Unnamed Meeting",
      slug: m.slug || m.id || String(Math.random()),
      day: typeof m.day === "number" ? m.day : (Array.isArray(m.day) ? m.day[0] : undefined),
      time: m.time,
      end_time: m.end_time,
      location: m.location || m.group,
      address: m.address || m.formatted_address,
      city: m.city,
      state: m.state || m.region,
      postal_code: m.postal_code || m.zip,
      types: Array.isArray(m.types) ? m.types : [],
      notes: m.notes,
      url: m.url,
      conference_url: m.conference_url,
      conference_phone: m.conference_phone,
      latitude: parseFloat(m.latitude) || undefined,
      longitude: parseFloat(m.longitude) || undefined,
    }));

    console.log(`Returning ${meetings.length} meetings`);

    return new Response(
      JSON.stringify({ meetings }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in fetch-meetings:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
