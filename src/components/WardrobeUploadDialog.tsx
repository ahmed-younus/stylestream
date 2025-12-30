import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Link as LinkIcon, Upload, Loader2, X, Images, Trash2 } from "lucide-react";
import { useWardrobe } from "@/hooks/useWardrobe";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ProductCategory } from "@/types/product";
import { compressImage, blobToFile } from "@/utils/imageCompression";

interface WardrobeUploadDialogProps {
  trigger?: React.ReactNode;
}

interface BulkUploadItem {
  id: string;
  file: File;
  preview: string;
  name: string;
  category: ProductCategory;
  brand: string;
}

// Gender-specific category options
const MENS_CATEGORY_OPTIONS: { value: ProductCategory; label: string }[] = [
  { value: "tops", label: "T-Shirts & Tops" },
  { value: "shirts", label: "Shirts" },
  { value: "hoodies-sweatshirts", label: "Hoodies & Sweatshirts" },
  { value: "knitwear", label: "Knitwear & Jumpers" },
  { value: "jackets-coats", label: "Jackets & Coats" },
  { value: "suits", label: "Suits & Blazers" },
  { value: "bottoms", label: "Trousers" },
  { value: "jeans", label: "Jeans" },
  { value: "shorts", label: "Shorts" },
  { value: "tracksuits", label: "Tracksuits" },
  { value: "swimwear", label: "Swimwear" },
  { value: "footwear", label: "Footwear" },
  { value: "bags", label: "Bags & Backpacks" },
  { value: "hats-caps", label: "Hats & Caps" },
  { value: "gloves-scarves", label: "Gloves & Scarves" },
  { value: "belts", label: "Belts" },
  { value: "watches", label: "Watches" },
  { value: "jewellery", label: "Jewellery" },
  { value: "wallets-cardholders", label: "Wallets" },
  { value: "accessories", label: "Other Accessories" },
];

const WOMENS_CATEGORY_OPTIONS: { value: ProductCategory; label: string }[] = [
  { value: "tops", label: "Tops & Blouses" },
  { value: "dresses", label: "Dresses" },
  { value: "skirts", label: "Skirts" },
  { value: "jumpsuits", label: "Jumpsuits & Playsuits" },
  { value: "hoodies-sweatshirts", label: "Hoodies & Sweatshirts" },
  { value: "knitwear", label: "Knitwear & Cardigans" },
  { value: "jackets-coats", label: "Jackets & Coats" },
  { value: "suits", label: "Blazers & Tailoring" },
  { value: "bottoms", label: "Trousers" },
  { value: "jeans", label: "Jeans" },
  { value: "shorts", label: "Shorts" },
  { value: "activewear", label: "Activewear" },
  { value: "swimwear", label: "Swimwear" },
  { value: "footwear", label: "Footwear" },
  { value: "heels", label: "Heels" },
  { value: "bags", label: "Bags & Handbags" },
  { value: "hats-caps", label: "Hats & Hair Accessories" },
  { value: "gloves-scarves", label: "Gloves & Scarves" },
  { value: "belts", label: "Belts" },
  { value: "watches", label: "Watches" },
  { value: "jewellery", label: "Jewellery" },
  { value: "accessories", label: "Other Accessories" },
];

// Default fallback options
const DEFAULT_CATEGORY_OPTIONS: { value: ProductCategory; label: string }[] = [
  { value: "tops", label: "Tops" },
  { value: "dresses", label: "Dresses" },
  { value: "hoodies-sweatshirts", label: "Hoodies & Sweatshirts" },
  { value: "jackets-coats", label: "Jackets & Coats" },
  { value: "bottoms", label: "Bottoms" },
  { value: "jeans", label: "Jeans" },
  { value: "shorts", label: "Shorts" },
  { value: "footwear", label: "Footwear" },
  { value: "bags", label: "Bags" },
  { value: "hats-caps", label: "Hats & Caps" },
  { value: "gloves-scarves", label: "Gloves & Scarves" },
  { value: "jewellery", label: "Jewellery" },
  { value: "watches", label: "Watches" },
  { value: "accessories", label: "Other Accessories" },
];

