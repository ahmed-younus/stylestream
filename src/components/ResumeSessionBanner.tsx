import { motion } from "framer-motion";
import { Clock, X, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import { Product } from "@/types/product";

interface ResumeSessionBannerProps {
  avatarImage: string;
  products: Product[];
  onResume: () => void;
  onDismiss: () => void;
}

const ResumeSessionBanner = ({ avatarImage, products, onResume, onDismiss }: ResumeSessionBannerProps) => {
  const totalPrice = products.reduce((sum, p) => sum + p.price, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-20 left-4 right-4 z-40 md:left-1/2 md:-translate-x-1/2 md:max-w-lg"
    >
      <div className="bg-card border border-gold/30 rounded-lg p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <img
              src={avatarImage}
              alt="Session avatar"
              className="w-12 h-12 rounded-lg object-cover border border-border"
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-gold" />
              <span className="font-display text-sm tracking-wide">CONTINUE SESSION</span>
            </div>
            <p className="text-muted-foreground text-xs font-body mb-2">
              You have {products.length} item{products.length > 1 ? 's' : ''} (£{totalPrice.toFixed(0)}) in progress
            </p>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={onResume}
                size="sm"
                variant="primary"
                className="text-xs"
              >
                Resume
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
              <Button
                onClick={onDismiss}
                size="sm"
                variant="ghost"
                className="text-xs text-muted-foreground"
              >
                Dismiss
              </Button>
            </div>
          </div>
          
          <button
            onClick={onDismiss}
            className="p-1 hover:bg-secondary rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ResumeSessionBanner;
