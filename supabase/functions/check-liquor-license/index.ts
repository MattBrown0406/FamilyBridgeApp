import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PlaceResult {
  name: string;
  types: string[];
  business_status?: string;
}

interface NearbySearchResponse {
  results: PlaceResult[];
  status: string;
}

// Place types that indicate liquor/alcohol-related establishments
const LIQUOR_RELATED_TYPES = [
  'bar',
  'night_club',
  'liquor_store',
  'casino',
];

// Keywords in place names that might indicate alcohol-related venues.
// Kept conservative — generic words like "club" or "lounge" produce too
// many false positives (restaurants with "+ Lounge" in the name, dance
// clubs, etc.). The Google 'bar' / 'night_club' type covers those reliably.
const LIQUOR_KEYWORDS = [
  'pub',
  'tavern',
  'brewery',
  'winery',
  'distillery',
  'liquor',
  'spirits',
  'cocktail',
  'saloon',
];

// Keywords for THC/cannabis dispensaries
const THC_KEYWORDS = [
  'dispensary',
  'cannabis',
  'marijuana',
  'thc',
  'weed',
  'hemp',
  'cbd',
  '420',
  'greenleaf',
  'green leaf',
  'medmen',
  'curaleaf',
  'trulieve',
  'surterra',
  'fluent',
  'liberty health',
  'vidacann',
  'rise',
  'zen leaf',
  'the botanist',
  'harvest',
  'columbia care',
  'cresco',
  'verano',
  'grassroots',
  'cookies',
  'stiiizy',
  'med men',
];

// Keywords specifically for liquor stores (retail)
const LIQUOR_STORE_KEYWORDS = [
  'liquor store',
  'wine & spirits',
  'wine and spirits',
  'abc store',
  'package store',
  'bottle shop',
  'total wine',
  'bevmo',
  'specs',
  'spec\'s',
  'binny\'s',
  'binnys',
  'wine warehouse',
  'liquor warehouse',
  'discount liquor',
  'liquor mart',
  'liquor depot',
  'liquor barn',
  'spirits',
];

