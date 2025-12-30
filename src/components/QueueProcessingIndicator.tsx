import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useGenerationQueue } from "@/hooks/useGenerationQueue";
import { useAuth } from "@/hooks/useAuth";
import FirstOutfitCelebration from "./FirstOutfitCelebration";

const QueueProcessingIndicator = () => {
  const { generatingCount, queuedCount, completedCount, isProcessing, queue } = useGenerationQueue();
  const { user } = useAuth();

  const showIndicator = isProcessing || generatingCount > 0;
  const totalPending = generatingCount + queuedCount;
  const totalInQueue = generatingCount + queuedCount + completedCount;
  const currentPosition = totalInQueue - queuedCount - generatingCount + 1;
  
  // Check if user just completed their first outfit
  const hasNewCompletion = completedCount > 0;

  if (!user) return (
    <FirstOutfitCelebration trigger={false} />
  );

  return (
    <>
      <FirstOutfitCelebration trigger={hasNewCompletion} />
      
      <AnimatePresence>
        {showIndicator && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-20 left-4 z-50 md:bottom-6"
          >
            <div className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-full shadow-lg">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs font-medium whitespace-nowrap">
                {totalPending > 1 
                  ? `Processing ${currentPosition} of ${totalPending} outfits...`
                  : "Generating outfit..."
                }
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default QueueProcessingIndicator;
