import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface CreditsContextType {
  credits: number;
  loading: boolean;
  refreshCredits: () => Promise<void>;
  deductCredit: () => Promise<boolean>;
  hasCredits: boolean;
}

const CreditsContext = createContext<CreditsContextType | null>(null);

// Cache credits in memory
const creditsCache = new Map<string, { credits: number; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute cache

export const CreditsProvider = ({ children }: { children: ReactNode }) => {
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const hasFetched = useRef(false);

  const refreshCredits = useCallback(async () => {
    if (!user) {
      setCredits(0);
      setLoading(false);
      return;
    }

    // Check cache first
    const cached = creditsCache.get(user.id);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setCredits(cached.credits);
      setLoading(false);
      return;
    }

    try {
      // Race against timeout
      const queryPromise = supabase
        .from('user_credits')
        .select('credits')
        .eq('user_id', user.id)
        .maybeSingle();
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('timeout')), 5000)
      );

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

      if (error) {
        console.error("Error fetching credits:", error);
        return;
      }

      if (data) {
        setCredits(data.credits);
        creditsCache.set(user.id, { credits: data.credits, timestamp: Date.now() });
      } else {
        // User doesn't have credits record yet - create with 5 free credits
        const { data: newCredits, error: insertError } = await supabase
          .from('user_credits')
          .insert({ user_id: user.id, credits: 5 })
          .select('credits')
          .single();

        if (!insertError && newCredits) {
          setCredits(newCredits.credits);
          creditsCache.set(user.id, { credits: newCredits.credits, timestamp: Date.now() });
          
          // Add transaction record in background
          supabase.from('credit_transactions').insert({
            user_id: user.id,
            amount: 5,
            transaction_type: 'welcome_bonus',
            description: 'Welcome bonus - 5 free credits'
          }).then(() => {});
        }
      }
    } catch (err) {
      console.error("Credits fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const deductCredit = useCallback(async (): Promise<boolean> => {
    if (!user || credits < 1) {
      return false;
    }

    // Optimistic update
    setCredits(prev => prev - 1);
    creditsCache.set(user.id, { credits: credits - 1, timestamp: Date.now() });

    try {
      const { error } = await supabase
        .from('user_credits')
        .update({ credits: credits - 1 })
        .eq('user_id', user.id);

      if (error) {
        // Revert optimistic update
        setCredits(credits);
        creditsCache.set(user.id, { credits, timestamp: Date.now() });
        console.error("Error deducting credit:", error);
        return false;
      }

      // Log transaction in background (non-blocking)
      supabase.from('credit_transactions').insert({
        user_id: user.id,
        amount: -1,
        transaction_type: 'generation',
        description: 'Outfit try-on generation'
      }).then(() => {});

      return true;
    } catch (err) {
      setCredits(credits);
      console.error("Deduct credit error:", err);
      return false;
    }
  }, [user, credits]);

  // Defer initial fetch
  useEffect(() => {
    if (user && !hasFetched.current) {
      hasFetched.current = true;
      const timer = setTimeout(refreshCredits, 200);
      return () => clearTimeout(timer);
    }
    if (!user) {
      hasFetched.current = false;
      setCredits(0);
    }
  }, [user, refreshCredits]);

  // Subscribe to realtime updates (deferred)
  useEffect(() => {
    if (!user) return;

    const timer = setTimeout(() => {
      const channel = supabase
        .channel('user_credits_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_credits',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            if (payload.new && 'credits' in payload.new) {
              const newCredits = payload.new.credits as number;
              setCredits(newCredits);
              creditsCache.set(user.id, { credits: newCredits, timestamp: Date.now() });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }, 1000);

    return () => clearTimeout(timer);
  }, [user]);

  return (
    <CreditsContext.Provider value={{
      credits,
      loading,
      refreshCredits,
      deductCredit,
      hasCredits: credits > 0,
    }}>
      {children}
    </CreditsContext.Provider>
  );
};

export const useCredits = () => {
  const context = useContext(CreditsContext);
  if (!context) {
    throw new Error("useCredits must be used within a CreditsProvider");
  }
  return context;
};
