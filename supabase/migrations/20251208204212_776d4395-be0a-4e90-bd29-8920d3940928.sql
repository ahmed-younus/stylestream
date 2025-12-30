-- Create follows table for friend relationships
CREATE TABLE public.follows (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Create outfit_likes table
CREATE TABLE public.outfit_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  outfit_id uuid NOT NULL REFERENCES public.saved_outfits(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, outfit_id)
);

-- Create outfit_comments table
CREATE TABLE public.outfit_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  outfit_id uuid NOT NULL REFERENCES public.saved_outfits(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add is_public column to saved_outfits (default public)
ALTER TABLE public.saved_outfits ADD COLUMN is_public boolean NOT NULL DEFAULT true;

-- Enable RLS on all tables
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outfit_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outfit_comments ENABLE ROW LEVEL SECURITY;

-- Follows policies
CREATE POLICY "Users can view all follows" ON public.follows
  FOR SELECT USING (true);

CREATE POLICY "Users can follow others" ON public.follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow" ON public.follows
  FOR DELETE USING (auth.uid() = follower_id);

-- Likes policies
CREATE POLICY "Users can view all likes" ON public.outfit_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can like outfits" ON public.outfit_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike" ON public.outfit_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Users can view all comments" ON public.outfit_comments
  FOR SELECT USING (true);

CREATE POLICY "Users can create comments" ON public.outfit_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON public.outfit_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON public.outfit_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Update saved_outfits policies to allow viewing public outfits
DROP POLICY IF EXISTS "Users can view their own outfits" ON public.saved_outfits;

CREATE POLICY "Users can view public outfits or their own" ON public.saved_outfits
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);

-- Add trigger for updated_at on comments
CREATE TRIGGER update_outfit_comments_updated_at
  BEFORE UPDATE ON public.outfit_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();