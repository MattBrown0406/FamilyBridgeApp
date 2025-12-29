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

    // Check each place for liquor-related indicators
    const liquorRelatedPlaces: Array<{ name: string; type: string; reason: string }> = [];

    for (const place of data.results || []) {
      // Check if any of the place types indicate alcohol
      const matchingType = place.types?.find(type => LIQUOR_RELATED_TYPES.includes(type));
      if (matchingType) {
        liquorRelatedPlaces.push({
          name: place.name,
          type: matchingType,
          reason: `Place type: ${matchingType}`,
        });
        continue;
      }

      // Check if the place name contains liquor-related keywords
      const placeName = place.name?.toLowerCase() || '';
      const matchingKeyword = LIQUOR_KEYWORDS.find(keyword => placeName.includes(keyword));
      if (matchingKeyword) {
        liquorRelatedPlaces.push({
          name: place.name,
          type: 'keyword_match',
          reason: `Name contains: ${matchingKeyword}`,
        });
      }
    }

    const hasLiquorLicense = liquorRelatedPlaces.length > 0;
    const confidence = liquorRelatedPlaces.some(p => LIQUOR_RELATED_TYPES.includes(p.type)) 
      ? 'high' 
      : liquorRelatedPlaces.length > 0 
        ? 'medium' 
        : 'none';

    console.log(`Liquor license check result: ${hasLiquorLicense ? 'FOUND' : 'NOT FOUND'}, confidence: ${confidence}`);

    return new Response(
      JSON.stringify({
        hasLiquorLicense,
        confidence,
        places: liquorRelatedPlaces,
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
