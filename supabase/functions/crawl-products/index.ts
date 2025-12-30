import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CrawledProduct {
  id: string;
  name: string;
  brand: string;
  retailer: string;
  price: number;
  currency: string;
  image: string;
  category: string;
  gender: string;
  description: string;
  affiliateUrl: string;
}

// Retailer configurations with their product page URLs
const retailerConfigs: Record<string, { 
  baseUrl: string; 
  searchUrls: string[];
  name: string;
}> = {
  asos: {
    name: 'ASOS',
    baseUrl: 'https://www.asos.com',
    searchUrls: [
      'https://www.asos.com/women/new-in/new-in-clothing/cat/?cid=2623',
      'https://www.asos.com/men/new-in/new-in-clothing/cat/?cid=6993',
    ]
  },
  hm: {
    name: 'H&M',
    baseUrl: 'https://www2.hm.com',
    searchUrls: [
      'https://www2.hm.com/en_gb/women/new-arrivals/clothes.html',
      'https://www2.hm.com/en_gb/men/new-arrivals/clothes.html',
    ]
  },
  zara: {
    name: 'Zara',
    baseUrl: 'https://www.zara.com',
    searchUrls: [
      'https://www.zara.com/uk/en/woman-new-in-l1180.html',
      'https://www.zara.com/uk/en/man-new-in-l732.html',
    ]
  },
  next: {
    name: 'Next',
    baseUrl: 'https://www.next.co.uk',
    searchUrls: [
      'https://www.next.co.uk/shop/gender-women-productaffiliation-clothing',
      'https://www.next.co.uk/shop/gender-men-productaffiliation-clothing',
    ]
  },
  boohoo: {
    name: 'Boohoo',
    baseUrl: 'https://www.boohoo.com',
    searchUrls: [
      'https://www.boohoo.com/womens/new-in',
      'https://www.boohoo.com/mens/new-in',
    ]
  },
  prettylittlething: {
    name: 'PrettyLittleThing',
    baseUrl: 'https://www.prettylittlething.com',
    searchUrls: [
      'https://www.prettylittlething.com/new-in.html',
    ]
  },
  riverisland: {
    name: 'River Island',
    baseUrl: 'https://www.riverisland.com',
    searchUrls: [
      'https://www.riverisland.com/c/women/new-in',
      'https://www.riverisland.com/c/men/new-in',
    ]
  },
  flannels: {
    name: 'Flannels',
    baseUrl: 'https://www.flannels.com',
    searchUrls: [
      'https://www.flannels.com/women/clothing',
      'https://www.flannels.com/men/clothing',
    ]
  },
  shein: {
    name: 'SHEIN',
    baseUrl: 'https://uk.shein.com',
    searchUrls: [
      'https://uk.shein.com/Women-Clothing-c-2030.html',
      'https://uk.shein.com/Men-Clothing-c-2155.html',
    ]
  },
  marksandspencer: {
    name: 'Marks & Spencer',
    baseUrl: 'https://www.marksandspencer.com',
    searchUrls: [
      'https://www.marksandspencer.com/l/women/new-in',
      'https://www.marksandspencer.com/l/men/new-in',
    ]
  },
  primark: {
    name: 'Primark',
    baseUrl: 'https://www.primark.com',
    searchUrls: [
      'https://www.primark.com/en-gb/c/women/womens-clothing',
      'https://www.primark.com/en-gb/c/men/mens-clothing',
    ]
  }
};

