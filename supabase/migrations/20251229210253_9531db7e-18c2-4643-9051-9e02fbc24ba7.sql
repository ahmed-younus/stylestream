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