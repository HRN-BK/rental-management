import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database'

export const createClientSupabaseAuth = () =>
  createClientComponentClient<Database>()

// Auth types
export interface AuthUser {
  id: string
  email: string
  email_confirmed_at?: string
  phone?: string
  created_at: string
  updated_at: string
  user_metadata?: {
    full_name?: string
    avatar_url?: string
  }
  app_metadata?: {
    provider?: string
    providers?: string[]
  }
}

export interface SignUpCredentials {
  email: string
  password: string
  options?: {
    data?: {
      full_name?: string
      phone?: string
    }
  }
}

export interface SignInCredentials {
  email: string
  password: string
}

export interface ResetPasswordCredentials {
  email: string
}

// Auth helper functions
export class AuthService {
  private supabase = createClientSupabaseAuth()

  async signUp({ email, password, options }: SignUpCredentials) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: options?.data || {},
      },
    })

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  async signIn({ email, password }: SignInCredentials) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut()

    if (error) {
      throw new Error(error.message)
    }
  }

  async resetPassword({ email }: ResetPasswordCredentials) {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) {
      throw new Error(error.message)
    }
  }

  async updateProfile(updates: {
    email?: string
    password?: string
    data?: {
      full_name?: string
      phone?: string
      avatar_url?: string
    }
  }) {
    const { data, error } = await this.supabase.auth.updateUser(updates)

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  async updatePassword({ password }: { password: string }) {
    const { data, error } = await this.supabase.auth.updateUser({ password })

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  async getSession() {
    const {
      data: { session },
      error,
    } = await this.supabase.auth.getSession()

    if (error) {
      throw new Error(error.message)
    }

    return session
  }

  async getUser() {
    const {
      data: { user },
      error,
    } = await this.supabase.auth.getUser()

    if (error) {
      throw new Error(error.message)
    }

    return user
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return this.supabase.auth.onAuthStateChange(callback)
  }
}

// Export singleton instance
export const authService = new AuthService()
