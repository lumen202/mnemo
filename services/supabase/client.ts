import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder_key'

// SSR-safe storage: use real localStorage in the browser, no-op on the server.
const memStore = new Map<string, string>()
const noOpStorage = {
  getItem:    (key: string) => memStore.get(key) ?? null,
  setItem:    (key: string, value: string) => { memStore.set(key, value) },
  removeItem: (key: string) => { memStore.delete(key) },
}
const storage = typeof window !== 'undefined' ? window.localStorage : noOpStorage

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: false,
    autoRefreshToken: true,
    storage,
  },
})

export default supabase
