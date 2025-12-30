import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { UserPlus, UserMinus, Grid, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Product } from "@/types/product";
import Navbar from "@/components/Navbar";

interface Profile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface ProfileOutfit {
  id: string;
  try_on_image: string;
  products: Product[];
  total_price: number;
  created_at: string;
  caption: string | null;
}

interface ProfileStats {
  outfitsCount: number;
  followersCount: number;
  followingCount: number;
}

// Cache for profile data
const profileCache = new Map<string, { profile: Profile; outfits: ProfileOutfit[]; stats: ProfileStats; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute

const ProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [outfits, setOutfits] = useState<ProfileOutfit[]>([]);
  const [stats, setStats] = useState<ProfileStats>({ outfitsCount: 0, followersCount: 0, followingCount: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const hasFetched = useRef(false);

  const isOwnProfile = user?.id === userId;

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId, user]);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;

    // Check cache first
    const cached = profileCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setProfile(cached.profile);
      setOutfits(cached.outfits);
      setStats(cached.stats);
      setLoading(false);
      return;
    }

    if (!hasFetched.current) {
      setLoading(true);
    }

    try {
      // Fetch profile first (critical)
      const profilePromise = supabase.from("profiles").select("*").eq("user_id", userId).single();
      const { data: profileData, error: profileError } = await Promise.race([
        profilePromise,
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]);

      if (profileError) throw profileError;
      setProfile(profileData);
      setLoading(false);
      hasFetched.current = true;

      // Fetch outfits (only public ones if not own profile)
      let outfitsQuery = supabase
        .from("saved_outfits")
        .select("id, try_on_image, products, total_price, created_at, caption")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!isOwnProfile) {
        outfitsQuery = outfitsQuery.eq("is_public", true);
      }

      const [outfitsRes, followersRes, followingRes] = await Promise.all([
        outfitsQuery,
        supabase.from("follows").select("id", { count: "exact" }).eq("following_id", userId),
        supabase.from("follows").select("id", { count: "exact" }).eq("follower_id", userId)
      ]);

      const parsedOutfits = (outfitsRes.data || []).map((o: any) => ({
        ...o,
        products: o.products as unknown as Product[]
      }));
      setOutfits(parsedOutfits);

      const newStats = {
        outfitsCount: parsedOutfits.length,
        followersCount: followersRes.count || 0,
        followingCount: followingRes.count || 0
      };
      setStats(newStats);

      // Cache the results
      profileCache.set(userId, {
        profile: profileData,
        outfits: parsedOutfits,
        stats: newStats,
        timestamp: Date.now()
      });

      // Check if following (non-blocking)
      if (user && !isOwnProfile) {
        supabase
          .from("follows")
          .select("id")
          .eq("follower_id", user.id)
          .eq("following_id", userId)
          .single()
          .then(({ data }) => setIsFollowing(!!data));
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      if (!hasFetched.current) {
        toast.error("Failed to load profile");
      }
      setLoading(false);
      hasFetched.current = true;
    }
  }, [userId, user, isOwnProfile]);

  const handleFollowToggle = async () => {
    if (!user || !userId) return;

    // Optimistic update
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);
    setStats(prev => ({
      ...prev,
      followersCount: wasFollowing ? prev.followersCount - 1 : prev.followersCount + 1
    }));

    try {
      if (wasFollowing) {
        await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", userId);
        toast.success("Unfollowed");
      } else {
        await supabase.from("follows").insert({ follower_id: user.id, following_id: userId });
        supabase.from("notifications").insert({
          user_id: userId,
          actor_id: user.id,
          type: "follow"
        });
        toast.success("Following!");
      }
    } catch (err) {
      console.error("Error toggling follow:", err);
      // Revert
      setIsFollowing(wasFollowing);
      setStats(prev => ({
        ...prev,
        followersCount: wasFollowing ? prev.followersCount + 1 : prev.followersCount - 1
      }));
      toast.error("Failed to update follow status");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-foreground/20 border-t-foreground animate-spin rounded-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Profile not found</p>
      </div>
    );
  }

  const displayName = profile.display_name || "Anonymous";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-2xl mx-auto px-4 pt-24 pb-8">
        <div className="flex items-start gap-6 mb-8">
          <Avatar className="w-20 h-20 border-2 border-border">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="bg-secondary text-foreground font-display text-xl">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <h2 className="font-display text-lg tracking-wider">{displayName}</h2>
              {isOwnProfile && (
                <Button onClick={() => navigate("/edit-profile")} variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              )}
              {!isOwnProfile && user && (
                <Button onClick={handleFollowToggle} variant={isFollowing ? "outline" : "default"} size="sm">
                  {isFollowing ? (
                    <>
                      <UserMinus className="w-4 h-4 mr-1" />
                      UNFOLLOW
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-1" />
                      FOLLOW
                    </>
                  )}
                </Button>
              )}
            </div>

            <div className="flex gap-6">
              <div className="text-center">
                <p className="font-display text-lg">{stats.outfitsCount}</p>
                <p className="text-xs text-muted-foreground font-body uppercase tracking-wider">Outfits</p>
              </div>
              <div className="text-center">
                <p className="font-display text-lg">{stats.followersCount}</p>
                <p className="text-xs text-muted-foreground font-body uppercase tracking-wider">Followers</p>
              </div>
              <div className="text-center">
                <p className="font-display text-lg">{stats.followingCount}</p>
                <p className="text-xs text-muted-foreground font-body uppercase tracking-wider">Following</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Grid className="w-4 h-4" />
            <span className="font-display text-xs tracking-wider">OUTFITS</span>
          </div>

          {outfits.length === 0 ? (
            <p className="text-center text-muted-foreground py-12 font-body">
              {isOwnProfile ? "You haven't saved any outfits yet" : "No public outfits"}
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {outfits.map((outfit) => (
                <motion.div
                  key={outfit.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="aspect-square cursor-pointer group relative overflow-hidden"
                  onClick={() => navigate(`/outfit/${outfit.id}`)}
                >
                  <img
                    src={outfit.try_on_image}
                    alt="Outfit"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-background/0 group-hover:bg-background/20 transition-colors" />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;