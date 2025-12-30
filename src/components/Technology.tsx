import { motion } from "framer-motion";
import { Cpu, Eye, Zap, Shield } from "lucide-react";

const features = [
  {
    icon: Cpu,
    title: "AI BODY MAPPING",
    description: "Our AI detects your body shape and posture with 99.2% accuracy"
  },
  {
    icon: Eye,
    title: "PHOTOREALISTIC RESULTS",
    description: "Advanced texture and lighting matching for natural-looking try-ons"
  },
  {
    icon: Zap,
    title: "INSTANT PROCESSING",
    description: "See results in under 3 seconds with GPU-accelerated rendering"
  },
  {
    icon: Shield,
    title: "PRIVACY FIRST",
    description: "Your photos are processed securely and never stored or shared"
  }
];

const Technology = () => {
  return (
    <section id="technology" className="py-24 px-6 bg-card">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Features */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-2 mb-6 text-xs font-body font-medium tracking-[0.2em] uppercase text-foreground border border-border">
              THE TECH BEHIND IT
            </span>
            <h2 className="font-display text-3xl md:text-5xl mb-6 tracking-[0.05em]">
              FASHION MEETS
              <br />
              <span className="text-muted-foreground">CUTTING-EDGE AI</span>
            </h2>
            <p className="font-body text-muted-foreground mb-10 leading-relaxed tracking-wide">
              Style Dream uses the same technology powering top fashion retailers 
              and luxury brands—now available to everyone.
            </p>

            <div className="grid sm:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex gap-4"
                >
                  <div className="w-12 h-12 border border-border flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-foreground" />
                  </div>
                  <div>
                    <h4 className="font-display text-xs mb-1 tracking-[0.1em]">{feature.title}</h4>
                    <p className="font-body text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right - Visual */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="aspect-square bg-background border border-border overflow-hidden relative">
              {/* Animated Grid */}
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
                backgroundSize: '50px 50px',
              }} />

              {/* Center Animation */}
              <div className="absolute inset-0 flex items-center justify-center">
                {[1, 2, 3].map((ring) => (
                  <motion.div
                    key={ring}
                    className="absolute border border-foreground/20"
                    style={{
                      width: `${ring * 30}%`,
                      height: `${ring * 30}%`,
                    }}
                    animate={{
                      scale: [1, 1.1, 1],
                      opacity: [0.1, 0.3, 0.1],
                    }}
                    transition={{
                      duration: 2,
                      delay: ring * 0.4,
                      repeat: Infinity,
                    }}
                  />
                ))}
                
                <motion.div
                  className="w-20 h-20 bg-foreground flex items-center justify-center"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <Cpu className="w-10 h-10 text-background" />
                </motion.div>
              </div>

              {/* Corner Stats */}
              <div className="absolute top-6 left-6 px-3 py-2 bg-card border border-border">
                <span className="text-xs text-muted-foreground tracking-[0.1em]">PROCESSING</span>
                <p className="font-display text-lg text-foreground">2.8s</p>
              </div>
              <div className="absolute bottom-6 right-6 px-3 py-2 bg-card border border-border">
                <span className="text-xs text-muted-foreground tracking-[0.1em]">ACCURACY</span>
                <p className="font-display text-lg text-foreground">99.2%</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Technology;