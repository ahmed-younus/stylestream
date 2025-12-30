import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCw, Plus, ChevronRight } from "lucide-react";
import { Product } from "@/types/product";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface OutfitSuggestion {
  id: string;
  name: string;
  products: Product[];
  description: string;
}

interface OutfitSuggestionsProps {
  wishlistProducts: Product[];
  onApplySuggestion: (products: Product[]) => void;
}

const OutfitSuggestions = ({ wishlistProducts, onApplySuggestion }: OutfitSuggestionsProps) => {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<OutfitSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const generateSuggestions = async () => {
    if (wishlistProducts.length < 2) return;

    setIsLoading(true);
    try {
      // Group products by category
      const byCategory: Record<string, Product[]> = {};
      wishlistProducts.forEach((product) => {
        if (!byCategory[product.category]) {
          byCategory[product.category] = [];
        }
        byCategory[product.category].push(product);
      });

      // Generate outfit combinations
      const newSuggestions: OutfitSuggestion[] = [];
      const categories = Object.keys(byCategory);

      // Create up to 3 outfit combinations
      for (let i = 0; i < Math.min(3, wishlistProducts.length); i++) {
        const outfitProducts: Product[] = [];
        
        // Pick one item from each category (rotating through options)
        categories.forEach((cat) => {
          const items = byCategory[cat];
          const item = items[i % items.length];
          if (item && !outfitProducts.some((p) => p.category === cat)) {
            outfitProducts.push(item);
          }
        });

        if (outfitProducts.length >= 2) {
          const names = outfitProducts.map((p) => p.brand).slice(0, 2);
          newSuggestions.push({
            id: `suggestion-${i}`,
            name: `${names.join(" × ")} Look`,
            products: outfitProducts,
            description: `${outfitProducts.length} items · £${outfitProducts.reduce((sum, p) => sum + p.price, 0).toFixed(0)}`,
          });
        }
      }

      setSuggestions(newSuggestions);
    } catch (error) {
      console.error("Error generating suggestions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (wishlistProducts.length >= 2) {
      generateSuggestions();
    } else {
      setSuggestions([]);
    }
  }, [wishlistProducts]);

  if (wishlistProducts.length < 2) return null;

  return (
    <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-primary/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-body font-medium">
            Outfit Ideas ({suggestions.length})
          </span>
        </div>
        <ChevronRight
          className={`w-4 h-4 text-muted-foreground transition-transform ${
            isExpanded ? "rotate-90" : ""
          }`}
        />
      </button>

      {/* Expandable content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 pt-0 space-y-3">
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <RefreshCw className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : suggestions.length > 0 ? (
                <>
                  {suggestions.map((suggestion) => (
                    <motion.div
                      key={suggestion.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-background/80 rounded-lg p-3 border border-border"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h4 className="text-sm font-medium">{suggestion.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {suggestion.description}
                          </p>
                        </div>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => onApplySuggestion(suggestion.products)}
                          className="flex-shrink-0"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Try
                        </Button>
                      </div>
                      
                      {/* Product thumbnails */}
                      <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
                        {suggestion.products.map((product) => (
                          <img
                            key={product.id}
                            src={product.imageBase64 || product.image}
                            alt={product.name}
                            className="w-10 h-10 rounded object-cover flex-shrink-0 border border-border"
                          />
                        ))}
                      </div>
                    </motion.div>
                  ))}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={generateSuggestions}
                    className="w-full text-xs"
                    disabled={isLoading}
                  >
                    <RefreshCw className={`w-3 h-3 mr-1 ${isLoading ? "animate-spin" : ""}`} />
                    Generate New Ideas
                  </Button>
                </>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Add more products to get outfit suggestions
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OutfitSuggestions;
