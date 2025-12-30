import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import AvatarBuilder from "@/components/AvatarBuilder";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import ResumeSessionBanner from "@/components/ResumeSessionBanner";
import { useSessionPersistence } from "@/hooks/useSessionPersistence";
import { AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import WelcomeWalkthrough from "@/components/WelcomeWalkthrough";
import OnboardingTips from "@/components/OnboardingTips";
import DailyRewardBanner from "@/components/DailyRewardBanner";

const Index = () => {
  const navigate = useNavigate();
  const { abandonedSession, clearSession, dismissAbandonedSession } = useSessionPersistence();

  const handleAvatarReady = (imageData: string) => {
    navigate("/studio", { state: { resumeOutfit: { avatarImage: imageData, products: [] } } });
  };

  const handleResumeAbandonedSession = () => {
    if (abandonedSession) {
      navigate("/studio", { 
        state: { 
          resumeOutfit: { 
            avatarImage: abandonedSession.avatarImageRef, 
            products: [] // Products will be reloaded from IDs if needed
          } 
        } 
      });
      clearSession();
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <AnimatePresence>
        {abandonedSession && abandonedSession.avatarImageRef && (
          <ResumeSessionBanner
            avatarImage={abandonedSession.avatarImageRef}
            products={[]}
            onResume={handleResumeAbandonedSession}
            onDismiss={dismissAbandonedSession}
          />
        )}
      </AnimatePresence>
      
      <Hero />
      <DailyRewardBanner />
      <OnboardingTips />
      <AvatarBuilder onAvatarReady={handleAvatarReady} />
      <CTA />
      <Footer />
      
      {/* Welcome walkthrough for new users */}
      <WelcomeWalkthrough />

      {/* Floating Quick Access Button */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 200 }}
        className="fixed bottom-6 right-6 z-50 md:hidden"
      >
        <Button
          onClick={() => navigate("/studio")}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-shadow touch-manipulation active:scale-95"
          aria-label="Open Try-On Studio"
        >
          <Sparkles className="w-6 h-6" />
        </Button>
      </motion.div>
    </main>
  );
};

export default Index;
