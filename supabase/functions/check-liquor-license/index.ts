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

// Keywords in place names that might indicate alcohol-related venues
const LIQUOR_KEYWORDS = [
  'bar',
  'pub',
  'tavern',
  'brewery',
  'winery',
  'distillery',
  'liquor',
  'wine',
  'spirits',
  'cocktail',
  'lounge',
  'nightclub',
  'club',
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

    console.log(`Checking liquor license for location: ${latitude}, ${longitude}`);

    // Search for nearby places within 50 meters
    const radius = 50;
    const nearbyUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&key=${apiKey}`;
    
    const response = await fetch(nearbyUrl);
    const data: NearbySearchResponse = await response.json();

    console.log(`Found ${data.results?.length || 0} nearby places`);

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

    console.log(`Location check result: ${hasLiquorLicense ? 'FOUND' : 'NOT FOUND'}, confidence: ${confidence}, THC: ${hasTHCDispensary}, Liquor Store: ${hasLiquorStore}, Bar: ${hasBar}, Adult: ${hasAdultEntertainment}`);

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
