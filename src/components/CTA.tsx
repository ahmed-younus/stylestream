import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CTA = () => {
  const navigate = useNavigate();

  const scrollToUpload = () => {
    const uploadSection = document.getElementById("avatar-builder");
    uploadSection?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="py-24 px-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-card via-background to-card" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-foreground/5 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl mx-auto text-center relative z-10"
      >
        <div className="w-16 h-16 border border-border rounded-full flex items-center justify-center mx-auto mb-8 bg-card">
          <Sparkles className="w-6 h-6" />
        </div>

        <h2 className="font-display text-3xl md:text-4xl lg:text-5xl mb-6 tracking-[0.05em]">
          READY TO TRY
          <br />
          <span className="text-muted-foreground">BEFORE YOU BUY?</span>
        </h2>

        <p className="font-body text-muted-foreground mb-10 max-w-md mx-auto">
          Join thousands using AI to shop smarter. 
          No more guessing if it will fit or suit you.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            variant="primary" 
            size="xl" 
            onClick={scrollToUpload}
            className="tracking-[0.15em] min-h-[48px] touch-manipulation active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4" />
            START FREE
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            size="xl" 
            onClick={() => navigate('/feed')}
            className="tracking-[0.15em] min-h-[48px] touch-manipulation active:scale-[0.98]"
          >
            EXPLORE OUTFITS
          </Button>
        </div>

        <p className="font-body text-xs text-muted-foreground mt-8 tracking-wide">
          Free to try • No credit card required • Works on any device
        </p>
      </motion.div>
    </section>
  );
};

export default CTA;
