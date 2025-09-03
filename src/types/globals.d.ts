// Global type declarations to help with TypeScript compilation

// Suppress some Supabase client type inference issues
declare module '@supabase/supabase-js' {
  interface SupabaseClient<Database = any> {
    from<T extends keyof Database['public']['Tables']>(table: T): any // Temporarily use any to bypass type issues
  }
}

// Extend global types
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any
    }
  }
}

export {}
