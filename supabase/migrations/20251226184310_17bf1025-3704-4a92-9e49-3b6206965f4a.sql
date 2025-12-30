-- Create wardrobe table for saving clothing items
CREATE TABLE public.wardrobe_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  product_image TEXT NOT NULL,
  product_price NUMERIC,
  product_brand TEXT,
  product_url TEXT,
  product_category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.wardrobe_items ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own wardrobe items" 
ON public.wardrobe_items 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their wardrobe" 
ON public.wardrobe_items 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from their wardrobe" 
ON public.wardrobe_items 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add index for faster queries
CREATE INDEX idx_wardrobe_user_id ON public.wardrobe_items(user_id);
CREATE INDEX idx_wardrobe_category ON public.wardrobe_items(product_category);