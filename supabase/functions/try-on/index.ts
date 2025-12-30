import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProductInput {
  image: string;
  description: string;
  category: string;
}

// Generate alternative image URLs for retailer-specific patterns
function getAlternativeImageUrls(originalUrl: string): string[] {
  const urls = [originalUrl];
  
  try {
    const url = new URL(originalUrl);
    
    // Flannels.com specific patterns - they have multiple image formats
    if (url.hostname.includes('flannels.com')) {
      // Try different Flannels image sizes: _xxl, _l, _m, main image
      const pathParts = url.pathname;
      
      // If URL has _zt (thumbnail), try _xxl (full size)
      if (pathParts.includes('_zt')) {
        urls.push(originalUrl.replace('_zt', '_xxl'));
        urls.push(originalUrl.replace('_zt', '_l'));
        urls.push(originalUrl.replace('_zt', '_m'));
      }
      
      // If using /products/ path, try /imgzoom/ path
      if (pathParts.includes('/products/')) {
        const productId = pathParts.match(/(\d+)/)?.[1];
        if (productId) {
          urls.push(`https://www.flannels.com/images/imgzoom/${productId.substring(0, 2)}/${productId}_xxl.jpg`);
          urls.push(`https://www.flannels.com/images/imgzoom/${productId.substring(0, 2)}/${productId}_l.jpg`);
        }
      }
      
      // Try imgzoom variations
      if (pathParts.includes('/imgzoom/')) {
        urls.push(originalUrl.replace('_xxl', '_l'));
        urls.push(originalUrl.replace('_xxl', '_m'));
      }
    }
    
    // ASOS specific patterns
    if (url.hostname.includes('asos.com') || url.hostname.includes('asos-media')) {
      // Try different ASOS sizes
      if (originalUrl.includes('$')) {
        urls.push(originalUrl.replace(/\$[^/]+/, '$n_640w'));
        urls.push(originalUrl.replace(/\$[^/]+/, '$n_480w'));
      }
    }
    
  } catch (e) {
    console.log("Could not parse URL for alternatives:", e);
  }
  
  return [...new Set(urls)]; // Remove duplicates
}

