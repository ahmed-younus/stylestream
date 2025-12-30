import { Instagram, Twitter } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer id="about" className="py-16 px-4 md:px-6 pb-24 md:pb-16 border-t border-border bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <span className="font-display text-xl tracking-[0.2em]">
                STYLEDREAM
              </span>
            </div>
            <p className="font-body text-sm text-muted-foreground max-w-sm leading-relaxed mb-4 tracking-wide">
              The future of fashion shopping. Try any outfit on your body before you buy—powered by AI.
            </p>
            <p className="font-body text-xs text-muted-foreground tracking-wide">
              Founded by <span className="text-foreground">Jamie Anderson</span> • 2025
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-display text-xs tracking-[0.2em] mb-4 text-muted-foreground">PLATFORM</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/how-it-works" className="font-body text-sm hover:text-muted-foreground transition-colors tracking-wide min-h-[44px] inline-flex items-center touch-manipulation">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/studio" className="font-body text-sm hover:text-muted-foreground transition-colors tracking-wide min-h-[44px] inline-flex items-center touch-manipulation">
                  Try-On Studio
                </Link>
              </li>
              <li>
                <Link to="/brands" className="font-body text-sm hover:text-muted-foreground transition-colors tracking-wide min-h-[44px] inline-flex items-center touch-manipulation">
                  For Brands
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-xs tracking-[0.2em] mb-4 text-muted-foreground">CONNECT</h4>
            <ul className="space-y-3">
              <li>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="font-body text-sm hover:text-muted-foreground transition-colors tracking-wide min-h-[44px] inline-flex items-center touch-manipulation">
                  Instagram
                </a>
              </li>
              <li>
                <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="font-body text-sm hover:text-muted-foreground transition-colors tracking-wide min-h-[44px] inline-flex items-center touch-manipulation">
                  Twitter / X
                </a>
              </li>
              <li>
                <a href="mailto:hello@styledream.app" className="font-body text-sm hover:text-muted-foreground transition-colors tracking-wide min-h-[44px] inline-flex items-center touch-manipulation">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <p className="font-body text-xs text-muted-foreground tracking-wide">
              © 2025 Style Dream. All rights reserved.
            </p>
            <div className="flex gap-4">
              <Link to="/terms" className="font-body text-xs text-muted-foreground hover:text-foreground transition-colors tracking-wide min-h-[44px] inline-flex items-center touch-manipulation">
                Terms & Conditions
              </Link>
              <Link to="/privacy" className="font-body text-xs text-muted-foreground hover:text-foreground transition-colors tracking-wide min-h-[44px] inline-flex items-center touch-manipulation">
                Privacy Policy
              </Link>
            </div>
          </div>
          <div className="flex gap-4">
            <a 
              href="https://instagram.com" 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="Follow us on Instagram"
              className="w-11 h-11 border border-border flex items-center justify-center hover:border-foreground transition-colors touch-manipulation active:scale-95"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a 
              href="https://x.com" 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="Follow us on Twitter"
              className="w-11 h-11 border border-border flex items-center justify-center hover:border-foreground transition-colors touch-manipulation active:scale-95"
            >
              <Twitter className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;