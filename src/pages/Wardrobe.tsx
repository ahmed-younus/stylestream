import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Shirt, Trash2, ShoppingBag, Filter, X, Search, Grid3X3, LayoutList, Wand2, Sparkles, Loader2, Plus, Heart, Pencil } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWardrobe, WardrobeItem } from "@/hooks/useWardrobe";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Product } from "@/types/product";
import WardrobeUploadDialog from "@/components/WardrobeUploadDialog";
import WardrobeItemEditDialog from "@/components/WardrobeItemEditDialog";

const CATEGORY_GROUPS = [
  { name: "Tops", categories: ["tops", "t-shirts", "shirts", "polo-shirts", "hoodies-sweatshirts", "knitwear"] },
  { name: "Outerwear", categories: ["jackets-coats", "lightweight-jackets", "outerwear"] },
  { name: "Bottoms", categories: ["bottoms", "jeans", "trousers", "shorts", "swimwear", "tracksuits"] },
  { name: "Footwear", categories: ["footwear", "trainers", "boots", "loafers", "dress-shoes", "sandals", "slippers"] },
  { name: "Bags", categories: ["bags", "backpacks", "messenger-bags", "shoulder-bags", "tote-bags"] },
  { name: "Accessories", categories: ["accessories", "hats-caps", "belts", "jewellery", "watches", "gloves-scarves"] },
];

const promptSuggestions = [
  "Smart casual outfit for a dinner date",
  "Streetwear look with Nike trainers",
  "Business meeting outfit under £500",
  "Festival outfit with bold colors",
];

interface GeneratedProduct {
  title: string;
  url: string;
  description: string;
  brand?: string;
  price?: string;
  image?: string;
}

