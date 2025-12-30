import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface ReferralStats {
  code: string | null;
  totalReferrals: number;
  totalCreditsEarned: number;
}

export const useReferral = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<ReferralStats>({
    code: null,
    totalReferrals: 0,
    totalCreditsEarned: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchReferralData = useCallback(async () => {
    if (!user) {
      setStats({ code: null, totalReferrals: 0, totalCreditsEarned: 0 });
      setLoading(false);
      return;
    }

    try {
      // Fetch user's referral code
      const { data: codeData } = await supabase
        .from('referral_codes')
        .select('code')
        .eq('user_id', user.id)
        .single();

      // Fetch referral stats
      const { data: signups } = await supabase
        .from('referral_signups')
        .select('credits_awarded')
        .eq('referrer_id', user.id);

      const totalReferrals = signups?.length || 0;
      const totalCreditsEarned = signups?.reduce((sum, s) => sum + s.credits_awarded, 0) || 0;

      setStats({
        code: codeData?.code || null,
        totalReferrals,
        totalCreditsEarned,
      });
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchReferralData();
  }, [fetchReferralData]);

  const getReferralLink = useCallback(() => {
    if (!stats.code) return null;
    return `${window.location.origin}/?ref=${stats.code}`;
  }, [stats.code]);

  const copyReferralLink = useCallback(async () => {
    const link = getReferralLink();
    if (link) {
      await navigator.clipboard.writeText(link);
      return true;
    }
    return false;
  }, [getReferralLink]);

  // Validate a referral code (used during signup)
  const validateReferralCode = useCallback(async (code: string): Promise<string | null> => {
    const { data } = await supabase
      .from('referral_codes')
      .select('user_id')
      .eq('code', code.toUpperCase())
      .single();
    
    return data?.user_id || null;
  }, []);

  // Process referral after signup (called from auth flow)
  const processReferral = useCallback(async (referrerId: string, newUserId: string) => {
    try {
      // Record the referral
      const { error: signupError } = await supabase
        .from('referral_signups')
        .insert({
          referrer_id: referrerId,
          referred_user_id: newUserId,
          credits_awarded: 3,
        });

      if (signupError) {
        console.error('Error recording referral:', signupError);
        return false;
      }

      // Award credits to referrer (3 credits)
      const { data: referrerCredits } = await supabase
        .from('user_credits')
        .select('credits')
        .eq('user_id', referrerId)
        .single();

      if (referrerCredits) {
        await supabase
          .from('user_credits')
          .update({ credits: referrerCredits.credits + 3 })
          .eq('user_id', referrerId);

        await supabase
          .from('credit_transactions')
          .insert({
            user_id: referrerId,
            amount: 3,
            transaction_type: 'referral_bonus',
            description: 'Referral bonus - friend signed up',
          });
      }

      // Award credits to new user (3 extra credits on top of welcome bonus)
      const { data: newUserCredits } = await supabase
        .from('user_credits')
        .select('credits')
        .eq('user_id', newUserId)
        .single();

      if (newUserCredits) {
        await supabase
          .from('user_credits')
          .update({ credits: newUserCredits.credits + 3 })
          .eq('user_id', newUserId);

        await supabase
          .from('credit_transactions')
          .insert({
            user_id: newUserId,
            amount: 3,
            transaction_type: 'referral_bonus',
            description: 'Referral bonus - signed up with referral link',
          });
      }

      return true;
    } catch (error) {
      console.error('Error processing referral:', error);
      return false;
    }
  }, []);

  return {
    stats,
    loading,
    getReferralLink,
    copyReferralLink,
    validateReferralCode,
    processReferral,
    refreshStats: fetchReferralData,
  };
};
