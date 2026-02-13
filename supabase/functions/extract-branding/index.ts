import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Extract domain name as fallback company name
function extractDomainName(url: string): string | null {
  try {
    const hostname = new URL(url).hostname;
    // Remove www. and common TLDs
    let domain = hostname.replace(/^www\./, '');
    // Get the main part before TLD
    const parts = domain.split('.');
    if (parts.length >= 2) {
      // Take the first part (e.g., "freedominterventions" from "freedominterventions.com")
      domain = parts[0];
    }
    // Convert to title case and handle common patterns
    return domain
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  } catch {
    return null;
  }
}

// Parse JSON-LD structured data for organization info
function parseJsonLd(markdown: string): { name?: string; logo?: string } {
  const result: { name?: string; logo?: string } = {};
  
  // Look for JSON-LD script content in markdown (might be in code blocks)
  const jsonLdMatches = markdown.match(/\{[^{}]*"@type"\s*:\s*"Organization"[^{}]*\}/gi);
  if (jsonLdMatches) {
    for (const match of jsonLdMatches) {
      try {
        const data = JSON.parse(match);
        if (data.name) result.name = data.name;
        if (data.logo) {
          result.logo = typeof data.logo === 'string' ? data.logo : data.logo?.url;
        }
      } catch {
        // Try regex extraction as backup
        const nameMatch = match.match(/"name"\s*:\s*"([^"]+)"/);
        if (nameMatch) result.name = nameMatch[1];
        const logoMatch = match.match(/"logo"\s*:\s*"([^"]+)"/);
        if (logoMatch) result.logo = logoMatch[1];
      }
    }
  }
  
  return result;
}

