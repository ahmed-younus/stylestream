export type ProductCategory = 
  // Clothing
  | 'tops' | 't-shirts' | 'shirts' | 'polo-shirts' | 'hoodies-sweatshirts' | 'knitwear'
  | 'jackets-coats' | 'lightweight-jackets' | 'outerwear'
  | 'bottoms' | 'jeans' | 'trousers' | 'shorts' | 'swimwear'
  | 'dresses' | 'skirts' | 'jumpsuits' | 'suits' | 'activewear' | 'loungewear' | 'tracksuits'
  | 'underwear' | 'socks'
  // Footwear
  | 'footwear' | 'trainers' | 'boots' | 'loafers' | 'dress-shoes' | 'brogues-oxfords'
  | 'sliders-flip-flops' | 'sandals' | 'slippers' | 'heels'
  // Bags
  | 'bags' | 'messenger-bags' | 'backpacks' | 'belt-bags' | 'shoulder-bags'
  | 'travel-weekend-bags' | 'laptop-bags' | 'tote-bags' | 'pouches' | 'wash-bags' | 'suitcases'
  // Accessories
  | 'accessories' | 'hats-caps' | 'belts' | 'gloves-scarves' | 'wallets-cardholders'
  | 'jewellery' | 'watches';

export type ProductOccasion = 
  | 'winter-shop' | 'christmas-party' | 'loungewear' | 'occasionwear' | 'gorpcore';

export type DesignerBrand =
  | 'a-bathing-ape' | 'casablanca' | 'cole-buxton' | 'cp-company' | 'dsquared2'
  | 'fendi' | 'represent' | 'stone-island' | 'allsaints' | 'ralph-lauren'
  | 'ted-baker' | 'levis' | 'schott-nyc';

export interface Product {
  id: string;
  name: string;
  brand: string;
  retailer: string;
  price: number;
  currency: string;
  image: string;
  imageBase64?: string; // Pre-cached base64 image to bypass retailer blocking
  category: ProductCategory;
  subcategory?: ProductCategory;
  occasion?: ProductOccasion[];
  gender: 'mens' | 'womens' | 'unisex';
  description: string;
  affiliateUrl: string;
}

export interface TryOnResult {
  originalImage: string;
  tryOnImage: string;
  product: Product;
}
