import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Add console logs to verify environment variables are being picked up (can be removed in production)
// console.log('Supabase URL from env:', supabaseUrl);
// console.log('Supabase Anon Key from env:', supabaseAnonKey ? 'Loaded' : 'Not Loaded'); // Avoid logging the key itself

// Create a singleton Supabase client to avoid multiple instances
let supabase: any

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables missing, using mock client');
  // Create a mock client that doesn't crash the app
  supabase = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signUp: () => Promise.resolve({ error: null }),
      signInWithPassword: () => Promise.resolve({ error: null }),
      signInWithOAuth: () => Promise.resolve({ error: null }),
      signOut: () => Promise.resolve({ error: null }),
      resetPasswordForEmail: () => Promise.resolve({ error: null })
    },
    from: () => ({
      select: () => ({ order: () => Promise.resolve({ data: [], error: null }) })
    })
  }
} else {
  // Create client with singleton pattern to prevent multiple instances
  if (!supabase) {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  }
}

export { supabase }
