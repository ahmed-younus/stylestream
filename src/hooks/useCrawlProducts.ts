import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";
import { toast } from "sonner";

interface CrawlResult {
  success: boolean;
  retailer: string;
  products: Product[];
  count: number;
  error?: string;
}

export function useCrawlProducts() {
  const [isLoading, setIsLoading] = useState(false);
  const [crawledProducts, setCrawledProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);

  const crawlRetailer = async (retailer: string): Promise<Product[]> => {
    setIsLoading(true);
    setError(null);

    try {
      toast.info(`Fetching products from ${retailer}...`, {
        description: "This may take a moment",
      });

      const { data, error: fnError } = await supabase.functions.invoke<CrawlResult>('crawl-products', {
        body: { retailer },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to crawl products');
      }

      // Map crawled products to proper Product type with category validation
      const validProducts = data.products.map((p: any) => ({
        ...p,
        category: validateCategory(p.category),
        gender: validateGender(p.gender),
      })) as Product[];

      setCrawledProducts(validProducts);
      
      toast.success(`Found ${validProducts.length} products from ${retailer}`);
      
      return validProducts;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to crawl products';
      setError(message);
      toast.error("Crawl failed", { description: message });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const clearProducts = () => {
    setCrawledProducts([]);
    setError(null);
  };

  return {
    crawlRetailer,
    clearProducts,
    crawledProducts,
    isLoading,
    error,
  };
}

// Helper functions to validate category and gender
function validateCategory(category: string): Product['category'] {
  const validCategories = [
    'tops', 't-shirts', 'shirts', 'polo-shirts', 'hoodies-sweatshirts', 'knitwear',
    'jackets-coats', 'lightweight-jackets', 'outerwear',
    'bottoms', 'jeans', 'trousers', 'shorts', 'swimwear',
    'dresses', 'suits', 'activewear', 'loungewear', 'tracksuits',
    'underwear', 'socks',
    'footwear', 'trainers', 'boots', 'loafers', 'dress-shoes', 'brogues-oxfords',
    'sliders-flip-flops', 'sandals', 'slippers',
    'bags', 'messenger-bags', 'backpacks', 'belt-bags', 'shoulder-bags',
    'travel-weekend-bags', 'laptop-bags', 'tote-bags', 'pouches', 'wash-bags', 'suitcases',
    'accessories', 'hats-caps', 'belts', 'gloves-scarves', 'wallets-cardholders',
    'jewellery', 'watches'
  ];
  if (validCategories.includes(category)) {
    return category as Product['category'];
  }
  return 'tops';
}

function validateGender(gender: string): Product['gender'] {
  const validGenders = ['mens', 'womens', 'unisex'];
  if (validGenders.includes(gender)) {
    return gender as Product['gender'];
  }
  return 'unisex';
}
