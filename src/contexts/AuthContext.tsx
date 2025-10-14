import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  email: string;
  phasion_name: string;
  full_name?: string;
  role: 'customer' | 'designer' | 'admin';
  bio?: string;
  avatar_url?: string;
  solana_wallet?: string;
  location?: string;
  website?: string;
  social_links?: Record<string, string>;
  is_verified: boolean;
  body_measurements?: string;
  kyc_completed?: boolean;
  kyc_status?: 'pending' | 'approved' | 'rejected' | 'under_review';
  kyc_documents?: Record<string, any>;
  kyc_notes?: string;
  kyc_verified_at?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: any) => Promise<any>;
  logout: () => void;
  updateProfile: (profileData: Partial<Profile>) => Promise<void>;
  fetchProfile: () => Promise<Profile | null>;
  resendVerification: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('AuthContext: Starting initial session check...');
    
    // Get initial session without timeout
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('AuthContext: Error getting session:', error);
        console.error('AuthContext: Error details:', {
          message: error.message,
          status: error.status,
          code: error.code
        });
        setUser(null);
        setProfile(null);
        setIsLoading(false);
        return;
      }
      
      console.log('AuthContext: Session check successful:', {
        hasSession: !!session,
        userId: session?.user?.id,
        email: session?.user?.email,
        emailConfirmed: session?.user?.email_confirmed_at
      });
      
      setUser(session?.user ?? null);
      console.log('AuthContext: Session check completed, setting loading to false');
      setIsLoading(false);
    }).catch((error) => {
      console.error('AuthContext: Session check failed:', error);
      console.error('AuthContext: Error type:', error.constructor.name);
      console.error('AuthContext: Error message:', error.message);
      console.log('AuthContext: Proceeding without session - user will need to login');
      setUser(null);
      setProfile(null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        
        // Handle sign out events
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setIsLoading(false);
          return;
        }
        
        setUser(session?.user ?? null);
        if (session?.user) {
          console.log('AuthContext: User authenticated, setting profile to null (will be fetched when needed)');
          setProfile(null);
        } else {
          setProfile(null);
          setIsLoading(false);
        }
      }
    );

    // Fallback: ensure loading is set to false after 10 seconds
    const fallbackTimeout = setTimeout(() => {
      console.log('AuthContext: Fallback timeout - setting isLoading to false');
      setIsLoading(false);
    }, 10000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(fallbackTimeout);
    };
  }, []);



  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    setUser(data.user);
  };

  const signup = async (userData: any) => {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          phasion_name: userData.phasionName,
          full_name: userData.fullName,
          role: userData.role,
          solana_wallet: userData.solanaWallet,
        },
        emailRedirectTo: `${window.location.origin}/verify-email`
      }
    });
    
    if (error) throw error;
    return { message: 'Account created successfully. Please check your email to verify your account.' };
  };

  const logout = async () => {
    console.log('AuthContext: Starting logout...');
    
    // Clear local state immediately
    setUser(null);
    setProfile(null);
    
    // Try to clear the session manually
    try {
      // Clear all Supabase-related localStorage items
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('sb-'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (e) {
      console.log('Could not clear localStorage token');
    }
    
    console.log('AuthContext: Logout completed');
  };

  // Utility function to completely clear all auth data
  const clearAllAuthData = () => {
    console.log('AuthContext: Clearing all auth data...');
    setUser(null);
    setProfile(null);
    
    // Clear all localStorage items related to Supabase
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('sb-'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log('AuthContext: Cleared localStorage items:', keysToRemove);
    } catch (e) {
      console.log('AuthContext: Could not clear localStorage items');
    }
    
    // Clear sessionStorage as well
    try {
      sessionStorage.clear();
    } catch (e) {
      console.log('AuthContext: Could not clear sessionStorage');
    }
  };

  const updateProfile = async (profileData: Partial<Profile>) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    setProfile(data);
  };

  const fetchProfile = async () => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      setProfile(data);
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  const resendVerification = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/verify-email`
      }
    });
    
    if (error) throw error;
  };

  const value: AuthContextType = {
    user,
    profile,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout,
    updateProfile,
    fetchProfile,
    resendVerification,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};