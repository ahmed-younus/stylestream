import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Bell, BellOff, Trash2, User, Volume2, VolumeX, Palette, Shield, Gift } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReferralSection from "@/components/ReferralSection";

const Settings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Settings state
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem("notificationSoundEnabled");
    return saved !== "false"; // Default to true
  });
  
  const [genderPreference, setGenderPreference] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserPreferences();
    }
  }, [user]);

  const fetchUserPreferences = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("gender_preference")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data?.gender_preference) {
      setGenderPreference(data.gender_preference);
    }
  };

  const handleSoundToggle = (enabled: boolean) => {
    setSoundEnabled(enabled);
    localStorage.setItem("notificationSoundEnabled", enabled.toString());
    toast.success(enabled ? "Sound notifications enabled" : "Sound notifications disabled");
  };

  const handleGenderChange = async (gender: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ gender_preference: gender })
        .eq("user_id", user.id);

      if (error) throw error;
      
      setGenderPreference(gender);
      toast.success(`Preference updated to ${gender === "mens" ? "Menswear" : "Womenswear"}`);
    } catch (err) {
      console.error("Error updating gender:", err);
      toast.error("Failed to update preference");
    }
  };

  const handleClearLocalData = () => {
    // Clear all local storage except auth
    const keysToKeep = ["supabase.auth.token"];
    const allKeys = Object.keys(localStorage);
    
    allKeys.forEach(key => {
      if (!keysToKeep.some(k => key.includes(k))) {
        localStorage.removeItem(key);
      }
    });
    
    toast.success("Local data cleared");
  };

  const handleResetWalkthrough = () => {
    localStorage.removeItem("hasSeenWalkthrough");
    localStorage.removeItem("hasSeenStudioHelper");
    toast.success("Walkthrough reset. Refresh the page to see it again.");
  };

  if (!user) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <Shield className="w-16 h-16 text-muted-foreground mb-4" />
          <h1 className="font-display text-2xl mb-2">Settings</h1>
          <p className="text-muted-foreground text-center mb-6">
            Sign in to access your settings
          </p>
          <Button onClick={() => navigate("/auth")} className="min-h-[44px] touch-manipulation">Sign In</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <section className="pt-20 pb-12">
        <div className="max-w-2xl mx-auto px-4">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              onClick={() => navigate(-1)}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground min-h-[44px] touch-manipulation active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="font-display text-xl tracking-wide">SETTINGS</h1>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Referral Section - Featured at top */}
            <ReferralSection />

            {/* Notifications Section */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Bell className="w-5 h-5 text-primary" />
                <h2 className="font-display text-sm tracking-wider">NOTIFICATIONS</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="sound" className="text-sm font-medium">Sound notifications</Label>
                    <p className="text-xs text-muted-foreground">Play a sound when outfit generation completes</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {soundEnabled ? (
                      <Volume2 className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-muted-foreground" />
                    )}
                    <Switch
                      id="sound"
                      checked={soundEnabled}
                      onCheckedChange={handleSoundToggle}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Preferences Section */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Palette className="w-5 h-5 text-primary" />
                <h2 className="font-display text-sm tracking-wider">PREFERENCES</h2>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Default clothing category</Label>
                  <p className="text-xs text-muted-foreground mb-3">Products will be filtered to show this category by default</p>
                  <div className="flex gap-2">
                    <Button
                      variant={genderPreference === "mens" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleGenderChange("mens")}
                      className="flex-1 min-h-[44px] touch-manipulation active:scale-[0.98]"
                    >
                      Menswear
                    </Button>
                    <Button
                      variant={genderPreference === "womens" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleGenderChange("womens")}
                      className="flex-1 min-h-[44px] touch-manipulation active:scale-[0.98]"
                    >
                      Womenswear
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Section */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <User className="w-5 h-5 text-primary" />
                <h2 className="font-display text-sm tracking-wider">ACCOUNT</h2>
              </div>
              
              <div className="space-y-4">
                <Button
                  variant="outline"
                  onClick={() => navigate("/edit-profile")}
                  className="w-full justify-start min-h-[44px] touch-manipulation active:scale-[0.98]"
                >
                  <User className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </div>

            {/* Data Section */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Trash2 className="w-5 h-5 text-primary" />
                <h2 className="font-display text-sm tracking-wider">DATA</h2>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Clear locally stored data like session state and cached images. This won't affect your saved outfits.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetWalkthrough}
                    className="min-h-[44px] touch-manipulation active:scale-[0.98]"
                  >
                    Reset Walkthrough
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="min-h-[44px] touch-manipulation active:scale-[0.98]">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear Local Data
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Clear local data?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will clear cached images, session data, and preferences stored in your browser. Your saved outfits and profile will not be affected.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearLocalData}>
                          Clear Data
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
};

export default Settings;
