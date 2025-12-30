export interface FilterOption {
  id: string;
  label: string;
}

export interface FilterGroup {
  id: string;
  label: string;
  options: FilterOption[];
}

export const occasionFilters: FilterOption[] = [
  { id: "winter-shop", label: "Winter Shop" },
  { id: "christmas-party", label: "Christmas Party Outfits" },
  { id: "loungewear", label: "Modern Loungewear" },
  { id: "occasionwear", label: "Occasionwear" },
  { id: "gorpcore", label: "Gorpcore" },
];

export const designerFilters: FilterOption[] = [
  { id: "a-bathing-ape", label: "A Bathing Ape" },
  { id: "casablanca", label: "Casablanca" },
  { id: "cole-buxton", label: "Cole Buxton" },
  { id: "cp-company", label: "CP Company" },
  { id: "dsquared2", label: "DSquared2" },
  { id: "fendi", label: "Fendi" },
  { id: "represent", label: "Represent" },
  { id: "stone-island", label: "Stone Island" },
];

export const clothingFilters: FilterGroup[] = [
  {
    id: "clothing",
    label: "Clothing",
    options: [
      { id: "t-shirts", label: "T-Shirts" },
      { id: "jackets-coats", label: "Jackets and Coats" },
      { id: "lightweight-jackets", label: "Lightweight Jackets" },
      { id: "hoodies-sweatshirts", label: "Hoodies and Sweatshirts" },
      { id: "knitwear", label: "Knitwear" },
      { id: "shirts", label: "Shirts" },
      { id: "polo-shirts", label: "Polo Shirts" },
      { id: "jeans", label: "Jeans" },
      { id: "trousers", label: "Trousers" },
      { id: "activewear", label: "Activewear" },
      { id: "loungewear", label: "Loungewear" },
      { id: "tracksuits", label: "Tracksuits" },
      { id: "shorts", label: "Shorts" },
      { id: "suits", label: "Suits" },
      { id: "swimwear", label: "Swimwear" },
      { id: "underwear", label: "Underwear" },
      { id: "socks", label: "Socks" },
    ],
  },
];

export const footwearFilters: FilterGroup[] = [
  {
    id: "footwear",
    label: "Shoes",
    options: [
      { id: "trainers", label: "Trainers" },
      { id: "boots", label: "Boots" },
      { id: "loafers", label: "Loafers" },
      { id: "dress-shoes", label: "Dress Shoes" },
      { id: "brogues-oxfords", label: "Brogues and Oxfords" },
      { id: "sliders-flip-flops", label: "Sliders and Flip Flops" },
      { id: "sandals", label: "Sandals" },
      { id: "slippers", label: "Slippers" },
    ],
  },
];

export const bagFilters: FilterGroup[] = [
  {
    id: "bags",
    label: "Bags",
    options: [
      { id: "messenger-bags", label: "Messenger Bags" },
      { id: "backpacks", label: "Backpacks" },
      { id: "belt-bags", label: "Belt Bags" },
      { id: "shoulder-bags", label: "Shoulder Bags" },
      { id: "travel-weekend-bags", label: "Travel and Weekend Bags" },
      { id: "laptop-bags", label: "Laptop Bags and Briefcases" },
      { id: "tote-bags", label: "Tote Bags" },
      { id: "pouches", label: "Pouches" },
      { id: "wash-bags", label: "Wash Bags" },
      { id: "suitcases", label: "Suitcases" },
    ],
  },
];

export const accessoryFilters: FilterGroup[] = [
  {
    id: "accessories",
    label: "Accessories",
    options: [
      { id: "hats-caps", label: "Hats and Caps" },
      { id: "belts", label: "Belts" },
      { id: "gloves-scarves", label: "Gloves and Scarves" },
      { id: "wallets-cardholders", label: "Wallets and Card Holders" },
      { id: "jewellery", label: "Jewellery" },
      { id: "watches", label: "Watches" },
    ],
  },
];

export const retailerFilters: FilterOption[] = [
  { id: "Next", label: "Next" },
  { id: "Marks & Spencer", label: "M&S" },
  { id: "ASOS", label: "ASOS" },
  { id: "Zara", label: "Zara" },
  { id: "H&M", label: "H&M" },
  { id: "River Island", label: "River Island" },
  { id: "Boohoo", label: "Boohoo" },
  { id: "PrettyLittleThing", label: "PLT" },
  { id: "Flannels", label: "Flannels" },
  { id: "Primark", label: "Primark" },
  { id: "SHEIN", label: "SHEIN" },
];

// Map parent categories to their subcategories for filtering
export const categoryParentMap: Record<string, string[]> = {
  "clothing": ["tops", "t-shirts", "shirts", "polo-shirts", "hoodies-sweatshirts", "knitwear", 
               "jackets-coats", "lightweight-jackets", "outerwear", "bottoms", "jeans", 
               "trousers", "shorts", "swimwear", "dresses", "suits", "activewear", 
               "loungewear", "tracksuits", "underwear", "socks"],
  "footwear": ["trainers", "boots", "loafers", "dress-shoes", "brogues-oxfords", 
               "sliders-flip-flops", "sandals", "slippers"],
  "bags": ["messenger-bags", "backpacks", "belt-bags", "shoulder-bags", "travel-weekend-bags",
           "laptop-bags", "tote-bags", "pouches", "wash-bags", "suitcases"],
  "accessories": ["hats-caps", "belts", "gloves-scarves", "wallets-cardholders", "jewellery", "watches"],
};

// Legacy category mapping for backward compatibility
export const legacyCategoryMap: Record<string, string[]> = {
  "tops": ["tops", "t-shirts", "shirts", "polo-shirts", "hoodies-sweatshirts", "knitwear"],
  "outerwear": ["outerwear", "jackets-coats", "lightweight-jackets"],
  "bottoms": ["bottoms", "jeans", "trousers", "shorts"],
  "dresses": ["dresses"],
  "footwear": ["footwear", "trainers", "boots", "loafers", "dress-shoes", "brogues-oxfords", 
               "sliders-flip-flops", "sandals", "slippers"],
  "accessories": ["accessories", "hats-caps", "belts", "gloves-scarves", "wallets-cardholders", 
                  "jewellery", "watches", "bags", "messenger-bags", "backpacks", "belt-bags", 
                  "shoulder-bags", "travel-weekend-bags", "laptop-bags", "tote-bags", "pouches", 
                  "wash-bags", "suitcases"],
};
