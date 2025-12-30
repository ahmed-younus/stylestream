import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SearchResult {
  title: string;
  url: string;
  description: string;
  price?: string;
  image?: string;
  imageBase64?: string; // Pre-fetched image as base64 to bypass retailer blocking
  brand?: string;
}

// Pre-fetch image and convert to base64 to bypass retailer blocking in try-on
async function fetchImageAsBase64(imageUrl: string, firecrawlApiKey?: string): Promise<string | null> {
  if (!imageUrl) return null;
  
  // If already base64, return as-is
  if (imageUrl.startsWith('data:image')) {
    return imageUrl;
  }
  
  console.log("Pre-fetching image:", imageUrl.substring(0, 60) + "...");
  
  const strategies: Record<string, string>[] = [
    {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      'Referer': new URL(imageUrl).origin,
    },
    {
      'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      'Accept': '*/*',
    },
    {
      'User-Agent': 'curl/7.84.0',
      'Accept': '*/*',
    }
  ];
  
  // Try direct fetch first
  for (const headers of strategies) {
    try {
      const response = await fetch(imageUrl, { headers, redirect: 'follow' });
      
      if (response.ok) {
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        if (!contentType.includes('image') && !contentType.includes('octet-stream')) continue;
        
        const arrayBuffer = await response.arrayBuffer();
        if (arrayBuffer.byteLength < 1000) continue;
        
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        console.log("Successfully pre-fetched image:", arrayBuffer.byteLength, "bytes");
        return `data:${contentType.split(';')[0]};base64,${base64}`;
      }
    } catch (e) {
      console.log("Pre-fetch strategy failed:", e instanceof Error ? e.message : 'Unknown');
    }
  }
  
  // If direct fetch failed and we have Firecrawl, try using it to scrape the image
  if (firecrawlApiKey) {
    console.log("Trying Firecrawl screenshot fallback...");
    try {
      const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: imageUrl,
          formats: ['screenshot'],
          waitFor: 1000,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.data?.screenshot) {
          const screenshotData = data.data.screenshot;
          
          // Check if it's already base64
          if (screenshotData.startsWith('data:')) {
            console.log("Screenshot is already base64");
            return screenshotData;
          }
          
          // If it's a URL (Firecrawl returns URLs for screenshots), fetch and convert to base64
          if (screenshotData.startsWith('http')) {
            console.log("Screenshot is a URL, fetching and converting to base64...");
            try {
              const imgResponse = await fetch(screenshotData);
              if (imgResponse.ok) {
                const buffer = await imgResponse.arrayBuffer();
                const bytes = new Uint8Array(buffer);
                let binary = '';
                for (let i = 0; i < bytes.length; i++) {
                  binary += String.fromCharCode(bytes[i]);
                }
                const base64 = btoa(binary);
                const contentType = imgResponse.headers.get('content-type') || 'image/png';
                console.log("Successfully converted Firecrawl screenshot to base64");
                return `data:${contentType};base64,${base64}`;
              }
            } catch (fetchErr) {
              console.log("Failed to fetch screenshot URL:", fetchErr instanceof Error ? fetchErr.message : 'Unknown');
            }
          }
          
          // Assume it's raw base64 if not a URL or data URI
          console.log("Assuming screenshot is raw base64");
          return `data:image/png;base64,${screenshotData}`;
        }
      }
    } catch (e) {
      console.log("Firecrawl screenshot failed:", e instanceof Error ? e.message : 'Unknown');
    }
  }
  
  console.log("Could not pre-fetch image, will rely on original URL");
  return null;
}

// Simple content moderation - block explicit/rude content
const BLOCKED_TERMS = [
  'nude', 'naked', 'explicit', 'nsfw', 'porn', 'xxx', 'sexual',
  'hate', 'racist', 'violence', 'kill', 'murder', 'terrorist'
];

function isContentAppropriate(text: string): boolean {
  const lowerText = text.toLowerCase();
  return !BLOCKED_TERMS.some(term => lowerText.includes(term));
}

