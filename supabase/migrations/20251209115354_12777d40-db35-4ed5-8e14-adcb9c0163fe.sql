-- Add explicit SELECT policy to block all reads from brand_inquiries
-- This ensures contact data can only be accessed via admin dashboard with service role
CREATE POLICY "No one can view brand inquiries via API"
ON public.brand_inquiries
FOR SELECT
USING (false);