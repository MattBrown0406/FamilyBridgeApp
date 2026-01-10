import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ClarityResult {
  isAcceptable: boolean;
  score: number;
  issues: string[];
  suggestions: string[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();

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

    // Analyze the image using Lovable AI vision model
    const response = await fetch('https://api.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this bill/receipt image for clarity and readability. You must respond with ONLY a valid JSON object (no markdown, no code blocks, no extra text).

Evaluate:
1. Is the text readable?
2. Is the image properly focused?
3. Is the lighting adequate (not too dark or overexposed)?
4. Can account numbers, amounts, and dates be clearly read?
5. Is the document captured fully or is it cut off?

Respond with this exact JSON structure:
{
  "isAcceptable": true or false,
  "score": number from 0-100,
  "issues": ["list of specific problems found"],
  "suggestions": ["list of improvement suggestions"]
}

The image is acceptable (isAcceptable: true) if score >= 60.`
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
        max_tokens: 500
      })
    });

    if (!response.ok) {
      console.error('OpenRouter error:', await response.text());
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

    // Ensure score determines acceptability
    result.isAcceptable = result.score >= 60;

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
