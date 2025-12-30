-- Fix: Comments on private outfits should only be visible to authorized viewers
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all comments" ON public.outfit_comments;

-- Create policy that respects outfit visibility
-- Users can view comments on:
-- 1. Public outfits (is_public = true)
-- 2. Their own outfits (user_id = auth.uid())
CREATE POLICY "Users can view comments on accessible outfits"
ON public.outfit_comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM saved_outfits
    WHERE saved_outfits.id = outfit_comments.outfit_id
    AND (
      saved_outfits.is_public = true 
      OR saved_outfits.user_id = auth.uid()
    )
  )
);