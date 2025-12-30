import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Search, Loader2, ShoppingBag, ImagePlus, Send, Upload, Link2, X, ChevronDown, Image, Trash2, ChevronLeft, ChevronRight, Shirt, Heart } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Product, ProductCategory } from "@/types/product";
import { useAuth } from "@/hooks/useAuth";
import { useWardrobe } from "@/hooks/useWardrobe";
interface UserMeasurements {
  height_cm?: number | null;
  trainer_size?: string | null;
  gender_preference?: string | null;
}

interface ProductResult {
  title: string;
  url: string;
  description: string;
  brand?: string;
  price?: string;
  image?: string;
  imageBase64?: string;
  imageFetchFailed?: boolean;
}

interface InlineProductSearchProps {
  onTryOnProduct: (product: Product) => void;
  onUpdateAvatar?: (imageData: string) => void;
  currentOutfit?: Product[];
}

interface CategoryItem {
  id: string;
  label: string;
  searchQuery: string;
}

interface CategoryGroup {
  name: string;
  items: CategoryItem[];
}

// Quick access chips (always visible)
const quickChips: CategoryItem[] = [
  { id: "shoes", label: "👟 Shoes", searchQuery: "trainers shoes sneakers" },
  { id: "jacket", label: "🧥 Jacket", searchQuery: "jacket coat" },
  { id: "watch", label: "⌚ Watch", searchQuery: "designer watch" },
  { id: "hat", label: "🧢 Hat", searchQuery: "hat cap beanie" },
];

// Expanded categories (toggleable)
const categoryGroups: CategoryGroup[] = [
  {
    name: "Tops",
    items: [
      { id: "tshirt", label: "T-Shirt", searchQuery: "t-shirt tee" },
      { id: "shirt", label: "Shirt", searchQuery: "shirt button-up" },
      { id: "polo", label: "Polo", searchQuery: "polo shirt" },
      { id: "hoodie", label: "Hoodie", searchQuery: "hoodie sweatshirt" },
      { id: "sweater", label: "Sweater", searchQuery: "sweater jumper knitwear" },
      { id: "vest", label: "Vest", searchQuery: "vest gilet" },
    ],
  },
  {
    name: "Outerwear",
    items: [
      { id: "coat", label: "Coat", searchQuery: "coat overcoat" },
      { id: "blazer", label: "Blazer", searchQuery: "blazer suit jacket" },
      { id: "bomber", label: "Bomber", searchQuery: "bomber jacket" },
      { id: "puffer", label: "Puffer", searchQuery: "puffer jacket down" },
      { id: "leather", label: "Leather Jacket", searchQuery: "leather jacket biker" },
    ],
  },
  {
    name: "Bottoms",
    items: [
      { id: "jeans", label: "Jeans", searchQuery: "jeans denim" },
      { id: "trousers", label: "Trousers", searchQuery: "trousers pants chinos" },
      { id: "joggers", label: "Joggers", searchQuery: "joggers sweatpants" },
      { id: "shorts", label: "Shorts", searchQuery: "shorts" },
      { id: "tracksuit", label: "Tracksuit", searchQuery: "tracksuit set" },
    ],
  },
  {
    name: "Footwear",
    items: [
      { id: "trainers", label: "Trainers", searchQuery: "trainers sneakers" },
      { id: "boots", label: "Boots", searchQuery: "boots" },
      { id: "loafers", label: "Loafers", searchQuery: "loafers dress shoes" },
      { id: "sandals", label: "Sandals", searchQuery: "sandals sliders" },
    ],
  },
  {
    name: "Accessories",
    items: [
      { id: "bag", label: "Bag", searchQuery: "designer bag" },
      { id: "sunglasses", label: "Sunglasses", searchQuery: "sunglasses" },
      { id: "belt", label: "Belt", searchQuery: "designer belt" },
      { id: "scarf", label: "Scarf", searchQuery: "scarf" },
      { id: "jewellery", label: "Jewellery", searchQuery: "chain necklace bracelet" },
      { id: "gloves", label: "Gloves", searchQuery: "gloves" },
    ],
  },
];

interface SavedProductImage {
  id: string;
  image_url: string;
  name: string | null;
  category: string | null;
  created_at: string;
}

