import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Shirt, ArrowLeft, X, RefreshCw, Lock, Unlock, ChevronLeft, ChevronRight, HelpCircle, User } from "lucide-react";
import { Product } from "@/types/product";
import TryOnView from "./TryOnView";
import WardrobePanel from "./WardrobePanel";
import OutfitSuggestions from "./OutfitSuggestions";
import InlineProductSearch from "./InlineProductSearch";
import StudioHelper from "./StudioHelper";
import AvatarChangeSheet from "./AvatarChangeSheet";
import SavedOutfitsCarousel from "./SavedOutfitsCarousel";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { useWardrobe } from "@/hooks/useWardrobe";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

// Swipeable Products Bar Component
const SwipeableProductsBar = ({
  products,
  lockedProductIds,
  totalPrice,
  onToggleLock,
  onRemove,
}: {
  products: Product[];
  lockedProductIds: Set<string>;
  totalPrice: number;
  onToggleLock: (id: string) => void;
  onRemove: (id: string) => void;
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerView = typeof window !== 'undefined' && window.innerWidth < 640 ? 2 : 4;
  const totalPages = Math.ceil(products.length / itemsPerView);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 40;
    if (info.offset.x < -threshold && currentIndex < totalPages - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (info.offset.x > threshold && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const visibleProducts = products.slice(
    currentIndex * itemsPerView,
    (currentIndex + 1) * itemsPerView
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-3 md:mb-6 p-2.5 md:p-4 bg-card border border-border rounded-lg md:rounded-xl"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 relative overflow-hidden">
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
            className="flex items-center gap-2 touch-pan-y"
          >
            <AnimatePresence mode="popLayout">
              {visibleProducts.map((product) => {
                const isLocked = lockedProductIds.has(product.id);
                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    layout
                    className={`flex items-center gap-2 rounded-lg px-2 py-1.5 md:px-3 md:py-2 flex-shrink-0 ${
                      isLocked ? 'bg-gold/20 border border-gold/40' : 'bg-secondary'
                    }`}
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-8 h-8 md:w-10 md:h-10 rounded-md object-cover"
                    />
                    <span className="text-[10px] md:text-xs font-body text-gold uppercase hidden sm:block max-w-[60px] truncate">
                      {product.category}
                    </span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => onToggleLock(product.id)}
                          className={`p-1.5 rounded-full transition-colors touch-manipulation active:scale-95 ${
                            isLocked ? 'text-gold active:bg-gold/30 hover:bg-gold/20' : 'text-muted-foreground active:bg-background/70 hover:bg-background/50'
                          }`}
                        >
                          {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{isLocked ? 'Unlock to allow replacement' : 'Lock to keep when swapping'}</p>
                      </TooltipContent>
                    </Tooltip>
                    <button
                      onClick={() => onRemove(product.id)}
                      className="p-1.5 active:bg-background/70 hover:bg-background/50 rounded-full transition-colors touch-manipulation active:scale-95"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
          
          {/* Pagination dots for mobile when needed */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-1 mt-2 md:hidden">
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-1 rounded-full transition-all ${
                    idx === currentIndex ? "w-4 bg-gold" : "w-1 bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
        
        <p className="font-body font-semibold text-gold text-sm md:text-base flex-shrink-0">
          £{totalPrice.toFixed(0)}
        </p>
      </div>
    </motion.div>
  );
};

interface TryOnStudioProps {
  avatarImage: string;
  faceImage?: string;
  onBack: () => void;
  onAvatarChange?: (newImage: string) => void;
  aiProduct?: Product | null;
  onAiProductProcessed?: () => void;
  initialProducts?: Product[];
  onSessionChange?: (avatarImage: string, selectedProducts: Product[]) => void;
}

const TryOnStudio = ({ 
  avatarImage, 
  faceImage,
  onBack,
  onAvatarChange,
  aiProduct, 
  onAiProductProcessed,
  initialProducts = [],
  onSessionChange,
}: TryOnStudioProps) => {
  const [currentAvatarImage, setCurrentAvatarImage] = useState(avatarImage);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>(initialProducts);
  const [cart, setCart] = useState<Product[]>([]);
  const [lockedProductIds, setLockedProductIds] = useState<Set<string>>(new Set());
  const { items: wardrobeItems, addItem: addToWardrobe, removeItem: removeFromWardrobe, wardrobeToProduct, isLoading: wardrobeLoading } = useWardrobe();
  
  // Convert wardrobe items to Products for the panel
  const wardrobeProducts = wardrobeItems.map(wardrobeToProduct);

  // Sync with external avatar changes
  useEffect(() => {
    setCurrentAvatarImage(avatarImage);
  }, [avatarImage]);

  // Initialize with initial products
  useEffect(() => {
    if (initialProducts.length > 0) {
      setSelectedProducts(initialProducts);
    }
  }, []);

  // Handle AI product additions
  useEffect(() => {
    if (aiProduct) {
      handleProductSelect(aiProduct);
      // Also add to wardrobe for quick reuse (only if user is logged in)
      addToWardrobe(aiProduct);
      onAiProductProcessed?.();
    }
  }, [aiProduct]);

  // Save session on changes
  useEffect(() => {
    if (selectedProducts.length > 0) {
      onSessionChange?.(currentAvatarImage, selectedProducts);
    }
  }, [selectedProducts, currentAvatarImage, onSessionChange]);

  // Handle loading a saved outfit
  const handleSelectSavedOutfit = useCallback((outfitAvatarImage: string, products: any[]) => {
    // Update avatar image
    setCurrentAvatarImage(outfitAvatarImage);
    onAvatarChange?.(outfitAvatarImage);
    
    // Convert products to Product type and set
    if (products && Array.isArray(products) && products.length > 0) {
      setSelectedProducts(products as Product[]);
      toast.success(`Loaded outfit with ${products.length} items`);
    } else {
      setSelectedProducts([]);
      toast.success("Loaded outfit");
    }
  }, [onAvatarChange]);

  // Handle avatar change from sheet
  const handleAvatarChange = useCallback((newImage: string) => {
    setCurrentAvatarImage(newImage);
    onAvatarChange?.(newImage);
  }, [onAvatarChange]);

  const getProductSlot = (product: Product): string => {
    const category = product.subcategory ?? product.category;

    switch (category) {
      case 'jackets-coats':
      case 'lightweight-jackets':
      case 'outerwear':
        return 'outerwear';
      case 'tops':
      case 't-shirts':
      case 'shirts':
      case 'polo-shirts':
      case 'hoodies-sweatshirts':
      case 'knitwear':
      case 'activewear':
      case 'loungewear':
      case 'tracksuits':
        return 'top';
      case 'bottoms':
      case 'jeans':
      case 'trousers':
      case 'shorts':
      case 'swimwear':
      case 'underwear':
      case 'socks':
        return 'bottom';
      case 'footwear':
      case 'trainers':
      case 'boots':
      case 'loafers':
      case 'dress-shoes':
      case 'brogues-oxfords':
      case 'sliders-flip-flops':
      case 'sandals':
      case 'slippers':
        return 'footwear';
      case 'bags':
      case 'messenger-bags':
      case 'backpacks':
      case 'belt-bags':
      case 'shoulder-bags':
      case 'travel-weekend-bags':
      case 'laptop-bags':
      case 'tote-bags':
      case 'pouches':
      case 'wash-bags':
      case 'suitcases':
        return 'bag';
      case 'hats-caps':
        return 'hat';
      case 'belts':
        return 'belt';
      case 'gloves-scarves':
        return 'gloves-scarf';
      case 'wallets-cardholders':
        return 'wallet';
      case 'jewellery':
        return 'jewellery';
      case 'watches':
        return 'watch';
      case 'dresses':
      case 'suits':
        return 'one-piece';
      case 'accessories':
        return 'accessory';
      default:
        return product.category;
    }
  };

  const handleProductSelect = useCallback((product: Product) => {
    const isAlreadySelected = selectedProducts.find(p => p.id === product.id);

    if (isAlreadySelected) {
      setSelectedProducts(selectedProducts.filter(p => p.id !== product.id));
      setLockedProductIds(prev => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    } else {
      const targetSlot = getProductSlot(product);
      const existingInSlot = selectedProducts.find(p => getProductSlot(p) === targetSlot);

      if (existingInSlot) {
        // Check if existing item is locked - if so, add alongside it (layering)
        if (lockedProductIds.has(existingInSlot.id)) {
          setSelectedProducts([...selectedProducts, product]);
          toast.success(`Added ${product.name} alongside locked item`);
        } else {
          // Replace unlocked item in same slot
          setSelectedProducts([
            ...selectedProducts.filter(p => getProductSlot(p) !== targetSlot),
            product,
          ]);
          toast.info(`Replaced ${existingInSlot.name} with ${product.name}`);
        }
      } else {
        setSelectedProducts([...selectedProducts, product]);
      }
    }
  }, [selectedProducts, lockedProductIds]);

  const toggleLock = (productId: string) => {
    setLockedProductIds(prev => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
        toast.info("Item unlocked");
      } else {
        next.add(productId);
        toast.success("Item locked");
      }
      return next;
    });
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
  };

  const handleAddToCart = (products: Product[]) => {
    const newProducts = products.filter(p => !cart.find(c => c.id === p.id));
    if (newProducts.length > 0) {
      setCart([...cart, ...newProducts]);
      toast.success(`${newProducts.length} item${newProducts.length > 1 ? 's' : ''} added to cart!`);
    }
  };

  const handleLike = (products: Product[]) => {
    // Silently save products to wardrobe for quick reuse (no toast - the outfit save already shows a message)
    products.forEach(p => addToWardrobe(p));
  };

  const handleApplySuggestion = (products: Product[]) => {
    setSelectedProducts(products);
    toast.success(`Applied outfit with ${products.length} items`);
  };

  const totalPrice = selectedProducts.reduce((sum, p) => sum + p.price, 0);
  const selectedProductIds = selectedProducts.map(p => p.id);
  const wardrobeProductIds = wardrobeProducts.map(p => p.id);

  return (
    <section className="relative min-h-screen bg-background pt-16 md:pt-20 py-4 md:py-8 pb-24 md:pb-8">
      {/* First-time Studio Helper */}
      <StudioHelper />
      
      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6">
        {/* Compact Mobile Header */}
        <div className="flex items-center justify-between gap-2 mb-4 md:mb-8">
          <div className="flex items-center gap-2">
            <Button
              onClick={onBack}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground active:text-foreground h-10 w-10 md:h-9 md:w-auto p-0 md:px-3 touch-manipulation active:scale-95"
            >
              <ArrowLeft className="w-5 h-5 md:w-4 md:h-4" />
              <span className="hidden md:inline ml-2">Back</span>
            </Button>
            <Button
              onClick={onBack}
              variant="outline"
              size="sm"
              className="text-muted-foreground hover:text-foreground active:text-foreground border-border h-10 w-10 md:h-9 md:w-auto p-0 md:px-3 touch-manipulation active:scale-95"
            >
              <RefreshCw className="w-5 h-5 md:w-4 md:h-4" />
              <span className="hidden md:inline ml-2">Start Again</span>
            </Button>
          </div>
          
          <div className="flex items-center gap-1.5 md:gap-3">
            <Shirt className="w-4 h-4 md:w-5 md:h-5 text-gold" />
            <h1 className="font-display text-sm md:text-2xl font-medium tracking-wider">STUDIO</h1>
          </div>

          <div className="flex items-center gap-2 min-w-[40px] justify-end">
            {onAvatarChange && (
              <AvatarChangeSheet
                currentAvatarImage={currentAvatarImage}
                onAvatarChange={handleAvatarChange}
                trigger={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 w-10 md:h-9 md:w-auto p-0 md:px-3 touch-manipulation active:scale-95"
                  >
                    <User className="w-5 h-5 md:w-4 md:h-4" />
                    <span className="hidden md:inline ml-2">Photo</span>
                  </Button>
                }
              />
            )}
            {cart.length > 0 && (
              <span className="px-2.5 py-1 md:px-3 md:py-1 bg-gold text-noir text-[10px] md:text-xs font-body font-semibold rounded-full">
                {cart.length}
              </span>
            )}
          </div>
        </div>

        {/* Selected Items Bar - Swipeable on mobile */}
        {selectedProducts.length > 0 && (
          <SwipeableProductsBar
            products={selectedProducts}
            lockedProductIds={lockedProductIds}
            totalPrice={totalPrice}
            onToggleLock={toggleLock}
            onRemove={handleRemoveProduct}
          />
        )}

        {/* Main Content Grid - 2 columns on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
          {/* Left Side - Avatar */}
          {/* Saved Outfits Carousel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 flex flex-col items-center"
          >
            <SavedOutfitsCarousel
              currentAvatarImage={currentAvatarImage}
              onSelectOutfit={handleSelectSavedOutfit}
            />
            <TryOnView
              avatarImage={currentAvatarImage}
              faceImage={faceImage}
              selectedProducts={selectedProducts}
              onAddToCart={handleAddToCart}
              onLike={handleLike}
            />
          </motion.div>

          {/* Right Side - Search & Products */}
          <div className="lg:col-span-3 space-y-4">
            {/* Inline Search */}
            <InlineProductSearch
              onTryOnProduct={handleProductSelect}
              currentOutfit={selectedProducts}
            />

            {/* Wardrobe & Suggestions in a row on larger screens */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <WardrobePanel
                wardrobeProducts={wardrobeProducts}
                onAddToTryOn={handleProductSelect}
                onRemove={(productId) => {
                  const item = wardrobeItems.find(i => i.id === productId);
                  if (item) removeFromWardrobe(item.id);
                }}
                selectedProductIds={selectedProductIds}
                isLoading={wardrobeLoading}
              />
              <OutfitSuggestions
                wishlistProducts={wardrobeProducts}
                onApplySuggestion={handleApplySuggestion}
              />
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default TryOnStudio;
