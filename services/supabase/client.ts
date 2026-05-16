import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder_key'

// No-op storage for SSR / environments without a real localStorage.
const memStore = new Map<string, string>()
const noOpStorage = {
  getItem:    (key: string) => memStore.get(key) ?? null,
  setItem:    (key: string, value: string) => { memStore.set(key, value) },
  removeItem: (key: string) => { memStore.delete(key) },
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    detectSessionInUrl: false,
    autoRefreshToken: false,
    storage: noOpStorage,
  },
})

export default supabase
