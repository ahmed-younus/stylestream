-- Create table for saved body images
CREATE TABLE public.user_body_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_body_images ENABLE ROW LEVEL SECURITY;

-- Users can view their own body images
CREATE POLICY "Users can view their own body images"
ON public.user_body_images
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own body images
CREATE POLICY "Users can insert their own body images"
ON public.user_body_images
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own body images
CREATE POLICY "Users can delete their own body images"
ON public.user_body_images
FOR DELETE
USING (auth.uid() = user_id);