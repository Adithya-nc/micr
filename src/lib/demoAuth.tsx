import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type DemoRole = 'customer' | 'support_agent' | 'manager' | 'admin'
export type PageKey = 'command-center' | 'active-case' | 'escalations' | 'approvals' | 'radar' | 'testing' | 'status'

const STORAGE_KEY = 'resolvesphere-demo-role'

export const roleLabels: Record<DemoRole, string> = {
  customer: 'Customer',
  support_agent: 'Support Agent',
  manager: 'Manager',
  admin: 'Admin',
}

const pageAccess: Record<PageKey, DemoRole[]> = {
  'command-center': ['support_agent', 'manager', 'admin'],
  'active-case': ['support_agent', 'manager', 'admin'],
  escalations: ['support_agent', 'manager', 'admin'],
  approvals: ['support_agent', 'manager', 'admin'],
  radar: ['manager', 'admin'],
  testing: ['admin'],
  status: ['admin'],
}

export function canAccess(role: DemoRole, page: PageKey): boolean {
  return pageAccess[page].includes(role)
}

const DemoAuthContext = createContext<{ role: DemoRole; setRole: (role: DemoRole) => void } | null>(null)

export function DemoAuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<DemoRole>(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null
    return stored === 'customer' || stored === 'support_agent' || stored === 'manager' || stored === 'admin' ? stored : 'customer'
  })
  useEffect(() => { window.localStorage.setItem(STORAGE_KEY, role) }, [role])
  const value = useMemo(() => ({ role, setRole }), [role])
  return <DemoAuthContext.Provider value={value}>{children}</DemoAuthContext.Provider>
}

export function useDemoAuth() {
  const context = useContext(DemoAuthContext)
  if (!context) throw new Error('useDemoAuth must be used within DemoAuthProvider')
  return context
}