// Category options for uploaded products
const UPLOAD_CATEGORY_OPTIONS: { value: ProductCategory; label: string; icon: string }[] = [
  { value: "tops", label: "Top / T-Shirt", icon: "👕" },
  { value: "shirts", label: "Shirt", icon: "👔" },
  { value: "hoodies-sweatshirts", label: "Hoodie / Sweatshirt", icon: "🧥" },
  { value: "jackets-coats", label: "Jacket / Coat", icon: "🧥" },
  { value: "suits", label: "Full Suit", icon: "🤵" },
  { value: "dresses", label: "Dress", icon: "👗" },
  { value: "trousers", label: "Trousers / Joggers", icon: "👖" },
  { value: "jeans", label: "Jeans", icon: "👖" },
  { value: "shorts", label: "Shorts", icon: "🩳" },
  { value: "tracksuits", label: "Tracksuit", icon: "🏃" },
  { value: "trainers", label: "Trainers / Shoes", icon: "👟" },
  { value: "boots", label: "Boots", icon: "🥾" },
  { value: "bags", label: "Bag", icon: "👜" },
  { value: "hats-caps", label: "Hat / Cap", icon: "🧢" },
  { value: "watches", label: "Watch", icon: "⌚" },
  { value: "accessories", label: "Other Accessory", icon: "💎" },
];

