-- ================================================
-- COMPLETE DATABASE MIGRATION FOR STYLEDREAM
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/hnzolqfobfelcyfvjghz/sql
-- ================================================

-- ============================================
-- MIGRATION 1: Basic Tables (profiles, saved_outfits)
-- ============================================

-- Create saved_outfits table
CREATE TABLE public.saved_outfits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  try_on_image TEXT NOT NULL,
  avatar_image TEXT NOT NULL,
  products JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_outfits ENABLE ROW LEVEL SECURITY;

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles are viewable by owner
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'display_name');
  RETURN new;
END;
$$;

-- Trigger for auto-creating profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for profile timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- MIGRATION 2: Social Features (follows, likes, comments)
-- ============================================

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

-- Add is_public and caption columns to saved_outfits
ALTER TABLE public.saved_outfits ADD COLUMN is_public boolean NOT NULL DEFAULT true;
ALTER TABLE public.saved_outfits ADD COLUMN caption text;

-- Enable RLS on all tables
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outfit_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outfit_comments ENABLE ROW LEVEL SECURITY;

-- Follows policies (restricted)
CREATE POLICY "Users can view their own follow relationships"
ON public.follows
FOR SELECT
USING (
  auth.uid() = follower_id
  OR auth.uid() = following_id
);

CREATE POLICY "Users can follow others" ON public.follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow" ON public.follows
  FOR DELETE USING (auth.uid() = follower_id);

-- Likes policies (restricted)
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

CREATE POLICY "Users can like outfits" ON public.outfit_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike" ON public.outfit_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Comments policies (restricted)
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

CREATE POLICY "Users can create comments" ON public.outfit_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON public.outfit_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON public.outfit_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Saved outfits policies
CREATE POLICY "Users can view public outfits or their own" ON public.saved_outfits
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can create their own outfits"
ON public.saved_outfits
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own outfits"
ON public.saved_outfits
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own outfits"
ON public.saved_outfits
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at on comments
CREATE TRIGGER update_outfit_comments_updated_at
  BEFORE UPDATE ON public.outfit_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- MIGRATION 3: Notifications
-- ============================================

-- Create notifications table
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'rating')),
  outfit_id uuid REFERENCES public.saved_outfits(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES public.outfit_comments(id) ON DELETE CASCADE,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete their own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ============================================
-- MIGRATION 4: Storage Buckets
-- ============================================

-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create outfit-images storage bucket
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

-- ============================================
-- MIGRATION 5: User Body Images
-- ============================================

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

-- ============================================
-- MIGRATION 6: Profile Body Measurements
-- ============================================

-- Add body measurement fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN height_cm INTEGER,
ADD COLUMN trainer_size TEXT,
ADD COLUMN neck_cm DECIMAL(4,1),
ADD COLUMN wrist_cm DECIMAL(4,1),
ADD COLUMN pants_length_cm INTEGER,
ADD COLUMN chest_cm INTEGER,
ADD COLUMN waist_cm INTEGER,
ADD COLUMN hip_cm INTEGER,
ADD COLUMN inseam_cm INTEGER,
ADD COLUMN shoulder_cm INTEGER;

-- ============================================
-- MIGRATION 7: Gender, Ratings, Brand Inquiries
-- ============================================

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

CREATE POLICY "Users can update their own rating"
ON public.outfit_ratings
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own rating"
ON public.outfit_ratings
FOR DELETE
USING (auth.uid() = user_id);

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

-- Block all reads from brand_inquiries (admin only via service role)
CREATE POLICY "No one can view brand inquiries via API"
ON public.brand_inquiries
FOR SELECT
USING (false);

-- ============================================
-- MIGRATION 8: Favorite Brands
-- ============================================

ALTER TABLE public.profiles ADD COLUMN favorite_brands text[] DEFAULT '{}'::text[];

-- ============================================
-- MIGRATION 9: User Product Images
-- ============================================

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

-- ============================================
-- MIGRATION 10: Wardrobe Items
-- ============================================

-- Create wardrobe table for saving clothing items
CREATE TABLE public.wardrobe_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  product_image TEXT NOT NULL,
  product_price NUMERIC,
  product_brand TEXT,
  product_url TEXT,
  product_category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.wardrobe_items ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own wardrobe items"
ON public.wardrobe_items
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their wardrobe"
ON public.wardrobe_items
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from their wardrobe"
ON public.wardrobe_items
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own wardrobe items"
ON public.wardrobe_items
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add index for faster queries
CREATE INDEX idx_wardrobe_user_id ON public.wardrobe_items(user_id);
CREATE INDEX idx_wardrobe_category ON public.wardrobe_items(product_category);

-- ============================================
-- MIGRATION 11: Credits System
-- ============================================

-- Create user_credits table to track credit balances
CREATE TABLE public.user_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  credits INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- Users can view their own credits
CREATE POLICY "Users can view their own credits"
ON public.user_credits
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own credits (for deductions)
CREATE POLICY "Users can update their own credits"
ON public.user_credits
FOR UPDATE
USING (auth.uid() = user_id);

-- System can insert credits for new users
CREATE POLICY "System can insert credits"
ON public.user_credits
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create trigger to update updated_at
CREATE TRIGGER update_user_credits_updated_at
BEFORE UPDATE ON public.user_credits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create credit_transactions table for history/auditing
CREATE TABLE public.credit_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL,
  description TEXT,
  stripe_session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view their own transactions"
ON public.credit_transactions
FOR SELECT
USING (auth.uid() = user_id);

-- System can insert transactions
CREATE POLICY "System can insert transactions"
ON public.credit_transactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create function to initialize credits for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_credits (user_id, credits)
  VALUES (NEW.id, 5)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.credit_transactions (user_id, amount, transaction_type, description)
  VALUES (NEW.id, 5, 'welcome_bonus', 'Welcome bonus - 5 free credits');

  RETURN NEW;
END;
$$;

-- Create trigger for new user signups
CREATE TRIGGER on_auth_user_created_credits
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_credits();

-- Enable realtime for user_credits table
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_credits;

-- ============================================
-- MIGRATION 12: Referral System
-- ============================================

-- Create referral_codes table for user referral links
CREATE TABLE public.referral_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create referral_signups table to track successful referrals
CREATE TABLE public.referral_signups (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id uuid NOT NULL,
  referred_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credits_awarded integer NOT NULL DEFAULT 3,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(referred_user_id)
);

-- Create daily_credits table to track daily free credit claims
CREATE TABLE public.daily_credits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  claimed_date date NOT NULL DEFAULT CURRENT_DATE,
  streak_count integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, claimed_date)
);

