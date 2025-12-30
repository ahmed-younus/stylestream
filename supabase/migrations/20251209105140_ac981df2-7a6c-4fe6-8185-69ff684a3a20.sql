-- Add gender preference to profiles table
ALTER TABLE public.profiles 
ADD COLUMN gender_preference TEXT CHECK (gender_preference IN ('mens', 'womens'));

-- Add rating columns to saved_outfits table for 5-star ratings
ALTER TABLE public.saved_outfits
ADD COLUMN average_rating NUMERIC(3,2) DEFAULT 0,
ADD COLUMN rating_count INTEGER DEFAULT 0;

-- Create outfit_ratings table for user ratings
CREATE TABLE public.outfit_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  outfit_id UUID NOT NULL REFERENCES public.saved_outfits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(outfit_id, user_id)
);

-- Enable RLS on outfit_ratings
ALTER TABLE public.outfit_ratings ENABLE ROW LEVEL SECURITY;

-- RLS policies for outfit_ratings
CREATE POLICY "Users can rate outfits" 
ON public.outfit_ratings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view all ratings" 
ON public.outfit_ratings 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own rating" 
ON public.outfit_ratings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own rating" 
ON public.outfit_ratings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add 'rating' type to notifications
-- (notifications table already exists with text type column)

-- Create brand_inquiries table for brand contacts
CREATE TABLE public.brand_inquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on brand_inquiries
ALTER TABLE public.brand_inquiries ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert brand inquiries (public form)
CREATE POLICY "Anyone can submit brand inquiry" 
ON public.brand_inquiries 
FOR INSERT 
WITH CHECK (true);