import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format URL
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log('Extracting branding from:', formattedUrl);

    // Try with branding format first, with additional options to bypass blocks
    let response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ['branding', 'markdown'],
        onlyMainContent: false,
        waitFor: 5000,
        timeout: 30000,
      }),
    });

    let data = await response.json();

    // Check if we got a 403/blocked response - the branding data will have "403 Forbidden" as company name
    const branding = data.data?.branding || data.branding || {};
    const metadata = data.data?.metadata || data.metadata || {};
    const markdown = data.data?.markdown || data.markdown || '';
    
    // Detect if the site blocked us (403 error in title or very low confidence)
    const isBlocked = 
      metadata.title?.includes('403') || 
      metadata.title?.includes('Forbidden') ||
      metadata.title?.includes('Access Denied') ||
      metadata.title?.includes('Blocked') ||
      (branding.confidence?.overall === 0 && !branding.images?.logo);
    
    if (isBlocked) {
      console.log('Site appears to have blocked the request, returning helpful error');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'This website has blocked automated access. Please enter your branding information manually.',
          blocked: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!response.ok) {
      console.error('Firecrawl API error:', data);
      return new Response(
        JSON.stringify({ success: false, error: data.error || `Request failed with status ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Firecrawl response keys:', Object.keys(data.data || data));
    
    // Extract company name from various sources
    let companyName = null;
    
    // Priority 1: Page title from metadata (often contains company name)
    if (metadata.title) {
      // Clean up title - remove common suffixes like "| Home", "- Welcome", etc.
      let title = metadata.title;
      title = title.split(/\s*[|\-–—:]\s*(Home|Welcome|Official|Site|Website|Homepage).*$/i)[0];
      title = title.split(/\s*[|\-–—:]\s*$/)[0]; // Remove trailing separators
      title = title.trim();
      if (title && title.length < 60) {
        companyName = title;
      }
    }
    
    // Priority 2: Try to find company name in first H1 from markdown
    if (!companyName && markdown) {
      const h1Match = markdown.match(/^#\s+(.+)$/m);
      if (h1Match && h1Match[1] && h1Match[1].length < 60) {
        companyName = h1Match[1].trim();
      }
    }
    
    // Priority 3: OG site name
    if (!companyName && metadata.ogSiteName) {
      companyName = metadata.ogSiteName;
    }

    console.log('Extracted company name:', companyName);
    
    // Convert colors to HSL format for our design system
    const result = {
      success: true,
      branding: {
        company_name: companyName,
        logo_url: branding.images?.logo || branding.logo || null,
        favicon_url: branding.images?.favicon || null,
        colors: {
          primary: branding.colors?.primary || null,
          secondary: branding.colors?.secondary || null,
          accent: branding.colors?.accent || null,
          background: branding.colors?.background || null,
          textPrimary: branding.colors?.textPrimary || null,
          textSecondary: branding.colors?.textSecondary || null,
        },
        fonts: branding.typography?.fontFamilies || branding.fonts || null,
        raw: branding, // Include raw data for debugging
      },
    };

    console.log('Extracted branding:', JSON.stringify(result, null, 2));

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error extracting branding:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to extract branding';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
