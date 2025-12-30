import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { GenerationQueueProvider } from "@/hooks/useGenerationQueue";
import { CreditsProvider } from "@/hooks/useCredits";
import { AnimatePresence } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import QueueProcessingIndicator from "@/components/QueueProcessingIndicator";
import PageLoader from "@/components/PageLoader";

// Lazy load all pages for faster initial load
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Studio = lazy(() => import("./pages/Studio"));
const MyOutfits = lazy(() => import("./pages/MyOutfits"));
const Feed = lazy(() => import("./pages/Feed"));
const Profile = lazy(() => import("./pages/Profile"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const OutfitView = lazy(() => import("./pages/OutfitView"));
const GenderSetup = lazy(() => import("./pages/GenderSetup"));
const BrandContact = lazy(() => import("./pages/BrandContact"));
const Wardrobe = lazy(() => import("./pages/Wardrobe"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const Settings = lazy(() => import("./pages/Settings"));
const CreditsSuccess = lazy(() => import("./pages/CreditsSuccess"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes - keep cache longer
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1, // Only retry once for faster failure
    },
  },
});

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<PageLoader />}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><Index /></PageTransition>} />
          <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
          <Route path="/studio" element={<PageTransition><Studio /></PageTransition>} />
          <Route path="/wardrobe" element={<PageTransition><Wardrobe /></PageTransition>} />
          <Route path="/my-outfits" element={<PageTransition><MyOutfits /></PageTransition>} />
          <Route path="/gallery" element={<Navigate to="/my-outfits" replace />} />
          <Route path="/saved-outfits" element={<Navigate to="/my-outfits" state={{ tab: "saved" }} replace />} />
          <Route path="/setup" element={<PageTransition><GenderSetup /></PageTransition>} />
          <Route path="/gender-setup" element={<PageTransition><GenderSetup /></PageTransition>} />
          <Route path="/generate" element={<Navigate to="/wardrobe" replace />} />
          <Route path="/brands" element={<PageTransition><BrandContact /></PageTransition>} />
          <Route path="/how-it-works" element={<PageTransition><HowItWorks /></PageTransition>} />
          <Route path="/settings" element={<PageTransition><Settings /></PageTransition>} />
          <Route path="/credits-success" element={<PageTransition><CreditsSuccess /></PageTransition>} />
          <Route path="/feed" element={<PageTransition><Feed /></PageTransition>} />
          <Route path="/profile/:userId" element={<PageTransition><Profile /></PageTransition>} />
          <Route path="/edit-profile" element={<PageTransition><EditProfile /></PageTransition>} />
          <Route path="/outfit/:outfitId" element={<PageTransition><OutfitView /></PageTransition>} />
          <Route path="/terms" element={<PageTransition><Terms /></PageTransition>} />
          <Route path="/privacy" element={<PageTransition><Privacy /></PageTransition>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CreditsProvider>
            <GenerationQueueProvider>
              <AnimatedRoutes />
              <QueueProcessingIndicator />
            </GenerationQueueProvider>
          </CreditsProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;