-- Fix 1: outfit_ratings - Users should only see ratings for outfits they can access
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all ratings" ON public.outfit_ratings;

-- Create policy that respects outfit visibility and hides other users' identities
-- Users can view ratings on public outfits or their own outfits
CREATE POLICY "Users can view ratings on accessible outfits"
ON public.outfit_ratings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM saved_outfits
    WHERE saved_outfits.id = outfit_ratings.outfit_id
    AND (
      saved_outfits.is_public = true 
      OR saved_outfits.user_id = auth.uid()
    )
  )
);

-- Fix 2: outfit_likes - Users should only see likes for outfits they can access
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all likes" ON public.outfit_likes;

-- Create policy that respects outfit visibility
CREATE POLICY "Users can view likes on accessible outfits"
ON public.outfit_likes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM saved_outfits
    WHERE saved_outfits.id = outfit_likes.outfit_id
    AND (
      saved_outfits.is_public = true 
      OR saved_outfits.user_id = auth.uid()
    )
  )
);

-- Fix 3: follows - Users should only see their own follows/followers
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all follows" ON public.follows;

-- Create policy that restricts to own relationships
-- Users can see follows where they are either the follower or being followed
CREATE POLICY "Users can view their own follow relationships"
ON public.follows
FOR SELECT
USING (
  auth.uid() = follower_id 
  OR auth.uid() = following_id
);