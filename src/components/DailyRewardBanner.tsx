import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Flame, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDailyCredits } from '@/hooks/useDailyCredits';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { toast } from 'sonner';

const DailyRewardBanner = () => {
  const { user } = useAuth();
  const { canClaim, currentStreak, nextBonusAt, loading, claiming, claimDailyCredit } = useDailyCredits();
  const [dismissed, setDismissed] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  if (!user || loading || dismissed || !canClaim) {
    return null;
  }

  const handleClaim = async () => {
    const result = await claimDailyCredit();
    if (result.success) {
      setShowCelebration(true);
      if (result.bonusCredits) {
        toast.success(`🎉 ${currentStreak + 1}-day streak! +${1 + result.bonusCredits} credits!`);
      } else {
        toast.success('Daily credit claimed! +1 credit');
      }
      setTimeout(() => {
        setShowCelebration(false);
        setDismissed(true);
      }, 2000);
    }
  };

  const daysUntilBonus = nextBonusAt - currentStreak;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-20 right-4 left-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-50 sm:w-[95%] sm:max-w-md"
      >
        <div className="relative bg-gradient-to-r from-primary/90 to-primary rounded-xl p-4 shadow-lg shadow-primary/20 border border-primary-foreground/10">
          {/* Dismiss button */}
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-2 right-2 text-primary-foreground/60 hover:text-primary-foreground"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-4">
            {/* Icon */}
            <div className="relative">
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                className="w-12 h-12 rounded-full bg-primary-foreground/20 flex items-center justify-center"
              >
                <Gift className="w-6 h-6 text-primary-foreground" />
              </motion.div>
              {currentStreak > 0 && (
                <div className="absolute -bottom-1 -right-1 bg-orange-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <Flame className="w-3 h-3" />
                  {currentStreak}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-primary-foreground font-semibold text-sm">
                Daily Free Credit
              </h3>
              <p className="text-primary-foreground/80 text-xs">
                {currentStreak > 0 
                  ? `${daysUntilBonus} day${daysUntilBonus !== 1 ? 's' : ''} until bonus credits!`
                  : 'Start your streak for bonus credits!'
                }
              </p>
            </div>

            {/* Claim button */}
            <Button
              onClick={handleClaim}
              disabled={claiming}
              size="sm"
              variant="secondary"
              className="shrink-0 font-semibold"
            >
              {claiming ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="w-4 h-4" />
                </motion.div>
              ) : (
                'Claim'
              )}
            </Button>
          </div>

          {/* Celebration overlay */}
          <AnimatePresence>
            {showCelebration && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 bg-primary rounded-xl flex items-center justify-center"
              >
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    className="text-3xl mb-1"
                  >
                    🎁
                  </motion.div>
                  <p className="text-primary-foreground font-bold">Claimed!</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DailyRewardBanner;
