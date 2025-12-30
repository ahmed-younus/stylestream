import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface OutfitRatingProps {
  outfitId: string;
  outfitOwnerId: string;
  initialAvgRating?: number;
  initialRatingCount?: number;
  compact?: boolean;
}

const OutfitRating = ({ 
  outfitId, 
  outfitOwnerId,
  initialAvgRating = 0, 
  initialRatingCount = 0,
  compact = false
}: OutfitRatingProps) => {
  const { user } = useAuth();
  const [userRating, setUserRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [avgRating, setAvgRating] = useState(initialAvgRating);
  const [ratingCount, setRatingCount] = useState(initialRatingCount);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserRating();
    }
  }, [user, outfitId]);

  const fetchUserRating = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("outfit_ratings")
      .select("rating")
      .eq("outfit_id", outfitId)
      .eq("user_id", user.id)
      .maybeSingle();
    
    if (data) {
      setUserRating(data.rating);
    }
  };

  const handleRate = async (rating: number) => {
    if (!user) {
      toast.error("Please sign in to rate outfits");
      return;
    }

    if (user.id === outfitOwnerId) {
      toast.error("You can't rate your own outfit");
      return;
    }

    setIsSubmitting(true);

    try {
      // Upsert the rating
      const { error: ratingError } = await supabase
        .from("outfit_ratings")
        .upsert({
          outfit_id: outfitId,
          user_id: user.id,
          rating: rating,
        }, { onConflict: 'outfit_id,user_id' });

      if (ratingError) throw ratingError;

      // Calculate new average
      const { data: ratings } = await supabase
        .from("outfit_ratings")
        .select("rating")
        .eq("outfit_id", outfitId);

      if (ratings && ratings.length > 0) {
        const total = ratings.reduce((sum, r) => sum + r.rating, 0);
        const newAvg = total / ratings.length;
        
        // Update the outfit's average rating
        await supabase
          .from("saved_outfits")
          .update({
            average_rating: newAvg,
            rating_count: ratings.length,
          })
          .eq("id", outfitId);

        setAvgRating(newAvg);
        setRatingCount(ratings.length);
      }

      setUserRating(rating);
      
      // Create notification for outfit owner
      if (outfitOwnerId !== user.id) {
        await supabase.from("notifications").insert({
          user_id: outfitOwnerId,
          actor_id: user.id,
          outfit_id: outfitId,
          type: "rating",
        });
      }

      toast.success(`Rated ${rating} stars!`);
    } catch (error) {
      console.error("Rating error:", error);
      toast.error("Failed to submit rating");
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayRating = hoverRating || userRating || 0;

  return (
    <div className={cn("flex items-center gap-2", compact && "gap-1")}>
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleRate(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            disabled={isSubmitting}
            className="p-0.5 transition-transform hover:scale-110 disabled:opacity-50"
          >
            <Star
              className={cn(
                compact ? "w-4 h-4" : "w-5 h-5",
                "transition-colors",
                star <= displayRating
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground"
              )}
            />
          </button>
        ))}
      </div>
      
      {ratingCount > 0 && (
        <span className={cn(
          "text-muted-foreground",
          compact ? "text-xs" : "text-sm"
        )}>
          {avgRating.toFixed(1)} ({ratingCount})
        </span>
      )}
    </div>
  );
};

export default OutfitRating;