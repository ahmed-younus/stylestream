import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Product, ProductCategory } from "@/types/product";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface WardrobeItem {
  id: string;
  user_id: string;
  product_name: string;
  product_image: string;
  product_price: number | null;
  product_brand: string | null;
  product_url: string | null;
  product_category: string | null;
  created_at: string;
}

// Cache wardrobe items in memory
const wardrobeCache = new Map<string, { items: WardrobeItem[]; timestamp: number }>();
const CACHE_TTL = 120000; // 2 minute cache

export const useWardrobe = () => {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const hasFetched = useRef(false);

  const fetchItems = useCallback(async (forceRefresh = false) => {
    if (!user) {
      setItems([]);
      return;
    }

    // Check cache first
    const cached = wardrobeCache.get(user.id);
    if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setItems(cached.items);
      return;
    }

    setIsLoading(true);
    try {
      const queryPromise = supabase
        .from("wardrobe_items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('timeout')), 5000)
      );

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

      if (error) {
        throw error;
      }
      
      const itemsList = data || [];
      setItems(itemsList);
      wardrobeCache.set(user.id, { items: itemsList, timestamp: Date.now() });
    } catch (error) {
      console.error("Failed to fetch wardrobe items:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Defer initial fetch
  useEffect(() => {
    if (user && !hasFetched.current) {
      hasFetched.current = true;
      const timer = setTimeout(() => fetchItems(), 300);
      return () => clearTimeout(timer);
    }
    if (!user) {
      hasFetched.current = false;
      setItems([]);
    }
  }, [user, fetchItems]);

  const addItem = useCallback(
    async (product: Product) => {
      if (!user) {
        toast.error("Please sign in to save to wardrobe");
        return false;
      }

      // Check if already in wardrobe
      const exists = items.some(
        (item) => item.product_image === product.image || item.product_name === product.name
      );
      if (exists) {
        toast.info("Item already in wardrobe");
        return false;
      }

      // Optimistic update with temp item
      const tempItem: WardrobeItem = {
        id: `temp-${Date.now()}`,
        user_id: user.id,
        product_name: product.name,
        product_image: product.image,
        product_price: product.price || null,
        product_brand: product.brand || null,
        product_url: product.affiliateUrl || null,
        product_category: product.category || null,
        created_at: new Date().toISOString(),
      };
      
      // Immediately show in UI
      setItems(prev => [tempItem, ...prev]);
      toast.success("Added to wardrobe");

      try {
        const { data, error } = await supabase.from("wardrobe_items").insert({
          user_id: user.id,
          product_name: product.name,
          product_image: product.image,
          product_price: product.price || null,
          product_brand: product.brand || null,
          product_url: product.affiliateUrl || null,
          product_category: product.category || null,
        }).select().single();

        if (error) throw error;

        // Replace temp item with real item from DB
        if (data) {
          setItems(prev => {
            const updated = prev.map(i => i.id === tempItem.id ? data : i);
            wardrobeCache.set(user.id, { items: updated, timestamp: Date.now() });
            return updated;
          });
        }
        
        return true;
      } catch (error) {
        console.error("Failed to add to wardrobe:", error);
        // Revert optimistic update
        setItems(prev => prev.filter(i => i.id !== tempItem.id));
        toast.error("Failed to add to wardrobe");
        return false;
      }
    },
    [user, items]
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      if (!user) return false;

      try {
        const { error } = await supabase
          .from("wardrobe_items")
          .delete()
          .eq("id", itemId)
          .eq("user_id", user.id);

        if (error) throw error;

        toast.success("Removed from wardrobe");
        // Optimistic update
        const newItems = items.filter(i => i.id !== itemId);
        setItems(newItems);
        wardrobeCache.set(user.id, { items: newItems, timestamp: Date.now() });
        return true;
      } catch (error) {
        console.error("Failed to remove from wardrobe:", error);
        toast.error("Failed to remove from wardrobe");
        return false;
      }
    },
    [user, items]
  );

  const updateItem = useCallback(
    async (itemId: string, updates: Partial<Pick<WardrobeItem, 'product_name' | 'product_category' | 'product_brand' | 'product_price'>>) => {
      if (!user) {
        toast.error("Please sign in to update wardrobe items");
        return false;
      }

      try {
        const { error } = await supabase
          .from("wardrobe_items")
          .update(updates)
          .eq("id", itemId)
          .eq("user_id", user.id);

        if (error) throw error;

        toast.success("Item updated");
        // Optimistic update
        const newItems = items.map(i => i.id === itemId ? { ...i, ...updates } : i);
        setItems(newItems);
        wardrobeCache.set(user.id, { items: newItems, timestamp: Date.now() });
        return true;
      } catch (error) {
        console.error("Failed to update wardrobe item:", error);
        toast.error("Failed to update item");
        return false;
      }
    },
    [user, items]
  );

  const isInWardrobe = useCallback(
    (productImage: string) => {
      return items.some((item) => item.product_image === productImage);
    },
    [items]
  );

  const wardrobeToProduct = useCallback((item: WardrobeItem): Product => {
    return {
      id: item.id,
      name: item.product_name,
      image: item.product_image,
      price: item.product_price || 0,
      brand: item.product_brand || "",
      retailer: "wardrobe",
      currency: "£",
      category: (item.product_category as ProductCategory) || "tops",
      gender: "unisex",
      description: "From your wardrobe",
      affiliateUrl: item.product_url || "",
    };
  }, []);

  return {
    items,
    isLoading,
    addItem,
    removeItem,
    updateItem,
    isInWardrobe,
    wardrobeToProduct,
    refetch: fetchItems,
  };
};
