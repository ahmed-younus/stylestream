import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Loader2, ShoppingBag, ChevronDown, ChevronUp, ImagePlus, X, Upload } from "lucide-react";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Product, ProductCategory } from "@/types/product";
import { useAuth } from "@/hooks/useAuth";
import ShortcutPrompts from "./ShortcutPrompts";

interface UserMeasurements {
  height_cm?: number | null;
  trainer_size?: string | null;
  chest_cm?: number | null;
  waist_cm?: number | null;
  hip_cm?: number | null;
  inseam_cm?: number | null;
  neck_cm?: number | null;
  wrist_cm?: number | null;
  pants_length_cm?: number | null;
  shoulder_cm?: number | null;
  gender_preference?: string | null;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  products?: ProductResult[];
  imageUrl?: string;
}

interface ProductResult {
  title: string;
  url: string;
  description: string;
  brand?: string;
  price?: string;
  image?: string;
  imageBase64?: string; // Pre-cached base64 image from server
  imageUploadPending?: boolean;
}

interface ShoppingAssistantProps {
  onTryOnProduct?: (product: Product) => void;
  onUpdateAvatar?: (imageData: string) => void;
  initialPrompt?: string | null;
  onPromptProcessed?: () => void;
  autoOpen?: boolean;
}

const ShoppingAssistant = ({ 
  onTryOnProduct, 
  onUpdateAvatar, 
  initialPrompt, 
  onPromptProcessed,
  autoOpen = false,
}: ShoppingAssistantProps) => {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(autoOpen);
  const [showShortcuts, setShowShortcuts] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userMeasurements, setUserMeasurements] = useState<UserMeasurements | null>(null);
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [pendingProductUpload, setPendingProductUpload] = useState<{
    messageIndex: number;
    productIndex: number;
    product: ProductResult;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle initial prompt from body part selector
  useEffect(() => {
    if (initialPrompt) {
      setInput(initialPrompt);
      setIsExpanded(true);
      setShowShortcuts(false);
      onPromptProcessed?.();
      // Auto-focus input
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [initialPrompt, onPromptProcessed]);

  // Fetch user measurements on mount
  useEffect(() => {
    const fetchMeasurements = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("height_cm, trainer_size, chest_cm, waist_cm, hip_cm, inseam_cm, neck_cm, wrist_cm, pants_length_cm, shoulder_cm, gender_preference")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (!error && data) {
        setUserMeasurements(data);
      }
    };
    
    fetchMeasurements();
  }, [user]);

  const handleShortcutSelect = (prompt: string) => {
    setInput(prompt);
    setShowShortcuts(false);
    inputRef.current?.focus();
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isExpanded) {
      inputRef.current?.focus();
    }
  }, [isExpanded]);

  const convertToProduct = (result: ProductResult, customImage?: string): Product | null => {
    // Priority: customImage > imageBase64 > image URL
    const imageUrl = customImage || result.imageBase64 || result.image;
    if (!imageUrl || (!imageUrl.startsWith('http') && !imageUrl.startsWith('data:image'))) {
      return null;
    }
    
    const priceMatch = result.price?.match(/[\d,.]+/);
    const price = priceMatch ? parseFloat(priceMatch[0].replace(',', '')) : 0;
    
    const text = `${result.title} ${result.description}`.toLowerCase();
    let category: ProductCategory = 'tops';
    
    if (text.includes('tracksuit')) category = 'tracksuits';
    else if (text.includes('hoodie') || text.includes('sweatshirt')) category = 'hoodies-sweatshirts';
    else if (text.includes('jacket') || text.includes('coat')) category = 'jackets-coats';
    else if (text.includes('jean') || text.includes('denim')) category = 'jeans';
    else if (text.includes('trouser') || text.includes('pant') || text.includes('jogger')) category = 'trousers';
    else if (text.includes('shirt') && !text.includes('t-shirt')) category = 'shirts';
    else if (text.includes('t-shirt') || text.includes('tee')) category = 't-shirts';
    else if (text.includes('trainer') || text.includes('sneaker') || text.includes('shoe')) category = 'trainers';
    else if (text.includes('boot')) category = 'boots';
    else if (text.includes('knit') || text.includes('sweater') || text.includes('jumper')) category = 'knitwear';
    else if (text.includes('short')) category = 'shorts';
    
    return {
      id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: result.title,
      brand: result.brand || 'Designer',
      retailer: result.url.startsWith('http') ? new URL(result.url).hostname.replace('www.', '').split('.')[0] : 'custom',
      price,
      currency: '£',
      image: result.image || imageUrl, // Keep original URL for display
      imageBase64: result.imageBase64 || (customImage?.startsWith('data:') ? customImage : undefined), // Cache base64 for try-on
      category,
      gender: 'unisex',
      description: result.description,
      affiliateUrl: result.url,
    };
  };

  const hasValidImage = (result: ProductResult): boolean => {
    // Check for pre-cached base64 first, then URL
    const img = result.imageBase64 || result.image;
    return !!(img && (img.startsWith('http') || img.startsWith('data:image')));
  };

  const handleTryOn = (result: ProductResult, customImage?: string) => {
    if (!onTryOnProduct) {
      toast.info("Enter the Try-On Studio first to try on clothes");
      return;
    }
    
    const imageToUse = customImage || result.image;
    if (!imageToUse || (!imageToUse.startsWith('http') && !imageToUse.startsWith('data:image'))) {
      toast.error("This product doesn't have a valid image for try-on");
      return;
    }
    
    const product = convertToProduct(result, customImage);
    if (product) {
      onTryOnProduct(product);
      toast.success(`Added ${result.title.slice(0, 30)}... to try-on`);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Image = reader.result as string;
      
      // Check if this is for a specific product that needs an image
      if (pendingProductUpload) {
        const { messageIndex, productIndex, product } = pendingProductUpload;
        
        // Update the product with the uploaded image
        setMessages(prev => prev.map((msg, mIdx) => {
          if (mIdx === messageIndex && msg.products) {
            const updatedProducts = msg.products.map((p, pIdx) => {
              if (pIdx === productIndex) {
                return { ...p, image: base64Image, imageBase64: base64Image };
              }
              return p;
            });
            return { ...msg, products: updatedProducts };
          }
          return msg;
        }));
        
        setPendingProductUpload(null);
        toast.success(`Screenshot uploaded for ${product.title.slice(0, 30)}... You can now try it on!`);
      } else {
        // Regular avatar upload
        setPendingImages((prev) => [...prev, base64Image]);
      }
    };
    reader.readAsDataURL(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const clearPendingImage = (index: number) => {
    setPendingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAllPendingImages = () => {
    setPendingImages([]);
  };

  const sendMessage = async () => {
    if ((!input.trim() && pendingImages.length === 0) || isLoading) return;

    const userMessage = input.trim();
    const imagesToSend = [...pendingImages];
    setInput("");
    setPendingImages([]);
    setShowShortcuts(false);
    
    // For display, show first image in message
    setMessages((prev) => [...prev, { 
      role: "user", 
      content: userMessage || (imagesToSend.length > 1 ? `Update avatar with ${imagesToSend.length} images` : "Update my avatar"),
      imageUrl: imagesToSend[0] || undefined 
    }]);
    setIsLoading(true);

    try {
      const conversationHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const { data, error } = await supabase.functions.invoke("ai-shopping-assistant", {
        body: {
          message: userMessage || "Use these images to update my avatar",
          conversationHistory,
          userMeasurements: userMeasurements,
          userGender: userMeasurements?.gender_preference || null,
          imageUrls: imagesToSend.length > 0 ? imagesToSend : undefined,
          imageUrl: imagesToSend.length === 1 ? imagesToSend[0] : undefined,
        },
      });

      if (error) {
        throw error;
      }

      // Check if AI wants to update avatar - use first image
      if (data.updateAvatar && imagesToSend.length > 0 && onUpdateAvatar) {
        onUpdateAvatar(imagesToSend[0]);
        toast.success("Avatar updated! You can now try on clothes.");
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.message,
          products: data.products,
        },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Failed to get response. Please try again.");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <>
      {/* Mobile collapsed FAB - positioned to not overlap content */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="md:hidden fixed bottom-6 right-4 z-50 w-12 h-12 bg-foreground text-background rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-transform"
        >
          <Sparkles className="w-5 h-5" />
        </button>
      )}

      {/* Main chat panel - mobile: bottom sheet (40vh max), desktop: sidebar */}
      <div className={`fixed z-50 flex flex-col shadow-2xl transition-all duration-300 ${
        isExpanded 
          ? 'inset-x-0 bottom-0 top-auto max-h-[40vh] md:inset-auto md:bottom-0 md:right-6 md:w-[380px] md:max-h-none rounded-t-2xl md:rounded-none' 
          : 'bottom-0 right-4 md:right-6 w-[280px] md:w-[380px] hidden md:flex'
      }`}>
        {/* Header bar - with drag indicator on mobile */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex flex-col items-center bg-foreground text-background hover:bg-foreground/90 transition-colors ${
            isExpanded ? 'rounded-t-2xl md:rounded-none pt-2 pb-3 px-4' : 'rounded-t-none py-3 px-4'
          }`}
        >
          {/* Mobile drag indicator */}
          {isExpanded && (
            <div className="w-10 h-1 bg-background/30 rounded-full mb-2 md:hidden" />
          )}
          <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-background/20 rounded-full flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="text-left">
              <h3 className="font-display text-xs tracking-[0.1em]">AI STYLIST</h3>
              <p className="text-[10px] text-background/70 tracking-wide">
                {onTryOnProduct ? "Search & try on" : "Search fashion"}
              </p>
            </div>
          </div>
            <div className="flex items-center gap-2">
              {isExpanded ? (
                <X className="w-5 h-5" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </div>
          </div>
        </button>

        {/* Expandable chat area */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: isMobile ? "calc(40vh - 56px)" : 450, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="bg-background border-x border-b border-border flex flex-col overflow-hidden flex-1"
            >
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Shortcut prompts - show when no messages yet */}
              {showShortcuts && messages.length === 0 && (
                <ShortcutPrompts onSelect={handleShortcutSelect} />
              )}
              
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] ${
                      message.role === "user"
                        ? "bg-foreground text-background"
                        : "bg-secondary text-foreground"
                    } px-4 py-3 rounded-lg`}
                  >
                    {message.imageUrl && (
                      <img 
                        src={message.imageUrl} 
                        alt="Uploaded" 
                        className="w-full max-w-[200px] rounded mb-2"
                      />
                    )}
                    <p className="text-sm font-body leading-relaxed">{message.content}</p>

                    {/* Product Results */}
                    {message.products && message.products.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {message.products.map((product, pIndex) => (
                          <div
                            key={pIndex}
                            className="block p-3 bg-background/10 border border-border/30 rounded"
                          >
                            <div className="flex items-start gap-2">
                              {hasValidImage(product) ? (
                                <img 
                                  src={product.image} 
                                  alt={product.title}
                                  className="w-12 h-12 object-cover rounded flex-shrink-0"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-12 h-12 bg-muted rounded flex-shrink-0 flex items-center justify-center">
                                  <ImagePlus className="w-5 h-5 text-muted-foreground" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium line-clamp-2">{product.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  {product.brand && (
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                                      {product.brand}
                                    </span>
                                  )}
                                  {product.price && (
                                    <span className="text-[10px] font-semibold text-gold">
                                      {product.price}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Action buttons */}
                            <div className="flex gap-2 mt-2">
                              {onTryOnProduct && hasValidImage(product) && (
                                <button
                                  onClick={() => handleTryOn(product)}
                                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-[10px] font-medium tracking-wide transition-colors bg-foreground text-background hover:bg-foreground/90"
                                >
                                  <ShoppingBag className="w-3 h-3" />
                                  TRY ON
                                </button>
                              )}
                              
                              {/* Show upload prompt for products without valid images */}
                              {onTryOnProduct && !hasValidImage(product) && (
                                <button
                                  onClick={() => {
                                    setPendingProductUpload({ messageIndex: index, productIndex: pIndex, product });
                                    fileInputRef.current?.click();
                                  }}
                                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-[10px] font-medium tracking-wide transition-colors bg-primary text-primary-foreground hover:bg-primary/90"
                                >
                                  <Upload className="w-3 h-3" />
                                  UPLOAD SCREENSHOT
                                </button>
                              )}
                              
                              <a
                                href={product.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 border border-border rounded text-[10px] font-medium tracking-wide hover:bg-secondary transition-colors"
                              >
                                VIEW
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-secondary text-foreground px-4 py-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-xs tracking-wide">SEARCHING...</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      This may take up to 30 seconds
                    </p>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border bg-secondary/30">
              {/* Pending images preview */}
              {pendingImages.length > 0 && (
                <div className="mb-2 flex gap-2 flex-wrap">
                  {pendingImages.map((img, index) => (
                    <div key={index} className="relative inline-block">
                      <img 
                        src={img} 
                        alt={`Upload ${index + 1}`} 
                        className="h-16 rounded border border-border"
                      />
                      <button
                        onClick={() => clearPendingImage(index)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {pendingImages.length > 1 && (
                    <button
                      onClick={clearAllPendingImages}
                      className="h-16 px-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  size="icon"
                  className="rounded-lg flex-shrink-0"
                  title="Upload images for avatar"
                >
                  <ImagePlus className="w-4 h-4" />
                </Button>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={pendingImages.length > 0 ? "Add a message or send..." : "Search or upload avatar..."}
                  className="flex-1 bg-background border border-border rounded-lg px-4 py-2.5 text-sm font-body placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors"
                />
                <Button
                  onClick={sendMessage}
                  disabled={(!input.trim() && pendingImages.length === 0) || isLoading}
                  variant="primary"
                  size="icon"
                  className="rounded-lg"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default ShoppingAssistant;