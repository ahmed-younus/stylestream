import { motion } from "framer-motion";
import { Play, Upload, Search, Sparkles, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const steps = [
  {
    number: "01",
    title: "Upload Your Photo",
    description: "Take a full-body photo or upload one from your gallery. Our AI works best with clear, well-lit images.",
    icon: Upload,
  },
  {
    number: "02",
    title: "Find Clothes You Love",
    description: "Search for products, paste links from your favorite retailers, or let AI generate outfit recommendations.",
    icon: Search,
  },
  {
    number: "03",
    title: "Try On Virtually",
    description: "Watch as AI instantly shows you wearing the clothes. See how different items look on your body.",
    icon: Sparkles,
  },
  {
    number: "04",
    title: "Shop With Confidence",
    description: "Save your favorites to your wardrobe, share outfits with friends, and purchase items you love.",
    icon: ShoppingBag,
  },
];

const HowItWorks = () => {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <section className="pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl mb-4 tracking-[0.1em]">
              HOW IT WORKS
            </h1>
            <p className="font-body text-muted-foreground max-w-xl mx-auto text-lg">
              Virtual try-on powered by AI. See yourself in any outfit in seconds.
            </p>
          </motion.div>

          {/* Video Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-20"
          >
            <div className="relative aspect-video bg-card border border-border rounded-lg overflow-hidden">
              {/* Placeholder for video - in production this would be an embedded video */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-secondary to-card">
                <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center mb-4 cursor-pointer hover:scale-105 transition-transform">
                  <Play className="w-8 h-8 text-primary-foreground ml-1" />
                </div>
                <p className="text-muted-foreground text-sm tracking-wide uppercase">Watch Demo Video</p>
                <p className="text-muted-foreground/60 text-xs mt-2">2 min tutorial</p>
              </div>
              
              {/* Note: Replace this div with actual video embed */}
              {/* Example:
              <iframe
                src="https://www.youtube.com/embed/VIDEO_ID"
                title="How to use Style Dream"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
              */}
            </div>
          </motion.div>

          {/* Steps */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="bg-card border border-border p-8 group hover:border-foreground/30 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <span className="font-display text-4xl text-muted-foreground/30 group-hover:text-foreground/50 transition-colors">
                      {step.number}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="w-12 h-12 border border-border flex items-center justify-center mb-4 group-hover:border-foreground/30 transition-colors">
                      <step.icon className="w-6 h-6 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                    <h3 className="font-display text-lg mb-2 tracking-wide">{step.title}</h3>
                    <p className="text-muted-foreground font-body leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Tips Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-card border border-border p-8 mb-16"
          >
            <h2 className="font-display text-xl mb-6 tracking-wide text-center">
              TIPS FOR BEST RESULTS
            </h2>
            <div className="grid sm:grid-cols-3 gap-6 text-center">
              <div>
                <div className="w-12 h-12 border border-border rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-lg">📸</span>
                </div>
                <h4 className="font-medium mb-1 text-sm">Good Lighting</h4>
                <p className="text-xs text-muted-foreground">Natural light works best for accurate results</p>
              </div>
              <div>
                <div className="w-12 h-12 border border-border rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-lg">🧍</span>
                </div>
                <h4 className="font-medium mb-1 text-sm">Full Body</h4>
                <p className="text-xs text-muted-foreground">Stand straight, arms relaxed at your sides</p>
              </div>
              <div>
                <div className="w-12 h-12 border border-border rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-lg">👕</span>
                </div>
                <h4 className="font-medium mb-1 text-sm">Fitted Clothing</h4>
                <p className="text-xs text-muted-foreground">Wear form-fitting clothes for better AI mapping</p>
              </div>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-center"
          >
            <Button
              variant="primary"
              size="xl"
              onClick={() => navigate("/studio")}
              className="tracking-[0.15em] min-h-[48px] touch-manipulation active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4" />
              TRY IT NOW
              <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </section>
      
      <Footer />
    </main>
  );
};

export default HowItWorks;