const WardrobeUploadDialog = ({ trigger }: WardrobeUploadDialogProps) => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"single" | "bulk" | "link">("single");
  const [isLoading, setIsLoading] = useState(false);
  const [productUrl, setProductUrl] = useState("");
  const [productName, setProductName] = useState("");
  const [productBrand, setProductBrand] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productCategory, setProductCategory] = useState<ProductCategory>("tops");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [genderPreference, setGenderPreference] = useState<string | null>(null);
  
  // Bulk upload state
  const [bulkItems, setBulkItems] = useState<BulkUploadItem[]>([]);
  const [bulkProgress, setBulkProgress] = useState<number>(0);
  
  const { addItem, refetch } = useWardrobe();
  const { user } = useAuth();

  // Fetch user's gender preference
  useEffect(() => {
    const fetchGenderPreference = async () => {
      if (!user) return;
      
      try {
        const { data } = await supabase
          .from('profiles')
          .select('gender_preference')
          .eq('user_id', user.id)
          .single();
        
        if (data?.gender_preference) {
          setGenderPreference(data.gender_preference);
        }
      } catch (err) {
        console.error('Error fetching gender preference:', err);
      }
    };
    
    fetchGenderPreference();
  }, [user]);

  // Get category options based on gender
  const getCategoryOptions = () => {
    if (genderPreference === 'female') {
      return WOMENS_CATEGORY_OPTIONS;
    } else if (genderPreference === 'male') {
      return MENS_CATEGORY_OPTIONS;
    }
    return DEFAULT_CATEGORY_OPTIONS;
  };

  const categoryOptions = getCategoryOptions();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be less than 10MB");
      return;
    }

    try {
      const compressedBlob = await compressImage(file, 1200, 1200, 0.85);
      const compressedFile = blobToFile(compressedBlob, file.name);
      
      setUploadedFile(compressedFile);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
      };
      reader.readAsDataURL(compressedFile);
      
      toast.success(`Compressed: ${(file.size / 1024).toFixed(0)}KB → ${(compressedBlob.size / 1024).toFixed(0)}KB`);
    } catch (error) {
      console.error('Compression failed:', error);
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBulkImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter(f => f.size <= 10 * 1024 * 1024 && f.type.startsWith('image/'));
    
    if (validFiles.length < files.length) {
      toast.warning(`${files.length - validFiles.length} files skipped (too large or not images)`);
    }

    const newItems: BulkUploadItem[] = [];
    
    for (const file of validFiles) {
      try {
        const compressedBlob = await compressImage(file, 1200, 1200, 0.85);
        const compressedFile = blobToFile(compressedBlob, file.name);
        
        const preview = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(compressedFile);
        });

        const baseName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        
        newItems.push({
          id: `bulk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file: compressedFile,
          preview,
          name: baseName || "Unnamed item",
          category: "tops",
          brand: "",
        });
      } catch (error) {
        console.error('Failed to process file:', file.name, error);
      }
    }

    setBulkItems(prev => [...prev, ...newItems]);
    toast.success(`${newItems.length} image${newItems.length > 1 ? 's' : ''} added`);
    
    // Reset input
    e.target.value = '';
  };

  const updateBulkItem = (id: string, updates: Partial<BulkUploadItem>) => {
    setBulkItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const removeBulkItem = (id: string) => {
    setBulkItems(prev => prev.filter(item => item.id !== id));
  };

  const uploadImageToStorage = async (file: File): Promise<string | null> => {
    if (!user) return null;
    
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file);
    
    if (error) {
      console.error('Upload error:', error);
      return null;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(data.path);
    
    return publicUrl;
  };

  const handleLinkSubmit = async () => {
    if (!productUrl.trim()) {
      toast.error("Please enter a product URL");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("crawl-products", {
        body: { url: productUrl },
      });

      if (error) throw error;

      if (data?.product) {
        await addItem({
          id: `upload-${Date.now()}`,
          name: data.product.title || productName || "Unknown Product",
          image: data.product.image || "",
          brand: data.product.brand || productBrand || "Unknown",
          price: data.product.price ? parseFloat(data.product.price.replace(/[^0-9.]/g, '')) : 0,
          currency: "£",
          category: data.product.category || "tops",
          retailer: data.product.brand || "Unknown",
          gender: "unisex",
          description: "",
          affiliateUrl: productUrl,
        });
        toast.success("Product added to wardrobe!");
        resetForm();
        setOpen(false);
      } else {
        toast.error("Couldn't fetch product details. Please add manually.");
        setMode("single");
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      toast.error("Failed to fetch product. Try uploading an image instead.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageSubmit = async () => {
    if (!uploadedFile) {
      toast.error("Please upload a product image");
      return;
    }
    if (!productName.trim()) {
      toast.error("Please enter a product name");
      return;
    }

    setIsLoading(true);
    try {
      const imageUrl = await uploadImageToStorage(uploadedFile);
      if (!imageUrl) {
        toast.error("Failed to upload image");
        setIsLoading(false);
        return;
      }

      await addItem({
        id: `upload-${Date.now()}`,
        name: productName,
        image: imageUrl,
        brand: productBrand || "Unknown",
        price: productPrice ? parseFloat(productPrice) : 0,
        currency: "£",
        category: productCategory,
        retailer: productBrand || "Unknown",
        gender: "unisex",
        description: "",
        affiliateUrl: productUrl || "",
      });
      toast.success("Product added to wardrobe!");
      resetForm();
      setOpen(false);
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error("Failed to add product");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkSubmit = async () => {
    if (bulkItems.length === 0) {
      toast.error("No items to upload");
      return;
    }

    // Validate all items have names
    const missingNames = bulkItems.filter(item => !item.name.trim());
    if (missingNames.length > 0) {
      toast.error("Please name all items before uploading");
      return;
    }

    setIsLoading(true);
    setBulkProgress(0);
    
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < bulkItems.length; i++) {
      const item = bulkItems[i];
      
      try {
        const imageUrl = await uploadImageToStorage(item.file);
        if (!imageUrl) {
          failCount++;
          continue;
        }

        await addItem({
          id: `bulk-${Date.now()}-${i}`,
          name: item.name,
          image: imageUrl,
          brand: item.brand || "Unknown",
          price: 0,
          currency: "£",
          category: item.category,
          retailer: item.brand || "Unknown",
          gender: "unisex",
          description: "",
          affiliateUrl: "",
        });
        successCount++;
      } catch (error) {
        console.error(`Failed to upload item ${item.name}:`, error);
        failCount++;
      }

      setBulkProgress(Math.round(((i + 1) / bulkItems.length) * 100));
    }

    await refetch();
    
    if (successCount > 0) {
      toast.success(`Added ${successCount} item${successCount > 1 ? 's' : ''} to wardrobe!`);
    }
    if (failCount > 0) {
      toast.error(`Failed to add ${failCount} item${failCount > 1 ? 's' : ''}`);
    }
    
    resetForm();
    setOpen(false);
  };

  const resetForm = () => {
    setProductUrl("");
    setProductName("");
    setProductBrand("");
    setProductPrice("");
    setProductCategory("tops");
    setUploadedImage(null);
    setUploadedFile(null);
    setBulkItems([]);
    setBulkProgress(0);
    setMode("single");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display tracking-wide">Add to Wardrobe</DialogTitle>
        </DialogHeader>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={mode === "single" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("single")}
            className="flex-1"
          >
            <Upload className="w-4 h-4 mr-2" />
            Single
          </Button>
          <Button
            variant={mode === "bulk" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("bulk")}
            className="flex-1"
          >
            <Images className="w-4 h-4 mr-2" />
            Bulk
          </Button>
          <Button
            variant={mode === "link" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("link")}
            className="flex-1"
          >
            <LinkIcon className="w-4 h-4 mr-2" />
            Link
          </Button>
        </div>

        {/* Link Mode */}
        {mode === "link" && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="product-url">Product URL</Label>
              <Input
                id="product-url"
                value={productUrl}
                onChange={(e) => setProductUrl(e.target.value)}
                placeholder="https://www.asos.com/product/..."
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Paste a link from any fashion retailer
              </p>
            </div>
            <Button
              onClick={handleLinkSubmit}
              disabled={isLoading || !productUrl.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Fetching...
                </>
              ) : (
                "Add to Wardrobe"
              )}
            </Button>
          </div>
        )}

        {/* Single Image Mode */}
        {mode === "single" && (
          <div className="space-y-4">
            <div>
              <Label>Product Image</Label>
              {uploadedImage ? (
                <div className="relative mt-2">
                  <img
                    src={uploadedImage}
                    alt="Product"
                    className="w-full aspect-square object-cover rounded-lg border border-border"
                  />
                  <button
                    onClick={() => { setUploadedImage(null); setUploadedFile(null); }}
                    className="absolute top-2 right-2 p-1.5 bg-background/90 rounded-full hover:bg-background"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="mt-2 flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-foreground/50 transition-colors">
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Click to upload</span>
                  <span className="text-xs text-muted-foreground mt-1">Auto-compressed</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <div>
              <Label htmlFor="product-name">Product Name *</Label>
              <Input
                id="product-name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g., Nike Air Max 90"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="product-category">Category *</Label>
              <Select value={productCategory} onValueChange={(v) => setProductCategory(v as ProductCategory)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {categoryOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="product-brand">Brand</Label>
                <Input
                  id="product-brand"
                  value={productBrand}
                  onChange={(e) => setProductBrand(e.target.value)}
                  placeholder="e.g., Nike"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="product-price">Price (£)</Label>
                <Input
                  id="product-price"
                  type="number"
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                  placeholder="99.99"
                  className="mt-1"
                />
              </div>
            </div>

            <Button
              onClick={handleImageSubmit}
              disabled={isLoading || !uploadedImage || !productName.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                "Add to Wardrobe"
              )}
            </Button>
          </div>
        )}

        {/* Bulk Upload Mode */}
        {mode === "bulk" && (
          <div className="space-y-4">
            {/* Upload Area */}
            <label className="flex flex-col items-center justify-center w-full py-8 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-foreground/50 transition-colors">
              <Images className="w-10 h-10 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">Click to select multiple images</span>
              <span className="text-xs text-muted-foreground mt-1">or drag and drop</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleBulkImageUpload}
                className="hidden"
              />
            </label>

            {/* Bulk Items List */}
            {bulkItems.length > 0 && (
              <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{bulkItems.length} item{bulkItems.length > 1 ? 's' : ''}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setBulkItems([])}
                    className="text-destructive hover:text-destructive"
                  >
                    Clear All
                  </Button>
                </div>
                
                {bulkItems.map((item) => (
                  <div key={item.id} className="flex gap-3 p-2 bg-muted/50 rounded-lg">
                    <img 
                      src={item.preview} 
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0 space-y-2">
                      <Input
                        value={item.name}
                        onChange={(e) => updateBulkItem(item.id, { name: e.target.value })}
                        placeholder="Item name"
                        className="h-8 text-sm"
                      />
                      <div className="flex gap-2">
                        <Select 
                          value={item.category} 
                          onValueChange={(v) => updateBulkItem(item.id, { category: v as ProductCategory })}
                        >
                          <SelectTrigger className="h-8 text-xs flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover">
                            {categoryOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeBulkItem(item.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Progress */}
            {isLoading && bulkProgress > 0 && (
              <div className="space-y-2">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${bulkProgress}%` }}
                  />
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  Uploading... {bulkProgress}%
                </p>
              </div>
            )}

            <Button
              onClick={handleBulkSubmit}
              disabled={isLoading || bulkItems.length === 0}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Uploading {bulkItems.length} items...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Add {bulkItems.length || ""} Item{bulkItems.length !== 1 ? 's' : ''} to Wardrobe
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WardrobeUploadDialog;
