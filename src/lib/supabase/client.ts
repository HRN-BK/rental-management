import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Use placeholder values that won't crash the app
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
  
  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  )
}

// For client components
export const supabase = createClient()

// Helper to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return url && key && !url.includes('your-') && !key.includes('your-') && !url.includes('placeholder')
}
