import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Shirt, Trash2, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Product } from "@/types/product";
import { Button } from "./ui/button";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface WardrobePanelProps {
  wardrobeProducts: Product[];
  onAddToTryOn: (product: Product) => void;
  onRemove: (productId: string) => void;
  selectedProductIds: string[];
  isLoading?: boolean;
}

const WardrobePanel = ({
  wardrobeProducts,
  onAddToTryOn,
  onRemove,
  selectedProductIds,
  isLoading = false,
}: WardrobePanelProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Show sign-in prompt if not logged in
  if (!user) {
    return (
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <button
          onClick={() => navigate("/auth")}
          className="w-full flex items-center justify-between p-3 hover:bg-secondary/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Shirt className="w-4 h-4 text-primary" />
            <span className="text-sm font-body font-medium">
              Your Wardrobe
            </span>
          </div>
          <span className="text-xs text-muted-foreground">Sign in to save →</span>
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-center p-4">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground ml-2">Loading wardrobe...</span>
        </div>
      </div>
    );
  }

  if (wardrobeProducts.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 text-center">
          <Shirt className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Your wardrobe is empty
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Items you try on will be saved here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Shirt className="w-4 h-4 text-primary" />
          <span className="text-sm font-body font-medium">
            Your Wardrobe ({wardrobeProducts.length})
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
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
            <div className="p-3 pt-0 space-y-2">
              {/* Product grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[200px] overflow-y-auto">
                {wardrobeProducts.slice(0, 12).map((product) => {
                  const isSelected = selectedProductIds.includes(product.id);
                  return (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative group"
                    >
                      <button
                        onClick={() => onAddToTryOn(product)}
                        disabled={isSelected}
                        className={`w-full aspect-square rounded-lg overflow-hidden border-2 transition-all touch-manipulation active:scale-95 ${
                          isSelected
                            ? "border-primary opacity-60 cursor-not-allowed"
                            : "border-transparent hover:border-primary/50 active:border-primary"
                        }`}
                      >
                        <img
                          src={product.imageBase64 || product.image}
                          alt={product.name}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                        />
                        {!isSelected && (
                          <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 md:group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                            <Plus className="w-5 h-5 text-primary" />
                          </div>
                        )}
                        {isSelected && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <span className="text-[8px] font-bold text-primary uppercase">
                              Added
                            </span>
                          </div>
                        )}
                      </button>
                      {/* Remove button - always visible on mobile, hover on desktop */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemove(product.id);
                        }}
                        className="absolute -top-1 -right-1 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity touch-manipulation active:scale-90 min-w-[24px] min-h-[24px]"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </motion.div>
                  );
                })}
              </div>

              {/* View all link if more than 12 items */}
              {wardrobeProducts.length > 12 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/wardrobe")}
                  className="w-full text-xs text-muted-foreground hover:text-foreground"
                >
                  View all {wardrobeProducts.length} items →
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WardrobePanel;