-- Create storage bucket for outfit images
INSERT INTO storage.buckets (id, name, public)
VALUES ('outfit-images', 'outfit-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to outfit-images bucket
CREATE POLICY "Users can upload outfit images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'outfit-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access to outfit images
CREATE POLICY "Outfit images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'outfit-images');

-- Allow users to delete their own images
CREATE POLICY "Users can delete their outfit images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'outfit-images' AND auth.uid()::text = (storage.foldername(name))[1]);