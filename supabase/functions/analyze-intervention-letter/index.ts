import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ExtractedBoundary {
  content: string;
  consequence: string | null;
  target_member_name: string | null;
  author_name: string | null;
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

// Extract text from PDF using Gemini Vision API (handles both digital and scanned PDFs)
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
      model: "google/gemini-2.5-flash",
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
      model: "google/gemini-2.5-flash",
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
    const { documentId, familyId, fileBytes, mimeType } = await req.json();

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

    // Verify membership
    const { data: membership } = await supabase
      .from("family_members")
      .select("id, role")
      .eq("family_id", familyId)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return new Response(
        JSON.stringify({ error: "Not a member of this family" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get family members for context
    const { data: familyMembers } = await supabase
      .from("family_members")
      .select("user_id")
      .eq("family_id", familyId);

    const memberIds = familyMembers?.map(m => m.user_id) || [];
    
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", memberIds);

    const memberNames = profiles?.map(p => p.full_name).filter(Boolean) || [];

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
      // Use Vision API to extract text from PDF (handles scanned documents)
      documentContent = await extractPdfText(arrayBuffer, LOVABLE_API_KEY);
    } else if (normalizedMimeType.startsWith("image/")) {
      // Use Vision API for images
      documentContent = await extractImageText(arrayBuffer, normalizedMimeType, LOVABLE_API_KEY);
    } else if (normalizedMimeType === "text/plain" || normalizedMimeType.includes("text")) {
      // Plain text files
      documentContent = new TextDecoder().decode(bytes);
    } else {
      // Try to read as text for other types (doc, docx may need special handling)
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
        JSON.stringify({ error: "Could not extract sufficient text from the document. Please ensure the document contains readable text." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Document content extracted: ${documentContent.substring(0, 200)}...`);

    // Call Lovable AI to extract boundaries
    const systemPrompt = `You are an expert at analyzing intervention letters and extracting boundaries that families have set.

An intervention letter typically contains:
- A greeting or salutation (often "Dear [name]")
- A signature at the end from the letter author
- Expressions of love and concern
- Specific boundaries the family member is committing to
- Consequences if boundaries are violated

Your task is to:
1. Identify who WROTE this letter (look for signatures, "Love, [name]", "Sincerely, [name]", or opening statements like "I am your [relationship]")
2. Extract ONLY the specific boundaries mentioned in the letter

A boundary is a clear statement about what the family member will or will not do/allow.

Examples of boundaries:
- "I will no longer give you money for any reason"
- "You cannot stay at our house if you are using"
- "I will not answer the phone after 10pm"

For each boundary, extract:
1. The author's name (the person who wrote this boundary - from the letter signature or context)
2. The consequence if violated (if mentioned)
3. The target person's name if this boundary is specifically directed at one recovering member

IMPORTANT: Each boundary should have the author_name of the person who WROTE the letter, not who it's addressed to.

Family member names in this group: ${memberNames.join(", ")}

Respond with a JSON array of boundaries. If no clear boundaries are found, return an empty array.`;

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
          { role: "user", content: `Please analyze this intervention letter and extract all boundaries:\n\n${documentContent}` }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_boundaries",
              description: "Extract boundaries from an intervention letter",
              parameters: {
                type: "object",
                properties: {
                  boundaries: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        content: { 
                          type: "string", 
                          description: "The boundary statement itself" 
                        },
                        consequence: { 
                          type: "string", 
                          description: "The consequence if this boundary is violated (or null if not specified)" 
                        },
                        target_member_name: { 
                          type: "string", 
                          description: "The name of the recovering member this boundary is specifically about (or null if general)" 
                        },
                        author_name: {
                          type: "string",
                          description: "The name of the person who WROTE this letter/boundary (from signature, closing, or context)"
                        }
                      },
                      required: ["content", "author_name"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["boundaries"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_boundaries" } }
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
    
    if (!toolCall || toolCall.function.name !== "extract_boundaries") {
      throw new Error("Unexpected AI response format");
    }

    const extractedData = JSON.parse(toolCall.function.arguments);
    const boundaries: ExtractedBoundary[] = extractedData.boundaries || [];

    console.log(`Found ${boundaries.length} boundaries in document`);

    // Create boundaries in the database
    let boundariesCreated = 0;
    
    for (const boundary of boundaries) {
      // Find target user if name was extracted
      let targetUserId = null;
      if (boundary.target_member_name) {
        const matchedProfile = profiles?.find(p => 
          p.full_name?.toLowerCase().includes(boundary.target_member_name!.toLowerCase())
        );
        if (matchedProfile) {
          targetUserId = matchedProfile.id;
        }
      }

      // Try to match the author to an existing family member
      let authorMatchedUserId = null;
      if (boundary.author_name) {
        const matchedAuthor = profiles?.find(p => 
          p.full_name?.toLowerCase().includes(boundary.author_name!.toLowerCase())
        );
        if (matchedAuthor) {
          authorMatchedUserId = matchedAuthor.id;
        }
      }

      // Insert boundary with 'pending' status for moderator review
      // The author_name field stores who wrote the boundary (from the letter)
      // created_by is the user who uploaded/analyzed it
      const { error: insertError } = await supabase
        .from("family_boundaries")
        .insert({
          family_id: familyId,
          created_by: user.id,
          content: boundary.content,
          consequence: boundary.consequence || null,
          target_user_id: targetUserId,
          author_name: boundary.author_name || null,
          author_matched_user_id: authorMatchedUserId,
          status: "pending" // Requires moderator approval
        });

      if (!insertError) {
        boundariesCreated++;
      } else {
        console.error("Error creating boundary:", insertError);
      }
    }

    // Update the document to mark it as analyzed
    await supabase
      .from("family_documents")
      .update({
        fiis_analyzed: true,
        fiis_analyzed_at: new Date().toISOString(),
        boundaries_extracted: boundariesCreated
      })
      .eq("id", documentId);

    console.log(`Analysis complete: ${boundariesCreated} boundaries created`);

    return new Response(
      JSON.stringify({
        success: true,
        boundariesFound: boundaries.length,
        boundariesCreated,
        message: boundariesCreated > 0 
          ? `Extracted ${boundariesCreated} boundaries for moderator review.`
          : "No clear boundaries found in this document."
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error analyzing intervention letter:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Analysis failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
