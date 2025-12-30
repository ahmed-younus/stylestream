import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, Clock, CheckCircle2, XCircle, Loader2, Trash2, Eye, X, Sparkles, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useGenerationQueue, QueuedGeneration } from "@/hooks/useGenerationQueue";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const GenerationQueuePanel = () => {
  const [open, setOpen] = useState(false);
  const { 
    queue, 
    queuedCount, 
    generatingCount, 
    completedCount,
    failedCount,
    removeFromQueue,
    removeCompleted,
    clearCompleted,
    clearFailed,
    retryFailed,
    retryAllFailed,
  } = useGenerationQueue();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Listen for external open events
  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener("openGenerationQueue", handleOpen);
    return () => window.removeEventListener("openGenerationQueue", handleOpen);
  }, []);

  const totalActive = queuedCount + generatingCount + completedCount + failedCount;

  const handleViewGeneration = (generation: QueuedGeneration) => {
    if (generation.tryOnImage) {
      navigate("/gallery", { state: { viewGeneration: generation } });
      setOpen(false);
    }
  };

  const getStatusIcon = (status: QueuedGeneration["status"]) => {
    switch (status) {
      case "queued":
        return <Clock className="w-4 h-4 text-muted-foreground" />;
      case "generating":
        return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-destructive" />;
    }
  };

  const getStatusText = (status: QueuedGeneration["status"]) => {
    switch (status) {
      case "queued":
        return "In queue";
      case "generating":
        return "Generating...";
      case "completed":
        return "Ready to view";
      case "failed":
        return "Failed";
    }
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  if (!user) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative min-w-[44px] min-h-[44px] touch-manipulation active:scale-95"
        >
          <Layers className="w-5 h-5" />
          {totalActive > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`absolute -top-1 -right-1 w-5 h-5 text-white text-xs font-bold rounded-full flex items-center justify-center ${
                generatingCount > 0 ? "bg-primary animate-pulse" : completedCount > 0 ? "bg-green-500" : "bg-muted-foreground"
              }`}
            >
              {totalActive > 9 ? "9+" : totalActive}
            </motion.span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-card border-border w-full sm:max-w-md overflow-y-auto" side="right">
        <SheetHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-display text-sm tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              GENERATION QUEUE
            </SheetTitle>
            <div className="flex gap-1">
              {failedCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={retryAllFailed}
                  className="text-xs"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Retry all
                </Button>
              )}
              {completedCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCompleted}
                  className="text-xs"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Clear done
                </Button>
              )}
            </div>
          </div>
        </SheetHeader>

        {/* Stats */}
        <div className="flex gap-3 py-4 border-b border-border">
          <div className="flex-1 bg-secondary/50 rounded-lg p-3 text-center">
            <p className="text-lg font-display">{queuedCount}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Queued</p>
          </div>
          <div className="flex-1 bg-primary/10 rounded-lg p-3 text-center">
            <p className="text-lg font-display text-primary">{generatingCount}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Generating</p>
          </div>
          <div className="flex-1 bg-green-500/10 rounded-lg p-3 text-center">
            <p className="text-lg font-display text-green-500">{completedCount}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Ready</p>
          </div>
          {failedCount > 0 && (
            <div className="flex-1 bg-destructive/10 rounded-lg p-3 text-center">
              <p className="text-lg font-display text-destructive">{failedCount}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Failed</p>
            </div>
          )}
        </div>

        <div className="mt-4 space-y-2 overflow-y-auto max-h-[calc(100vh-260px)]">
          {queue.length === 0 ? (
            <div className="text-center py-12">
              <Layers className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground font-body text-sm mb-2">
                No generations in queue
              </p>
              <p className="text-xs text-muted-foreground/70">
                Add outfits to the queue to generate them in the background
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {queue.map((generation, index) => (
                <motion.div
                  key={generation.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.03 }}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                    generation.status === "completed" 
                      ? "bg-green-500/5 border-green-500/20 hover:bg-green-500/10" 
                      : generation.status === "generating"
                      ? "bg-primary/5 border-primary/20"
                      : generation.status === "failed"
                      ? "bg-destructive/5 border-destructive/20"
                      : "bg-secondary/30 border-border hover:bg-secondary/50"
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative flex-shrink-0">
                    {generation.status === "completed" && generation.tryOnImage ? (
                      <img 
                        src={generation.tryOnImage} 
                        alt="Generated outfit" 
                        className="w-14 h-14 object-cover rounded-lg border border-border"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg border border-border bg-secondary/50 flex items-center justify-center overflow-hidden">
                        {/* Show product thumbnails */}
                        <div className="grid grid-cols-2 gap-0.5 p-1">
                          {generation.products.slice(0, 4).map((p, i) => (
                            <img 
                              key={i}
                              src={p.image} 
                              alt="" 
                              className="w-5 h-5 object-cover rounded-sm"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {generation.status === "generating" && (
                      <div className="absolute inset-0 bg-background/60 rounded-lg flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(generation.status)}
                      <span className={`text-xs font-medium ${
                        generation.status === "completed" ? "text-green-500" :
                        generation.status === "generating" ? "text-primary" :
                        generation.status === "failed" ? "text-destructive" :
                        "text-muted-foreground"
                      }`}>
                        {getStatusText(generation.status)}
                      </span>
                    </div>
                    <p className="text-sm font-body text-foreground">
                      {generation.products.length} item{generation.products.length > 1 ? "s" : ""} · £{generation.totalPrice.toFixed(0)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatTimeAgo(generation.createdAt)}
                    </p>
                    {generation.error && (
                      <p className="text-xs text-destructive mt-1 line-clamp-2">
                        {generation.error}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 flex-shrink-0">
                    {generation.status === "failed" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => retryFailed(generation.id)}
                        className="h-8 w-8 text-primary hover:text-primary"
                        title="Retry"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    )}
                    {generation.status === "completed" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleViewGeneration(generation)}
                        className="h-8 w-8"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                    {(generation.status === "queued" || generation.status === "failed" || generation.status === "completed") && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => generation.status === "completed" 
                          ? removeCompleted(generation.id) 
                          : removeFromQueue(generation.id)
                        }
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* View Gallery Button */}
        {completedCount > 0 && (
          <div className="pt-4 border-t border-border mt-4">
            <Button 
              className="w-full" 
              onClick={() => {
                navigate("/my-outfits");
                setOpen(false);
              }}
            >
              <Eye className="w-4 h-4 mr-2" />
              View All ({completedCount})
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default GenerationQueuePanel;
