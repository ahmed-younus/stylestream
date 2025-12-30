import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCw, ShoppingCart, Heart, Upload, ImagePlus, Layers, Download, X, Maximize2 } from "lucide-react";
import { Product } from "@/types/product";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import SaveOutfitDialog from "./SaveOutfitDialog";
import { useGenerationQueue } from "@/hooks/useGenerationQueue";
import { compressImage } from "@/utils/imageCompression";
import { uploadCompressedImage } from "@/utils/imageStorage";
import { invalidateOutfitsCache } from "@/pages/MyOutfits";

interface TryOnViewProps {
  avatarImage: string;
  faceImage?: string;
  selectedProducts: Product[];
  onAddToCart: (products: Product[]) => void;
  onLike: (products: Product[]) => void;
}

const TryOnView = ({ avatarImage, faceImage, selectedProducts, onAddToCart, onLike }: TryOnViewProps) => {
  const [tryOnImage, setTryOnImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customImages, setCustomImages] = useState<Record<string, string>>({});
  const [failedProductIds, setFailedProductIds] = useState<string[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToQueue, addBulkToQueue, queuedCount, generatingCount } = useGenerationQueue();
  const previousAvatarRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingForProductId, setUploadingForProductId] = useState<string | null>(null);

  // Track avatar changes - but DON'T auto-regenerate
  // Users selecting from saved outfits already have a generated image
  useEffect(() => {
    previousAvatarRef.current = avatarImage;
  }, [avatarImage]);

  const handleCustomImageUpload = async (productId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    try {
      // Compress the image before storing
      const compressedBlob = await compressImage(file, 1200, 1200, 0.85);
      
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setCustomImages(prev => ({ ...prev, [productId]: base64 }));
        setFailedProductIds(prev => prev.filter(id => id !== productId));
        toast.success(`Image compressed & added! (${(compressedBlob.size / 1024).toFixed(0)}KB)`);
      };
      reader.readAsDataURL(compressedBlob);
    } catch (error) {
      console.error("Compression failed, using original:", error);
      // Fallback to original
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setCustomImages(prev => ({ ...prev, [productId]: base64 }));
        setFailedProductIds(prev => prev.filter(id => id !== productId));
        toast.success("Product image added! Click Try On to continue.");
      };
      reader.readAsDataURL(file);
    }
    setUploadingForProductId(null);
  };

  // Clean product images (remove website UI from screenshots) before try-on
  const cleanProductImage = async (imageUrl: string, category: string): Promise<string> => {
    // Skip cleaning for pre-cached base64 images (already clean) or if it's a short base64 (likely already processed)
    if (imageUrl.startsWith('data:') && imageUrl.length > 50000) {
      // Large base64 images might be screenshots - try to clean them
      try {
        console.log('Cleaning screenshot image for category:', category);
        const { data, error } = await supabase.functions.invoke("clean-product-image", {
          body: { imageUrl, category }
        });
        
        if (error) {
          console.warn('Image cleaning failed, using original:', error);
          return imageUrl;
        }
        
        if (data?.cleanedImage && data.wasCleaned) {
          console.log('Successfully cleaned product image');
          return data.cleanedImage;
        }
        
        return imageUrl;
      } catch (err) {
        console.warn('Image cleaning error, using original:', err);
        return imageUrl;
      }
    }
    return imageUrl;
  };

  const generateTryOn = async () => {
    if (selectedProducts.length === 0 || !avatarImage) return;

    setIsGenerating(true);
    setError(null);
    setTryOnImage(null);
    setFailedProductIds([]);

    // Client-side timeout (120 seconds - increased for image cleaning)
    const timeoutId = setTimeout(() => {
      setIsGenerating(false);
      setError("Try-on is taking longer than expected. The AI might be busy - please try again.");
      toast.error("Try-on timed out. Please try again.");
    }, 120000);

    try {
      console.log('Starting try-on generation with', selectedProducts.length, 'products');
      console.log('Avatar image type:', avatarImage.startsWith('data:') ? 'base64' : 'URL');
      console.log('Products:', selectedProducts.map(p => ({ id: p.id, name: p.name, hasImage: !!p.image })));

      // Pre-process images: clean screenshots with custom uploads
      const processedProducts = await Promise.all(
        selectedProducts.map(async (p) => {
          // Get the image to use (priority: custom > cached > original)
          let imageToUse = customImages[p.id] || p.imageBase64 || p.image;
          
          // If this is a custom uploaded image (likely a screenshot), clean it
          if (customImages[p.id]) {
            toast.loading(`Cleaning ${p.category} image...`, { id: `clean-${p.id}` });
            imageToUse = await cleanProductImage(customImages[p.id], p.category);
            toast.dismiss(`clean-${p.id}`);
          }
          
          return {
            image: imageToUse,
            description: `${p.brand} ${p.name} - ${p.description}`,
            category: p.category
          };
        })
      );

      const { data, error: fnError } = await supabase.functions.invoke("try-on", {
        body: {
          avatarImage,
          faceImage, // Pass face reference for identity preservation
          products: processedProducts
        }
      });

      clearTimeout(timeoutId);

      if (fnError) {
        console.error('Try-on function error:', fnError);
        throw new Error(fnError.message);
      }

      if (data.error) {
        console.error('Try-on returned error:', data.error);
        // Check if we can retry with custom images
        if (data.canRetryWithCustomImages && data.failedProducts) {
          const failedIds = selectedProducts
            .filter(p => data.failedProducts.some((fp: any) => 
              fp.description.includes(p.name) || fp.image === p.image
            ))
            .map(p => p.id);
          setFailedProductIds(failedIds);
          setError("Some product images couldn't be loaded. Upload screenshots for the highlighted items below.");
          return;
        }
        throw new Error(data.error);
      }

      console.log('Try-on successful, received image');
      setTryOnImage(data.tryOnImage);
      setCustomImages({});
      toast.success("Try-on generated successfully!");
    } catch (err) {
      clearTimeout(timeoutId);
      console.error("Try-on error:", err);
      const message = err instanceof Error ? err.message : "Failed to generate try-on";
      setError(message);
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveClick = () => {
    if (!tryOnImage || selectedProducts.length === 0) return;
    
    if (!user) {
      toast.error("Please sign in to save outfits");
      navigate("/auth");
      return;
    }

    setShowSaveDialog(true);
  };

  const saveOutfit = async (caption: string, isPublic: boolean) => {
    if (!tryOnImage || selectedProducts.length === 0 || !user) {
      console.error("Save validation failed:", { hasTryOnImage: !!tryOnImage, productsCount: selectedProducts.length, hasUser: !!user });
      toast.error("Cannot save: Missing try-on image or products");
      return;
    }

    setIsSaving(true);
    try {
      const totalPrice = selectedProducts.reduce((sum, p) => sum + p.price, 0);
      
      toast.loading("Uploading images...", { id: "save-outfit" });
      
      // Upload images to storage instead of storing base64 in database
      const [tryOnUrl, avatarUrl] = await Promise.all([
        uploadCompressedImage(tryOnImage, user.id, 'try-on'),
        uploadCompressedImage(avatarImage, user.id, 'avatar')
      ]);
      
      console.log("Images uploaded, saving outfit...");
      
      // Store product data without large base64 images
      const cleanProducts = selectedProducts.map(p => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        price: p.price,
        category: p.category,
        image: p.image, // Keep original URL, not base64
        affiliateUrl: p.affiliateUrl
      }));
      
      const { data, error } = await supabase.from("saved_outfits").insert([{
        user_id: user.id,
        try_on_image: tryOnUrl,
        avatar_image: avatarUrl,
        products: cleanProducts,
        total_price: totalPrice,
        caption: caption || null,
        is_public: isPublic
      }]).select("id").single();

      if (error) {
        console.error("Supabase save error:", error);
        throw error;
      }

      console.log("Outfit saved successfully:", data);
      toast.success(isPublic ? "Outfit saved and shared to feed!" : "Outfit saved privately!", { id: "save-outfit" });
      setShowSaveDialog(false);
      
      // Invalidate cache so My Outfits auto-refreshes
      invalidateOutfitsCache(user.id);
      
      onLike(selectedProducts);
    } catch (err: any) {
      console.error("Save outfit error:", err);
      toast.error(err?.message || "Failed to save outfit", { id: "save-outfit" });
    } finally {
      setIsSaving(false);
    }
  };

  const displayImage = tryOnImage || avatarImage;
  const totalPrice = selectedProducts.reduce((sum, p) => sum + p.price, 0);

  // Download image with watermark
  const handleDownloadWithWatermark = useCallback(async () => {
    if (!tryOnImage) return;

    try {
      toast.loading("Preparing download...", { id: "download" });

      // Create canvas for watermarking
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = tryOnImage;
      });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");

      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Add watermark
      const watermarkText = "Made with DressMyAI";
      const fontSize = Math.max(16, img.width * 0.035);
      ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
      
      // Measure text for positioning
      const textMetrics = ctx.measureText(watermarkText);
      const padding = fontSize * 0.6;
      const x = canvas.width - textMetrics.width - padding;
      const y = canvas.height - padding;

      // Draw semi-transparent background for readability
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(
        x - padding / 2,
        y - fontSize,
        textMetrics.width + padding,
        fontSize + padding / 2
      );

      // Draw watermark text
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.fillText(watermarkText, x, y);

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error("Failed to create image", { id: "download" });
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `dressmyai-outfit-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success("Saved to photos!", { id: "download" });
      }, "image/png", 0.95);
    } catch (err) {
      console.error("Download error:", err);
      toast.error("Failed to download image", { id: "download" });
    }
  }, [tryOnImage]);


  return (
    <div className="relative w-full">
      {/* Fullscreen Modal for Mobile */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-background flex flex-col"
            onClick={() => setIsFullscreen(false)}
          >
            {/* Close button */}
            <div className="absolute top-4 right-4 z-10">
              <Button
                variant="secondary"
                size="icon"
                className="min-w-[44px] min-h-[44px] rounded-full shadow-lg touch-manipulation"
                onClick={() => setIsFullscreen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Fullscreen image */}
            <div className="flex-1 flex items-center justify-center p-4">
              <img
                src={displayImage}
                alt="Try-on fullscreen"
                className="max-w-full max-h-full object-contain rounded-xl"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            
            {/* Actions at bottom */}
            <div className="p-4 pb-8 flex justify-center gap-3">
              {tryOnImage && (
                <>
                  <Button
                    variant="outline"
                    size="lg"
                    className="min-h-[48px] touch-manipulation"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadWithWatermark();
                    }}
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Download
                  </Button>
                  <Button
                    size="lg"
                    className="min-h-[48px] touch-manipulation"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsFullscreen(false);
                      handleSaveClick();
                    }}
                  >
                    <Heart className="w-5 h-5 mr-2" />
                    Save
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Image Display - Increased mobile height */}
      <div 
        className="relative aspect-[3/4] max-h-[55vh] sm:max-h-[50vh] md:max-h-[65vh] lg:max-h-[70vh] w-full max-w-[280px] sm:max-w-[300px] md:max-w-[380px] mx-auto rounded-xl sm:rounded-2xl overflow-hidden bg-card border border-border cursor-pointer touch-manipulation"
        onClick={() => !isGenerating && setIsFullscreen(true)}
      >
        {/* Tap to enlarge hint */}
        {!isGenerating && (
          <div className="absolute bottom-2 right-2 z-20 md:hidden">
            <div className="bg-background/80 backdrop-blur-sm rounded-full p-2 shadow-lg">
              <Maximize2 className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        )}
        
        <AnimatePresence mode="wait">
          <motion.img
            key={displayImage}
            src={displayImage}
            alt="Try-on preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full object-cover"
          />
        </AnimatePresence>

        {/* Generating Overlay */}
        <AnimatePresence>
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center"
            >
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-primary" />
              </div>
              <p className="font-body text-foreground mt-6 text-center">
                AI is styling your outfit...
              </p>
              <p className="font-body text-sm text-muted-foreground mt-2">
                Combining {selectedProducts.length} item{selectedProducts.length > 1 ? 's' : ''}
              </p>
              <p className="font-body text-xs text-muted-foreground/70 mt-4">
                This may take up to 30 seconds
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Price tags removed - they were covering the generated image */}

        {/* Selected Products Strip - Improved swipe UX */}
        {selectedProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-2 md:top-4 left-2 md:left-4 right-2 md:right-4"
          >
            <div className="bg-card/95 backdrop-blur-sm rounded-lg md:rounded-xl p-2 md:p-3 border border-border">
              <div className="flex items-center gap-2">
                {/* Scrollable product thumbnails with momentum scrolling */}
                <div 
                  className="flex-1 overflow-x-auto scrollbar-none touch-pan-x"
                  style={{ 
                    WebkitOverflowScrolling: 'touch',
                    scrollSnapType: 'x mandatory'
                  }}
                >
                  <div className="flex gap-2 min-w-min px-0.5">
                    {selectedProducts.map((product) => {
                      const isFailed = failedProductIds.includes(product.id);
                      const hasCustomImage = customImages[product.id];
                      
                      return (
                        <div 
                          key={product.id} 
                          className="flex-shrink-0 relative"
                          style={{ scrollSnapAlign: 'start' }}
                        >
                          <img
                            src={hasCustomImage || product.image}
                            alt={product.name}
                            className={`w-10 h-10 md:w-12 md:h-12 rounded-lg object-cover border-2 ${
                              isFailed ? 'border-destructive' : 'border-primary/40'
                            }`}
                          />
                          {isFailed && !hasCustomImage && (
                            <label className="absolute inset-0 bg-destructive/80 rounded-lg flex items-center justify-center cursor-pointer hover:bg-destructive/90 transition-colors touch-manipulation">
                              <ImagePlus className="w-4 h-4 text-destructive-foreground" />
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleCustomImageUpload(product.id, e)}
                              />
                            </label>
                          )}
                          {hasCustomImage && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Price summary - always visible */}
                <div className="flex-shrink-0 pl-2 border-l border-border/50">
                  <p className="text-[10px] md:text-xs text-primary font-body uppercase tracking-wider">
                    {selectedProducts.length} item{selectedProducts.length > 1 ? 's' : ''}
                  </p>
                  <p className="text-sm md:text-base font-display font-semibold text-foreground">
                    £{totalPrice.toFixed(0)}
                  </p>
                </div>
              </div>
              
              {/* Scroll hint for multiple items */}
              {selectedProducts.length > 3 && (
                <p className="text-[9px] text-muted-foreground/60 text-center mt-1 md:hidden">
                  ← swipe to see all →
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Try-on Success Badge */}
        {tryOnImage && !isGenerating && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute bottom-4 left-4"
          >
            <div className="bg-primary text-primary-foreground px-3 py-1.5 rounded-full flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-body font-semibold uppercase tracking-wider">
                AI Try-On
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Action Buttons - Optimized for touch */}
      <div className="mt-4 md:mt-5 space-y-3 max-w-[260px] sm:max-w-[300px] md:max-w-[380px] mx-auto">
        {selectedProducts.length > 0 && !tryOnImage && (
          <div className="space-y-2">
            <Button
              onClick={generateTryOn}
              disabled={isGenerating}
              variant="hero"
              className="w-full h-12 sm:h-11 text-sm touch-manipulation active:scale-[0.98]"
            >
              <Sparkles className="w-5 h-5" />
              {isGenerating ? "Generating..." : `Try On ${selectedProducts.length} Item${selectedProducts.length > 1 ? 's' : ''}`}
            </Button>
            
            {/* Add to Queue Button */}
            {user && !isGenerating && (
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    addToQueue(avatarImage, selectedProducts);
                  }}
                  variant="outline"
                  className="flex-1 h-10 text-xs touch-manipulation active:scale-[0.98]"
                >
                  <Layers className="w-4 h-4 mr-2" />
                  Queue Outfit
                  {(queuedCount > 0 || generatingCount > 0) && (
                    <span className="ml-2 px-1.5 py-0.5 bg-primary/20 text-primary rounded text-[10px]">
                      {queuedCount + generatingCount}
                    </span>
                  )}
                </Button>
                {selectedProducts.length > 1 && (
                  <Button
                    onClick={() => {
                      const bulkItems = selectedProducts.map(product => ({
                        avatarImage,
                        products: [product]
                      }));
                      addBulkToQueue(bulkItems);
                    }}
                    variant="outline"
                    className="h-10 px-3 text-xs touch-manipulation active:scale-[0.98]"
                    title="Queue each item separately"
                  >
                    <Layers className="w-4 h-4" />
                    <span className="ml-1">×{selectedProducts.length}</span>
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {selectedProducts.length === 0 && !tryOnImage && (
          <div className="text-center py-6 sm:py-8 space-y-3 px-2">
            <p className="text-muted-foreground font-body text-sm">
              Select items from above to try them on
            </p>
            <div className="text-xs text-muted-foreground/70 space-y-1.5">
              <p>💡 Mix and match tops, bottoms, jackets</p>
              <p>🛍️ Try layered looks with coats over shirts</p>
            </div>
            
            {/* Queue tip */}
            <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg text-left">
              <p className="text-xs font-medium text-primary mb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                Pro Tip: Queue Multiple Outfits
              </p>
              <p className="text-xs text-muted-foreground">
                Add several outfits to the queue and they'll generate in the background while you browse. Find them in "My Outfits" when ready!
              </p>
            </div>
          </div>
        )}

        {tryOnImage && (
          <>
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
              <Button
                onClick={handleSaveClick}
                variant="primaryOutline"
                size="default"
                className="w-full h-11 text-xs sm:text-sm touch-manipulation active:scale-[0.98]"
              >
                <Heart className="w-4 h-4" />
                <span className="ml-1 hidden sm:inline">Save</span>
              </Button>
              <Button
                onClick={handleDownloadWithWatermark}
                variant="outline"
                size="default"
                className="w-full h-11 text-xs sm:text-sm touch-manipulation active:scale-[0.98]"
              >
                <Download className="w-4 h-4" />
                <span className="ml-1 hidden sm:inline">Photos</span>
              </Button>
              <Button
                onClick={() => onAddToCart(selectedProducts)}
                variant="primary"
                size="default"
                className="w-full h-11 text-xs sm:text-sm touch-manipulation active:scale-[0.98]"
              >
                <ShoppingCart className="w-4 h-4" />
                <span className="ml-1">£{totalPrice.toFixed(0)}</span>
              </Button>
            </div>
            <Button
              onClick={() => {
                setTryOnImage(null);
                generateTryOn();
              }}
              variant="outline"
              size="default"
              className="w-full h-10 text-xs touch-manipulation active:scale-[0.98]"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="ml-1.5">Regenerate</span>
            </Button>
            
            {/* Tips after generating - hidden on mobile to save space */}
            <div className="hidden md:block p-3 bg-secondary/50 border border-border rounded-lg mt-2">
              <p className="text-xs text-muted-foreground font-body text-center">
                <span className="font-medium text-foreground">What next?</span>{" "}
                Save to share on the Feed • Add more items • Buy all products
              </p>
            </div>
          </>
        )}

        {/* Save Dialog */}
        <SaveOutfitDialog
          open={showSaveDialog}
          onOpenChange={setShowSaveDialog}
          onSave={saveOutfit}
          isSaving={isSaving}
        />
      </div>

      {/* Error Display with Upload Option */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-xl space-y-3"
        >
          <p className="text-sm text-destructive font-body">{error}</p>
          
          {failedProductIds.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Click the red icons above to upload screenshots for blocked products, then try again.
              </p>
              <Button
                onClick={generateTryOn}
                variant="outline"
                size="sm"
                className="w-full"
                disabled={failedProductIds.some(id => !customImages[id])}
              >
                <Upload className="w-4 h-4 mr-2" />
                Retry with Custom Images
              </Button>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default TryOnView;
