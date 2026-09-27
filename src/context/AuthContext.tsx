'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthUser, getAuthUser, setAuthUser, clearAuthUser, UserRole } from '@/lib/auth';
import { supabase } from '@/lib/supabase/client';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (user: AuthUser) => void;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  login: () => {},
  logout: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = getAuthUser();
    if (stored?.role === 'officer' && stored.approval_status && stored.approval_status !== 'approved') {
      clearAuthUser();
      return null;
    }
    return stored;
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = useCallback(async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();

      if (data && !error) {
        if (data.role === 'officer' && data.approval_status && data.approval_status !== 'approved') {
          clearAuthUser();
          setUser(null);
          return;
        }

        const authUser: AuthUser = {
          id: data.id,
          email: data.email || email,
          name: data.full_name || email.split('@')[0],
          role: (data.role as UserRole) || 'citizen',
          city: data.city || 'Bengaluru',
          department_id: data.department_id,
          approval_status: data.approval_status || 'approved',
        };
        setAuthUser(authUser);
        setUser(authUser);
      } else {
        // Fallback to local stored user if database query fails or hasn't created profile yet
        const stored = getAuthUser();
        if (stored?.role === 'officer' && stored.approval_status && stored.approval_status !== 'approved') {
          clearAuthUser();
          setUser(null);
        } else if (stored) {
          setUser(stored);
        }
      }
    } catch {
      const stored = getAuthUser();
      if (stored?.role === 'officer' && stored.approval_status && stored.approval_status !== 'approved') {
        clearAuthUser();
        setUser(null);
      } else if (stored) {
        setUser(stored);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) {
      await fetchUserProfile(session.user.id, session.user.email || '');
    }
  }, [fetchUserProfile]);

  useEffect(() => {
    // Listen to Supabase Auth State Changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await fetchUserProfile(session.user.id, session.user.email || '');
      } else {
        clearAuthUser();
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  const login = useCallback((authUser: AuthUser) => {
    setAuthUser(authUser);
    setUser(authUser);
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    clearAuthUser();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
