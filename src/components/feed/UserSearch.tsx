import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, UserPlus, UserMinus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Profile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  is_following: boolean;
}

interface UserSearchProps {
  currentUserId: string;
}

const UserSearch = ({ currentUserId }: UserSearchProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      searchUsers();
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const searchUsers = async () => {
    setLoading(true);
    try {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .ilike("display_name", `%${query}%`)
        .neq("user_id", currentUserId)
        .limit(10);

      if (error) throw error;

      // Check follow status
      const userIds = profiles?.map(p => p.user_id) || [];
      const { data: follows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", currentUserId)
        .in("following_id", userIds);

      const followingSet = new Set(follows?.map(f => f.following_id) || []);

      const enrichedResults = (profiles || []).map(p => ({
        ...p,
        is_following: followingSet.has(p.user_id)
      }));

      setResults(enrichedResults);
      setShowResults(true);
    } catch (err) {
      console.error("Error searching users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId: string) => {
    try {
      await supabase
        .from("follows")
        .insert({ follower_id: currentUserId, following_id: userId });

      setResults(prev => prev.map(p => 
        p.user_id === userId ? { ...p, is_following: true } : p
      ));
      toast.success("Following!");
    } catch (err) {
      console.error("Error following:", err);
      toast.error("Failed to follow user");
    }
  };

  const handleUnfollow = async (userId: string) => {
    try {
      await supabase
        .from("follows")
        .delete()
        .eq("follower_id", currentUserId)
        .eq("following_id", userId);

      setResults(prev => prev.map(p => 
        p.user_id === userId ? { ...p, is_following: false } : p
      ));
      toast.success("Unfollowed");
    } catch (err) {
      console.error("Error unfollowing:", err);
      toast.error("Failed to unfollow user");
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowResults(true)}
          placeholder="Search users..."
          className="pl-10 bg-card border-border"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
              setShowResults(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showResults && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border z-50 max-h-80 overflow-y-auto"
          >
            {results.map((profile) => {
              const displayName = profile.display_name || "Anonymous";
              const initials = displayName.slice(0, 2).toUpperCase();

              return (
                <div
                  key={profile.user_id}
                  className="flex items-center gap-3 p-3 hover:bg-secondary/50 transition-colors border-b border-border last:border-0"
                >
                  <Avatar className="w-10 h-10 border border-border">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback className="bg-secondary text-foreground font-display text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-display text-xs tracking-wider">{displayName}</p>
                  </div>
                  <Button
                    onClick={() => profile.is_following 
                      ? handleUnfollow(profile.user_id) 
                      : handleFollow(profile.user_id)
                    }
                    variant={profile.is_following ? "outline" : "default"}
                    size="sm"
                    className="text-xs"
                  >
                    {profile.is_following ? (
                      <>
                        <UserMinus className="w-3 h-3 mr-1" />
                        UNFOLLOW
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3 h-3 mr-1" />
                        FOLLOW
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside handler */}
      {showResults && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowResults(false)} 
        />
      )}
    </div>
  );
};

export default UserSearch;
