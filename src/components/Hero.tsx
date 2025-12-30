import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown, Sparkles, Shirt } from "lucide-react";
import { Button } from "./ui/button";

// Model 1: Black Male - Base + 2 outfits
import blackMaleBase from "@/assets/demo-black-male-base.jpg";
import blackMaleOutfit1 from "@/assets/demo-black-male-outfit1.jpg";
import blackMaleOutfit2 from "@/assets/demo-black-male-outfit2.jpg";

// Model 2: Asian Female - Base + 2 outfits
import asianFemaleBase from "@/assets/demo-asian-female-base.jpg";
import asianFemaleOutfit1 from "@/assets/demo-asian-female-outfit1.jpg";
import asianFemaleOutfit2 from "@/assets/demo-asian-female-outfit2.jpg";

// Model 3: Latina Female - Base + 2 outfits
import latinaFemaleBase from "@/assets/demo-latina-female-base.jpg";
import latinaFemaleOutfit1 from "@/assets/demo-latina-female-outfit1.jpg";
import latinaFemaleOutfit2 from "@/assets/demo-latina-female-outfit2.jpg";

// Define model sequences - each model shows 3 looks (base + 2 outfits)
const modelSequences = [
  // Model 1: Black Male
  {
    modelId: "black-male",
    modelName: "Marcus",
    outfits: [
      {
        id: 0,
        image: blackMaleBase,
        label: "Your Photo",
        items: [
          { name: "White T-Shirt", retailer: "Your wardrobe", price: "—" },
          { name: "Light Jeans", retailer: "Your wardrobe", price: "—" },
          { name: "White Sneakers", retailer: "Your wardrobe", price: "—" },
        ],
        isBase: true,
      },
      {
        id: 1,
        image: blackMaleOutfit1,
        label: "Streetwear",
        items: [
          { name: "Leather Jacket", retailer: "AllSaints", price: "£349" },
          { name: "Grey Hoodie", retailer: "Nike", price: "£65" },
          { name: "Dark Jeans", retailer: "Levi's", price: "£95" },
        ],
        isBase: false,
      },
      {
        id: 2,
        image: blackMaleOutfit2,
        label: "Smart Casual",
        items: [
          { name: "Navy Suit", retailer: "Reiss", price: "£495" },
          { name: "White Shirt", retailer: "Charles Tyrwhitt", price: "£70" },
          { name: "Leather Loafers", retailer: "Grenson", price: "£195" },
        ],
        isBase: false,
      },
    ],
  },
  // Model 2: Asian Female
  {
    modelId: "asian-female",
    modelName: "Yuki",
    outfits: [
      {
        id: 0,
        image: asianFemaleBase,
        label: "Your Photo",
        items: [
          { name: "White Blouse", retailer: "Your wardrobe", price: "—" },
          { name: "Beige Trousers", retailer: "Your wardrobe", price: "—" },
          { name: "Nude Heels", retailer: "Your wardrobe", price: "—" },
        ],
        isBase: true,
      },
      {
        id: 1,
        image: asianFemaleOutfit1,
        label: "Evening Glam",
        items: [
          { name: "Black Midi Dress", retailer: "Reformation", price: "£248" },
          { name: "Gold Necklace", retailer: "Monica Vinader", price: "£125" },
          { name: "Strappy Heels", retailer: "Stuart Weitzman", price: "£350" },
        ],
        isBase: false,
      },
      {
        id: 2,
        image: asianFemaleOutfit2,
        label: "Cozy Chic",
        items: [
          { name: "Cable Knit Sweater", retailer: "& Other Stories", price: "£89" },
          { name: "High-Rise Jeans", retailer: "Agolde", price: "£245" },
          { name: "White Trainers", retailer: "Veja", price: "£120" },
        ],
        isBase: false,
      },
    ],
  },
  // Model 3: Latina Female
  {
    modelId: "latina-female",
    modelName: "Sofia",
    outfits: [
      {
        id: 0,
        image: latinaFemaleBase,
        label: "Your Photo",
        items: [
          { name: "Grey Crop Top", retailer: "Your wardrobe", price: "—" },
          { name: "Black Leggings", retailer: "Your wardrobe", price: "—" },
          { name: "Training Shoes", retailer: "Your wardrobe", price: "—" },
        ],
        isBase: true,
      },
      {
        id: 1,
        image: latinaFemaleOutfit1,
        label: "Active Vibes",
        items: [
          { name: "Geometric Sports Bra", retailer: "Nike", price: "£45" },
          { name: "Matching Leggings", retailer: "Nike", price: "£65" },
          { name: "Air Max 90", retailer: "Nike", price: "£130" },
        ],
        isBase: false,
      },
      {
        id: 2,
        image: latinaFemaleOutfit2,
        label: "Boss Babe",
        items: [
          { name: "Cropped Blazer", retailer: "Zara", price: "£69" },
          { name: "Silk Blouse", retailer: "Massimo Dutti", price: "£89" },
          { name: "Tailored Trousers", retailer: "Arket", price: "£95" },
        ],
        isBase: false,
      },
    ],
  },
];

