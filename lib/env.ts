export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

export function isSupabaseConfigured(): boolean {
  return !!SUPABASE_URL && !SUPABASE_URL.includes('placeholder')
}

export const IS_DEV = process.env.NODE_ENV === 'development'