// Use AI to extract company name from content
async function extractWithAI(markdown: string, url: string): Promise<{ name?: string; description?: string }> {
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!lovableApiKey) {
    console.log('LOVABLE_API_KEY not available for AI extraction');
    return {};
  }

  try {
    console.log('Using AI to extract company name...');
    
    // Take first 2000 chars of markdown to keep context manageable
    const contentSample = markdown.slice(0, 2000);
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: `You are an expert at identifying company/organization names from website content. 
Extract the official company or organization name from the provided content.
Return ONLY a JSON object with "name" (the company name) and "description" (a brief tagline if found).
If you cannot determine the name with confidence, return {"name": null}.
Do not include "Inc", "LLC", etc. unless it's clearly part of the brand name.`
          },
          {
            role: 'user',
            content: `URL: ${url}\n\nWebsite content:\n${contentSample}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_company_info",
              description: "Extract company name and description from website content",
              parameters: {
                type: "object",
                properties: {
                  name: { type: "string", description: "The company or organization name" },
                  description: { type: "string", description: "A brief tagline or description" }
                },
                required: ["name"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_company_info" } }
      }),
    });

    if (!response.ok) {
      console.error('AI extraction failed:', response.status);
      return {};
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      console.log('AI extracted:', result);
      return result;
    }
    
    return {};
  } catch (error) {
    console.error('AI extraction error:', error);
    return {};
  }
}

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
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ['branding', 'markdown', 'html'],
        onlyMainContent: false,
        waitFor: 5000,
        timeout: 30000,
      }),
    });

    const data = await response.json();

    // Check if we got a 403/blocked response
    const branding = data.data?.branding || data.branding || {};
    const metadata = data.data?.metadata || data.metadata || {};
    const markdown = data.data?.markdown || data.markdown || '';
    const html = data.data?.html || data.html || '';
    
    // Detect if the site blocked us
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
    
    // Try JSON-LD extraction
    const jsonLdData = parseJsonLd(markdown + html);
    console.log('JSON-LD data:', jsonLdData);
    
    // Extract company name from various sources with priority
    let companyName: string | null = null;
    let nameSource = '';
    
    // Priority 1: JSON-LD Organization name (most reliable)
    if (jsonLdData.name && jsonLdData.name.length < 60) {
      companyName = jsonLdData.name;
      nameSource = 'json-ld';
    }
    
    // Priority 2: OG site name (often the clean brand name)
    if (!companyName && metadata.ogSiteName && metadata.ogSiteName.length < 60) {
      companyName = metadata.ogSiteName;
      nameSource = 'og:site_name';
    }
    
    // Priority 3: Twitter site handle (clean up @)
    if (!companyName && metadata.twitterSite) {
      const twitterName = metadata.twitterSite.replace(/^@/, '');
      if (twitterName.length < 40) {
        // Convert handle to title case as potential name
        companyName = twitterName
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, (c: string) => c.toUpperCase());
        nameSource = 'twitter:site';
      }
    }
    
    // Priority 4: Page title from metadata (clean up common suffixes)
    if (!companyName && metadata.title) {
      let title = metadata.title;
      // Remove common suffixes
      title = title.split(/\s*[|\-–—:]\s*(Home|Welcome|Official|Site|Website|Homepage|Main|Landing).*$/i)[0];
      title = title.split(/\s*[|\-–—:]\s*$/)[0];
      title = title.trim();
      if (title && title.length > 2 && title.length < 60) {
        companyName = title;
        nameSource = 'title';
      }
    }
    
    // Priority 5: OG title
    if (!companyName && metadata.ogTitle) {
      let ogTitle = metadata.ogTitle;
      ogTitle = ogTitle.split(/\s*[|\-–—:]\s*(Home|Welcome|Official).*$/i)[0];
      ogTitle = ogTitle.trim();
      if (ogTitle && ogTitle.length > 2 && ogTitle.length < 60) {
        companyName = ogTitle;
        nameSource = 'og:title';
      }
    }
    
    // Priority 6: First H1 from markdown
    if (!companyName && markdown) {
      const h1Match = markdown.match(/^#\s+(.+)$/m);
      if (h1Match && h1Match[1] && h1Match[1].length > 2 && h1Match[1].length < 60) {
        // Skip if it looks like a page title (e.g., "Welcome to...")
        if (!h1Match[1].match(/^(Welcome|Home|About|Contact)/i)) {
          companyName = h1Match[1].trim();
          nameSource = 'h1';
        }
      }
    }
    
    // Priority 7: Domain name as fallback
    if (!companyName) {
      companyName = extractDomainName(formattedUrl);
      nameSource = 'domain';
    }
    
    // Priority 8: AI extraction if still no good name or name seems poor quality
    const nameNeedsAI = !companyName || 
      nameSource === 'domain' || 
      (companyName && (companyName.length < 3 || companyName.match(/^\d+$/) || companyName.toLowerCase() === 'home'));
    
    if (nameNeedsAI && markdown) {
      const aiResult = await extractWithAI(markdown, formattedUrl);
      if (aiResult.name && aiResult.name.length >= 2 && aiResult.name.length < 60) {
        companyName = aiResult.name;
        nameSource = 'ai';
        console.log('AI provided company name:', companyName);
      }
    }

    console.log('Extracted company name:', companyName, 'from:', nameSource);
    
    // --- Logo extraction with multiple fallbacks ---
    let logoUrl = branding.images?.logo || branding.logo || null;
    let logoSource = logoUrl ? 'branding' : '';
    
    // Try JSON-LD logo
    if (!logoUrl && jsonLdData.logo) {
      logoUrl = jsonLdData.logo;
      logoSource = 'json-ld';
    }
    
    // Try apple-touch-icon (often high-quality logo)
    if (!logoUrl && html) {
      const appleTouchMatch = html.match(/<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i);
      if (appleTouchMatch) {
        logoUrl = appleTouchMatch[1];
        // Make absolute if relative
        if (logoUrl.startsWith('/')) {
          try {
            const baseUrl = new URL(formattedUrl);
            logoUrl = `${baseUrl.origin}${logoUrl}`;
          } catch {}
        }
        logoSource = 'apple-touch-icon';
      }
    }
    
    // Try og:image as logo fallback (may be a banner, but better than nothing)
    if (!logoUrl && (metadata.ogImage || metadata.image)) {
      logoUrl = metadata.ogImage || metadata.image;
      logoSource = 'og:image';
    }
    
    console.log('Logo URL:', logoUrl, 'from:', logoSource);
    
    // Helper to check if a color is dark
    const isColorDark = (color: string | null): boolean => {
      if (!color) return false;
      if (color.startsWith('#')) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance < 0.5;
      }
      if (color.startsWith('rgb')) {
        const match = color.match(/\d+/g);
        if (match && match.length >= 3) {
          const [r, g, b] = match.map(Number);
          const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          return luminance < 0.5;
        }
      }
      return false;
    };

    // Detect if the logo needs a colored background
    const websiteBackgroundIsDark = isColorDark(branding.colors?.background);
    const primaryBrandColorIsDark = isColorDark(branding.colors?.accent) || isColorDark(branding.colors?.textPrimary);
    const websiteBackgroundIsLight = branding.colors?.background && !isColorDark(branding.colors?.background);
    const logoNeedsBackground = websiteBackgroundIsDark || (websiteBackgroundIsLight && primaryBrandColorIsDark);
    
    console.log('Logo background detection:', {
      websiteBackground: branding.colors?.background,
      websiteBackgroundIsDark,
      primaryBrandColorIsDark,
      logoNeedsBackground
    });
    
    // Helper to calculate color saturation
    const getColorSaturation = (color: string | null): number => {
      if (!color) return 0;
      if (color.startsWith('#')) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16) / 255;
        const g = parseInt(hex.substr(2, 2), 16) / 255;
        const b = parseInt(hex.substr(4, 2), 16) / 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const l = (max + min) / 2;
        if (max === min) return 0;
        const d = max - min;
        return d / (1 - Math.abs(2 * l - 1));
      }
      return 0;
    };
    
    // Determine the best primary brand color
    let bestPrimaryColor = branding.colors?.primary || null;
    
    const accentColor = branding.colors?.accent;
    const textPrimaryColor = branding.colors?.textPrimary;
    const firecrawlPrimary = branding.colors?.primary;
    
    if (accentColor && isColorDark(accentColor)) {
      bestPrimaryColor = accentColor;
    } else if (textPrimaryColor && isColorDark(textPrimaryColor) && 
               getColorSaturation(textPrimaryColor) > getColorSaturation(firecrawlPrimary)) {
      bestPrimaryColor = textPrimaryColor;
    }
    
    console.log('Color analysis:', {
      firecrawlPrimary,
      accent: accentColor,
      textPrimary: textPrimaryColor,
      selectedPrimary: bestPrimaryColor
    });
    
    // Get favicon with fallbacks
    let faviconUrl = branding.images?.favicon || metadata.favicon || null;
    if (!faviconUrl) {
      // Try to construct default favicon path
      try {
        const baseUrl = new URL(formattedUrl);
        faviconUrl = `${baseUrl.origin}/favicon.ico`;
      } catch {}
    }
    
    const result = {
      success: true,
      branding: {
        company_name: companyName,
        company_name_source: nameSource,
        logo_url: logoUrl,
        logo_source: logoSource,
        logo_needs_background: logoNeedsBackground,
        favicon_url: faviconUrl,
        colors: {
          primary: bestPrimaryColor,
          secondary: branding.colors?.secondary || null,
          accent: branding.colors?.accent || null,
          background: branding.colors?.background || null,
          textPrimary: branding.colors?.textPrimary || null,
          textSecondary: branding.colors?.textSecondary || null,
          originalPrimary: firecrawlPrimary,
        },
        fonts: branding.typography?.fontFamilies || branding.fonts || null,
        raw: branding,
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
