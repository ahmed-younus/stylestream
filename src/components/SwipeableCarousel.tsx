import { useState, ReactNode, useCallback } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SwipeableCarouselProps<T> {
  items: T[];
  renderItem: (item: T, index: number, isActive: boolean) => ReactNode;
  itemsPerView?: number;
  showNavigation?: boolean;
  showDots?: boolean;
  className?: string;
  itemClassName?: string;
}

export function SwipeableCarousel<T>({
  items,
  renderItem,
  itemsPerView = 1,
  showNavigation = true,
  showDots = true,
  className = "",
  itemClassName = "",
}: SwipeableCarouselProps<T>) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const maxIndex = Math.max(0, Math.ceil(items.length / itemsPerView) - 1);

  const goToNext = useCallback(() => {
    if (currentIndex < maxIndex) {
      setDirection(1);
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, maxIndex]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const swipeThreshold = 50;
      const velocityThreshold = 500;

      if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
        goToNext();
      } else if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
        goToPrev();
      }
    },
    [goToNext, goToPrev]
  );

  const visibleItems = items.slice(
    currentIndex * itemsPerView,
    (currentIndex + 1) * itemsPerView
  );

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -100 : 100,
      opacity: 0,
    }),
  };

  if (items.length === 0) return null;

  return (
    <div className={`relative ${className}`}>
      <div className="overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2, ease: "easeInOut" }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
            className={`flex gap-2 touch-pan-y ${itemClassName}`}
          >
            {visibleItems.map((item, idx) => (
              <div key={currentIndex * itemsPerView + idx} className="flex-1 min-w-0">
                {renderItem(item, currentIndex * itemsPerView + idx, true)}
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Arrows - Desktop only */}
      {showNavigation && items.length > itemsPerView && (
        <>
          <button
            onClick={goToPrev}
            disabled={currentIndex === 0}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 w-8 h-8 bg-card/90 backdrop-blur-sm border border-border rounded-full flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-card transition-colors hidden md:flex touch-manipulation"
            aria-label="Previous"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goToNext}
            disabled={currentIndex >= maxIndex}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 w-8 h-8 bg-card/90 backdrop-blur-sm border border-border rounded-full flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-card transition-colors hidden md:flex touch-manipulation"
            aria-label="Next"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {showDots && maxIndex > 0 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setDirection(idx > currentIndex ? 1 : -1);
                setCurrentIndex(idx);
              }}
              className={`h-1.5 rounded-full transition-all touch-manipulation ${
                idx === currentIndex
                  ? "w-6 bg-primary"
                  : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}

      {/* Swipe hint for mobile */}
      {items.length > itemsPerView && (
        <div className="flex justify-center mt-2 md:hidden">
          <span className="text-[10px] text-muted-foreground/50">
            ← Swipe →
          </span>
        </div>
      )}
    </div>
  );
}

export default SwipeableCarousel;
