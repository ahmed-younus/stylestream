import { useState } from "react";
import { motion } from "framer-motion";
import { Trash2, Pencil, ShoppingCart, Sparkles, Copy, X, Download, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Product } from "@/types/product";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface OutfitCardProps {
  id: string;
  tryOnImage: string;
  products: Product[];
  totalPrice: number;
  createdAt: string;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onDuplicate?: (id: string) => void;
  index: number;
}

const OutfitCard = ({
  id,
  tryOnImage,
  products,
  totalPrice,
  createdAt,
  onDelete,
  onEdit,
  onDuplicate,
  index,
}: OutfitCardProps) => {
  const [showFullscreen, setShowFullscreen] = useState(false);

  const handleDownload = async () => {
    try {
      const response = await fetch(tryOnImage);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `outfit-${id}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.05 }}
      className="bg-card border border-border overflow-hidden group"
    >
      <div className="relative aspect-[3/4]">
        <img
          src={tryOnImage}
          alt="Saved outfit"
          className="w-full h-full object-cover cursor-pointer"
          loading="lazy"
          decoding="async"
          onClick={() => setShowFullscreen(true)}
        />
        
        <div className="absolute top-3 left-3">
          <div className="bg-foreground text-background px-2 py-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span className="text-[10px] font-body font-semibold uppercase tracking-[0.1em]">
              AI Try-On
            </span>
          </div>
        </div>

        {/* Fullscreen hint */}
        <button
          onClick={() => setShowFullscreen(true)}
          className="absolute bottom-3 left-3 p-2 bg-background/80 backdrop-blur-sm border border-border active:scale-95 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
          title="View fullscreen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Action buttons - visible on hover/tap */}
        <div className="absolute top-3 right-3 flex gap-2">
          {onDuplicate && (
            <button
              onClick={() => onDuplicate(id)}
              className="p-2 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 md:transition-opacity hover:bg-primary hover:text-primary-foreground border border-border active:scale-95"
              title="Duplicate outfit"
            >
              <Copy className="w-4 h-4 text-foreground group-hover:text-inherit" />
            </button>
          )}
          <button
            onClick={() => onEdit(id)}
            className="p-2 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 md:transition-opacity hover:bg-gold hover:text-noir border border-border active:scale-95"
            title="Edit outfit"
          >
            <Pencil className="w-4 h-4 text-foreground group-hover:text-inherit" />
          </button>
          <button
            onClick={() => onDelete(id)}
            className="p-2 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 md:transition-opacity hover:bg-destructive border border-border active:scale-95"
            title="Delete outfit"
          >
            <Trash2 className="w-4 h-4 text-foreground" />
          </button>
        </div>
        
        {/* Mobile-friendly edit button always visible */}
        <button
          onClick={() => onEdit(id)}
          className="md:hidden absolute bottom-3 right-3 px-3 py-2 bg-gold text-noir font-body text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5 active:scale-95"
        >
          <Pencil className="w-3 h-3" />
          Edit
        </button>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          {products.slice(0, 4).map((product) => (
            <img
              key={product.id}
              src={product.image}
              alt={product.name}
              className="w-10 h-10 object-cover border border-border"
            />
          ))}
          {products.length > 4 && (
            <div className="w-10 h-10 bg-secondary flex items-center justify-center">
              <span className="text-xs font-body text-muted-foreground">
                +{products.length - 4}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-body text-muted-foreground tracking-wide">
              {products.length} item{products.length > 1 ? 's' : ''}
            </p>
            <p className="font-display text-base font-semibold text-foreground">
              £{Number(totalPrice).toFixed(0)}
            </p>
          </div>
          <Button variant="outline" size="sm">
            <ShoppingCart className="w-3 h-3 mr-1" />
            BUY ALL
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-3 font-body tracking-wide">
          Saved {new Date(createdAt).toLocaleDateString()}
        </p>
      </div>
    </motion.div>

    {/* Fullscreen Preview Modal */}
    <Dialog open={showFullscreen} onOpenChange={setShowFullscreen}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-background/95 backdrop-blur-xl border-border overflow-hidden" aria-describedby={undefined}>
        <VisuallyHidden>
          <DialogTitle>Outfit Preview</DialogTitle>
          <DialogDescription>Full screen view of your saved outfit</DialogDescription>
        </VisuallyHidden>
        
        {/* Close button */}
        <button
          onClick={() => setShowFullscreen(false)}
          className="absolute top-4 right-4 z-50 p-3 bg-background/80 backdrop-blur-sm border border-border rounded-full hover:bg-destructive hover:text-destructive-foreground transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Download button */}
        <button
          onClick={handleDownload}
          className="absolute top-4 left-4 z-50 p-3 bg-background/80 backdrop-blur-sm border border-border rounded-full hover:bg-primary hover:text-primary-foreground transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <Download className="w-5 h-5" />
        </button>

        {/* Image */}
        <div className="w-full h-full flex items-center justify-center p-4">
          <img
            src={tryOnImage}
            alt="Outfit fullscreen view"
            className="max-w-full max-h-[85vh] object-contain"
          />
        </div>

        {/* Product info bar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/80 to-transparent">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <div className="flex items-center gap-2">
              {products.slice(0, 3).map((product) => (
                <img
                  key={product.id}
                  src={product.image}
                  alt={product.name}
                  className="w-10 h-10 object-cover border border-border rounded"
                />
              ))}
              {products.length > 3 && (
                <span className="text-xs text-muted-foreground">+{products.length - 3}</span>
              )}
            </div>
            <p className="font-display text-lg">£{Number(totalPrice).toFixed(0)}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default OutfitCard;
