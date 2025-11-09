import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabase: any

if (!supabaseUrl || !supabaseAnonKey) {
  supabase = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      setSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signUp: () => Promise.resolve({ error: null }),
      signInWithPassword: () => Promise.resolve({ error: null }),
      signInWithOAuth: () => Promise.resolve({ error: null }),
      signOut: () => Promise.resolve({ error: null }),
      resetPasswordForEmail: () => Promise.resolve({ error: null }),
      updateUser: () => Promise.resolve({ error: null }),
      verifyOtp: () => Promise.resolve({ data: { session: null }, error: null })
    },
    from: () => ({
      select: () => ({ order: () => Promise.resolve({ data: [], error: null }) })
    })
  }
} else {
  if (!supabase) {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
  }
}

export { supabase }