// Download image and convert to base64 with multiple retry strategies
async function fetchImageAsBase64(imageUrl: string): Promise<string | null> {
  try {
    // If already base64, return as-is
    if (imageUrl.startsWith('data:image')) {
      return imageUrl;
    }
    
    console.log("Fetching image:", imageUrl.substring(0, 80) + "...");
    
    // Get alternative URLs to try
    const urlsToTry = getAlternativeImageUrls(imageUrl);
    console.log(`Will try ${urlsToTry.length} URL variations`);
    
    // Try multiple fetch strategies
    const strategyHeaders: Record<string, string>[] = [
      // Strategy 1: Standard browser headers with HTTP/1.1 hints
      {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      // Strategy 2: Minimal headers (some CDNs block complex headers)
      {
        'User-Agent': 'curl/7.84.0',
        'Accept': '*/*',
      },
      // Strategy 3: Googlebot (some CDNs allow this)
      {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept': '*/*',
      },
      // Strategy 4: Mobile Safari
      {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'Accept': 'image/*,*/*;q=0.8',
      }
    ];
    
    // Try each URL with each strategy
    for (const urlToTry of urlsToTry) {
      for (let i = 0; i < strategyHeaders.length; i++) {
        try {
          console.log(`Trying URL: ${urlToTry.substring(0, 60)}... with strategy ${i + 1}`);
          
          const response = await fetch(urlToTry, { 
            headers: strategyHeaders[i],
            redirect: 'follow',
          });
          
          if (response.ok) {
            const contentType = response.headers.get('content-type') || 'image/jpeg';
            
            // Check if we got an actual image
            if (!contentType.includes('image') && !contentType.includes('octet-stream')) {
              console.log(`Strategy ${i + 1} returned non-image content: ${contentType}`);
              continue;
            }
            
            const arrayBuffer = await response.arrayBuffer();
            
            // Validate we got some data
            if (arrayBuffer.byteLength < 1000) {
              console.log(`Strategy ${i + 1} returned too small response: ${arrayBuffer.byteLength} bytes`);
              continue;
            }
            
            // Convert to base64 in chunks to avoid stack overflow on large images
            const uint8Array = new Uint8Array(arrayBuffer);
            let binary = '';
            const chunkSize = 8192; // Process 8KB at a time
            for (let j = 0; j < uint8Array.length; j += chunkSize) {
              const chunk = uint8Array.subarray(j, Math.min(j + chunkSize, uint8Array.length));
              binary += String.fromCharCode.apply(null, Array.from(chunk));
            }
            const base64 = btoa(binary);
            
            console.log(`Successfully fetched image: ${arrayBuffer.byteLength} bytes from ${urlToTry.substring(0, 50)}`);
            return `data:${contentType.split(';')[0]};base64,${base64}`;
          } else {
            console.log(`Strategy ${i + 1} failed for ${urlToTry.substring(0, 40)}: ${response.status}`);
          }
        } catch (strategyError) {
          console.log(`Strategy ${i + 1} error:`, strategyError instanceof Error ? strategyError.message : 'Unknown error');
        }
      }
    }
    
    console.error("All fetch strategies failed for all URL variations");
    return null;
  } catch (error) {
    console.error("Error fetching image:", error);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { avatarImage, faceImage, products } = await req.json();

    if (!avatarImage || !products || products.length === 0) {
      return new Response(
        JSON.stringify({ error: "Avatar image and at least one product are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!GOOGLE_API_KEY) {
      throw new Error("GOOGLE_AI_API_KEY is not configured");
    }

    console.log("Starting multi-item try-on generation...");
    console.log("Number of products:", products.length);
    console.log("Face reference provided:", !!faceImage);
    
    // Pre-fetch all product images as base64 to avoid hotlink blocking
    const processedProducts: { image: string; description: string; category: string }[] = [];
    
    for (const p of products as ProductInput[]) {
      console.log(`Processing product: ${p.description.substring(0, 50)}... (${p.category})`);
      
      const base64Image = await fetchImageAsBase64(p.image);
      
      if (!base64Image) {
        console.error("Could not fetch product image, skipping:", p.image);
        continue;
      }
      
      processedProducts.push({
        image: base64Image,
        description: p.description,
        category: p.category
      });
    }
    
    // Track failed products for user feedback
    const failedProducts: { description: string; image: string }[] = [];
    
    for (const p of products as ProductInput[]) {
      if (!processedProducts.find(pp => pp.description === `${p.description}`)) {
        failedProducts.push({ description: p.description, image: p.image });
      }
    }
    
    if (processedProducts.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "Could not load product images. The retailer may be blocking image access.",
          failedProducts,
          canRetryWithCustomImages: true
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Successfully loaded ${processedProducts.length} product images`);

    // Build the outfit description
    const outfitDescription = processedProducts
      .map((p, i) => `${i + 1}. ${p.category.toUpperCase()}: ${p.description}`)
      .join("\n");

    // Determine image indices based on whether face reference is provided
    const hasFaceRef = !!faceImage;
    const bodyImageIndex = 1;
    const faceImageIndex = hasFaceRef ? 2 : null;
    const productStartIndex = hasFaceRef ? 3 : 2;

    // Build face reference instruction
    const faceRefInstruction = hasFaceRef 
      ? `
IMAGE 2 = FACE REFERENCE - This is a close-up of the USER's face. Use this as the PRIMARY reference for facial identity.
- The face in the output MUST match Image 2 EXACTLY
- Eye color, eye shape, skin tone, facial features - ALL must match Image 2
- This face reference takes priority over the face visible in Image 1
- Product images start from Image 3
`
      : '';

    // Build content array with all images
    const content: any[] = [
      {
        type: "text",
        text: `You are a virtual try-on system. Your ONLY job is to dress the person in Image 1 with clothes from product images.

═══════════════════════════════════════════════════════════════════════════════
🚨🚨🚨 ABSOLUTE RULE #1 - FACE IDENTITY LOCK (VIOLATING THIS = COMPLETE FAILURE) 🚨🚨🚨
═══════════════════════════════════════════════════════════════════════════════

THE FACE IN YOUR OUTPUT MUST BE A 1:1 EXACT COPY OF ${hasFaceRef ? 'IMAGE 2 (THE FACE REFERENCE)' : 'IMAGE 1'}.

THIS IS NON-NEGOTIABLE. YOU CANNOT:
❌ Generate a "similar looking" face - MUST BE IDENTICAL
❌ Create a face that "resembles" the person - MUST BE THE SAME PERSON
❌ Use ANY facial features from product image models
❌ Blend or average faces together
❌ Make the face look "better" or "idealized"
❌ Change ANY aspect of the face for ANY reason

YOU MUST COPY EXACTLY:
✅ EYES: Same color, shape, size, spacing, iris pattern, pupil size, gaze direction, eyelashes, eyebrows
✅ NOSE: Same shape, width, bridge, nostrils, tip
✅ MOUTH: Same lips (color, shape, size), teeth, expression
✅ FACE SHAPE: Same jawline, chin, cheekbones, forehead
✅ SKIN: Same exact tone, color, texture, pores, any moles/freckles/blemishes
✅ FACIAL HAIR: Same beard/mustache/stubble if present
✅ MAKEUP: Same if present

${hasFaceRef ? `
IMAGE 2 IS YOUR FACE REFERENCE - USE IT AS THE PRIMARY SOURCE FOR ALL FACIAL FEATURES.
The face close-up in Image 2 shows EXACTLY what the output face must look like.
Copy every detail from Image 2 - this is the user and they MUST recognize themselves.
` : ''}

IF THE OUTPUT FACE LOOKS LIKE A DIFFERENT PERSON = COMPLETE FAILURE
IF EYE COLOR CHANGES = COMPLETE FAILURE  
IF SKIN TONE CHANGES = COMPLETE FAILURE
IF FACIAL STRUCTURE CHANGES = COMPLETE FAILURE

═══════════════════════════════════════════════════════════════════════════════
🚨 RULE #2 - SKIN COLOR LOCK
═══════════════════════════════════════════════════════════════════════════════

The USER's skin color from Image 1 MUST remain EXACTLY the same:
- Face, neck, arms, hands, legs - ALL skin must match Image 1
- DO NOT lighten or darken skin
- DO NOT change undertones
- Preserve natural skin tone 100%

═══════════════════════════════════════════════════════════════════════════════
🚨 RULE #3 - HAIR LOCK
═══════════════════════════════════════════════════════════════════════════════

Hair must be IDENTICAL to Image 1:
- Same color, texture, style, length, parting
- NO changes whatsoever

═══════════════════════════════════════════════════════════════════════════════
🚨 RULE #3B - NO ADDED TATTOOS
═══════════════════════════════════════════════════════════════════════════════

DO NOT ADD ANY TATTOOS OR BODY ART UNLESS VISIBLE IN IMAGE 1:
- If the user has NO visible tattoos in Image 1 → Output must have NO tattoos
- If the user HAS tattoos in Image 1 → Preserve ONLY those exact tattoos
- DO NOT generate new tattoos, even decorative or aesthetic ones
- DO NOT add sleeve tattoos, arm tattoos, neck tattoos, or any other body art
- The user's skin must remain EXACTLY as it appears in Image 1
- Product model tattoos MUST NOT transfer to the user

═══════════════════════════════════════════════════════════════════════════════
RULE #4 - CLOTHING EXTRACTION
═══════════════════════════════════════════════════════════════════════════════

Product images start from Image ${productStartIndex}.
${outfitDescription}

From each product image:
- EXTRACT ONLY the clothing item
- IGNORE any models wearing the clothes (they are NOT the user)
- IGNORE text, prices, website UI, buttons, watermarks
- Apply the clothing to the USER from Image 1

WHAT TO EXTRACT:
- tops/shirts/hoodies: Upper body garment only
- trousers/jeans/shorts: Lower body garment only
- jackets/coats: Outerwear only
- suits/tracksuits: Both matching pieces
- dresses: Full garment
- footwear: Shoes only
- accessories: That specific item only

═══════════════════════════════════════════════════════════════════════════════
RULE #5 - CLOTHING ACCURACY
═══════════════════════════════════════════════════════════════════════════════

Clothing must be an EXACT visual match:
- Same fabric texture, color shade, pattern
- Same cut, fit, details (buttons, zippers, logos)
- Natural fit on the user's body
- Match lighting to Image 1

═══════════════════════════════════════════════════════════════════════════════
🚨🚨🚨 CRITICAL OUTPUT REQUIREMENT 🚨🚨🚨
═══════════════════════════════════════════════════════════════════════════════

YOU MUST GENERATE A BRAND NEW IMAGE. DO NOT:
❌ Return any of the input images
❌ Return the product images
❌ Return the avatar/body image unchanged
❌ Create a collage or grid of images
❌ Just show the clothing items
❌ CROP the image - show the FULL BODY

YOU MUST CREATE:
✅ ONE NEW photorealistic image showing the PERSON from Image 1 WEARING the clothing items
✅ The person's face, body, and pose from Image 1
✅ The clothing items accurately rendered ON their body
✅ A realistic fashion photo of this specific person in these clothes

═══════════════════════════════════════════════════════════════════════════════
🚨 RULE #6 - FULL BODY FRAMING (CRITICAL)
═══════════════════════════════════════════════════════════════════════════════

MATCH THE EXACT FRAMING OF IMAGE 1:
- If Image 1 shows FULL BODY (head to feet) → Output MUST show FULL BODY (head to feet)
- If Image 1 shows 3/4 body → Output MUST show 3/4 body
- DO NOT crop or zoom in on just the upper body
- DO NOT cut off legs/feet if they were visible in Image 1
- PRESERVE the same camera angle, perspective, and framing as Image 1
- The output should show EVERYTHING visible in Image 1, just with new clothes

The output MUST be a SINGLE composite image of the USER wearing the outfit, NOT the input images.

THE USER MUST BE ABLE TO RECOGNIZE THEMSELVES IN THE OUTPUT.
IF THEY CANNOT RECOGNIZE THEIR OWN FACE, EYES, AND FEATURES = THE OUTPUT IS INVALID.
IF THE OUTPUT IS JUST THE PRODUCT IMAGES = THE OUTPUT IS INVALID.
IF THE BODY IS CROPPED DIFFERENTLY THAN IMAGE 1 = THE OUTPUT IS INVALID.`
      },
      {
        type: "image_url",
        image_url: { url: avatarImage }
      }
    ];

    // Add face reference image if provided (becomes Image 2)
    if (faceImage) {
      content.push({
        type: "image_url",
        image_url: { url: faceImage }
      });
    }

    // Add each product image (now as base64)
    for (const product of processedProducts) {
      content.push({
        type: "image_url",
        image_url: { url: product.image }
      });
    }

    // Convert content array to Gemini format
    const geminiParts = content.map((item: any) => {
      if (item.type === "text") {
        return { text: item.text };
      }
      if (item.type === "image_url") {
        const imageData = item.image_url.url;
        if (imageData.startsWith("data:")) {
          const [header, base64] = imageData.split(",");
          const mimeType = header.match(/data:([^;]+)/)?.[1] || "image/jpeg";
          return { inlineData: { mimeType, data: base64 } };
        }
        // For URLs that aren't base64, we should have already converted them
        return { text: `[Image URL: ${imageData}]` };
      }
      return { text: "" };
    });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: geminiParts }],
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
    console.log("AI response received");

    // Parse Gemini response format
    const candidate = data.candidates?.[0];
    const contentParts = candidate?.content?.parts || [];

    console.log("Response structure:", JSON.stringify({
      hasCandidates: !!data.candidates,
      candidatesLength: data.candidates?.length,
      hasContent: !!candidate?.content,
      partsLength: contentParts.length,
      partTypes: contentParts.map((p: any) => p.text ? 'text' : p.inlineData ? 'image' : 'unknown')
    }));

    // Extract the generated image from Gemini response
    const imagePart = contentParts.find((p: any) => p.inlineData);
    const textPart = contentParts.find((p: any) => p.text);

    const generatedImage = imagePart
      ? `data:${imagePart.inlineData.mimeType || 'image/png'};base64,${imagePart.inlineData.data}`
      : null;

    if (!generatedImage) {
      console.error("No image in response. Full response:", JSON.stringify(data).substring(0, 1000));
      return new Response(
        JSON.stringify({
          error: "Failed to generate try-on image. The AI couldn't process the request. Please try again."
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log image info for debugging
    console.log("Generated image info:", {
      isBase64: true,
      mimeType: imagePart.inlineData.mimeType,
      dataLength: imagePart.inlineData.data?.length
    });

    return new Response(
      JSON.stringify({
        success: true,
        tryOnImage: generatedImage,
        itemCount: processedProducts.length,
        message: textPart?.text || "Try-on complete"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Try-on error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Try-on failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
