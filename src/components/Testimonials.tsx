import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sophie L.",
    role: "Fashion Blogger",
    quote: "This is the future of online shopping. I can finally see if something will actually look good on me!",
    rating: 5
  },
  {
    name: "Marcus T.",
    role: "Shopper",
    quote: "Saved me from so many returns. The accuracy is incredible—it's like having a fitting room at home.",
    rating: 5
  },
  {
    name: "Elena K.",
    role: "Stylist",
    quote: "I recommend Style Dream to all my clients. It's changed how we plan outfits together.",
    rating: 5
  }
];

const Testimonials = () => {
  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 mb-4 text-xs font-body font-medium tracking-widest uppercase text-gold border border-gold/30 rounded-full">
            Loved by Users
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-medium mb-4">
            What People Say
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-card border border-border rounded-2xl p-6 hover:border-gold/30 transition-colors"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-gold text-gold" />
                ))}
              </div>

              {/* Quote */}
              <p className="font-body text-foreground mb-6 leading-relaxed">
                "{testimonial.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                  <span className="font-display text-sm text-gold">{testimonial.name[0]}</span>
                </div>
                <div>
                  <p className="font-body text-sm font-medium">{testimonial.name}</p>
                  <p className="font-body text-xs text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