// Extract URL from message if pasted
function extractUrl(text: string): string | null {
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const match = text.match(urlRegex);
  return match ? match[0] : null;
}

// Check if the user is uploading images for avatar (no search needed)
function isDirectAvatarUpload(text: string, hasImages: boolean): boolean {
  if (!hasImages) return false;
  const lowerText = text.toLowerCase();
  
  // If no text or generic avatar-related text, it's a direct upload
  if (!text.trim()) return true;
  
  const avatarKeywords = [
    'set my avatar', 'update my avatar', 'use this as my avatar',
    'this is me', 'use this photo', 'set this as me', 'update avatar',
    'change my avatar', 'new avatar', 'my body photo', 'use this image',
    'set avatar', 'my photo', 'this is my body', 'use me', 'avatar',
    'update', 'use these', 'use this', 'my image', 'my images'
  ];
  return avatarKeywords.some(keyword => lowerText.includes(keyword));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log("Authentication failed: No authorization header");
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.log("Authentication failed:", authError?.message || "Invalid user");
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Authenticated user:", user.id);

    const { message, conversationHistory = [], userMeasurements, imageUrl, imageUrls, userGender, currentOutfit } = await req.json();
    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");

    if (!GOOGLE_API_KEY) {
      throw new Error("GOOGLE_AI_API_KEY is not configured");
    }

    // Content moderation check
    if (!isContentAppropriate(message || '')) {
      return new Response(
        JSON.stringify({
          message: "I'm sorry, but I can't help with that request. Please keep our conversation appropriate and focused on fashion. How can I help you find clothing today?",
          products: [],
          updateAvatar: false,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all images (support both single imageUrl and multiple imageUrls)
    const allImages = imageUrls || (imageUrl ? [imageUrl] : []);
    const hasImages = allImages.length > 0;

    // Check if user is doing a direct avatar upload (images with no/minimal text)
    if (hasImages && isDirectAvatarUpload(message || '', hasImages)) {
      console.log("Direct avatar upload detected with", allImages.length, "image(s)");
      const imageCount = allImages.length;
      return new Response(
        JSON.stringify({
          message: imageCount > 1 
            ? `Perfect! I've updated your avatar using your photo. You uploaded ${imageCount} images - I'm using the first one for your try-on. You can now try on any clothes and see how they look on you!`
            : "Perfect! I've updated your avatar with the photo you uploaded. You can now try on any clothes and see how they look on you! Just search for something you'd like to try.",
          products: [],
          updateAvatar: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for pasted URL
    const pastedUrl = extractUrl(message || '');
    let urlContext = '';
    
    if (pastedUrl && FIRECRAWL_API_KEY) {
      console.log("User pasted URL:", pastedUrl);
      
      try {
        // Scrape the URL to get product details
        const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: pastedUrl,
            formats: ["markdown"],
            onlyMainContent: true,
          }),
        });

        if (scrapeResponse.ok) {
          const scrapeData = await scrapeResponse.json();
          if (scrapeData.data?.markdown) {
            urlContext = `\n\nUSER PASTED THIS PRODUCT URL: ${pastedUrl}\nPRODUCT PAGE CONTENT:\n${scrapeData.data.markdown.slice(0, 2000)}\n\nPlease extract the product details (name, brand, price, image) from this page and offer to let them try it on.`;
          }
        }
      } catch (scrapeError) {
        console.error("Error scraping URL:", scrapeError);
        urlContext = `\n\nUser pasted a product URL: ${pastedUrl}. Try to understand what product they're looking at.`;
      }
    }

    // Build user measurements context
    let measurementsContext = "";
    if (userMeasurements) {
      const measurements: string[] = [];
      if (userMeasurements.height_cm) measurements.push(`Height: ${userMeasurements.height_cm}cm`);
      if (userMeasurements.trainer_size) measurements.push(`Trainer/Shoe Size: ${userMeasurements.trainer_size}`);
      if (userMeasurements.chest_cm) measurements.push(`Chest: ${userMeasurements.chest_cm}cm`);
      if (userMeasurements.waist_cm) measurements.push(`Waist: ${userMeasurements.waist_cm}cm`);
      if (userMeasurements.hip_cm) measurements.push(`Hip: ${userMeasurements.hip_cm}cm`);
      if (userMeasurements.inseam_cm) measurements.push(`Inseam: ${userMeasurements.inseam_cm}cm`);
      if (userMeasurements.neck_cm) measurements.push(`Neck: ${userMeasurements.neck_cm}cm`);
      if (userMeasurements.wrist_cm) measurements.push(`Wrist: ${userMeasurements.wrist_cm}cm`);
      if (userMeasurements.pants_length_cm) measurements.push(`Pants Length: ${userMeasurements.pants_length_cm}cm`);
      if (userMeasurements.shoulder_cm) measurements.push(`Shoulder: ${userMeasurements.shoulder_cm}cm`);
      
      if (measurements.length > 0) {
        measurementsContext = `\n\nUSER'S BODY MEASUREMENTS:\n${measurements.join("\n")}\n\nUse these measurements to recommend appropriate sizes.`;
      }
    }

    // Gender context for filtering
    const genderContext = userGender 
      ? `\n\nUSER'S PREFERENCE: ${userGender === 'mens' ? 'Menswear' : 'Womenswear'}. Always search for ${userGender} products unless they specifically ask for something else. Unisex items are also acceptable.`
      : '';

    // Current outfit context
    const outfitContext = currentOutfit
      ? `\n\nCURRENT OUTFIT THE USER IS BUILDING:\n${currentOutfit}\n\nWhen the user asks for "matching" items, shoes, jackets, accessories, etc., search for items that would complement the items they already have. Consider colors, styles, and brands that would work well together.`
      : '';

    // System prompt for the shopping assistant
    const systemPrompt = `You are a luxury fashion shopping assistant for StyleStream. Your PRIMARY job is to SEARCH FOR PRODUCTS immediately when users ask.

CRITICAL RULE - ALWAYS SEARCH FIRST:
When a user asks for ANY clothing item (e.g., "black jeans", "Nike hoodie", "white trainers"):
1. IMMEDIATELY call the search_products function - DO NOT ask clarifying questions first
2. Search with what they gave you - add reasonable defaults if needed
3. Only ask follow-up questions AFTER showing results if they want something more specific

OUTFIT CONTEXT:
If the user has items in their current outfit, use that context to find complementary items. For example:
- If they have a black hoodie and ask for "matching shoes", search for shoes that go well with black hoodies
- If they have Nike items and ask for more, prioritize Nike products
- Consider the overall style and suggest items that create a cohesive look

Your role:
1. Search for products IMMEDIATELY when asked - never delay with questions
2. Present results in a helpful, concise way
3. Suggest alternatives if exact matches aren't available
4. Use the customer's body measurements to recommend appropriate sizes when available

IMPORTANT - AVATAR UPDATES:
When a user uploads a photo and says things like "this is me", "use this as my avatar", etc:
1. Call the update_avatar function with confirmed: true
2. Let them know they can now try on clothes

IMPORTANT - URL HANDLING:
When a user pastes a URL from a clothing website:
1. Extract the product name, brand, price, and image from the page content
2. Format the product as a search result so they can click "Try On"

SIZE GUIDANCE based on measurements:
- Chest 86-91cm = S, 91-96cm = M, 96-101cm = L, 101-106cm = XL
- Waist 71-76cm = S, 76-81cm = M, 81-86cm = L, 86-91cm = XL

IMAGE ANALYSIS:
When the user uploads an image of clothing, analyze it and search for similar products.${measurementsContext}${genderContext}${outfitContext}${urlContext}`;

    // Build the user message content
    let userMessageContent: any = message;
    if (imageUrl) {
      userMessageContent = [
        {
          type: "text",
          text: message || "Find clothes similar to this image."
        },
        {
          type: "image_url",
          image_url: { url: imageUrl }
        }
      ];
    }

    // Build contents array for Gemini format
    const geminiContents = [
      ...conversationHistory.map((msg: any) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content) }]
      })),
      {
        role: "user",
        parts: typeof userMessageContent === "string"
          ? [{ text: userMessageContent }]
          : userMessageContent.map((item: any) => {
              if (item.type === "text") return { text: item.text };
              if (item.type === "image_url") {
                const imageData = item.image_url.url;
                if (imageData.startsWith("data:")) {
                  const [header, base64] = imageData.split(",");
                  const mimeType = header.match(/data:([^;]+)/)?.[1] || "image/jpeg";
                  return { inlineData: { mimeType, data: base64 } };
                }
                return { text: `[Image URL: ${imageData}]` };
              }
              return { text: "" };
            })
      }
    ];

    // First, get AI to understand the request using Google AI directly
    const aiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: geminiContents,
          systemInstruction: { parts: [{ text: systemPrompt }] },
          tools: [{
            functionDeclarations: [
              {
                name: "search_products",
                description: "Search for fashion products including specific items like Nike Jordan, Adidas Yeezy, etc.",
                parameters: {
                  type: "object",
                  properties: {
                    searchQuery: {
                      type: "string",
                      description: "The search query including brand and product name (e.g., 'Nike Air Jordan 1 mens', 'Ralph Lauren polo shirt')"
                    },
                    brand: {
                      type: "string",
                      description: "Specific brand if mentioned"
                    },
                    itemType: {
                      type: "string",
                      description: "Type of clothing item"
                    },
                    color: {
                      type: "string",
                      description: "Color preference"
                    },
                    maxPrice: {
                      type: "number",
                      description: "Maximum budget in GBP"
                    },
                    gender: {
                      type: "string",
                      description: "Gender: mens, womens, or unisex"
                    }
                  },
                  required: ["searchQuery"]
                }
              },
              {
                name: "get_product_from_url",
                description: "Extract product details from a pasted URL",
                parameters: {
                  type: "object",
                  properties: {
                    url: { type: "string", description: "The product URL" },
                    productName: { type: "string", description: "Extracted product name" },
                    brand: { type: "string", description: "Extracted brand name" },
                    price: { type: "string", description: "Extracted price" },
                    imageUrl: { type: "string", description: "Extracted product image URL" }
                  },
                  required: ["url", "productName"]
                }
              },
              {
                name: "update_avatar",
                description: "Update the user's avatar with their uploaded photo for try-on purposes",
                parameters: {
                  type: "object",
                  properties: {
                    confirmed: {
                      type: "boolean",
                      description: "Whether the user wants to use the uploaded image as their avatar"
                    }
                  },
                  required: ["confirmed"]
                }
              }
            ]
          }]
        }),
      }
    );

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Usage limit reached. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();

    // Parse Gemini response format
    const candidate = aiData.candidates?.[0];
    const contentParts = candidate?.content?.parts || [];

    // Extract text response
    const textPart = contentParts.find((p: any) => p.text);
    let responseText = textPart?.text || "";

    // Extract function call if present
    const functionCallPart = contentParts.find((p: any) => p.functionCall);

    let searchResults: SearchResult[] = [];
    let shouldUpdateAvatar = false;

    // Handle function calls (Gemini format)
    if (functionCallPart?.functionCall) {
      const toolCall = {
        function: {
          name: functionCallPart.functionCall.name,
          arguments: JSON.stringify(functionCallPart.functionCall.args || {})
        }
      };

      if (toolCall.function.name === "update_avatar") {
        const args = functionCallPart.functionCall.args || {};
        console.log("AI detected avatar update request:", args);
        
        if (args.confirmed && imageUrl) {
          shouldUpdateAvatar = true;
          responseText = "I've updated your avatar with the photo you uploaded. You can now try on any clothes and see how they look on you! What would you like to try on first?";
        }
      } else if (toolCall.function.name === "search_products") {
        const args = functionCallPart.functionCall.args || {};
        console.log("Searching for products:", args);

        if (FIRECRAWL_API_KEY) {
          try {
            // Include gender in search if specified
            const genderTerm = args.gender || userGender || '';
            // Expanded retailer list for better coverage
            const retailers = 'site:flannels.com OR site:asos.com OR site:selfridges.com OR site:footlocker.com OR site:jdsports.com OR site:zalando.co.uk OR site:hm.com OR site:zara.com OR site:next.co.uk OR site:riverisland.com';
            const searchQuery = `${args.searchQuery} ${genderTerm} ${retailers}`;
            
            console.log("Firecrawl search query:", searchQuery);
            
            const firecrawlResponse = await fetch("https://api.firecrawl.dev/v1/search", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                query: searchQuery,
                limit: 10,
                scrapeOptions: {
                  formats: ["markdown", "html"]
                }
              }),
            });

            if (firecrawlResponse.ok) {
              const firecrawlData = await firecrawlResponse.json();
              console.log("Firecrawl returned", firecrawlData.data?.length || 0, "results");

              if (firecrawlData.data && firecrawlData.data.length > 0) {
                // Process results and pre-fetch images in parallel
                const resultsWithImages = await Promise.all(
                  firecrawlData.data.slice(0, 8).map(async (result: any) => {
                    const content = result.markdown || result.description || "";
                    const priceMatch = content.match(/[£$€]\s*[\d,]+(?:\.\d{2})?/);
                    const ogImage = result.metadata?.ogImage || result.metadata?.image || null;
                    
                    // Try to pre-fetch the image as base64
                    let imageBase64: string | null = null;
                    if (ogImage) {
                      imageBase64 = await fetchImageAsBase64(ogImage, FIRECRAWL_API_KEY);
                    }
                    
                    return {
                      title: result.title || "Product",
                      url: result.url,
                      description: result.description || content.slice(0, 200) || "",
                      brand: args.brand,
                      price: priceMatch ? priceMatch[0] : undefined,
                      image: ogImage,
                      imageBase64: imageBase64 || undefined,
                    };
                  })
                );
                
                // Filter to only include results with valid images
                searchResults = resultsWithImages.filter(r => r.image || r.imageBase64);
                console.log("Products with valid images:", searchResults.length);
              }
            } else {
              console.error("Firecrawl search failed:", await firecrawlResponse.text());
            }
          } catch (searchError) {
            console.error("Search error:", searchError);
          }
        }

        // Generate response with results
        const resultsPrompt = searchResults.length > 0
          ? `I found these products:\n${searchResults.map((r, i) => `${i + 1}. ${r.title} - ${r.price || 'Price TBC'}`).join("\n")}\n\nProvide a brief summary.`
          : "I couldn't find exact matches. Suggest alternatives.";

        const followUpResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                ...conversationHistory.map((msg: any) => ({
                  role: msg.role === "assistant" ? "model" : "user",
                  parts: [{ text: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content) }]
                })),
                { role: "user", parts: [{ text: message }] },
                { role: "model", parts: [{ text: resultsPrompt }] }
              ],
              systemInstruction: { parts: [{ text: systemPrompt }] }
            }),
          }
        );

        if (followUpResponse.ok) {
          const followUpData = await followUpResponse.json();
          const followUpText = followUpData.candidates?.[0]?.content?.parts?.find((p: any) => p.text)?.text;
          if (followUpText) responseText = followUpText;
        }
      } else if (toolCall.function.name === "get_product_from_url") {
        const args = functionCallPart.functionCall.args || {};
        console.log("Extracted product from URL:", args);
        
        let productImage = args.imageUrl;
        let imageBase64: string | null = null;
        
        // Re-scrape the product page to get proper og:image and HTML for image extraction
        if (FIRECRAWL_API_KEY) {
          try {
            console.log("Re-scraping product page for images:", args.url);
            const productScrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                url: args.url,
                formats: ["html"],
                onlyMainContent: false,
                waitFor: 2000, // Wait for images to load
              }),
            });
            
            if (productScrapeResponse.ok) {
              const scrapeData = await productScrapeResponse.json();
              const html = scrapeData.data?.html || "";
              const metadata = scrapeData.data?.metadata || {};
              
              // Priority order for finding product image:
              // 1. og:image from metadata (usually the main product image)
              // 2. Extract high-res product images from HTML
              // 3. Fall back to AI-extracted URL
              
              let foundImage = metadata.ogImage || metadata.image;
              
              // If og:image looks like a generic social/favicon image, try to find actual product image
              if (!foundImage || foundImage.includes('favicon') || foundImage.includes('social-share') || foundImage.includes('logo')) {
                console.log("og:image looks generic, searching HTML for product images...");
                
                // Look for product images in common patterns
                const imagePatterns = [
                  // ASOS product images - their CDN uses images.asos-media.com
                  /https?:\/\/images\.asos-media\.com[^"'\s]+\.(?:jpg|jpeg|png|webp)/gi,
                  // Flannels product images
                  /https?:\/\/[^"'\s]+flannels\.com[^"'\s]*(?:_xxl|_l|_m|product)[^"'\s]*\.(?:jpg|jpeg|png|webp)/gi,
                  // Generic high-res product images
                  /https?:\/\/[^"'\s]+(?:product|item|image)[^"'\s]*(?:large|big|xxl|full|main)[^"'\s]*\.(?:jpg|jpeg|png|webp)/gi,
                  // CDN images
                  /https?:\/\/[^"'\s]*cdn[^"'\s]+\.(?:jpg|jpeg|png|webp)/gi,
                  // Any image URL from images subdomain
                  /https?:\/\/images[^"'\s]+\.(?:jpg|jpeg|png|webp)/gi,
                ];
                
                for (const pattern of imagePatterns) {
                  const matches = html.match(pattern);
                  if (matches && matches.length > 0) {
                    // Filter out tiny/icon images and pick the first good one
                    const goodImage = matches.find((url: string) => 
                      !url.includes('icon') && 
                      !url.includes('favicon') && 
                      !url.includes('logo') &&
                      !url.includes('social') &&
                      !url.includes('thumbnail') &&
                      !url.includes('_zt') && // Flannels tiny thumbnail
                      url.length < 500 // Avoid data URIs
                    );
                    if (goodImage) {
                      foundImage = goodImage;
                      console.log("Found product image in HTML:", foundImage.substring(0, 80));
                      break;
                    }
                  }
                }
              }
              
              // Also check for srcset or data-src attributes which contain better quality images
              if (!foundImage) {
                const srcsetMatch = html.match(/data-src=["']([^"']+\.(jpg|jpeg|png|webp))/i) || 
                                    html.match(/srcset=["']([^"'\s,]+\.(jpg|jpeg|png|webp))/i);
                if (srcsetMatch && srcsetMatch[1]) {
                  foundImage = srcsetMatch[1];
                  console.log("Found image from data-src/srcset:", foundImage.substring(0, 80));
                }
              }
              
              if (foundImage && !foundImage.includes('favicon') && !foundImage.includes('social-share')) {
                productImage = foundImage;
                console.log("Using scraped image:", productImage.substring(0, 80));
              }
            }
          } catch (scrapeErr) {
            console.log("Product page scrape failed:", scrapeErr instanceof Error ? scrapeErr.message : 'Unknown');
          }
        }
        
        // Pre-fetch the image as base64 to bypass retailer blocking in try-on
        if (productImage) {
          imageBase64 = await fetchImageAsBase64(productImage, FIRECRAWL_API_KEY);
        }
        
        // Create a search result from the extracted product
        searchResults = [{
          title: args.productName,
          url: args.url,
          description: `Found from your link`,
          brand: args.brand,
          price: args.price,
          image: productImage,
          imageBase64: imageBase64 || undefined, // Include cached image if fetched
        }];
        
        const cacheStatus = imageBase64 ? " Image loaded and ready!" : " Note: Image may need manual upload if try-on fails.";
        responseText = `Found it! "${args.productName}"${args.brand ? ` from ${args.brand}` : ''}${args.price ? ` at ${args.price}` : ''}.${cacheStatus} Click "Try On" to see how it looks on you!`;
      }
    }

    return new Response(
      JSON.stringify({
        message: responseText,
        products: searchResults,
        updateAvatar: shouldUpdateAvatar,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Shopping assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});