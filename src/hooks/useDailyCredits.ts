import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCredits } from './useCredits';

interface DailyCreditsState {
  canClaim: boolean;
  currentStreak: number;
  lastClaimDate: string | null;
  nextBonusAt: number; // Streak count for next bonus
}

const STREAK_BONUS_THRESHOLDS = [7, 14, 30]; // Bonus credits at these streaks
const STREAK_BONUS_CREDITS = [2, 3, 5]; // Credits awarded at each threshold

export const useDailyCredits = () => {
  const { user } = useAuth();
  const { refreshCredits } = useCredits();
  const [state, setState] = useState<DailyCreditsState>({
    canClaim: false,
    currentStreak: 0,
    lastClaimDate: null,
    nextBonusAt: 7,
  });
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  const checkDailyStatus = useCallback(async () => {
    if (!user) {
      setState({ canClaim: false, currentStreak: 0, lastClaimDate: null, nextBonusAt: 7 });
      setLoading(false);
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if already claimed today
      const { data: todayClaim } = await supabase
        .from('daily_credits')
        .select('*')
        .eq('user_id', user.id)
        .eq('claimed_date', today)
        .single();

      // Get current streak
      const { data: streakData } = await supabase
        .rpc('get_user_streak', { p_user_id: user.id });

      const currentStreak = (streakData as number) || 0;
      const adjustedStreak = todayClaim ? currentStreak + 1 : currentStreak;

      // Find next bonus threshold
      let nextBonusAt = 7;
      for (const threshold of STREAK_BONUS_THRESHOLDS) {
        if (adjustedStreak < threshold) {
          nextBonusAt = threshold;
          break;
        }
      }

      setState({
        canClaim: !todayClaim,
        currentStreak: adjustedStreak,
        lastClaimDate: todayClaim?.claimed_date || null,
        nextBonusAt,
      });
    } catch (error) {
      console.error('Error checking daily credits:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkDailyStatus();
  }, [checkDailyStatus]);

  const claimDailyCredit = useCallback(async (): Promise<{ success: boolean; bonusCredits?: number }> => {
    if (!user || !state.canClaim || claiming) {
      return { success: false };
    }

    setClaiming(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const newStreak = state.currentStreak + 1;

      // Check for streak bonus
      let bonusCredits = 0;
      const bonusIndex = STREAK_BONUS_THRESHOLDS.indexOf(newStreak);
      if (bonusIndex !== -1) {
        bonusCredits = STREAK_BONUS_CREDITS[bonusIndex];
      }

      const totalCredits = 1 + bonusCredits;

      // Insert daily claim record
      const { error: claimError } = await supabase
        .from('daily_credits')
        .insert({
          user_id: user.id,
          claimed_date: today,
          streak_count: newStreak,
        });

      if (claimError) {
        console.error('Error claiming daily credit:', claimError);
        return { success: false };
      }

      // Update user credits
      const { data: currentCredits } = await supabase
        .from('user_credits')
        .select('credits')
        .eq('user_id', user.id)
        .single();

      if (currentCredits) {
        await supabase
          .from('user_credits')
          .update({ credits: currentCredits.credits + totalCredits })
          .eq('user_id', user.id);
      }

      // Log transaction
      await supabase
        .from('credit_transactions')
        .insert({
          user_id: user.id,
          amount: totalCredits,
          transaction_type: 'daily_bonus',
          description: bonusCredits > 0 
            ? `Daily bonus + ${newStreak}-day streak bonus!` 
            : 'Daily free credit',
        });

      // Refresh credits display
      await refreshCredits();

      // Update local state
      setState(prev => ({
        ...prev,
        canClaim: false,
        currentStreak: newStreak,
        lastClaimDate: today,
      }));

      return { success: true, bonusCredits: bonusCredits > 0 ? bonusCredits : undefined };
    } catch (error) {
      console.error('Error claiming daily credit:', error);
      return { success: false };
    } finally {
      setClaiming(false);
    }
  }, [user, state.canClaim, state.currentStreak, claiming, refreshCredits]);

  return {
    ...state,
    loading,
    claiming,
    claimDailyCredit,
    refreshStatus: checkDailyStatus,
  };
};
