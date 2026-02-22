 // src/contexts/AuthContext.tsx
    import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
    import { User, AuthError, Session } from '@supabase/supabase-js';
    import { supabase } from '../lib/supabase';
    import type { Database } from '../lib/database.types';

    type UserProfile = Database['public']['Tables']['users']['Row'];

    interface AuthContextType {
      user: User | null;
      session: Session | null;
      profile: UserProfile | null;
      loading: boolean;
      signUp: (email: string, password: string, displayName?: string) => Promise<{ error: AuthError | null; user: User | null }>;
      signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
      signOut: () => Promise<void>;
      resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
      refreshProfile: () => Promise<void>;
    }

    const AuthContext = createContext<AuthContextType | undefined>(undefined);

    function defaultDisplayName(u: User) {
      const meta = (u.user_metadata || {}) as any;
      const v = (meta.display_name || meta.name || '').toString().trim();
      if (v) return v;
      const email = (u.email || '').trim();
      if (email) return email.split('@')[0];
      return 'user';
    }

    export function AuthProvider({ children }: { children: ReactNode }) {
      const [user, setUser] = useState<User | null>(null);
      const [session, setSession] = useState<Session | null>(null);
      const [profile, setProfile] = useState<UserProfile | null>(null);
      const [loading, setLoading] = useState(true);

      const ensureProfile = async (u: User): Promise<UserProfile | null> => {
        if (!u?.id) return null;

        try {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', u.id)
            .maybeSingle();

          if (error) {
            console.error('[AuthContext] Error fetching profile:', error.message);
            return null;
          }

          if (data) {
            setProfile(data);
            return data;
          }

          const payload = {
            id: u.id,
            email: u.email,
            display_name: defaultDisplayName(u),
          };

          const { data: created, error: cerr } = await supabase
            .from('users')
            .upsert(payload, { onConflict: 'id' })
            .select('*')
            .maybeSingle();

          if (cerr) {
            console.error('[AuthContext] Failed to create profile:', cerr.message);
            setProfile(null);
            return null;
          }

          if (created) {
            setProfile(created);
            return created;
          }

          setProfile(null);
          return null;
        } catch (err) {
          console.error('[AuthContext] ensureProfile error:', err);
          setProfile(null);
          return null;
        }
      };

      // プロファイル取得を user 変更時に別途実行
      useEffect(() => {
        if (user) {
          ensureProfile(user);
        } else {
          setProfile(null);
        }
      }, [user?.id]);

      useEffect(() => {
        let isMounted = true;

        const initializeAuth = async () => {
          try {
            const { data: { session: currentSession } } = await supabase.auth.getSession();

            if (!isMounted) return;

            if (currentSession?.user) {
              setUser(currentSession.user);
              setSession(currentSession);
            } else {
              setUser(null);
              setSession(null);
              setProfile(null);
            }
          } catch (error) {
            console.error('[AuthContext] Error initializing auth:', error);
          } finally {
            if (isMounted) {
              setLoading(false);
            }
          }
        };

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
          if (!isMounted) return;

          // 同期的に user/session を更新し、loading を false にする
          if (currentSession?.user) {
            setUser(currentSession.user);
            setSession(currentSession);
          } else {
            setUser(null);
            setSession(null);
            setProfile(null);
          }

          setLoading(false);
        });

        return () => {
          isMounted = false;
          subscription.unsubscribe();
        };
      }, []);

      const signUp = async (email: string, password: string, displayName?: string) => {
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { display_name: displayName || email.split('@')[0] },
            },
          });

          if (error) return { error, user: null };
          return { error: null, user: data.user };
        } catch (err) {
          return { error: err as AuthError, user: null };
        }
      };

      const signIn = async (email: string, password: string) => {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) return { error };
          return { error: null };
        } catch (err) {
          return { error: err as AuthError };
        }
      };

      const signOut = async () => {
        await supabase.auth.signOut();
      };

      const resetPassword = async (email: string) => {
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(email);
          return { error: error || null };
        } catch (err) {
          return { error: err as AuthError };
        }
      };

      const refreshProfile = async () => {
        if (user) await ensureProfile(user);
      };

      return (
        <AuthContext.Provider value={{ user, session, profile, loading, signUp, signIn, signOut, resetPassword, refreshProfile }}>
          {children}
        </AuthContext.Provider>
      );
    }

    export function useAuth() {
      const context = useContext(AuthContext);
      if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
      }
      return context;
    }
