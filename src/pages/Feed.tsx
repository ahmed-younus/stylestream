import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Product } from "@/types/product";
import FeedCard from "@/components/feed/FeedCard";
import UserSearch from "@/components/feed/UserSearch";
import Navbar from "@/components/Navbar";

export interface FeedOutfit {
  id: string;
  try_on_image: string;
  avatar_image: string;
  products: Product[];
  total_price: number;
  created_at: string;
  user_id: string;
  is_public: boolean;
  caption: string | null;
  average_rating: number | null;
  rating_count: number | null;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
}

// Cache for feed data
const feedCache = new Map<string, { data: FeedOutfit[]; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute

const Feed = () => {
  const [outfits, setOutfits] = useState<FeedOutfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("discover");
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchOutfits();
    }
  }, [user, activeTab]);

  const fetchOutfits = useCallback(async () => {
    if (!user) return;
    
    const cacheKey = `${user.id}-${activeTab}`;
    const cached = feedCache.get(cacheKey);
    
    // Use cache if fresh
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setOutfits(cached.data);
      setLoading(false);
      return;
    }
    
    // Only show loading on first fetch
    if (!hasFetched.current) {
      setLoading(true);
    }
    
    try {
      // Timeout protection
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
      );
      
      let outfitQuery = supabase
        .from("saved_outfits")
        .select("id, try_on_image, avatar_image, user_id, created_at, is_public, caption, average_rating, rating_count, total_price, products")
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(15);

      if (activeTab === "following") {
        const { data: follows } = await Promise.race([
          supabase.from("follows").select("following_id").eq("follower_id", user.id),
          timeoutPromise
        ]) as any;
        
        const followingIds = follows?.map((f: any) => f.following_id) || [];
        
        if (followingIds.length === 0) {
          setOutfits([]);
          setLoading(false);
          hasFetched.current = true;
          return;
        }
        outfitQuery = outfitQuery.in("user_id", followingIds);
      }

      const { data, error } = await Promise.race([outfitQuery, timeoutPromise]) as any;
      if (error) throw error;
        
      // Skip enrichment for speed - just show basic data first
      const basicOutfits: FeedOutfit[] = (data || []).map((outfit: any) => ({
        ...outfit,
        products: outfit.products as unknown as Product[],
        profile: undefined,
        likes_count: 0,
        comments_count: 0,
        is_liked: false,
      }));

      setOutfits(basicOutfits);
      setLoading(false);
      hasFetched.current = true;
      feedCache.set(cacheKey, { data: basicOutfits, timestamp: Date.now() });

      // Enrich in background (non-blocking)
      enrichOutfits(basicOutfits, user.id, cacheKey);
    } catch (err) {
      console.error("Error fetching feed:", err);
      if (!hasFetched.current) {
        toast.error("Failed to load feed");
      }
      setLoading(false);
      hasFetched.current = true;
    }
  }, [user, activeTab]);

  const enrichOutfits = async (basicOutfits: FeedOutfit[], userId: string, cacheKey: string) => {
    try {
      const userIds = [...new Set(basicOutfits.map(o => o.user_id))];
      const outfitIds = basicOutfits.map(o => o.id);

      const [profilesRes, likesRes, commentsRes, userLikesRes] = await Promise.all([
        supabase.from("profiles").select("user_id, display_name, avatar_url").in("user_id", userIds),
        supabase.from("outfit_likes").select("outfit_id").in("outfit_id", outfitIds),
        supabase.from("outfit_comments").select("outfit_id").in("outfit_id", outfitIds),
        supabase.from("outfit_likes").select("outfit_id").eq("user_id", userId).in("outfit_id", outfitIds)
      ]);

      const profileMap = new Map(profilesRes.data?.map(p => [p.user_id, p]) || []);
      const likeCounts = new Map<string, number>();
      const commentCounts = new Map<string, number>();
      const userLikedSet = new Set(userLikesRes.data?.map(l => l.outfit_id) || []);

      likesRes.data?.forEach(l => {
        likeCounts.set(l.outfit_id, (likeCounts.get(l.outfit_id) || 0) + 1);
      });
      commentsRes.data?.forEach(c => {
        commentCounts.set(c.outfit_id, (commentCounts.get(c.outfit_id) || 0) + 1);
      });

      const enrichedOutfits = basicOutfits.map(outfit => ({
        ...outfit,
        profile: profileMap.get(outfit.user_id),
        likes_count: likeCounts.get(outfit.id) || 0,
        comments_count: commentCounts.get(outfit.id) || 0,
        is_liked: userLikedSet.has(outfit.id),
      }));

      setOutfits(enrichedOutfits);
      feedCache.set(cacheKey, { data: enrichedOutfits, timestamp: Date.now() });
    } catch (e) {
      console.error("Error enriching feed:", e);
    }
  };

  const handleLikeToggle = async (outfitId: string, isLiked: boolean) => {
    if (!user) return;

    // Optimistic update
    setOutfits(prev => prev.map(o => 
      o.id === outfitId 
        ? { ...o, is_liked: !isLiked, likes_count: isLiked ? o.likes_count - 1 : o.likes_count + 1 }
        : o
    ));

    const outfit = outfits.find(o => o.id === outfitId);

    try {
      if (isLiked) {
        await supabase.from("outfit_likes").delete().eq("outfit_id", outfitId).eq("user_id", user.id);
      } else {
        await supabase.from("outfit_likes").insert({ outfit_id: outfitId, user_id: user.id });
        if (outfit && outfit.user_id !== user.id) {
          supabase.from("notifications").insert({
            user_id: outfit.user_id,
            actor_id: user.id,
            type: "like",
            outfit_id: outfitId
          });
        }
      }
    } catch (err) {
      console.error("Error toggling like:", err);
      // Revert on error
      setOutfits(prev => prev.map(o => 
        o.id === outfitId 
          ? { ...o, is_liked: isLiked, likes_count: isLiked ? o.likes_count : o.likes_count - 1 }
          : o
      ));
    }
  };

  // Show content immediately, loading only on first fetch
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-foreground/20 border-t-foreground animate-spin rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 pt-24 pb-6">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Users className="w-5 h-5 text-foreground" />
          <h1 className="font-display text-xl tracking-[0.15em]">STYLE FEED</h1>
        </div>

        <UserSearch currentUserId={user?.id || ""} />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="w-full bg-card border border-border h-12">
            <TabsTrigger value="discover" className="flex-1 font-display text-xs tracking-wider min-h-[44px] touch-manipulation">
              DISCOVER
            </TabsTrigger>
            <TabsTrigger value="following" className="flex-1 font-display text-xs tracking-wider min-h-[44px] touch-manipulation">
              FOLLOWING
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="mt-6">
            {loading ? (
              <LoadingState />
            ) : outfits.length === 0 ? (
              <EmptyState message="No public outfits yet. Be the first to share!" />
            ) : (
              <FeedList outfits={outfits} onLikeToggle={handleLikeToggle} currentUserId={user?.id || ""} />
            )}
          </TabsContent>

          <TabsContent value="following" className="mt-6">
            {loading ? (
              <LoadingState />
            ) : outfits.length === 0 ? (
              <EmptyState message="Follow some users to see their outfits here!" />
            ) : (
              <FeedList outfits={outfits} onLikeToggle={handleLikeToggle} currentUserId={user?.id || ""} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const LoadingState = () => (
  <div className="space-y-4">
    {[1, 2].map(i => (
      <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
        <div className="h-6 w-32 bg-muted rounded mb-4" />
        <div className="aspect-[3/4] bg-muted rounded-lg" />
      </div>
    ))}
  </div>
);

const FeedList = ({ 
  outfits, 
  onLikeToggle,
  currentUserId 
}: { 
  outfits: FeedOutfit[]; 
  onLikeToggle: (id: string, isLiked: boolean) => void;
  currentUserId: string;
}) => (
  <div className="space-y-6">
    {outfits.map((outfit) => (
      <motion.div
        key={outfit.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <FeedCard 
          outfit={outfit} 
          onLikeToggle={onLikeToggle}
          currentUserId={currentUserId}
        />
      </motion.div>
    ))}
  </div>
);

const EmptyState = ({ message }: { message: string }) => (
  <div className="text-center py-20">
    <Sparkles className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
    <p className="text-muted-foreground font-body text-sm tracking-wide">
      {message}
    </p>
  </div>
);

export default Feed;