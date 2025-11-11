'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '../lib/supabase/client'
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js'

type AuthContextType = {
  user: User | null
  session: Session | null
  loading: boolean
  isNewUser: boolean
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string, options?: any) => Promise<any>
  signOut: () => Promise<any>
  signInWithProvider: (provider: 'github' | 'google') => Promise<any>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isNewUser, setIsNewUser] = useState(false)
  
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        setSession(session)
        setUser(session?.user ?? null)
        
        // Check if this is a new user (first time signing in)
        if (event === 'SIGNED_IN' && session?.user) {
          // Check if user has any capsules to determine if they're new
          // For now, we'll use a simple heuristic based on user creation time
          const userCreatedAt = new Date(session.user.created_at)
          const now = new Date()
          const timeDiff = now.getTime() - userCreatedAt.getTime()
          const isVeryNew = timeDiff < 60000 // Less than 1 minute old = new user
          setIsNewUser(isVeryNew)
        } else if (event === 'SIGNED_OUT') {
          setIsNewUser(false)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signUp = async (email: string, password: string, options?: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options,
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const signInWithProvider = async (provider: 'github' | 'google') => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { data, error }
  }

  const value = {
    user,
    session,
    loading,
    isNewUser,
    signIn,
    signUp,
    signOut,
    signInWithProvider,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}