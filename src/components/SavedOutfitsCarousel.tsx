import { useState, useEffect, useCallback } from "react";
import { motion, PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight, Shirt } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface SavedOutfit {
  id: string;
  avatar_image: string;
  try_on_image: string;
  products: any;
  created_at: string;
}

interface SavedOutfitsCarouselProps {
  currentAvatarImage: string;
  onSelectOutfit: (avatarImage: string, products: any[]) => void;
}

const SavedOutfitsCarousel = ({ currentAvatarImage, onSelectOutfit }: SavedOutfitsCarouselProps) => {
  const { user } = useAuth();
  const [outfits, setOutfits] = useState<SavedOutfit[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  // Fetch with timeout protection
  const fetchOutfits = useCallback(async () => {
    if (!user || hasFetched || isLoading) return;
    
    setIsLoading(true);
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
      );
      
      const fetchPromise = supabase
        .from('saved_outfits')
        .select('id, avatar_image, try_on_image, products, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;
      
      if (!error && data) {
        setOutfits(data);
      }
    } catch (e) {
      console.error('Failed to fetch saved outfits:', e);
    } finally {
      setIsLoading(false);
      setHasFetched(true);
    }
  }, [user, hasFetched, isLoading]);

  // Fetch immediately when user is available
  useEffect(() => {
    if (user && !hasFetched) {
      fetchOutfits();
    }
  }, [user, hasFetched, fetchOutfits]);

  const goToNext = () => {
    if (currentIndex < outfits.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -50 && currentIndex < outfits.length - 1) {
      goToNext();
    } else if (info.offset.x > 50 && currentIndex > 0) {
      goToPrev();
    }
  };

  const handleSelectOutfit = (outfit: SavedOutfit) => {
    onSelectOutfit(outfit.avatar_image, outfit.products || []);
  };

  // Show loading or empty state
  if (!user) return null;
  if (isLoading) {
    return (
      <div className="mb-3 w-full max-w-[280px]">
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Shirt className="w-3 h-3 animate-pulse" />
          Loading saved outfits...
        </div>
      </div>
    );
  }
  if (outfits.length === 0) return null;

  return (
    <div className="mb-3 w-full max-w-[280px]">
      <div className="flex items-center justify-between mb-1.5">
        <h3 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <Shirt className="w-3 h-3" />
          Saved Outfits
        </h3>
        <span className="text-[10px] text-muted-foreground">
          {currentIndex + 1}/{outfits.length}
        </span>
      </div>
      
      <div className="relative flex items-center gap-1">
        {/* Prev Arrow */}
        <button
          onClick={goToPrev}
          disabled={currentIndex === 0}
          className={cn(
            "w-6 h-6 rounded-full bg-background/80 border border-border flex items-center justify-center touch-manipulation",
            currentIndex === 0 ? "opacity-30" : "active:scale-95"
          )}
        >
          <ChevronLeft className="w-3 h-3" />
        </button>

        {/* Thumbnails */}
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.1}
          onDragEnd={handleDragEnd}
          className="flex gap-1.5 overflow-hidden touch-pan-y cursor-grab active:cursor-grabbing"
        >
          {outfits.slice(Math.max(0, currentIndex - 1), currentIndex + 3).map((outfit, idx) => {
            const isActive = Math.max(0, currentIndex - 1) + idx === currentIndex;
            return (
              <button
                key={outfit.id}
                onClick={() => handleSelectOutfit(outfit)}
                className={cn(
                  "flex-shrink-0 rounded-md overflow-hidden border transition-all touch-manipulation active:scale-95",
                  isActive ? "border-gold w-14 h-[70px]" : "border-border/50 w-10 h-[50px] opacity-60"
                )}
              >
                <img
                  src={outfit.try_on_image || outfit.avatar_image}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            );
          })}
        </motion.div>

        {/* Next Arrow */}
        <button
          onClick={goToNext}
          disabled={currentIndex === outfits.length - 1}
          className={cn(
            "w-6 h-6 rounded-full bg-background/80 border border-border flex items-center justify-center touch-manipulation",
            currentIndex === outfits.length - 1 ? "opacity-30" : "active:scale-95"
          )}
        >
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default SavedOutfitsCarousel;