import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Camera, User, Check, X, Sparkles, Save, Trash2, LogIn, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SavedBodyImage {
  id: string;
  image_url: string;
  name: string | null;
  created_at: string;
  isLoaded?: boolean;
}

interface AvatarBuilderProps {
  onAvatarReady?: (imageData: string, faceImage?: string) => void;
}

const AvatarBuilder = ({ onAvatarReady }: AvatarBuilderProps) => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [isExtractingFace, setIsExtractingFace] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [savedImages, setSavedImages] = useState<SavedBodyImage[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  

  // Fetch saved body images
  useEffect(() => {
    if (user) {
      fetchSavedImages();
    }
  }, [user]);

  const fetchSavedImages = async () => {
    if (!user) return;
    
    setIsLoadingImages(true);
    // Only fetch metadata first, not the full image_url to improve load speed
    const { data, error } = await supabase
      .from('user_body_images')
      .select('id, name, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    setIsLoadingImages(false);
    
    if (error) {
      console.error('Error fetching saved images:', error);
      return;
    }
    
    // Set placeholder images initially - will lazy load actual images
    setSavedImages((data || []).map(img => ({
      ...img,
      image_url: '', // Will be loaded on demand
      isLoaded: false
    })));
  };

  // Lazy load a single image when clicked or hovered
  const loadImageData = async (imageId: string) => {
    const { data, error } = await supabase
      .from('user_body_images')
      .select('image_url')
      .eq('id', imageId)
      .single();
    
    if (error || !data) {
      console.error('Error loading image:', error);
      return null;
    }
    
    // Update the saved images with the loaded data
    setSavedImages(prev => prev.map(img => 
      img.id === imageId ? { ...img, image_url: data.image_url, isLoaded: true } : img
    ));
    
    return data.image_url;
  };

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        setUploadedImage(imageData);
        simulateProcessing(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const simulateProcessing = async (imageData: string) => {
    setIsProcessing(true);
    
    // Process body mapping
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsProcessing(false);
    setIsComplete(true);
    
    // Auto-extract face in background (non-blocking)
    extractFaceFromBodySilent(imageData);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleCameraCapture = () => {
    cameraInputRef.current?.click();
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const resetUpload = () => {
    setUploadedImage(null);
    setFaceImage(null);
    setIsComplete(false);
    setIsProcessing(false);
  };

  // Auto-extract face silently in background
  const extractFaceFromBodySilent = async (imageData: string) => {
    if (!imageData) return;
    
    setIsExtractingFace(true);
    try {
      const { data, error } = await supabase.functions.invoke("extract-face", {
        body: { bodyImage: imageData }
      });

      if (error) {
        console.warn("Face extraction failed:", error);
        // Silent fail - don't show error to user
        return;
      }

      if (data?.faceImage) {
        setFaceImage(data.faceImage);
        console.log("Face auto-extracted successfully");
      }
    } catch (err) {
      console.warn("Face extraction error:", err);
    } finally {
      setIsExtractingFace(false);
    }
  };


  const handleSaveImage = async () => {
    if (!user || !uploadedImage) {
      toast.error("Please log in to save your body image");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('user_body_images')
        .insert({
          user_id: user.id,
          image_url: uploadedImage,
          name: `Body Image ${savedImages.length + 1}`
        });

      if (error) throw error;

      toast.success("Body image saved!");
      fetchSavedImages();
    } catch (error) {
      console.error('Error saving image:', error);
      toast.error("Failed to save image");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDeleteImage = (imageId: string) => {
    setImageToDelete(imageId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteSavedImage = async () => {
    if (!imageToDelete) return;
    
    try {
      const { error } = await supabase
        .from('user_body_images')
        .delete()
        .eq('id', imageToDelete);

      if (error) throw error;

      toast.success("Image deleted");
      fetchSavedImages();
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error("Failed to delete image");
    } finally {
      setDeleteDialogOpen(false);
      setImageToDelete(null);
    }
  };

  const ctaRef = useRef<HTMLDivElement>(null);

  const handleSelectSavedImage = async (img: SavedBodyImage) => {
    let imageUrl = img.image_url;
    
    // If image not loaded yet, fetch it
    if (!img.isLoaded || !imageUrl) {
      setIsProcessing(true);
      const loadedUrl = await loadImageData(img.id);
      setIsProcessing(false);
      if (!loadedUrl) {
        toast.error("Failed to load image");
        return;
      }
      imageUrl = loadedUrl;
    }
    
    setUploadedImage(imageUrl);
    setIsComplete(true);
    
    // Auto-extract face in background
    extractFaceFromBodySilent(imageUrl);
    
    // Scroll to the CTA button on mobile after a short delay
    setTimeout(() => {
      ctaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  return (
    <section id="avatar-builder" className="relative py-24 overflow-hidden bg-background">
      <div className="relative z-10 max-w-4xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-2 mb-6 text-xs font-body font-medium tracking-[0.2em] uppercase text-foreground border border-border">
            STEP 1
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl mb-4 tracking-[0.05em]">
            CREATE YOUR AVATAR
          </h2>
          <p className="font-body text-muted-foreground max-w-md mx-auto tracking-wide mb-4">
            Upload a full-body photo for the AI to map your unique body shape and posture
          </p>
          <div className="inline-block px-4 py-2 bg-secondary/50 border border-border">
            <p className="text-xs text-muted-foreground">
              💡 <span className="font-medium text-foreground">Pro tip:</span> For best results, wear form-fitting clothes like a t-shirt and joggers with socks
            </p>
          </div>
        </motion.div>

        {/* Saved Images Section */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <h3 className="font-body text-sm tracking-[0.15em] uppercase text-muted-foreground mb-4 text-center">
              Your Saved Body Images
            </h3>
            
            {isLoadingImages ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : savedImages.length > 0 ? (
              <>
                <div className="flex flex-wrap justify-center gap-3 px-2">
                  {savedImages.map((img) => (
                    <div key={img.id} className="relative group">
                      <button
                        onClick={() => handleSelectSavedImage(img)}
                        className={cn(
                          "w-16 h-24 sm:w-20 sm:h-28 border overflow-hidden transition-all active:scale-95 flex items-center justify-center bg-secondary",
                          uploadedImage === img.image_url && img.isLoaded
                            ? "border-foreground ring-2 ring-foreground" 
                            : "border-border hover:border-foreground"
                        )}
                      >
                        {img.isLoaded && img.image_url ? (
                          <img
                            src={img.image_url}
                            alt={img.name || "Saved body image"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <User className="w-6 h-6 text-muted-foreground" />
                            <span className="text-[8px] text-muted-foreground">Tap to load</span>
                          </div>
                        )}
                      </button>
                      {/* Delete button - always visible on mobile, hover on desktop */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmDeleteImage(img.id);
                        }}
                        className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shadow-md"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-center text-xs text-muted-foreground mt-3 px-4">
                  Tap to load and use a saved image
                </p>
              </>
            ) : (
              <p className="text-center text-xs text-muted-foreground py-4">
                No saved images yet. Upload a photo and save it for quick access next time!
              </p>
            )}
          </motion.div>
        )}

        {/* Auth Gate for non-authenticated users */}
        {!authLoading && !user && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative aspect-[3/4] max-w-sm mx-auto border border-border overflow-hidden bg-secondary/30">
              {/* Full body silhouette */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none">
                <svg viewBox="0 0 100 200" className="h-[85%] w-auto" fill="currentColor">
                  <ellipse cx="50" cy="20" rx="14" ry="16" />
                  <rect x="44" y="35" width="12" height="10" />
                  <path d="M30 45 Q25 50 25 65 L25 100 Q25 105 30 108 L40 110 L40 95 L60 95 L60 110 L70 108 Q75 105 75 100 L75 65 Q75 50 70 45 Z" />
                  <path d="M25 50 Q15 55 12 75 Q10 90 15 105 L22 103 Q20 90 22 78 Q25 65 30 55 Z" />
                  <path d="M75 50 Q85 55 88 75 Q90 90 85 105 L78 103 Q80 90 78 78 Q75 65 70 55 Z" />
                  <path d="M35 108 L33 155 Q32 165 34 175 L34 195 L46 195 L46 175 Q48 165 47 155 L45 108 Z" />
                  <path d="M55 108 L53 155 Q52 165 54 175 L54 195 L66 195 L66 175 Q68 165 67 155 L65 108 Z" />
                </svg>
              </div>
              
              {/* Lock overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 border border-border rounded-full flex items-center justify-center mb-6 bg-background/50">
                  <LogIn className="w-7 h-7 text-foreground" />
                </div>
                <h3 className="font-display text-xl mb-3 tracking-[0.05em]">
                  UNLOCK VIRTUAL TRY-ON
                </h3>
                <p className="font-body text-sm text-muted-foreground mb-6 max-w-xs">
                  Create a free account to upload your photo and try on clothes from top brands
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    variant="primary" 
                    size="lg"
                    onClick={() => navigate('/auth')}
                    className="group min-h-[48px] touch-manipulation active:scale-[0.98]"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    CREATE FREE ACCOUNT
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={() => navigate('/auth')}
                    className="min-h-[48px] touch-manipulation active:scale-[0.98]"
                  >
                    SIGN IN
                  </Button>
                </div>
              </div>
            </div>

            {/* Tips - shown but muted */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto opacity-50"
            >
              {[
                { icon: "📸", text: "Good lighting" },
                { icon: "🧍", text: "Stand straight" },
                { icon: "👕", text: "Form-fitting clothes" },
              ].map((tip, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 py-3 border border-border"
                >
                  <span className="text-base">{tip.icon}</span>
                  <span className="font-body text-xs text-muted-foreground tracking-[0.1em] uppercase">{tip.text}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        )}

        {/* Upload Area - only for authenticated users */}
        {user && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="relative"
        >
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={cn(
              "relative aspect-[3/4] max-w-sm mx-auto border transition-all duration-300 overflow-hidden",
              isDragging
                ? "border-foreground bg-white scale-[1.02]"
                : uploadedImage
                  ? "border-foreground bg-white"
                  : "border-border bg-white"
            )}
          >
            {/* File input for gallery/browse */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleInputChange}
              className="hidden"
            />
            
            {/* Camera input - opens camera on mobile */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleInputChange}
              className="hidden"
            />

            <AnimatePresence mode="wait">
              {!uploadedImage ? (
                <motion.div
                  key="upload-prompt"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center p-6"
                >
                  {/* Full body silhouette example */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] pointer-events-none">
                    <svg viewBox="0 0 100 200" className="h-[85%] w-auto" fill="currentColor">
                      {/* Head */}
                      <ellipse cx="50" cy="20" rx="14" ry="16" />
                      {/* Neck */}
                      <rect x="44" y="35" width="12" height="10" />
                      {/* Torso */}
                      <path d="M30 45 Q25 50 25 65 L25 100 Q25 105 30 108 L40 110 L40 95 L60 95 L60 110 L70 108 Q75 105 75 100 L75 65 Q75 50 70 45 Z" />
                      {/* Left arm */}
                      <path d="M25 50 Q15 55 12 75 Q10 90 15 105 L22 103 Q20 90 22 78 Q25 65 30 55 Z" />
                      {/* Right arm */}
                      <path d="M75 50 Q85 55 88 75 Q90 90 85 105 L78 103 Q80 90 78 78 Q75 65 70 55 Z" />
                      {/* Left leg */}
                      <path d="M35 108 L33 155 Q32 165 34 175 L34 195 L46 195 L46 175 Q48 165 47 155 L45 108 Z" />
                      {/* Right leg */}
                      <path d="M55 108 L53 155 Q52 165 54 175 L54 195 L66 195 L66 175 Q68 165 67 155 L65 108 Z" />
                    </svg>
                  </div>
                  
                  <div className="relative z-10 flex flex-col items-center">
                    <p className="font-body text-foreground font-medium mb-6 text-center tracking-[0.1em] uppercase text-sm">
                      Upload your full-body photo
                    </p>
                    
                    {/* Two buttons: Camera and Upload */}
                    <div className="flex gap-3 mb-6">
                      <button
                        onClick={handleCameraCapture}
                        className="flex flex-col items-center gap-2 px-6 py-4 border border-border hover:border-foreground hover:bg-secondary transition-all"
                      >
                        <Camera className="w-6 h-6 text-foreground" />
                        <span className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground">
                          Take Photo
                        </span>
                      </button>
                      
                      <button
                        onClick={handleUploadClick}
                        className="flex flex-col items-center gap-2 px-6 py-4 border border-border hover:border-foreground hover:bg-secondary transition-all"
                      >
                        <Upload className="w-6 h-6 text-foreground" />
                        <span className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground">
                          Upload
                        </span>
                      </button>
                    </div>
                    
                    <p className="font-body text-xs text-muted-foreground text-center tracking-wide">
                      or drag and drop an image
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="uploaded-image"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative w-full h-full"
                >
                  <img
                    src={uploadedImage}
                    alt="Uploaded avatar"
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Processing Overlay */}
                  <AnimatePresence>
                    {isProcessing && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center"
                      >
                        <div className="relative">
                          <div className="w-12 h-12 border border-foreground/30 border-t-foreground animate-spin" />
                          <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-foreground" />
                        </div>
                        <p className="font-body text-xs text-foreground mt-4 tracking-[0.15em] uppercase">
                          Mapping your body shape...
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Success Badge */}
                  <AnimatePresence>
                    {isComplete && !isProcessing && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-4 right-4 w-10 h-10 bg-foreground flex items-center justify-center"
                      >
                        <Check className="w-5 h-5 text-background" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Remove Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      resetUpload();
                    }}
                    className="absolute top-4 left-4 w-11 h-11 bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-destructive transition-colors border border-border touch-manipulation active:scale-95"
                  >
                    <X className="w-5 h-5 text-foreground" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Border highlight on complete */}
            {uploadedImage && isComplete && (
              <div className="absolute inset-0 pointer-events-none border border-foreground" />
            )}
          </div>

          {/* Tips */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto"
          >
            {[
              { icon: "📸", text: "Good lighting" },
              { icon: "🧍", text: "Stand straight" },
              { icon: "👕", text: "Form-fitting clothes" },
            ].map((tip, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3 border border-border"
              >
                <span className="text-base">{tip.icon}</span>
                <span className="font-body text-xs text-muted-foreground tracking-[0.1em] uppercase">{tip.text}</span>
              </div>
            ))}
          </motion.div>

          {/* Face extraction indicator - subtle, shown during extraction */}
          {isExtractingFace && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground"
            >
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Preparing face reference...</span>
            </motion.div>
          )}

          {/* CTA Buttons */}
          {isComplete && uploadedImage && (
            <motion.div
              ref={ctaRef}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 md:mt-8 flex flex-col items-center justify-center gap-3 md:gap-4 px-4"
            >
              {/* Main CTA - more prominent on mobile */}
              <Button 
                variant="primary" 
                size="xl"
                className="group w-full sm:w-auto text-sm md:text-base py-4 md:py-6 min-h-[52px] touch-manipulation active:scale-[0.98]"
                onClick={() => onAvatarReady?.(uploadedImage, faceImage || undefined)}
              >
                <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
                START TRYING ON
              </Button>
              
              {user && !savedImages.some(img => img.image_url === uploadedImage) && (
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={handleSaveImage}
                  disabled={isSaving}
                  className="group w-full sm:w-auto min-h-[48px] touch-manipulation active:scale-[0.98]"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? "SAVING..." : "SAVE FOR LATER"}
                </Button>
              )}
            </motion.div>
          )}
        </motion.div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-background border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete saved image?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this body image from your saved collection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSavedImage} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};

export default AvatarBuilder;