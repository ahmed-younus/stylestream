import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const GenderSetup = () => {
  const [selected, setSelected] = useState<"mens" | "womens" | null>(null);
  const [saving, setSaving] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const handleContinue = async () => {
    if (!selected || !user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ gender_preference: selected })
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Preferences saved!");
      navigate("/");
    } catch (err) {
      console.error("Error saving gender:", err);
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        <div className="w-16 h-16 border border-border rounded-full flex items-center justify-center mx-auto mb-8">
          <User className="w-8 h-8 text-foreground" />
        </div>

        <h1 className="font-display text-2xl sm:text-3xl mb-4 tracking-[0.1em]">
          WELCOME TO STYLE DREAM
        </h1>
        <p className="font-body text-muted-foreground mb-10">
          Let's personalize your experience. Which clothing would you like to browse?
        </p>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => setSelected("mens")}
            className={`aspect-square border-2 transition-all duration-300 flex flex-col items-center justify-center gap-4 touch-manipulation active:scale-[0.98] ${
              selected === "mens"
                ? "border-foreground bg-foreground/5"
                : "border-border hover:border-muted-foreground active:border-foreground"
            }`}
          >
            <div className="text-4xl">👔</div>
            <span className="font-display text-sm tracking-[0.15em]">MENSWEAR</span>
          </button>

          <button
            onClick={() => setSelected("womens")}
            className={`aspect-square border-2 transition-all duration-300 flex flex-col items-center justify-center gap-4 touch-manipulation active:scale-[0.98] ${
              selected === "womens"
                ? "border-foreground bg-foreground/5"
                : "border-border hover:border-muted-foreground active:border-foreground"
            }`}
          >
            <div className="text-4xl">👗</div>
            <span className="font-display text-sm tracking-[0.15em]">WOMENSWEAR</span>
          </button>
        </div>

        <p className="text-xs text-muted-foreground mb-6">
          Unisex items will always be shown. You can change this in your profile settings.
        </p>

        <Button
          onClick={handleContinue}
          disabled={!selected || saving}
          variant="primary"
          size="xl"
          className="w-full tracking-[0.15em] min-h-[48px] touch-manipulation active:scale-[0.98]"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "CONTINUE"
          )}
        </Button>

        <button
          onClick={() => navigate("/")}
          className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px] px-4 touch-manipulation"
        >
          Skip for now
        </button>
      </motion.div>
    </div>
  );
};

export default GenderSetup;