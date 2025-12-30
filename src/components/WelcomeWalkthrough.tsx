import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Search, Sparkles, Heart, Users, Share2, ChevronRight, ChevronLeft, X } from "lucide-react";

const steps = [
  {
    icon: Camera,
    title: "Upload Your Photo",
    description: "Start by uploading a full-body photo of yourself. For best results, wear form-fitting clothes like a t-shirt and joggers.",
    tip: "The AI works best with clear, well-lit photos where your full body is visible."
  },
  {
    icon: Search,
    title: "Find Your Style",
    description: "Browse our catalog or use the AI Shopping Assistant to search for specific items. You can even paste links from fashion websites!",
    tip: "Try searching for 'Nike Jordan's' or paste a link from ASOS to find exact products."
  },
  {
    icon: Sparkles,
    title: "Try On with AI",
    description: "Select clothing items and watch our AI dress your avatar in seconds. Mix and match tops, bottoms, jackets, and accessories.",
    tip: "You can layer items - try a coat over a t-shirt to see how outfits look together."
  },
  {
    icon: Heart,
    title: "Save Your Outfits",
    description: "Love a look? Save it to your collection. Choose to keep it private or share it with the community.",
    tip: "Saved outfits include store tags so you can easily shop the items later."
  },
  {
    icon: Users,
    title: "Join the Community",
    description: "Follow friends, discover new styles, and get inspired by outfit posts from other users in the Feed.",
    tip: "Rate outfits with stars and leave comments to help others find the best looks."
  },
  {
    icon: Share2,
    title: "Share & Connect",
    description: "Share your favorite outfits to social media, get notifications when people interact with your posts, and build your style profile.",
    tip: "You'll get notified when someone likes, comments, or rates your outfits!"
  }
];

const WelcomeWalkthrough = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasSeenWalkthrough = localStorage.getItem("hasSeenWalkthrough");
    if (!hasSeenWalkthrough) {
      const timer = setTimeout(() => setIsOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem("hasSeenWalkthrough", "true");
    setIsOpen(false);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep];
  const IconComponent = currentStepData.icon;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-border bg-background">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 z-10 p-1 rounded-full hover:bg-secondary transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className="p-6">
          {/* Step indicator */}
          <div className="flex justify-center gap-1.5 mb-6">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentStep 
                    ? "w-6 bg-primary" 
                    : index < currentStep 
                      ? "w-1.5 bg-primary/50" 
                      : "w-1.5 bg-border"
                }`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="text-center"
            >
              {/* Icon */}
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <IconComponent className="w-8 h-8 text-primary" />
              </div>

              {/* Content */}
              <h2 className="font-display text-xl tracking-wide mb-2">
                {currentStepData.title}
              </h2>
              <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                {currentStepData.description}
              </p>

              {/* Tip */}
              <div className="bg-secondary/50 border border-border rounded-lg p-3 text-left">
                <p className="text-xs text-muted-foreground">
                  <span className="text-primary font-medium">Tip: </span>
                  {currentStepData.tip}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="text-muted-foreground"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>

            <span className="text-xs text-muted-foreground">
              {currentStep + 1} of {steps.length}
            </span>

            <Button
              size="sm"
              onClick={handleNext}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {currentStep === steps.length - 1 ? "Get Started" : "Next"}
              {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>

          {/* Skip option */}
          {currentStep < steps.length - 1 && (
            <button
              onClick={handleClose}
              className="w-full mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip walkthrough
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeWalkthrough;
