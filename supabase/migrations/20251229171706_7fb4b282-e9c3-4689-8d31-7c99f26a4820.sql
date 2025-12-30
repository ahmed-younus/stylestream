-- Add UPDATE policy for wardrobe_items
CREATE POLICY "Users can update their own wardrobe items"
ON public.wardrobe_items
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);