const Hero = () => {
  const [currentModelIndex, setCurrentModelIndex] = useState(0);
  const [currentOutfitIndex, setCurrentOutfitIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const currentModel = modelSequences[currentModelIndex];
  const currentOutfit = currentModel.outfits[currentOutfitIndex];
  
  // Calculate total outfits shown across all models for progress indicator
  const totalSlides = modelSequences.reduce((acc, m) => acc + m.outfits.length, 0);
  const currentSlideIndex = modelSequences.slice(0, currentModelIndex).reduce((acc, m) => acc + m.outfits.length, 0) + currentOutfitIndex;

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        // Move to next outfit
        const nextOutfitIndex = currentOutfitIndex + 1;
        
        if (nextOutfitIndex >= currentModel.outfits.length) {
          // Move to next model
          const nextModelIndex = (currentModelIndex + 1) % modelSequences.length;
          setCurrentModelIndex(nextModelIndex);
          setCurrentOutfitIndex(0);
        } else {
          setCurrentOutfitIndex(nextOutfitIndex);
        }
        
        setIsTransitioning(false);
      }, 400);
    }, 2500);

    return () => clearInterval(interval);
  }, [currentModelIndex, currentOutfitIndex, currentModel.outfits.length]);

  const scrollToUpload = () => {
    const uploadSection = document.getElementById("avatar-builder");
    uploadSection?.scrollIntoView({ behavior: "smooth" });
  };

  const goToSlide = (slideIndex: number) => {
    let accumulated = 0;
    for (let modelIdx = 0; modelIdx < modelSequences.length; modelIdx++) {
      const model = modelSequences[modelIdx];
      if (slideIndex < accumulated + model.outfits.length) {
        setCurrentModelIndex(modelIdx);
        setCurrentOutfitIndex(slideIndex - accumulated);
        return;
      }
      accumulated += model.outfits.length;
    }
  };

  const totalPrice = currentOutfit.items.reduce((sum, item) => {
    const price = parseInt(item.price.replace(/[^0-9]/g, '')) || 0;
    return sum + price;
  }, 0);

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden pt-20 pb-16 bg-background">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-gradient-to-tl from-primary/5 to-transparent rounded-full blur-3xl" />
        
        <div className="absolute inset-0 opacity-[0.02]">
          <div className="h-full w-full" style={{
            backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
                              linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }} />
        </div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text content */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 mb-8 text-xs font-body font-medium tracking-[0.2em] uppercase text-muted-foreground border border-border bg-card/50 backdrop-blur-sm">
                <Sparkles className="w-3 h-3" />
                AI-Powered Virtual Try-On
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl leading-[1.05] mb-6"
            >
              <span className="text-gradient-primary">Try Clothes</span>
              <br />
              <span className="text-muted-foreground">Before You Buy</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="font-body text-lg text-muted-foreground mb-8 max-w-md mx-auto lg:mx-0 leading-relaxed"
            >
              Upload your photo and watch as AI instantly shows you 
              wearing any outfit from 1000+ brands. No changing room needed.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Button 
                variant="primary" 
                size="xl" 
                onClick={scrollToUpload}
                className="group tracking-[0.15em]"
              >
                <Sparkles className="w-4 h-4" />
                TRY IT FREE
                <ArrowDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-12 flex items-center gap-8 justify-center lg:justify-start"
            >
              {[
                { value: "30s", label: "Try-on time" },
                { value: "1000+", label: "Brands" },
                { value: "Free", label: "To start" },
              ].map((stat, i) => (
                <div key={i} className="text-center lg:text-left">
                  <div className="font-display text-2xl lg:text-3xl mb-1">{stat.value}</div>
                  <div className="text-[10px] text-muted-foreground tracking-[0.15em] uppercase">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: Try-On Demo showing clothes changing */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative order-1 lg:order-2"
          >
            <div className="relative aspect-[3/4] max-w-[260px] sm:max-w-xs mx-auto">
              {/* Glowing border effect */}
              <div className="absolute -inset-1 bg-gradient-to-b from-primary/20 via-primary/5 to-transparent rounded-sm blur-sm" />
              
              {/* Main preview container */}
              <div className="relative h-full border border-border bg-card overflow-hidden">
                
                {/* Shimmer effect during transition */}
                <AnimatePresence>
                  {isTransitioning && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-20 bg-gradient-to-r from-transparent via-foreground/10 to-transparent"
                      style={{
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 0.8s ease-in-out',
                      }}
                    />
                  )}
                </AnimatePresence>

                {/* Model with changing clothes */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${currentModel.modelId}-${currentOutfit.id}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0"
                  >
                    <img
                      src={currentOutfit.image}
                      alt={`${currentModel.modelName} - ${currentOutfit.label}`}
                      className="w-full h-full object-cover object-top"
                    />
                    
                    {/* Clothing change indicator overlay */}
                    {!currentOutfit.isBase && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                      >
                        <motion.div
                          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="w-24 h-24 border-2 border-foreground/20 rounded-full"
                        />
                      </motion.div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Style label */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`label-${currentModel.modelId}-${currentOutfit.id}`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-3 right-3 px-3 py-1.5 bg-foreground text-background"
                  >
                    <span className="text-[10px] font-display tracking-[0.15em]">{currentOutfit.label.toUpperCase()}</span>
                  </motion.div>
                </AnimatePresence>

                {/* Product tags with retailer - positioned at bottom left, not obstructing face */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`tags-${currentModel.modelId}-${currentOutfit.id}`}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.3 }}
                    className="absolute left-2 bottom-24 space-y-1.5"
                  >
                    {currentOutfit.items.map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 + i * 0.08 }}
                        className="flex items-center gap-2 px-2 py-1 bg-background/95 backdrop-blur-sm border border-border text-left"
                      >
                        <Shirt className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        <div>
                          <p className="text-[8px] text-muted-foreground tracking-[0.05em]">{item.retailer}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-[9px] text-foreground">{item.name}</p>
                            <p className="text-[9px] font-semibold text-foreground">{item.price}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </AnimatePresence>

                {/* Total price bar */}
                {!currentOutfit.isBase && (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`total-${currentModel.modelId}-${currentOutfit.id}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                      className="absolute bottom-12 left-2 right-2 px-3 py-2 bg-foreground text-background"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] tracking-[0.15em] uppercase">Outfit Total</span>
                        <span className="text-sm font-display">£{totalPrice}</span>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                )}

                {/* Outfit progress dots - grouped by model */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {Array.from({ length: totalSlides }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => goToSlide(i)}
                      className={`h-1.5 rounded-full transition-all ${
                        i === currentSlideIndex 
                          ? 'bg-foreground w-4' 
                          : 'bg-foreground/30 w-1.5 hover:bg-foreground/50'
                      }`}
                    />
                  ))}
                </div>

                {/* Try-on indicator with model name */}
                <div className="absolute top-3 left-3 flex items-center gap-2 px-2 py-1 bg-background/90 backdrop-blur-sm border border-border">
                  <motion.div
                    animate={{ 
                      scale: isTransitioning ? [1, 1.3, 1] : 1,
                      backgroundColor: isTransitioning ? ['hsl(142 76% 36%)', 'hsl(45 93% 47%)', 'hsl(142 76% 36%)'] : 'hsl(142 76% 36%)'
                    }}
                    transition={{ duration: 0.4 }}
                    className="w-2 h-2 bg-green-500 rounded-full"
                  />
                  <span className="text-[9px] tracking-[0.15em] uppercase text-muted-foreground">
                    {isTransitioning ? 'Trying On...' : 'Live Demo'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.button
          onClick={scrollToUpload}
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="text-[10px] tracking-[0.2em] uppercase">Scroll to Start</span>
          <div className="w-6 h-10 border border-border rounded-full flex justify-center pt-2">
            <motion.div
              animate={{ y: [0, 8, 0], opacity: [1, 0, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1 h-2 bg-foreground/50 rounded-full"
            />
          </div>
        </motion.button>
      </motion.div>
    </section>
  );
};

export default Hero;
