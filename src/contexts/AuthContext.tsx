import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: AuthError | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signInWithGoogle: () => Promise<{ error: AuthError | null }>
  signInWithMicrosoft: () => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
  updatePassword: (password: string) => Promise<{ error: AuthError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session - with a delay to allow URL parameter processing
    const initializeAuth = async () => {
      try {
        // Wait a moment for Supabase to process any URL parameters (like password reset tokens)
        await new Promise(resolve => setTimeout(resolve, 50));
        
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('AuthContext: Initial session check:', { 
          hasSession: !!session, 
          error: error?.message,
          userEmail: session?.user?.email 
        });
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      } catch (err) {
        console.error('AuthContext: Error getting initial session:', err);
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      console.log('Auth state change:', event, session?.user?.email, 'Session:', !!session);
      
      // Handle password recovery - redirect to reset password page
      if (event === 'PASSWORD_RECOVERY') {
        console.log('PASSWORD_RECOVERY event detected, redirecting to reset password page');
        console.log('PASSWORD_RECOVERY session:', !!session);
        
        // Set a flag to indicate we're in password recovery mode
        sessionStorage.setItem('isPasswordRecovery', 'true');
        
        // Update session state for password recovery
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        window.history.pushState({}, '', '/reset-password');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
      
      // Handle SIGNED_IN event
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('SIGNED_IN event detected, user:', session.user.email);
        setSession(session);
        setUser(session.user);
        setLoading(false);
        sessionStorage.setItem('isFreshLogin', 'true');
      } else {
        // For all other events, update session and user normally
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, metadata?: any) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })
    return { error }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        console.error('Google OAuth error:', error);
        // Provide more specific error messages
        if (error.message.includes('access_denied')) {
          return { error: { ...error, message: 'Google login was cancelled or denied. Please try again.' } };
        } else if (error.message.includes('popup_closed')) {
          return { error: { ...error, message: 'Google login popup was closed. Please try again.' } };
        } else if (error.message.includes('network')) {
          return { error: { ...error, message: 'Network error during Google login. Please check your connection and try again.' } };
        } else {
          return { error: { ...error, message: 'Google login failed. Please try again or use email/password.' } };
        }
      }
      
      return { error: null }
    } catch (err) {
      console.error('Google OAuth exception:', err);
      return { error: { message: 'An unexpected error occurred during Google login. Please try again.' } }
    }
  }

  const signInWithMicrosoft = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'microsoft',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        console.error('Microsoft OAuth error:', error);
        // Provide more specific error messages
        if (error.message.includes('access_denied')) {
          return { error: { ...error, message: 'Microsoft login was cancelled or denied. Please try again.' } };
        } else if (error.message.includes('popup_closed')) {
          return { error: { ...error, message: 'Microsoft login popup was closed. Please try again.' } };
        } else if (error.message.includes('network')) {
          return { error: { ...error, message: 'Network error during Microsoft login. Please check your connection and try again.' } };
        } else {
          return { error: { ...error, message: 'Microsoft login failed. Please try again or use email/password.' } };
        }
      }
      
      return { error: null }
    } catch (err) {
      console.error('Microsoft OAuth exception:', err);
      return { error: { message: 'An unexpected error occurred during Microsoft login. Please try again.' } }
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    return { error }
  }

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({
      password: password
    })
    return { error }
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithMicrosoft,
    signOut,
    resetPassword,
    updatePassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
