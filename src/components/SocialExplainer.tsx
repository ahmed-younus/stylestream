import { motion } from "framer-motion";
import { Heart, MessageCircle, Share2, Star, Users } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";

const SocialExplainer = () => {
  const navigate = useNavigate();

  const features = [
    { icon: Heart, label: "Like outfits", desc: "Save favorites from friends" },
    { icon: MessageCircle, label: "Comment", desc: "Share styling tips" },
    { icon: Share2, label: "Share", desc: "To Twitter, Facebook & more" },
    { icon: Star, label: "Rate", desc: "Give outfits 1-5 stars" },
    { icon: Users, label: "Follow", desc: "See friends' latest looks" },
  ];

  return (
    <section className="py-16 bg-card/50 border-y border-border">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="font-display text-2xl sm:text-3xl mb-4 tracking-[0.05em]">
            SHARE YOUR STYLE
          </h2>
          <p className="font-body text-muted-foreground max-w-md mx-auto">
            Join our fashion community. Save outfits, follow friends, and get feedback on your looks.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-10"
        >
          {features.map((feature, i) => (
            <div
              key={i}
              className="flex flex-col items-center text-center p-4 border border-border bg-background"
            >
              <feature.icon className="w-6 h-6 mb-3 text-foreground" />
              <p className="font-display text-xs tracking-[0.1em] mb-1">{feature.label}</p>
              <p className="text-[10px] text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex justify-center"
        >
          <Button
            onClick={() => navigate("/feed")}
            variant="outline"
            size="lg"
            className="tracking-[0.15em]"
          >
            EXPLORE THE FEED
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default SocialExplainer;