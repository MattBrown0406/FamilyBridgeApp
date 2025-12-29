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
    const { feedUrl, feedType = 'sheets' } = await req.json();

    if (!feedUrl) {
      return new Response(
        JSON.stringify({ error: "Feed URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Fetching meetings from: ${feedUrl} (type: ${feedType})`);

    const response = await fetch(feedUrl, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "FamilyBridge/1.0 (Recovery Meeting Finder)",
      },
    });

    if (!response.ok) {
      console.error("Feed fetch failed:", response.status, response.statusText);
      return new Response(
        JSON.stringify({ error: "Failed to fetch meeting data", status: response.status }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    
    // Handle different response formats based on feed type
    let meetings: Meeting[] = [];
    
    if (feedType === 'central-query') {
      // OIAA central-query API format
      meetings = parseCentralQueryData(data);
    } else if (feedType === 'tsml') {
      // 12 Step Meeting List WordPress plugin format
      meetings = parseTSMLData(data);
    } else {
      // Google Sheets / default format
      meetings = parseSheetsData(data);
    }

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

// Parse OIAA Central Query API data
function parseCentralQueryData(data: any): Meeting[] {
  let rawMeetings: any[] = [];
  
  if (Array.isArray(data)) {
    rawMeetings = data;
  } else if (data.meetings && Array.isArray(data.meetings)) {
    rawMeetings = data.meetings;
  } else if (data.data && Array.isArray(data.data)) {
    rawMeetings = data.data;
  }

  return rawMeetings.map((m: any) => ({
    name: m.name || "Unnamed Meeting",
    slug: m.slug || m.id || String(Math.random()),
    day: typeof m.day === "number" ? m.day : undefined,
    time: m.time,
    end_time: m.end_time,
    location: m.location || "Online Meeting",
    address: m.address,
    city: m.city,
    state: m.state,
    types: Array.isArray(m.types) ? m.types : [],
    notes: m.notes,
    url: m.url,
    conference_url: m.conference_url,
    conference_phone: m.conference_phone,
    latitude: m.latitude ? parseFloat(m.latitude) : undefined,
    longitude: m.longitude ? parseFloat(m.longitude) : undefined,
  }));
}

// Parse 12 Step Meeting List (TSML) WordPress plugin data
function parseTSMLData(data: any): Meeting[] {
  let rawMeetings: any[] = [];
  
  if (Array.isArray(data)) {
    rawMeetings = data;
  } else if (data.meetings && Array.isArray(data.meetings)) {
    rawMeetings = data.meetings;
  }

  return rawMeetings.map((m: any) => {
    // TSML uses day as number 0-6 (Sunday-Saturday)
    let day = typeof m.day === "number" ? m.day : undefined;
    if (typeof m.day === "string") {
      day = parseInt(m.day, 10);
      if (isNaN(day)) day = undefined;
    }

    return {
      name: m.name || "Unnamed Meeting",
      slug: m.slug || m.id?.toString() || String(Math.random()),
      day,
      time: m.time,
      end_time: m.end_time,
      location: m.location || m.location_notes,
      address: m.formatted_address || m.address,
      city: m.city,
      state: m.state,
      postal_code: m.postal_code,
      types: Array.isArray(m.types) ? m.types : [],
      notes: m.notes,
      url: m.url,
      conference_url: m.conference_url,
      conference_phone: m.conference_phone,
      latitude: m.latitude ? parseFloat(m.latitude) : undefined,
      longitude: m.longitude ? parseFloat(m.longitude) : undefined,
    };
  });
}

// Parse Google Sheets / Code for Recovery sheets format
function parseSheetsData(data: any): Meeting[] {
  let rawMeetings: any[] = [];
  
  if (Array.isArray(data)) {
    rawMeetings = data;
  } else if (data.meetings && Array.isArray(data.meetings)) {
    rawMeetings = data.meetings;
  } else if (data.data && Array.isArray(data.data)) {
    rawMeetings = data.data;
  }

  return rawMeetings.map((m: any) => ({
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
    latitude: m.latitude ? parseFloat(m.latitude) : undefined,
    longitude: m.longitude ? parseFloat(m.longitude) : undefined,
  }));
}
