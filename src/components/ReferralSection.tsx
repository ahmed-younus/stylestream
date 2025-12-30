import { useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Copy, Share2, Users, Coins, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useReferral } from '@/hooks/useReferral';
import { toast } from 'sonner';

const ReferralSection = () => {
  const { stats, loading, getReferralLink, copyReferralLink } = useReferral();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyReferralLink();
    if (success) {
      setCopied(true);
      toast.success('Referral link copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    const link = getReferralLink();
    if (!link) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Try DressMyAI',
          text: 'Try on any outfit virtually with AI! Use my link to get 3 extra free credits.',
          url: link,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-2/3 mt-2" />
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-br from-primary/10 to-primary/5 border-b">
        <CardTitle className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-primary" />
          Invite Friends
        </CardTitle>
        <CardDescription>
          Give 3 credits, get 3 credits when friends sign up
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-muted/50 rounded-lg p-4 text-center"
          >
            <Users className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.totalReferrals}</p>
            <p className="text-xs text-muted-foreground">Friends Invited</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-muted/50 rounded-lg p-4 text-center"
          >
            <Coins className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.totalCreditsEarned}</p>
            <p className="text-xs text-muted-foreground">Credits Earned</p>
          </motion.div>
        </div>

        {/* Referral Code Display */}
        {stats.code && (
          <div className="bg-muted/30 rounded-lg p-4 border border-dashed">
            <p className="text-xs text-muted-foreground mb-2">Your referral code</p>
            <div className="flex items-center gap-3">
              <code className="flex-1 text-lg font-mono font-bold tracking-wider">
                {stats.code}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Share Button */}
        <Button onClick={handleShare} className="w-full" size="lg">
          <Share2 className="w-4 h-4 mr-2" />
          Share Invite Link
        </Button>

        {/* How it works */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium">How it works:</p>
          <ul className="list-disc list-inside space-y-0.5 pl-1">
            <li>Share your unique link with friends</li>
            <li>They get 3 extra credits when they sign up</li>
            <li>You get 3 credits when they join</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReferralSection;
