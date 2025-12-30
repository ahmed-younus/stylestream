import { motion } from "framer-motion";
import { useState } from "react";
import modelBefore from "@/assets/model-before.jpg";
import modelAfter from "@/assets/model-after.jpg";

const BeforeAfter = () => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const handleMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = ((clientX - rect.left) / rect.width) * 100;
    setSliderPosition(Math.min(Math.max(x, 0), 100));
  };

  return (
    <section className="py-24 px-6 bg-noir-light noise-overlay">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 mb-4 text-xs font-body font-medium tracking-widest uppercase text-gold border border-gold/30 rounded-full">
            See The Magic
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-medium mb-4">
            Drag to Compare
          </h2>
          <p className="font-body text-muted-foreground max-w-lg mx-auto">
            Experience how Style Dream transforms your photos with photorealistic virtual try-ons
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative max-w-md mx-auto aspect-[3/4] rounded-3xl overflow-hidden cursor-ew-resize select-none shadow-2xl"
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          onMouseMove={handleMove}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          onTouchMove={handleMove}
        >
          {/* After Image (bottom layer) */}
          <img
            src={modelAfter}
            alt="After - Designer outfit"
            className="absolute inset-0 w-full h-full object-cover object-top"
          />
          
          {/* Before Image (top layer, clipped) */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ width: `${sliderPosition}%` }}
          >
            <img
              src={modelBefore}
              alt="Before - Casual outfit"
              className="absolute inset-0 w-full h-full object-cover object-top"
              style={{ width: `${100 / (sliderPosition / 100)}%`, maxWidth: 'none' }}
            />
          </div>

          {/* Slider Line */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-foreground/80 shadow-lg"
            style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-foreground flex items-center justify-center shadow-xl">
              <div className="flex gap-0.5">
                <div className="w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-noir" />
                <div className="w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-noir" />
              </div>
            </div>
          </div>

          {/* Labels */}
          <div className="absolute bottom-6 left-6 px-3 py-1.5 bg-noir/80 backdrop-blur-sm rounded-full text-xs font-body">
            Before
          </div>
          <div className="absolute bottom-6 right-6 px-3 py-1.5 bg-gold/90 text-noir rounded-full text-xs font-body font-medium">
            After
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center text-sm text-muted-foreground mt-6"
        >
          Drag the slider to compare outfits
        </motion.p>
      </div>
    </section>
  );
};

export default BeforeAfter;
