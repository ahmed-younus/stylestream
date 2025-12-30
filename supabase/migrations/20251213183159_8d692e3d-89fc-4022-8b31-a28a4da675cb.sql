-- Create a table for storing user's uploaded product images
CREATE TABLE public.user_product_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  name TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_product_images ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own product images"
ON public.user_product_images
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own product images"
ON public.user_product_images
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own product images"
ON public.user_product_images
FOR DELETE
USING (auth.uid() = user_id);