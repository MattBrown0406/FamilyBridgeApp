import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ExtractedAftercare {
  recommendation_type: "therapy" | "meetings" | "outpatient" | "residential" | "sober_living" | "medical" | "wellness" | "other";
  title: string;
  description: string | null;
  facility_name: string | null;
  recommended_duration: string | null;
  frequency: string | null;
  therapy_type: string | null;
}

// Convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Extract text from PDF using Gemini Vision API
async function extractPdfText(pdfBytes: ArrayBuffer, apiKey: string): Promise<string> {
  console.log("Extracting text from PDF using Gemini Vision...");
  
  const base64Pdf = arrayBufferToBase64(pdfBytes);
  
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract ALL text from this document exactly as written. Return only the extracted text content, preserving the original formatting and structure. Do not summarize or modify the content."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:application/pdf;base64,${base64Pdf}`
              }
            }
          ]
        }
      ],
      max_tokens: 8000
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("PDF extraction error:", response.status, errorText);
    throw new Error(`Failed to extract text from PDF: ${response.status}`);
  }

  const result = await response.json();
  const extractedText = result.choices?.[0]?.message?.content || "";
  
  console.log(`Extracted ${extractedText.length} characters from PDF`);
  return extractedText;
}

// Extract text from image files using Vision API
async function extractImageText(imageBytes: ArrayBuffer, mimeType: string, apiKey: string): Promise<string> {
  console.log("Extracting text from image using Gemini Vision...");
  
  const base64Image = arrayBufferToBase64(imageBytes);
  
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract ALL text from this image exactly as written. Return only the extracted text content. Do not summarize or modify the content."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 8000
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Image extraction error:", response.status, errorText);
    throw new Error(`Failed to extract text from image: ${response.status}`);
  }

  const result = await response.json();
  const extractedText = result.choices?.[0]?.message?.content || "";
  
  console.log(`Extracted ${extractedText.length} characters from image`);
  return extractedText;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId, familyId, fileBytes, mimeType, targetUserId } = await req.json();

    if (!documentId || !familyId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: documentId, familyId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header for user context
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user is a family member
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Invalid authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify membership and check role
    const { data: membership } = await supabase
      .from("family_members")
      .select("id, role")
      .eq("family_id", familyId)
      .eq("user_id", user.id)
      .single();

    if (!membership || (membership.role !== "moderator" && membership.role !== "admin")) {
      return new Response(
        JSON.stringify({ error: "Only moderators can analyze aftercare documents" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get family members for context
    const { data: familyMembers } = await supabase
      .from("family_members")
      .select("user_id, relationship_type")
      .eq("family_id", familyId);

    const memberIds = familyMembers?.map(m => m.user_id) || [];
    
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", memberIds);

    // Extract document text based on file type
    let documentContent: string;
    
    if (!fileBytes) {
      return new Response(
        JSON.stringify({ error: "No file content provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Decode base64 file bytes
    const binaryString = atob(fileBytes);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const arrayBuffer = bytes.buffer;

    const normalizedMimeType = (mimeType || "").toLowerCase();
    
    if (normalizedMimeType === "application/pdf") {
      documentContent = await extractPdfText(arrayBuffer, LOVABLE_API_KEY);
    } else if (normalizedMimeType.startsWith("image/")) {
      documentContent = await extractImageText(arrayBuffer, normalizedMimeType, LOVABLE_API_KEY);
    } else if (normalizedMimeType === "text/plain" || normalizedMimeType.includes("text")) {
      documentContent = new TextDecoder().decode(bytes);
    } else {
      try {
        documentContent = new TextDecoder().decode(bytes);
        if (documentContent.length < 50 || !/[a-zA-Z]{3,}/.test(documentContent)) {
          throw new Error("Content appears to be binary");
        }
      } catch {
        return new Response(
          JSON.stringify({ error: `Unsupported file type: ${mimeType}. Please upload PDF, image, or text files.` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (!documentContent || documentContent.trim().length < 50) {
      return new Response(
        JSON.stringify({ error: "Could not extract sufficient text from the document." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Document content extracted: ${documentContent.substring(0, 200)}...`);

    // Call Lovable AI to extract aftercare recommendations
    const systemPrompt = `You are an expert at analyzing clinical discharge plans and aftercare recommendations from treatment facilities.

A discharge/aftercare plan typically contains:
- Patient information
- Diagnosis and treatment summary  
- Continuing care recommendations
- Follow-up appointments
- Medication instructions
- Therapy/counseling recommendations
- Support group attendance requirements
- Lifestyle recommendations

Your task is to extract ALL specific aftercare recommendations from this document.

Categories of aftercare recommendations:
1. "therapy" - Individual or family therapy sessions
2. "meetings" - AA, NA, Al-Anon, or other 12-step/recovery meetings
3. "outpatient" - Intensive Outpatient Program (IOP) or Partial Hospitalization (PHP)
4. "residential" - Sober living homes or continued residential treatment
5. "medical" - Psychiatrist visits, medication management, medical follow-ups
6. "wellness" - Exercise, meditation, nutrition, sleep hygiene recommendations
7. "other" - Any other specific recommendations (job counseling, legal, etc.)

For each recommendation, extract:
1. The type (from categories above)
2. A clear title
3. Detailed description
4. Facility/provider name if mentioned
5. Recommended duration (e.g., "6 months", "ongoing")
6. Frequency (e.g., "3x per week", "daily", "as needed")
7. Therapy type if applicable (e.g., "CBT", "DBT", "EMDR", "group")

Be thorough - these recommendations are critical for successful recovery navigation.

Respond with a JSON array of recommendations. Include ALL recommendations found in the document.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Please analyze this discharge/aftercare plan and extract all recommendations:\n\n${documentContent}` }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_aftercare_recommendations",
              description: "Extract aftercare recommendations from a discharge/aftercare plan",
              parameters: {
                type: "object",
                properties: {
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        recommendation_type: { 
                          type: "string",
                          enum: ["therapy", "meetings", "outpatient", "residential", "sober_living", "medical", "wellness", "other"],
                          description: "Category of the recommendation"
                        },
                        title: { 
                          type: "string", 
                          description: "A clear, concise title for this recommendation" 
                        },
                        description: { 
                          type: "string", 
                          description: "Detailed description of what this recommendation entails" 
                        },
                        facility_name: { 
                          type: "string", 
                          description: "Name of the facility, provider, or organization (if specified)" 
                        },
                        recommended_duration: { 
                          type: "string", 
                          description: "How long this should continue (e.g., '6 months', 'ongoing', '90 days')" 
                        },
                        frequency: { 
                          type: "string", 
                          description: "How often (e.g., '3x per week', 'daily', 'weekly')" 
                        },
                        therapy_type: {
                          type: "string",
                          description: "Type of therapy if applicable (e.g., 'CBT', 'DBT', 'EMDR', 'group therapy')"
                        }
                      },
                      required: ["recommendation_type", "title"],
                      additionalProperties: false
                    }
                  },
                  patient_name: {
                    type: "string",
                    description: "Name of the patient from the document (if found)"
                  },
                  discharge_date: {
                    type: "string",
                    description: "Discharge date from the document (if found)"
                  },
                  facility_name: {
                    type: "string",
                    description: "Name of the treatment facility that created this plan (if found)"
                  }
                },
                required: ["recommendations"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_aftercare_recommendations" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI analysis failed");
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall || toolCall.function.name !== "extract_aftercare_recommendations") {
      throw new Error("Unexpected AI response format");
    }

    const extractedData = JSON.parse(toolCall.function.arguments);
    const recommendations: ExtractedAftercare[] = extractedData.recommendations || [];
    const patientName = extractedData.patient_name;
    const facilityName = extractedData.facility_name;

    console.log(`Found ${recommendations.length} aftercare recommendations`);

    // Try to match patient name to a family member if not explicitly provided
    let resolvedTargetUserId = targetUserId;
    if (!resolvedTargetUserId && patientName) {
      const matchedProfile = profiles?.find(p => 
        p.full_name?.toLowerCase().includes(patientName.toLowerCase()) ||
        patientName.toLowerCase().includes(p.full_name?.toLowerCase() || "")
      );
      if (matchedProfile) {
        resolvedTargetUserId = matchedProfile.id;
        console.log(`Matched patient "${patientName}" to user ${resolvedTargetUserId}`);
      }
    }

    // If still no target user, try to find a recovering member
    if (!resolvedTargetUserId) {
      const recoveringMember = familyMembers?.find(m => m.relationship_type === "recovering");
      if (recoveringMember) {
        resolvedTargetUserId = recoveringMember.user_id;
        console.log(`Using recovering member as target: ${resolvedTargetUserId}`);
      }
    }

    if (!resolvedTargetUserId) {
      return new Response(
        JSON.stringify({ 
          error: "Could not determine which family member this aftercare plan is for. Please specify the target member.",
          recommendations: recommendations.length,
          patientName
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for existing active aftercare plan
    let { data: existingPlan } = await supabase
      .from("aftercare_plans")
      .select("id")
      .eq("family_id", familyId)
      .eq("target_user_id", resolvedTargetUserId)
      .eq("is_active", true)
      .single();

    let planId: string;

    if (existingPlan) {
      planId = existingPlan.id;
      console.log(`Using existing aftercare plan: ${planId}`);
    } else {
      // Create new aftercare plan
      const { data: newPlan, error: planError } = await supabase
        .from("aftercare_plans")
        .insert({
          family_id: familyId,
          target_user_id: resolvedTargetUserId,
          created_by: user.id,
          notes: facilityName ? `Imported from ${facilityName} discharge plan` : "Imported from uploaded discharge plan",
          is_active: true
        })
        .select("id")
        .single();

      if (planError) {
        console.error("Error creating aftercare plan:", planError);
        throw new Error("Failed to create aftercare plan");
      }

      planId = newPlan.id;
      console.log(`Created new aftercare plan: ${planId}`);
    }

    // Insert recommendations
    let recommendationsCreated = 0;
    
    for (const rec of recommendations) {
      const { error: insertError } = await supabase
        .from("aftercare_recommendations")
        .insert({
          plan_id: planId,
          recommendation_type: rec.recommendation_type,
          title: rec.title,
          description: rec.description || null,
          facility_name: rec.facility_name || null,
          recommended_duration: rec.recommended_duration || null,
          frequency: rec.frequency || null,
          therapy_type: rec.therapy_type || null,
          is_completed: false
        });

      if (!insertError) {
        recommendationsCreated++;
      } else {
        console.error("Error creating recommendation:", insertError);
      }
    }

    // Update the document to mark it as analyzed
    await supabase
      .from("family_documents")
      .update({
        fiis_analyzed: true,
        fiis_analyzed_at: new Date().toISOString(),
        boundaries_extracted: recommendationsCreated // Repurpose for recommendations count
      })
      .eq("id", documentId);

    console.log(`Analysis complete: ${recommendationsCreated} recommendations created`);

    return new Response(
      JSON.stringify({
        success: true,
        recommendationsFound: recommendations.length,
        recommendationsCreated,
        planId,
        patientName,
        facilityName,
        message: recommendationsCreated > 0 
          ? `Created ${recommendationsCreated} aftercare items from the discharge plan.`
          : "No clear aftercare recommendations found in this document."
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error analyzing aftercare document:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Analysis failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
