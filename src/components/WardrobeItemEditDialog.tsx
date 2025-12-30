import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { WardrobeItem, useWardrobe } from "@/hooks/useWardrobe";
import { ProductCategory } from "@/types/product";

interface WardrobeItemEditDialogProps {
  item: WardrobeItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORY_OPTIONS: { value: ProductCategory; label: string }[] = [
  { value: "tops", label: "Tops" },
  { value: "hoodies-sweatshirts", label: "Hoodies & Sweatshirts" },
  { value: "jackets-coats", label: "Jackets & Coats" },
  { value: "bottoms", label: "Bottoms" },
  { value: "jeans", label: "Jeans" },
  { value: "shorts", label: "Shorts" },
  { value: "footwear", label: "Footwear" },
  { value: "bags", label: "Bags" },
  { value: "accessories", label: "Accessories" },
];

const WardrobeItemEditDialog = ({ item, open, onOpenChange }: WardrobeItemEditDialogProps) => {
  const { updateItem } = useWardrobe();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(item?.product_name || "");
  const [brand, setBrand] = useState(item?.product_brand || "");
  const [price, setPrice] = useState(item?.product_price?.toString() || "");
  const [category, setCategory] = useState<ProductCategory>(
    (item?.product_category as ProductCategory) || "tops"
  );

  // Reset form when item changes
  if (item && name !== item.product_name && !isLoading) {
    setName(item.product_name);
    setBrand(item.product_brand || "");
    setPrice(item.product_price?.toString() || "");
    setCategory((item.product_category as ProductCategory) || "tops");
  }

  const handleSubmit = async () => {
    if (!item || !name.trim()) return;

    setIsLoading(true);
    const success = await updateItem(item.id, {
      product_name: name.trim(),
      product_brand: brand.trim() || null,
      product_price: price ? parseFloat(price) : null,
      product_category: category,
    });

    setIsLoading(false);
    if (success) {
      onOpenChange(false);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display tracking-wide">Edit Item</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview image */}
          <div className="w-24 h-24 mx-auto rounded-lg overflow-hidden border border-border">
            <img
              src={item.product_image}
              alt={item.product_name}
              className="w-full h-full object-cover"
            />
          </div>

          <div>
            <Label htmlFor="edit-name">Product Name *</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Nike Air Max 90"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="edit-category">Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as ProductCategory)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {CATEGORY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-brand">Brand</Label>
              <Input
                id="edit-brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g., Nike"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-price">Price (£)</Label>
              <Input
                id="edit-price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="99.99"
                className="mt-1"
              />
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isLoading || !name.trim()}
            className="w-full min-h-[44px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WardrobeItemEditDialog;