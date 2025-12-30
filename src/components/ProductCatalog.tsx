import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Loader2, RefreshCw, Filter, X } from "lucide-react";
import { Product } from "@/types/product";
import { sampleProducts } from "@/data/sampleProducts";
import ProductCard from "./ProductCard";
import { cn } from "@/lib/utils";
import { useCrawlProducts } from "@/hooks/useCrawlProducts";
import { Button } from "./ui/button";
import { FilterSection, FilterGroupSection } from "./FilterSection";
import {
  occasionFilters,
  designerFilters,
  clothingFilters,
  footwearFilters,
  bagFilters,
  accessoryFilters,
  retailerFilters,
  legacyCategoryMap,
} from "@/data/filterCategories";
import { ScrollArea } from "./ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ProductCatalogProps {
  onProductSelect: (product: Product) => void;
  selectedProducts: Product[];
}

const genderOptions = [
  { id: "all", label: "All" },
  { id: "womens", label: "Womenswear" },
  { id: "mens", label: "Menswear" },
];

const ProductCatalog = ({ onProductSelect, selectedProducts }: ProductCatalogProps) => {
  const { user } = useAuth();
  const [activeGender, setActiveGender] = useState("all");
  const [activeRetailer, setActiveRetailer] = useState<string | null>(null);
  const [activeOccasions, setActiveOccasions] = useState<string[]>([]);
  const [activeDesigners, setActiveDesigners] = useState<string[]>([]);
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  const { crawlRetailer, crawledProducts, isLoading, clearProducts } = useCrawlProducts();

  // Fetch user's gender preference and set initial filter
  useEffect(() => {
    const fetchGenderPref = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from("profiles")
        .select("gender_preference")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (data?.gender_preference) {
        setActiveGender(data.gender_preference);
      }
    };
    
    fetchGenderPref();
  }, [user]);

  // Combine sample products with crawled products
  const allProducts = [...sampleProducts, ...crawledProducts];

  const toggleFilter = (list: string[], id: string): string[] => {
    return list.includes(id) ? list.filter(x => x !== id) : [...list, id];
  };

  const filteredProducts = allProducts.filter((product) => {
    // Gender filter
    const genderMatch = activeGender === "all" || 
      product.gender === activeGender || 
      product.gender === "unisex";
    
    // Retailer filter
    const retailerMatch = !activeRetailer || product.retailer === activeRetailer;
    
    // Designer/Brand filter - match against brand name
    const designerMatch = activeDesigners.length === 0 || 
      activeDesigners.some(d => {
        const brandLower = product.brand.toLowerCase();
        const designerName = d.replace(/-/g, ' ').toLowerCase();
        return brandLower.includes(designerName) || designerName.includes(brandLower);
      });
    
    // Category filter - direct match on product category
    const categoryMatch = activeCategories.length === 0 || 
      activeCategories.includes(product.category);
    
    // Occasion filter
    const occasionMatch = activeOccasions.length === 0 || 
      (product.occasion && product.occasion.some(o => activeOccasions.includes(o)));

    return genderMatch && retailerMatch && designerMatch && categoryMatch && occasionMatch;
  });

  const isProductSelected = (productId: string) => {
    return selectedProducts.some(p => p.id === productId);
  };

  const handleCrawlRetailer = async () => {
    if (activeRetailer) {
      await crawlRetailer(activeRetailer);
    }
  };

  const clearAllFilters = () => {
    setActiveGender("all");
    setActiveRetailer(null);
    setActiveOccasions([]);
    setActiveDesigners([]);
    setActiveCategories([]);
  };

  const activeFilterCount = 
    (activeGender !== "all" ? 1 : 0) +
    (activeRetailer ? 1 : 0) +
    activeOccasions.length +
    activeDesigners.length +
    activeCategories.length;

  const currentRetailer = retailerFilters.find(r => r.id === activeRetailer);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingBag className="w-5 h-5 text-gold" />
          <h3 className="font-display text-xl font-medium">Shop the Look</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "gap-2",
            showFilters && "bg-gold/10 border-gold"
          )}
        >
          <Filter className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-gold text-noir text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Active Filters Bar */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Active:</span>
          {activeGender !== "all" && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gold/20 text-gold text-xs rounded-full">
              {activeGender === "mens" ? "Men" : "Women"}
              <X className="w-3 h-3 cursor-pointer" onClick={() => setActiveGender("all")} />
            </span>
          )}
          {activeRetailer && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gold/20 text-gold text-xs rounded-full">
              {currentRetailer?.label}
              <X className="w-3 h-3 cursor-pointer" onClick={() => setActiveRetailer(null)} />
            </span>
          )}
          {activeOccasions.map(o => (
            <span key={o} className="inline-flex items-center gap-1 px-2 py-1 bg-gold/20 text-gold text-xs rounded-full">
              {occasionFilters.find(x => x.id === o)?.label}
              <X className="w-3 h-3 cursor-pointer" onClick={() => setActiveOccasions(toggleFilter(activeOccasions, o))} />
            </span>
          ))}
          {activeDesigners.map(d => (
            <span key={d} className="inline-flex items-center gap-1 px-2 py-1 bg-gold/20 text-gold text-xs rounded-full">
              {designerFilters.find(x => x.id === d)?.label}
              <X className="w-3 h-3 cursor-pointer" onClick={() => setActiveDesigners(toggleFilter(activeDesigners, d))} />
            </span>
          ))}
          {activeCategories.map(c => (
            <span key={c} className="inline-flex items-center gap-1 px-2 py-1 bg-gold/20 text-gold text-xs rounded-full">
              {c.replace(/-/g, ' ')}
              <X className="w-3 h-3 cursor-pointer" onClick={() => setActiveCategories(toggleFilter(activeCategories, c))} />
            </span>
          ))}
          <button 
            onClick={clearAllFilters}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-card border border-border rounded-lg p-4"
        >
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {/* Gender Toggle */}
              <div className="pb-3 border-b border-border/50">
                <span className="text-xs font-body font-semibold uppercase tracking-wider text-foreground block mb-2">
                  Gender
                </span>
                <div className="flex gap-2">
                  {genderOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setActiveGender(opt.id)}
                      className={cn(
                        "px-3 py-1.5 text-xs font-body font-medium rounded-full transition-all duration-300",
                        activeGender === opt.id
                          ? "bg-gold text-noir"
                          : "bg-secondary border border-border text-foreground hover:border-gold/50"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Occasion Filters */}
              <FilterSection
                title="Shop By Occasion"
                options={occasionFilters}
                selectedIds={activeOccasions}
                onToggle={(id) => setActiveOccasions(toggleFilter(activeOccasions, id))}
                defaultExpanded
              />

              {/* Designer Filters */}
              <FilterSection
                title="Popular Designers"
                options={designerFilters}
                selectedIds={activeDesigners}
                onToggle={(id) => setActiveDesigners(toggleFilter(activeDesigners, id))}
              />

              {/* Retailer Filters */}
              <FilterSection
                title="Retailers"
                options={retailerFilters}
                selectedIds={activeRetailer ? [activeRetailer] : []}
                onToggle={(id) => {
                  setActiveRetailer(activeRetailer === id ? null : id);
                  clearProducts();
                }}
              />

              {/* Clothing Categories */}
              {clothingFilters.map(group => (
                <FilterGroupSection
                  key={group.id}
                  group={group}
                  selectedIds={activeCategories}
                  onToggle={(id) => setActiveCategories(toggleFilter(activeCategories, id))}
                  defaultExpanded
                />
              ))}

              {/* Footwear */}
              {footwearFilters.map(group => (
                <FilterGroupSection
                  key={group.id}
                  group={group}
                  selectedIds={activeCategories}
                  onToggle={(id) => setActiveCategories(toggleFilter(activeCategories, id))}
                />
              ))}

              {/* Bags */}
              {bagFilters.map(group => (
                <FilterGroupSection
                  key={group.id}
                  group={group}
                  selectedIds={activeCategories}
                  onToggle={(id) => setActiveCategories(toggleFilter(activeCategories, id))}
                />
              ))}

              {/* Accessories */}
              {accessoryFilters.map(group => (
                <FilterGroupSection
                  key={group.id}
                  group={group}
                  selectedIds={activeCategories}
                  onToggle={(id) => setActiveCategories(toggleFilter(activeCategories, id))}
                />
              ))}
            </div>
          </ScrollArea>
        </motion.div>
      )}

      {/* Fetch Live Products Button */}
      {activeRetailer && (
        <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-lg border border-border">
          <div className="flex-1">
            <p className="text-sm font-body text-foreground">
              Fetch live products from <span className="font-semibold text-gold">{currentRetailer?.label}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Crawl the retailer's website to get their latest inventory
            </p>
          </div>
          <Button
            onClick={handleCrawlRetailer}
            disabled={isLoading}
            size="sm"
            className="bg-gold text-noir hover:bg-gold/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Fetching...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Fetch Products
              </>
            )}
          </Button>
        </div>
      )}

      {/* Product Grid */}
      <motion.div
        layout
        className="grid grid-cols-2 gap-4"
      >
        {filteredProducts.map((product, index) => (
          <motion.div
            key={product.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <ProductCard
              product={product}
              isSelected={isProductSelected(product.id)}
              onSelect={onProductSelect}
            />
          </motion.div>
        ))}
      </motion.div>

      {filteredProducts.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground font-body">No products found</p>
          {activeRetailer && (
            <p className="text-sm text-muted-foreground mt-2">
              Click "Fetch Products" to load items from {currentRetailer?.label}
            </p>
          )}
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
          <p className="text-muted-foreground font-body">Crawling {currentRetailer?.label} for products...</p>
        </div>
      )}
    </div>
  );
};

export default ProductCatalog;