// Determine category from product name/description
function inferCategory(text: string): string {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('dress') || lowerText.includes('gown')) return 'dresses';
  if (lowerText.includes('coat') || lowerText.includes('jacket') || lowerText.includes('blazer') || lowerText.includes('cardigan') || lowerText.includes('puffer')) return 'jackets-coats';
  if (lowerText.includes('jean') || lowerText.includes('denim')) return 'jeans';
  if (lowerText.includes('jogger') || lowerText.includes('tracksuit') || lowerText.includes('sweatpant')) return 'trousers';
  if (lowerText.includes('trouser') || lowerText.includes('pant') || lowerText.includes('chino')) return 'trousers';
  if (lowerText.includes('short')) return 'shorts';
  if (lowerText.includes('skirt') || lowerText.includes('legging')) return 'bottoms';
  if (lowerText.includes('hoodie') || lowerText.includes('sweatshirt')) return 'hoodies-sweatshirts';
  if (lowerText.includes('top') || lowerText.includes('t-shirt') || lowerText.includes('tee')) return 't-shirts';
  if (lowerText.includes('shirt') || lowerText.includes('blouse')) return 'shirts';
  if (lowerText.includes('jumper') || lowerText.includes('sweater') || lowerText.includes('knit')) return 'knitwear';
  if (lowerText.includes('trainer') || lowerText.includes('sneaker')) return 'trainers';
  if (lowerText.includes('shoe')) return 'footwear';
  if (lowerText.includes('boot')) return 'boots';
  if (lowerText.includes('sandal') || lowerText.includes('slider')) return 'sandals';
  if (lowerText.includes('bag') || lowerText.includes('backpack')) return 'bags';
  if (lowerText.includes('hat') || lowerText.includes('cap') || lowerText.includes('beanie')) return 'hats-caps';
  if (lowerText.includes('watch')) return 'watches';
  if (lowerText.includes('scarf') || lowerText.includes('belt') || lowerText.includes('jewel') || lowerText.includes('chain') || lowerText.includes('necklace')) return 'accessories';
  return 'tops'; // Default fallback
}

// Determine gender from URL or text
function inferGender(url: string, text: string): string {
  const lowerUrl = url.toLowerCase();
  const lowerText = text.toLowerCase();
  if (lowerUrl.includes('women') || lowerUrl.includes('woman') || lowerText.includes('women')) return 'womens';
  if (lowerUrl.includes('men') || lowerUrl.includes('man') || lowerText.includes('mens')) return 'mens';
  return 'unisex';
}

