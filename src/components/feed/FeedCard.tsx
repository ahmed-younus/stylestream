import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Sparkles, Send, Share2, Store } from "lucide-react";
import ShareMenu from "./ShareMenu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FeedOutfit } from "@/pages/Feed";
import CommentsList from "./CommentsList";
import OutfitRating from "@/components/OutfitRating";

interface FeedCardProps {
  outfit: FeedOutfit;
  onLikeToggle: (id: string, isLiked: boolean) => void;
  currentUserId: string;
}

const FeedCard = ({ outfit, onLikeToggle, currentUserId }: FeedCardProps) => {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [localCommentsCount, setLocalCommentsCount] = useState(outfit.comments_count);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const lastTapRef = useRef<number>(0);
  const navigate = useNavigate();

  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected - like the outfit
      if (!outfit.is_liked) {
        onLikeToggle(outfit.id, outfit.is_liked);
      }
      // Show heart animation
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 1000);
    }
    lastTapRef.current = now;
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      const { data: commentData, error } = await supabase
        .from("outfit_comments")
        .insert({
          outfit_id: outfit.id,
          user_id: currentUserId,
          content: newComment.trim()
        })
        .select("id")
        .single();

      if (error) throw error;

      // Create notification if commenting on someone else's outfit
      if (outfit.user_id !== currentUserId) {
        await supabase.from("notifications").insert({
          user_id: outfit.user_id,
          actor_id: currentUserId,
          type: "comment",
          outfit_id: outfit.id,
          comment_id: commentData.id
        });
      }

      setNewComment("");
      setLocalCommentsCount(prev => prev + 1);
      toast.success("Comment added!");
    } catch (err) {
      console.error("Error adding comment:", err);
      toast.error("Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleProfileClick = () => {
    navigate(`/profile/${outfit.user_id}`);
  };

  const displayName = outfit.profile?.display_name || "Anonymous";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="bg-card border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <Avatar 
          className="w-10 h-10 border border-border cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
          onClick={handleProfileClick}
        >
          <AvatarImage src={outfit.profile?.avatar_url || undefined} />
          <AvatarFallback className="bg-secondary text-foreground font-display text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p 
            className="font-display text-xs tracking-wider cursor-pointer hover:text-primary transition-colors"
            onClick={handleProfileClick}
          >
            {displayName}
          </p>
          <p className="text-xs text-muted-foreground font-body">
            {new Date(outfit.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="bg-foreground text-background px-2 py-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          <span className="text-[10px] font-body font-semibold uppercase tracking-[0.1em]">
            AI Try-On
          </span>
        </div>
      </div>
      {/* Image with double-tap to like */}
      <div 
        className="relative aspect-[3/4] cursor-pointer select-none"
        onClick={handleDoubleTap}
      >
        <img
          src={outfit.try_on_image}
          alt="Outfit"
          className="w-full h-full object-cover"
          draggable={false}
          loading="lazy"
          decoding="async"
        />
        
        {/* Heart Animation Overlay */}
        <AnimatePresence>
          {showHeartAnimation && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ 
                type: "spring", 
                stiffness: 400, 
                damping: 15 
              }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                }}
                transition={{ duration: 0.4 }}
              >
                <Heart className="w-24 h-24 fill-white text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
        {/* Caption */}
        {outfit.caption && (
          <p className="font-body text-sm text-foreground/90 leading-relaxed">
            <span className="font-display text-xs tracking-wider mr-2">{displayName}</span>
            {outfit.caption}
          </p>
        )}

        <div className="flex items-center gap-1">
          <button
            onClick={() => onLikeToggle(outfit.id, outfit.is_liked)}
            className="flex items-center gap-1.5 p-2 -ml-2 rounded-lg hover:bg-secondary/50 active:bg-secondary transition-colors touch-manipulation"
          >
            <motion.div
              whileTap={{ scale: 0.8 }}
              animate={outfit.is_liked ? { scale: [1, 1.2, 1] } : {}}
            >
              <Heart
                className={`w-6 h-6 transition-colors ${
                  outfit.is_liked
                    ? "fill-red-500 text-red-500"
                    : "text-foreground"
                }`}
              />
            </motion.div>
            <span className="font-body text-sm">{outfit.likes_count}</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 p-2 rounded-lg hover:bg-secondary/50 active:bg-secondary transition-colors touch-manipulation"
          >
            <MessageCircle className="w-6 h-6 text-foreground" />
            <span className="font-body text-sm">{localCommentsCount}</span>
          </button>

          <div className="ml-auto">
            <ShareMenu outfitId={outfit.id} />
          </div>
        </div>

        {/* Rating */}
        <div className="border-t border-border pt-3">
          <OutfitRating 
            outfitId={outfit.id} 
            outfitOwnerId={outfit.user_id}
            initialAvgRating={outfit.average_rating || 0}
            initialRatingCount={outfit.rating_count || 0}
            compact
          />
        </div>

        {/* Products with retailer tags */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1" style={{ WebkitOverflowScrolling: 'touch' }}>
          {outfit.products.slice(0, 4).map((product) => (
            <div key={product.id} className="relative flex-shrink-0">
              <img
                src={product.image}
                alt={product.name}
                className="w-11 h-11 sm:w-12 sm:h-12 object-cover border border-border rounded-sm"
              />
              {product.retailer && (
                <span className="absolute -bottom-1 left-0 right-0 bg-foreground text-background text-[7px] sm:text-[8px] text-center py-0.5 font-medium uppercase truncate rounded-b-sm">
                  {product.retailer}
                </span>
              )}
            </div>
          ))}
          {outfit.products.length > 4 && (
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-secondary flex items-center justify-center flex-shrink-0 rounded-sm">
              <span className="text-xs font-body text-muted-foreground">
                +{outfit.products.length - 4}
              </span>
            </div>
          )}
          <div className="ml-auto pl-2 sm:pl-4 flex-shrink-0">
            <p className="font-display text-sm font-semibold">
              £{Number(outfit.total_price).toFixed(0)}
            </p>
          </div>
        </div>

        {/* Comment Input */}
        <form onSubmit={handleSubmitComment} className="flex gap-2">
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 bg-secondary border-border text-sm h-10"
          />
          <Button
            type="submit"
            size="icon"
            variant="ghost"
            disabled={!newComment.trim() || submitting}
            className="h-10 w-10 min-w-[40px] touch-manipulation"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>

        {/* Comments List */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <CommentsList outfitId={outfit.id} currentUserId={currentUserId} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default FeedCard;
