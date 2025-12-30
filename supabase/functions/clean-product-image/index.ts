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
    const { imageUrl, category } = await req.json();

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "Image URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!GOOGLE_API_KEY) {
      throw new Error("GOOGLE_AI_API_KEY is not configured");
    }

    console.log("Starting product image cleanup...");
    console.log("Category:", category || "unknown");

    const categoryHint = category ? `This is a ${category} item.` : "";

    const promptText = `You are a product image cleaner. Your task is to extract ONLY the clothing item from this image and place it on a clean white background.

${categoryHint}

IMPORTANT - THIS IMAGE MAY BE A WEBSITE SCREENSHOT. If so:
- COMPLETELY REMOVE all text (product names, prices, sizes, descriptions)
- COMPLETELY REMOVE all website UI (buttons, navigation, headers, footers, menus)
- COMPLETELY REMOVE all watermarks, logos, and brand overlays
- COMPLETELY REMOVE color swatches, size selectors, thumbnails, and icons
- COMPLETELY REMOVE any background elements, patterns, or textures

YOUR OUTPUT MUST:
1. Show ONLY the clothing item itself - nothing else
2. Place the clothing on a PURE WHITE background (#FFFFFF)
3. Keep the clothing item centered and well-framed
4. Preserve the EXACT appearance of the clothing:
   - Same color/shade
   - Same pattern/print
   - Same fabric texture appearance
   - Same details (buttons, zippers, logos on the garment itself)
5. If the clothing is on a model, show the clothing as if it were laid flat or on an invisible mannequin
6. The output should look like a professional product photo on white background

DO NOT include:
- Any text whatsoever
- Any website elements
- Any models or mannequins (just the clothing)
- Any background other than pure white
- Any UI elements, buttons, or icons
- Multiple items (just the main clothing piece)

Generate a clean, professional product image of JUST the clothing item on white.`;

    // Build Gemini parts
    const parts: any[] = [{ text: promptText }];

    if (imageUrl.startsWith("data:")) {
      const [header, base64] = imageUrl.split(",");
      const mimeType = header.match(/data:([^;]+)/)?.[1] || "image/jpeg";
      parts.push({ inlineData: { mimeType, data: base64 } });
    } else {
      parts.push({ text: `[Image URL: ${imageUrl}]` });
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
      
      // Return original image if cleaning fails
      console.log("AI cleaning failed, returning original image");
      return new Response(
        JSON.stringify({ 
          success: true, 
          cleanedImage: imageUrl,
          wasCleaned: false,
          message: "Could not clean image, using original"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("AI response received");

    // Parse Gemini response format
    const candidate = data.candidates?.[0];
    const contentParts = candidate?.content?.parts || [];

    // Extract the cleaned image from Gemini response
    const imagePart = contentParts.find((p: any) => p.inlineData);
    const cleanedImage = imagePart
      ? `data:${imagePart.inlineData.mimeType || 'image/png'};base64,${imagePart.inlineData.data}`
      : null;

    if (!cleanedImage) {
      console.log("No cleaned image in response, returning original");
      return new Response(
        JSON.stringify({
          success: true,
          cleanedImage: imageUrl,
          wasCleaned: false,
          message: "Could not extract cleaned image, using original"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Successfully cleaned product image");

    return new Response(
      JSON.stringify({
        success: true,
        cleanedImage,
        wasCleaned: true,
        message: "Product image cleaned successfully"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Clean product image error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Image cleaning failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
