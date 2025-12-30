import { createContext, useContext, useState, useCallback, useEffect, ReactNode, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Product } from "@/types/product";
import { useNotificationSound } from "@/hooks/useNotificationSound";
import { useCredits } from "@/hooks/useCredits";

export interface QueuedGeneration {
  id: string;
  status: "queued" | "generating" | "completed" | "failed";
  avatarImage: string;
  products: Product[];
  createdAt: Date;
  completedAt?: Date;
  tryOnImage?: string;
  error?: string;
  totalPrice: number;
}

interface GenerationQueueContextType {
  queue: QueuedGeneration[];
  completedGenerations: QueuedGeneration[];
  failedCount: number;
  queuedCount: number;
  generatingCount: number;
  completedCount: number;
  addToQueue: (avatarImage: string, products: Product[]) => void;
  addBulkToQueue: (items: { avatarImage: string; products: Product[] }[]) => void;
  retryFailed: (id: string) => void;
  retryAllFailed: () => void;
  removeFromQueue: (id: string) => void;
  removeCompleted: (id: string) => void;
  clearCompleted: () => void;
  clearFailed: () => void;
  isProcessing: boolean;
}

const GenerationQueueContext = createContext<GenerationQueueContextType | null>(null);

export const GenerationQueueProvider = ({ children }: { children: ReactNode }) => {
  const [queue, setQueue] = useState<QueuedGeneration[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { playSuccessSound } = useNotificationSound();
  const { credits, deductCredit, hasCredits, refreshCredits } = useCredits();

  // Separate queued and completed
  const queuedItems = queue.filter(q => q.status === "queued" || q.status === "generating");
  const completedGenerations = queue.filter(q => q.status === "completed");
  const failedItems = queue.filter(q => q.status === "failed");
  const queuedCount = queue.filter(q => q.status === "queued").length;
  const generatingCount = queue.filter(q => q.status === "generating").length;
  const completedCount = completedGenerations.length;
  const failedCount = failedItems.length;

  // Load from localStorage on mount - only load valid items
  useEffect(() => {
    try {
      const saved = localStorage.getItem("generationQueue");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Only restore items that have valid avatarImage (URL-based) and are queued/failed
        const restored = parsed
          .filter((item: any) => 
            (item.status === "queued" || item.status === "failed") && 
            item.avatarImage && 
            item.avatarImage.startsWith("http")
          )
          .map((item: any) => ({
            ...item,
            createdAt: new Date(item.createdAt),
            completedAt: item.completedAt ? new Date(item.completedAt) : undefined,
            status: item.status === "generating" ? "queued" : item.status,
          }));
        setQueue(restored);
      }
    } catch (e) {
      console.error("Failed to load queue from localStorage:", e);
      // Clear corrupted data
      localStorage.removeItem("generationQueue");
    }
  }, []);

  // Save to localStorage on change - only save pending items without large images
  useEffect(() => {
    try {
      // Only persist queued/failed items, and strip large image data
      const toSave = queue
        .filter(q => q.status === "queued" || q.status === "failed")
        .map(q => ({
          ...q,
          // Don't persist large base64 images - user will need to re-add them
          avatarImage: q.avatarImage.startsWith("http") ? q.avatarImage : "",
          products: q.products.map(p => ({
            ...p,
            imageBase64: undefined, // Strip base64 data
          })),
        }));
      
      // Only save if there's data and it's not too large
      const jsonString = JSON.stringify(toSave);
      if (jsonString.length < 1000000) { // ~1MB limit to be safe
        localStorage.setItem("generationQueue", jsonString);
      } else {
        // If still too large, clear it
        localStorage.removeItem("generationQueue");
      }
    } catch (e) {
      console.error("Failed to save queue to localStorage:", e);
      // If quota exceeded, clear the storage
      if (e instanceof Error && e.name === "QuotaExceededError") {
        localStorage.removeItem("generationQueue");
      }
    }
  }, [queue]);

  // Process queue
  useEffect(() => {
    const processNext = async () => {
      // Find next valid queued item (must have avatarImage)
      const nextQueued = queue.find(q => q.status === "queued" && q.avatarImage);
      if (!nextQueued || isProcessing) return;
      
      // Skip items with invalid data
      if (!nextQueued.avatarImage || nextQueued.products.length === 0) {
        setQueue(prev => prev.map(q => 
          q.id === nextQueued.id ? { ...q, status: "failed" as const, error: "Missing avatar or products" } : q
        ));
        return;
      }

      // Check credits before processing
      if (!hasCredits) {
        toast.error("No credits remaining", {
          description: "Purchase credits to continue generating outfits",
          action: {
            label: "Buy Credits",
            onClick: () => window.dispatchEvent(new CustomEvent("openCreditsPurchase"))
          }
        });
        return;
      }

      setIsProcessing(true);
      
      // Deduct credit first
      const deducted = await deductCredit();
      if (!deducted) {
        setIsProcessing(false);
        toast.error("Failed to deduct credit", {
          description: "Please try again"
        });
        return;
      }
      
      // Mark as generating
      setQueue(prev => prev.map(q => 
        q.id === nextQueued.id ? { ...q, status: "generating" as const } : q
      ));

      try {
        const { data, error } = await supabase.functions.invoke("try-on", {
          body: {
            avatarImage: nextQueued.avatarImage,
            products: nextQueued.products.map(p => ({
              image: p.imageBase64 || p.image,
              description: `${p.brand} ${p.name} - ${p.description}`,
              category: p.category
            }))
          }
        });

        if (error) throw new Error(error.message);
        if (data.error) throw new Error(data.error);

        // Mark as completed
        setQueue(prev => prev.map(q => 
          q.id === nextQueued.id ? { 
            ...q, 
            status: "completed" as const, 
            tryOnImage: data.tryOnImage,
            completedAt: new Date()
          } : q
        ));

        // Play success sound
        playSuccessSound();

        toast.success("Outfit generated!", {
          description: `${nextQueued.products.length} items ready to view`,
          action: {
            label: "View",
            onClick: () => {
              // Will be handled by queue panel opening
              window.dispatchEvent(new CustomEvent("openGenerationQueue"));
            }
          }
        });
      } catch (err) {
        console.error("Queue generation error:", err);
        const message = err instanceof Error ? err.message : "Generation failed";
        
        setQueue(prev => prev.map(q => 
          q.id === nextQueued.id ? { 
            ...q, 
            status: "failed" as const, 
            error: message 
          } : q
        ));

        toast.error("Generation failed", { description: message });
      } finally {
        setIsProcessing(false);
      }
    };

    processNext();
  }, [queue, isProcessing, hasCredits, deductCredit]);

  const addToQueue = useCallback((avatarImage: string, products: Product[]) => {
    const totalPrice = products.reduce((sum, p) => sum + p.price, 0);
    const newItem: QueuedGeneration = {
      id: `gen-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      status: "queued",
      avatarImage,
      products,
      createdAt: new Date(),
      totalPrice,
    };

    setQueue(prev => [...prev, newItem]);
    toast.success("Added to queue", {
      description: `${products.length} items queued for generation`
    });
  }, []);

  const addBulkToQueue = useCallback((items: { avatarImage: string; products: Product[] }[]) => {
    const newItems: QueuedGeneration[] = items.map((item, index) => ({
      id: `gen-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 9)}`,
      status: "queued" as const,
      avatarImage: item.avatarImage,
      products: item.products,
      createdAt: new Date(),
      totalPrice: item.products.reduce((sum, p) => sum + p.price, 0),
    }));

    setQueue(prev => [...prev, ...newItems]);
    toast.success(`Added ${items.length} outfits to queue`, {
      description: "They will generate in the background"
    });
  }, []);

  const retryFailed = useCallback((id: string) => {
    setQueue(prev => prev.map(q => 
      q.id === id && q.status === "failed" 
        ? { ...q, status: "queued" as const, error: undefined } 
        : q
    ));
    toast.success("Retrying generation");
  }, []);

  const retryAllFailed = useCallback(() => {
    const failedCount = queue.filter(q => q.status === "failed").length;
    setQueue(prev => prev.map(q => 
      q.status === "failed" 
        ? { ...q, status: "queued" as const, error: undefined } 
        : q
    ));
    if (failedCount > 0) {
      toast.success(`Retrying ${failedCount} failed generation${failedCount > 1 ? 's' : ''}`);
    }
  }, [queue]);

  const removeFromQueue = useCallback((id: string) => {
    setQueue(prev => prev.filter(q => q.id !== id));
  }, []);

  const removeCompleted = useCallback((id: string) => {
    setQueue(prev => prev.filter(q => q.id !== id));
  }, []);

  const clearCompleted = useCallback(() => {
    setQueue(prev => prev.filter(q => q.status !== "completed"));
  }, []);

  const clearFailed = useCallback(() => {
    setQueue(prev => prev.filter(q => q.status !== "failed"));
  }, []);

  return (
    <GenerationQueueContext.Provider value={{
      queue,
      completedGenerations,
      failedCount,
      queuedCount,
      generatingCount,
      completedCount,
      addToQueue,
      addBulkToQueue,
      retryFailed,
      retryAllFailed,
      removeFromQueue,
      removeCompleted,
      clearCompleted,
      clearFailed,
      isProcessing,
    }}>
      {children}
    </GenerationQueueContext.Provider>
  );
};

export const useGenerationQueue = () => {
  const context = useContext(GenerationQueueContext);
  if (!context) {
    throw new Error("useGenerationQueue must be used within a GenerationQueueProvider");
  }
  return context;
};
