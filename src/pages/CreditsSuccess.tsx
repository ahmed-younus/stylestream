import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, XCircle, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";

const CreditsSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshCredits } = useCredits();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [creditsAdded, setCreditsAdded] = useState(0);

  useEffect(() => {
    const verifyPayment = async () => {
      const sessionId = searchParams.get("session_id");
      const credits = searchParams.get("credits");

      if (!sessionId) {
        setStatus("error");
        setMessage("No session ID found");
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke("verify-credits-payment", {
          body: { sessionId }
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        setCreditsAdded(data.credits || parseInt(credits || "0", 10));
        setStatus("success");
        setMessage(data.alreadyProcessed ? "Credits already added to your account!" : "Credits added successfully!");
        
        // Refresh credits in context
        await refreshCredits();
      } catch (err) {
        console.error("Verification error:", err);
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Failed to verify payment");
      }
    };

    verifyPayment();
  }, [searchParams, refreshCredits]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-24 pb-12 px-4">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-2xl p-8 text-center shadow-lg border border-border"
          >
            {status === "loading" && (
              <>
                <Loader2 className="w-16 h-16 mx-auto mb-4 text-primary animate-spin" />
                <h1 className="text-xl font-semibold mb-2">Verifying Payment...</h1>
                <p className="text-muted-foreground">Please wait while we confirm your purchase</p>
              </>
            )}

            {status === "success" && (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                >
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                </motion.div>
                <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
                <p className="text-muted-foreground mb-6">{message}</p>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-primary/10 rounded-xl p-4 mb-6"
                >
                  <div className="flex items-center justify-center gap-2 text-primary">
                    <Sparkles className="w-5 h-5" />
                    <span className="text-2xl font-bold">+{creditsAdded}</span>
                    <span className="text-lg">credits</span>
                  </div>
                </motion.div>

                <Button onClick={() => navigate("/studio")} size="lg" className="w-full">
                  Start Creating Outfits
                </Button>
              </>
            )}

            {status === "error" && (
              <>
                <XCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
                <h1 className="text-xl font-semibold mb-2">Something Went Wrong</h1>
                <p className="text-muted-foreground mb-6">{message}</p>
                <div className="space-y-2">
                  <Button onClick={() => navigate("/studio")} variant="outline" className="w-full">
                    Go to Studio
                  </Button>
                  <Button onClick={() => window.location.reload()} variant="ghost" className="w-full">
                    Try Again
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CreditsSuccess;