// Swipeable Results Carousel Component
const SwipeableResultsCarousel = ({ 
  results, 
  onTryOn,
  onSaveToWardrobe,
  isInWardrobe,
  hasValidImage,
  convertToProduct
}: { 
  results: ProductResult[]; 
  onTryOn: (result: ProductResult) => void;
  onSaveToWardrobe: (result: ProductResult) => void;
  isInWardrobe: (imageUrl: string) => boolean;
  hasValidImage: (result: ProductResult) => boolean;
  convertToProduct: (result: ProductResult) => Product | null;
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = typeof window !== 'undefined' && window.innerWidth < 640 ? 2 : 3;
  const totalPages = Math.ceil(results.length / itemsPerPage);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x < -threshold && currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
    } else if (info.offset.x > threshold && currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const visibleResults = results.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  return (
    <div className="relative">
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.15}
        onDragEnd={handleDragEnd}
        className="touch-pan-y"
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
          {visibleResults.map((result, index) => {
            const imageUrl = result.imageBase64 || result.image || "";
            const inWardrobe = isInWardrobe(imageUrl);
            
            return (
              <motion.div
                key={currentPage * itemsPerPage + index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card border border-border rounded-lg overflow-hidden relative"
              >
                {/* Save to Wardrobe Button */}
                {hasValidImage(result) && (
                  <button
                    onClick={() => onSaveToWardrobe(result)}
                    className={`absolute top-2 right-2 z-10 p-1.5 rounded-full transition-all touch-manipulation active:scale-95 ${
                      inWardrobe 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-background/80 hover:bg-background text-muted-foreground hover:text-primary"
                    }`}
                    title={inWardrobe ? "In wardrobe" : "Save to wardrobe"}
                  >
                    <Heart className={`w-4 h-4 ${inWardrobe ? "fill-current" : ""}`} />
                  </button>
                )}
                
                {hasValidImage(result) ? (
                  <img
                    src={result.image}
                    alt={result.title}
                    className="w-full aspect-square object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full aspect-square bg-muted flex items-center justify-center">
                    <ImagePlus className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div className="p-2 sm:p-3">
                  <p className="text-xs font-body line-clamp-2 mb-2">{result.title}</p>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-primary">{result.price}</span>
                    {hasValidImage(result) && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => onTryOn(result)}
                        className="h-8 px-3 text-xs touch-manipulation active:scale-95"
                      >
                        <ShoppingBag className="w-3.5 h-3.5 mr-1" />
                        Try On
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Navigation & Pagination */}
      {totalPages > 1 && (
        <>
          {/* Desktop arrows */}
          <button
            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="absolute -left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-card/90 backdrop-blur-sm border border-border rounded-full items-center justify-center disabled:opacity-30 hidden md:flex hover:bg-card transition-colors touch-manipulation"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage >= totalPages - 1}
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-card/90 backdrop-blur-sm border border-border rounded-full items-center justify-center disabled:opacity-30 hidden md:flex hover:bg-card transition-colors touch-manipulation"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Dots indicator */}
          <div className="flex justify-center gap-1.5 mt-3">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPage(idx)}
                className={`h-1.5 rounded-full transition-all touch-manipulation ${
                  idx === currentPage
                    ? "w-6 bg-primary"
                    : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
              />
            ))}
          </div>
          
          {/* Mobile swipe hint */}
          <div className="flex justify-center mt-1 md:hidden">
            <span className="text-[10px] text-muted-foreground/50">← Swipe for more →</span>
          </div>
        </>
      )}
    </div>
  );
};

const InlineProductSearch = ({ onTryOnProduct, onUpdateAvatar, currentOutfit = [] }: InlineProductSearchProps) => {
  const { user } = useAuth();
  const { items: wardrobeItems, addItem: addToWardrobe, removeItem: removeFromWardrobe, isInWardrobe, wardrobeToProduct, isLoading: wardrobeLoading } = useWardrobe();
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ProductResult[]>([]);
  const [userMeasurements, setUserMeasurements] = useState<UserMeasurements | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [showTips, setShowTips] = useState(true);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [savedProductImages, setSavedProductImages] = useState<SavedProductImage[]>([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showWardrobe, setShowWardrobe] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [pendingImageForCategory, setPendingImageForCategory] = useState<string | null>(null);
  const [pendingProductForCategory, setPendingProductForCategory] = useState<ProductResult | null>(null);
  const [showImageFallbackPrompt, setShowImageFallbackPrompt] = useState(false);
  const [failedProductInfo, setFailedProductInfo] = useState<ProductResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch saved product images
  useEffect(() => {
    const fetchSavedImages = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("user_product_images")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setSavedProductImages(data);
    };
    fetchSavedImages();
  }, [user]);

  useEffect(() => {
    const fetchMeasurements = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("height_cm, trainer_size, gender_preference")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) setUserMeasurements(data);
    };
    fetchMeasurements();
  }, [user]);

  const convertToProduct = (result: ProductResult): Product | null => {
    const imageUrl = result.imageBase64 || result.image;
    if (!imageUrl || (!imageUrl.startsWith('http') && !imageUrl.startsWith('data:image'))) {
      return null;
    }
    
    const priceMatch = result.price?.match(/[\d,.]+/);
    const price = priceMatch ? parseFloat(priceMatch[0].replace(',', '')) : 0;
    
    const text = `${result.title} ${result.description}`.toLowerCase();
    let category: ProductCategory = 'tops';
    
    // More comprehensive category detection
    if (text.includes('tracksuit')) category = 'tracksuits';
    else if (text.includes('hoodie') || text.includes('sweatshirt')) category = 'hoodies-sweatshirts';
    else if (text.includes('jacket') || text.includes('coat') || text.includes('puffer') || text.includes('blazer')) category = 'jackets-coats';
    else if (text.includes('jean') || text.includes('denim')) category = 'jeans';
    else if (text.includes('jogger') || text.includes('sweatpant')) category = 'trousers';
    else if (text.includes('trouser') || text.includes('pant') || text.includes('chino')) category = 'trousers';
    else if (text.includes('short')) category = 'shorts';
    else if (text.includes('shirt') && !text.includes('t-shirt')) category = 'shirts';
    else if (text.includes('t-shirt') || text.includes('tee')) category = 't-shirts';
    else if (text.includes('trainer') || text.includes('sneaker')) category = 'trainers';
    else if (text.includes('shoe')) category = 'footwear';
    else if (text.includes('boot')) category = 'boots';
    else if (text.includes('sandal') || text.includes('slider')) category = 'sandals';
    else if (text.includes('knit') || text.includes('sweater') || text.includes('jumper')) category = 'knitwear';
    else if (text.includes('bag') || text.includes('backpack')) category = 'bags';
    else if (text.includes('hat') || text.includes('cap') || text.includes('beanie')) category = 'hats-caps';
    else if (text.includes('watch')) category = 'watches';
    
    return {
      id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: result.title,
      brand: result.brand || 'Designer',
      retailer: result.url.startsWith('http') ? new URL(result.url).hostname.replace('www.', '').split('.')[0] : 'custom',
      price,
      currency: '£',
      image: result.image || imageUrl,
      imageBase64: result.imageBase64,
      category,
      gender: 'unisex',
      description: result.description,
      affiliateUrl: result.url,
    };
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const validFiles = Array.from(files).filter(file => file.type.startsWith("image/"));
    
    if (validFiles.length === 0) {
      toast.error("Please upload image files");
      return;
    }

    const readPromises = validFiles.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readPromises).then(base64Images => {
      setUploadedImages(prev => [...prev, ...base64Images]);
      setShowTips(false);
      // Clear the fallback prompt if user uploads an image after a failed link
      if (showImageFallbackPrompt) {
        setShowImageFallbackPrompt(false);
        setFailedProductInfo(null);
      }
      toast.success(`${base64Images.length} image${base64Images.length > 1 ? 's' : ''} uploaded!`);
    });
    
    // Reset input so same files can be selected again
    e.target.value = '';
  };

  // Show category dialog when user clicks try on for an uploaded image
  const handleRequestTryOn = (imageUrl: string) => {
    setPendingImageForCategory(imageUrl);
    setCategoryDialogOpen(true);
  };

  const handleCategorySelected = async (category: ProductCategory) => {
    const categoryLabel = UPLOAD_CATEGORY_OPTIONS.find(c => c.value === category)?.label || category;
    
    // Handle product result from link/search
    if (pendingProductForCategory) {
      const result = pendingProductForCategory;
      const imageUrl = result.imageBase64 || result.image;
      
      if (!imageUrl || (!imageUrl.startsWith('http') && !imageUrl.startsWith('data:image'))) {
        toast.error("This product doesn't have a valid image");
        setCategoryDialogOpen(false);
        setPendingProductForCategory(null);
        return;
      }
      
      const priceMatch = result.price?.match(/[\d,.]+/);
      const price = priceMatch ? parseFloat(priceMatch[0].replace(',', '')) : 0;
      
      const product: Product = {
        id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: result.title,
        brand: result.brand || 'Designer',
        retailer: result.url.startsWith('http') ? new URL(result.url).hostname.replace('www.', '').split('.')[0] : 'custom',
        price,
        currency: '£',
        image: result.image || imageUrl,
        imageBase64: result.imageBase64,
        category: category,
        gender: 'unisex',
        description: result.description,
        affiliateUrl: result.url,
      };
      
      onTryOnProduct(product);
      setCategoryDialogOpen(false);
      setPendingProductForCategory(null);
      toast.success(`Added ${result.title.slice(0, 25)}... as ${categoryLabel.toLowerCase()}`);
      return;
    }
    
    // Handle uploaded image
    if (!pendingImageForCategory) return;
    
    const imageUrl = pendingImageForCategory;
    
    const product: Product = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `Custom ${categoryLabel}`,
      brand: "Your Upload",
      retailer: "custom",
      price: 0,
      currency: "£",
      image: imageUrl,
      imageBase64: imageUrl,
      category: category,
      gender: "unisex",
      description: `Custom uploaded ${categoryLabel.toLowerCase()}`,
      affiliateUrl: "",
    };

    // Save to wardrobe if user is logged in (also saves to user_product_images for library)
    if (user) {
      // Save to wardrobe for quick access in studio
      await addToWardrobe(product);
      
      // Also save to product images library
      const { data, error } = await supabase
        .from("user_product_images")
        .insert({
          user_id: user.id,
          image_url: imageUrl,
          name: `Custom ${categoryLabel}`,
          category: category,
        })
        .select()
        .single();

      if (!error && data) {
        setSavedProductImages(prev => [data, ...prev]);
      }
    }

    onTryOnProduct(product);
    setUploadedImages(prev => prev.filter(img => img !== imageUrl));
    setCategoryDialogOpen(false);
    setPendingImageForCategory(null);
    toast.success(`Added ${categoryLabel.toLowerCase()} to try-on and wardrobe!`);
  };

  const handleTryOnAllUploaded = async () => {
    // For multiple images, show category dialog for first one
    if (uploadedImages.length > 0) {
      handleRequestTryOn(uploadedImages[0]);
    }
  };

  const handleRemoveUploadedImage = (imageUrl: string) => {
    setUploadedImages(prev => prev.filter(img => img !== imageUrl));
  };

  const handleClearAllUploaded = () => {
    setUploadedImages([]);
  };

  const handleUseSavedImage = (savedImage: SavedProductImage) => {
    const product: Product = {
      id: `saved-${savedImage.id}`,
      name: savedImage.name || "Saved Product",
      brand: "Your Upload",
      retailer: "custom",
      price: 0,
      currency: "£",
      image: savedImage.image_url,
      imageBase64: savedImage.image_url,
      category: (savedImage.category as any) || "tops",
      gender: "unisex",
      description: "Saved product image",
      affiliateUrl: "",
    };

    onTryOnProduct(product);
    setShowLibrary(false);
    toast.success("Added saved product to try-on!");
  };

  const handleDeleteSavedImage = async (imageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    const { error } = await supabase
      .from("user_product_images")
      .delete()
      .eq("id", imageId)
      .eq("user_id", user.id);

    if (!error) {
      setSavedProductImages(prev => prev.filter(img => img.id !== imageId));
      toast.success("Image deleted from library");
    } else {
      toast.error("Failed to delete image");
    }
  };

  // Check if query looks like a URL
  const isUrl = (text: string): boolean => {
    const urlPattern = /^(https?:\/\/|www\.)/i;
    return urlPattern.test(text.trim());
  };

  const handleSearch = async () => {
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    setResults([]);
    setShowTips(false);
    setShowImageFallbackPrompt(false);
    setFailedProductInfo(null);

    // Build outfit context for the AI
    const outfitContext = currentOutfit.length > 0 
      ? currentOutfit.map(p => `${p.category}: ${p.name} (${p.brand})`).join(", ")
      : null;

    const pastedUrl = isUrl(query);

    try {
      const { data, error } = await supabase.functions.invoke("ai-shopping-assistant", {
        body: {
          message: query,
          conversationHistory: [],
          userMeasurements,
          userGender: userMeasurements?.gender_preference || null,
          currentOutfit: outfitContext,
        },
      });

      if (error) throw error;

      if (data.products && data.products.length > 0) {
        // Check if this was a URL paste and the product has no valid image
        const product = data.products[0];
        const hasImage = product.imageBase64 || (product.image && (product.image.startsWith('http') || product.image.startsWith('data:image')));
        
        if (pastedUrl && !hasImage) {
          // Show fallback prompt for screenshot upload
          setFailedProductInfo(product);
          setShowImageFallbackPrompt(true);
          toast.info("Couldn't fetch image. Upload a screenshot instead!");
        } else {
          setResults(data.products);
        }
      } else if (pastedUrl) {
        // URL was pasted but no product found - prompt for screenshot
        setFailedProductInfo({
          title: "Product from link",
          url: query.trim(),
          description: "",
        });
        setShowImageFallbackPrompt(true);
        toast.info("Couldn't fetch product. Upload a screenshot instead!");
      } else {
        toast.info("No products found. Try a different search.");
      }
    } catch (error) {
      console.error("Search error:", error);
      if (pastedUrl) {
        setFailedProductInfo({
          title: "Product from link",
          url: query.trim(),
          description: "",
        });
        setShowImageFallbackPrompt(true);
        toast.info("Couldn't fetch product. Upload a screenshot instead!");
      } else {
        toast.error("Search failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTryOn = (result: ProductResult) => {
    const imageUrl = result.imageBase64 || result.image;
    if (!imageUrl || (!imageUrl.startsWith('http') && !imageUrl.startsWith('data:image'))) {
      toast.error("This product doesn't have a valid image");
      return;
    }
    
    // Always show category confirmation for products from links/search
    setPendingProductForCategory(result);
    setCategoryDialogOpen(true);
  };

  const hasValidImage = (result: ProductResult): boolean => {
    const img = result.imageBase64 || result.image;
    return !!(img && (img.startsWith('http') || img.startsWith('data:image')));
  };

  const handleCategorySearch = (item: CategoryItem) => {
    const contextQuery = currentOutfit.length > 0 
      ? `${item.searchQuery} to match my current outfit`
      : item.searchQuery;
    setQuery(contextQuery);
    setShowAllCategories(false);
    // Trigger search after state update
    setTimeout(() => {
      handleSearch();
    }, 50);
  };

  return (
    <div className="space-y-3">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Category Quick-Select Chips - Scrollable on mobile */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1">
          <span className="text-[10px] text-muted-foreground mr-1 flex-shrink-0">Add:</span>
          {quickChips.map((chip) => (
            <button
              key={chip.id}
              onClick={() => handleCategorySearch(chip)}
              disabled={isLoading}
              className="px-3 py-2 bg-secondary active:bg-primary/30 hover:bg-primary/20 text-xs font-body rounded-full transition-colors border border-transparent hover:border-primary/30 active:border-primary/40 disabled:opacity-50 flex-shrink-0 touch-manipulation"
            >
              {chip.label}
            </button>
          ))}
          <button
            onClick={() => setShowAllCategories(!showAllCategories)}
            className="flex items-center gap-1 px-3 py-2 bg-primary/10 active:bg-primary/30 hover:bg-primary/20 text-xs font-body rounded-full transition-colors border border-primary/20 flex-shrink-0 touch-manipulation"
          >
            More
            <ChevronDown className={`w-3 h-3 transition-transform ${showAllCategories ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Expanded Categories */}
        <AnimatePresence>
          {showAllCategories && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-card border border-border rounded-xl p-3 space-y-3 max-h-[40vh] overflow-y-auto">
                {categoryGroups.map((group) => (
                  <div key={group.name}>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5">{group.name}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {group.items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleCategorySearch(item)}
                          disabled={isLoading}
                          className="px-2.5 py-1.5 bg-secondary active:bg-primary/30 hover:bg-primary/20 text-[11px] font-body rounded-md transition-colors border border-transparent hover:border-primary/30 active:border-primary/40 disabled:opacity-50 touch-manipulation"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Search Input */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder={currentOutfit.length > 0 ? "Find matching items..." : "Search or paste link..."}
              className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl text-sm font-body placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 touch-manipulation"
            />
          </div>
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            size="icon"
            className="h-[46px] w-[46px] min-w-[46px] rounded-xl touch-manipulation active:scale-95"
            title="Upload product image"
          >
            <Upload className="w-5 h-5" />
          </Button>
          {user && savedProductImages.length > 0 && (
            <Button
              onClick={() => { setShowLibrary(!showLibrary); setShowWardrobe(false); }}
              variant={showLibrary ? "default" : "outline"}
              size="icon"
              className="h-[46px] w-[46px] min-w-[46px] rounded-xl touch-manipulation active:scale-95"
              title="Your saved product images"
            >
              <Image className="w-5 h-5" />
            </Button>
          )}
          {user && wardrobeItems.length > 0 && (
            <Button
              onClick={() => { setShowWardrobe(!showWardrobe); setShowLibrary(false); }}
              variant={showWardrobe ? "default" : "outline"}
              size="icon"
              className="h-[46px] w-[46px] min-w-[46px] rounded-xl touch-manipulation active:scale-95 relative"
              title="Your wardrobe"
            >
              <Shirt className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center">
                {wardrobeItems.length}
              </span>
            </Button>
          )}
          <Button
            onClick={handleSearch}
            disabled={isLoading || !query.trim()}
            size="icon"
            className="h-[46px] w-[46px] min-w-[46px] rounded-xl touch-manipulation active:scale-95"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Saved Product Images Library */}
      <AnimatePresence>
        {showLibrary && savedProductImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-card border border-border rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Image className="w-3.5 h-3.5" />
                  Your Saved Products ({savedProductImages.length})
                </p>
                <button
                  onClick={() => setShowLibrary(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {savedProductImages.map((img) => (
                  <motion.div
                    key={img.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative group cursor-pointer"
                    onClick={() => handleUseSavedImage(img)}
                  >
                    <img
                      src={img.image_url}
                      alt={img.name || "Saved product"}
                      className="w-full aspect-square object-cover rounded-lg border border-border group-hover:border-primary/50 active:border-primary transition-colors"
                    />
                    <button
                      onClick={(e) => handleDeleteSavedImage(img.id, e)}
                      className="absolute top-1 right-1 p-1.5 bg-background/80 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-destructive/20 touch-manipulation"
                    >
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wardrobe Section */}
      <AnimatePresence>
        {showWardrobe && wardrobeItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-card border border-border rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Shirt className="w-3.5 h-3.5" />
                  Your Wardrobe ({wardrobeItems.length})
                </p>
                <button
                  onClick={() => setShowWardrobe(false)}
                  className="text-muted-foreground hover:text-foreground touch-manipulation"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {wardrobeItems.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative group"
                  >
                    <img
                      src={item.product_image}
                      alt={item.product_name}
                      className="w-full aspect-square object-cover rounded-lg border border-border cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => {
                        onTryOnProduct(wardrobeToProduct(item));
                        setShowWardrobe(false);
                        toast.success(`Added ${item.product_name.slice(0, 20)}...`);
                      }}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromWardrobe(item.id);
                      }}
                      className="absolute top-1 right-1 p-1 bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20 touch-manipulation"
                    >
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent p-1.5 rounded-b-lg">
                      <p className="text-[9px] text-foreground font-medium truncate">{item.product_name}</p>
                      {item.product_price && (
                        <p className="text-[8px] text-primary">£{item.product_price}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Fetch Failed - Fallback Prompt */}
      <AnimatePresence>
        {showImageFallbackPrompt && failedProductInfo && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <ImagePlus className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1 space-y-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Couldn't fetch the product image</p>
                  <p className="text-xs text-muted-foreground">
                    {failedProductInfo.title !== "Product from link" 
                      ? `Found "${failedProductInfo.title}" but the image is blocked.`
                      : "This retailer blocks image fetching."}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload Screenshot
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowImageFallbackPrompt(false);
                      setFailedProductInfo(null);
                    }}
                    className="gap-1.5"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancel
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  💡 Tip: Take a screenshot of the product and crop it to just show the clothing item
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tips Banner */}
      {showTips && results.length === 0 && !isLoading && uploadedImages.length === 0 && !showImageFallbackPrompt && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary/10 border border-primary/20 rounded-lg p-3"
        >
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <div className="space-y-1.5">
              <p className="flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-primary shrink-0" />
                <span><strong>Paste a link</strong> from any fashion website to try that exact item</span>
              </p>
              <p className="flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-primary shrink-0" />
                <span><strong>Upload screenshots</strong> of clothing you want to try on (multiple at once!)</span>
              </p>
              <p className="flex items-center gap-1.5 text-gold/80">
                <ImagePlus className="w-3.5 h-3.5 shrink-0" />
                <span><strong>Tip:</strong> Screenshots work best — crop out backgrounds and just show the product</span>
              </p>
            </div>
            <button onClick={() => setShowTips(false)} className="ml-auto hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Uploaded Images Preview */}
      {uploadedImages.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border border-border rounded-lg p-3"
        >
          <div className="flex items-center justify-between mb-3 gap-2">
            <p className="text-xs font-medium text-muted-foreground flex-shrink-0">
              {uploadedImages.length} image{uploadedImages.length > 1 ? 's' : ''} ready
            </p>
            <div className="flex gap-2">
              {uploadedImages.length > 1 && (
                <Button
                  size="sm"
                  onClick={handleTryOnAllUploaded}
                  className="h-8 text-xs touch-manipulation active:scale-95"
                >
                  <ShoppingBag className="w-3.5 h-3.5 mr-1" />
                  Try All
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleClearAllUploaded}
                className="h-8 text-xs px-2 touch-manipulation active:scale-95"
              >
                Clear
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {uploadedImages.map((img, index) => (
              <div key={index} className="relative group">
                <img
                  src={img}
                  alt={`Uploaded ${index + 1}`}
                  className="w-full aspect-square object-cover rounded-md border border-border"
                />
                {/* Always visible action buttons on mobile */}
                <div className="absolute inset-0 bg-background/80 flex md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity items-center justify-center gap-2 rounded-md">
                  <button
                    onClick={() => handleRequestTryOn(img)}
                    className="p-2 bg-primary rounded-full active:bg-primary/80 hover:bg-primary/80 touch-manipulation"
                    title="Try on"
                  >
                    <ShoppingBag className="w-4 h-4 text-primary-foreground" />
                  </button>
                  <button
                    onClick={() => handleRemoveUploadedImage(img)}
                    className="p-2 bg-destructive/20 rounded-full active:bg-destructive/40 hover:bg-destructive/40 touch-manipulation"
                    title="Remove"
                  >
                    <X className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Quick Search Suggestions */}
      {results.length === 0 && !isLoading && uploadedImages.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {currentOutfit.length > 0 ? (
            // Context-aware suggestions based on current outfit
            <>
              {!currentOutfit.find(p => p.category.includes('trainer') || p.category.includes('boot')) && (
                <button
                  onClick={() => { setQuery("matching shoes"); setTimeout(() => handleSearch(), 100); }}
                  className="px-3 py-1.5 bg-primary/20 text-xs font-body rounded-full hover:bg-primary/30 transition-colors border border-primary/30"
                >
                  + Add shoes
                </button>
              )}
              {!currentOutfit.find(p => p.category.includes('jacket') || p.category.includes('coat')) && (
                <button
                  onClick={() => { setQuery("matching jacket"); setTimeout(() => handleSearch(), 100); }}
                  className="px-3 py-1.5 bg-primary/20 text-xs font-body rounded-full hover:bg-primary/30 transition-colors border border-primary/30"
                >
                  + Add jacket
                </button>
              )}
              {!currentOutfit.find(p => ['jeans', 'trousers', 'shorts'].includes(p.category)) && (
                <button
                  onClick={() => { setQuery("matching bottoms"); setTimeout(() => handleSearch(), 100); }}
                  className="px-3 py-1.5 bg-primary/20 text-xs font-body rounded-full hover:bg-primary/30 transition-colors border border-primary/30"
                >
                  + Add bottoms
                </button>
              )}
              <button
                onClick={() => { setQuery("accessories that match"); setTimeout(() => handleSearch(), 100); }}
                className="px-3 py-1.5 bg-secondary text-xs font-body rounded-full hover:bg-secondary/80 transition-colors"
              >
                + Accessories
              </button>
            </>
          ) : (
            // Default suggestions when no outfit
            ["Nike hoodie", "Leather jacket", "White trainers", "Black jeans"].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => {
                  setQuery(suggestion);
                  setTimeout(() => handleSearch(), 100);
                }}
                className="px-3 py-1.5 bg-secondary text-xs font-body rounded-full hover:bg-secondary/80 transition-colors"
              >
                {suggestion}
              </button>
            ))
          )}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Searching fashion retailers...</span>
        </div>
      )}

      {/* Results Grid - Swipeable on Mobile */}
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <SwipeableResultsCarousel
              results={results}
              onTryOn={handleTryOn}
              onSaveToWardrobe={(result) => {
                const product = convertToProduct(result);
                if (product) addToWardrobe(product);
              }}
              isInWardrobe={isInWardrobe}
              hasValidImage={hasValidImage}
              convertToProduct={convertToProduct}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Selection Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={(open) => {
        setCategoryDialogOpen(open);
        if (!open) {
          setPendingImageForCategory(null);
          setPendingProductForCategory(null);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display tracking-wide text-center">
              What type of item is this?
            </DialogTitle>
          </DialogHeader>
          
          {/* Show image for uploaded image or product from link */}
          {(pendingImageForCategory || pendingProductForCategory) && (
            <div className="flex flex-col items-center gap-2 mb-4">
              <img 
                src={pendingImageForCategory || pendingProductForCategory?.imageBase64 || pendingProductForCategory?.image || ''} 
                alt="Product" 
                className="w-24 h-24 object-cover rounded-lg border border-border"
              />
              {pendingProductForCategory && (
                <p className="text-xs text-muted-foreground text-center line-clamp-2 max-w-[200px]">
                  {pendingProductForCategory.title}
                </p>
              )}
            </div>
          )}
          
          <p className="text-sm text-muted-foreground text-center mb-4">
            Select the category so we can place it correctly on your body
          </p>
          
          <div className="grid grid-cols-3 gap-2">
            {UPLOAD_CATEGORY_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleCategorySelected(option.value)}
                className="flex flex-col items-center gap-1 p-3 rounded-lg border border-border hover:border-primary hover:bg-accent transition-colors touch-manipulation active:scale-95"
              >
                <span className="text-xl">{option.icon}</span>
                <span className="text-xs text-center font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InlineProductSearch;
