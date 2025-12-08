import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  onlineUsers: Set<string>
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
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    // Only clear animation flag if it's stale (e.g., page reload long after login)
    const maybeClearAnimationFlag = () => {
      const timestamp = sessionStorage.getItem('playLoginAnimationSetAt');
      if (!timestamp) {
        sessionStorage.removeItem('playLoginAnimation');
        return;
      }

      const age = Date.now() - parseInt(timestamp, 10);
      if (Number.isNaN(age) || age > 60000) {
        sessionStorage.removeItem('playLoginAnimation');
        sessionStorage.removeItem('playLoginAnimationSetAt');
      }
    };

    maybeClearAnimationFlag();

    // Get initial session - with a delay to allow URL parameter processing
    const initializeAuth = async () => {
      try {
        // Wait a moment for Supabase to process any URL parameters (like password reset tokens)
        await new Promise(resolve => setTimeout(resolve, 50));
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      } catch (err) {
        console.error('AuthContext: Error getting initial session:', err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      // Handle password recovery - redirect to reset password page
      if (event === 'PASSWORD_RECOVERY') {
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
        setSession(session);
        setUser(session.user);
        setLoading(false);
      } else {
        // For all other events, update session and user normally
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Global presence tracking for all logged-in users
  useEffect(() => {
    if (!user) {
      // Clean up presence tracking when user logs out
      if (presenceChannelRef.current) {
        presenceChannelRef.current.untrack();
        supabase.removeChannel(presenceChannelRef.current);
        presenceChannelRef.current = null;
      }
      setOnlineUsers(new Set());
      return;
    }

    let presenceChannel: ReturnType<typeof supabase.channel> | null = null;

    const setupPresence = async () => {
      // Create a global presence channel for all users
      presenceChannel = supabase.channel('online-users', {
        config: {
          presence: {
            key: user.id,
          },
        },
      });

      // Track current user as online
      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel?.presenceState();
          if (!state) return;
          
          const onlineUserIds = new Set<string>();
          
          // Extract user IDs from presence state
          Object.values(state).forEach((presences) => {
            const presenceArray = presences as Array<{ user_id?: string }>;
            if (Array.isArray(presenceArray)) {
              presenceArray.forEach((presence) => {
                if (presence?.user_id) {
                  onlineUserIds.add(presence.user_id);
                }
              });
            }
          });
          
          setOnlineUsers(onlineUserIds);
        })
        .on('presence', { event: 'join' }, ({ newPresences }: { newPresences: Array<{ user_id?: string }> }) => {
          setOnlineUsers((prev) => {
            const updated = new Set(prev);
            if (Array.isArray(newPresences)) {
              newPresences.forEach((presence: { user_id?: string }) => {
                if (presence?.user_id) {
                  updated.add(presence.user_id);
                }
              });
            }
            return updated;
          });
        })
        .on('presence', { event: 'leave' }, ({ leftPresences }: { leftPresences: Array<{ user_id?: string }> }) => {
          setOnlineUsers((prev) => {
            const updated = new Set(prev);
            if (Array.isArray(leftPresences)) {
              leftPresences.forEach((presence: { user_id?: string }) => {
                if (presence?.user_id) {
                  updated.delete(presence.user_id);
                }
              });
            }
            return updated;
          });
        })
        .subscribe(async (status: string) => {
          if (status === 'SUBSCRIBED' && presenceChannel) {
            // Track current user as online
            await presenceChannel.track({
              user_id: user.id,
              online_at: new Date().toISOString(),
            });
            presenceChannelRef.current = presenceChannel;
          }
        });
    };

    setupPresence();

    // Cleanup function
    return () => {
      if (presenceChannelRef.current) {
        presenceChannelRef.current.untrack();
        supabase.removeChannel(presenceChannelRef.current);
        presenceChannelRef.current = null;
      }
    };
  }, [user])

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

    if (!error) {
      sessionStorage.setItem('playLoginAnimation', 'true');
      sessionStorage.setItem('playLoginAnimationSetAt', Date.now().toString());
    }

    return { error }
  }

  const signInWithGoogle = async () => {
    try {
      sessionStorage.setItem('playLoginAnimation', 'true');
      sessionStorage.setItem('playLoginAnimationSetAt', Date.now().toString());
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        console.error('Google OAuth error:', error?.message || 'Unknown error');
        sessionStorage.removeItem('playLoginAnimation');
        sessionStorage.removeItem('playLoginAnimationSetAt');
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
      console.error('Google OAuth exception:', err instanceof Error ? err.message : 'Unknown error');
      sessionStorage.removeItem('playLoginAnimation');
      sessionStorage.removeItem('playLoginAnimationSetAt');
      return { error: { message: 'An unexpected error occurred during Google login. Please try again.' } }
    }
  }

  const signInWithMicrosoft = async () => {
    try {
      sessionStorage.setItem('playLoginAnimation', 'true');
      sessionStorage.setItem('playLoginAnimationSetAt', Date.now().toString());
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'microsoft',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        console.error('Microsoft OAuth error:', error?.message || 'Unknown error');
        sessionStorage.removeItem('playLoginAnimation');
        sessionStorage.removeItem('playLoginAnimationSetAt');
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
      console.error('Microsoft OAuth exception:', err instanceof Error ? err.message : 'Unknown error');
      sessionStorage.removeItem('playLoginAnimation');
      sessionStorage.removeItem('playLoginAnimationSetAt');
      return { error: { message: 'An unexpected error occurred during Microsoft login. Please try again.' } }
    }
  }

  const signOut = async () => {
    sessionStorage.removeItem('playLoginAnimation');
    sessionStorage.removeItem('playLoginAnimationSetAt');
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
    onlineUsers,
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
