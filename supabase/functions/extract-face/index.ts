import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bodyImage } = await req.json();

    if (!bodyImage) {
      return new Response(
        JSON.stringify({ error: "Body image is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!GOOGLE_API_KEY) {
      throw new Error("GOOGLE_AI_API_KEY is not configured");
    }

    console.log("Starting face extraction from body image...");

    // Convert image to Gemini format
    const promptText = `Extract and create a high-quality close-up portrait photo of the person's face from this full body image.

YOUR TASK:
Create a cropped, zoomed-in portrait that shows ONLY the person's face and upper neck/shoulders.

CRITICAL REQUIREMENTS:
1. ZOOM IN on the face - the face should fill most of the output image
2. The face must be EXACTLY as it appears in the original image:
   - EXACT same eye color, shape, and appearance
   - EXACT same skin tone and complexion
   - EXACT same facial features (nose, lips, chin, jawline)
   - EXACT same hair color, style, and texture
   - EXACT same facial expression
   - EXACT same makeup if present
   - EXACT same facial hair if present
3. Use a neutral/clean background (soft gray or blurred)
4. Maintain the original lighting and shadows on the face
5. Output should be a square portrait-style image

DO NOT:
- Change ANY facial features
- Alter the eye color or shape
- Modify the skin tone
- Change the hair color or style
- Add or remove any features
- Beautify or enhance the face in any way
- Generate a different or "improved" face

The output must look like a zoomed-in crop of the EXACT SAME PERSON from the input image.
This will be used as a face reference for virtual try-on, so accuracy is critical.`;

    // Build Gemini parts
    const parts: any[] = [{ text: promptText }];

    if (bodyImage.startsWith("data:")) {
      const [header, base64] = bodyImage.split(",");
      const mimeType = header.match(/data:([^;]+)/)?.[1] || "image/jpeg";
      parts.push({ inlineData: { mimeType, data: base64 } });
    } else {
      parts.push({ text: `[Image URL: ${bodyImage}]` });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"]
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Usage limit reached. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response received for face extraction");

    // Parse Gemini response format
    const candidate = data.candidates?.[0];
    const contentParts = candidate?.content?.parts || [];

    // Extract the face image from Gemini response
    const imagePart = contentParts.find((p: any) => p.inlineData);
    const faceImage = imagePart
      ? `data:${imagePart.inlineData.mimeType || 'image/png'};base64,${imagePart.inlineData.data}`
      : null;

    if (!faceImage) {
      console.error("No face image in response");
      return new Response(
        JSON.stringify({
          error: "Could not extract face from image",
          success: false
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Successfully extracted face image");

    return new Response(
      JSON.stringify({
        success: true,
        faceImage,
        message: "Face extracted successfully"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Face extraction error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Face extraction failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
