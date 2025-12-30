import { motion } from "framer-motion";
import { Sparkles, Camera, Search, Heart, Users, Star, ShoppingBag } from "lucide-react";

const steps = [
  {
    icon: Camera,
    title: "Upload Your Photo",
    description: "Take or upload a full-body photo. Wear form-fitting clothes for best results."
  },
  {
    icon: Search,
    title: "Find Clothes",
    description: "Browse the catalog or use AI search. Paste links from any fashion website."
  },
  {
    icon: Sparkles,
    title: "Try On with AI",
    description: "Select items and see them on your body. Mix tops, bottoms, jackets & accessories."
  },
  {
    icon: Heart,
    title: "Save & Share",
    description: "Save outfits to your collection. Share publicly on the Feed or keep private."
  },
  {
    icon: Users,
    title: "Connect",
    description: "Follow friends, like their outfits, leave comments and share styling tips."
  },
  {
    icon: Star,
    title: "Rate Outfits",
    description: "Give outfits 1-5 stars. Help the community find the best looks."
  },
];

const OnboardingTips = () => {
  return (
    <section className="py-16 bg-secondary/30 border-y border-border">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <span className="inline-block px-3 py-1 text-[10px] font-body font-medium tracking-[0.2em] uppercase text-muted-foreground border border-border mb-4">
            HOW IT WORKS
          </span>
          <h2 className="font-display text-2xl sm:text-3xl mb-3 tracking-[0.05em]">
            YOUR STYLE JOURNEY
          </h2>
          <p className="font-body text-muted-foreground max-w-md mx-auto text-sm">
            From upload to outfit - here's everything you can do with Style Dream
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="flex flex-col items-center text-center p-4 border border-border bg-background hover:border-foreground/30 transition-colors"
            >
              <div className="w-10 h-10 border border-border rounded-full flex items-center justify-center mb-3">
                <step.icon className="w-5 h-5 text-foreground" />
              </div>
              <h3 className="font-display text-xs tracking-[0.1em] mb-2">{step.title}</h3>
              <p className="text-[10px] text-muted-foreground leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-8 p-4 bg-primary/5 border border-primary/20 rounded-lg text-center"
        >
          <p className="text-sm text-muted-foreground font-body">
            <ShoppingBag className="w-4 h-4 inline mr-2 text-primary" />
            <span className="font-medium text-foreground">Pro tip:</span>{" "}
            Use the AI Shopping Assistant to paste links from ASOS, Flannels, and other retailers to try on specific products!
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default OnboardingTips;
