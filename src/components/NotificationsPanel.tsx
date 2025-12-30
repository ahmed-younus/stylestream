import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Heart, MessageCircle, UserPlus, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface Notification {
  id: string;
  type: "like" | "comment" | "follow";
  outfit_id: string | null;
  is_read: boolean;
  created_at: string;
  actor: {
    user_id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

const NotificationsPanel = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Only fetch when sheet is opened
  useEffect(() => {
    if (open && user && !hasFetched) {
      fetchNotifications();
    }
  }, [open, user, hasFetched]);

  // Defer realtime subscription
  useEffect(() => {
    if (!user) return;

    const timer = setTimeout(() => {
      const channel = supabase
        .channel("notifications")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`
          },
          () => {
            setUnreadCount(prev => prev + 1);
            if (open) fetchNotifications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }, 2000); // Defer subscription by 2 seconds

    return () => clearTimeout(timer);
  }, [user, open]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const queryPromise = supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('timeout')), 4000)
      );

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

      if (error) throw error;

      setHasFetched(true);

      // Skip enrichment for speed - just show notifications
      const simpleNotifications = (data || []).map((n: any) => ({
        ...n,
        type: n.type as "like" | "comment" | "follow",
        actor: { user_id: n.actor_id, display_name: null, avatar_url: null }
      }));

      setNotifications(simpleNotifications);
      setUnreadCount(simpleNotifications.filter((n: any) => !n.is_read).length);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    
    if (notification.type === "follow") {
      navigate(`/profile/${notification.actor.user_id}`);
    } else if (notification.outfit_id) {
      navigate("/feed");
    }
    setOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="w-4 h-4 fill-red-500 text-red-500" />;
      case "comment":
        return <MessageCircle className="w-4 h-4 text-blue-400" />;
      case "follow":
        return <UserPlus className="w-4 h-4 text-green-400" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getNotificationText = (notification: Notification) => {
    const name = notification.actor.display_name || "Someone";
    switch (notification.type) {
      case "like":
        return `${name} liked your outfit`;
      case "comment":
        return `${name} commented on your outfit`;
      case "follow":
        return `${name} started following you`;
      default:
        return "New notification";
    }
  };

  if (!user) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative min-w-[44px] min-h-[44px] touch-manipulation active:scale-95"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-card border-border w-full sm:max-w-md overflow-y-auto" side="right">
        <SheetHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-display text-sm tracking-wider">NOTIFICATIONS</SheetTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                <Check className="w-3 h-3 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="mt-4 space-y-2 overflow-y-auto max-h-[calc(100vh-120px)]">
          {notifications.length === 0 ? (
            <p className="text-center text-muted-foreground py-12 font-body text-sm">
              No notifications yet
            </p>
          ) : (
            <AnimatePresence>
              {notifications.map((notification, index) => {
                const initials = (notification.actor.display_name || "??").slice(0, 2).toUpperCase();

                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => handleNotificationClick(notification)}
                    className={`flex items-start gap-3 p-4 cursor-pointer transition-colors touch-manipulation active:bg-secondary/70 rounded-lg ${
                      !notification.is_read ? "bg-secondary/30" : "hover:bg-secondary/50"
                    }`}
                  >
                    <Avatar className="w-10 h-10 border border-border flex-shrink-0">
                      <AvatarImage src={notification.actor.avatar_url || undefined} />
                      <AvatarFallback className="bg-secondary text-foreground font-display text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {getNotificationIcon(notification.type)}
                        <p className="text-sm font-body text-foreground">
                          {getNotificationText(notification)}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTimeAgo(notification.created_at)}
                      </p>
                    </div>

                    {!notification.is_read && (
                      <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

const formatTimeAgo = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
};

export default NotificationsPanel;
