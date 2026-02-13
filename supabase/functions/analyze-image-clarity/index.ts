import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CategoryMatch {
  matches: boolean;
  detectedType: string;
  expectedType: string;
  confidence: number;
}

interface ClarityResult {
  isAcceptable: boolean;
  score: number;
  issues: string[];
  suggestions: string[];
  categoryMatch?: CategoryMatch;
}

// Map common request reasons to receipt categories
const getCategoryKeywords = (category: string): string[] => {
  const lowerCategory = category.toLowerCase();
  
  if (lowerCategory.includes('gas') || lowerCategory.includes('fuel')) {
    return ['gas', 'fuel', 'gasoline', 'diesel', 'petrol', 'gas station', 'shell', 'bp', 'exxon', 'chevron', 'mobil', 'texaco', 'citgo', 'sunoco', 'marathon', 'speedway', 'wawa', 'sheetz', 'quiktrip', 'gallons', 'gal', 'unleaded', 'premium', 'regular'];
  }
  if (lowerCategory.includes('electric') || lowerCategory.includes('utility') || lowerCategory.includes('utilities') || lowerCategory.includes('power')) {
    return ['electric', 'electricity', 'power', 'utility', 'utilities', 'kwh', 'kilowatt', 'energy', 'duke energy', 'pge', 'con edison', 'fpl', 'xcel', 'dominion', 'entergy', 'sce', 'sdge', 'meter reading', 'service charge'];
  }
  if (lowerCategory.includes('water')) {
    return ['water', 'sewer', 'wastewater', 'water utility', 'ccf', 'cubic feet', 'gallons used', 'water service'];
  }
  if (lowerCategory.includes('internet') || lowerCategory.includes('wifi') || lowerCategory.includes('cable')) {
    return ['internet', 'wifi', 'broadband', 'cable', 'comcast', 'xfinity', 'spectrum', 'att', 'verizon', 'cox', 'frontier', 'centurylink', 'optimum', 'mbps', 'gbps'];
  }
  if (lowerCategory.includes('phone') || lowerCategory.includes('cell') || lowerCategory.includes('mobile')) {
    return ['phone', 'mobile', 'cellular', 'cell', 'verizon', 'att', 't-mobile', 'sprint', 'boost', 'cricket', 'metro', 'data plan', 'minutes', 'text'];
  }
  if (lowerCategory.includes('food') || lowerCategory.includes('grocery') || lowerCategory.includes('groceries')) {
    return ['grocery', 'groceries', 'food', 'supermarket', 'walmart', 'kroger', 'safeway', 'publix', 'albertsons', 'aldi', 'trader joe', 'whole foods', 'costco', 'sam\'s club', 'target', 'produce', 'meat', 'dairy', 'bakery'];
  }
  if (lowerCategory.includes('rent') || lowerCategory.includes('housing')) {
    return ['rent', 'lease', 'housing', 'apartment', 'landlord', 'property management', 'monthly rent', 'rental payment'];
  }
  if (lowerCategory.includes('medical') || lowerCategory.includes('health') || lowerCategory.includes('doctor') || lowerCategory.includes('hospital')) {
    return ['medical', 'health', 'hospital', 'doctor', 'clinic', 'pharmacy', 'prescription', 'copay', 'insurance', 'patient', 'healthcare'];
  }
  if (lowerCategory.includes('car') || lowerCategory.includes('auto') || lowerCategory.includes('vehicle')) {
    return ['auto', 'car', 'vehicle', 'repair', 'mechanic', 'oil change', 'tire', 'brake', 'service', 'maintenance', 'dealership', 'parts'];
  }
  
  // Default - return the category itself as a keyword
  return [lowerCategory];
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image, expectedCategory } = await req.json();

    if (!image) {
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use Lovable AI to analyze the image
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!lovableApiKey) {
      console.log('Lovable API key not found, using basic analysis');
      // Return a basic analysis if no API key
      return new Response(
        JSON.stringify({
          isAcceptable: true,
          score: 75,
          issues: [],
          suggestions: ['For best results, ensure good lighting and hold camera steady']
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build the prompt based on whether we need category matching
    let analysisPrompt = `Analyze this bill/receipt image for clarity and readability. You must respond with ONLY a valid JSON object (no markdown, no code blocks, no extra text).

Evaluate:
1. Is the text readable?
2. Is the image properly focused?
3. Is the lighting adequate (not too dark or overexposed)?
4. Can account numbers, amounts, and dates be clearly read?
5. Is the document captured fully or is it cut off?`;

    if (expectedCategory) {
      const categoryKeywords = getCategoryKeywords(expectedCategory);
      analysisPrompt += `

ADDITIONALLY, verify if this receipt/bill matches the expected category: "${expectedCategory}"
Look for keywords or indicators that suggest this is a ${expectedCategory} receipt/bill.
Keywords to look for: ${categoryKeywords.join(', ')}

Respond with this exact JSON structure:
{
  "isAcceptable": true or false,
  "score": number from 0-100,
  "issues": ["list of specific problems found"],
  "suggestions": ["list of improvement suggestions"],
  "categoryMatch": {
    "matches": true or false (does the receipt match the expected category?),
    "detectedType": "what type of receipt/bill this appears to be",
    "expectedType": "${expectedCategory}",
    "confidence": number from 0-100 (how confident you are about the detected type)
  }
}

The image is acceptable (isAcceptable: true) if score >= 60 AND categoryMatch.matches is true.
If the receipt doesn't match the expected category, set isAcceptable to false and add an issue.`;
    } else {
      analysisPrompt += `

Respond with this exact JSON structure:
{
  "isAcceptable": true or false,
  "score": number from 0-100,
  "issues": ["list of specific problems found"],
  "suggestions": ["list of improvement suggestions"]
}

The image is acceptable (isAcceptable: true) if score >= 60.`;
    }

    // Analyze the image using Lovable AI vision model
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
            role: 'user',
            content: [
              {
                type: 'text',
                text: analysisPrompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: image
                }
              }
            ]
          }
        ],
        max_tokens: 700
      })
    });

    if (!response.ok) {
      console.error('AI Gateway error:', await response.text());
      throw new Error('AI analysis failed');
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse the AI response - handle potential markdown code blocks
    let result: ClarityResult;
    try {
      // Remove markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.slice(7);
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.slice(0, -3);
      }
      cleanContent = cleanContent.trim();
      
      result = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      // Fallback response
      result = {
        isAcceptable: true,
        score: 70,
        issues: [],
        suggestions: ['Image received - please ensure text is readable']
      };
    }

    // Ensure score and category match determine acceptability
    if (expectedCategory && result.categoryMatch) {
      result.isAcceptable = result.score >= 60 && result.categoryMatch.matches;
      if (!result.categoryMatch.matches && !result.issues.includes('Receipt does not match request type')) {
        result.issues.push(`Receipt appears to be for ${result.categoryMatch.detectedType}, not ${expectedCategory}`);
      }
    } else {
      result.isAcceptable = result.score >= 60;
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error analyzing image:', error);
    
    // Return a permissive fallback on error
    return new Response(
      JSON.stringify({
        isAcceptable: true,
        score: 70,
        issues: [],
        suggestions: ['Could not perform AI analysis - please verify image is clear']
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
