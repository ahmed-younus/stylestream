import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { Sparkles, Heart, Trash2, ExternalLink, Images, Layers } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGenerationQueue, QueuedGeneration } from "@/hooks/useGenerationQueue";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SaveOutfitDialog from "@/components/SaveOutfitDialog";
import OutfitCard from "@/components/OutfitCard";
import { Product } from "@/types/product";
import { uploadCompressedImage } from "@/utils/imageStorage";

interface SavedOutfit {
  id: string;
  try_on_image: string;
  avatar_image: string;
  products: Product[];
  total_price: number;
  created_at: string;
}

// Cache for saved outfits - exported for external invalidation
export const outfitsCache = new Map<string, { data: SavedOutfit[]; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute

// Function to invalidate cache from other components
export const invalidateOutfitsCache = (userId?: string) => {
  if (userId) {
    outfitsCache.delete(userId);
  } else {
    outfitsCache.clear();
  }
};

const MyOutfits = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { completedGenerations, removeCompleted, clearCompleted } = useGenerationQueue();
  
  const [activeTab, setActiveTab] = useState<string>("recent");
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [selectedGeneration, setSelectedGeneration] = useState<QueuedGeneration | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const hasFetched = useRef(false);

  // Handle navigation state
  useEffect(() => {
    if (location.state?.viewGeneration) {
      setSelectedGeneration(location.state.viewGeneration);
      setActiveTab("recent");
      window.history.replaceState({}, document.title);
    }
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchSavedOutfits();
    }
  }, [user]);

  const [fetchError, setFetchError] = useState(false);

  const fetchSavedOutfits = useCallback(async (retryCount = 0) => {
    if (!user) return;
    
    // Check cache first - always show cached data immediately
    const cached = outfitsCache.get(user.id);
    if (cached) {
      setSavedOutfits(cached.data);
      // If cache is fresh, don't refetch
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        setLoadingSaved(false);
        return;
      }
    }
    
    if (!hasFetched.current && !cached) {
      setLoadingSaved(true);
    }
    
    try {
      setFetchError(false);
      
      // Shorter timeout for mobile - 5 seconds max
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      // Fetch minimal data - only 10 items for faster response
      const { data, error } = await supabase
        .from("saved_outfits")
        .select("id, try_on_image, products, total_price, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10)
        .abortSignal(controller.signal);

      clearTimeout(timeoutId);
      
      if (error) throw error;
      
      const parsedOutfits = (data || []).map((outfit: any) => ({
        ...outfit,
        avatar_image: '', // Not needed for display
        products: outfit.products as unknown as Product[]
      }));
      
      setSavedOutfits(parsedOutfits);
      outfitsCache.set(user.id, { data: parsedOutfits, timestamp: Date.now() });
    } catch (err: any) {
      // Retry once on timeout
      if (err?.name === 'AbortError' && retryCount < 1) {
        console.log('Retrying fetch...');
        return fetchSavedOutfits(retryCount + 1);
      }
      
      if (err?.name !== 'AbortError') {
        console.error("Error fetching outfits:", err);
      }
      
      // Show error state only if no cached data
      if (!cached) {
        setFetchError(true);
      }
    } finally {
      setLoadingSaved(false);
      hasFetched.current = true;
    }
  }, [user]);

  const handleSaveOutfit = async (caption: string, isPublic: boolean) => {
    if (!selectedGeneration?.tryOnImage || !user) return;

    setIsSaving(true);
    try {
      toast.loading("Uploading images...", { id: "save-outfit" });
      
      const [tryOnUrl, avatarUrl] = await Promise.all([
        uploadCompressedImage(selectedGeneration.tryOnImage, user.id, 'try-on'),
        uploadCompressedImage(selectedGeneration.avatarImage, user.id, 'avatar')
      ]);
      
      const cleanProducts = selectedGeneration.products.map(p => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        price: p.price,
        category: p.category,
        image: p.image,
        affiliateUrl: p.affiliateUrl
      }));
      
      const { data, error } = await supabase.from("saved_outfits").insert([{
        user_id: user.id,
        try_on_image: tryOnUrl,
        avatar_image: avatarUrl,
        products: cleanProducts,
        total_price: selectedGeneration.totalPrice,
        caption: caption || null,
        is_public: isPublic
      }]).select().single();

      if (error) throw error;

      toast.success(isPublic ? "Outfit saved and shared!" : "Outfit saved!", { id: "save-outfit" });
      setShowSaveDialog(false);
      removeCompleted(selectedGeneration.id);
      setSelectedGeneration(null);
      
      if (data) {
        const newOutfit = { ...data, products: data.products as unknown as Product[] };
        setSavedOutfits(prev => [newOutfit, ...prev]);
        // Update cache
        outfitsCache.set(user.id, { 
          data: [newOutfit, ...savedOutfits], 
          timestamp: Date.now() 
        });
      }
      
      setActiveTab("saved");
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Failed to save outfit", { id: "save-outfit" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleShopProducts = (products: Product[]) => {
    products.forEach(p => {
      if (p.affiliateUrl) {
        window.open(p.affiliateUrl, "_blank");
      }
    });
    toast.success(`Opening ${products.length} product page(s)`);
  };

  const handleDiscardGeneration = (generation: QueuedGeneration) => {
    removeCompleted(generation.id);
    if (selectedGeneration?.id === generation.id) {
      setSelectedGeneration(null);
    }
    toast.success("Removed");
  };

  const handleDeleteSaved = async (id: string) => {
    // Optimistic update
    const prev = savedOutfits;
    setSavedOutfits(savedOutfits.filter(o => o.id !== id));
    
    try {
      const { error } = await supabase.from("saved_outfits").delete().eq("id", id);
      if (error) throw error;
      toast.success("Outfit deleted");
      // Update cache
      if (user) {
        outfitsCache.set(user.id, { 
          data: savedOutfits.filter(o => o.id !== id), 
          timestamp: Date.now() 
        });
      }
    } catch (err) {
      console.error("Error deleting outfit:", err);
      setSavedOutfits(prev); // Revert
      toast.error("Failed to delete outfit");
    }
  };

  const handleEditSaved = (id: string) => {
    const outfit = savedOutfits.find(o => o.id === id);
    if (outfit) {
      navigate("/studio", { 
        state: { 
          resumeOutfit: {
            avatarImage: outfit.avatar_image,
            products: outfit.products,
            outfitId: outfit.id,
          }
        } 
      });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-foreground/20 border-t-foreground animate-spin rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <Images className="w-16 h-16 text-muted-foreground mb-4" />
          <h1 className="font-display text-2xl mb-2">My Outfits</h1>
          <p className="text-muted-foreground text-center mb-6">Sign in to view your outfits</p>
          <Button onClick={() => navigate("/auth")}>Sign In</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <section className="pt-20 pb-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-6">
            <h1 className="font-display text-xl md:text-2xl tracking-wide mb-2">MY OUTFITS</h1>
            <p className="text-sm text-muted-foreground">View your generated and saved looks</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
              <TabsTrigger value="recent" className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Recent
                {completedGenerations.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-primary text-primary-foreground rounded-full">
                    {completedGenerations.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="saved" className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Saved
                {savedOutfits.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-muted text-muted-foreground rounded-full">
                    {savedOutfits.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="recent">
              {completedGenerations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-card border border-border rounded-xl">
                  <Sparkles className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                  <h2 className="font-display text-lg mb-2">No recent generations</h2>
                  <p className="text-muted-foreground text-center mb-6 max-w-sm text-sm">
                    Generate outfits in the Studio. Add multiple to the queue to save time!
                  </p>
                  <Button onClick={() => navigate("/studio")}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Go to Studio
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {completedGenerations.length} ready for review
                    </p>
                    <Button variant="ghost" size="sm" onClick={clearCompleted}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear All
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <AnimatePresence>
                        {completedGenerations.map((generation) => (
                          <motion.div
                            key={generation.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedGeneration(generation)}
                            className={`relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                              selectedGeneration?.id === generation.id 
                                ? "border-primary ring-2 ring-primary/20" 
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            <img src={generation.tryOnImage} alt="Generated outfit" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                            <div className="absolute bottom-2 left-2 right-2">
                              <p className="text-xs font-medium">{generation.products.length} items</p>
                              <p className="text-xs text-primary font-semibold">£{generation.totalPrice.toFixed(0)}</p>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDiscardGeneration(generation); }}
                              className="absolute top-2 right-2 p-1.5 bg-background/80 rounded-full hover:bg-destructive hover:text-destructive-foreground transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>

                    <div className="lg:sticky lg:top-24 h-fit">
                      {selectedGeneration ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="bg-card border border-border rounded-xl overflow-hidden"
                        >
                          <div className="aspect-[3/4] max-h-[50vh] relative">
                            <img src={selectedGeneration.tryOnImage} alt="Generated outfit" className="w-full h-full object-cover" />
                          </div>
                          
                          <div className="p-4 space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 className="font-display text-sm">{selectedGeneration.products.length} ITEMS</h3>
                              <p className="text-lg font-display text-primary">£{selectedGeneration.totalPrice.toFixed(0)}</p>
                            </div>
                            
                            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2">
                              {selectedGeneration.products.map((product) => (
                                <div key={product.id} className="flex-shrink-0">
                                  <img src={product.image} alt={product.name} className="w-14 h-14 object-cover rounded-lg border border-border" />
                                  <p className="text-[10px] text-muted-foreground mt-1 w-14 truncate">{product.brand}</p>
                                </div>
                              ))}
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <Button variant="primaryOutline" onClick={() => setShowSaveDialog(true)}>
                                <Heart className="w-4 h-4 mr-2" />
                                Save
                              </Button>
                              <Button variant="primary" onClick={() => handleShopProducts(selectedGeneration.products)}>
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Shop
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        <div className="bg-card border border-border rounded-xl p-8 text-center">
                          <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                          <p className="text-sm text-muted-foreground">Select an outfit to view details</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="saved">
              {loadingSaved ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground animate-spin rounded-full" />
                  <p className="text-xs text-muted-foreground">Loading your outfits...</p>
                </div>
              ) : fetchError ? (
                <div className="flex flex-col items-center justify-center py-16 bg-card border border-border rounded-xl">
                  <Heart className="w-12 h-12 text-muted-foreground/30 mb-4" />
                  <h2 className="font-display text-lg mb-2">Couldn't load outfits</h2>
                  <p className="text-muted-foreground text-center mb-6 max-w-sm text-sm">
                    Network may be slow. Tap to retry.
                  </p>
                  <Button onClick={() => { hasFetched.current = false; fetchSavedOutfits(); }}>
                    Retry
                  </Button>
                </div>
              ) : savedOutfits.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-card border border-border rounded-xl">
                  <Heart className="w-12 h-12 text-muted-foreground/30 mb-4" />
                  <h2 className="font-display text-lg mb-2">No saved outfits</h2>
                  <p className="text-muted-foreground text-center mb-6 max-w-sm text-sm">
                    Generate outfits and save your favorites!
                  </p>
                  <Button onClick={() => navigate("/studio")}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Start Creating
                  </Button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {savedOutfits.map((outfit, index) => (
                    <OutfitCard
                      key={outfit.id}
                      id={outfit.id}
                      tryOnImage={outfit.try_on_image}
                      products={outfit.products}
                      totalPrice={outfit.total_price}
                      createdAt={outfit.created_at}
                      onDelete={handleDeleteSaved}
                      onEdit={handleEditSaved}
                      index={Math.min(index, 3)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <SaveOutfitDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        onSave={handleSaveOutfit}
        isSaving={isSaving}
      />
    </main>
  );
};

export default MyOutfits;