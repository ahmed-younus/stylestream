-- Add UPDATE policy for saved_outfits table
CREATE POLICY "Users can update their own outfits"
ON public.saved_outfits
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);