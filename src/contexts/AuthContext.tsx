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
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: any } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      console.log('Auth state change:', event, session?.user?.email, 'Session:', !!session);
      
      // Handle password recovery - redirect to reset password page
      if (event === 'PASSWORD_RECOVERY') {
        console.log('PASSWORD_RECOVERY event detected, redirecting to reset password page');
        
        // Set a flag to indicate we're in password recovery mode
        sessionStorage.setItem('isPasswordRecovery', 'true');
        
        window.history.pushState({}, '', '/reset-password');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
      
      // Handle SIGNED_IN event with email validation for OAuth
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('SIGNED_IN event detected, validating email:', session.user.email);
        console.log('User app_metadata:', session.user.app_metadata);
        console.log('DEPLOYMENT CHECK: Auth validation code is active');
        
        // Check if this is an OAuth sign-in (has provider metadata)
        const isOAuthSignIn = session.user.app_metadata?.provider === 'google' || 
                             session.user.app_metadata?.provider === 'microsoft';
        
        console.log('Is OAuth sign-in:', isOAuthSignIn);
        
        // For now, validate ALL sign-ins to ensure email validation works
        // TODO: Can be optimized later to only validate OAuth sign-ins
        console.log('Validating email for all sign-ins');
        
        // Validate email with edge function
        try {
          const response = await fetch(
            'https://ujsnnvdbujguiejhxuds.supabase.co/functions/v1/validate-harvard-email',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({ email: session.user.email }),
            }
          );

          const validation = await response.json();
          console.log('Email validation result:', validation);

          if (!validation.valid) {
            console.log('Invalid email detected, signing out user');
            // Sign out the non-Harvard user
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            setLoading(false);
            return;
          }
        } catch (error) {
          console.error('Error validating email:', error);
          // On error, sign out to be safe
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }
        
        // Email is valid (or not OAuth), proceed normally
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
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    return { error }
  }

  const signInWithMicrosoft = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'microsoft',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    return { error }
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
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
