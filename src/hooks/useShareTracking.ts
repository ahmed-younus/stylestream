import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

type SharePlatform = 'copy' | 'twitter' | 'facebook' | 'whatsapp' | 'native' | 'download';

export const useShareTracking = () => {
  const { user } = useAuth();

  const trackShare = useCallback(async (platform: SharePlatform, outfitId?: string) => {
    try {
      await supabase
        .from('share_events')
        .insert({
          user_id: user?.id || null,
          outfit_id: outfitId || null,
          platform,
        });
    } catch (error) {
      // Silently fail - don't interrupt user experience for analytics
      console.error('Error tracking share:', error);
    }
  }, [user]);

  return { trackShare };
};
