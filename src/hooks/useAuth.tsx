import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session with timeout protection
    const checkSession = async () => {
      try {
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('timeout')), 5000)
        );
        
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;
        setSession(session);
        setUser(session?.user ?? null);
      } catch (err) {
        console.warn('Session check timed out, continuing without session');
        // Don't block the app - user can still use it
      } finally {
        setLoading(false);
      }
    };
    
    checkSession();

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const signUpPromise = supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            display_name: displayName
          }
        }
      });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Signup timed out. Please try again.')), 10000)
      );
      
      const { error } = await Promise.race([signUpPromise, timeoutPromise]) as any;
      return { error };
    } catch (err: any) {
      return { error: new Error(err.message || 'Signup failed. Please check your connection.') };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const signInPromise = supabase.auth.signInWithPassword({
        email,
        password
      });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Login timed out. Please try again.')), 10000)
      );
      
      const { error } = await Promise.race([signInPromise, timeoutPromise]) as any;
      return { error };
    } catch (err: any) {
      return { error: new Error(err.message || 'Login failed. Please check your connection.') };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
