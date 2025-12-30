import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Layers, Lock, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

const tips = [
  {
    icon: Search,
    title: "Search Products",
    description: "Use AI search or paste links from ASOS, Flannels & more",
  },
  {
    icon: Layers,
    title: "Queue Multiple",
    description: "Add outfits to queue and generate them all at once",
  },
  {
    icon: Lock,
    title: "Lock Items",
    description: "Lock items to keep them when swapping clothes",
  },
  {
    icon: Heart,
    title: "Save to Wardrobe",
    description: "Heart items to save them for quick access later",
  },
];

const StudioHelper = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentTip, setCurrentTip] = useState(0);

  useEffect(() => {
    const hasSeenHelper = localStorage.getItem("hasSeenStudioHelper");
    if (!hasSeenHelper) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem("hasSeenStudioHelper", "true");
    setIsVisible(false);
  };

  const handleNext = () => {
    if (currentTip < tips.length - 1) {
      setCurrentTip(currentTip + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentTip > 0) {
      setCurrentTip(currentTip - 1);
    }
  };

  const tip = tips[currentTip];
  const TipIcon = tip.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
          
          {/* Tip Card - stop propagation so clicking card doesn't close */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-xl"
          >
            {/* Close button - larger touch target */}
            <button
              onClick={handleClose}
              className="absolute right-3 top-3 p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-secondary active:scale-95 transition-all touch-manipulation"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* Progress dots - clickable */}
            <div className="flex justify-center gap-2 mb-5">
              {tips.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTip(index)}
                  className="p-1 min-w-[20px] min-h-[20px] flex items-center justify-center touch-manipulation"
                  aria-label={`Go to tip ${index + 1}`}
                >
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentTip 
                        ? "w-6 bg-primary" 
                        : index < currentTip 
                          ? "w-2 bg-primary/50" 
                          : "w-2 bg-border"
                    }`}
                  />
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentTip}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="text-center"
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <TipIcon className="w-7 h-7 text-primary" />
                </div>

                <h3 className="font-display text-lg tracking-wide mb-2">{tip.title}</h3>
                <p className="text-muted-foreground text-sm mb-5 px-2">{tip.description}</p>
              </motion.div>
            </AnimatePresence>

            {/* Navigation - larger touch targets */}
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={currentTip === 0 ? handleClose : handlePrev}
                className="min-h-[44px] min-w-[70px] text-muted-foreground touch-manipulation"
              >
                {currentTip === 0 ? "Skip" : "Back"}
              </Button>

              <span className="text-xs text-muted-foreground">
                {currentTip + 1} / {tips.length}
              </span>

              <Button 
                size="sm" 
                onClick={handleNext}
                className="min-h-[44px] min-w-[70px] touch-manipulation"
              >
                {currentTip === tips.length - 1 ? "Got it!" : "Next"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StudioHelper;
