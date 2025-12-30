import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { Menu, X, Heart, User, LogOut, Users, Sparkles, Shirt, Info, Settings, Trash2, Images } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import NotificationsPanel from "@/components/NotificationsPanel";
import GenerationQueuePanel from "@/components/GenerationQueuePanel";
import CreditsDisplay from "@/components/CreditsDisplay";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleClearAllData = () => {
    localStorage.clear();
    sessionStorage.clear();
    toast.success("All local data cleared", {
      description: "Please refresh the page to complete the reset"
    });
    setShowClearDialog(false);
    setTimeout(() => window.location.reload(), 1000);
  };

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { to: "/studio", label: "Try On", icon: Sparkles, requiresAuth: false },
    { to: "/my-outfits", label: "My Outfits", icon: Images, requiresAuth: true },
    { to: "/wardrobe", label: "Wardrobe", icon: Shirt, requiresAuth: true },
    { to: "/feed", label: "Feed", icon: Users, requiresAuth: true },
    { to: "/how-it-works", label: "How It Works", icon: Info, requiresAuth: false },
  ];

  const filteredLinks = navLinks.filter(link => !link.requiresAuth || user);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-[60] px-4 md:px-6 py-3 md:py-4 bg-background/95 backdrop-blur-sm border-b border-border"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <span className="font-display text-xl tracking-[0.2em] text-foreground">
            STYLEDREAM
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {filteredLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-xs font-body tracking-[0.15em] transition-colors uppercase flex items-center gap-2 ${
                isActive(link.to) 
                  ? 'text-foreground font-medium' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {link.icon && <link.icon className="w-3 h-3" />}
              {link.label}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              <CreditsDisplay compact />
              <GenerationQueuePanel />
              <NotificationsPanel />
              <Link 
                to={`/profile/${user.id}`} 
                className={`flex items-center gap-2 text-xs font-body transition-colors ${
                  location.pathname.startsWith('/profile') 
                    ? 'text-foreground font-medium' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <User className="w-4 h-4" />
                Profile
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Settings className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setShowClearDialog(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear all data
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link to="/auth">
              <Button variant="outline" size="sm" className="tracking-[0.15em] text-xs">
                <User className="w-3 h-3 mr-2" />
                SIGN IN
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2.5 text-foreground touch-manipulation active:scale-95 active:bg-secondary rounded-lg transition-colors"
          aria-label={isOpen ? "Close menu" : "Open menu"}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden absolute top-full left-0 right-0 bg-background border-b border-border overflow-hidden z-[60]"
          >
            <div className="p-4 max-h-[80vh] overflow-y-auto">
              <div className="flex flex-col gap-2">
                {/* Home link */}
                <Link 
                  to="/" 
                  onClick={() => setIsOpen(false)} 
                  className={`text-base font-body py-4 px-4 tracking-[0.08em] uppercase rounded-lg transition-colors touch-manipulation flex items-center gap-3 ${
                    isActive('/') ? 'bg-secondary text-foreground font-medium' : 'active:bg-secondary hover:bg-secondary'
                  }`}
                >
                  <span className="text-lg">🏠</span>
                  Home
                </Link>
                
                {/* Main navigation links */}
                {filteredLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsOpen(false)}
                    className={`text-base font-body py-4 px-4 tracking-[0.08em] uppercase rounded-lg transition-colors flex items-center gap-3 touch-manipulation ${
                      isActive(link.to) ? 'bg-secondary text-foreground font-medium' : 'active:bg-secondary hover:bg-secondary'
                    }`}
                  >
                    {link.icon && <link.icon className="w-5 h-5" />}
                    {link.label}
                  </Link>
                ))}
                
                {user && (
                  <Link 
                    to={`/profile/${user.id}`} 
                    onClick={() => setIsOpen(false)} 
                    className={`text-base font-body py-4 px-4 tracking-[0.08em] uppercase rounded-lg transition-colors flex items-center gap-3 touch-manipulation ${
                      location.pathname.startsWith('/profile') ? 'bg-secondary text-foreground font-medium' : 'active:bg-secondary hover:bg-secondary'
                    }`}
                  >
                    <User className="w-5 h-5" />
                    Profile
                  </Link>
                )}

                {/* Credits and queue section for logged in users */}
                {user && (
                  <div className="flex flex-col gap-3 my-4 px-4 py-4 bg-secondary/50 rounded-lg">
                    <CreditsDisplay />
                    <div className="flex items-center gap-3">
                      <GenerationQueuePanel />
                      <NotificationsPanel />
                      <span className="text-sm text-muted-foreground">Queue & Alerts</span>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="border-t border-border mt-2 pt-4 space-y-2">
                  {user ? (
                    <>
                      <Link 
                        to="/settings"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center w-full text-base font-body py-4 px-4 tracking-[0.08em] uppercase rounded-lg transition-colors touch-manipulation active:bg-secondary hover:bg-secondary"
                      >
                        <Settings className="w-5 h-5 mr-3" />
                        SETTINGS
                      </Link>
                      <Button 
                        variant="ghost" 
                        onClick={() => { handleSignOut(); setIsOpen(false); }} 
                        className="w-full justify-start tracking-[0.08em] text-base py-4 h-auto touch-manipulation active:scale-[0.98]"
                      >
                        <LogOut className="w-5 h-5 mr-3" />
                        SIGN OUT
                      </Button>
                      <Button 
                        variant="ghost" 
                        onClick={() => { setShowClearDialog(true); setIsOpen(false); }} 
                        className="w-full justify-start tracking-[0.08em] text-base py-4 h-auto touch-manipulation active:scale-[0.98] text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-5 h-5 mr-3" />
                        CLEAR ALL DATA
                      </Button>
                    </>
                  ) : (
                    <Link to="/auth" onClick={() => setIsOpen(false)} className="block">
                      <Button variant="primary" className="w-full tracking-[0.08em] text-base py-4 h-auto touch-manipulation active:scale-[0.98]">
                        <User className="w-5 h-5 mr-3" />
                        SIGN IN
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clear Data Confirmation Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all local data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear your session data, cached images, and queue history. 
              Your saved outfits and profile will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearAllData} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Clear Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.nav>
  );
};

export default Navbar;
