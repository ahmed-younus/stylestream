import { motion } from "framer-motion";
import { Product } from "@/types/product";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  isSelected?: boolean;
  onSelect: (product: Product) => void;
}

const ProductCard = ({ product, isSelected, onSelect }: ProductCardProps) => {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(product)}
      className={cn(
        "relative cursor-pointer overflow-hidden bg-card border transition-all duration-300",
        isSelected ? "border-foreground" : "border-border hover:border-foreground/50"
      )}
    >
      {/* Product Image */}
      <div className="aspect-[3/4] overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />
      </div>

      {/* Retailer Badge */}
      <div className="absolute top-3 left-3">
        <span className="px-2 py-1 text-[10px] font-body font-medium uppercase tracking-[0.1em] bg-background/80 backdrop-blur-sm text-foreground">
          {product.retailer}
        </span>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <p className="text-xs text-muted-foreground font-body uppercase tracking-[0.1em] mb-1">
          {product.brand}
        </p>
        <h3 className="font-display text-xs font-medium text-foreground mb-2 line-clamp-1 tracking-wide">
          {product.name}
        </h3>
        <p className="font-body text-sm font-semibold text-foreground">
          £{product.price.toFixed(2)}
        </p>
      </div>

      {/* Selected Indicator */}
      {isSelected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-foreground/5 pointer-events-none"
        />
      )}
    </motion.div>
  );
};

export default ProductCard;