-- Create share_events table for analytics
CREATE TABLE public.share_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  outfit_id uuid REFERENCES saved_outfits(id) ON DELETE SET NULL,
  platform text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create signup_analytics table
CREATE TABLE public.signup_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code text,
  source text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signup_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referral_codes
CREATE POLICY "Users can view their own referral code"
ON public.referral_codes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own referral code"
ON public.referral_codes FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Anyone can look up a referral code (for signup validation)
CREATE POLICY "Anyone can validate referral codes"
ON public.referral_codes FOR SELECT
USING (true);

-- RLS Policies for referral_signups
CREATE POLICY "Users can view their referral stats"
ON public.referral_signups FOR SELECT
USING (auth.uid() = referrer_id);

CREATE POLICY "System can insert referral signups"
ON public.referral_signups FOR INSERT
WITH CHECK (true);

-- RLS Policies for daily_credits
CREATE POLICY "Users can view their daily credits"
ON public.daily_credits FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can claim daily credits"
ON public.daily_credits FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for share_events
CREATE POLICY "Users can log share events"
ON public.share_events FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view their share events"
ON public.share_events FOR SELECT
USING (auth.uid() = user_id);

-- RLS Policies for signup_analytics
CREATE POLICY "System can insert signup analytics"
ON public.signup_analytics FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_code text;
BEGIN
  -- Generate a unique 8-character code
  new_code := upper(substring(md5(NEW.id::text || now()::text) from 1 for 8));

  INSERT INTO public.referral_codes (user_id, code)
  VALUES (NEW.id, new_code)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Trigger to auto-create referral code on user signup
CREATE TRIGGER on_auth_user_created_referral
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.generate_referral_code();

-- Function to get user's current streak
CREATE OR REPLACE FUNCTION public.get_user_streak(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_streak integer := 0;
  check_date date := CURRENT_DATE - 1;
BEGIN
  -- Check consecutive days backwards from yesterday
  LOOP
    IF EXISTS (
      SELECT 1 FROM daily_credits
      WHERE user_id = p_user_id AND claimed_date = check_date
    ) THEN
      current_streak := current_streak + 1;
      check_date := check_date - 1;
    ELSE
      EXIT;
    END IF;
  END LOOP;

  RETURN current_streak;
END;
$$;

-- ============================================
-- DONE! All migrations applied successfully.
-- ============================================