const Wardrobe = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, isLoading, removeItem, wardrobeToProduct, addItem } = useWardrobe();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState("wardrobe");
  
  // Edit dialog state
  const [editItem, setEditItem] = useState<WardrobeItem | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  // Generate outfit state
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedProducts, setGeneratedProducts] = useState<GeneratedProduct[]>([]);
  const [userGender, setUserGender] = useState<string | null>(null);

  // Defer gender fetch to not block initial render
  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => fetchUserGender(), 500);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const fetchUserGender = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("profiles")
        .select("gender_preference")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data?.gender_preference) {
        setUserGender(data.gender_preference);
      }
    } catch (e) {
      // Silent fail - not critical
    }
  };

  const filteredItems = useMemo(() => {
    let filtered = items;
    if (selectedCategory) {
      const group = CATEGORY_GROUPS.find((g) => g.name === selectedCategory);
      if (group) {
        filtered = filtered.filter((item) =>
          group.categories.some((cat) => item.product_category?.includes(cat))
        );
      }
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.product_name.toLowerCase().includes(query) ||
          item.product_brand?.toLowerCase().includes(query)
      );
    }
    return filtered;
  }, [items, selectedCategory, searchQuery]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, WardrobeItem[]> = {};
    filteredItems.forEach((item) => {
      const category = item.product_category || "other";
      const groupName = CATEGORY_GROUPS.find((g) =>
        g.categories.some((cat) => category.includes(cat))
      )?.name || "Other";
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(item);
    });
    return groups;
  }, [filteredItems]);

  const handleTryOn = (item: WardrobeItem) => {
    const product = wardrobeToProduct(item);
    navigate("/studio", { state: { resumeOutfit: { avatarImage: null, products: [product] } } });
  };

  const handleEdit = (item: WardrobeItem) => {
    setEditItem(item);
    setEditDialogOpen(true);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }
    if (!user) {
      toast.error("Please sign in to generate outfits");
      navigate("/auth");
      return;
    }

    setIsGenerating(true);
    setGeneratedProducts([]);

    try {
      const genderContext = userGender ? ` ${userGender === "mens" ? "menswear" : "womenswear"}` : "";
      const { data, error } = await supabase.functions.invoke("ai-shopping-assistant", {
        body: {
          message: `Generate a complete outfit: ${prompt}${genderContext}. Find matching products for all items in this outfit.`,
          conversationHistory: [],
        },
      });

      if (error) throw error;

      if (data.products && data.products.length > 0) {
        setGeneratedProducts(data.products);
        toast.success(`Found ${data.products.length} items for your outfit!`);
      } else {
        toast.info("No exact matches found. Try a different prompt.");
      }
    } catch (error) {
      console.error("Generate error:", error);
      toast.error("Failed to generate outfit. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToWardrobe = async (product: GeneratedProduct) => {
    if (!product.image) {
      toast.error("Product image required");
      return;
    }
    await addItem({
      id: `gen-${Date.now()}`,
      name: product.title,
      image: product.image,
      brand: product.brand || "Unknown",
      price: parseFloat(product.price?.replace(/[^0-9.]/g, "") || "0"),
      currency: "£",
      category: "tops",
      retailer: product.brand || "Unknown",
      gender: "unisex",
      description: "",
      affiliateUrl: product.url,
    });
  };

  const handleTryOnGenerated = (product: GeneratedProduct) => {
    if (!product.image) return;
    const productData: Product = {
      id: `gen-${Date.now()}`,
      name: product.title,
      image: product.image,
      brand: product.brand || "Unknown",
      price: parseFloat(product.price?.replace(/[^0-9.]/g, "") || "0"),
      currency: "£",
      category: "tops",
      retailer: product.brand || "Unknown",
      gender: "unisex",
      description: "",
      affiliateUrl: product.url,
    };
    navigate("/studio", { state: { resumeOutfit: { avatarImage: null, products: [productData] } } });
  };

  if (!user) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <Shirt className="w-16 h-16 text-muted-foreground mb-4" />
          <h1 className="font-display text-2xl mb-2">Your Wardrobe</h1>
          <p className="text-muted-foreground text-center mb-6">
            Sign in to save and manage your favorite clothing items
          </p>
          <Button onClick={() => navigate("/auth")} className="min-h-[44px] px-6">Sign In</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <section className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col gap-4 mb-6">
              <TabsList className="grid w-full grid-cols-2 h-12">
                <TabsTrigger value="wardrobe" className="flex items-center gap-2 min-h-[44px] touch-manipulation">
                  <Shirt className="w-4 h-4" />
                  <span className="hidden sm:inline">My</span> Wardrobe
                </TabsTrigger>
                <TabsTrigger value="generate" className="flex items-center gap-2 min-h-[44px] touch-manipulation">
                  <Wand2 className="w-4 h-4" />
                  Generate
                </TabsTrigger>
              </TabsList>
              
              <div className="flex gap-2">
                <WardrobeUploadDialog
                  trigger={
                    <Button variant="outline" size="sm" className="flex-1 sm:flex-none min-h-[44px] touch-manipulation active:scale-[0.98]">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Item
                    </Button>
                  }
                />
                <Button onClick={() => navigate("/studio")} size="sm" className="flex-1 sm:flex-none min-h-[44px] touch-manipulation active:scale-[0.98]">
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Try-On Studio
                </Button>
              </div>
            </div>

            {/* Wardrobe Tab */}
            <TabsContent value="wardrobe" className="mt-0">
              {/* Search & Filters */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search your wardrobe..."
                    className="w-full pl-10 pr-10 py-3 bg-card border border-border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[44px]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground touch-manipulation"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="flex gap-1 bg-card border border-border rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-3 rounded transition-colors touch-manipulation active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-3 rounded transition-colors touch-manipulation active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center ${viewMode === "list" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
                  >
                    <LayoutList className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Category Filters */}
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-2 mb-6 -mx-4 px-4">
                <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex-shrink-0 min-h-[36px] touch-manipulation active:scale-95 ${
                    selectedCategory === null ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80"
                  }`}
                >
                  All ({items.length})
                </button>
                {CATEGORY_GROUPS.map((group) => (
                  <button
                    key={group.name}
                    onClick={() => setSelectedCategory(group.name === selectedCategory ? null : group.name)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex-shrink-0 min-h-[36px] touch-manipulation active:scale-95 ${
                      selectedCategory === group.name ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80"
                    }`}
                  >
                    {group.name}
                  </button>
                ))}
              </div>

              {/* Loading State */}
              {isLoading && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="aspect-square rounded-lg" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!isLoading && items.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 bg-card border border-border rounded-lg">
                  <Shirt className="w-16 h-16 text-muted-foreground mb-4" />
                  <h2 className="font-display text-xl mb-2">Your wardrobe is empty</h2>
                  <p className="text-muted-foreground text-center mb-6 max-w-md px-4">
                    Add items by uploading images, pasting links, or saving from the Try-On Studio.
                  </p>
                  <WardrobeUploadDialog
                    trigger={
                      <Button className="min-h-[44px] touch-manipulation active:scale-[0.98]">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Item
                      </Button>
                    }
                  />
                </div>
              )}

              {/* Items Grid */}
              {!isLoading && filteredItems.length > 0 && viewMode === "grid" && (
                <div className="space-y-8">
                  {Object.entries(groupedItems).map(([groupName, groupItems]) => (
                    <div key={groupName}>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                        {groupName} ({groupItems.length})
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {groupItems.map((item, idx) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: Math.min(idx * 0.02, 0.1) }}
                            className="group relative bg-card border border-border rounded-lg overflow-hidden"
                          >
                            <div className="relative">
                              <img src={item.product_image} alt={item.product_name} className="w-full aspect-square object-cover" />
                              
                              {/* Desktop hover overlay */}
                              <div className="hidden md:flex absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity items-end p-3">
                                <div className="flex gap-2 w-full">
                                  <Button size="sm" onClick={() => handleTryOn(item)} className="flex-1 h-9 text-xs">
                                    <ShoppingBag className="w-3 h-3 mr-1" />
                                    Try On
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => handleEdit(item)} className="h-9 w-9 p-0">
                                    <Pencil className="w-3 h-3" />
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => removeItem(item.id)} className="h-9 w-9 p-0">
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>

                              {/* Mobile action buttons - always visible */}
                              <div className="absolute top-2 right-2 md:hidden flex gap-1">
                                <button 
                                  onClick={() => handleEdit(item)} 
                                  className="p-2 bg-background/90 rounded-full touch-manipulation active:scale-90 min-w-[36px] min-h-[36px] flex items-center justify-center"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => removeItem(item.id)} 
                                  className="p-2 bg-background/90 rounded-full touch-manipulation active:scale-90 min-w-[36px] min-h-[36px] flex items-center justify-center"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                </button>
                              </div>
                            </div>

                            <div className="p-3">
                              <p className="text-xs font-medium line-clamp-2 mb-1">{item.product_name}</p>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-muted-foreground">{item.product_brand}</span>
                                {item.product_price && <span className="text-xs font-semibold">£{item.product_price}</span>}
                              </div>
                            </div>
                            
                            {/* Mobile Try On button */}
                            <div className="p-3 pt-0 md:hidden">
                              <Button 
                                size="sm" 
                                onClick={() => handleTryOn(item)} 
                                className="w-full min-h-[44px] text-sm touch-manipulation active:scale-[0.98]"
                              >
                                <ShoppingBag className="w-4 h-4 mr-2" />
                                Try On
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Items List */}
              {!isLoading && filteredItems.length > 0 && viewMode === "list" && (
                <div className="space-y-3">
                  {filteredItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 bg-card border border-border rounded-lg p-3">
                      <img src={item.product_image} alt={item.product_name} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm line-clamp-1">{item.product_name}</p>
                        <p className="text-xs text-muted-foreground">{item.product_brand}</p>
                        {item.product_price && <p className="text-sm font-semibold mt-1">£{item.product_price}</p>}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button 
                          size="sm" 
                          onClick={() => handleTryOn(item)} 
                          className="min-h-[44px] min-w-[44px] sm:min-w-0 sm:px-3 text-xs touch-manipulation active:scale-[0.98]"
                        >
                          <ShoppingBag className="w-4 h-4 sm:mr-1" />
                          <span className="hidden sm:inline">Try On</span>
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleEdit(item)} 
                          className="min-h-[44px] min-w-[44px] p-0 touch-manipulation active:scale-[0.98]"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => removeItem(item.id)} 
                          className="min-h-[44px] min-w-[44px] p-0 touch-manipulation active:scale-[0.98]"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Generate Outfit Tab */}
            <TabsContent value="generate" className="mt-0">
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                  <div className="w-14 h-14 border border-border rounded-full flex items-center justify-center mx-auto mb-4">
                    <Wand2 className="w-7 h-7" />
                  </div>
                  <h2 className="font-display text-2xl mb-2 tracking-wide">Generate Outfit</h2>
                  <p className="text-muted-foreground">
                    Describe your ideal outfit and AI will find matching products
                    {userGender && <span className="block text-sm mt-1">Showing {userGender === "mens" ? "menswear" : "womenswear"} results</span>}
                  </p>
                </div>

                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your outfit... e.g., 'Casual streetwear look with oversized hoodie and joggers'"
                  className="min-h-[100px] bg-card border-border text-base mb-4"
                />

                <div className="mb-4">
                  <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Quick suggestions</p>
                  <div className="flex flex-wrap gap-2">
                    {promptSuggestions.map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => setPrompt(suggestion)}
                        className="px-4 py-2 text-sm border border-border hover:border-foreground/50 transition-colors rounded min-h-[40px] touch-manipulation active:scale-[0.98]"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={handleGenerate} 
                  disabled={isGenerating || !prompt.trim()} 
                  className="w-full min-h-[48px] touch-manipulation active:scale-[0.98]" 
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Outfit
                    </>
                  )}
                </Button>

                {/* Generated Products */}
                {generatedProducts.length > 0 && (
                  <div className="mt-8">
                    <h3 className="font-display text-lg mb-4 tracking-wide">Your Generated Outfit</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {generatedProducts.map((product, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.1 }}
                          className="border border-border bg-card rounded-lg overflow-hidden group"
                        >
                          {product.image && (
                            <div className="aspect-square overflow-hidden relative">
                              <img src={product.image} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                              <button
                                onClick={() => handleSaveToWardrobe(product)}
                                className="absolute top-2 right-2 p-2.5 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center touch-manipulation active:scale-90"
                              >
                                <Heart className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                          <div className="p-3">
                            <p className="text-sm font-medium line-clamp-2 mb-1">{product.title}</p>
                            <div className="flex items-center gap-2 mb-3">
                              {product.brand && <span className="text-xs text-muted-foreground">{product.brand}</span>}
                              {product.price && <span className="text-xs font-semibold">{product.price}</span>}
                            </div>
                            <div className="flex gap-2">
                              {product.image && (
                                <Button 
                                  size="sm" 
                                  onClick={() => handleTryOnGenerated(product)} 
                                  className="flex-1 min-h-[40px] text-xs touch-manipulation active:scale-[0.98]"
                                >
                                  <ShoppingBag className="w-3 h-3 mr-1" />
                                  Try On
                                </Button>
                              )}
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => window.open(product.url, "_blank")} 
                                className="flex-1 min-h-[40px] text-xs touch-manipulation active:scale-[0.98]"
                              >
                                View
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {isGenerating && (
                  <div className="mt-8 flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-10 h-10 animate-spin text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Searching fashion retailers...</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">This may take up to 30 seconds</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Edit Dialog */}
      <WardrobeItemEditDialog
        item={editItem}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
    </main>
  );
};

export default Wardrobe;