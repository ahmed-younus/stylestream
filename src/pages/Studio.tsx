import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import TryOnStudio from "@/components/TryOnStudio";
import AvatarBuilder from "@/components/AvatarBuilder";
import { useSessionPersistence } from "@/hooks/useSessionPersistence";
import { Product } from "@/types/product";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface ResumeOutfitState {
  avatarImage: string;
  products: Product[];
  outfitId?: string;
}

const STUDIO_AVATAR_KEY = "styledream_studio_avatar";

const Studio = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [initialProducts, setInitialProducts] = useState<Product[]>([]);
  const [isRestoring, setIsRestoring] = useState(true);
  
  const { abandonedSession, saveSession, clearSession } = useSessionPersistence();

  // Restore session on mount - handles page refresh
  useEffect(() => {
    const restoreSession = async () => {
      const state = location.state as { resumeOutfit?: ResumeOutfitState } | null;
      
      if (state?.resumeOutfit) {
        // Navigated with state - use it immediately
        setAvatarImage(state.resumeOutfit.avatarImage);
        setInitialProducts(state.resumeOutfit.products);
        if (state.resumeOutfit.avatarImage && !state.resumeOutfit.avatarImage.startsWith('data:image')) {
          localStorage.setItem(STUDIO_AVATAR_KEY, state.resumeOutfit.avatarImage);
        }
        window.history.replaceState({}, document.title);
        setIsRestoring(false);
        return;
      }
      
      // Check localStorage first (instant)
      const storedAvatar = localStorage.getItem(STUDIO_AVATAR_KEY);
      if (storedAvatar) {
        setAvatarImage(storedAvatar);
        setIsRestoring(false);
        return;
      }
      
      // Fall back to abandoned session (instant)
      if (abandonedSession?.avatarImageRef) {
        setAvatarImage(abandonedSession.avatarImageRef);
        clearSession();
        setIsRestoring(false);
        return;
      }
      
      // Stop showing loading - let user upload if no local data
      setIsRestoring(false);
      
      // Try to load from database in background (non-blocking)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const queryPromise = supabase
          .from('user_body_images')
          .select('image_url')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('timeout')), 3000)
        );

        try {
          const { data: bodyImages } = await Promise.race([queryPromise, timeoutPromise]) as any;
          if (bodyImages && bodyImages.length > 0 && !avatarImage) {
            setAvatarImage(bodyImages[0].image_url);
          }
        } catch {
          // Ignore timeout - user can upload manually
        }
      }
    };
    
    restoreSession();
  }, [location.state, abandonedSession, clearSession]);

  const handleAvatarReady = (imageData: string, faceData?: string) => {
    setAvatarImage(imageData);
    setFaceImage(faceData || null);
    // Persist URL-based avatars for refresh recovery
    if (!imageData.startsWith('data:image')) {
      localStorage.setItem(STUDIO_AVATAR_KEY, imageData);
    }
  };

  const handleBackToUpload = () => {
    setAvatarImage(null);
    setFaceImage(null);
    setInitialProducts([]);
    localStorage.removeItem(STUDIO_AVATAR_KEY);
  };

  // Show loading state while restoring
  if (isRestoring) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-10 h-10 border border-foreground/30 border-t-foreground animate-spin rounded-full" />
        </div>
      </main>
    );
  }

  // Show avatar builder if no avatar image
  if (!avatarImage) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <section className="py-8 md:py-20">
          <div className="max-w-4xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-6 md:mb-8"
            >
              <h1 className="font-display text-2xl md:text-5xl tracking-tight mb-3 md:mb-4">
                TRY-ON STUDIO
              </h1>
              <p className="text-muted-foreground font-body max-w-lg mx-auto text-sm md:text-base px-4">
                Upload your photo to start trying on clothes from top fashion brands
              </p>
            </motion.div>
            
            <AvatarBuilder onAvatarReady={handleAvatarReady} />
          </div>
        </section>
      </main>
    );
  }

  const handleAvatarChange = (newImage: string) => {
    setAvatarImage(newImage);
    // Persist URL-based avatars for refresh recovery
    if (!newImage.startsWith('data:image')) {
      localStorage.setItem(STUDIO_AVATAR_KEY, newImage);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <TryOnStudio 
        avatarImage={avatarImage} 
        faceImage={faceImage || undefined}
        onBack={handleBackToUpload}
        onAvatarChange={handleAvatarChange}
        initialProducts={initialProducts}
        onSessionChange={saveSession}
      />
    </main>
  );
};

export default Studio;
