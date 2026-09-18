import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/integrations/supabase/client'
import type { User, Session } from '@supabase/supabase-js'

type Role = 'customer' | 'support_agent' | 'manager' | 'admin'

type AuthContextType = {
  user: User | null
  session: Session | null
  role: Role | null
  customerId: string | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, role: Role) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

const DEMO_ACCOUNTS: Record<string, { password: string; role: Role; customer_id?: string }> = {
  'priya@demo.com': { password: 'demo1234', role: 'customer', customer_id: 'CUST-1001' },
  'arjun@demo.com': { password: 'demo1234', role: 'customer', customer_id: 'CUST-1002' },
  'agent@demo.com': { password: 'demo1234', role: 'support_agent' },
  'manager@demo.com': { password: 'demo1234', role: 'manager' },
  'admin@demo.com': { password: 'demo1234', role: 'admin' },
}

function resolveRole(user: User | null): Role | null {
  if (!user) return null
  const email = user.email ?? ''
  const metadataRole = user.user_metadata?.role
  if (metadataRole === 'support_agent' || metadataRole === 'manager' || metadataRole === 'admin') return metadataRole
  return DEMO_ACCOUNTS[email]?.role ?? 'customer'
}

async function resolveCustomerId(user: User | null): Promise<string | null> {
  if (!user) return null
  const email = user.email ?? ''
  const metadataCustomerId = user.user_metadata?.customer_id
  if (metadataCustomerId) return metadataCustomerId
  if (DEMO_ACCOUNTS[email]?.customer_id) return DEMO_ACCOUNTS[email].customer_id

  try {
    const { data, error } = await supabase.functions.invoke('resolvesphere-engine', {
      body: { action: 'get_or_create_customer', auth_user_id: user.id, email, name: user.user_metadata?.name }
    })
    if (error || !data?.ok) return null
    return data.customer_id
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [role, setRole] = useState<Role | null>(null)
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setRole(resolveRole(session?.user ?? null))
      setCustomerId(await resolveCustomerId(session?.user ?? null))
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setRole(resolveRole(session?.user ?? null))
      setCustomerId(await resolveCustomerId(session?.user ?? null))
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signUp = async (email: string, password: string, role: Role) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role } }
    })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const value = { user, session, role, customerId, loading, signIn, signUp, signOut }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export function getUserRole(user: User | null): Role | null {
  if (!user) return null
  const email = user.email ?? ''
  const metadataRole = user.user_metadata?.role
  if (metadataRole === 'support_agent' || metadataRole === 'manager') return metadataRole
  return DEMO_ACCOUNTS[email]?.role ?? 'customer'
}

export const demoAccounts = DEMO_ACCOUNTS
