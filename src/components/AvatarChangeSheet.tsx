import { useState, useRef, useEffect } from "react";
import { Camera, Upload, User, Loader2, ImageIcon, Shirt } from "lucide-react";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { uploadCompressedImage } from "@/utils/imageStorage";
import { Skeleton } from "./ui/skeleton";

interface SavedBodyImage {
  id: string;
  image_url: string;
  name: string | null;
  created_at: string;
}

interface SavedOutfitImage {
  id: string;
  avatar_image: string;
  created_at: string;
}

interface AvatarChangeSheetProps {
  currentAvatarImage: string;
  onAvatarChange: (newImage: string) => void;
  trigger?: React.ReactNode;
}

// LocalStorage key for persistent cache
const BODY_IMAGES_CACHE_KEY = 'body_images_cache';

// Get cached images from localStorage instantly
const getCachedImages = (userId: string): SavedBodyImage[] => {
  try {
    const cached = localStorage.getItem(`${BODY_IMAGES_CACHE_KEY}_${userId}`);
    return cached ? JSON.parse(cached) : [];
  } catch {
    return [];
  }
};

// Save images to localStorage for instant loading next time
const setCachedImages = (userId: string, images: SavedBodyImage[]) => {
  try {
    localStorage.setItem(`${BODY_IMAGES_CACHE_KEY}_${userId}`, JSON.stringify(images));
  } catch {
    // Storage full, ignore
  }
};

const AvatarChangeSheet = ({ currentAvatarImage, onAvatarChange, trigger }: AvatarChangeSheetProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  // Initialize with cached data immediately - no loading state needed
  const [savedImages, setSavedImages] = useState<SavedBodyImage[]>(() => 
    user ? getCachedImages(user.id) : []
  );
  const [outfitImages, setOutfitImages] = useState<SavedOutfitImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Load cached images when user changes
  useEffect(() => {
    if (user) {
      const cached = getCachedImages(user.id);
      if (cached.length > 0) {
        setSavedImages(cached);
      }
    }
  }, [user]);

  useEffect(() => {
    if (open && user) {
      // Fetch fresh data in background (cache already shown)
      fetchSavedImages();
      fetchOutfitImages();
    }
  }, [open, user]);

  const fetchSavedImages = async () => {
    if (!user) return;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      
      const { data, error } = await supabase
        .from('user_body_images')
        .select('id, image_url, name, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(4)
        .abortSignal(controller.signal);
      
      clearTimeout(timeoutId);
      
      if (!error && data) {
        setSavedImages(data);
        setCachedImages(user.id, data);
      }
    } catch (err) {
      console.error('Error fetching body images:', err);
    }
  };

  const fetchOutfitImages = async () => {
    if (!user) return;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      
      const { data, error } = await supabase
        .from('saved_outfits')
        .select('id, avatar_image, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(4)
        .abortSignal(controller.signal);
      
      clearTimeout(timeoutId);
      
      if (!error && data) {
        // Filter out duplicates based on avatar_image
        const uniqueImages = data.reduce((acc: SavedOutfitImage[], curr) => {
          if (!acc.some(img => img.avatar_image === curr.avatar_image)) {
            acc.push(curr);
          }
          return acc;
        }, []);
        setOutfitImages(uniqueImages);
      }
    } catch (err) {
      console.error('Error fetching outfit images:', err);
    }
  };

  const handleFileSelect = async (file: File) => {
    if (file && file.type.startsWith("image/")) {
      setIsProcessing(true);
      
      try {
        // Read file as base64 first for immediate preview
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
        
        const imageData = await base64Promise;
        
        // Immediately update UI with the new image
        onAvatarChange(imageData);
        setOpen(false);
        toast.success("Body image updated!");
        
        // Upload to storage in background (don't block UI)
        if (user) {
          // Upload to Supabase Storage for fast future loading
          const storageUrl = await uploadCompressedImage(imageData, user.id, 'avatar');
          
          // Save URL reference to database (not base64!)
          const { data, error } = await supabase.from('user_body_images').insert({
            user_id: user.id,
            image_url: storageUrl, // Storage URL instead of base64
            name: `Body ${new Date().toLocaleDateString()}`
          }).select().single();
          
          if (!error && data) {
            // Update localStorage cache with new image
            const cached = getCachedImages(user.id);
            setCachedImages(user.id, [data, ...cached.slice(0, 3)]);
          }
        }
      } catch (err) {
        console.error('Error saving image:', err);
        toast.error("Failed to save image");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleSelectSavedImage = (img: SavedBodyImage) => {
    if (!img.image_url) {
      toast.error("Image not available");
      return;
    }
    onAvatarChange(img.image_url);
    setOpen(false);
    toast.success("Body image updated!");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="min-h-[44px] touch-manipulation active:scale-[0.98]">
            <User className="w-4 h-4 mr-2" />
            Change Photo
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="bottom" className="h-auto max-h-[70vh] rounded-t-2xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="font-display text-lg tracking-wider text-center">
            CHANGE BODY IMAGE
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-5 pb-6">
          {/* Current Image + Upload Options side by side */}
          <div className="flex gap-4 items-start">
            {/* Current Image Preview */}
            <div className="w-20 h-28 rounded-lg overflow-hidden border-2 border-primary bg-secondary flex-shrink-0">
              <img 
                src={currentAvatarImage} 
                alt="Current avatar" 
                className="w-full h-full object-cover"
              />
            </div>

            {/* Upload Options */}
            <div className="flex-1 grid grid-cols-2 gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleInputChange}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleInputChange}
                className="hidden"
              />
              
              <Button
                variant="outline"
                className="flex flex-col items-center gap-1.5 h-auto py-3 touch-manipulation active:scale-[0.98]"
                onClick={() => cameraInputRef.current?.click()}
                disabled={isProcessing}
              >
                <Camera className="w-5 h-5" />
                <span className="text-[10px]">Take Photo</span>
              </Button>
              
              <Button
                variant="outline"
                className="flex flex-col items-center gap-1.5 h-auto py-3 touch-manipulation active:scale-[0.98]"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
              >
                <Upload className="w-5 h-5" />
                <span className="text-[10px]">Upload</span>
              </Button>
            </div>
          </div>

          {/* Saved Outfit Images - Directly under current image */}
          {user && outfitImages.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Shirt className="w-3 h-3" />
                Use from saved outfits
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {outfitImages.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => {
                      onAvatarChange(img.avatar_image);
                      setOpen(false);
                      toast.success("Body image updated!");
                    }}
                    className={cn(
                      "aspect-[3/4] rounded-md overflow-hidden border-2 transition-all touch-manipulation active:scale-95",
                      currentAvatarImage === img.avatar_image
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <img
                      src={img.avatar_image}
                      alt="Outfit body"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Saved Body Images */}
          {user && (
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Saved Body Images
              </h3>
              
              {savedImages.length > 0 ? (
                <div className="grid grid-cols-4 gap-2">
                  {savedImages.map((img) => (
                    <button
                      key={img.id}
                      onClick={() => handleSelectSavedImage(img)}
                      className={cn(
                        "aspect-[3/4] rounded-md overflow-hidden border-2 transition-all touch-manipulation active:scale-95",
                        currentAvatarImage === img.image_url
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <img
                        src={img.image_url}
                        alt={img.name || "Saved body"}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-3 text-muted-foreground text-xs">
                  <ImageIcon className="w-5 h-5 mx-auto mb-1 opacity-50" />
                  <p>No saved images</p>
                </div>
              )}
            </div>
          )}

          {isProcessing && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Uploading...</span>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AvatarChangeSheet;