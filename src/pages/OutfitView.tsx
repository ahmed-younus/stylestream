import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, MessageCircle, Sparkles, ShoppingCart, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Product } from "@/types/product";
import ShareMenu from "@/components/feed/ShareMenu";
import OutfitRating from "@/components/OutfitRating";
import Navbar from "@/components/Navbar";

interface OutfitData {
  id: string;
  try_on_image: string;
  avatar_image: string;
  products: Product[];
  total_price: number;
  created_at: string;
  caption: string | null;
  user_id: string;
  is_public: boolean;
  average_rating: number | null;
  rating_count: number | null;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
  likes_count: number;
  comments_count: number;
}

const OutfitView = () => {
  const { outfitId } = useParams<{ outfitId: string }>();
  const [outfit, setOutfit] = useState<OutfitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (outfitId) {
      fetchOutfit();
    }
  }, [outfitId]);

  const fetchOutfit = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from("saved_outfits")
        .select("*")
        .eq("id", outfitId)
        .eq("is_public", true)
        .maybeSingle();

      if (fetchError) throw fetchError;
      
      if (!data) {
        setError("Outfit not found or is private");
        setLoading(false);
        return;
      }

      // Get profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("user_id", data.user_id)
        .maybeSingle();

      // Get counts
      const [{ count: likesCount }, { count: commentsCount }] = await Promise.all([
        supabase.from("outfit_likes").select("*", { count: "exact", head: true }).eq("outfit_id", data.id),
        supabase.from("outfit_comments").select("*", { count: "exact", head: true }).eq("outfit_id", data.id)
      ]);

      setOutfit({
        ...data,
        products: data.products as unknown as Product[],
        profile,
        likes_count: likesCount || 0,
        comments_count: commentsCount || 0,
        average_rating: data.average_rating || 0,
        rating_count: data.rating_count || 0
      });
    } catch (err) {
      console.error("Error fetching outfit:", err);
      setError("Failed to load outfit");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border border-foreground/30 border-t-foreground animate-spin" />
      </div>
    );
  }

  if (error || !outfit) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <Sparkles className="w-12 h-12 text-muted-foreground/30 mb-4" />
        <h1 className="font-display text-lg tracking-wider mb-2">OUTFIT NOT FOUND</h1>
        <p className="text-muted-foreground text-sm text-center mb-6">
          {error || "This outfit doesn't exist or is private."}
        </p>
        <Button onClick={() => navigate("/feed")} variant="primary">
          Browse Outfits
        </Button>
      </div>
    );
  }

  const displayName = outfit.profile?.display_name || "Anonymous";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-2xl mx-auto pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border-b border-border"
        >
          {/* User Info */}
          <div className="flex items-center justify-between gap-3 p-4 border-b border-border">
            <div 
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => navigate(`/profile/${outfit.user_id}`)}
            >
              <Avatar className="w-10 h-10 border border-border">
                <AvatarImage src={outfit.profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-secondary font-display text-xs">
                  {displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-display text-xs tracking-wider hover:text-primary">
                  {displayName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(outfit.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <ShareMenu outfitId={outfit.id} />
          </div>

          {/* Image */}
          <div className="aspect-[3/4]">
            <img
              src={outfit.try_on_image}
              alt="Outfit"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Stats & Caption */}
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-foreground" />
                  <span className="font-body text-sm">{outfit.likes_count} likes</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-foreground" />
                  <span className="font-body text-sm">{outfit.comments_count} comments</span>
                </div>
              </div>
            </div>

            {/* Rating */}
            <div className="border-t border-border pt-4">
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Rate this outfit</p>
              <OutfitRating 
                outfitId={outfit.id} 
                outfitOwnerId={outfit.user_id}
                initialAvgRating={outfit.average_rating || 0}
                initialRatingCount={outfit.rating_count || 0}
              />
            </div>

            {outfit.caption && (
              <p className="font-body text-sm">
                <span className="font-display text-xs tracking-wider mr-2">{displayName}</span>
                {outfit.caption}
              </p>
            )}

            {/* Products with retailer tags */}
            <div className="space-y-3">
              <h3 className="font-display text-xs tracking-wider">ITEMS IN THIS LOOK</h3>
              <div className="space-y-2">
                {outfit.products.map((product) => (
                  <div key={product.id} className="flex items-center gap-3 p-2 bg-secondary/50 border border-border">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-14 h-14 object-cover border border-border"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm truncate">{product.name}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">{product.brand}</p>
                        {product.retailer && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-foreground/10 text-[10px] font-medium uppercase">
                            <Store className="w-2.5 h-2.5" />
                            {product.retailer}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="font-display text-sm font-semibold">£{product.price}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="font-display text-lg font-semibold">£{outfit.total_price.toFixed(0)}</p>
                </div>
                <Button variant="primary">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  BUY ALL ITEMS
                </Button>
              </div>
            </div>

            {/* CTA for non-logged in users */}
            {!user && (
              <div className="p-4 bg-primary/10 border border-primary/20 text-center">
                <p className="text-sm mb-3">Want to create your own AI try-on looks?</p>
                <Button onClick={() => navigate("/auth")} variant="primary">
                  Get Started
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OutfitView;