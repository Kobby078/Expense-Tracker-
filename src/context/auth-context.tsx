import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

type AuthResult = {
  error: string | null;
  notice?: string | null;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  isAuthLoading: boolean;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<AuthResult>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

function mapAuthError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('invalid login credentials')) {
    return 'Incorrect email or password.';
  }

  if (lower.includes('user already registered')) {
    return 'An account with this email already exists. Try signing in.';
  }

  if (lower.includes('password') && lower.includes('least')) {
    return 'Password must be at least 6 characters.';
  }

  if (lower.includes('unable to validate email') || lower.includes('invalid email')) {
    return 'Enter a valid email address.';
  }

  if (lower.includes('network') || lower.includes('fetch')) {
    return 'Network error. Check your connection and try again.';
  }

  return message;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) {
        return;
      }

      if (error) {
        setSession(null);
        setUser(null);
      } else {
        setSession(data.session);
        setUser(data.session?.user ?? null);
      }

      setIsAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setIsAuthLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signUp(email: string, password: string): Promise<AuthResult> {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (error) {
      return { error: mapAuthError(error.message) };
    }

    if (data.user && !data.session) {
      return {
        error: null,
        notice: 'Check your email to confirm your account, then sign in.',
      };
    }

    return { error: null };
  }

  async function signIn(email: string, password: string): Promise<AuthResult> {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      return { error: mapAuthError(error.message) };
    }

    return { error: null };
  }

  async function signOut(): Promise<AuthResult> {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { error: mapAuthError(error.message) };
    }

    return { error: null };
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        isAuthLoading,
        signUp,
        signIn,
        signOut,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === null) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
