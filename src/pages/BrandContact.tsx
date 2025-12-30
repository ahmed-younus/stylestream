import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, Loader2, CheckCircle, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { z } from "zod";

const brandInquirySchema = z.object({
  brandName: z.string().trim().min(1, "Brand name is required").max(100, "Brand name must be under 100 characters"),
  contactName: z.string().trim().min(1, "Contact name is required").max(100, "Name must be under 100 characters"),
  email: z.string().trim().email("Please enter a valid email").max(255, "Email must be under 255 characters"),
  phone: z.string().max(20, "Phone must be under 20 characters").optional().or(z.literal("")),
  website: z.string().url("Please enter a valid URL").max(255, "URL must be under 255 characters").optional().or(z.literal("")),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(2000, "Message must be under 2000 characters"),
});

const BrandContact = () => {
  const [formData, setFormData] = useState({
    brandName: "",
    contactName: "",
    email: "",
    phone: "",
    website: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate with Zod
    const result = brandInquirySchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      toast.error("Please fix the form errors");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("brand_inquiries")
        .insert({
          brand_name: result.data.brandName,
          contact_name: result.data.contactName,
          email: result.data.email,
          phone: result.data.phone || null,
          website: result.data.website || null,
          message: result.data.message,
        });

      if (error) throw error;

      setIsSubmitted(true);
      toast.success("Thank you! We'll be in touch soon.");
    } catch (error) {
      toast.error("Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-lg mx-auto px-6 py-24 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-20 h-20 border border-foreground rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckCircle className="w-10 h-10 text-foreground" />
            </div>
            <h1 className="font-display text-3xl mb-4 tracking-[0.1em]">
              THANK YOU
            </h1>
            <p className="font-body text-muted-foreground mb-8">
              We've received your inquiry and our partnerships team will be in touch within 48 hours.
            </p>
            <Button
              onClick={() => window.location.href = "/"}
              variant="outline"
              size="lg"
            >
              BACK TO HOME
            </Button>
          </motion.div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-6 py-24">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="w-16 h-16 border border-border rounded-full flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-8 h-8 text-foreground" />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl mb-6 tracking-[0.1em]">
            PARTNER WITH US
          </h1>
          <p className="font-body text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Don't miss out on this revolutionary AI fashion platform. 
            Showcase your brand to thousands of fashion-forward customers.
          </p>
          
          {/* Benefits */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12 text-left">
            {[
              { icon: "🎯", title: "Targeted Reach", desc: "Connect with customers actively looking for your products" },
              { icon: "🔮", title: "AI-Powered", desc: "Customers see exactly how your clothes look on them" },
              { icon: "📈", title: "Higher Conversion", desc: "Virtual try-on reduces returns and boosts sales" },
            ].map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.1 }}
                className="p-6 border border-border bg-card"
              >
                <div className="text-2xl mb-3">{benefit.icon}</div>
                <h3 className="font-display text-sm tracking-[0.1em] mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-lg mx-auto"
        >
          <div className="border border-border bg-card p-8">
            <h2 className="font-display text-xl mb-6 tracking-[0.1em] text-center">
              GET IN TOUCH
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brandName" className="font-display text-xs tracking-wider">
                    BRAND NAME *
                  </Label>
                  <Input
                    id="brandName"
                    name="brandName"
                    value={formData.brandName}
                    onChange={handleChange}
                    placeholder="Your brand"
                    maxLength={100}
                    className={`bg-background border-border ${errors.brandName ? "border-destructive" : ""}`}
                  />
                  {errors.brandName && <p className="text-xs text-destructive">{errors.brandName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactName" className="font-display text-xs tracking-wider">
                    YOUR NAME *
                  </Label>
                  <Input
                    id="contactName"
                    name="contactName"
                    value={formData.contactName}
                    onChange={handleChange}
                    placeholder="Full name"
                    maxLength={100}
                    className={`bg-background border-border ${errors.contactName ? "border-destructive" : ""}`}
                  />
                  {errors.contactName && <p className="text-xs text-destructive">{errors.contactName}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-display text-xs tracking-wider">
                    EMAIL *
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="email@brand.com"
                    maxLength={255}
                    className={`bg-background border-border ${errors.email ? "border-destructive" : ""}`}
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="font-display text-xs tracking-wider">
                    PHONE
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Optional"
                    maxLength={20}
                    className={`bg-background border-border ${errors.phone ? "border-destructive" : ""}`}
                  />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website" className="font-display text-xs tracking-wider">
                  WEBSITE
                </Label>
                <Input
                  id="website"
                  name="website"
                  type="url"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://yourbrand.com"
                  maxLength={255}
                  className={`bg-background border-border ${errors.website ? "border-destructive" : ""}`}
                />
                {errors.website && <p className="text-xs text-destructive">{errors.website}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="font-display text-xs tracking-wider">
                  MESSAGE *
                </Label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell us about your brand and partnership goals..."
                  maxLength={2000}
                  className={`min-h-[120px] bg-background border-border ${errors.message ? "border-destructive" : ""}`}
                />
                {errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
                <p className="text-xs text-muted-foreground text-right">{formData.message.length}/2000</p>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                variant="primary"
                size="xl"
                className="w-full tracking-[0.15em]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    SUBMITTING...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    SUBMIT INQUIRY
                  </>
                )}
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    </main>
  );
};

export default BrandContact;