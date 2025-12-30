import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Coins, Sparkles, Crown, Zap, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface CreditsPurchaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CREDIT_PACKAGES = [
  {
    id: "starter",
    name: "Starter",
    credits: 10,
    price: 2.99,
    priceId: "price_starter_10", // Will be replaced with actual Stripe price ID
    icon: Coins,
    popular: false,
    description: "Perfect for trying out",
  },
  {
    id: "popular",
    name: "Popular",
    credits: 30,
    price: 7.99,
    priceId: "price_popular_30", // Will be replaced with actual Stripe price ID
    icon: Sparkles,
    popular: true,
    description: "Best value for regular use",
    savings: "Save 11%",
  },
  {
    id: "pro",
    name: "Pro",
    credits: 60,
    price: 14.99,
    priceId: "price_pro_60", // Will be replaced with actual Stripe price ID
    icon: Crown,
    popular: false,
    description: "For style enthusiasts",
    savings: "Save 17%",
  },
];

const CreditsPurchaseModal = ({ open, onOpenChange }: CreditsPurchaseModalProps) => {
  const [loading, setLoading] = useState<string | null>(null);
  const { user } = useAuth();

  const handlePurchase = async (packageId: string) => {
    if (!user) {
      toast.error("Please sign in to purchase credits");
      return;
    }

    const selectedPackage = CREDIT_PACKAGES.find(p => p.id === packageId);
    if (!selectedPackage) return;

    setLoading(packageId);

    try {
      const { data, error } = await supabase.functions.invoke("create-credits-checkout", {
        body: { 
          packageId: selectedPackage.id,
          credits: selectedPackage.credits,
          priceId: selectedPackage.priceId,
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.url) {
        window.open(data.url, "_blank");
        onOpenChange(false);
      }
    } catch (err) {
      console.error("Checkout error:", err);
      toast.error("Failed to start checkout", {
        description: err instanceof Error ? err.message : "Please try again"
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Buy Credits
          </DialogTitle>
          <DialogDescription>
            Each outfit try-on uses 1 credit. Choose a package that works for you.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 mt-4">
          {CREDIT_PACKAGES.map((pkg) => {
            const Icon = pkg.icon;
            return (
              <div
                key={pkg.id}
                className={cn(
                  "relative p-4 rounded-xl border-2 transition-all",
                  pkg.popular 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-primary/50"
                )}
              >
                {pkg.popular && (
                  <span className="absolute -top-2.5 right-4 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground rounded-full">
                    Most Popular
                  </span>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2.5 rounded-lg",
                      pkg.popular ? "bg-primary/20" : "bg-secondary"
                    )}>
                      <Icon className={cn(
                        "w-5 h-5",
                        pkg.popular ? "text-primary" : "text-muted-foreground"
                      )} />
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{pkg.name}</h3>
                        {pkg.savings && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-green-500/10 text-green-600 rounded font-medium">
                            {pkg.savings}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {pkg.credits} credits • {pkg.description}
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={() => handlePurchase(pkg.id)}
                    disabled={loading !== null}
                    variant={pkg.popular ? "default" : "outline"}
                    className="min-w-[80px]"
                  >
                    {loading === pkg.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      `£${pkg.price.toFixed(2)}`
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Secure payment powered by Stripe. Credits never expire.
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default CreditsPurchaseModal;
