import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { supabase } from '@/integrations/supabase/client'
import type { User, Session } from '@supabase/supabase-js'

export type Role =
  | 'customer'
  | 'support_agent'
  | 'manager'
  | 'admin'

type AuthContextType = {
  user: User | null
  session: Session | null
  role: Role | null
  customerId: string | null
  loading: boolean
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: Error | null }>
  signUp: (
    email: string,
    password: string,
    role: Role,
    name?: string
  ) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export const DEMO_ACCOUNTS: Record<
  string,
  {
    password: string
    role: Role
    customer_id?: string
  }
> = {
  'priya@demo.com': {
    password: 'demo1234',
    role: 'customer',
    customer_id: 'CUST-1001',
  },

  'arjun@demo.com': {
    password: 'demo1234',
    role: 'customer',
    customer_id: 'CUST-1002',
  },

  'agent@demo.com': {
    password: 'demo1234',
    role: 'support_agent',
  },

  'manager@demo.com': {
    password: 'demo1234',
    role: 'manager',
  },

  'admin@demo.com': {
    password: 'demo1234',
    role: 'admin',
  },
}

function resolveRole(user: User | null): Role | null {
  if (!user) return null

  const email = user.email ?? ''

  const metadataRole = user.user_metadata?.role

  if (
    metadataRole === 'support_agent' ||
    metadataRole === 'manager' ||
    metadataRole === 'admin' ||
    metadataRole === 'customer'
  ) {
    return metadataRole
  }

  return DEMO_ACCOUNTS[email]?.role ?? 'customer'
}

async function resolveCustomerId(
  user: User | null
): Promise<string | null> {
  if (!user) return null

  const email = user.email ?? ''

  const metadataCustomerId =
    user.user_metadata?.customer_id

  if (metadataCustomerId) {
    return metadataCustomerId
  }

  if (DEMO_ACCOUNTS[email]?.customer_id) {
    return DEMO_ACCOUNTS[email].customer_id
  }

  try {
    const { data, error } =
      await supabase.functions.invoke(
        'resolvesphere-engine',
        {
          body: {
            action: 'get_or_create_customer',
            auth_user_id: user.id,
            email,
            name: user.user_metadata?.name,
          },
        }
      )

    if (error || !data?.ok) {
      return null
    }

    return data.customer_id ?? null
  } catch {
    return null
  }
}

export function AuthProvider({
  children,
}: {
  children: ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] =
    useState<Session | null>(null)

  const [role, setRole] =
    useState<Role | null>(null)

  const [customerId, setCustomerId] =
    useState<string | null>(null)

  const [loading, setLoading] =
    useState(true)

  useEffect(() => {
    let mounted = true

    const initialize = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!mounted) return

        const currentUser =
          session?.user ?? null

        setSession(session)
        setUser(currentUser)
        setRole(resolveRole(currentUser))

        const customer =
          await resolveCustomerId(currentUser)

        if (mounted) {
          setCustomerId(customer)
        }
      } catch (error) {
        console.error(
          'Authentication initialization failed:',
          error
        )
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initialize()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return

        const currentUser =
          session?.user ?? null

        setSession(session)
        setUser(currentUser)
        setRole(resolveRole(currentUser))

        const customer =
          await resolveCustomerId(currentUser)

        if (mounted) {
          setCustomerId(customer)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (
    email: string,
    password: string
  ) => {
    try {
      const { error } =
        await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        })

      return { error }
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? error
            : new Error('Unable to sign in'),
      }
    }
  }

  const signUp = async (
    email: string,
    password: string,
    role: Role,
    name?: string
  ) => {
    try {
      const { error } =
        await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: {
              role,
              name: name?.trim() || undefined,
            },
          },
        })

      return { error }
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? error
            : new Error('Unable to create account'),
      }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        customerId,
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth must be used within AuthProvider'
    )
  }

  return context
}

export function getUserRole(
  user: User | null
): Role | null {
  return resolveRole(user)
}

export const demoAccounts = DEMO_ACCOUNTS