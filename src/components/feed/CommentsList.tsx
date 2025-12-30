import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface CommentsListProps {
  outfitId: string;
  currentUserId: string;
}

const CommentsList = ({ outfitId, currentUserId }: CommentsListProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComments();

    // Subscribe to new comments
    const channel = supabase
      .channel(`comments-${outfitId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'outfit_comments',
          filter: `outfit_id=eq.${outfitId}`
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [outfitId]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from("outfit_comments")
        .select("*")
        .eq("outfit_id", outfitId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch profiles for comments
      const userIds = [...new Set(data?.map(c => c.user_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const parsedComments = (data || []).map(c => ({
        ...c,
        profile: profileMap.get(c.user_id)
      }));

      setComments(parsedComments);
    } catch (err) {
      console.error("Error fetching comments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from("outfit_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;

      setComments(prev => prev.filter(c => c.id !== commentId));
      toast.success("Comment deleted");
    } catch (err) {
      console.error("Error deleting comment:", err);
      toast.error("Failed to delete comment");
    }
  };

  if (loading) {
    return (
      <div className="py-4 text-center">
        <div className="w-6 h-6 border border-foreground/30 border-t-foreground animate-spin mx-auto" />
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <p className="text-muted-foreground text-xs text-center py-4 font-body">
        No comments yet. Be the first!
      </p>
    );
  }

  return (
    <div className="space-y-3 pt-2 border-t border-border mt-2">
      {comments.map((comment, index) => {
        const displayName = comment.profile?.display_name || "Anonymous";
        const initials = displayName.slice(0, 2).toUpperCase();
        const isOwn = comment.user_id === currentUserId;

        return (
          <motion.div
            key={comment.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className="flex gap-3 group"
          >
            <Avatar className="w-8 h-8 border border-border flex-shrink-0">
              <AvatarImage src={comment.profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-secondary text-foreground font-display text-[10px]">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-display text-xs tracking-wider">{displayName}</span>
                <span className="text-muted-foreground text-[10px] font-body">
                  {formatTimeAgo(comment.created_at)}
                </span>
              </div>
              <p className="text-sm text-foreground/90 font-body break-words">
                {comment.content}
              </p>
            </div>
            {isOwn && (
              <button
                onClick={() => handleDelete(comment.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

const formatTimeAgo = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
  return date.toLocaleDateString();
};

export default CommentsList;
