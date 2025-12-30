import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, PartyPopper, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FirstOutfitCelebrationProps {
  trigger: boolean;
}

const confettiColors = ["#ffd700", "#ff6b6b", "#4ecdc4", "#a855f7", "#22c55e"];

const Confetti = () => {
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 2,
    color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
    size: 4 + Math.random() * 8,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
      {pieces.map((piece) => (
        <motion.div
          key={piece.id}
          initial={{
            opacity: 1,
            x: `${piece.x}vw`,
            y: -20,
            rotate: 0,
          }}
          animate={{
            opacity: [1, 1, 0],
            y: "110vh",
            rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
          }}
          transition={{
            duration: piece.duration,
            delay: piece.delay,
            ease: "easeIn",
          }}
          style={{
            position: "absolute",
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "0%",
          }}
        />
      ))}
    </div>
  );
};

const FirstOutfitCelebration = ({ trigger }: FirstOutfitCelebrationProps) => {
  const [showCelebration, setShowCelebration] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  const handleDismiss = () => {
    setShowCelebration(false);
  };

  useEffect(() => {
    if (trigger && !hasShown) {
      const hasSeenCelebration = localStorage.getItem("hasSeenFirstOutfitCelebration");
      if (!hasSeenCelebration) {
        setShowCelebration(true);
        setHasShown(true);
        localStorage.setItem("hasSeenFirstOutfitCelebration", "true");
        
        // Auto-hide after 6 seconds
        const timer = setTimeout(() => {
          setShowCelebration(false);
        }, 6000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [trigger, hasShown]);

  return (
    <AnimatePresence>
      {showCelebration && (
        <>
          <Confetti />
          {/* Backdrop - click to dismiss */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismiss}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[199] touch-manipulation"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 50 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[200]"
          >
            <div className="bg-card border border-primary/30 rounded-2xl p-8 shadow-2xl shadow-primary/20 text-center max-w-sm mx-4 relative">
              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDismiss}
                className="absolute top-2 right-2 min-w-[44px] min-h-[44px] touch-manipulation active:scale-95"
              >
                <X className="w-5 h-5" />
              </Button>
              
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: 2 }}
                className="inline-block mb-4"
              >
                <PartyPopper className="w-16 h-16 text-primary" />
              </motion.div>
              
              <h2 className="font-display text-xl tracking-wide mb-2">
                YOUR FIRST OUTFIT!
              </h2>
              
              <p className="text-muted-foreground text-sm mb-4">
                Amazing! You've just created your first virtual try-on. Keep experimenting with different styles!
              </p>
              
              <div className="flex items-center justify-center gap-2 text-xs text-primary mb-4">
                <Sparkles className="w-4 h-4" />
                <span>You're on your way to style mastery</span>
              </div>
              
              <Button 
                onClick={handleDismiss}
                className="w-full min-h-[44px] touch-manipulation active:scale-[0.98]"
              >
                Continue
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FirstOutfitCelebration;