// Parse price from text
function parsePrice(priceText: string): number {
  const match = priceText.match(/[\d,.]+/);
  if (match) {
    return parseFloat(match[0].replace(',', ''));
  }
  return 0;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { retailer, url } = await req.json();
    
    // Handle single URL product extraction
    if (url) {
      console.log(`Extracting product from URL: ${url}`);
      
      const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
      if (!firecrawlApiKey) {
        return new Response(
          JSON.stringify({ error: 'Firecrawl API key not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      try {
        const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: url,
            formats: ['markdown'],
            onlyMainContent: true,
            waitFor: 3000,
          }),
        });

        if (!scrapeResponse.ok) {
          const errorText = await scrapeResponse.text();
          console.error(`Firecrawl error: ${errorText}`);
          return new Response(
            JSON.stringify({ error: 'Failed to fetch product details', product: null }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const scrapeData = await scrapeResponse.json();
        const markdown = scrapeData.data?.markdown || '';
        const metadata = scrapeData.data?.metadata || {};

        // Extract product details
        const lines = markdown.split('\n').filter((l: string) => l.trim());
        const title = metadata.title || lines[0]?.replace(/^#+\s*/, '') || '';
        
        // Try to find price
        const priceMatch = markdown.match(/£\s*([\d,.]+)/);
        const price = priceMatch ? priceMatch[0] : '';
        
        // Try to find image from multiple sources
        let image = '';
        const imageMatch = markdown.match(/!\[.*?\]\((https?:\/\/[^\s)]+(?:\.jpg|\.jpeg|\.png|\.webp)[^\s)]*)\)/i);
        if (imageMatch) {
          image = imageMatch[1];
        } else if (metadata.image) {
          image = metadata.image;
        } else if (metadata.ogImage) {
          image = metadata.ogImage;
        }

        // Infer brand from URL
        let brand = '';
        try {
          const urlObj = new URL(url);
          const hostname = urlObj.hostname.replace('www.', '').split('.')[0];
          brand = hostname.charAt(0).toUpperCase() + hostname.slice(1);
        } catch {
          brand = 'Unknown';
        }

        const product = {
          title: title.substring(0, 100) || 'Unknown Product',
          brand: brand,
          price: price,
          image: image,
          category: inferCategory(title + ' ' + markdown),
          url: url,
        };

        console.log(`Extracted product: ${product.title}`);

        return new Response(
          JSON.stringify({ success: true, product }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (scrapeError) {
        console.error('Scrape error:', scrapeError);
        return new Response(
          JSON.stringify({ error: 'Failed to scrape URL', product: null }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // Handle retailer-based crawling (original functionality)
    if (!retailer) {
      return new Response(
        JSON.stringify({ error: 'Either retailer or url parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const retailerKey = retailer.toLowerCase().replace(/[^a-z]/g, '');
    const config = retailerConfigs[retailerKey];
    
    if (!config) {
      return new Response(
        JSON.stringify({ 
          error: `Retailer '${retailer}' is not supported. Supported retailers: ${Object.keys(retailerConfigs).join(', ')}` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlApiKey) {
      return new Response(
        JSON.stringify({ error: 'Firecrawl API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Crawling products from ${config.name}...`);

    const allProducts: CrawledProduct[] = [];
    
    // Crawl each URL for the retailer
    for (const url of config.searchUrls) {
      console.log(`Scraping: ${url}`);
      
      try {
        const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: url,
            formats: ['markdown', 'links'],
            onlyMainContent: true,
            waitFor: 3000,
          }),
        });

        if (!scrapeResponse.ok) {
          const errorText = await scrapeResponse.text();
          console.error(`Firecrawl error for ${url}: ${errorText}`);
          continue;
        }

        const scrapeData = await scrapeResponse.json();
        console.log(`Scraped ${url}, got ${scrapeData.data?.links?.length || 0} links`);
        
        // Parse the markdown content to extract product information
        const markdown = scrapeData.data?.markdown || '';
        const links = scrapeData.data?.links || [];
        
        // Filter links that look like product pages
        const productLinks = links.filter((link: string) => {
          const lowerLink = link.toLowerCase();
          return (lowerLink.includes('/p/') || 
                  lowerLink.includes('/product') || 
                  lowerLink.includes('/prd/') ||
                  lowerLink.includes('-p-') ||
                  /\/[a-z0-9-]+-\d+/.test(lowerLink)) &&
                 !lowerLink.includes('category') &&
                 !lowerLink.includes('/c/');
        }).slice(0, 20); // Limit to 20 product links per category

        console.log(`Found ${productLinks.length} product links`);

        // Scrape individual product pages
        for (const productUrl of productLinks.slice(0, 10)) { // Limit to 10 products to avoid rate limits
          try {
            const productResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${firecrawlApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                url: productUrl,
                formats: ['markdown'],
                onlyMainContent: true,
              }),
            });

            if (!productResponse.ok) {
              console.error(`Failed to scrape product: ${productUrl}`);
              continue;
            }

            const productData = await productResponse.json();
            const productMarkdown = productData.data?.markdown || '';
            const metadata = productData.data?.metadata || {};

            // Extract product details from markdown
            const lines = productMarkdown.split('\n').filter((l: string) => l.trim());
            const title = metadata.title || lines[0]?.replace(/^#+\s*/, '') || 'Unknown Product';
            
            // Try to find price
            const priceMatch = productMarkdown.match(/£\s*([\d,.]+)/);
            const price = priceMatch ? parsePrice(priceMatch[1]) : 0;
            
            // Try to find image
            const imageMatch = productMarkdown.match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/);
            const image = imageMatch ? imageMatch[1] : metadata.image || '';

            if (title && price > 0) {
              const product: CrawledProduct = {
                id: `${retailerKey}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: title.substring(0, 100),
                brand: config.name,
                retailer: config.name,
                price: price,
                currency: 'GBP',
                image: image || `https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400&h=600&fit=crop`,
                category: inferCategory(title + ' ' + productMarkdown),
                gender: inferGender(productUrl, productMarkdown),
                description: metadata.description || title,
                affiliateUrl: productUrl,
              };
              
              allProducts.push(product);
              console.log(`Added product: ${product.name} - £${product.price}`);
            }
          } catch (productError) {
            console.error(`Error scraping product ${productUrl}:`, productError);
          }
        }
      } catch (urlError) {
        console.error(`Error scraping ${url}:`, urlError);
      }
    }

    console.log(`Total products crawled: ${allProducts.length}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        retailer: config.name,
        products: allProducts,
        count: allProducts.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error in crawl-products function:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