// Keywords for adult entertainment establishments
const ADULT_ENTERTAINMENT_KEYWORDS = [
  'strip club',
  'stripclub',
  'gentlemen\'s club',
  'gentlemens club',
  'gentleman\'s club',
  'gentlemans club',
  'adult entertainment',
  'adult store',
  'adult shop',
  'adult video',
  'adult bookstore',
  'adult book store',
  'xxx',
  'topless',
  'exotic dance',
  'exotic dancer',
  'showgirls',
  'show girls',
  'cabaret',
  'burlesque',
  'lingerie modeling',
  'fantasy',
  'spearmint rhino',
  'deja vu',
  'scores',
  'sapphire',
  'hustler',
  'penthouse',
  'treasures',
  'platinum plus',
  'gold club',
  'diamond club',
  'velvet',
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { latitude, longitude, address } = await req.json();

    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: 'Latitude and longitude are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!apiKey) {
      console.error('GOOGLE_PLACES_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Checking location for nearby risk venues');

    // Run multiple targeted nearby-searches in parallel.
    // Google Places "Nearby Search" only returns up to 20 results per call,
    // and the top results are heavily biased by category — a single
    // undifferentiated query at a busy corner returns mostly restaurants
    // and cafés, missing dispensaries, liquor stores, and adult venues
    // that sit just outside the immediate pin.
    //
    // We fan out to one query per category plus one wide-net call,
    // then dedupe by name+location.
    //
    // 200m radius ≈ one short city block — wide enough to find the venue
    // the user is actually at (Google's geocode often lands 30–80m off
    // the front door for large buildings) but tight enough that "near"
    // still means "near".
    const radius = 200;
    const base = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&key=${apiKey}`;

    const queries = [
      // Wide-net: anything Google ranks within radius
      `${base}&radius=${radius}`,
      // Bars and nightlife (Google has a 'bar' type)
      `${base}&radius=${radius}&type=bar`,
      // Liquor stores (Google has a 'liquor_store' type)
      `${base}&radius=${radius}&type=liquor_store`,
      // Cannabis — Google has no 'dispensary' type, so use keyword search
      `${base}&radius=${radius}&keyword=dispensary`,
      `${base}&radius=${radius}&keyword=cannabis`,
      // Adult entertainment — keyword-only (no Google type)
      `${base}&radius=${radius}&keyword=strip%20club`,
      `${base}&radius=${radius}&keyword=adult%20entertainment`,
    ];

    const responses = await Promise.all(
      queries.map(async (u) => {
        try {
          const r = await fetch(u);
          return (await r.json()) as NearbySearchResponse;
        } catch (e) {
          console.error('Nearby search failed', e);
          return { results: [], status: 'ERROR' } as NearbySearchResponse;
        }
      })
    );

    // Merge + dedupe results by name (lowercased)
    const seen = new Set<string>();
    const allResults: PlaceResult[] = [];
    for (const r of responses) {
      for (const p of r.results || []) {
        const key = (p.name || '').toLowerCase().trim();
        if (!key || seen.has(key)) continue;
        seen.add(key);
        allResults.push(p);
      }
    }

    // Build a synthetic top-level "data" to keep the rest of the handler
    // logic identical to the original single-call path.
    const data: NearbySearchResponse = {
      results: allResults,
      status: allResults.length > 0 ? 'OK' : 'ZERO_RESULTS',
    };

    console.log('Nearby places query completed', { resultCount: data.results.length, queries: queries.length });

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API error:', data.status);
      return new Response(
        JSON.stringify({ 
          hasLiquorLicense: false, 
          confidence: 'low',
          reason: 'API error',
          places: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check each place for concerning indicators
    const flaggedPlaces: Array<{ name: string; type: string; reason: string; category: 'bar' | 'liquor_store' | 'thc_dispensary' | 'adult_entertainment' }> = [];

    for (const place of data.results || []) {
      const placeName = place.name?.toLowerCase() || '';
      
      // Check for adult entertainment first (highest priority for safety)
      const matchingAdultKeyword = ADULT_ENTERTAINMENT_KEYWORDS.find(keyword => placeName.includes(keyword.toLowerCase()));
      if (matchingAdultKeyword) {
        flaggedPlaces.push({
          name: place.name,
          type: 'adult_entertainment',
          reason: `Adult entertainment: ${matchingAdultKeyword}`,
          category: 'adult_entertainment',
        });
        continue;
      }
      
      // Check for THC dispensary
      const matchingTHCKeyword = THC_KEYWORDS.find(keyword => placeName.includes(keyword.toLowerCase()));
      if (matchingTHCKeyword) {
        flaggedPlaces.push({
          name: place.name,
          type: 'thc_dispensary',
          reason: `THC/Cannabis: ${matchingTHCKeyword}`,
          category: 'thc_dispensary',
        });
        continue;
      }
      
      // Check for liquor store (retail)
      const isLiquorStoreType = place.types?.includes('liquor_store');
      const matchingLiquorStoreKeyword = LIQUOR_STORE_KEYWORDS.find(keyword => placeName.includes(keyword.toLowerCase()));
      if (isLiquorStoreType || matchingLiquorStoreKeyword) {
        flaggedPlaces.push({
          name: place.name,
          type: 'liquor_store',
          reason: isLiquorStoreType ? 'Place type: liquor_store' : `Liquor store: ${matchingLiquorStoreKeyword}`,
          category: 'liquor_store',
        });
        continue;
      }
      
      // Check if any of the place types indicate alcohol venue (bar, club, etc.)
      const matchingType = place.types?.find(type => LIQUOR_RELATED_TYPES.includes(type) && type !== 'liquor_store');
      if (matchingType) {
        flaggedPlaces.push({
          name: place.name,
          type: matchingType,
          reason: `Place type: ${matchingType}`,
          category: 'bar',
        });
        continue;
      }

      // Check if the place name contains liquor-related keywords (bars, etc.)
      const matchingKeyword = LIQUOR_KEYWORDS.find(keyword => placeName.includes(keyword));
      if (matchingKeyword) {
        flaggedPlaces.push({
          name: place.name,
          type: 'keyword_match',
          reason: `Name contains: ${matchingKeyword}`,
          category: 'bar',
        });
      }
    }

    const hasLiquorLicense = flaggedPlaces.length > 0;
    const hasTHCDispensary = flaggedPlaces.some(p => p.category === 'thc_dispensary');
    const hasLiquorStore = flaggedPlaces.some(p => p.category === 'liquor_store');
    const hasBar = flaggedPlaces.some(p => p.category === 'bar');
    const hasAdultEntertainment = flaggedPlaces.some(p => p.category === 'adult_entertainment');
    
    const confidence = flaggedPlaces.some(p => LIQUOR_RELATED_TYPES.includes(p.type) || p.category === 'thc_dispensary' || p.category === 'adult_entertainment') 
      ? 'high' 
      : flaggedPlaces.length > 0 
        ? 'medium' 
        : 'none';

    console.log('Location check completed', {
      hasLiquorLicense,
      confidence,
      hasTHCDispensary,
      hasLiquorStore,
      hasBar,
      hasAdultEntertainment,
    });

    return new Response(
      JSON.stringify({
        hasLiquorLicense,
        hasTHCDispensary,
        hasLiquorStore,
        hasBar,
        hasAdultEntertainment,
        confidence,
        places: flaggedPlaces,
        totalPlacesChecked: data.results?.length || 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error checking liquor license:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        hasLiquorLicense: false,
        confidence: 'error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
