import { motion } from "framer-motion";
import { Upload, Shirt, ShoppingBag, Check } from "lucide-react";

const steps = [
  {
    icon: Upload,
    step: "01",
    title: "UPLOAD YOUR PHOTO",
    description: "Take a quick selfie or upload any full-body photo"
  },
  {
    icon: Shirt,
    step: "02",
    title: "BROWSE & TRY ON",
    description: "Explore outfits and see them on your body instantly"
  },
  {
    icon: ShoppingBag,
    step: "03",
    title: "SHOP WITH CONFIDENCE",
    description: "Buy directly from brands, knowing it fits perfectly"
  }
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 px-6 bg-background">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 mb-6 text-xs font-body font-medium tracking-[0.2em] uppercase text-foreground border border-border">
            SIMPLE PROCESS
          </span>
          <h2 className="font-display text-3xl md:text-5xl mb-4 tracking-[0.05em]">
            THREE SIMPLE STEPS
          </h2>
          <p className="font-body text-muted-foreground max-w-lg mx-auto tracking-wide">
            No complicated setup. No technical knowledge needed. Just upload and try.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="relative group"
            >
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-1/2 w-full h-px bg-border" />
              )}

              <div className="relative bg-card border border-border p-8 hover:border-foreground transition-all duration-300 text-center">
                {/* Step Number */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-foreground text-background font-body font-medium text-xs tracking-[0.1em]">
                  {step.step}
                </div>

                {/* Icon */}
                <div className="w-14 h-14 mx-auto mb-6 border border-border flex items-center justify-center group-hover:border-foreground transition-colors">
                  <step.icon className="w-6 h-6 text-foreground" />
                </div>

                <h3 className="font-display text-sm mb-3 tracking-[0.1em]">{step.title}</h3>
                <p className="font-body text-xs text-muted-foreground leading-relaxed tracking-wide">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 flex flex-wrap justify-center gap-4"
        >
          {["No app download", "Works on any device", "100% free to try", "Privacy protected"].map((benefit) => (
            <div key={benefit} className="flex items-center gap-2 px-4 py-2 border border-border">
              <Check className="w-3 h-3 text-foreground" />
              <span className="font-body text-xs tracking-[0.1em] uppercase">{benefit}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;