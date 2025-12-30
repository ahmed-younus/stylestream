import { Coins, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCredits } from "@/hooks/useCredits";
import { useState } from "react";
import CreditsPurchaseModal from "./CreditsPurchaseModal";
import { cn } from "@/lib/utils";

interface CreditsDisplayProps {
  compact?: boolean;
  showBuyButton?: boolean;
  className?: string;
}

const CreditsDisplay = ({ compact = false, showBuyButton = true, className }: CreditsDisplayProps) => {
  const { credits, loading } = useCredits();
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  if (loading) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="h-5 w-12 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <>
      <div className={cn("flex items-center gap-2", className)}>
        <div className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-full",
          credits > 0 ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
        )}>
          <Coins className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">
            {credits} {compact ? "" : `credit${credits !== 1 ? "s" : ""}`}
          </span>
        </div>
        
        {showBuyButton && (
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => setShowPurchaseModal(true)}
            className="min-h-[44px] min-w-[44px] px-3 text-xs touch-manipulation active:scale-95"
          >
            <Plus className="w-4 h-4 mr-1" />
            {compact ? "" : "Buy"}
          </Button>
        )}
      </div>

      <CreditsPurchaseModal 
        open={showPurchaseModal} 
        onOpenChange={setShowPurchaseModal} 
      />
    </>
  );
};

export default CreditsDisplay;
