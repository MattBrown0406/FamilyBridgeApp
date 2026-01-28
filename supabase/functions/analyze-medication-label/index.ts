import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface MedicationLabelData {
  medication_name: string | null;
  dosage: string | null;
  pharmacy_name: string | null;
  pharmacy_phone: string | null;
  doctor_name: string | null;
  doctor_phone: string | null;
  last_refill_date: string | null;
  refills_remaining: number | null;
  instructions: string | null;
  frequency: string | null;
  confidence: number;
  raw_text?: string;
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

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!lovableApiKey) {
      console.log('Lovable API key not found');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const analysisPrompt = `Analyze this prescription medication label image and extract all relevant information. You must respond with ONLY a valid JSON object (no markdown, no code blocks, no extra text).

Extract the following fields from the medication label:
1. medication_name - The name of the medication (brand or generic)
2. dosage - The dosage/strength (e.g., "10mg", "500mg tablets")
3. pharmacy_name - The pharmacy name
4. pharmacy_phone - The pharmacy phone number (format: XXX-XXX-XXXX if possible)
5. doctor_name - The prescribing doctor's name (often listed as "Dr. [Name]" or "Prescriber:")
6. doctor_phone - The doctor's phone number if visible
7. last_refill_date - The date the prescription was filled (format: YYYY-MM-DD)
8. refills_remaining - Number of refills remaining (as an integer)
9. instructions - Usage instructions (e.g., "Take 1 tablet twice daily")
10. frequency - How often to take the medication (e.g., "twice daily", "every 8 hours", "as needed")

Respond with this exact JSON structure:
{
  "medication_name": "string or null",
  "dosage": "string or null",
  "pharmacy_name": "string or null",
  "pharmacy_phone": "string or null",
  "doctor_name": "string or null",
  "doctor_phone": "string or null",
  "last_refill_date": "YYYY-MM-DD or null",
  "refills_remaining": number or null,
  "instructions": "string or null",
  "frequency": "string or null",
  "confidence": number from 0-100 (how confident you are in the extraction),
  "raw_text": "all visible text from the label for reference"
}

Important:
- If a field is not visible or cannot be extracted, set it to null
- Format phone numbers consistently as XXX-XXX-XXXX
- Format dates as YYYY-MM-DD
- For refills_remaining, return only the number (e.g., 3, not "3 refills")
- The confidence score should reflect how much of the label was readable`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI service credits exhausted.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error('AI analysis failed');
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse the AI response - handle potential markdown code blocks
    let result: MedicationLabelData;
    try {
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
      result = {
        medication_name: null,
        dosage: null,
        pharmacy_name: null,
        pharmacy_phone: null,
        doctor_name: null,
        doctor_phone: null,
        last_refill_date: null,
        refills_remaining: null,
        instructions: null,
        frequency: null,
        confidence: 0,
        raw_text: content
      };
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error analyzing medication label:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to analyze medication label',
        medication_name: null,
        dosage: null,
        pharmacy_name: null,
        pharmacy_phone: null,
        doctor_name: null,
        doctor_phone: null,
        last_refill_date: null,
        refills_remaining: null,
        instructions: null,
        frequency: null,
        confidence: 0
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
